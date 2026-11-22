-- «sitata.uz» — seriya muzlatish va haftalik ligalar. ballar.sql dan keyin ishga tushiriladi.

-- ===== 1. Kunlik seriya va muzlatish =====
-- Seriya = ketma-ket «Kim aytgan?» o'ynalgan kunlar. Har kim 1 ta muzlatish bilan boshlaydi,
-- har 7 kunlik seriya uchun +1 (ko'pi bilan 2). O'tkazib yuborilgan kunni muzlatish o'zi yopadi.
-- Hammasi o'yinlar tarixidan hisoblanadi — alohida jadval yo'q, aldab bo'lmaydi.
create or replace function public.kunlik_seriya(p uuid)
returns table (joriy int, eng_uzun int, muzlatish int, muzlatilgan date[])
language plpgsql stable security definer set search_path = '' as $$
declare
  bugun int := public.bugungi_kun();
  kunlar int[]; boshi int; k int; s int := 0; eng int := 0; m int := 1; muz date[] := '{}';
begin
  select array_agg(distinct o.kun order by o.kun) into kunlar from public.oyinlar o where o.profil_id = p;
  if kunlar is null then
    joriy := 0; eng_uzun := 0; muzlatish := 1; muzlatilgan := muz; return next; return;
  end if;
  boshi := kunlar[1];
  for k in boshi..bugun loop
    if k = any (kunlar) then
      s := s + 1; eng := greatest(eng, s);
      if s % 7 = 0 then m := least(2, m + 1); end if;
    elsif k < bugun then                      -- bugun hali tugamagan — seriyani uzmaydi
      if s > 0 and m > 0 then m := m - 1; muz := muz || (date '1970-01-01' + k);
      else s := 0; end if;
    end if;
  end loop;
  joriy := s; eng_uzun := eng; muzlatish := m; muzlatilgan := muz;
  return next;
end;
$$;

-- ===== 2. Haftalik ligalar =====
-- 0 Varaq, 1 Daftar, 2 Risola, 3 Kitob, 4 Kutubxona, 5 Xazina
create table if not exists public.liga_azolari (
  profil_id   uuid primary key references public.profillar on delete cascade,
  liga        int not null default 0 check (liga between 0 and 5),
  yangilangan timestamptz not null default now()
);
create table if not exists public.liga_tarixi (
  hafta     date not null,
  profil_id uuid not null references public.profillar on delete cascade,
  liga      int  not null,
  xp        int  not null,
  orin      int  not null,
  natija    text not null check (natija in ('kotarildi', 'tushdi', 'qoldi')),
  primary key (hafta, profil_id)
);
alter table public.liga_azolari enable row level security;
alter table public.liga_tarixi enable row level security;
create policy "hamma ko'radi" on public.liga_azolari for select using (true);
create policy "hamma ko'radi" on public.liga_tarixi for select using (true);
grant select on public.liga_azolari, public.liga_tarixi to anon, authenticated;

-- Haftalik XP: o'sha haftadagi barcha ball beruvchi voqealar (jarimasiz)
create or replace function public.hafta_xp(p uuid, h date) returns int
language sql stable security definer set search_path = '' as $$
  select coalesce(sum(e.ball), 0)::int from public.ball_voqealari(p) e where e.sana >= h and e.sana < h + 7;
$$;

-- Profil ligasidagi joriy hafta jadvali
create or replace function public.liga_jadvali(p uuid)
returns table (kod text, ism text, taxallus text, xp int, orin int, liga int, meniki boolean)
language sql stable security definer set search_path = '' as $$
  with l as (select coalesce((select a.liga from public.liga_azolari a where a.profil_id = p), 0) as liga),
       h as (select date_trunc('week', (now() at time zone 'Asia/Tashkent'))::date as hafta),
       a as (
         select pr.id, pr.kod, pr.ism, pr.taxallus, public.hafta_xp(pr.id, (select hafta from h)) as xp
         from public.profillar pr
         left join public.liga_azolari la on la.profil_id = pr.id
         where coalesce(la.liga, 0) = (select liga from l)
       )
  select a.kod, a.ism, a.taxallus, a.xp,
         (row_number() over (order by a.xp desc, a.ism))::int as orin,
         (select liga from l), a.id = p
  from a order by a.xp desc, a.ism;
$$;

-- Haftani yakunlash: dushanba 00:05 (Toshkent) da cron chaqiradi. Qayta chaqirilsa — hech narsa qilmaydi.
create or replace function public.liga_haftani_yakunla() returns void
language plpgsql security definer set search_path = '' as $$
declare
  h_boshi date := date_trunc('week', (now() at time zone 'Asia/Tashkent'))::date - 7;   -- hozirgina tugagan hafta
  nomlar text[] := array['Varaq', 'Daftar', 'Risola', 'Kitob', 'Kutubxona', 'Xazina'];
  l int; n int; yuqori int; quyi int; r record; natija text; yangi int;
begin
  if exists (select 1 from public.liga_tarixi t where t.hafta = h_boshi) then return; end if;
  for l in 0..5 loop
    select count(*) into n
      from public.profillar pr left join public.liga_azolari la on la.profil_id = pr.id
      where coalesce(la.liga, 0) = l and pr.yaratilgan < h_boshi + 7
        and not exists (select 1 from public.liga_tarixi t where t.hafta = h_boshi and t.profil_id = pr.id);
    if n = 0 then continue; end if;
    yuqori := case when l < 5 then greatest(1, floor(n * 0.2)::int) else 0 end;
    quyi   := case when l > 0 and n >= 5 then floor(n * 0.2)::int else 0 end;
    for r in
      select m.id, m.xp, (row_number() over (order by m.xp desc))::int as orin
      from (
        select pr.id, public.hafta_xp(pr.id, h_boshi) as xp
        from public.profillar pr left join public.liga_azolari la on la.profil_id = pr.id
        where coalesce(la.liga, 0) = l and pr.yaratilgan < h_boshi + 7
          and not exists (select 1 from public.liga_tarixi t where t.hafta = h_boshi and t.profil_id = pr.id)   -- shu hafta allaqachon ko'chirilganlar
      ) m
      order by orin
    loop
      if l = 0 and r.xp = 0 then continue; end if;          -- eng quyi ligadagi faol bo'lmaganlarni yozmaymiz
      natija := 'qoldi'; yangi := l;
      if r.orin <= yuqori and r.xp > 0 then natija := 'kotarildi'; yangi := l + 1;
      elsif l > 0 and (r.xp = 0 or r.orin > n - quyi) then natija := 'tushdi'; yangi := l - 1;
      end if;
      insert into public.liga_tarixi values (h_boshi, r.id, l, r.xp, r.orin, natija);
      insert into public.liga_azolari (profil_id, liga, yangilangan) values (r.id, yangi, now())
        on conflict (profil_id) do update set liga = excluded.liga, yangilangan = now();
      if natija = 'kotarildi' then
        insert into public.bildirishnomalar (kimga, matn, havola)
        values (r.id, '🏆 Tabriklaymiz! ' || r.orin || '-o''rin bilan «' || nomlar[yangi + 1] || '» ligasiga ko''tarildingiz', '#liga');
      elsif natija = 'tushdi' then
        insert into public.bildirishnomalar (kimga, matn, havola)
        values (r.id, 'O''tgan hafta «' || nomlar[yangi + 1] || '» ligasiga tushdingiz. Bu hafta qaytib chiqing!', '#liga');
      end if;
    end loop;
  end loop;
end;
$$;

revoke execute on function public.liga_haftani_yakunla() from public, anon, authenticated;
grant execute on function public.kunlik_seriya(uuid), public.hafta_xp(uuid, date), public.liga_jadvali(uuid) to anon, authenticated;

-- Dushanba 00:05 Toshkent = yakshanba 19:05 UTC
select cron.schedule('sitata-liga', '5 19 * * 0', $$ select public.liga_haftani_yakunla() $$);

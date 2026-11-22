-- «sitata.uz» — Kitobdoshlar, «Birga o'qiymiz» va bildirishnomalar.
-- sozlash.sql allaqachon ishga tushirilgan bo'lishi kerak. Barcha foydalanuvchi ID'lari = profillar.id = auth.uid().

-- ===== 1. Kitobdoshlar (do'stlik takliflari) =====
create table if not exists public.kitobdoshlar (
  id      bigint generated always as identity primary key,
  kimdan  uuid not null default auth.uid() references public.profillar on delete cascade,
  kimga   uuid not null references public.profillar on delete cascade,
  holat   text not null default 'kutilmoqda' check (holat in ('kutilmoqda', 'qabul')),
  vaqt    timestamptz not null default now(),
  check (kimdan <> kimga)
);
-- Ikki kishi orasida faqat bitta yozuv (qaysi tomondan yuborilganidan qat'i nazar)
create unique index if not exists kitobdoshlar_juft on public.kitobdoshlar (least(kimdan, kimga), greatest(kimdan, kimga));

-- Ikki kishi kitobdoshmi? (qoidalar ichida ishlatiladi)
create or replace function public.kitobdoshmi(a uuid, b uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.kitobdoshlar k where k.holat = 'qabul'
                 and ((k.kimdan = a and k.kimga = b) or (k.kimdan = b and k.kimga = a)));
$$;

alter table public.kitobdoshlar enable row level security;
create policy "o'z kitobdoshliklarini ko'radi" on public.kitobdoshlar for select to authenticated
  using (auth.uid() in (kimdan, kimga));
create policy "taklif yuboradi" on public.kitobdoshlar for insert to authenticated
  with check (kimdan = auth.uid() and holat = 'kutilmoqda'
    and (select count(*) from public.kitobdoshlar t where t.kimdan = auth.uid() and t.holat = 'kutilmoqda') < 30);
create policy "kelgan taklifni qabul qiladi" on public.kitobdoshlar for update to authenticated
  using (kimga = auth.uid()) with check (kimga = auth.uid());
create policy "rad etadi yoki o'chiradi" on public.kitobdoshlar for delete to authenticated
  using (auth.uid() in (kimdan, kimga));
grant select, insert, delete on public.kitobdoshlar to authenticated;
grant update (holat) on public.kitobdoshlar to authenticated;

-- ===== 2. Birga o'qish =====
create table if not exists public.oqishlar (
  id          bigint generated always as identity primary key,
  kitob       text not null check (char_length(btrim(kitob)) between 1 and 120),
  muallif     text check (muallif is null or char_length(muallif) <= 60),
  xabar       text check (xabar is null or char_length(xabar) <= 300),
  tugash      date,
  yaratuvchi  uuid not null default auth.uid() references public.profillar on delete cascade,
  yaratilgan  timestamptz not null default now()
);

create table if not exists public.oqish_azolari (
  oqish_id    bigint not null references public.oqishlar on delete cascade,
  profil_id   uuid not null references public.profillar on delete cascade,
  holat       text not null default 'taklif' check (holat in ('taklif', 'qabul', 'rad')),
  foiz        int not null default 0 check (foiz between 0 and 100),
  izoh        text check (izoh is null or char_length(izoh) <= 200),
  yangilangan timestamptz not null default now(),
  primary key (oqish_id, profil_id)
);

-- Joriy foydalanuvchi shu o'qishda qatnashadimi (taklif qilingan yoki a'zo)?
create or replace function public.oqish_azosimi(o bigint) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.oqish_azolari a where a.oqish_id = o and a.profil_id = auth.uid())
      or exists (select 1 from public.oqishlar q where q.id = o and q.yaratuvchi = auth.uid());
$$;

alter table public.oqishlar enable row level security;
create policy "qatnashchilar ko'radi" on public.oqishlar for select to authenticated
  using (yaratuvchi = auth.uid() or public.oqish_azosimi(id));
create policy "o'qish yaratadi" on public.oqishlar for insert to authenticated
  with check (yaratuvchi = auth.uid()
    and (select count(*) from public.oqishlar t where t.yaratuvchi = auth.uid() and t.yaratilgan > now() - interval '1 day') < 20);
create policy "yaratuvchi o'chiradi" on public.oqishlar for delete to authenticated using (yaratuvchi = auth.uid());
grant select, insert, delete on public.oqishlar to authenticated;

alter table public.oqish_azolari enable row level security;
create policy "qatnashchilar ko'radi" on public.oqish_azolari for select to authenticated
  using (public.oqish_azosimi(oqish_id));
-- Yaratuvchi o'zini (qabul) va faqat kitobdoshlarini (taklif) qo'sha oladi
create policy "yaratuvchi taklif qiladi" on public.oqish_azolari for insert to authenticated
  with check (
    exists (select 1 from public.oqishlar q where q.id = oqish_id and q.yaratuvchi = auth.uid())
    and ((profil_id = auth.uid() and holat = 'qabul') or (holat = 'taklif' and public.kitobdoshmi(auth.uid(), profil_id)))
  );
create policy "o'z holatini yangilaydi" on public.oqish_azolari for update to authenticated
  using (profil_id = auth.uid()) with check (profil_id = auth.uid());
grant select, insert on public.oqish_azolari to authenticated;
grant update (holat, foiz, izoh, yangilangan) on public.oqish_azolari to authenticated;

-- ===== 3. Bildirishnomalar =====
create table if not exists public.bildirishnomalar (
  id      bigint generated always as identity primary key,
  kimga   uuid not null references public.profillar on delete cascade,
  matn    text not null,
  havola  text,
  oqildi  boolean not null default false,
  vaqt    timestamptz not null default now()
);
create index if not exists bildirishnomalar_kimga on public.bildirishnomalar (kimga, vaqt desc);
alter table public.bildirishnomalar enable row level security;
create policy "o'zinikini ko'radi" on public.bildirishnomalar for select to authenticated using (kimga = auth.uid());
create policy "o'qildi deb belgilaydi" on public.bildirishnomalar for update to authenticated
  using (kimga = auth.uid()) with check (kimga = auth.uid());
grant select on public.bildirishnomalar to authenticated;
grant update (oqildi) on public.bildirishnomalar to authenticated;

-- Bildirishnomalar faqat quyidagi triggerlar orqali yoziladi
create or replace function public.bildir_kitobdosh() returns trigger
language plpgsql security definer set search_path = '' as $$
declare kimdan_ism text; kimga_ism text; kimga_kod text;
begin
  select ism into kimdan_ism from public.profillar where id = new.kimdan;
  select ism, coalesce('#@' || taxallus, '?p=' || kod) into kimga_ism, kimga_kod from public.profillar where id = new.kimga;
  if tg_op = 'INSERT' then
    insert into public.bildirishnomalar (kimga, matn, havola)
    values (new.kimga, kimdan_ism || ' sizni kitobdosh bo''lishga taklif qildi', '#kitobdoshlar');
  elsif new.holat = 'qabul' and old.holat <> 'qabul' then
    insert into public.bildirishnomalar (kimga, matn, havola)
    values (new.kimdan, kimga_ism || ' kitobdosh bo''lish taklifingizni qabul qildi', kimga_kod);
  end if;
  return new;
end;
$$;
drop trigger if exists kitobdosh_bildir on public.kitobdoshlar;
create trigger kitobdosh_bildir after insert or update of holat on public.kitobdoshlar
  for each row execute function public.bildir_kitobdosh();

create or replace function public.bildir_oqish() returns trigger
language plpgsql security definer set search_path = '' as $$
declare q record; ism text; yaratuvchi_ism text;
begin
  select * into q from public.oqishlar where id = new.oqish_id;
  select p.ism into ism from public.profillar p where p.id = new.profil_id;
  select p.ism into yaratuvchi_ism from public.profillar p where p.id = q.yaratuvchi;
  if tg_op = 'INSERT' and new.holat = 'taklif' then
    insert into public.bildirishnomalar (kimga, matn, havola)
    values (new.profil_id, yaratuvchi_ism || ' sizni «' || q.kitob || '»ni birga o''qishga taklif qildi', '#birga/' || q.id);
  elsif tg_op = 'UPDATE' and new.holat is distinct from old.holat and new.holat in ('qabul', 'rad') and new.profil_id <> q.yaratuvchi then
    insert into public.bildirishnomalar (kimga, matn, havola)
    values (q.yaratuvchi, ism || (case when new.holat = 'qabul' then ' «' || q.kitob || '»ni birga o''qishga qo''shildi'
                                       else ' «' || q.kitob || '»ni birga o''qish taklifini rad etdi' end), '#birga/' || q.id);
  end if;
  return new;
end;
$$;
drop trigger if exists oqish_bildir on public.oqish_azolari;
create trigger oqish_bildir after insert or update of holat on public.oqish_azolari
  for each row execute function public.bildir_oqish();

revoke execute on function public.bildir_kitobdosh() from public, anon, authenticated;
revoke execute on function public.bildir_oqish() from public, anon, authenticated;
revoke execute on function public.kitobdoshmi(uuid, uuid) from public, anon;
revoke execute on function public.oqish_azosimi(bigint) from public, anon;
grant execute on function public.kitobdoshmi(uuid, uuid) to authenticated;
grant execute on function public.oqish_azosimi(bigint) to authenticated;

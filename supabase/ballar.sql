-- «sitata.uz» — ballar, darajalar va faol haftalar.
-- sozlash.sql, takliflar.sql, birga.sql, taxallus.sql dan keyin ishga tushiriladi.
-- Kun raqami (kun) = 1970-01-01 dan beri o'tgan kunlar (Toshkent vaqti bilan), sana = date '1970-01-01' + kun.

-- 1. Natijani faqat bugungi (yoki kechagi/ertangi — vaqt mintaqasi farqi uchun) kunga yozish mumkin
create or replace function public.bugungi_kun() returns int language sql stable as $$
  select floor((extract(epoch from now()) + 5 * 3600) / 86400)::int;
$$;

drop policy if exists "o'zi yozadi" on public.oyinlar;
create policy "o'zi yozadi" on public.oyinlar for insert to authenticated
  with check (profil_id = auth.uid() and kun between public.bugungi_kun() - 1 and public.bugungi_kun() + 1);

-- 2. Viktorina natijalari (kuniga birinchi natija hisobga olinadi)
create table if not exists public.viktorina_natijalari (
  profil_id uuid not null default auth.uid() references public.profillar on delete cascade,
  kun       int  not null,
  ball      int  not null check (ball between 0 and 300),
  vaqt      timestamptz not null default now(),
  primary key (profil_id, kun)
);
alter table public.viktorina_natijalari enable row level security;
drop policy if exists "hamma ko'radi" on public.viktorina_natijalari;
drop policy if exists "o'zi yozadi" on public.viktorina_natijalari;
create policy "hamma ko'radi" on public.viktorina_natijalari for select using (true);
create policy "o'zi yozadi" on public.viktorina_natijalari for insert to authenticated
  with check (profil_id = auth.uid() and kun between public.bugungi_kun() - 1 and public.bugungi_kun() + 1);
grant select on public.viktorina_natijalari to anon, authenticated;
grant insert on public.viktorina_natijalari to authenticated;

-- 3. Ball beradigan voqealar
create or replace function public.ball_voqealari(p uuid)
returns table (sana date, turi text, ball int)
language sql stable security definer set search_path = '' as $$
  -- «Kim aytgan?»: topsa 50 (har xato −5, kamida 25), topa olmasa 10
  select date '1970-01-01' + o.kun, 'oyin', case when o.yutdi then greatest(25, 50 - 5 * o.xatolar) else 10 end
  from public.oyinlar o where o.profil_id = p
  union all
  -- Viktorina: kunlik natijaning o'ndan biri
  select date '1970-01-01' + v.kun, 'viktorina', round(v.ball / 10.0)::int
  from public.viktorina_natijalari v where v.profil_id = p
  union all
  -- Birga o'qilgan kitobni tugatish: kamida 2 ishtirokchi, boshlanganidan kamida 3 kun keyin
  select (a.yangilangan at time zone 'Asia/Tashkent')::date, 'kitob', 150
  from public.oqish_azolari a join public.oqishlar q on q.id = a.oqish_id
  where a.profil_id = p and a.holat = 'qabul' and a.foiz = 100
    and a.yangilangan >= q.yaratilgan + interval '3 days'
    and (select count(*) from public.oqish_azolari b where b.oqish_id = a.oqish_id and b.holat = 'qabul') >= 2
  union all
  -- Tasdiqlangan iqtibos taklifi
  select (t.korib_chiqilgan at time zone 'Asia/Tashkent')::date, 'taklif', 30
  from public.takliflar t where t.yuboruvchi = p and t.holat = 'tasdiqlandi' and t.korib_chiqilgan is not null
  union all
  -- Kitobdoshlar (birinchi 20 tasi)
  select sana, 'kitobdosh', 10 from (
    select (k.vaqt at time zone 'Asia/Tashkent')::date as sana
    from public.kitobdoshlar k where k.holat = 'qabul' and p in (k.kimdan, k.kimga)
    order by k.vaqt limit 20
  ) dost;
$$;

-- 4. Haftalik hisob: har hafta (dushanbadan) to'plangan ball, faollik va jami (0 dan pastga tushmaydi).
-- Profil ochilgan haftadan keyingi, tugagan haftada bitta ham o'yin bo'lmasa — −100.
create or replace function public.ball_haftalar(p uuid)
returns table (hafta date, ball int, faol boolean, jami int)
language plpgsql stable security definer set search_path = '' as $$
declare
  boshi date; joriy date; h date; v record; yigindi int := 0;
begin
  select date_trunc('week', (yaratilgan at time zone 'Asia/Tashkent'))::date into boshi from public.profillar where id = p;
  if boshi is null then return; end if;
  joriy := date_trunc('week', (now() at time zone 'Asia/Tashkent'))::date;
  h := boshi;
  while h <= joriy loop
    select coalesce(sum(e.ball), 0)::int as b, coalesce(bool_or(e.turi in ('oyin', 'viktorina')), false) as f
      into v from public.ball_voqealari(p) e where e.sana >= h and e.sana < h + 7;
    hafta := h; faol := v.f; ball := v.b;
    if not v.f and h > boshi and h < joriy then ball := ball - 100; end if;
    yigindi := greatest(0, yigindi + ball);
    jami := yigindi;
    return next;
    h := h + 7;
  end loop;
end;
$$;

-- 5. Profilning hozirgi bali va ballar reytingi
create or replace function public.profil_bali(p uuid) returns int
language sql stable security definer set search_path = '' as $$
  select coalesce((select jami from public.ball_haftalar(p) order by hafta desc limit 1), 0);
$$;

create or replace view public.ball_reytingi with (security_invoker = true) as
  select p.kod, p.ism, p.taxallus, public.profil_bali(p.id) as ball from public.profillar p;

revoke execute on function public.ball_voqealari(uuid) from public;
revoke execute on function public.ball_haftalar(uuid) from public;
revoke execute on function public.profil_bali(uuid) from public;
grant execute on function public.ball_voqealari(uuid), public.ball_haftalar(uuid), public.profil_bali(uuid), public.bugungi_kun() to anon, authenticated;
grant select on public.ball_reytingi to anon, authenticated;

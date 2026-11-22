-- «Kim aytgan?» — reyting jadvali uchun ko'rinish (view).
-- Supabase: SQL Editor → New query → shu faylni to'liq joylang → Run.
-- sozlash.sql allaqachon ishga tushirilgan bo'lishi kerak. Qayta ishga tushirsa ham zarar qilmaydi.

create or replace view public.reyting
with (security_invoker = true) as
with
  bugun as (                                    -- Toshkent vaqti bo'yicha bugungi kun raqami
    select floor((extract(epoch from now()) + 5 * 3600) / 86400)::int as kun
  ),
  yutuqlar as (                                 -- ketma-ket yutgan kunlarni guruhlash
    select profil_id, kun,
           kun - (row_number() over (partition by profil_id order by kun))::int as guruh
    from public.oyinlar
    where yutdi
  ),
  seriyalar as (
    select profil_id, count(*)::int as uzunlik, max(kun) as oxirgi
    from yutuqlar
    group by profil_id, guruh
  ),
  oyin_stat as (
    select profil_id,
           count(*)::int                               as oyinlar,
           (count(*) filter (where yutdi))::int        as topilgan,
           round(avg(xatolar) filter (where yutdi), 1) as ortacha_xato
    from public.oyinlar
    group by profil_id
  ),
  baho_stat as (
    select profil_id, round(avg(baho), 2) as ortacha_baho, count(*)::int as baholar_soni
    from public.baholar
    group by profil_id
  )
select
  p.kod,
  p.ism,
  coalesce(o.oyinlar, 0)  as oyinlar,
  coalesce(o.topilgan, 0) as topilgan,
  o.ortacha_xato,
  coalesce((select max(s.uzunlik) from seriyalar s where s.profil_id = p.id), 0) as eng_uzun_seriya,
  coalesce((select s.uzunlik from seriyalar s, bugun b
            where s.profil_id = p.id and s.oxirgi >= b.kun - 1), 0)               as joriy_seriya,
  b.ortacha_baho,
  coalesce(b.baholar_soni, 0) as baholar_soni,
  p.taxallus                                     -- taxallus.sql dan keyin
from public.profillar p
left join oyin_stat o on o.profil_id = p.id
left join baho_stat b on b.profil_id = p.id;

grant select on public.reyting to anon, authenticated;

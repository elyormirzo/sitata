-- «sitata.uz» — kitobdoshlar iqtiboslari (Supabase'da «kitobdosh_iqtiboslari» va «kitob_iqtiboslari_chegara_tuzatish» migratsiyalari).
-- * kitob_iqtiboslari: profil_id, kitob_javoni_id (o'z javonidagi kitob), kitob, muallif, matn (3–600), sahifa, yoqtirishlar, vaqt.
--   Ko'rish — egasi va uning kitobdoshlari (kitobdoshmi()); qo'shish — o'zi, kuniga 50 tagacha (bugungi_iqtiboslarim_soni());
--   o'chirish — o'zi. yoqtirishlar soni faqat trigger orqali o'zgaradi.
-- * iqtibos_yoqtirishlar (iqtibos_id, profil_id): faqat ko'ra oladigan iqtibosni yoqtiradi; o'zinikini va o'z iqtiboslariga
--   kelganlarni ko'radi. Trigger iqtibos_yoqtirish_hisobi — sonni yangilaydi va egasiga bildirishnoma yuboradi (1 kunda 1 marta).
-- * iqtibos_statistikasi(p) — profil uchun: nechta iqtibos yozgan, jami nechta yoqtirma olgan (faqat sonlar, hammaga ochiq).
-- To'liq SQL: Supabase → Database → Migrations.

-- «iqtibos_rasmlari» migratsiyasi: sahifa surati bilan iqtibos.
-- * kitob_iqtiboslari.rasm_yoli ('<uid>/<uuid>.jpg'); rasm bo'lsa matn ixtiyoriy.
-- * Storage bucket «iqtibos-rasmlar»: maxfiy, faqat JPEG, ≤ 3 MB. Yuklash/o'chirish — o'z papkasiga;
--   ko'rish — egasi va uning kitobdoshlari (iqtibos_rasmiga_ruxsat(name)).
-- * Rasm brauzerda tahrirlanadi (js/rasm-tahrir.js): qirqish/burish, marker va ruchka bilan belgilash, filtr va ramka.

-- «iqtibos_manba_turlari» migratsiyasi: kitob_iqtiboslari.manba_turi — 'kitob' | 'kocha' (ko'chadagi yozuv) | 'ozim' (o'z fikri) | 'boshqa'.
-- kitob ustuni endi ixtiyoriy (faqat 'kitob' turida majburiy); ko'cha/boshqa turida joy yoki manba nomi shu ustunga yoziladi.

-- Profil ko'rsatkichlari: iqtiboslar, ularga yoqtirmalar, kitobdoshlar soni
create or replace function public.profil_statistikasi(p uuid)
returns table(iqtiboslar integer, yoqtirmalar integer, kitobdoshlar integer)
language sql stable security definer set search_path to ''
as $$
  select
    (select count(*)::int from public.kitob_iqtiboslari where profil_id = p),
    (select coalesce(sum(yoqtirishlar), 0)::int from public.kitob_iqtiboslari where profil_id = p),
    (select count(*)::int from public.kitobdoshlar where holat = 'qabul' and (kimdan = p or kimga = p));
$$;
revoke all on function public.profil_statistikasi(uuid) from public, anon;
grant execute on function public.profil_statistikasi(uuid) to authenticated;

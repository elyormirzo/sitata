-- «sitata.uz» — kitob fayllari (Supabase'da «kitob_fayllari» va «birga_oqish_kitob_fayli» migratsiyalari sifatida qo'llangan).
-- * Storage bucket «kitoblar»: maxfiy, har bir fayl ≤ 50 MB, istalgan format; yo'l: <foydalanuvchi_id>/<tasodifiy>.<kengaytma>
-- * Yuklash va o'chirish — faqat o'z papkasiga; bir foydalanuvchiga 30 tagacha fayl.
-- * Ko'rish (storage.objects select): egasi YOKI kitob_fayliga_ruxsat(name) — ya'ni egasining kitobdoshi bo'lib,
--   shu fayl biriktirilgan «birga o'qish»ga taklif qilingan va qabul qilgan foydalanuvchi.
-- * kitob_javoni: fayl_yoli, fayl_nomi, fayl_hajmi, fayl_turi ustunlari.
-- * oqishlar.fayl_kitob_id — yaratuvchining fayli bor javon kitobi (boshqa odamning kitobini biriktirib bo'lmaydi).

-- Ruxsatni tekshirish (SQL Editor'da ishga tushiring — oxirida ROLLBACK, hech narsa saqlanmaydi):
-- begin;
--   ... sinov foydalanuvchilari, fayl, kitobdoshlik va birga o'qish yaratiladi ...
--   set local role authenticated;
--   set local request.jwt.claims = '{"sub":"<foydalanuvchi_id>","role":"authenticated"}';
--   select count(*) from storage.objects where bucket_id = 'kitoblar' and name like '<egasi_id>/%';
-- rollback;

-- Muqova («kitob_muqovasi» migratsiyasi): kitob_javoni.muqova — fayldan olingan kichik JPEG (data:image/jpeg;base64,…, ≤ 80 000 belgi).
-- alter table public.kitob_javoni add column if not exists muqova text
--   check (muqova is null or (length(muqova) <= 80000 and muqova like 'data:image/jpeg;base64,%'));

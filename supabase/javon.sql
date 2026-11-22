-- «sitata.uz» — kitob javoni va yillik challenge (Supabase'da «kitob_javoni_va_yillik_maqsad» migratsiyasi sifatida qo'llangan).
-- kitob_javoni: profil_id, kitob, muallif, holat (oqimoqchi | oqiyapman | oqidim), foiz, baho (1–5), sharh, boshlangan, tugatilgan.
--   Bir profilda bir xil kitob takrorlanmaydi; hamma ko'radi, faqat egasi o'zgartiradi; ko'pi bilan 1000 ta kitob.
-- yillik_maqsad: profil_id, yil, maqsad (1–365); hamma ko'radi, faqat egasi qo'yadi/o'zgartiradi.
-- To'liq SQL: Supabase → Database → Migrations.

-- Sahifalar («kitob_sahifalari» migratsiyasi): kitob_javoni.sahifalar (jami, 1–20000), kitob_javoni.sahifa (hozirgi).
-- alter table public.kitob_javoni
--   add column if not exists sahifalar int check (sahifalar is null or sahifalar between 1 and 20000),
--   add column if not exists sahifa int check (sahifa is null or (sahifa >= 0 and sahifa <= 20000));

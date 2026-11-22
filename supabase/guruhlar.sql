-- ===== SINF VA GURUHLAR, O'QISH JURNALI =====
-- Migratsiyalar (Supabase): oqish_jurnali, guruhlar, taxallus_band_guruhlar.
--
-- oqish_jurnali(profil_id, kun, sahifalar) — kunlik o'qilgan sahifalar (Toshkent sanasi).
--   kitob_javoni.sahifa «o'qiyapman» holatida oshganda trigger (oqish_jurnaliga_yoz) yozadi; kuniga ko'pi bilan 600 sahifa.
--   Hamma o'qiy oladi (javon ham ochiq), hech kim to'g'ridan-to'g'ri yoza olmaydi.
--
-- guruhlar(id, nom, tur 'sinf'|'guruh', kod, egasi) — kod faqat a'zolarga (guruhlarim() orqali), ustun darajasida yopiq.
-- guruh_azolari(guruh_id, profil_id) — a'zolar bir-birini ko'radi (guruh_azosimi); o'zi chiqadi yoki egasi chiqaradi.
-- guruh_topshiriqlari(guruh_id, kitob, muallif, izoh, muddat) — egasi beradi, a'zolar ko'radi; a'zolarga bildirishnoma.
--
-- RPC (security definer): guruh_yarat(nom, tur) — ko'pi bilan 10 ta; guruhga_qoshil(kod) — guruhda ≤300, odamda ≤20 guruh;
--   guruhlarim(); guruh_koddan(kod); guruh_reytingi(g, 'hafta'|'oy'|'hammasi') — sahifalar, kitoblar, topilgan (faqat a'zolarga);
--   topshiriq_jarayoni(t) — a'zolar javonidagi shu nomli kitob holati; guruhlar_bellashuvi(davr) — ≥3 a'zoli guruhlar.

-- ===== O'qish seriyasi va nishonlar (migratsiyalar: oqish_seriyasi_va_nishonlar, oqish_holati_tuzatish) =====
-- profillar.kunlik_maqsad (1–500 sahifa).
-- ball_voqealari: 'oqish' — oqish_jurnali bo'yicha har 2 sahifaga 1 ball, kuniga ≤30; ball_haftalar: o'qish ham faollik.
-- oqish_holati(p) — bugun, maqsad, joriy/eng uzun seriya, jami sahifa, kitoblar, iqtiboslar, yoqtirmalar, kitobdoshlar,
--   guruhlar, topilgan, birga_oqishlar, jadid_kitoblar — nishonlar shu ko'rsatkichlardan saytda hisoblanadi (js/nishonlar.js).

-- ===== Duellar (migratsiyalar: duellar, taxallus_band_duel) =====
-- duellar(chaqiruvchi, raqib, mavzu, savollar jsonb, chaqiruvchi_ball/togri, raqib_ball/togri, holat 'kutmoqda'|'tugadi'|'rad').
-- Faqat kitobdoshni chaqirish (kitobdoshmi), bir vaqtda ≤10 ta kutilayotgan chaqiruv; faqat ikki ishtirokchi ko'radi.
-- duelni_yakunla(id, ball, togri) — raqib natijasi + chaqiruvchiga bildirishnoma; duelni_rad_et(id).
-- Chaqiruv yaratilganda raqibga bildirishnoma (duel_chaqiruvi_bildir).

-- ===== Yillik o'qish xulosasi (migratsiyalar: yillik_xulosa, taxallus_band_xulosa) =====
-- yillik_xulosa(yil) → jsonb: tugatilgan kitoblar, sahifalar, o'qilgan kunlar, eng uzun seriya, eng ko'p o'qilgan oy,
--   sevimli muallif, iqtiboslar va yoqtirmalar, eng ko'p yoqtirilgan iqtibos, topilgan, duel g'alabalari, yangi kitobdoshlar.
--   Faqat chaqiruvchining o'zi uchun (auth.uid()).

-- ===== Guruhda tayyorgarlik (migratsiya: guruh_tayyorgarlik) =====
-- guruh_savollari(guruh_id, savol, javob, variantlar jsonb, mavzu, tartib) — egasi qo'shadi (≤3000), a'zolar ko'radi.
-- savol_natijalari(profil_id, savol_id, guruh_id, quti 0–5, togri, xato, oxirgi) — har kim faqat o'zinikini ko'radi/yozadi.
-- guruh_tayyorgarligi(g) — a'zolar bo'yicha ko'rilgan/o'zlashtirilgan (quti ≥ 2) soni (a'zolarga);
-- qiyin_savollar(g) — eng ko'p xato qilinayotgan 15 savol (faqat egasiga).
-- guruh_materiallari + «guruh-fayllar» xotirasi (maxfiy, 50 MB): o'qish — a'zolar, yuklash/o'chirish — egasi (guruh_fayliga_ruxsat).
-- guruhga_qoshil: guruh hajmi 1000 kishigacha.

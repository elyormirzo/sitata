-- «sitata.uz» — profil rasmi («profil_rasmi» migratsiyasi).
-- * profillar.rasm: 'q:<kalit>' — tayyor qahramon (js/avatar.js: muallif portretlari, asar va kino qahramonlari)
--   yoki '<uid>/<uuid>.jpg' — o'z surati. Trigger profil_rasmi_tekshir: surat faqat o'z papkasidan bo'ladi.
-- * Storage bucket «avatarlar»: ochiq (profil hammaga ko'rinadi), faqat JPEG, ≤ 1 MB; yuklash/o'chirish — o'z papkasiga.

-- Profil: qisqa ma'lumot (bio) va ijtimoiy tarmoqlar (faqat foydalanuvchi nomi; havola saytda yasaladi)
alter table public.profillar
  add column if not exists bio text check (bio is null or char_length(bio) <= 160),
  add column if not exists instagram text check (instagram is null or instagram ~ '^[A-Za-z0-9._]{1,30}$'),
  add column if not exists x text check (x is null or x ~ '^[A-Za-z0-9_]{1,15}$'),
  add column if not exists telegram text check (telegram is null or telegram ~ '^[A-Za-z0-9_]{5,32}$');
grant select (bio, instagram, x, telegram) on public.profillar to anon, authenticated;
grant insert (bio, instagram, x, telegram), update (bio, instagram, x, telegram) on public.profillar to authenticated;

-- Profil banneri: 2 yoki 3 rangli gradient (migratsiya: profil_banner_rangi)
alter table public.profillar
  add column if not exists banner text check (banner is null or banner ~ '^#[0-9a-f]{6}(,#[0-9a-f]{6}){1,2}$');
grant select (banner) on public.profillar to anon, authenticated;
grant insert (banner), update (banner) on public.profillar to authenticated;

-- Profil manzili endi sitata.uz/taxallus — saytning o'z sahifalari nomlari taxallus bo'la olmaydi
-- (migratsiya: taxallus_band_sozlar_kengaytirildi; ro'yxat js/profil.js dagi BAND_TAXALLUSLAR bilan bir xil)

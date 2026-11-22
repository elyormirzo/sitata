-- «sitata.uz» — takrorlanmaydigan @taxallus (foydalanuvchi nomi). sozlash.sql va reyting.sql dan keyin.
alter table public.profillar add column if not exists taxallus text;
alter table public.profillar drop constraint if exists profillar_taxallus_shakli;
alter table public.profillar add constraint profillar_taxallus_shakli check (
  taxallus is null or (
    taxallus ~ '^[a-z0-9_]{3,20}$'
    and taxallus not in ('admin', 'sitata', 'sitatauz', 'support', 'yordam', 'moderator', 'null', 'undefined', 'profil', 'reyting')
  )
);
create unique index if not exists profillar_taxallus on public.profillar (taxallus);
-- reyting ko'rinishiga taxallus ustuni qo'shilgan — reyting.sql ni qayta ishga tushiring.
-- Bildirishnomalardagi havolalar taxallusni ishlatadi — birga.sql ni qayta ishga tushiring.

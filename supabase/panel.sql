-- «sitata.uz» — har sahifadagi yon panel: sahifa baholari (👍/👎) va fikrlar (💬).
-- Supabase: SQL Editor → shu faylni joylang → Run. Qayta ishga tushirsa ham zarar qilmaydi.

-- 1. Sahifa baholari: har profil har sahifaga bitta baho (1 — foydali, -1 — yoqmadi)
create table if not exists public.sahifa_baholari (
  profil_id uuid not null default auth.uid() references public.profillar on delete cascade,
  yol       text not null check (char_length(yol) between 1 and 120),
  baho      smallint not null check (baho in (-1, 1)),
  vaqt      timestamptz not null default now(),
  primary key (profil_id, yol)
);
alter table public.sahifa_baholari enable row level security;
drop policy if exists "o'z bahosi" on public.sahifa_baholari;
drop policy if exists "admin ko'radi" on public.sahifa_baholari;
create policy "o'z bahosi" on public.sahifa_baholari for all to authenticated
  using (profil_id = auth.uid()) with check (profil_id = auth.uid());
create policy "admin ko'radi" on public.sahifa_baholari for select to authenticated using (public.adminmi());
grant select, insert, update, delete on public.sahifa_baholari to authenticated;

-- 2. Fikrlar: foydalanuvchi sahifa haqida yozgan izoh/taklif (faqat o'zi va admin ko'radi)
create table if not exists public.fikrlar (
  id        bigint generated always as identity primary key,
  profil_id uuid not null default auth.uid() references public.profillar on delete cascade,
  yol       text not null check (char_length(yol) between 1 and 120),
  matn      text not null check (char_length(btrim(matn)) between 2 and 1000),
  vaqt      timestamptz not null default now()
);
create index if not exists fikrlar_vaqt on public.fikrlar (vaqt desc);
alter table public.fikrlar enable row level security;
drop policy if exists "fikr yozish" on public.fikrlar;
drop policy if exists "o'ziniki va admin" on public.fikrlar;
-- Spamga qarshi: bir profildan kuniga ko'pi bilan 20 ta fikr
create policy "fikr yozish" on public.fikrlar for insert to authenticated
  with check (profil_id = auth.uid()
    and (select count(*) from public.fikrlar f where f.profil_id = auth.uid() and f.vaqt > now() - interval '1 day') < 20);
create policy "o'ziniki va admin" on public.fikrlar for select to authenticated
  using (profil_id = auth.uid() or public.adminmi());
grant select, insert on public.fikrlar to authenticated;

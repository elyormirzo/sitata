-- «sitata.uz» — foydalanuvchilar taklif qilgan iqtiboslar va adminlar.
-- Supabase: SQL Editor → New query → shu faylni to'liq joylang → Run.
-- sozlash.sql allaqachon ishga tushirilgan bo'lishi kerak. Qayta ishga tushirsa ham zarar qilmaydi.

-- 1. Adminlar ro'yxati (Supabase'dagi foydalanuvchi ID'lari)
create table if not exists public.adminlar (
  user_id uuid primary key references auth.users on delete cascade
);
alter table public.adminlar enable row level security;
drop policy if exists "o'zini ko'radi" on public.adminlar;
create policy "o'zini ko'radi" on public.adminlar for select to authenticated using (user_id = auth.uid());
grant select on public.adminlar to authenticated;

-- Joriy foydalanuvchi adminmi? (qoidalar ichida ishlatiladi)
create or replace function public.adminmi() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.adminlar where user_id = auth.uid());
$$;
grant execute on function public.adminmi() to anon, authenticated;

-- 2. Taklif qilingan iqtiboslar
create table if not exists public.takliflar (
  id              bigint generated always as identity primary key,
  matn            text not null check (char_length(btrim(matn)) between 3 and 400),
  muallif         text not null check (char_length(btrim(muallif)) between 2 and 60),
  asar            text check (asar is null or char_length(asar) <= 80),
  yuboruvchi      uuid not null default auth.uid() references auth.users on delete cascade,
  yuboruvchi_ism  text check (yuboruvchi_ism is null or char_length(yuboruvchi_ism) <= 30),
  holat           text not null default 'kutilmoqda' check (holat in ('kutilmoqda', 'tasdiqlandi', 'rad_etildi')),
  yaratilgan      timestamptz not null default now(),
  korib_chiqilgan timestamptz
);
create index if not exists takliflar_holat on public.takliflar (holat, yaratilgan desc);

alter table public.takliflar enable row level security;
drop policy if exists "tasdiqlanganlar va o'ziniki" on public.takliflar;
drop policy if exists "taklif yuborish" on public.takliflar;
drop policy if exists "admin ko'rib chiqadi" on public.takliflar;
drop policy if exists "admin o'chiradi" on public.takliflar;

-- Hamma tasdiqlanganlarni ko'radi; yuboruvchi o'z takliflarini; admin hammasini
create policy "tasdiqlanganlar va o'ziniki" on public.takliflar for select
  using (holat = 'tasdiqlandi' or yuboruvchi = auth.uid() or public.adminmi());

-- Faqat o'z nomidan, faqat "kutilmoqda" holatida, bir vaqtda ko'pi bilan 10 ta kutilayotgan taklif
create policy "taklif yuborish" on public.takliflar for insert to authenticated
  with check (
    yuboruvchi = auth.uid() and holat = 'kutilmoqda' and korib_chiqilgan is null
    and (select count(*) from public.takliflar t where t.yuboruvchi = auth.uid() and t.holat = 'kutilmoqda') < 10
  );

-- Tasdiqlash, rad etish, tahrirlash va o'chirish — faqat admin
create policy "admin ko'rib chiqadi" on public.takliflar for update to authenticated
  using (public.adminmi()) with check (public.adminmi());
create policy "admin o'chiradi" on public.takliflar for delete to authenticated using (public.adminmi());

grant select on public.takliflar to anon, authenticated;
grant insert, update, delete on public.takliflar to authenticated;

-- 3. O'zingizni admin qilish (bir marta):
--    Authentication → Users → Add user → Create new user (email + parol, "Auto Confirm User" belgilang).
--    Keyin uning User UID sini quyidagi qatorga qo'yib, alohida ishga tushiring:
-- insert into public.adminlar (user_id) values ('BU-YERGA-USER-UID');

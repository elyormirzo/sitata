-- «Kim aytgan?» — profillar, o'yin natijalari va baholar.
-- Supabase: SQL Editor → New query → shu faylni to'liq joylang → Run.
-- Qayta ishga tushirsa ham zarar qilmaydi (if not exists).

-- 1. Profillar: har bir o'yinchi (anonim kirish orqali) bitta profil oladi
create table if not exists public.profillar (
  id         uuid primary key default auth.uid() references auth.users on delete cascade,
  kod        text not null unique check (kod ~ '^[a-z0-9]{6}$'),          -- havoladagi qisqa kod
  ism        text not null check (char_length(btrim(ism)) between 1 and 30),
  yaratilgan timestamptz not null default now()
);

-- 2. O'yin natijalari: kuniga bitta, keyin o'zgartirib bo'lmaydi
create table if not exists public.oyinlar (
  profil_id uuid not null default auth.uid() references public.profillar on delete cascade,
  kun       int  not null check (kun between 20000 and 40000),            -- 1970-yildan beri kunlar
  yutdi     boolean not null,
  xatolar   int  not null check (xatolar between 0 and 20),
  vaqt      timestamptz not null default now(),
  primary key (profil_id, kun)
);

-- 3. Baholar: bir kishi bir profilga bitta baho (keyin o'zgartirishi mumkin), o'ziga emas
create table if not exists public.baholar (
  profil_id  uuid not null references public.profillar on delete cascade,
  baholovchi uuid not null default auth.uid() references auth.users on delete cascade,
  baho       smallint not null check (baho between 1 and 5),
  vaqt       timestamptz not null default now(),
  primary key (profil_id, baholovchi),
  check (profil_id <> baholovchi)
);

-- Xavfsizlik: hamma o'qiy oladi, lekin faqat o'zinikini yozadi
alter table public.profillar enable row level security;
alter table public.oyinlar   enable row level security;
alter table public.baholar   enable row level security;

drop policy if exists "hamma ko'radi" on public.profillar;
drop policy if exists "o'zi yaratadi" on public.profillar;
drop policy if exists "o'zi o'zgartiradi" on public.profillar;
create policy "hamma ko'radi"     on public.profillar for select using (true);
create policy "o'zi yaratadi"     on public.profillar for insert to authenticated with check (id = auth.uid());
create policy "o'zi o'zgartiradi" on public.profillar for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

drop policy if exists "hamma ko'radi" on public.oyinlar;
drop policy if exists "o'zi yozadi" on public.oyinlar;
create policy "hamma ko'radi" on public.oyinlar for select using (true);
create policy "o'zi yozadi"   on public.oyinlar for insert to authenticated with check (profil_id = auth.uid());

drop policy if exists "hamma ko'radi" on public.baholar;
drop policy if exists "o'zi baholaydi" on public.baholar;
drop policy if exists "o'z bahosini o'zgartiradi" on public.baholar;
create policy "hamma ko'radi"            on public.baholar for select using (true);
create policy "o'zi baholaydi"           on public.baholar for insert to authenticated with check (baholovchi = auth.uid());
create policy "o'z bahosini o'zgartiradi" on public.baholar for update to authenticated using (baholovchi = auth.uid()) with check (baholovchi = auth.uid());

grant select on public.profillar, public.oyinlar, public.baholar to anon, authenticated;
grant insert, update on public.profillar, public.baholar to authenticated;
grant insert on public.oyinlar to authenticated;

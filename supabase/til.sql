-- ===== FOYDALANUVCHI TILI =====
-- Sayt tili (uz/ru/en) profilga yoziladi: Telegram bot va push-eslatmalar shu tilda yuboriladi.
-- Bildirishnoma matnlari bazada o'zbekcha saqlanadi; server funksiyalari (functions/*/til.ts)
-- va sayt (js/tarjima.js) ularni foydalanuvchi tiliga o'giradi.
alter table public.profillar add column if not exists til text not null default 'uz' check (til in ('uz','ru','en'));
grant insert (til), update (til) on public.profillar to authenticated;

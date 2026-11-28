-- ===== TELEGRAM BOT (SQL Editor orqali qo'shildi) =====
-- telegram_ulanishlar(profil_id, chat_id, tg_username, xabarlar, eslatma_kuni) — yozish faqat «telegram» server funksiyasi orqali;
--   foydalanuvchi o'zinikini ko'radi, xabarlar belgisini o'zgartiradi, uzadi.
-- telegram_kodlar(kod, profil_id, muddat 15 daqiqa) — telegram_kodi_ol() bilan yaratiladi, /start <kod> bilan ishlatiladi.
-- telegram_chaqir(jsonb) — server funksiyasini maxfiy kalit (vault: sitata_push_kalit) bilan chaqiradi.
-- bildirishnoma_telegram — har bir yangi bildirishnoma ulangan foydalanuvchiga Telegram'ga ham yuboriladi.
-- cron «sitata-telegram-kechki» — har kuni 20:05 (Toshkent): o'qish seriyasi / bugungi o'yin eslatmasi.
-- Bot tokeni: Edge Function secret TELEGRAM_BOT_TOKEN. Webhook: select public.telegram_chaqir('{"turi":"sozla"}');

-- Server funksiyasi (service_role) uchun huquqlar — ularsiz bot kodni o'qiy olmaydi va «havola eskirgan» deydi
grant select, delete on public.telegram_kodlar to service_role;
grant select, insert, update, delete on public.telegram_ulanishlar to service_role;
grant select (id, ism, til) on public.profillar to service_role;

-- ===== Saytga Telegram orqali kirish (telegram funksiyasi: kirish_kodi / kirish_holati / kirish_yakun) =====
-- kod — 10 daqiqa amal qiladi; bot /start k_<kod> bilan tasdiqlaydi; faqat server funksiyasi (service_role) o'qiydi/yozadi.
create table if not exists public.tg_kirish (
  kod         text primary key check (kod ~ '^[0-9a-f]{32}$'),
  holat       text not null default 'kutish' check (holat in ('kutish', 'tasdiq', 'ishlatildi')),
  tg_id       bigint,
  tg_username text,
  tg_ism      text,
  tg_til      text,
  yangi_uid   uuid,
  muddat      timestamptz not null default now() + interval '10 minutes',
  yaratildi   timestamptz not null default now()
);
alter table public.tg_kirish enable row level security;
revoke all on public.tg_kirish from anon, authenticated;
grant select, insert, update, delete on public.tg_kirish to service_role;
grant select, insert, update, delete on public.telegram_ulanishlar to service_role;

// telegram — sitata.uz Telegram boti.
//  GET                                   → { bot } (botning username'i; saytdagi «Telegram'ni ulash» havolasi uchun)
//  POST + X-Telegram-Bot-Api-Secret-Token → Telegram'dan kelgan xabarlar (/start <kod>, /stop, /davom, /bugun, /yordam)
//  POST {turi:"sozla"|"bildirishnoma"|"kechki"} + x-sitata-kalit → faqat ichki chaqiruvlar (SQL, trigger, cron)
// Bot tokeni: Edge Function secret TELEGRAM_BOT_TOKEN (sayt egasi o'zi qo'yadi).
// Til: ulangan foydalanuvchiga — profillar.til; ulanmaganga — Telegram ilovasining tili.
import { createClient } from "npm:@supabase/supabase-js@2.118.0";
import { bildirishnomaMatni, m, type Til, tilmi } from "./til.ts";

const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });
const TOKEN = Deno.env.get("TELEGRAM_BOT_TOKEN") || "";
const SAYT = "https://sitata.uz/";
const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};
const javob = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { ...CORS, "Content-Type": "application/json" } });

async function tg(metod: string, tana: Record<string, unknown>) {
  const r = await fetch(`https://api.telegram.org/bot${TOKEN}/${metod}`, {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(tana),
  });
  return await r.json().catch(() => ({ ok: false }));
}

// Webhook maxfiy kaliti tokendan hosil qilinadi (alohida sozlash shart emas)
async function webhookKaliti() {
  const h = await crypto.subtle.digest("SHA-256", new TextEncoder().encode("sitata-tg:" + TOKEN));
  return [...new Uint8Array(h)].map((b) => b.toString(16).padStart(2, "0")).join("").slice(0, 48);
}

let botNomi: string | null = null;
async function botUsername() {
  if (botNomi || !TOKEN) return botNomi;
  const r = await tg("getMe", {});
  botNomi = r?.result?.username || null;
  return botNomi;
}

// Saytga havola — foydalanuvchi tilida ochilsin
const sayt = (til: Til, yol = "") =>
  til === "uz" ? SAYT + yol : yol.startsWith("?") ? SAYT + yol + "&til=" + til : SAYT + "?til=" + til + yol;
const tugma = (matn: string, havola: string) => ({ inline_keyboard: [[{ text: matn, url: havola }]] });
const bugunSana = () => new Date(Date.now() + 5 * 3600 * 1000).toISOString().slice(0, 10);
const bugunKun = () => Math.floor((Date.now() + 5 * 3600 * 1000) / 86400000);

async function yubor(chatId: number, matn: string, klaviatura?: unknown) {
  const r = await tg("sendMessage", { chat_id: chatId, text: matn, disable_web_page_preview: true, ...(klaviatura ? { reply_markup: klaviatura } : {}) });
  // Foydalanuvchi botni bloklagan bo'lsa — xabarlarni o'chirib qo'yamiz
  if (!r.ok && r.error_code === 403) await db.from("telegram_ulanishlar").update({ xabarlar: false }).eq("chat_id", chatId);
  return r.ok === true;
}

const yordam = (til: Til) => m(til, "📚 sitata.uz boti") + "\n\n" +
  m(til, "Men sizga saytdagi yangiliklarni yuboraman: kitobdoshlar, iqtibos yoqtirishlari, duel chaqiruvlari, guruh topshiriqlari va kechqurun — o'qish seriyangiz haqida eslatma.") + "\n\n" +
  m(til, "/bugun — bugungi «Kim aytgan?» o'yini\n/stop — xabarlarni to'xtatish\n/davom — xabarlarni qayta yoqish");

async function profilTili(profilId: string): Promise<Til> {
  const { data } = await db.from("profillar").select("til").eq("id", profilId).maybeSingle();
  return tilmi(data?.til);
}

// Chat tili: ulangan bo'lsa — profil tili, aks holda Telegram ilovasi tili
async function chatTili(chatId: number, tgTil?: string): Promise<Til> {
  const { data } = await db.from("telegram_ulanishlar").select("profil_id").eq("chat_id", chatId).maybeSingle();
  if (data) return await profilTili(data.profil_id);
  const t = (tgTil || "").slice(0, 2);
  return t === "ru" || t === "uk" || t === "be" || t === "kk" ? "ru" : t === "uz" || !t ? "uz" : "en";
}

async function telegramXabari(u: any) {
  const msg = u.message;
  if (u.my_chat_member && u.my_chat_member.new_chat_member?.status === "kicked") {
    await db.from("telegram_ulanishlar").update({ xabarlar: false }).eq("chat_id", u.my_chat_member.chat.id);
    return;
  }
  if (!msg || !msg.text || msg.chat?.type !== "private") return;
  const chatId = msg.chat.id as number;
  const [buyruq, ...qolgan] = msg.text.trim().split(/\s+/);
  const arg = qolgan.join(" ");

  if (buyruq === "/start" && /^[0-9a-f]{32}$/.test(arg)) {
    const { data: k } = await db.from("telegram_kodlar").select("profil_id,muddat").eq("kod", arg).maybeSingle();
    if (!k || new Date(k.muddat) < new Date()) {
      const til = await chatTili(chatId, msg.from?.language_code);
      await yubor(chatId, m(til, "⏳ Bu havola eskirgan. Saytda «Telegram'ni ulash» tugmasini qayta bosing."), tugma("sitata.uz", sayt(til, "#profilim")));
      return;
    }
    await db.from("telegram_ulanishlar").delete().eq("chat_id", chatId).neq("profil_id", k.profil_id);
    await db.from("telegram_ulanishlar").upsert({ profil_id: k.profil_id, chat_id: chatId, tg_username: msg.from?.username || null, xabarlar: true }, { onConflict: "profil_id" });
    await db.from("telegram_kodlar").delete().eq("kod", arg);
    const { data: p } = await db.from("profillar").select("ism,til").eq("id", k.profil_id).maybeSingle();
    const til = tilmi(p?.til);
    await yubor(chatId, m(til, "✅ {0}, profilingiz ulandi!\n\nEndi saytdagi yangiliklar shu yerga keladi. Kechqurun o'qish seriyangiz haqida eslatib turaman 🔥\n\n/stop — xabarlarni to'xtatish", p?.ism || m(til, "Kitobxon")),
      tugma("📖 sitata.uz", sayt(til)));
    return;
  }
  const til = await chatTili(chatId, msg.from?.language_code);
  if (buyruq === "/start") {
    await yubor(chatId, m(til, "Assalomu alaykum! 📚\n\nBotni profilingizga ulash uchun saytda: Profilim → ⚙ Sozlamalar → «Telegram'ni ulash».\n\n") + yordam(til),
      tugma(m(til, "Profilni ulash"), sayt(til, "#profilim")));
    return;
  }
  if (buyruq === "/stop") {
    await db.from("telegram_ulanishlar").update({ xabarlar: false }).eq("chat_id", chatId);
    await yubor(chatId, m(til, "🔕 Xabarlar to'xtatildi. Qayta yoqish uchun: /davom"));
    return;
  }
  if (buyruq === "/davom") {
    const { data } = await db.from("telegram_ulanishlar").update({ xabarlar: true }).eq("chat_id", chatId).select("profil_id");
    const bor = !!(data && data.length);
    await yubor(chatId, bor ? m(til, "🔔 Xabarlar qayta yoqildi.") : m(til, "Avval profilingizni ulang: saytda Profilim → ⚙ Sozlamalar → «Telegram'ni ulash»."),
      bor ? undefined : tugma(m(til, "Profilni ulash"), sayt(til, "#profilim")));
    return;
  }
  if (buyruq === "/bugun") {
    await yubor(chatId, m(til, "📖 Bugungi iqtibos tayyor — muallifini topa olasizmi?"), tugma(m(til, "«Kim aytgan?» o'ynash"), sayt(til, "#kim-aytgan")));
    return;
  }
  await yubor(chatId, yordam(til), tugma("📖 sitata.uz", sayt(til)));
}

async function kechkiEslatmalar() {
  const bugun = bugunSana(), kun = bugunKun();
  const { data: royxat } = await db.from("telegram_ulanishlar").select("profil_id,chat_id,eslatma_kuni").eq("xabarlar", true);
  let yuborildi = 0;
  for (const u of royxat || []) {
    if (u.eslatma_kuni === bugun) continue;
    const [{ data: h }, { data: oyin }, til] = await Promise.all([
      db.rpc("oqish_holati", { p: u.profil_id }),
      db.from("oyinlar").select("kun").eq("profil_id", u.profil_id).order("kun", { ascending: false }).limit(1),
      profilTili(u.profil_id),
    ]);
    const holat = h && h[0];
    const oxirgiOyin = oyin && oyin[0] ? oyin[0].kun : null;
    let matn: string | null = null, klav: unknown;
    if (holat && holat.bugun === 0 && holat.joriy_seriya > 0) {
      matn = m(til, "🔥 {0} kunlik o'qish seriyangiz bor!\nBugun hali o'qimadingiz — 10 sahifa ham yetadi, seriya uzilmasin.", holat.joriy_seriya);
      klav = tugma(m(til, "📚 Javonimni ochish"), sayt(til, "#javon"));
    } else if (oxirgiOyin !== kun) {
      const farq = oxirgiOyin == null ? 1 : kun - oxirgiOyin;
      matn = farq <= 1 ? m(til, "📖 Bugungi iqtibos sizni kutmoqda — muallifini topa olasizmi?")
        : farq <= 6 ? m(til, "😢 Kitobcha {0} kundan beri sizni kutyapti… Bugungi iqtibosni topib, uni xursand qiling.", farq)
        : m(til, "🕸 {0} kun! Kitobchani chang bosdi — bitta o'yin bilan uni jonlantiring.", farq);
      klav = tugma(m(til, "«Kim aytgan?» o'ynash"), sayt(til, "#kim-aytgan"));
    }
    if (matn && await yubor(u.chat_id, matn, klav)) yuborildi++;
    await db.from("telegram_ulanishlar").update({ eslatma_kuni: bugun }).eq("profil_id", u.profil_id);
    await new Promise((r) => setTimeout(r, 40));   // Telegram cheklovi: sekundiga ~30 xabar
  }
  return { yuborildi };
}

// Bot buyruqlari va tavsifi — har bir til uchun (Telegram ilovasi tiliga qarab ko'rinadi)
async function sozla() {
  const url = Deno.env.get("SUPABASE_URL") + "/functions/v1/telegram";
  const w = await tg("setWebhook", { url, secret_token: await webhookKaliti(), allowed_updates: ["message", "my_chat_member"], drop_pending_updates: true });
  let c = { ok: true };
  for (const [til, kod] of [["uz", undefined], ["uz", "uz"], ["ru", "ru"], ["en", "en"]] as [Til, string | undefined][]) {
    const lc = kod ? { language_code: kod } : {};
    const r = await tg("setMyCommands", { ...lc, commands: [
      { command: "bugun", description: m(til, "Bugungi «Kim aytgan?» o'yini") },
      { command: "stop", description: m(til, "Xabarlarni to'xtatish") },
      { command: "davom", description: m(til, "Xabarlarni qayta yoqish") },
      { command: "yordam", description: m(til, "Bot haqida") },
    ] });
    if (!r.ok) c = r;
    await tg("setMyDescription", { ...lc, description: m(til, "sitata.uz — kitob o'qish va iqtiboslar jamiyati. Bot saytdagi yangiliklar va o'qish eslatmalarini yuboradi.") });
  }
  return { webhook: w.ok, buyruqlar: c.ok, bot: await botUsername() };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: CORS });
  try {
    if (req.method === "GET") return javob({ bot: await botUsername() });
    if (!TOKEN) return javob({ xato: "TELEGRAM_BOT_TOKEN sozlanmagan" }, 503);

    // Telegram'dan kelgan xabar
    const tgKalit = req.headers.get("x-telegram-bot-api-secret-token");
    if (tgKalit !== null) {
      if (tgKalit !== await webhookKaliti()) return javob({ xato: "ruxsat yo'q" }, 401);
      await telegramXabari(await req.json().catch(() => ({})));
      return javob({ ok: true });
    }

    // Ichki chaqiruvlar (SQL, trigger, cron)
    const { data: ruxsat } = await db.rpc("push_kalit_togrimi", { k: req.headers.get("x-sitata-kalit") || "" });
    if (ruxsat !== true) return javob({ xato: "ruxsat yo'q" }, 401);
    const tana = await req.json().catch(() => ({}));

    if (tana.turi === "sozla") return javob(await sozla());
    if (tana.turi === "bildirishnoma") {
      const { data: b } = await db.from("bildirishnomalar").select("kimga,matn,havola").eq("id", tana.id).maybeSingle();
      if (!b) return javob({ yuborildi: 0 });
      const { data: u } = await db.from("telegram_ulanishlar").select("chat_id").eq("profil_id", b.kimga).eq("xabarlar", true).maybeSingle();
      if (!u) return javob({ yuborildi: 0 });
      const til = await profilTili(b.kimga);
      const ok = await yubor(u.chat_id, bildirishnomaMatni(b.matn, til), tugma(m(til, "Ochish →"), sayt(til, b.havola || "")));
      return javob({ yuborildi: ok ? 1 : 0 });
    }
    if (tana.turi === "kechki") return javob(await kechkiEslatmalar());
    return javob({ xato: "noma'lum turi" }, 400);
  } catch (e) {
    return javob({ xato: String(e) }, 500);
  }
});

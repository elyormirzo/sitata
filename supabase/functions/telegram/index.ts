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

  // Saytga Telegram orqali kirish: /start k_<kod>
  if (buyruq === "/start" && /^k_[0-9a-f]{32}$/.test(arg)) {
    const kod = arg.slice(2);
    const til = await chatTili(chatId, msg.from?.language_code);
    const { data: k } = await db.from("tg_kirish").select("holat,muddat").eq("kod", kod).maybeSingle();
    if (!k || k.holat !== "kutish" || new Date(k.muddat) < new Date()) {
      await yubor(chatId, m(til, "⏳ Bu kirish havolasi eskirgan. Saytda «Telegram orqali kirish» tugmasini qayta bosing."), tugma("sitata.uz", sayt(til, "#kirish")));
      return;
    }
    const f = msg.from || {};
    await db.from("tg_kirish").update({
      holat: "tasdiq", tg_id: f.id, tg_username: f.username || null,
      tg_ism: [f.first_name, f.last_name].filter(Boolean).join(" ").slice(0, 60) || null, tg_til: (f.language_code || "").slice(0, 5) || null,
    }).eq("kod", kod).eq("holat", "kutish");
    await yubor(chatId, m(til, "✅ Tasdiqlandi! Endi saytga qayting — kirish o'zi davom etadi."), tugma(m(til, "Saytga qaytish"), sayt(til, "#kirish")));
    return;
  }
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

// ===== Saytga Telegram orqali kirish =====
// 1) sayt: kirish_kodi → kod; foydalanuvchi botda /start k_<kod> bosadi → bot kodni Telegram hisobi bilan tasdiqlaydi
// 2) sayt: kirish_holati (har 2 soniyada) → tasdiqlangach:
//    · bu Telegram'ga ulangan profil bor — o'sha profilga kirish uchun bir martalik token (magic link token_hash)
//    · ulangan profil yo'q, lekin saytda profil ochiq — joriy profilga Telegram ulanadi
//    · hech biri yo'q — yangi hisob ochiladi (ism Telegram'dan), sayt profil yaratib, kirish_yakun bilan ulaydi
// Telegram hisoblari uchun Auth'da ko'rinmas texnik email: tg-<id>@telegram.sitata.uz (xat yuborilmaydi).
const tgEmail = (id: number) => `tg-${id}@telegram.sitata.uz`;
const hex = (n: number) => [...crypto.getRandomValues(new Uint8Array(n))].map((b) => b.toString(16).padStart(2, "0")).join("");

async function chaqiruvchi(req: Request) {
  const token = (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
  if (!token || token.split(".").length !== 3) return null;
  const { data } = await db.auth.getUser(token);
  return data?.user || null;
}

async function kirishKodi() {
  await db.from("tg_kirish").delete().lt("muddat", new Date(Date.now() - 3600 * 1000).toISOString());
  const { count } = await db.from("tg_kirish").select("kod", { count: "exact", head: true }).eq("holat", "kutish").gt("muddat", new Date().toISOString());
  if ((count ?? 0) > 2000) return { xato: "band" };
  const kod = hex(16);
  const { error } = await db.from("tg_kirish").insert({ kod });
  if (error) return { xato: "yaratilmadi" };
  return { kod, bot: await botUsername() };
}

// Mavjud foydalanuvchini Telegram bilan belgilash (email bo'lmasa — texnik email) va kirish tokeni
async function kirishTokeni(uid: string, tgId: number) {
  const { data: u } = await db.auth.admin.getUserById(uid);
  if (!u?.user) return null;
  let email = u.user.email;
  const meta = { ...(u.user.app_metadata || {}), telegram: tgId };
  if (!email) {
    email = tgEmail(tgId);
    const { error } = await db.auth.admin.updateUserById(uid, { email, email_confirm: true, app_metadata: meta });
    if (error) return null;
  } else if (u.user.app_metadata?.telegram !== tgId) await db.auth.admin.updateUserById(uid, { app_metadata: meta });
  const { data: l, error } = await db.auth.admin.generateLink({ type: "magiclink", email });
  if (error || !l?.properties?.hashed_token) return null;
  return l.properties.hashed_token;
}

async function kirishHolati(kod: string, req: Request) {
  if (!/^[0-9a-f]{32}$/.test(kod)) return { holat: "eskirgan" };
  const { data: k } = await db.from("tg_kirish").select("*").eq("kod", kod).maybeSingle();
  if (!k || new Date(k.muddat) < new Date() || k.holat === "ishlatildi") return { holat: "eskirgan" };
  if (k.holat === "kutish") return { holat: "kutish" };
  // Bir martalik: tokenni faqat bir marta beramiz
  const { data: ol } = await db.from("tg_kirish").update({ holat: "ishlatildi" }).eq("kod", kod).eq("holat", "tasdiq").select("kod");
  if (!ol?.length) return { holat: "eskirgan" };
  const tgId = Number(k.tg_id);
  const men = await chaqiruvchi(req);
  const { data: ulangan } = await db.from("telegram_ulanishlar").select("profil_id").eq("chat_id", tgId).maybeSingle();

  if (ulangan) {
    if (men && men.id === ulangan.profil_id) { await kirishTokeni(men.id, tgId); return { holat: "ulandi" }; }
    const token = await kirishTokeni(ulangan.profil_id, tgId);
    return token ? { holat: "kirish", token_hash: token } : { holat: "xato" };
  }
  // Telegram hali hech qaysi profilga ulanmagan — saytdagi joriy profilga ulaymiz
  if (men) {
    const { data: p } = await db.from("profillar").select("id").eq("id", men.id).maybeSingle();
    if (p) {
      await db.from("telegram_ulanishlar").upsert({ profil_id: men.id, chat_id: tgId, tg_username: k.tg_username, xabarlar: true }, { onConflict: "profil_id" });
      await kirishTokeni(men.id, tgId);
      return { holat: "ulandi" };
    }
  }
  // Yangi hisob (yoki avval ochilib, profili yaratilmay qolgan hisob)
  const email = tgEmail(tgId);
  const { error: e1 } = await db.auth.admin.createUser({
    email, email_confirm: true, app_metadata: { telegram: tgId },
    user_metadata: { full_name: k.tg_ism || "Kitobxon", name: k.tg_ism || "Kitobxon" },
  });
  if (e1 && !/already|exists|registered/i.test(e1.message || "")) return { holat: "xato" };
  const { data: l, error: e2 } = await db.auth.admin.generateLink({ type: "magiclink", email });
  if (e2 || !l?.properties?.hashed_token) return { holat: "xato" };
  await db.from("tg_kirish").update({ yangi_uid: l.user?.id || null }).eq("kod", kod);
  return { holat: "kirish", token_hash: l.properties.hashed_token, yangi: true };
}

// Yangi hisob profil ochgach — Telegram chatini profilga ulaymiz (bildirishnomalar shu yerga keladi)
async function kirishYakun(kod: string, req: Request) {
  const men = await chaqiruvchi(req);
  if (!men || !/^[0-9a-f]{32}$/.test(kod)) return { ok: false };
  const { data: k } = await db.from("tg_kirish").select("tg_id,tg_username,yangi_uid").eq("kod", kod).maybeSingle();
  if (!k || k.yangi_uid !== men.id) return { ok: false };
  const { data: p } = await db.from("profillar").select("id").eq("id", men.id).maybeSingle();
  if (!p) return { ok: false };
  await db.from("telegram_ulanishlar").upsert({ profil_id: men.id, chat_id: Number(k.tg_id), tg_username: k.tg_username, xabarlar: true }, { onConflict: "profil_id" });
  await db.from("tg_kirish").delete().eq("kod", kod);
  return { ok: true };
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

    // Saytga Telegram orqali kirish (ochiq: kod — maxfiy kalit)
    const ochiq = await req.clone().json().catch(() => ({}));
    if (ochiq.turi === "kirish_kodi") return javob(await kirishKodi());
    if (ochiq.turi === "kirish_holati") return javob(await kirishHolati(String(ochiq.kod || ""), req));
    if (ochiq.turi === "kirish_yakun") return javob(await kirishYakun(String(ochiq.kod || ""), req));

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

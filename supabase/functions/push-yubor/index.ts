// push-yubor — sitata.uz uchun push-eslatmalar.
//  GET                                  → { ochiq_kalit } (brauzer obuna bo'lishi uchun VAPID ochiq kaliti)
//  POST {turi:"sinov"} + foydalanuvchi tokeni → o'zining qurilmalariga sinov xabari
//  POST {turi:"kunlik"|"kechki"|"bildirishnoma", id?} + x-sitata-kalit → cron va triggerlardan
// VAPID kalitlari birinchi chaqiruvda yaratilib, push_sozlama jadvalida saqlanadi (faqat service_role o'qiydi).
import webpush from "npm:web-push@3.6.7";
import { createClient } from "npm:@supabase/supabase-js@2.118.0";

const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
  auth: { persistSession: false },
});
const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-sitata-kalit, x-client-info",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};
const javob = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { ...CORS, "Content-Type": "application/json" } });

async function vapid() {
  let { data } = await db.from("push_sozlama").select("vapid_public,vapid_private").eq("id", 1).maybeSingle();
  if (!data?.vapid_public) {
    const k = webpush.generateVAPIDKeys();
    await db.from("push_sozlama").upsert({ id: 1, vapid_public: k.publicKey, vapid_private: k.privateKey }, { ignoreDuplicates: true });
    ({ data } = await db.from("push_sozlama").select("vapid_public,vapid_private").eq("id", 1).single());
  }
  return data!;
}

type Obuna = { endpoint: string; p256dh: string; auth: string; profil_id: string };
type Xabar = { title: string; body: string; url: string; tag?: string; icon?: string };

// Kitobcha kayfiyati: oxirgi o'yindan beri o'tgan kunlarga qarab (js/kitobcha.js bilan bir xil)
function kechkiXabar(kunlar: number | null): Xabar {
  const k = kunlar ?? 1;
  const ikonka = (n: string) => "/ikonkalar/kitobcha-" + n + ".png";
  const umumiy = { url: "/#kim-aytgan", tag: "kechki" };
  if (k <= 1) return { ...umumiy, title: "📖 Bugungi iqtibos sizni kutmoqda", body: "Kitobcha kutyapti — bir daqiqa vaqt ajrating.", icon: ikonka("kutmoqda") };
  if (k <= 3) return { ...umumiy, title: "😢 Kitobcha xafa", body: `${k} kundan beri ko'rinmaysiz… Bugungi iqtibosni topib, uni xursand qiling.`, icon: ikonka("xafa") };
  if (k <= 6) return { ...umumiy, title: "😤 Kitobchaning jahli chiqdi!", body: `${k} kun! Seriyangiz kuyib ketyapti — hoziroq qayting.`, icon: ikonka("jahldor") };
  if (k <= 13) return { ...umumiy, title: "🕸 Kitobchani chang bosdi", body: `${k} kundan beri varaqlanmadi. Bir o'yin — va chang ketadi.`, icon: ikonka("chang") };
  return { ...umumiy, title: "💀 Kitobcha skeletga aylandi", body: `${k} kun… Bitta o'yin bilan uni qayta jonlantiring!`, icon: ikonka("skelet") };
}

async function yubor(obunalar: Obuna[], xabar: Xabar) {
  let yuborildi = 0;
  const eskirgan: string[] = [];
  await Promise.allSettled(obunalar.map(async (o) => {
    try {
      await webpush.sendNotification(
        { endpoint: o.endpoint, keys: { p256dh: o.p256dh, auth: o.auth } },
        JSON.stringify(xabar),
        { TTL: 6 * 3600, urgency: "normal" },
      );
      yuborildi++;
    } catch (e) {
      const kod = (e as { statusCode?: number }).statusCode;
      if (kod === 404 || kod === 410) eskirgan.push(o.endpoint);   // obuna bekor qilingan
    }
  }));
  if (eskirgan.length) await db.from("push_obunalar").delete().in("endpoint", eskirgan);
  return { yuborildi, ochirildi: eskirgan.length };
}

const ustunlar = "endpoint,p256dh,auth,profil_id";
const bugungiKun = () => Math.floor((Date.now() + 5 * 3600 * 1000) / 86400000);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: CORS });
  try {
    const k = await vapid();
    if (req.method === "GET") return javob({ ochiq_kalit: k.vapid_public });
    webpush.setVapidDetails("https://sitata.uz", k.vapid_public!, k.vapid_private!);
    const tana = await req.json().catch(() => ({}));

    // Foydalanuvchining o'zi so'ragan sinov xabari
    if (tana.turi === "sinov") {
      const token = (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
      const { data: u } = await db.auth.getUser(token);
      if (!u?.user) return javob({ xato: "kirish kerak" }, 401);
      const { data: obunalar } = await db.from("push_obunalar").select(ustunlar).eq("profil_id", u.user.id);
      return javob(await yubor(obunalar || [], {
        title: "Eslatmalar ishlayapti ✓", body: "Endi sitata.uz yangiliklarini o'tkazib yubormaysiz.", url: "/#daraja", tag: "sinov",
      }));
    }

    // Qolganlari — faqat ichki (cron, trigger) chaqiruvlar
    const { data: ruxsat } = await db.rpc("push_kalit_togrimi", { k: req.headers.get("x-sitata-kalit") || "" });
    if (ruxsat !== true) return javob({ xato: "ruxsat yo'q" }, 401);

    if (tana.turi === "kunlik") {
      const { data } = await db.from("push_obunalar").select(ustunlar).eq("kunlik", true);
      return javob(await yubor(data || [], {
        title: "Bugungi iqtibos tayyor 📖",
        body: "«Kim aytgan?» — muallifni toping va seriyangizni davom ettiring.",
        url: "/#kim-aytgan", tag: "kunlik",
      }));
    }
    if (tana.turi === "kechki") {
      const { data } = await db.from("push_obunalar").select(ustunlar).eq("kechki", true);
      const profillar = [...new Set((data || []).map((o) => o.profil_id))];
      const oxirgi = new Map<string, number>();
      if (profillar.length) {
        const { data: oyinlar } = await db.from("oyinlar").select("profil_id,kun").in("profil_id", profillar);
        (oyinlar || []).forEach((o) => oxirgi.set(o.profil_id, Math.max(oxirgi.get(o.profil_id) ?? 0, o.kun)));
      }
      const bugun = bugungiKun();
      // Bugun o'ynaganlarga yubormaymiz; qolganlarga — Kitobcha kayfiyatiga mos xabar
      const guruhlar = new Map<string, { xabar: Xabar; obunalar: Obuna[] }>();
      for (const o of data || []) {
        const kun = oxirgi.get(o.profil_id);
        if (kun === bugun) continue;
        const xabar = kechkiXabar(kun == null ? null : bugun - kun);
        const g = guruhlar.get(xabar.title) ?? { xabar, obunalar: [] };
        g.obunalar.push(o); guruhlar.set(xabar.title, g);
      }
      let jami = { yuborildi: 0, ochirildi: 0 };
      for (const g of guruhlar.values()) {
        const r = await yubor(g.obunalar, g.xabar);
        jami = { yuborildi: jami.yuborildi + r.yuborildi, ochirildi: jami.ochirildi + r.ochirildi };
      }
      return javob(jami);
    }
    if (tana.turi === "bildirishnoma") {
      const { data: b } = await db.from("bildirishnomalar").select("kimga,matn,havola").eq("id", tana.id).maybeSingle();
      if (!b) return javob({ yuborildi: 0 });
      const { data } = await db.from("push_obunalar").select(ustunlar).eq("profil_id", b.kimga).eq("ijtimoiy", true);
      return javob(await yubor(data || [], { title: "sitata.uz", body: b.matn, url: "/" + (b.havola || ""), tag: "b" + tana.id }));
    }
    return javob({ xato: "noma'lum turi" }, 400);
  } catch (e) {
    return javob({ xato: String(e) }, 500);
  }
});

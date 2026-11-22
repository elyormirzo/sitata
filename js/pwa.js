// ===== ILOVA (PWA): telefonga o'rnatish va push-eslatmalar =====
// Xizmat ishchisi: sw.js. Push yuboruvchi server funksiyasi: supabase/functions/push-yubor.

const PUSH_FUNKSIYA = SUPABASE_URL + "/functions/v1/push-yubor";
const ILOVA_REJIMI = window.matchMedia("(display-mode: standalone)").matches || navigator.standalone === true;
const IOS = /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
let ornatishSorovi = null;   // brauzerning «o'rnatish» oynasi (Android/Chrome)

if ("serviceWorker" in navigator && location.protocol.startsWith("http")) {
  window.addEventListener("load", () => navigator.serviceWorker.register("sw.js").catch(() => {}));
}
window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  ornatishSorovi = e;
  document.querySelectorAll(".ilova-banner").forEach((b) => b.classList.remove("yashirin"));
});
window.addEventListener("appinstalled", () => {
  ornatishSorovi = null;
  document.querySelectorAll(".ilova-banner").forEach((b) => b.remove());
});

// ---------- O'rnatish banneri (bosh sahifa) ----------
function ilovaBanneri() {
  const b = yarat("div", "ilova-banner yashirin");
  if (ILOVA_REJIMI || xotiradanOl("sitataBannerYopildi", false)) return b;
  if (IOS) b.classList.remove("yashirin");
  const matn = yarat("div", "ilova-banner-matn");
  matn.append(yarat("b", "", "📲 sitata'ni telefoningizga o'rnating"),
    yarat("span", "", "Ekranda belgi paydo bo'ladi, ilova kabi ochiladi va eslatmalar keladi."));
  const ornat = yarat("button", "kichik", "O'rnatish"); ornat.type = "button";
  const yop = yarat("button", "banner-yop", "×"); yop.type = "button"; yop.setAttribute("aria-label", "Yopish");
  const iosYordam = yarat("p", "kichik-matn yashirin",
    "iPhone/iPad'da: Safari'ning pastidagi «Ulashish» (⬆︎) tugmasini bosing, so'ng «Ekranga qo'shish» (Add to Home Screen) ni tanlang.");
  ornat.addEventListener("click", async () => {
    if (ornatishSorovi) {
      ornatishSorovi.prompt();
      const { outcome } = await ornatishSorovi.userChoice;
      if (outcome === "accepted") b.remove();
      ornatishSorovi = null;
    } else iosYordam.classList.toggle("yashirin");
  });
  yop.addEventListener("click", () => { xotiragaYoz("sitataBannerYopildi", true); b.remove(); });
  b.append(matn, ornat, yop, iosYordam);
  return b;
}

// ---------- Push-eslatmalar ----------
const pushQollanadimi = () => "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;

function base64dan(b64) {
  const toza = (b64 + "=".repeat((4 - (b64.length % 4)) % 4)).replace(/-/g, "+").replace(/_/g, "/");
  return Uint8Array.from(atob(toza), (c) => c.charCodeAt(0));
}

async function joriyObuna() {
  if (!pushQollanadimi()) return null;
  const reg = await navigator.serviceWorker.getRegistration();
  return reg ? reg.pushManager.getSubscription() : null;
}

async function obunaBol() {
  const ruxsat = await Notification.requestPermission();
  if (ruxsat !== "granted") throw new Error("ruxsat");
  const reg = await navigator.serviceWorker.register("sw.js");
  await navigator.serviceWorker.ready;
  const { ochiq_kalit } = await (await fetch(PUSH_FUNKSIYA)).json();
  let obuna = await reg.pushManager.getSubscription();
  if (!obuna) obuna = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: base64dan(ochiq_kalit) });
  const j = obuna.toJSON();
  const m = await mijozOl();
  await kirish();
  const { error } = await m.from("push_obunalar").upsert({
    endpoint: j.endpoint, p256dh: j.keys.p256dh, auth: j.keys.auth, profil_id: mening.id,
  }, { onConflict: "endpoint" });
  if (error) throw error;
  return obuna;
}

async function obunaniBekorQil() {
  const obuna = await joriyObuna();
  if (!obuna) return;
  const m = await mijozOl();
  await m.from("push_obunalar").delete().eq("endpoint", obuna.endpoint);
  await obuna.unsubscribe();
}

async function sinovXabari() {
  const m = await mijozOl();
  const { data } = await m.auth.getSession();
  const r = await fetch(PUSH_FUNKSIYA, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: "Bearer " + (data.session ? data.session.access_token : "") },
    body: JSON.stringify({ turi: "sinov" }),
  });
  return r.json();
}

// O'z profilidagi «Eslatmalar» qutisi
function eslatmaQutisi() {
  const quti = yarat("div", "eslatma-quti");
  quti.appendChild(yarat("b", "", "🔔 Eslatmalar"));
  const ichi = yarat("div", "eslatma-ichi");
  quti.appendChild(ichi);
  const xabar = yarat("p", "kichik-matn");

  const chiz = async () => {
    ichi.innerHTML = "";
    if (!pushQollanadimi()) {
      ichi.appendChild(yarat("p", "kichik-matn", IOS && !ILOVA_REJIMI
        ? "iPhone'da eslatmalar faqat o'rnatilgan ilovada ishlaydi: Safari'da «Ulashish» → «Ekranga qo'shish», keyin ilovani ekrandan oching."
        : "Bu brauzer eslatmalarni qo'llab-quvvatlamaydi. Chrome yoki Safari'ning yangi versiyasidan foydalaning."));
      return;
    }
    if (Notification.permission === "denied") {
      ichi.appendChild(yarat("p", "kichik-matn", "Eslatmalar brauzer sozlamalarida bloklangan. Manzil satridagi 🔒 belgisini bosib, «Bildirishnomalar»ga ruxsat bering."));
      return;
    }
    const obuna = await joriyObuna();
    if (!obuna) {
      ichi.appendChild(yarat("p", "kichik-matn", "Har kuni ertalab bugungi iqtibos, kechqurun seriya eslatmasi va kitobdoshlaringiz takliflari telefoningizga keladi."));
      const yoq = yarat("button", "asosiy", "Eslatmalarni yoqish"); yoq.type = "button";
      yoq.addEventListener("click", async () => {
        yoq.disabled = true; xabar.textContent = "";
        try { await obunaBol(); xabar.textContent = "Eslatmalar yoqildi ✓"; chiz(); }
        catch (e) {
          yoq.disabled = false;
          xabar.textContent = e.message === "ruxsat" ? "Ruxsat berilmadi — brauzer so'raganda «Ruxsat berish»ni bosing." : "Yoqib bo'lmadi — qayta urinib ko'ring.";
        }
      });
      ichi.appendChild(yoq);
      return;
    }
    // Obuna bor — sozlamalar
    const m = await mijozOl();
    const { data: s } = await m.from("push_obunalar").select("kunlik,kechki,ijtimoiy").eq("endpoint", obuna.endpoint).maybeSingle();
    if (!s) { await obuna.unsubscribe(); chiz(); return; }   // bazada yo'q — qaytadan obuna bo'lsin
    [["kunlik", "Har kuni 09:00 — bugungi iqtibos"], ["kechki", "20:00 — o'ynamagan bo'lsam, seriya eslatmasi"], ["ijtimoiy", "Kitobdoshlar va birga o'qish takliflari"]]
      .forEach(([k, nom]) => {
        const l = yarat("label", "belgilash");
        const cb = yarat("input"); cb.type = "checkbox"; cb.checked = s[k];
        cb.addEventListener("change", async () => {
          const { error } = await m.from("push_obunalar").update({ [k]: cb.checked }).eq("endpoint", obuna.endpoint);
          xabar.textContent = error ? "Saqlanmadi." : "Saqlandi ✓";
        });
        l.append(cb, document.createTextNode(" " + nom));
        ichi.appendChild(l);
      });
    const tugmalar = yarat("div", "eslatma-tugmalar");
    const sinov = yarat("button", "amal", "Sinov xabari"); sinov.type = "button";
    sinov.addEventListener("click", async () => {
      sinov.disabled = true;
      try { const r = await sinovXabari(); xabar.textContent = r.yuborildi ? "Yuborildi — bir necha soniyada keladi." : "Yuborilmadi — eslatmalarni o'chirib, qayta yoqib ko'ring."; }
      catch (e) { xabar.textContent = "Yuborilmadi."; }
      sinov.disabled = false;
    });
    const ochir = yarat("button", "amal", "O'chirish"); ochir.type = "button";
    ochir.addEventListener("click", async () => { await obunaniBekorQil(); xabar.textContent = "Eslatmalar o'chirildi."; chiz(); });
    tugmalar.append(sinov, ochir);
    ichi.appendChild(tugmalar);
  };
  quti.appendChild(xabar);
  if (BAZA_YOQIQ) chiz(); else quti.classList.add("yashirin");
  return quti;
}

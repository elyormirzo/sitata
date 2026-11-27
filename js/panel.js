// ===== YON PANEL: har sahifada chetda qotib turadi =====
// 🎧 tinglash · ✦ tasodifiy iqtibos · 👍/👎 sahifa bahosi · 💬 fikr · ✈ Telegram'da yuborish · ulashish · 🔖 saqlash
// Kompyuterda — kontent ustunining chap yonida; telefonda — ekranning chap chetida (kontent biroz o'ngga suriladi).
// Baza: sahifa_baholari, fikrlar — supabase/panel.sql. Saqlanganlar — shu brauzerda (localStorage).

const PANEL_IKON = (d, extra = "") =>
  `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"${extra}>${d}</svg>`;
const PIKON = {
  tingla: PANEL_IKON('<path d="M4 15v-3a8 8 0 0 1 16 0v3"/><rect x="3" y="14" width="4" height="6" rx="1.5"/><rect x="17" y="14" width="4" height="6" rx="1.5"/>'),
  toxta: PANEL_IKON('<rect x="7" y="6" width="3.5" height="12" rx="1"/><rect x="13.5" y="6" width="3.5" height="12" rx="1"/>'),
  uchqun: '<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true"><path d="M10 3.5l1.6 4.6 4.6 1.6-4.6 1.6L10 15.9l-1.6-4.6-4.6-1.6 4.6-1.6z"/><path d="M17.5 13l.9 2.4 2.4.9-2.4.9-.9 2.4-.9-2.4-2.4-.9 2.4-.9z"/></svg>',
  yoqdi: PANEL_IKON('<path d="M7 10v10H4V10zM7 10l4-7c1.4 0 2.3 1.2 2 2.6L12.4 9H19a2 2 0 0 1 2 2.3l-1.2 7A2 2 0 0 1 17.8 20H7"/>'),
  yoqmadi: PANEL_IKON('<path d="M17 14V4h3v10zM17 14l-4 7c-1.4 0-2.3-1.2-2-2.6l.6-3.4H5a2 2 0 0 1-2-2.3l1.2-7A2 2 0 0 1 6.2 4H17"/>'),
  fikr: PANEL_IKON('<path d="M4 5h16v11H9l-5 4z"/>'),
  telegram: '<svg viewBox="0 0 24 24" width="19" height="19" fill="currentColor" aria-hidden="true"><path d="M21.4 3.6 2.9 10.8c-1.2.5-1.2 1.2 0 1.6l4.7 1.5 1.8 5.6c.2.6.4.8.9.8.4 0 .6-.2.9-.5l2.3-2.2 4.7 3.5c.9.5 1.5.2 1.7-.8l3.1-14.7c.3-1.3-.5-1.9-1.6-1.5z"/></svg>',
  ulash: PANEL_IKON('<circle cx="18" cy="5" r="2.3"/><circle cx="6" cy="12" r="2.3"/><circle cx="18" cy="19" r="2.3"/><path d="m8 11 8-5M8 13l8 5"/>'),
  saqla: PANEL_IKON('<path d="M6 3h12v18l-6-4.5L6 21z"/>'),
  saqlandi: '<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true"><path d="M6 3h12v18l-6-4.5L6 21z"/></svg>',
};

// Joriy sahifa kaliti: #lenta, #muallif/alisher-navoiy, ...
const panelYoli = () => (location.hash.split("?")[0] || "#lenta").slice(0, 120);
const panelSarlavha = () => (document.title || "sitata.uz").replace(/\s+/g, " ").trim();
const panelHavola = () => location.origin + location.pathname + (location.search || "") + location.hash;

// ---------- Saqlanganlar (shu brauzerda) ----------
const SAQLANGAN_KALIT = "sitataSaqlangan";
function saqlanganlar() {
  try { const r = JSON.parse(localStorage.getItem(SAQLANGAN_KALIT) || "[]"); return Array.isArray(r) ? r : []; } catch (e) { return []; }
}
function saqlanganlarniYoz(r) { try { localStorage.setItem(SAQLANGAN_KALIT, JSON.stringify(r.slice(0, 100))); } catch (e) {} }

// ---------- Kichik oyna (modal) ----------
function panelOynasi(sarlavha) {
  const fon = yarat("div", "panel-oyna"); fon.setAttribute("role", "dialog"); fon.setAttribute("aria-modal", "true"); fon.setAttribute("aria-label", sarlavha);
  const quti = yarat("div", "panel-oyna-quti");
  const bosh = yarat("div", "panel-oyna-bosh");
  bosh.appendChild(yarat("b", "", sarlavha));
  const yop = yarat("button", "panel-oyna-yop", "✕"); yop.type = "button"; yop.setAttribute("aria-label", "Yopish");
  bosh.appendChild(yop);
  const ichi = yarat("div", "panel-oyna-ichi");
  quti.append(bosh, ichi); fon.appendChild(quti);
  const ket = () => { fon.remove(); document.removeEventListener("keydown", tugma); window.removeEventListener("hashchange", ket); };
  const tugma = (e) => { if (e.key === "Escape") ket(); };
  yop.addEventListener("click", ket);
  fon.addEventListener("click", (e) => { if (e.target === fon) ket(); });
  document.addEventListener("keydown", tugma);
  window.addEventListener("hashchange", ket);
  document.body.appendChild(fon);
  setTimeout(() => yop.focus(), 0);
  return { ichi, ket };
}

// ---------- ✦ Tasodifiy iqtibos ----------
function tasodifiyIqtibos() {
  const r = typeof ochiqIqtiboslar === "function" ? ochiqIqtiboslar() : IQTIBOSLAR;
  if (!r.length) return;
  const { ichi } = panelOynasi("✦ Tasodifiy iqtibos");
  let oldingi = null;
  const chiz = () => {
    let iq; do { iq = r[Math.floor(Math.random() * r.length)]; } while (r.length > 1 && iq === oldingi);
    oldingi = iq;
    ichi.innerHTML = "";
    ichi.appendChild(yarat("blockquote", "panel-iqtibos", "«" + iqtibosMatni(iq) + "»"));
    const kim = yarat("p", "panel-muallif");
    kim.appendChild(havola("#muallif/" + muallifSlug(iq.muallif), "", "— " + muallifNomi(iq.muallif)));
    const asar = asarNomi(iq); if (asar) kim.appendChild(yarat("span", "", ", «" + asar + "»"));
    ichi.appendChild(kim);
    const tug = yarat("div", "panel-oyna-tugmalar");
    const yana = yarat("button", "asosiy", "Yana bittasi ✦"); yana.type = "button"; yana.addEventListener("click", chiz);
    const nusxa = yarat("button", "ikkilamchi", "Nusxa olish"); nusxa.type = "button";
    nusxa.addEventListener("click", async () => {
      const ok = await nusxaOl("«" + iqtibosMatni(iq) + "» — " + muallifNomi(iq.muallif) + "\nsitata.uz");
      nusxa.textContent = ok ? "Nusxa olindi ✓" : "Nusxa olib bo'lmadi";
    });
    tug.append(yana, nusxa);
    ichi.appendChild(tug);
  };
  chiz();
}

// ---------- 🎧 Sahifani ovoz chiqarib o'qish ----------
let panelOvoz = null;
function sahifaMatni() {
  const ilova = document.querySelector(".ilova");
  if (!ilova) return "";
  const nusxa = ilova.cloneNode(true);
  // Yashirin bo'limlar, menyu, tugmalar va formalar o'qilmaydi
  nusxa.querySelectorAll(".yashirin, nav, .yuqori, .menyu, button, input, textarea, select, script, style, svg, .lenta-plyus, [aria-hidden=true]").forEach((e) => e.remove());
  return (nusxa.innerText || nusxa.textContent || "").replace(/\s+/g, " ").trim().slice(0, 6000);
}
function tinglash(tugma) {
  const ss = window.speechSynthesis;
  if (ss.speaking || ss.pending) { ss.cancel(); return; }
  const matn = sahifaMatni();
  if (!matn) return;
  const lang = { uz: "uz-UZ", ru: "ru-RU", en: "en-US" }[TIL] || "uz-UZ";
  // Uzun matnni gaplarga bo'lib o'qiymiz (ba'zi brauzerlar uzun matnni yarmida to'xtatadi)
  const bolaklar = matn.match(/[^.!?…]+[.!?…]*/g) || [matn];
  const ovozlar = ss.getVoices();
  const ovoz = ovozlar.find((v) => v.lang && v.lang.toLowerCase().startsWith(TIL)) || (TIL === "uz" ? ovozlar.find((v) => /^tr/i.test(v.lang)) : null);
  if (TIL === "uz" && !ovozlar.some((v) => /^uz/i.test(v.lang))) qisqaXabar(t("Qurilmangizda o'zbekcha ovoz yo'q — matn boshqa ovozda o'qiladi."));
  bolaklar.forEach((b, i) => {
    const u = new SpeechSynthesisUtterance(b.trim());
    u.lang = ovoz ? ovoz.lang : lang; if (ovoz) u.voice = ovoz; u.rate = 1;
    if (i === bolaklar.length - 1) u.onend = () => panelOvozHolati(tugma);
    ss.speak(u);
  });
  panelOvozHolati(tugma);
}
function panelOvozHolati(tugma) {
  const ss = window.speechSynthesis;
  const gapiryapti = !!ss && (ss.speaking || ss.pending);
  tugma.innerHTML = gapiryapti ? PIKON.toxta : PIKON.tingla;
  tugma.classList.toggle("faol", gapiryapti);
  tugma.setAttribute("aria-label", gapiryapti ? "To'xtatish" : "Sahifani tinglash");
  tugma.title = tugma.getAttribute("aria-label");
}

// ---------- 👍/👎 Sahifa bahosi ----------
let panelBaho = 0;
async function bahoniYukla(yoqdi, yoqmadi) {
  panelBaho = 0; bahoniChiz(yoqdi, yoqmadi);
  if (!BAZA_YOQIQ || !mening) return;
  const yol = panelYoli();
  try {
    const m = await mijozOl();
    const { data } = await m.from("sahifa_baholari").select("baho").eq("profil_id", mening.id).eq("yol", yol).maybeSingle();
    if (yol === panelYoli()) { panelBaho = data ? data.baho : 0; bahoniChiz(yoqdi, yoqmadi); }
  } catch (e) {}
}
function bahoniChiz(yoqdi, yoqmadi) {
  yoqdi.classList.toggle("tanlangan", panelBaho === 1); yoqdi.setAttribute("aria-pressed", String(panelBaho === 1));
  yoqmadi.classList.toggle("tanlangan", panelBaho === -1); yoqmadi.setAttribute("aria-pressed", String(panelBaho === -1));
}
async function bahoBer(qiymat, yoqdi, yoqmadi) {
  if (!BAZA_YOQIQ) return;
  if (!mening) { qisqaXabar(t("Baho berish uchun avval profil oching.")); return; }
  const yol = panelYoli();
  const eski = panelBaho;
  panelBaho = eski === qiymat ? 0 : qiymat;      // qayta bosilsa — bekor
  bahoniChiz(yoqdi, yoqmadi);
  try {
    const m = await mijozOl();
    const { error } = panelBaho === 0
      ? await m.from("sahifa_baholari").delete().eq("profil_id", mening.id).eq("yol", yol)
      : await m.from("sahifa_baholari").upsert({ profil_id: mening.id, yol, baho: panelBaho, vaqt: new Date().toISOString() }, { onConflict: "profil_id,yol" });
    if (error) throw error;
    if (panelBaho === 1) qisqaXabar(t("Rahmat! Sahifa sizga yoqqani saqlandi."));
    if (panelBaho === -1) qisqaXabar(t("Rahmat! Nima yoqmaganini 💬 orqali yozib qoldiring."));
  } catch (e) {
    panelBaho = eski; bahoniChiz(yoqdi, yoqmadi);
    qisqaXabar(t("Saqlab bo'lmadi — qayta urinib ko'ring."));
  }
}

// ---------- 💬 Fikr yozish ----------
function fikrOynasi() {
  if (!BAZA_YOQIQ) return;
  if (!mening) { qisqaXabar(t("Fikr yozish uchun avval profil oching.")); return; }
  const yol = panelYoli();
  const { ichi, ket } = panelOynasi("💬 Fikringiz");
  ichi.appendChild(yarat("p", "kichik-matn", "Shu sahifa haqida fikr, taklif yoki xato haqida yozing — sayt jamoasi o'qiydi."));
  const ta = yarat("textarea", "panel-fikr"); ta.maxLength = 1000; ta.rows = 5; ta.placeholder = "Fikringizni yozing…";
  const x = yarat("p", "kichik-matn");
  const tug = yarat("div", "panel-oyna-tugmalar");
  const yubor = yarat("button", "asosiy", "Yuborish"); yubor.type = "button";
  yubor.addEventListener("click", async () => {
    const matn = ta.value.trim();
    if (matn.length < 2) { x.textContent = "Fikr juda qisqa."; ta.focus(); return; }
    yubor.disabled = true; x.textContent = "";
    try {
      const m = await mijozOl();
      const { error } = await m.from("fikrlar").insert({ profil_id: mening.id, yol, matn });
      if (error) throw error;
      ket(); qisqaXabar(t("Rahmat! Fikringiz yuborildi."));
    } catch (e) {
      yubor.disabled = false; x.textContent = "Yuborib bo'lmadi — keyinroq urinib ko'ring.";
    }
  });
  tug.appendChild(yubor);
  ichi.append(ta, x, tug);
  setTimeout(() => ta.focus(), 50);
}

// ---------- Ulashish ----------
async function sahifaniUlash() {
  const url = panelHavola(), title = panelSarlavha();
  if (navigator.share && typeof ILOVA_ICHIDA !== "undefined" && !ILOVA_ICHIDA) {
    try { await navigator.share({ title, url }); return; } catch (e) { if (e && e.name === "AbortError") return; }
  }
  const ok = await nusxaOl(url);
  qisqaXabar(ok ? t("Havola nusxalandi.") : url);
}
function telegramdaYubor() {
  const u = "https://t.me/share/url?url=" + encodeURIComponent(panelHavola()) + "&text=" + encodeURIComponent(panelSarlavha());
  window.open(u, "_blank", "noopener");
}

// ---------- 🔖 Saqlash ----------
function saqlanganmi() { const y = panelYoli(); return saqlanganlar().some((s) => s.yol === y); }
function saqlashniChiz(b) {
  const bor = saqlanganmi();
  b.innerHTML = bor ? PIKON.saqlandi : PIKON.saqla;
  b.classList.toggle("tanlangan", bor); b.setAttribute("aria-pressed", String(bor));
}
function saqlash(b) {
  const y = panelYoli();
  let r = saqlanganlar();
  if (r.some((s) => s.yol === y)) { r = r.filter((s) => s.yol !== y); saqlanganlarniYoz(r); saqlashniChiz(b); qisqaXabar(t("Saqlanganlardan olib tashlandi.")); return; }
  r.unshift({ yol: y, nom: panelSarlavha(), vaqt: Date.now() });
  saqlanganlarniYoz(r); saqlashniChiz(b);
  // Xabarda — ro'yxatni ochish havolasi
  const x = yarat("div", "qisqa-xabar"); x.setAttribute("role", "status");
  x.append(document.createTextNode(t("Saqlandi.") + " "));
  const och = yarat("button", "matn-tugma panel-xabar-tugma", "Ro'yxatni ko'rish"); och.type = "button";
  och.addEventListener("click", () => { x.remove(); saqlanganlarOynasi(); });
  x.appendChild(och);
  document.body.appendChild(x);
  requestAnimationFrame(() => x.classList.add("korin"));
  setTimeout(() => { x.classList.remove("korin"); setTimeout(() => x.remove(), 400); }, 4200);
}
function saqlanganlarOynasi() {
  const { ichi } = panelOynasi("🔖 Saqlanganlar");
  const chiz = () => {
    ichi.innerHTML = "";
    const r = saqlanganlar();
    if (!r.length) { ichi.appendChild(yarat("p", "kichik-matn", "Hali hech narsa saqlanmagan. Istalgan sahifada 🔖 belgisini bosing.")); return; }
    const ul = yarat("ul", "panel-royxat");
    r.forEach((s) => {
      const li = yarat("li");
      li.appendChild(havola(s.yol, "", (s.nom || s.yol).replace(/\s*—\s*sitata\.uz$/, "")));
      const o = yarat("button", "matn-tugma", "✕"); o.type = "button"; o.setAttribute("aria-label", "O'chirish");
      o.addEventListener("click", () => { saqlanganlarniYoz(saqlanganlar().filter((z) => z.yol !== s.yol)); chiz(); panelniYangila(); });
      li.appendChild(o); ul.appendChild(li);
    });
    ichi.appendChild(ul);
  };
  chiz();
}

// ---------- Panelning o'zi ----------
let panelYangila = () => {};
function panelniYangila() { panelYangila(); }

function yonPanel() {
  const p = yarat("aside", "yon-panel"); p.setAttribute("aria-label", "Sahifa amallari");
  const tugma = (ikon, nom, sinf) => {
    const b = yarat("button", "yon-panel-tugma" + (sinf ? " " + sinf : "")); b.type = "button"; b.dataset.amal = sinf || nom;
    b.innerHTML = ikon; b.setAttribute("aria-label", nom); b.title = nom; return b;
  };
  const tingla = "speechSynthesis" in window ? tugma(PIKON.tingla, "Sahifani tinglash", "tingla") : null;
  const uchqun = tugma(PIKON.uchqun, "Tasodifiy iqtibos", "uchqun");
  const yoqdi = tugma(PIKON.yoqdi, "Foydali sahifa", "yoqdi");
  const yoqmadi = tugma(PIKON.yoqmadi, "Yoqmadi", "yoqmadi");
  const fikr = tugma(PIKON.fikr, "Fikr yozish", "fikr");
  const tg = tugma(PIKON.telegram, "Telegram'da yuborish", "telegram");
  const ul = tugma(PIKON.ulash, "Ulashish", "ulash");
  const saqla = tugma(PIKON.saqla, "Saqlash", "saqla");

  if (tingla) { tingla.addEventListener("click", () => tinglash(tingla)); p.appendChild(tingla); }
  uchqun.addEventListener("click", tasodifiyIqtibos);
  yoqdi.addEventListener("click", () => bahoBer(1, yoqdi, yoqmadi));
  yoqmadi.addEventListener("click", () => bahoBer(-1, yoqdi, yoqmadi));
  fikr.addEventListener("click", fikrOynasi);
  tg.addEventListener("click", telegramdaYubor);
  ul.addEventListener("click", sahifaniUlash);
  saqla.addEventListener("click", () => saqlash(saqla));
  p.append(uchqun, yoqdi, yoqmadi, fikr, yarat("hr", "yon-panel-chiziq"), tg, ul, saqla);

  panelYangila = () => {
    saqlashniChiz(saqla);
    bahoniYukla(yoqdi, yoqmadi);
    if (tingla && window.speechSynthesis && (speechSynthesis.speaking || speechSynthesis.pending)) speechSynthesis.cancel();
    if (tingla) panelOvozHolati(tingla);
  };
  return p;
}

// Panel kontent ustunining chap yonida turadi; joy bo'lmasa — ekran chetida, kontent o'ngga suriladi
function panelJoyiniTop() {
  const p = document.querySelector(".yon-panel"), ilova = document.querySelector(".ilova");
  if (!p || !ilova) return;
  const r = ilova.getBoundingClientRect();
  const kenglik = p.offsetWidth || 52;
  const menyu = document.querySelector(".yon-menyu");
  const mr = menyu && getComputedStyle(menyu).display !== "none" ? menyu.getBoundingClientRect().right : 0;   // kompyuterdagi chap menyu
  const chap = r.left - kenglik - 18;
  const tor = chap < mr + 8;
  document.body.classList.toggle("panel-tor", tor);
  p.style.left = (tor ? mr + 6 : chap) + "px";
}

function yonPanelniBoshla() {
  if (document.querySelector(".yon-panel")) return;
  document.body.appendChild(yonPanel());
  document.body.classList.add("panelli");
  panelJoyiniTop(); panelniYangila();
  window.addEventListener("resize", panelJoyiniTop);
  window.addEventListener("hashchange", () => { panelniYangila(); requestAnimationFrame(panelJoyiniTop); });
  setTimeout(panelJoyiniTop, 300);
  setTimeout(panelniYangila, 1500);   // profil (mening) yuklangach — bahoni ko'rsatish
}
if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", yonPanelniBoshla);
else yonPanelniBoshla();

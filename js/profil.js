// ===== 9. PROFIL VA BAHOLAR (Supabase) =====
// Supabase loyihasi manzili va "publishable" kaliti (Connect yoki Project Settings → API Keys). Bu kalit ochiq bo'lishi mumkin:
// xavfsizlikni bazadagi qoidalar (supabase/sozlash.sql) ta'minlaydi.
// Ikkalasi bo'sh bo'lsa, o'yin profilsiz ishlayveradi.
const SUPABASE_URL = "https://zqeodxxtyzjmtrrudqpd.supabase.co";
const SUPABASE_KALIT = "sb_publishable_iSnpWxy0wNcHdyecR_1zqA_Bp2KnM2t";
const SUPABASE_SKRIPT = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.118.0/dist/umd/supabase.js";
const BAZA_YOQIQ = !!(SUPABASE_URL && SUPABASE_KALIT) || !!window.__supabaseSinov;

let mijoz = null;
let mening = null; // { id, kod, ism } — shu brauzerdagi o'yinchi profili
try { mening = JSON.parse(localStorage.getItem("kimAytganProfil")); } catch (e) {}

const profilHavolasi = (kod) => SAYT_MANZILI + "?p=" + kod;
// Profil manzillari: tashqariga ulashish uchun sitata.uz/taxallus (404.html yo'naltiradi; eski sitata.uz/@taxallus ham), sayt ichida #@taxallus
const profilManzili = (p) => (p && p.taxallus ? SAYT_MANZILI + p.taxallus : profilHavolasi(p ? p.kod : ""));   // sitata.uz/mirzo
const profilIchkiHavola = (p) => (p && p.taxallus ? "#@" + p.taxallus : "?p=" + (p ? p.kod : ""));

// ---------- Taxallus (@foydalanuvchi_nomi) ----------
const TAXALLUS_SHAKLI = /^[a-z0-9_]{3,20}$/;
// Saytning o'z sahifalari va fayllari nomlari — manzil sitata.uz/taxallus bo'lgani uchun taxallus bo'la olmaydi (bazada ham shu ro'yxat)
const BAND_TAXALLUSLAR = ["admin", "sitata", "sitatauz", "support", "yordam", "moderator", "null", "undefined", "profil", "profilim", "reyting",
  "bosh", "lenta", "viktorina", "mualliflar", "muallif", "karta", "kitobdoshlar", "javon", "liga", "daraja", "birga", "qoidalar", "haqida",
  "iqtiboslar", "kitoblar", "sozlamalar", "bildirishnomalar", "kirish", "login", "api", "www", "mail", "about", "help", "settings",
  "js", "rasmlar", "ikonkalar", "supabase", "assets", "static", "index", "manifest", "sw", "favicon", "robots", "sitemap", "cname", "guruhlar", "guruh", "qoshil", "sinf", "duel", "duellar", "xulosa"];
const taxallusniTozala = (t) => String(t || "").trim().toLowerCase().replace(/^@+/, "");
// Kirill → lotin (taxallus uchun): «Дилноза Каримова» → «dilnoza karimova»
const KIRILL_LOTIN = { а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "yo", ж: "j", з: "z", и: "i", й: "y", к: "k", л: "l", м: "m", н: "n",
  о: "o", п: "p", р: "r", с: "s", т: "t", у: "u", ф: "f", х: "x", ц: "ts", ч: "ch", ш: "sh", щ: "sh", ъ: "", ы: "i", ь: "", э: "e", ю: "yu",
  я: "ya", ў: "o", қ: "q", ғ: "g", ҳ: "h", ә: "a", ө: "o", ү: "u", ң: "n", і: "i" };
// Ismdan taxallus: so'zlar «_» bilan — «Dilnoza Karimova» → «dilnoza_karimova» (20 belgigacha)
function taxallusTaklifi(ism, max = 20) {
  const sozlar = String(ism || "").toLowerCase().replace(/[а-яёўқғҳәөүңі]/g, (h) => KIRILL_LOTIN[h] ?? "")
    .replace(/([og])['ʻʼ‘’`]/g, "$1").replace(/[^a-z0-9]+/g, " ").trim().split(" ").filter(Boolean);
  let t = "";
  for (const s of sozlar) { const yangi = t ? t + "_" + s : s; if (yangi.length > max) break; t = yangi; }
  if (!t && sozlar.length) t = sozlar[0].slice(0, max);
  if (t.length < 3) t = (t + "kitobxon").slice(0, 8);
  return t;
}
// Bo'sh taxallusni topish: band bo'lsa oxiriga raqam qo'shiladi (topilmasa — null)
async function boshTaxallus(ism) {
  const asos = taxallusTaklifi(ism, 16);   // raqam qo'shishga joy qoladi
  for (const t of [asos, asos + Math.floor(10 + Math.random() * 90), asos + Math.floor(100 + Math.random() * 900)]) {
    if (taxallusXatosi(t)) continue;
    try { if (!(await taxallusEgasi(t))) return t; } catch (e) { return null; }
  }
  return null;
}
function taxallusXatosi(t) {
  if (!t) return "Taxallus yozing.";
  if (!TAXALLUS_SHAKLI.test(t)) return "Faqat lotin harflari, raqam va _ — 3 dan 20 belgigacha.";
  if (BAND_TAXALLUSLAR.includes(t)) return "Bu taxallusni olib bo'lmaydi.";
  return null;
}
async function taxallusEgasi(t) {
  const m = await mijozOl();
  const { data } = await m.from("profillar").select("id").eq("taxallus", t).maybeSingle();
  return data ? data.id : null;
}

// Taxallus kiritish maydoni: yozish paytida bo'sh-bandligini tekshiradi
function taxallusMaydoni(boshlangich) {
  const quti = document.createElement("div"); quti.className = "taxallus-maydon";
  const belgi = document.createElement("span"); belgi.className = "taxallus-belgi"; belgi.textContent = "@";
  const kirit = document.createElement("input"); kirit.placeholder = "taxallus"; kirit.maxLength = 21;
  kirit.autocapitalize = "off"; kirit.autocomplete = "username"; kirit.spellcheck = false; kirit.value = boshlangich || "";
  const holatMatni = document.createElement("p"); holatMatni.className = "taxallus-holat";
  const qator = document.createElement("div"); qator.className = "taxallus-qator"; qator.append(belgi, kirit);
  quti.append(qator, holatMatni);
  let navbat = 0, kechik = null, qolda = false;
  const tekshir = async () => {
    const t = taxallusniTozala(kirit.value);
    const n = ++navbat;
    const xato = taxallusXatosi(t);
    if (xato) { holatMatni.textContent = xato; holatMatni.className = "taxallus-holat xato"; return xato; }
    if (mening && mening.taxallus === t) { holatMatni.textContent = "Bu sizning hozirgi taxallusingiz."; holatMatni.className = "taxallus-holat"; return null; }
    holatMatni.textContent = "Tekshirilmoqda…"; holatMatni.className = "taxallus-holat";
    let egasi;
    try { egasi = await taxallusEgasi(t); } catch (e) { return null; }   // tekshira olmasak, baza o'zi rad etadi
    if (n !== navbat) return null;
    if (egasi && (!mening || egasi !== mening.id)) { holatMatni.textContent = `@${t} band — boshqasini tanlang.`; holatMatni.className = "taxallus-holat xato"; return "band"; }
    holatMatni.textContent = `✓ @${t} bo'sh`; holatMatni.className = "taxallus-holat bosh"; return null;
  };
  kirit.addEventListener("input", () => {
    qolda = true;
    const toza = kirit.value.toLowerCase().replace(/[^a-z0-9_@]/g, "");
    if (toza !== kirit.value) kirit.value = toza;
    clearTimeout(kechik); kechik = setTimeout(tekshir, 400);
  });
  if (kirit.value) setTimeout(tekshir, 0);
  return {
    el: quti, kirit, tekshir,
    qiymat: () => taxallusniTozala(kirit.value),
    ismdanTaklif: (ism) => { if (!qolda) { kirit.value = taxallusTaklifi(ism); clearTimeout(kechik); kechik = setTimeout(tekshir, 400); } },
  };
}

async function taxallusniSaqla(t) {
  const m = await mijozOl();
  const { error } = await m.from("profillar").update({ taxallus: t }).eq("id", mening.id);
  if (error) throw error.code === "23505" ? new Error("band") : error;
  profilniEsla({ ...mening, taxallus: t });
}
const haqiqiyBugun = Math.floor((Date.now() + 5 * 3600 * 1000) / 86400000);

function skriptYukla(src) {
  return new Promise((ok, yoq) => {
    const s = document.createElement("script");
    s.src = src; s.onload = ok; s.onerror = yoq;
    document.head.appendChild(s);
  });
}

async function mijozOl() {
  if (!BAZA_YOQIQ) return null;
  if (mijoz) return mijoz;
  if (window.__supabaseSinov) { mijoz = window.__supabaseSinov; return mijoz; }   // avtomatik sinovlar uchun
  if (!window.supabase) await skriptYukla(SUPABASE_SKRIPT);
  // pkce: Google'dan qaytganda kod manzilning ?code= qismida keladi (bizning #sahifa yo'llarimizga xalaqit bermaydi)
  mijoz = window.supabase.createClient(SUPABASE_URL, SUPABASE_KALIT, {
    auth: { flowType: "pkce", detectSessionInUrl: true, persistSession: true },
  });
  return mijoz;
}

// Ro'yxatdan o'tmasdan, anonim kirish: brauzer o'yinchini eslab qoladi
async function kirish() {
  const m = await mijozOl();
  const { data } = await m.auth.getSession();
  if (data && data.session) return data.session.user.id;
  const javob = await m.auth.signInAnonymously();
  if (javob.error) throw javob.error;
  return javob.data.user.id;
}

async function joriyFoydalanuvchi() {
  const m = await mijozOl();
  const { data } = await m.auth.getSession();
  return data && data.session ? data.session.user.id : null;
}

function profilniEsla(p) {
  mening = p;
  try { localStorage.setItem("kimAytganProfil", JSON.stringify(p)); } catch (e) {}
  if (typeof yuqoriAvatarniYangila === "function") yuqoriAvatarniYangila();
  setTimeout(() => { if (typeof profilTiliniYoz === "function") profilTiliniYoz(); }, 0);
}

function tasodifiyKod() {
  const belgilar = "abcdefghijkmnpqrstuvwxyz23456789";
  let kod = "";
  const sonlar = crypto.getRandomValues(new Uint32Array(6));
  sonlar.forEach((n) => { kod += belgilar[n % belgilar.length]; });
  return kod;
}

async function profilYarat(ism, taxallus) {
  const m = await mijozOl();
  const uid = await kirish();
  const bor = await m.from("profillar").select("id,kod,ism,taxallus,rasm").eq("id", uid).maybeSingle();
  if (bor.data) {
    const yangi = { ism, taxallus: taxallus || bor.data.taxallus };
    const { error } = await m.from("profillar").update(yangi).eq("id", uid);
    if (error && error.code === "23505") throw new Error("band");
    profilniEsla({ ...bor.data, ...yangi });
    return mening;
  }
  for (let urinish = 0; urinish < 5; urinish++) {
    const kod = tasodifiyKod();
    const { error } = await m.from("profillar").insert({ id: uid, kod, ism, taxallus: taxallus || null });
    if (!error) { profilniEsla({ id: uid, kod, ism, taxallus: taxallus || null }); return mening; }
    if (error.code !== "23505") throw error;
    if (/taxallus/.test(error.message || "")) throw new Error("band");   // taxallus band
    // aks holda kod band — boshqasini sinaymiz
  }
  throw new Error("Profil kodi yaratilmadi");
}

// Tugagan o'yin natijasini profilga yozish (kuniga bitta; sinov rejimida yozilmaydi)
async function natijaniYoz() {
  if (!BAZA_YOQIQ || SINOV || !mening || !holat.tugadi || holat.yuborildi) return;
  try {
    const m = await mijozOl();
    await kirish();
    const { error } = await m.from("oyinlar").insert({
      profil_id: mening.id, kun: holat.kun, yutdi: holat.yutdi, xatolar: xatolarSoni(),
    });
    if (!error || error.code === "23505") {
      holat.yuborildi = true; saqlash();
      if (typeof oyinSeriyasiniOl === "function") { oyinSeriyasi = null; oyinSeriyasiniOl(); }   // bugungi o'yin seriyaga qo'shildi
    }
  } catch (e) { /* internet yo'q — keyingi safar qayta urinamiz */ }
}

// Natija oynasidagi profil qismi: profil ochish yoki havolasini ko'rsatish
function profilQutiniChiz() {
  const quti = $("profilQuti");
  if (!BAZA_YOQIQ) { quti.classList.add("yashirin"); return; }
  quti.classList.remove("yashirin");
  quti.innerHTML = "";
  if (mening) {
    const p = document.createElement("p");
    p.textContent = "Profilingiz — do'stlaringiz kirib natijalaringizni ko'radi:";
    const a = document.createElement("a");
    a.href = profilIchkiHavola(mening);
    a.textContent = profilManzili(mening).replace(/^https?:\/\//, "");
    quti.append(p, a);
    if (!SINOV && holat.tugadi) {
      const b = document.createElement("p");
      const ball = holat.yutdi ? Math.max(25, 50 - 5 * xatolarSoni()) : 10;
      b.innerHTML = `Bugungi o'yin: <b>+${ball} ball</b> — <a href="#profilim/daraja">darajangizni ko'ring</a>`;
      quti.appendChild(b);
    }
    if (SINOV) {
      const s = document.createElement("p");
      s.textContent = "Sinov rejimi: bu o'yin natijasi profilga yozilmaydi.";
      quti.appendChild(s);
    }
    return;
  }
  const p = document.createElement("p");
  p.textContent = t("Natijangiz saqlanishi, reytingga kirish va do'stlaringizga ulashish uchun Google bilan profil oching — bir bosishda:");
  quti.append(p, googleKirishTugmasi("#kim-aytgan", t("Google bilan profil ochish")));
}

// Ketma-ket yutilgan kunlar
function seriyalar(oyinlar) {
  const yutgan = new Set(oyinlar.filter((o) => o.yutdi).map((o) => o.kun));
  let joriy = 0;
  let kun = yutgan.has(haqiqiyBugun) ? haqiqiyBugun : haqiqiyBugun - 1;
  while (yutgan.has(kun)) { joriy++; kun--; }
  let eng = 0, hozir = 0, oldingi = null;
  [...yutgan].sort((a, b) => a - b).forEach((k) => {
    hozir = oldingi !== null && k === oldingi + 1 ? hozir + 1 : 1;
    eng = Math.max(eng, hozir); oldingi = k;
  });
  return { joriy, eng };
}

// Profil banneri: 2 yoki 3 rangli gradient (bazada "#aabbcc,#ddeeff[,#112233]")
const BANNER_TOPLAMLARI = [
  "#4f5b3a,#7a6a3a,#a0552e", "#1f3b5c,#3f6e8c,#9cc3d5", "#5b2a4a,#a0455e,#e8a07a", "#0f4c3a,#2e8b57,#c8d96f",
  "#2b2d42,#5c4d7d,#c29ed8", "#7a1f1f,#c0392b,#f1c40f", "#3a2e1f,#8b6b3e,#e3c98d", "#14213d,#fca311",
  "#264653,#e9c46a", "#6d597a,#eaac8b", "#003049,#d62828", "#1b4332,#95d5b2",
];
const BANNER_RE = /^#[0-9a-f]{6}(,#[0-9a-f]{6}){1,2}$/;
function bannerRanginiQoy(el, ranglar) {
  const r = BANNER_RE.test(ranglar || "") ? ranglar : BANNER_TOPLAMLARI[0];
  el.style.background = `linear-gradient(135deg, ${r.split(",").join(", ")})`;
}
// Ikki rang o'rtasidagi rang (3-rang qo'shilganda)
function aralashRang(a, b) {
  const h = (x, i) => parseInt(x.slice(1 + i * 2, 3 + i * 2), 16);
  return "#" + [0, 1, 2].map((i) => Math.round((h(a, i) + h(b, i)) / 2).toString(16).padStart(2, "0")).join("");
}

// Ijtimoiy tarmoqlar: bazada faqat foydalanuvchi nomi saqlanadi, havola shu yerda yasaladi
const TARMOQLAR = [
  { k: "instagram", nom: "Instagram", misol: "username", re: /^[A-Za-z0-9._]{1,30}$/, url: (n) => "https://instagram.com/" + encodeURIComponent(n),
    hostlar: /^(www\.)?instagram\.com$/i,
    belgi: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/></svg>' },
  { k: "x", nom: "X", misol: "username", re: /^[A-Za-z0-9_]{1,15}$/, url: (n) => "https://x.com/" + encodeURIComponent(n),
    hostlar: /^(www\.)?(x|twitter)\.com$/i,
    belgi: '<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true"><path d="M17.8 3h3.1l-6.8 7.7L22 21h-6.2l-4.9-6.3L5.3 21H2.2l7.2-8.3L2 3h6.3l4.4 5.8L17.8 3zm-1.1 16.2h1.7L7.4 4.7H5.6l11.1 14.5z"/></svg>' },
  { k: "telegram", nom: "Telegram", misol: "username", re: /^[A-Za-z0-9_]{5,32}$/, url: (n) => "https://t.me/" + encodeURIComponent(n),
    hostlar: /^(www\.)?(t\.me|telegram\.me)$/i,
    belgi: '<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true"><path d="M21.4 3.6 2.9 10.8c-1.2.5-1.2 1.2 0 1.6l4.7 1.5 1.8 5.6c.2.6.4.8.9.8.4 0 .6-.2.9-.5l2.3-2.2 4.7 3.5c.9.5 1.5.2 1.7-.8l3.1-14.7c.3-1.3-.5-1.9-1.6-1.5zM9 13.6l9.2-5.8c.4-.3.8-.1.5.2l-7.6 6.9-.3 3.3L9 13.6z"/></svg>' },
];
// Kiritilganni tozalash: "@nom", "nom" yoki to'liq havola → nom; bo'sh → null; noto'g'ri → false
function tarmoqNomi(kirish, t) {
  let v = String(kirish || "").trim();
  if (!v) return null;
  if (/^(https?:\/\/)?[a-z0-9.-]+\.[a-z]{2,}\//i.test(v)) {
    try {
      const u = new URL(/^https?:/i.test(v) ? v : "https://" + v);
      if (!t.hostlar.test(u.hostname)) return false;
      v = u.pathname.split("/").filter(Boolean)[0] || "";
    } catch (e) { return false; }
  }
  v = v.replace(/^@/, "");
  return t.re.test(v) ? v : false;
}

// ?p=KOD — boshqa o'yinchining profil sahifasi
async function profilSahifasiniKor(kod) {
  const sahifa = $("profilSahifa");
  sahifa.classList.remove("yashirin");
  sahifa.innerHTML = '<p class="kichik-matn">Profil yuklanmoqda…</p>';
  if (!BAZA_YOQIQ) { sahifa.innerHTML = '<p class="kichik-matn">Profillar hali sozlanmagan.</p>'; return; }

  let profil, oyinlar, uid;
  try {
    const m = await mijozOl();
    const izlash = String(kod).toLowerCase();
    const p = izlash.startsWith("@")
      ? await m.from("profillar").select("id,kod,ism,taxallus,rasm,bio,instagram,x,telegram,banner").eq("taxallus", taxallusniTozala(izlash)).maybeSingle()
      : await m.from("profillar").select("id,kod,ism,taxallus,rasm,bio,instagram,x,telegram,banner").eq("kod", izlash).maybeSingle();
    profil = p.data;
    if (!profil) { sahifa.innerHTML = '<p class="kichik-matn">Bunday profil topilmadi.</p>'; return; }
    const [o, u] = await Promise.all([
      m.from("oyinlar").select("kun,yutdi,xatolar").eq("profil_id", profil.id).order("kun", { ascending: false }).limit(1000),
      joriyFoydalanuvchi(),
    ]);
    oyinlar = o.data || []; uid = u;
  } catch (e) {
    sahifa.innerHTML = '<p class="kichik-matn">Profilni yuklab bo\'lmadi — internetni tekshiring.</p>';
    return;
  }

  const jami = oyinlar.length;
  const yutganlar = oyinlar.filter((o) => o.yutdi);
  const foiz = jami ? Math.round((yutganlar.length / jami) * 100) : 0;
  const ortachaXato = yutganlar.length
    ? (yutganlar.reduce((s, o) => s + o.xatolar, 0) / yutganlar.length).toFixed(1).replace(".0", "") : "—";
  const { joriy, eng } = seriyalar(oyinlar);
  const ozimniki = uid && uid === profil.id;

  sahifa.innerHTML = "";
  const el = (teg, sinf, matn) => { const e = document.createElement(teg); if (sinf) e.className = sinf; if (matn != null) e.textContent = matn; return e; };

  // ---- Bosh qism: banner, rasm, ism, daraja ----
  const banner = el("div", "profil-banner");
  bannerRanginiQoy(banner, profil.banner);
  if (ozimniki) {
    const tahrir = el("button", "banner-tugma", "✎"); tahrir.type = "button";
    tahrir.title = "Profilni tahrirlash"; tahrir.setAttribute("aria-label", "Profilni tahrirlash");
    tahrir.addEventListener("click", () => tahrirOch());
    banner.appendChild(tahrir);
  }
  sahifa.appendChild(banner);

  const bosh = el("div", "profil-bosh");
  if (typeof avatarEl === "function") {
    const rasmQuti = el("div", "profil-avatar");
    const chizRasm = () => {
      rasmQuti.innerHTML = "";
      const a = avatarEl(profil, 104, "katta");
      if (ozimniki) {
        const b = el("button", "avatar-tugma"); b.type = "button"; b.setAttribute("aria-label", "Profil rasmini o'zgartirish");
        b.append(a, el("span", "avatar-qalam", profil.rasm ? "✎" : "+"));
        b.addEventListener("click", () => avatarTanlash(profil, chizRasm));
        rasmQuti.appendChild(b);
      } else rasmQuti.appendChild(a);
    };
    chizRasm();
    bosh.appendChild(rasmQuti);
  }
  bosh.appendChild(el("h2", "", profil.ism));
  const ostiQator = el("div", "profil-osti");
  if (profil.taxallus) ostiQator.appendChild(el("span", "taxallus-yozuv", "@" + profil.taxallus));
  if (typeof darajaYorligi === "function") ostiQator.appendChild(darajaYorligi(profil.id));
  bosh.appendChild(ostiQator);
  if (ozimniki && (!mening || mening.taxallus !== profil.taxallus || mening.rasm !== profil.rasm)) profilniEsla({ id: profil.id, kod: profil.kod, ism: profil.ism, taxallus: profil.taxallus, rasm: profil.rasm || null });

  // Raqamlar: iqtibos, yoqtirma, kitobdosh
  const raqamlar = el("div", "profil-raqamlar");
  const raqam = (son, nom, href) => {
    const r = el(href ? "a" : "div", "raqam"); if (href) r.href = href;
    r.append(el("b", "", String(son)), el("span", "", nom)); return r;
  };
  const iq = raqam("–", "iqtibos"), yo = raqam("–", "yoqtirma"), kd = raqam("–", "kitobdosh", ozimniki ? "#kitobdoshlar" : null);
  raqamlar.append(iq, yo, kd);
  bosh.appendChild(raqamlar);
  (async () => {
    try {
      const m = await mijozOl();
      const { data } = await m.rpc("profil_statistikasi", { p: profil.id });
      if (data && data[0]) {
        iq.firstChild.textContent = data[0].iqtiboslar; yo.firstChild.textContent = data[0].yoqtirmalar; kd.firstChild.textContent = data[0].kitobdoshlar;
      }
    } catch (e) { /* jim */ }
  })();

  if (profil.bio) bosh.appendChild(el("p", "profil-bio", profil.bio));

  // Ijtimoiy tarmoqlar
  const tarmoqlar = el("div", "profil-tarmoqlar");
  TARMOQLAR.forEach((t) => {
    const nom = profil[t.k];
    if (nom) {
      const a = el("a", "tarmoq"); a.href = t.url(nom); a.target = "_blank"; a.rel = "noopener noreferrer nofollow";
      a.innerHTML = t.belgi; a.appendChild(el("span", "", t.k === "telegram" || t.k === "x" ? "@" + nom : nom));
      a.title = t.nom; tarmoqlar.appendChild(a);
    } else if (ozimniki) {
      const b = el("button", "tarmoq qoshish"); b.type = "button";
      b.append("+ ", t.nom); b.addEventListener("click", () => tahrirOch(t.k)); tarmoqlar.appendChild(b);
    }
  });
  if (tarmoqlar.childNodes.length) bosh.appendChild(tarmoqlar);

  // Amallar: kitobdosh + ulashish
  const amallar = el("div", "profil-amallar");
  if (ozimniki) amallar.appendChild(havola("#kitobdoshlar", "amal-asosiy", "👥 Kitobdosh qo'shish"));
  else if (typeof kitobdoshTugmasi === "function") amallar.appendChild(kitobdoshTugmasi(profil));
  const ulash = el("button", "amal-doira", "↗"); ulash.type = "button";
  ulash.title = "Profilni ulashish"; ulash.setAttribute("aria-label", "Profilni ulashish");
  ulash.addEventListener("click", async () => {
    const url = profilManzili(profil);
    try { if (navigator.share) { await navigator.share({ title: profil.ism + " — sitata.uz", url }); return; } } catch (e) { return; }
    try { await navigator.clipboard.writeText(url); ulash.textContent = "✓"; setTimeout(() => (ulash.textContent = "↗"), 1500); } catch (e) { prompt("Havolani nusxalang:", url); }
  });
  amallar.appendChild(ulash);
  bosh.appendChild(amallar);
  if (ozimniki && typeof xulosaTugmasi === "function") bosh.appendChild(xulosaTugmasi());

  // Tahrirlash oynasi (bio va tarmoqlar)
  const tahrirQuti = el("div", "profil-tahrir yashirin");
  bosh.appendChild(tahrirQuti);
  function tahrirOch(fokus) {
    tahrirQuti.innerHTML = ""; tahrirQuti.classList.remove("yashirin");
    tahrirQuti.appendChild(el("b", "", "Profilni tahrirlash"));
    const bio = el("textarea", "matn-maydon"); bio.maxLength = 160; bio.rows = 2; bio.placeholder = "O'zingiz haqingizda qisqacha (sevimli kitob, janr…)";
    bio.value = profil.bio || "";
    const hisob = el("small", "kichik-matn");
    const sana = () => (hisob.textContent = `${bio.value.length} / 160`); sana(); bio.addEventListener("input", sana);
    tahrirQuti.append(bio, hisob);
    // Banner ranglari: tayyor to'plamlar yoki 2–3 ta o'z rangingiz
    let ranglar = (profil.banner || BANNER_TOPLAMLARI[0]).split(",");
    const rangQism = el("div", "banner-tanlov");
    rangQism.appendChild(el("span", "kichik-matn", "Banner rangi"));
    const namuna = el("div", "banner-namuna");
    const toplamlar = el("div", "banner-toplamlar");
    const ozim = el("div", "banner-ozim");
    const yangilaRang = () => {
      bannerRanginiQoy(namuna, ranglar.join(",")); bannerRanginiQoy(banner, ranglar.join(","));
      [...toplamlar.children].forEach((b) => b.classList.toggle("faol", b.dataset.r === ranglar.join(",")));
      ozimChiz();
    };
    BANNER_TOPLAMLARI.forEach((t) => {
      const b = el("button", "banner-toplam"); b.type = "button"; b.dataset.r = t; b.setAttribute("aria-label", "Rang to'plami");
      bannerRanginiQoy(b, t);
      b.addEventListener("click", () => { ranglar = t.split(","); yangilaRang(); });
      toplamlar.appendChild(b);
    });
    function ozimChiz() {
      ozim.innerHTML = "";
      ranglar.forEach((r, i) => {
        const inp = el("input", "rang-tanla"); inp.type = "color"; inp.value = r; inp.setAttribute("aria-label", (i + 1) + "-rang");
        inp.addEventListener("input", () => { ranglar[i] = inp.value.toLowerCase(); bannerRanginiQoy(namuna, ranglar.join(",")); bannerRanginiQoy(banner, ranglar.join(",")); [...toplamlar.children].forEach((b) => b.classList.remove("faol")); });
        ozim.appendChild(inp);
      });
      const almash = el("button", "matn-tugma", ranglar.length === 2 ? "3 ta rang qilish" : "2 ta rang qilish"); almash.type = "button";
      almash.addEventListener("click", () => {
        ranglar = ranglar.length === 2 ? [ranglar[0], aralashRang(ranglar[0], ranglar[1]), ranglar[1]] : [ranglar[0], ranglar[2]];
        yangilaRang();
      });
      ozim.appendChild(almash);
    }
    rangQism.append(namuna, toplamlar, ozim);
    tahrirQuti.appendChild(rangQism);
    yangilaRang();
    const maydonlar = {};
    TARMOQLAR.forEach((t) => {
      const q = el("label", "tarmoq-maydon");
      q.innerHTML = t.belgi;
      const i = el("input", "matn-maydon bir-qator"); i.placeholder = t.nom + " — " + t.misol; i.value = profil[t.k] || "";
      i.autocapitalize = "off"; i.spellcheck = false; i.setAttribute("aria-label", t.nom);
      q.appendChild(i); tahrirQuti.appendChild(q); maydonlar[t.k] = i;
    });
    const tx = el("p", "kichik-matn");
    const saqla = el("button", "asosiy", "Saqlash"); saqla.type = "button";
    const bekor = el("button", "matn-tugma", "Bekor qilish"); bekor.type = "button";
    bekor.addEventListener("click", () => { tahrirQuti.classList.add("yashirin"); bannerRanginiQoy(banner, profil.banner); });
    saqla.addEventListener("click", async () => {
      const q = { bio: bio.value.trim().slice(0, 160) || null, banner: ranglar.join(",") === BANNER_TOPLAMLARI[0] ? null : ranglar.join(",") };
      for (const t of TARMOQLAR) {
        const v = tarmoqNomi(maydonlar[t.k].value, t);
        if (v === false) { tx.textContent = `${t.nom} nomi noto'g'ri — faqat foydalanuvchi nomini yoki havolani kiriting.`; maydonlar[t.k].focus(); return; }
        q[t.k] = v;
      }
      saqla.disabled = true; tx.textContent = "Saqlanmoqda…";
      try {
        const m = await mijozOl();
        const { error } = await m.from("profillar").update(q).eq("id", profil.id);
        if (error) throw error;
        profilSahifasiniKor(kod);
      } catch (e) { saqla.disabled = false; tx.textContent = "Saqlanmadi — qayta urinib ko'ring."; }
    });
    const tugmalar = el("div", "tahrir-tugmalar"); tugmalar.append(saqla, bekor);
    tahrirQuti.append(tx, tugmalar);
    (fokus ? maydonlar[fokus] : bio).focus();
    tahrirQuti.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }
  sahifa.appendChild(bosh);

  // ---- Bo'limlar: Javon | O'yin ----
  const tablar = el("div", "profil-tablar");
  const tana = el("div", "profil-tab-tana");
  const tabTugma = (nom, chiz) => {
    const b = el("button", "", nom); b.type = "button";
    b.addEventListener("click", () => { [...tablar.children].forEach((x) => x.classList.toggle("faol", x === b)); tana.innerHTML = ""; chiz(); });
    tablar.appendChild(b); return b;
  };
  const javonTab = tabTugma("📚 Javon", () => {
    if (typeof javonQismi === "function") tana.appendChild(javonQismi(profil, ozimniki));
  });
  tabTugma("🏅 Nishonlar", async () => {
    if (typeof nishonlarQismi === "function") tana.appendChild(nishonlarQismi(await mijozOl(), profil, ozimniki));
  });
  tabTugma("🎮 O'yin", () => {
    const statlar = el("div", "statlar");
    [[jami, "o'yin"], [foiz + "%", "topgan"], [ortachaXato, "o'rtacha xato"],
     [joriy, "joriy seriya"], [eng, "eng uzun seriya"], [yutganlar.length, "topilgan"]].forEach(([son, nom]) => {
      const s = el("div", "stat"); s.append(el("b", "", String(son)), el("span", "", nom)); statlar.appendChild(s);
    });
    tana.appendChild(statlar);
    if (jami) {
      tana.appendChild(el("p", "kichik-matn", "Oxirgi o'yinlar"));
      const oxirgilar = el("div", "oxirgilar");
      oyinlar.slice(0, 14).reverse().forEach((o) => {
        const i = el("i", o.yutdi ? "" : "yoq");
        i.title = o.yutdi ? `topgan, ${o.xatolar} xato` : "topa olmagan";
        oxirgilar.appendChild(i);
      });
      tana.appendChild(oxirgilar);
    }
    const oyna = el("a", "asosiy", ozimniki ? "Bugungi o'yinga o'tish" : "O'zingiz ham o'ynab ko'ring");
    oyna.href = ozimniki ? "#kim-aytgan" : SAYT_MANZILI + "#kim-aytgan";
    tana.appendChild(oyna);
  });
  sahifa.append(tablar, tana);
  javonTab.click();

  // ---- Sozlamalar (faqat o'zi) ----
  if (ozimniki) {
    const soz = el("details", "profil-sozlamalar");
    soz.appendChild(el("summary", "", "⚙ Sozlamalar"));
    soz.appendChild(taxallusQutisi(profil));
    soz.appendChild(hisobQutisi());
    if (typeof telegramQutisi === "function") soz.appendChild(telegramQutisi());
    if (typeof eslatmaQutisi === "function") soz.appendChild(eslatmaQutisi());
    soz.append(havola("maxfiylik.html", "matn-tugma", "Maxfiylik siyosati"), hisobniOchirishQutisi(profil));
    sahifa.appendChild(soz);
    const sozYoli = (location.hash.match(/\/(sozlamalar|hisob)$/) || [])[1];   // #profilim/sozlamalar (#telegram) yoki #profilim/hisob («Kirish»)
    if (sozYoli) {
      soz.open = true;
      const nishon = sozYoli === "hisob" ? ".hisob-quti" : ".telegram-quti";
      setTimeout(() => (soz.querySelector(nishon) || soz).scrollIntoView({ block: "center", behavior: "smooth" }), 400);
    }
  }
}


// ===== GOOGLE ORQALI KIRISH =====
// Anonim profil Google hisobiga bog'lanadi (ID o'zgarmaydi — natijalar, kitobdoshlar saqlanadi).
// Boshqa qurilmada «Google orqali kirish» o'sha profilni ochadi.
// Supabase'da: Google provayderi yoqilgan, «Manual linking» yoqilgan, Redirect URLs'da sayt manzili bo'lishi kerak.
let kirishXatosi = null;   // Google'dan xato bilan qaytilganda ko'rsatiladi

async function sessiyaOl() {
  if (!BAZA_YOQIQ) return null;
  const m = await mijozOl();
  const { data } = await m.auth.getSession();
  return data && data.session ? data.session.user : null;
}

function googleKelganYol(keyin) { try { sessionStorage.setItem("sitataKirishdanKeyin", keyin); } catch (e) {} }

// Joriy anonim profilni Google'ga bog'lash
async function googleBilanBogla(xabar, keyin = "#profilim") {
  const m = await mijozOl();
  googleKelganYol(keyin);
  const { error } = await m.auth.linkIdentity({ provider: "google", options: { redirectTo: SAYT_MANZILI } });
  if (error) xabar.textContent = /manual linking/i.test(error.message || "")
    ? "Google bilan bog'lash hozircha yoqilmagan — birozdan keyin qayta urinib ko'ring."
    : "Bog'lab bo'lmadi: " + error.message;
}

// Google hisobi orqali kirish (boshqa qurilmada yoki brauzer tozalangandan keyin)
async function googleBilanKir(xabar, keyin = "#profilim") {
  const m = await mijozOl();
  googleKelganYol(keyin);
  const { error } = await m.auth.signInWithOAuth({ provider: "google", options: { redirectTo: SAYT_MANZILI } });
  if (error) xabar.textContent = "Kirib bo'lmadi: " + error.message;
}

// Sessiyadagi foydalanuvchiga mos profilni yuklab, shu brauzerda eslab qolish
async function profilniSinxronla(uid) {
  if (mening && mening.id === uid) return;
  const m = await mijozOl();
  const { data } = await m.from("profillar").select("id,kod,ism,taxallus,rasm").eq("id", uid).maybeSingle();
  if (data) profilniEsla(data);
  else { mening = null; try { localStorage.removeItem("kimAytganProfil"); } catch (e) {} }
}

// Google bilan birinchi marta kirganda: Google'dagi ism bilan profil ochamiz (email ishlatilmaydi)
async function googledanProfilOch(user) {
  const md = user.user_metadata || {};
  const toliq = String(md.full_name || md.name || "").trim();
  const ism = (String(md.given_name || "").trim() || toliq.split(/\s+/)[0] || "Kitobxon").slice(0, 30);
  const taxallus = await boshTaxallus(toliq || ism);
  try { await profilYarat(ism, taxallus); }
  catch (e) { try { await profilYarat(ism, null); } catch (e2) { kirishXatosi = "Profil ochilmadi — qayta urinib ko'ring."; } }
}

// Umumiy «Google bilan kirish» tugmasi: yangi odamga profil ochiladi, eskisiga — o'z profili
function googleKirishTugmasi(keyin, matn = "Google bilan kirish") {
  const q = document.createElement("div"); q.className = "google-kirish";
  const b = document.createElement("button"); b.type = "button"; b.className = "google-tugma";
  b.innerHTML = '<span class="g-belgi" aria-hidden="true">G</span> ';
  b.appendChild(document.createTextNode(matn));
  const x = document.createElement("p"); x.className = "kichik-matn"; x.textContent = kirishXatosi || ""; kirishXatosi = null;
  b.addEventListener("click", () => { b.disabled = true; googleBilanKir(x, keyin || location.hash || "#profilim").finally(() => { b.disabled = false; }); });
  q.append(b, x);
  return q;
}

// Ism bilan ochilgan (Google'ga bog'lanmagan) profil — Google bilan bog'lashni so'raymiz.
// Har tashrifda bir marta; «Keyinroq» desa, shu tashrif davomida qayta chiqmaydi.
async function anonimProfilniTekshir() {
  if (!BAZA_YOQIQ || !mening) return;
  try { if (sessionStorage.getItem("sitataBoglashKeyin")) return; } catch (e) {}
  const user = await sessiyaOl().catch(() => null);
  if (!user || !user.is_anonymous || user.id !== mening.id) return;
  const oyna = document.createElement("div"); oyna.className = "boglash-oyna"; oyna.setAttribute("role", "dialog"); oyna.setAttribute("aria-modal", "true");
  const quti = document.createElement("div"); quti.className = "boglash-quti";
  const sar = document.createElement("h3"); sar.textContent = "Profilingizni Google'ga bog'lang";
  const t = document.createElement("p");
  t.textContent = `${mening.ism}, endi profillar Google hisobi orqali ishlaydi. Bog'lasangiz, barcha natijalaringiz, javoningiz va guruhlaringiz saqlanib qoladi hamda istalgan telefon yoki kompyuterdan kira olasiz.`;
  const x = document.createElement("p"); x.className = "kichik-matn";
  const b = document.createElement("button"); b.type = "button"; b.className = "google-tugma";
  b.innerHTML = '<span class="g-belgi" aria-hidden="true">G</span> Google bilan bog\'lash';
  b.addEventListener("click", () => { b.disabled = true; googleBilanBogla(x, location.hash || "#profilim").finally(() => { b.disabled = false; }); });
  const keyin = document.createElement("button"); keyin.type = "button"; keyin.className = "matn-tugma"; keyin.textContent = "Keyinroq";
  keyin.addEventListener("click", () => { try { sessionStorage.setItem("sitataBoglashKeyin", "1"); } catch (e) {} oyna.remove(); });
  quti.append(sar, t, b, x, keyin);
  oyna.appendChild(quti);
  document.body.appendChild(oyna);
}

// Google'dan qaytishni sahifa yuklanganda qayta ishlash (?code=... yoki ?error_description=...)
async function kirishQaytishiniTugat() {
  const q = new URLSearchParams(location.search);
  const xato = q.get("error_description") || new URLSearchParams(location.hash.slice(1)).get("error_description");
  if (!BAZA_YOQIQ || (!q.has("code") && !xato)) return;
  let keyin = "#profilim";
  try { keyin = sessionStorage.getItem("sitataKirishdanKeyin") || keyin; sessionStorage.removeItem("sitataKirishdanKeyin"); } catch (e) {}
  if (xato) {
    kirishXatosi = /already|linked|exists/i.test(xato)
      ? "Bu Google hisobi boshqa profilga bog'langan. O'sha profilni ochish uchun «Google orqali kirish»ni bosing."
      : "Google orqali kirib bo'lmadi: " + xato;
  } else {
    try {
      const user = await sessiyaOl();          // mijoz yaratilganda kod sessiyaga almashtiriladi
      if (user) await profilniSinxronla(user.id);
      if (user && !mening && !user.is_anonymous) await googledanProfilOch(user);
    } catch (e) { kirishXatosi = "Google orqali kirib bo'lmadi — qayta urinib ko'ring."; }
  }
  history.replaceState(null, "", location.pathname + keyin);
}

// O'z profil sahifasidagi hisob qutisi
function hisobQutisi() {
  const quti = document.createElement("div");
  quti.className = "hisob-quti";
  const xabar = document.createElement("p"); xabar.className = "kichik-matn";
  (async () => {
    const user = await sessiyaOl();
    if (!user) return;
    if (kirishXatosi) { xabar.textContent = kirishXatosi; kirishXatosi = null; }
    if (user.is_anonymous) {
      const p = document.createElement("p"); p.className = "kichik-matn";
      p.textContent = "Profilingiz hozir faqat shu brauzerda saqlanadi. Google hisobingizga bog'lang — boshqa telefon yoki kompyuterdan ham kira olasiz.";
      const b = document.createElement("button"); b.type = "button"; b.className = "google-tugma";
      b.innerHTML = '<span class="g-belgi" aria-hidden="true">G</span> Google bilan bog\'lash';
      b.addEventListener("click", () => { b.disabled = true; googleBilanBogla(xabar).finally(() => { b.disabled = false; }); });
      const boshqa = document.createElement("button"); boshqa.type = "button"; boshqa.className = "matn-tugma";
      boshqa.textContent = "Boshqa qurilmada Google'ga bog'langan profilim bor — Google orqali kirish";
      boshqa.addEventListener("click", () => {
        if (!confirm("Google orqali kirsangiz, shu brauzerdagi hozirgi profil o'rniga Google'ga bog'langan profilingiz ochiladi. Davom etasizmi?")) return;
        googleBilanKir(xabar);
      });
      quti.append(p, b, boshqa, xabar);
    } else {
      const p = document.createElement("p"); p.className = "kichik-matn";
      p.textContent = "✓ Google hisobiga bog'langan" + (user.email ? ": " + user.email : "");
      const chiq = document.createElement("button"); chiq.type = "button"; chiq.className = "matn-tugma"; chiq.textContent = "Shu qurilmadan chiqish";
      chiq.addEventListener("click", async () => {
        if (!confirm("Shu qurilmadan chiqasizmi? Keyin Google orqali qayta kirishingiz mumkin.")) return;
        const m = await mijozOl();
        await m.auth.signOut();
        mening = null;
        try { localStorage.removeItem("kimAytganProfil"); } catch (e) {}
        location.hash = "#profilim"; location.reload();
      });
      quti.append(p, chiq, xabar);
    }
  })();
  return quti;
}

// ---------- Hisobni butunlay o'chirish ----------
// Avval xotiradagi fayllar (kitoblar, rasmlar, guruh materiallari), keyin hisob (hisobni_ochir → barcha yozuvlar).
async function papkaniTozala(m, bucket, papka) {
  for (let urinish = 0; urinish < 20; urinish++) {
    const { data } = await m.storage.from(bucket).list(papka, { limit: 100 });
    const yollar = (data || []).filter((f) => f.id).map((f) => papka + "/" + f.name);
    if (!yollar.length) return;
    await m.storage.from(bucket).remove(yollar);
  }
}
function hisobniOchirishQutisi(profil) {
  const quti = yarat("div", "hisob-ochir");
  const b = yarat("button", "matn-tugma xavfli", "Hisobni o'chirish"); b.type = "button";
  const xabar = yarat("p", "kichik-matn");
  b.addEventListener("click", async () => {
    if (!confirm("Hisobingiz butunlay o'chiriladi: profil, natijalar, javon va kitob fayllari, iqtiboslar, kitobdoshlar, siz ochgan guruhlar. Buni qaytarib bo'lmaydi. Davom etasizmi?")) return;
    const javob = prompt("Tasdiqlash uchun «O'CHIRISH» deb yozing:");
    if (!javob || javob.trim().toUpperCase().replace(/[‘’ʻʼ`]/g, "'") !== "O'CHIRISH") { xabar.textContent = "Bekor qilindi."; return; }
    b.disabled = true; xabar.textContent = "O'chirilmoqda…";
    try {
      const m = await mijozOl();
      const uid = await kirish();
      if (uid !== profil.id) throw new Error("boshqa");
      const { data: guruhlar } = await m.rpc("guruhlarim");
      for (const g of (guruhlar || []).filter((x) => x.egasi === uid)) await papkaniTozala(m, "guruh-fayllar", String(g.id));
      for (const bucket of ["kitoblar", "iqtibos-rasmlar", "avatarlar"]) await papkaniTozala(m, bucket, uid);
      const { error } = await m.rpc("hisobni_ochir");
      if (error) throw error;
      await m.auth.signOut().catch(() => {});
      mening = null;
      try { Object.keys(localStorage).filter((k) => /^(kimAytgan|sitata)/.test(k)).forEach((k) => localStorage.removeItem(k)); } catch (e) {}
      alert("Hisobingiz o'chirildi.");
      location.hash = "#lenta"; location.reload();
    } catch (e) {
      b.disabled = false;
      xabar.textContent = "O'chirib bo'lmadi — internetni tekshirib, qayta urinib ko'ring.";
    }
  });
  quti.append(b, xabar);
  return quti;
}

// O'z profilida: taxallus tanlash yoki o'zgartirish
function taxallusQutisi(profil) {
  const quti = document.createElement("div"); quti.className = "taxallus-quti";
  const forma = (sarlavha) => {
    quti.innerHTML = "";
    const p = document.createElement("p"); p.className = "kichik-matn"; p.textContent = sarlavha;
    const tx = taxallusMaydoni(profil.taxallus || taxallusTaklifi(profil.ism));
    const saqla = document.createElement("button"); saqla.type = "button"; saqla.className = "kichik"; saqla.textContent = "Saqlash";
    const xabar = document.createElement("p"); xabar.className = "kichik-matn";
    saqla.addEventListener("click", async () => {
      if (await tx.tekshir()) return;
      saqla.disabled = true;
      try { await taxallusniSaqla(tx.qiymat()); location.hash = "#@" + tx.qiymat(); if (joriyYol().nom === "profilim") sahifaniKor(); }
      catch (e) { saqla.disabled = false; xabar.textContent = e.message === "band" ? "Bu taxallus band — boshqasini tanlang." : "Saqlanmadi — qayta urinib ko'ring."; }
    });
    quti.append(p, tx.el, saqla, xabar);
  };
  if (!profil.taxallus) {
    forma("Taxallus tanlang — do'stlaringiz sizni @taxallus orqali topadi, profilingiz manzili esa sitata.uz/taxallus bo'ladi.");
  } else {
    const havola = document.createElement("p"); havola.className = "kichik-matn";
    havola.append(document.createTextNode("Profilingiz manzili: "));
    const b = document.createElement("b"); b.textContent = profilManzili(profil).replace(/^https?:\/\//, ""); havola.appendChild(b);
    const ozgartir = document.createElement("button"); ozgartir.type = "button"; ozgartir.className = "matn-tugma"; ozgartir.textContent = "taxallusni o'zgartirish";
    ozgartir.addEventListener("click", () => forma("Yangi taxallus (eski havolalar ishlamay qoladi):"));
    havola.append(document.createTextNode(" · "), ozgartir);
    quti.appendChild(havola);
  }
  return quti;
}

// Tanlangan tilni profilga yozamiz — Telegram va push xabarlari shu tilda keladi
async function profilTiliniYoz() {
  if (!mening || !mening.id) return;
  const belgi = mening.id + ":" + TIL;
  try { if (localStorage.getItem("sitataTilYozildi") === belgi) return; } catch (e) {}
  try {
    const m = await mijozOl();
    if (!m) return;
    const { error } = await m.from("profillar").update({ til: TIL }).eq("id", mening.id);
    if (!error) try { localStorage.setItem("sitataTilYozildi", belgi); } catch (e) {}
  } catch (e) {}
}

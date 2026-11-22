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
// Profil manzillari: tashqariga ulashish uchun sitata.uz/@taxallus (404.html yo'naltiradi), sayt ichida #@taxallus
const profilManzili = (p) => (p && p.taxallus ? SAYT_MANZILI + "@" + p.taxallus : profilHavolasi(p ? p.kod : ""));
const profilIchkiHavola = (p) => (p && p.taxallus ? "#@" + p.taxallus : "?p=" + (p ? p.kod : ""));

// ---------- Taxallus (@foydalanuvchi_nomi) ----------
const TAXALLUS_SHAKLI = /^[a-z0-9_]{3,20}$/;
const BAND_TAXALLUSLAR = ["admin", "sitata", "sitatauz", "support", "yordam", "moderator", "null", "undefined", "profil", "reyting"];
const taxallusniTozala = (t) => String(t || "").trim().toLowerCase().replace(/^@+/, "");
function taxallusTaklifi(ism) {
  let t = String(ism || "").toLowerCase().replace(/([og])['ʻʼ‘’`]/g, "$1").replace(/[^a-z0-9_]/g, "");
  if (t.length < 3) t = (t + "kitobxon").slice(0, 8);
  return t.slice(0, 20);
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
  const bor = await m.from("profillar").select("id,kod,ism,taxallus").eq("id", uid).maybeSingle();
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
    if (!error || error.code === "23505") { holat.yuborildi = true; saqlash(); }
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
    p.textContent = "Profilingiz — do'stlaringiz kirib natijalaringizni ko'radi va baho beradi:";
    const a = document.createElement("a");
    a.href = profilIchkiHavola(mening);
    a.textContent = profilManzili(mening).replace(/^https?:\/\//, "");
    quti.append(p, a);
    if (SINOV) {
      const s = document.createElement("p");
      s.textContent = "Sinov rejimi: bu o'yin natijasi profilga yozilmaydi.";
      quti.appendChild(s);
    }
    return;
  }
  const p = document.createElement("p");
  p.textContent = "Profil oching — ulashganingizda havolasi ham qo'shiladi, do'stlaringiz kirib baho beradi.";
  const qator = document.createElement("div");
  qator.className = "qator";
  const kirit = document.createElement("input");
  kirit.placeholder = "Ismingiz";
  kirit.maxLength = 30;
  kirit.autocomplete = "nickname";
  const tx = taxallusMaydoni("");
  kirit.addEventListener("input", () => tx.ismdanTaklif(kirit.value));
  const tugma = document.createElement("button");
  tugma.type = "button";
  tugma.className = "kichik";
  tugma.textContent = "Profil ochish";
  const xato = document.createElement("p");
  tugma.addEventListener("click", async () => {
    const ism = kirit.value.trim();
    if (!ism) { xato.textContent = "Ismingizni yozing."; kirit.focus(); return; }
    if (await tx.tekshir()) { xato.textContent = "Taxallusni tuzating."; tx.kirit.focus(); return; }
    tugma.disabled = true; tugma.textContent = "Ochilmoqda…"; xato.textContent = "";
    try {
      await profilYarat(ism, tx.qiymat());
      await natijaniYoz();
      natijaFayli = null; natijaFaylObj = null;       // rasmga profil havolasini qo'shamiz
      await natijaRasminiTayyorla();
      profilQutiniChiz();
    } catch (e) {
      tugma.disabled = false; tugma.textContent = "Profil ochish";
      xato.textContent = e.message === "band" ? "Bu taxallus band — boshqasini tanlang." : "Profil ochilmadi — internetni tekshirib, qayta urinib ko'ring.";
    }
  });
  kirit.addEventListener("keydown", (e) => { if (e.key === "Enter") tugma.click(); });
  qator.append(kirit);
  quti.append(p, qator, tx.el, tugma, xato);
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

// ?p=KOD — boshqa o'yinchining profil sahifasi
async function profilSahifasiniKor(kod) {
  const sahifa = $("profilSahifa");
  sahifa.classList.remove("yashirin");
  sahifa.innerHTML = '<p class="kichik-matn">Profil yuklanmoqda…</p>';
  if (!BAZA_YOQIQ) { sahifa.innerHTML = '<p class="kichik-matn">Profillar hali sozlanmagan.</p>'; return; }

  let profil, oyinlar, baholar, uid;
  try {
    const m = await mijozOl();
    const izlash = String(kod).toLowerCase();
    const p = izlash.startsWith("@")
      ? await m.from("profillar").select("id,kod,ism,taxallus").eq("taxallus", taxallusniTozala(izlash)).maybeSingle()
      : await m.from("profillar").select("id,kod,ism,taxallus").eq("kod", izlash).maybeSingle();
    profil = p.data;
    if (!profil) { sahifa.innerHTML = '<p class="kichik-matn">Bunday profil topilmadi.</p>'; return; }
    const [o, b, u] = await Promise.all([
      m.from("oyinlar").select("kun,yutdi,xatolar").eq("profil_id", profil.id).order("kun", { ascending: false }).limit(1000),
      m.from("baholar").select("baho,baholovchi").eq("profil_id", profil.id),
      joriyFoydalanuvchi(),
    ]);
    oyinlar = o.data || []; baholar = b.data || []; uid = u;
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
  const ortachaBaho = baholar.length ? (baholar.reduce((s, b) => s + b.baho, 0) / baholar.length) : 0;
  const meningBaham = uid ? (baholar.find((b) => b.baholovchi === uid) || {}).baho || 0 : 0;
  const ozimniki = uid && uid === profil.id;

  sahifa.innerHTML = "";
  const el = (teg, sinf, matn) => { const e = document.createElement(teg); if (sinf) e.className = sinf; if (matn != null) e.textContent = matn; return e; };

  sahifa.appendChild(el("p", "kichik-matn", "«Kim aytgan?» o'yinchisi"));
  sahifa.appendChild(el("h2", "", profil.ism));
  if (profil.taxallus) sahifa.appendChild(el("p", "taxallus-yozuv", "@" + profil.taxallus));
  if (ozimniki) {
    if (!mening || mening.taxallus !== profil.taxallus) profilniEsla({ id: profil.id, kod: profil.kod, ism: profil.ism, taxallus: profil.taxallus });
    sahifa.appendChild(taxallusQutisi(profil));
  }

  const statlar = el("div", "statlar");
  [[jami, "o'yin"], [foiz + "%", "topgan"], [ortachaXato, "o'rtacha xato"],
   [joriy, "joriy seriya"], [eng, "eng uzun seriya"], [yutganlar.length, "topilgan"]].forEach(([son, nom]) => {
    const s = el("div", "stat"); s.append(el("b", "", String(son)), el("span", "", nom)); statlar.appendChild(s);
  });
  sahifa.appendChild(statlar);

  if (jami) {
    sahifa.appendChild(el("p", "kichik-matn", "Oxirgi o'yinlar"));
    const oxirgilar = el("div", "oxirgilar");
    oyinlar.slice(0, 14).reverse().forEach((o) => {
      const i = el("i", o.yutdi ? "" : "yoq");
      i.title = o.yutdi ? `topgan, ${o.xatolar} xato` : "topa olmagan";
      oxirgilar.appendChild(i);
    });
    sahifa.appendChild(oxirgilar);
  }

  sahifa.appendChild(el("div", "baho-ortacha",
    baholar.length ? `★ ${ortachaBaho.toFixed(1)}  ·  ${baholar.length} ta baho` : "Hali baho berilmagan"));

  const xabar = el("p", "kichik-matn");
  if (ozimniki) {
    xabar.textContent = "Bu sizning profilingiz — havolani ulashing, do'stlaringiz baho bersin.";
    sahifa.appendChild(hisobQutisi());
  } else {
    xabar.textContent = meningBaham ? "Bahoingizni o'zgartirishingiz mumkin:" : "Baho bering:";
    const yulduzlar = el("div", "yulduzlar");
    const chizYulduz = (n) => [...yulduzlar.children].forEach((b, i) => b.classList.toggle("tola", i < n));
    for (let n = 1; n <= 5; n++) {
      const b = el("button", "", "★");
      b.type = "button";
      b.setAttribute("aria-label", n + " yulduz");
      b.addEventListener("mouseenter", () => chizYulduz(n));
      b.addEventListener("mouseleave", () => chizYulduz(meningBaham));
      b.addEventListener("click", async () => {
        [...yulduzlar.children].forEach((x) => (x.disabled = true));
        xabar.textContent = "Saqlanmoqda…";
        try {
          const m = await mijozOl();
          const men = await kirish();
          if (men === profil.id) { xabar.textContent = "O'zingizga baho bera olmaysiz."; return; }
          const { error } = await m.from("baholar")
            .upsert({ profil_id: profil.id, baholovchi: men, baho: n }, { onConflict: "profil_id,baholovchi" });
          if (error) throw error;
          profilSahifasiniKor(kod);
        } catch (e) {
          xabar.textContent = "Baho saqlanmadi — qayta urinib ko'ring.";
          [...yulduzlar.children].forEach((x) => (x.disabled = false));
        }
      });
      yulduzlar.appendChild(b);
    }
    chizYulduz(meningBaham);
    sahifa.appendChild(yulduzlar);
  }
  sahifa.appendChild(xabar);

  if (!ozimniki && typeof kitobdoshTugmasi === "function") sahifa.appendChild(kitobdoshTugmasi(profil));

  const oyna = el("a", "asosiy", ozimniki ? "Bugungi o'yinga qaytish" : "O'zingiz ham o'ynab ko'ring");
  oyna.href = ozimniki ? "#kim-aytgan" : SAYT_MANZILI + "#kim-aytgan";
  oyna.style.height = "52px"; oyna.style.borderRadius = "6px";
  sahifa.appendChild(oyna);
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
async function googleBilanBogla(xabar) {
  const m = await mijozOl();
  googleKelganYol("#profilim");
  const { error } = await m.auth.linkIdentity({ provider: "google", options: { redirectTo: SAYT_MANZILI } });
  if (error) xabar.textContent = "Bog'lab bo'lmadi: " + error.message;
}

// Google hisobi orqali kirish (boshqa qurilmada yoki brauzer tozalangandan keyin)
async function googleBilanKir(xabar) {
  const m = await mijozOl();
  googleKelganYol("#profilim");
  const { error } = await m.auth.signInWithOAuth({ provider: "google", options: { redirectTo: SAYT_MANZILI } });
  if (error) xabar.textContent = "Kirib bo'lmadi: " + error.message;
}

// Sessiyadagi foydalanuvchiga mos profilni yuklab, shu brauzerda eslab qolish
async function profilniSinxronla(uid) {
  if (mening && mening.id === uid) return;
  const m = await mijozOl();
  const { data } = await m.from("profillar").select("id,kod,ism,taxallus").eq("id", uid).maybeSingle();
  if (data) profilniEsla(data);
  else { mening = null; try { localStorage.removeItem("kimAytganProfil"); } catch (e) {} }
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
    forma("Taxallus tanlang — do'stlaringiz sizni @taxallus orqali topadi, profilingiz manzili esa sitata.uz/@taxallus bo'ladi.");
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

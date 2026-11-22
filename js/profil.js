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
  mijoz = window.supabase.createClient(SUPABASE_URL, SUPABASE_KALIT);
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

async function profilYarat(ism) {
  const m = await mijozOl();
  const uid = await kirish();
  const bor = await m.from("profillar").select("id,kod,ism").eq("id", uid).maybeSingle();
  if (bor.data) {
    if (bor.data.ism !== ism) await m.from("profillar").update({ ism }).eq("id", uid);
    profilniEsla({ ...bor.data, ism });
    return mening;
  }
  for (let urinish = 0; urinish < 5; urinish++) {
    const kod = tasodifiyKod();
    const { error } = await m.from("profillar").insert({ id: uid, kod, ism });
    if (!error) { profilniEsla({ id: uid, kod, ism }); return mening; }
    if (error.code !== "23505") throw error;   // 23505 — bunday kod bor, boshqasini sinaymiz
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
    a.href = profilHavolasi(mening.kod);
    a.textContent = profilHavolasi(mening.kod).replace(/^https?:\/\//, "");
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
  const tugma = document.createElement("button");
  tugma.type = "button";
  tugma.className = "kichik";
  tugma.textContent = "Profil ochish";
  const xato = document.createElement("p");
  tugma.addEventListener("click", async () => {
    const ism = kirit.value.trim();
    if (!ism) { xato.textContent = "Ismingizni yozing."; kirit.focus(); return; }
    tugma.disabled = true; tugma.textContent = "Ochilmoqda…"; xato.textContent = "";
    try {
      await profilYarat(ism);
      await natijaniYoz();
      natijaFayli = null; natijaFaylObj = null;       // rasmga profil havolasini qo'shamiz
      await natijaRasminiTayyorla();
      profilQutiniChiz();
    } catch (e) {
      tugma.disabled = false; tugma.textContent = "Profil ochish";
      xato.textContent = "Profil ochilmadi — internetni tekshirib, qayta urinib ko'ring.";
    }
  });
  kirit.addEventListener("keydown", (e) => { if (e.key === "Enter") tugma.click(); });
  qator.append(kirit, tugma);
  quti.append(p, qator, xato);
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
    const p = await m.from("profillar").select("id,kod,ism").eq("kod", String(kod).toLowerCase()).maybeSingle();
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


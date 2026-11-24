const CHALGITUVCHI_SONI = 3; // harflar orasida ismda yo'q nechta begona harf bo'ladi
const MAX_XATO = 5;           // shuncha xato qo'yishdan keyin o'yin tugaydi
// O'zbek lotin alifbosidagi harflar (C va W yo'q)
const ALIFBO = "ABDEFGHIJKLMNOPQRSTUVXYZ".split("");
// Surat ustidagi bo'laklar ranglari
// (eski kitob muqovalari: teri, jigarrang, to'q yashil, bordo)
const BOLAK_RANGLARI = ["#8C4A2F", "#6B3E26", "#7A5230", "#4F5B3A", "#7B2E2E", "#9A6235"];

const $ = (id) => document.getElementById(id);

// ===== 3. BUGUNGI IQTIBOS =====
// 1970-yildan beri o'tgan kunlar soni bo'yicha: hamma odamda bir kunda bir xil iqtibos chiqadi.
// Sinov rejimi: manzil oxiriga ?sinov qo'shilsa, o'yin har safar boshidan boshlanadi (natija saqlanmaydi).
// ?sinov&kun=1 — ertangi iqtibos, ?sinov&kun=2 — indinginisi va hokazo.
const parametrlar = new URLSearchParams(location.search);
const SINOV = parametrlar.has("sinov");
const KUN_SURISH = SINOV ? (parseInt(parametrlar.get("kun"), 10) || 0) : 0;
const bugungiKun = Math.floor((Date.now() + 5 * 3600 * 1000) / 86400000) + KUN_SURISH; // Toshkent vaqti (UTC+5)
const bugungi = IQTIBOSLAR[bugungiKun % IQTIBOSLAR.length];
const muallif = MUALLIFLAR[bugungi.muallif];
const ISM = bugungi.muallif.toUpperCase();

// Ismdagi harflar o'rni (bo'sh joy va tutuq belgisi hisobga olinmaydi)
const harfOrinlari = [];
for (let i = 0; i < ISM.length; i++) if (/[A-Z]/.test(ISM[i])) harfOrinlari.push(i);
const BOLAKLAR_SONI = harfOrinlari.length; // ismda nechta harf bo'lsa, surat shuncha bo'lakka bo'linadi

// Kun raqamiga bog'liq tasodif: bo'laklar har kuni boshqacha joylashadi, lekin hammada bir xil.
function urugliTasodif(urug) {
  return () => {
    urug = (urug + 0x6D2B79F5) | 0;
    let t = Math.imul(urug ^ (urug >>> 15), 1 | urug);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function aralashtir(royxat, tasodif) {
  const a = royxat.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(tasodif() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
// harfBolagi[k] — ismning k-harfi suratning qaysi bo'lagini ochadi
const kunTasodifi = urugliTasodif(bugungiKun);
const harfBolagi = aralashtir([...Array(BOLAKLAR_SONI).keys()], kunTasodifi);

// Bugungi harflar: ismdagi har bir harf (takrorlanganlari ham) + 3 ta chalg'ituvchi, alifbo tartibida.
// Chalg'ituvchilar kunga bog'liq — hammada bir xil.
const ismHarflari = [...new Set(harfOrinlari.map((i) => ISM[i]))];
const chalgituvchilar = aralashtir(ALIFBO.filter((h) => !ismHarflari.includes(h)), kunTasodifi)
  .slice(0, CHALGITUVCHI_SONI);
const HARFLAR = [...harfOrinlari.map((i) => ISM[i]), ...chalgituvchilar].sort();

// ===== 4. O'YIN HOLATI (brauzer xotirasida saqlanadi) =====
// joylangan — to'g'ri to'ldirilgan kataklar raqami; urinishlar — har bir qo'yish to'g'ri (true) yoki xato (false)
let holat = { kun: bugungiKun, joylangan: [], urinishlar: [], tugadi: false, yutdi: false };
try {
  const saqlangan = SINOV ? null : JSON.parse(localStorage.getItem("kimAytganJoy"));
  if (saqlangan && saqlangan.kun === bugungiKun) holat = saqlangan;
} catch (e) { /* xotira ishlamasa, oddiy davom etamiz */ }

function saqlash() {
  if (SINOV) return;
  try { localStorage.setItem("kimAytganJoy", JSON.stringify(holat)); } catch (e) {}
}

const xatolarSoni = () => holat.urinishlar.filter((t) => !t).length;
const katakHarfi = (k) => ISM[harfOrinlari[k]];

// Qaysi harf-qoliplar ishlatib bo'lingan (to'g'ri joyga qo'yilgan)
function ishlatilganlar() {
  const kerak = {};
  holat.joylangan.forEach((k) => { const h = katakHarfi(k); kerak[h] = (kerak[h] || 0) + 1; });
  return HARFLAR.map((h) => (kerak[h] > 0 ? (kerak[h]--, true) : false));
}

// ===== 5. SURATNI BO'LAKLARGA BO'LISH =====
// N ta bo'lakni qatorlarga teng taqsimlaymiz (masalan 13 → 4+3+3+3), har qator ichida teng kenglikda.
function bolakJoylari(n) {
  const qatorlar = Math.max(1, Math.round(Math.sqrt(n * 5 / 4)));
  const joylar = [];
  let qolgan = n;
  for (let q = 0; q < qatorlar; q++) {
    const bu = Math.ceil(qolgan / (qatorlar - q));
    for (let u = 0; u < bu; u++) {
      joylar.push({ chap: (u / bu) * 100, yuqori: (q / qatorlar) * 100, en: 100 / bu, boy: 100 / qatorlar });
    }
    qolgan -= bu;
  }
  return joylar;
}

function portretniQur() {
  const p = $("portret");
  p.innerHTML = "";
  const boshHarf = document.createElement("div");
  boshHarf.className = "bosh-harf";
  boshHarf.textContent = bugungi.muallif.split(" ").map((s) => s[0]).join("");
  p.appendChild(boshHarf);
  if (muallif.rasm) {
    const img = document.createElement("img");
    img.src = muallif.rasm;
    img.alt = ""; // ism yashirin qolsin
    img.onload = () => boshHarf.remove();
    img.onerror = () => img.remove();
    p.appendChild(img);
  }
  bolakJoylari(BOLAKLAR_SONI).forEach((j, i) => {
    const b = document.createElement("div");
    b.className = "bolak";
    b.id = "bolak" + i;
    Object.assign(b.style, {
      left: j.chap + "%", top: j.yuqori + "%", width: j.en + "%", height: j.boy + "%",
      background: BOLAK_RANGLARI[i % BOLAK_RANGLARI.length],
    });
    b.textContent = "?";
    p.appendChild(b);
  });
}

// ===== 6. EKRANGA CHIQARISH =====
function davrMatni(asr) {
  const rim = ["","I","II","III","IV","V","VI","VII","VIII","IX","X","XI","XII","XIII","XIV","XV","XVI","XVII","XVIII","XIX","XX","XXI"];
  return asr < 0 ? "Mil. av. " + rim[-asr] + " asr" : rim[asr] + " asr";
}

function chiz() {
  $("iqtibosMatni").textContent = bugungi.matn;

  // Surat bo'laklari: to'g'ri to'ldirilgan katakning bo'lagi ochiladi, o'yin tugasa hammasi
  for (let k = 0; k < BOLAKLAR_SONI; k++) {
    const ochiq = holat.tugadi || holat.joylangan.includes(k);
    $("bolak" + harfBolagi[k]).classList.toggle("ochiq", ochiq);
  }

  // Xatolar chizig'i
  const xato = xatolarSoni();
  $("xatolar").innerHTML = "";
  for (let i = 0; i < MAX_XATO; i++) {
    const s = document.createElement("span");
    if (i < xato) s.className = "ishlatildi";
    $("xatolar").appendChild(s);
  }
  $("xatoMatn").textContent = `Xatolar: ${xato} / ${MAX_XATO}`;

  // Ism kataklari (har bir so'z alohida guruh). Bo'sh kataklarga harf qo'yiladi.
  $("ism").innerHTML = "";
  let k = 0;
  bugungi.muallif.toUpperCase().split(" ").forEach((soz) => {
    const guruh = document.createElement("div");
    guruh.className = "soz";
    [...soz].forEach((h) => {
      const katak = document.createElement("div");
      katak.className = "harf-katak";
      if (!/[A-Z]/.test(h)) { katak.classList.add("belgi"); katak.textContent = h; }
      else {
        const raqam = k++;
        katak.dataset.k = raqam;
        if (holat.joylangan.includes(raqam)) { katak.classList.add("topildi"); katak.textContent = h; }
        else if (holat.tugadi) { katak.classList.add("korsatildi"); katak.textContent = h; }
        else {
          katak.classList.add("bosh");
          katak.addEventListener("click", () => {
            if (tanlanganId !== null) joyla(raqam, HARFLAR[tanlanganId]);
          });
        }
      }
      guruh.appendChild(katak);
    });
    $("ism").appendChild(guruh);
  });
  $("ism").classList.toggle("tanlov-bor", tanlanganId !== null);

  // Ishoralar: har bir xatodan keyin bittadan
  const ishoralar = [
    "Faoliyat: " + muallif.kasb,
    "Davr: " + davrMatni(muallif.davr),
    "Hudud: " + muallif.yurt,
  ];
  $("ishoralar").innerHTML = "";
  ishoralar.slice(0, holat.tugadi ? 0 : xato).forEach((matn) => {
    const s = document.createElement("span");
    s.className = "ishora";
    s.textContent = matn;
    $("ishoralar").appendChild(s);
  });

  // Harf-qoliplar
  const ishlatilgan = ishlatilganlar();
  $("klaviatura").innerHTML = "";
  HARFLAR.forEach((h, id) => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "tugma";
    b.textContent = h;
    b.dataset.id = id;
    if (ishlatilgan[id]) b.classList.add("ishlatildi");
    if (id === tanlanganId) b.classList.add("tanlangan");
    b.disabled = holat.tugadi || ishlatilgan[id];
    b.addEventListener("pointerdown", (e) => sudrashBoshla(e, id));
    $("klaviatura").appendChild(b);
  });

  // O'yin tugaganmi?
  if (holat.tugadi) {
    $("oyin").classList.add("yashirin");
    $("natija").classList.remove("yashirin");
    $("natijaSarlavha").textContent = holat.yutdi ? "Barakalla!" : "Bu safar topilmadi";
    $("natijaMatn").textContent = "Muallif: " + bugungi.muallif;
    natijaRasminiTayyorla();
    profilQutiniChiz();
  }
}

// ===== 7. HARFNI JOYIGA QO'YISH =====
let tanlanganId = null; // bosib tanlangan harf-qolip

function joyla(k, h) {
  if (holat.tugadi || holat.joylangan.includes(k)) return;
  const togri = katakHarfi(k) === h;
  holat.urinishlar.push(togri);
  if (togri) holat.joylangan.push(k);
  tanlanganId = null;
  if (holat.joylangan.length === BOLAKLAR_SONI) { holat.yutdi = true; holat.tugadi = true; }
  else if (xatolarSoni() >= MAX_XATO) { holat.tugadi = true; }
  saqlash();
  chiz();
  if (holat.tugadi) natijaniYoz();
  if (holat.tugadi && typeof kitobchaBelgisiniYangila === "function") kitobchaBelgisiniYangila();

  // Natijani katakning o'zida ko'rsatamiz
  const katak = $("ism").querySelector(`[data-k="${k}"]`);
  if (!katak) return;
  if (togri) katak.classList.add("pop");
  else if (!holat.tugadi) {
    katak.textContent = h;
    katak.classList.add("notogri", "silkin");
    setTimeout(() => {
      if (!katak.isConnected) return;
      katak.textContent = "";
      katak.classList.remove("notogri", "silkin");
    }, 900);
  }
}

// Sudrash: barmoq yoki sichqoncha bilan harfni katakka olib borish.
// Joyidan deyarli qimirlamasa — oddiy bosish deb hisoblanadi (harf tanlanadi).
function sudrashBoshla(e, id) {
  if (holat.tugadi) return;
  e.preventDefault();
  const tugma = e.currentTarget;
  const x0 = e.clientX, y0 = e.clientY;
  let soya = null, ustidagi = null;

  const katakTop = (x, y) => {
    const el = document.elementFromPoint(x, y);
    return el && el.closest ? el.closest(".harf-katak.bosh") : null;
  };
  const harakat = (ev) => {
    if (!soya && Math.hypot(ev.clientX - x0, ev.clientY - y0) > 6) {
      soya = document.createElement("div");
      soya.className = "soya-harf";
      soya.textContent = HARFLAR[id];
      document.body.appendChild(soya);
      tugma.classList.add("sudralmoqda");
    }
    if (!soya) return;
    soya.style.left = ev.clientX + "px";
    soya.style.top = ev.clientY + "px";
    const yangi = katakTop(ev.clientX, ev.clientY);
    if (yangi !== ustidagi) {
      if (ustidagi) ustidagi.classList.remove("ustida");
      if (yangi) yangi.classList.add("ustida");
      ustidagi = yangi;
    }
  };
  const tugash = (ev) => {
    document.removeEventListener("pointermove", harakat);
    document.removeEventListener("pointerup", tugash);
    document.removeEventListener("pointercancel", tugash);
    if (soya) {
      soya.remove();
      tugma.classList.remove("sudralmoqda");
      if (ustidagi) { ustidagi.classList.remove("ustida"); joyla(Number(ustidagi.dataset.k), HARFLAR[id]); }
    } else if (ev.type === "pointerup") {
      tanlanganId = tanlanganId === id ? null : id;  // bosish: tanlash / bekor qilish
      chiz();
    }
  };
  document.addEventListener("pointermove", harakat);
  document.addEventListener("pointerup", tugash);
  document.addEventListener("pointercancel", tugash);
}

// Kompyuterda: harf tugmasini yozsangiz, o'sha harf tanlanadi; keyin katakni bosasiz
document.addEventListener("keydown", (e) => {
  if (e.ctrlKey || e.metaKey || e.altKey || holat.tugadi) return;
  if (e.key === "Escape") { tanlanganId = null; chiz(); return; }
  const h = e.key.toUpperCase();
  const ishlatilgan = ishlatilganlar();
  const id = HARFLAR.findIndex((x, i) => x === h && !ishlatilgan[i]);
  if (id >= 0) { tanlanganId = id; chiz(); }
});

// ===== 8. NATIJANI ULASHISH =====
// Natija rasm sifatida chiziladi (iqtibos + portret + natija), Instagram, Telegram, Facebook uchun.
// O'lcham 1080×1350 (4:5) — Instagram lentasiga to'liq sig'adi, Telegram va Facebook'da ham chiroyli.
const SAYT_MANZILI = location.protocol.startsWith("http")
  ? location.origin + location.pathname.replace(/index\.html$/, "")
  : "https://sitata.uz/";
// Ulashiladigan havola: profil bo'lsa — profil sahifasi, bo'lmasa — sayt
const ulashHavolasi = () => (mening && mening.kod ? profilManzili(mening) : SAYT_MANZILI);

// O'yin raqami: 2026-yil 1-yanvardan boshlab (Wordle'dagi «#214» kabi)
const oyinRaqami = () => bugungiKun - 20454 + 1;
let oyinSeriyasi = null;   // kunlik seriya (profil bo'lsa, bazadan oldindan olinadi)
async function oyinSeriyasiniOl() {
  if (!BAZA_YOQIQ || !mening || oyinSeriyasi !== null) return;
  try {
    const m = await mijozOl();
    const { data } = await m.rpc("kunlik_seriya", { p: mening.id });
    oyinSeriyasi = data && data[0] ? data[0].joriy : 0;
  } catch (e) { /* jim */ }
}

// Wordle uslubidagi natija: javobni oshkor qilmaydi, lekin ko'rgan odamni o'ynashga undaydi
function ulashMatni() {
  const kv = holat.urinishlar.map((t) => (t ? "🟩" : "🟥"));
  const qatorlar = [];
  for (let i = 0; i < kv.length; i += 10) qatorlar.push(kv.slice(i, i + 10).join(""));
  const hisob = holat.yutdi
    ? (xatolarSoni() === 0 ? "xatosiz topdim! 🎯" : `topdim — ${xatolarSoni()} ta xato bilan`)
    : "bugun topa olmadim 😔";
  const seriya = oyinSeriyasi > 1 ? `\n🔥 ${oyinSeriyasi} kun ketma-ket` : "";
  return `Kim aytgan? #${oyinRaqami()} 📚\n${qatorlar.join("\n")}\n${hisob}${seriya}\n\nSiz topa olasizmi? 👉 sitata.uz`;
}

function rasmYukla(src) {
  return new Promise((ok) => {
    if (!src) return ok(null);
    const img = new Image();
    img.onload = () => ok(img);
    img.onerror = () => ok(null);
    img.src = src;
  });
}

// Matnni berilgan kenglikka sig'diradigan qatorlarga bo'lish
function qatorlargaBol(ctx, matn, kenglik) {
  const natija = [];
  matn.split("\n").forEach((paragraf) => {
    let qator = "";
    paragraf.split(" ").forEach((soz) => {
      const sinov = qator ? qator + " " + soz : soz;
      if (ctx.measureText(sinov).width > kenglik && qator) { natija.push(qator); qator = soz; }
      else qator = sinov;
    });
    natija.push(qator);
  });
  return natija;
}

let natijaFayli = null; // tayyor PNG (Blob)

async function natijaRasminiChiz() {
  try {
    await Promise.all([
      document.fonts.load('500 48px "Lora"'), document.fonts.load('italic 500 32px "Lora"'),
      document.fonts.load('600 56px "Lora"'),
    ]);
  } catch (e) { /* shriftsiz ham chizamiz */ }

  const W = 1080, H = 1350, c = document.createElement("canvas");
  c.width = W; c.height = H;
  const ctx = c.getContext("2d");
  const serif = '"Lora", Georgia, serif';

  // Fon: zig'ir mato va kitob sahifasi
  ctx.fillStyle = "#E9DFCA"; ctx.fillRect(0, 0, W, H);
  const X = 60, Y = 60, PW = W - 120, PH = H - 120;
  ctx.fillStyle = "#D5C095"; ctx.fillRect(X + 14, Y + 14, PW, PH);   // orqadagi varaqlar
  ctx.fillStyle = "#EADBB9"; ctx.fillRect(X + 7, Y + 7, PW, PH);
  let g = ctx.createRadialGradient(W / 2, H * .4, 100, W / 2, H * .4, 900);
  g.addColorStop(0, "#FBF4E3"); g.addColorStop(1, "#EBDDBE");
  ctx.fillStyle = g; ctx.fillRect(X, Y, PW, PH);
  g = ctx.createLinearGradient(X, 0, X + 50, 0);                     // kitob umurtqasi soyasi
  g.addColorStop(0, "rgba(110,70,30,.25)"); g.addColorStop(1, "rgba(110,70,30,0)");
  ctx.fillStyle = g; ctx.fillRect(X, Y, 50, PH);
  ctx.strokeStyle = "#D8C7A3"; ctx.lineWidth = 2; ctx.strokeRect(X, Y, PW, PH);

  ctx.textAlign = "center"; ctx.textBaseline = "alphabetic";
  let y = Y + 90;
  ctx.fillStyle = "#8C5A2B"; ctx.font = `italic 500 32px ${serif}`;
  ctx.fillText("— Kim aytgan? —", W / 2, y);

  // Iqtibos: sig'guncha shrift kichrayadi
  let olcham = 50, qatorlar;
  do {
    ctx.font = `500 ${olcham}px ${serif}`;
    qatorlar = qatorlargaBol(ctx, "“" + bugungi.matn + "”", PW - 160);
    olcham -= 2;
  } while (qatorlar.length * olcham * 1.4 > 300 && olcham > 28);
  olcham += 2;
  const qatorBalandligi = olcham * 1.4;
  y += 50 + olcham;
  ctx.fillStyle = "#3B2A1A";
  qatorlar.forEach((q) => { ctx.fillText(q, W / 2, y); y += qatorBalandligi; });

  // Portret ramkada
  // Portret balandligi qolgan joyga moslashadi (uzun iqtibosda kichrayadi)
  const pastkiQism = 330;                                   // ism, ma'lumot, natija, sayt manzili
  const ph = Math.max(300, Math.min(500, (Y + PH) - pastkiQism - (y + 10) - 14));
  const pw = Math.round(ph * 0.8), px = (W - pw) / 2, py = y + 10;
  ctx.save();
  ctx.shadowColor = "rgba(80,50,20,.3)"; ctx.shadowBlur = 24; ctx.shadowOffsetY = 8;
  ctx.fillStyle = "#FBF5E6"; ctx.fillRect(px - 14, py - 14, pw + 28, ph + 28);
  ctx.restore();
  ctx.strokeStyle = "#CDB68A"; ctx.lineWidth = 2; ctx.strokeRect(px - 14, py - 14, pw + 28, ph + 28);
  const img = await rasmYukla(muallif.rasm);
  if (img) {
    const k = Math.max(pw / img.width, ph / img.height);             // "cover", yuqori qismi
    const sw = pw / k, sh = ph / k;
    ctx.drawImage(img, (img.width - sw) / 2, 0, sw, sh, px, py, pw, ph);
  } else {
    g = ctx.createLinearGradient(px, py, px + pw, py + ph);
    g.addColorStop(0, "#8C4A2F"); g.addColorStop(1, "#4A2A18");
    ctx.fillStyle = g; ctx.fillRect(px, py, pw, ph);
    ctx.fillStyle = "#FBF5E6"; ctx.font = `600 150px ${serif}`;
    ctx.fillText(bugungi.muallif.split(" ").map((s) => s[0]).join(""), W / 2, py + ph / 2 + 55);
  }
  y = py + ph + 86;

  // Muallif va ma'lumot
  ctx.fillStyle = "#3B2A1A"; ctx.font = `600 54px ${serif}`;
  ctx.fillText(bugungi.muallif, W / 2, y);
  y += 48;
  ctx.fillStyle = "#7A6448"; ctx.font = `italic 500 30px ${serif}`;
  ctx.fillText(`${muallif.kasb} · ${davrMatni(muallif.davr)} · ${muallif.yurt}`, W / 2, y);

  // Natija: kvadratchalar va matn
  y += 50;
  const n = holat.urinishlar.length, oraliq = 8, kv = Math.min(30, Math.floor((PW - 120 - (n - 1) * oraliq) / n));
  let kx = (W - (n * kv + (n - 1) * oraliq)) / 2;
  holat.urinishlar.forEach((t) => {
    ctx.fillStyle = t ? "#4F5B3A" : "#B5502A";
    ctx.fillRect(kx, y, kv, kv); kx += kv + oraliq;
  });
  y += kv + 46;
  ctx.fillStyle = holat.yutdi ? "#4F5B3A" : "#8C4A2F"; ctx.font = `600 34px ${serif}`;
  ctx.fillText(holat.yutdi ? `Topdim — ${xatolarSoni()} ta xato bilan` : "Bu safar topa olmadim", W / 2, y);

  // Pastki qism: sayt manzili
  ctx.fillStyle = "#9A8466"; ctx.font = `italic 500 26px ${serif}`;
  ctx.fillText((mening ? "Profilim: " : "") + ulashHavolasi().replace(/^https?:\/\//, "").replace(/\/$/, ""), W / 2, Y + PH - 36);

  return new Promise((ok) => c.toBlob(ok, "image/png"));
}

let natijaFaylObj = null; // ulashish uchun tayyor File (bosilganda kutmasdan darhol ulashamiz)

async function natijaRasminiTayyorla() {
  if (natijaFayli) return natijaFayli;
  try {
    natijaFayli = await natijaRasminiChiz();
    if (natijaFayli) {
      natijaFaylObj = new File([natijaFayli], "kim-aytgan.png", { type: "image/png" });
      // data: manzil — ilova ichidagi brauzerlarda ham rasmni bosib turib saqlash mumkin bo'lsin
      $("natijaRasm").src = await new Promise((ok) => {
        const o = new FileReader(); o.onload = () => ok(o.result); o.readAsDataURL(natijaFayli);
      });
      $("natijaRasm").classList.remove("yashirin");
    }
  } catch (e) { natijaFayli = null; }   // masalan, fayl kompyuterdan ochilganda brauzer rasmga ruxsat bermaydi
  return natijaFayli;
}

async function nusxaOl(matn) {
  try {
    if (navigator.clipboard && window.isSecureContext) { await navigator.clipboard.writeText(matn); return true; }
  } catch (e) { /* pastdagi usulni sinaymiz */ }
  try {
    const t = document.createElement("textarea");
    t.value = matn; t.setAttribute("readonly", ""); t.style.position = "fixed"; t.style.opacity = "0";
    document.body.appendChild(t); t.select();
    const ok = document.execCommand("copy");
    t.remove();
    return ok;
  } catch (e) { return false; }
}

function rasmniYuklabOl(blob, nom = "kim-aytgan.png") {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = nom;
  document.body.appendChild(a); a.click(); a.remove();
}

function matnniKorsat(matn) {
  const quti = $("ulashMatn");
  quti.value = matn;
  quti.classList.remove("yashirin");
  quti.focus(); quti.select();
  $("ulashXabar").textContent = "Matnni belgilab, o'zingiz nusxa oling:";
}

// Telegram, Instagram, Facebook ichidagi brauzerlar ulashish va yuklab olishga ko'pincha ruxsat bermaydi
const ILOVA_ICHIDA = /Telegram|Instagram|FBAN|FBAV|FB_IAB|Line\/|WhatsApp/i.test(navigator.userAgent);
const TELEFON = window.matchMedia("(pointer: coarse)").matches;

// Hech narsa ishlamasa: rasmni bosib turib saqlash yo'lini ko'rsatamiz (har qanday telefonda ishlaydi)
function qolbolaYol(sabab) {
  const xabar = $("ulashXabar");
  const rasm = $("natijaRasm");
  if (natijaFayli && !rasm.classList.contains("yashirin")) {
    xabar.textContent = (sabab ? sabab + " " : "") +
      (TELEFON ? "Rasmni barmoq bilan bosib turing va «Rasmni saqlash»ni tanlang, keyin Instagram, Telegram yoki Facebook'ga joylang."
               : "Rasm ustida sichqonchaning o'ng tugmasini bosib, «Rasmni saqlash» yoki «Rasmdan nusxa olish»ni tanlang.");
    rasm.scrollIntoView({ behavior: "smooth", block: "center" });
  } else {
    const matn = ulashMatni();
    nusxaOl(matn).then((ok) => { if (ok) xabar.textContent = "Natija matni nusxalandi."; else matnniKorsat(matn); });
  }
}

// Matn bilan ulashish (Telegram guruhlari uchun eng qulay): telefonda ulashish oynasi, kompyuterda nusxa
$("ulashMatnTugma").addEventListener("click", () => {
  const matn = ulashMatni(), xabar = $("ulashXabar");
  xabar.textContent = "";
  if (TELEFON && navigator.share && !ILOVA_ICHIDA) {
    navigator.share({ text: matn }).catch((e) => { if (e.name !== "AbortError") nusxaOl(matn).then((ok) => { xabar.textContent = ok ? "Natija nusxalandi — Telegram'ga joylang." : ""; if (!ok) matnniKorsat(matn); }); });
    return;
  }
  nusxaOl(matn).then((ok) => { if (ok) xabar.textContent = "Natija nusxalandi — Telegram yoki istalgan chatga joylang (Ctrl+V)."; else matnniKorsat(matn); });
});

// Asosiy tugma: telefonda rasm bilan ulashish oynasi (Instagram, Telegram, Facebook...),
// kompyuterda rasm nusxalanadi — Telegram yoki Facebook'ga Ctrl+V bilan joylashtirasiz.
// Muhim: ulashish oynasi faqat bosishning o'zida ochiladi, shuning uchun bu yerda oldin hech narsani kutmaymiz.
$("ulashish").addEventListener("click", () => {
  const xabar = $("ulashXabar");
  xabar.textContent = "";

  if (!natijaFayli) {                       // rasm hali tayyor emas
    xabar.textContent = "Rasm tayyorlanmoqda…";
    natijaRasminiTayyorla().then((b) => {
      xabar.textContent = b ? "Rasm tayyor — «Natijani ulashish»ni yana bir bor bosing." : "";
      if (!b) qolbolaYol();
    });
    return;
  }

  if (ILOVA_ICHIDA) {
    qolbolaYol("Ilova ichidagi brauzer ulashishga ruxsat bermaydi — saytni Chrome yoki Safari'da oching, yoki:");
    return;
  }

  const fayl = natijaFaylObj;
  if (TELEFON && navigator.share && navigator.canShare && navigator.canShare({ files: [fayl] })) {
    // Profil havolasini ham nusxalab qo'yamiz — postga yoki izohga joylash uchun
    if (mening && navigator.clipboard) {
      navigator.clipboard.writeText(ulashMatni())
        .then(() => { xabar.textContent = "Profil havolasi ham nusxalandi — postga yoki izohga joylang."; })
        .catch(() => {});
    }
    navigator.share({ files: [fayl] })     // faqat rasm: matn qo'shilsa, Instagram ba'zan ulashmaydi
      .catch((e) => { if (e.name !== "AbortError") qolbolaYol("Ulashish oynasi ochilmadi."); });
    return;
  }

  if (window.ClipboardItem && navigator.clipboard && navigator.clipboard.write) {
    navigator.clipboard.write([new ClipboardItem({ "image/png": natijaFayli })])
      .then(() => { xabar.textContent = "Rasm nusxalandi — Telegram yoki Facebook'ga Ctrl+V bilan joylashtiring."; })
      .catch(() => {
        try { rasmniYuklabOl(natijaFayli); xabar.textContent = "Rasm yuklab olindi — uni Instagram, Telegram yoki Facebook'ga joylang."; }
        catch (e) { qolbolaYol(); }
      });
    return;
  }
  try { rasmniYuklabOl(natijaFayli); xabar.textContent = "Rasm yuklab olindi — uni Instagram, Telegram yoki Facebook'ga joylang."; }
  catch (e) { qolbolaYol(); }
});


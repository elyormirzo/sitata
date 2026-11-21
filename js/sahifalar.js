// ===== SAHIFALAR: menyu, bosh sahifa, lenta, mualliflar, viktorina, karta yaratish, reyting, profilim =====
// Manzillar (#...): #bosh, #kim-aytgan, #viktorina, #lenta, #mualliflar, #muallif/<nom>, #karta, #karta/<raqam>,
// #reyting, #profilim, #qoidalar, #haqida. Ulashilgan profil havolasi: ?p=KOD.

// ---------- Umumiy yordamchilar ----------
function yarat(teg, sinf, matn) {
  const e = document.createElement(teg);
  if (sinf) e.className = sinf;
  if (matn != null) e.textContent = matn;
  return e;
}
function havola(href, sinf, matn) { const a = yarat("a", sinf, matn); a.href = href; return a; }

// Bugungi o'yin iqtibosi o'yin tugaguncha boshqa bo'limlarda muallifi bilan ko'rinmasin (javobni oshkor qilmaslik uchun)
const yashirinmi = (iq) => iq === bugungi && !holat.tugadi;
const ochiqIqtiboslar = () => IQTIBOSLAR.filter((iq) => !yashirinmi(iq));
const muallifIqtiboslari = (ism) => IQTIBOSLAR.filter((iq) => iq.muallif === ism);
const boshHarflar = (ism) => ism.split(" ").map((s) => s[0]).join("");
const ismniSlugdan = (slug) => Object.keys(MUALLIFLAR).find((ism) => muallifSlug(ism) === slug);

function portretEl(ism, sinf) {
  const m = MUALLIFLAR[ism];
  const quti = yarat("span", "mini-portret " + (sinf || ""));
  if (m && m.rasm) {
    const img = yarat("img"); img.src = m.rasm; img.alt = ism; img.loading = "lazy";
    quti.appendChild(img);
  } else {
    quti.classList.add("harfli"); quti.textContent = boshHarflar(ism);
  }
  return quti;
}

function xotiradanOl(kalit, standart) {
  try { const v = JSON.parse(localStorage.getItem(kalit)); return v == null ? standart : v; } catch (e) { return standart; }
}
function xotiragaYoz(kalit, qiymat) { try { localStorage.setItem(kalit, JSON.stringify(qiymat)); } catch (e) {} }

// Rasmni ulashish: telefonda ulashish oynasi, kompyuterda nusxa yoki yuklab olish
function faylniUlash(blob, nom, xabar) {
  const fayl = new File([blob], nom, { type: "image/png" });
  if (TELEFON && !ILOVA_ICHIDA && navigator.share && navigator.canShare && navigator.canShare({ files: [fayl] })) {
    navigator.share({ files: [fayl] }).catch((e) => {
      if (e.name !== "AbortError") xabar.textContent = "Ulashish oynasi ochilmadi — rasmni bosib turib saqlang.";
    });
    return;
  }
  if (ILOVA_ICHIDA) {
    xabar.textContent = "Ilova ichidagi brauzer ulashishga ruxsat bermaydi — rasmni bosib turib saqlang yoki saytni Chrome/Safari'da oching.";
    return;
  }
  if (window.ClipboardItem && navigator.clipboard && navigator.clipboard.write) {
    navigator.clipboard.write([new ClipboardItem({ "image/png": blob })])
      .then(() => { xabar.textContent = "Rasm nusxalandi — Telegram yoki Facebook'ga Ctrl+V bilan joylashtiring."; })
      .catch(() => { rasmniYuklabOl(blob, nom); xabar.textContent = "Rasm yuklab olindi."; });
    return;
  }
  rasmniYuklabOl(blob, nom);
  xabar.textContent = "Rasm yuklab olindi.";
}

// ---------- Menyu ----------
const menyu = $("menyu"), menyuTugma = $("menyuTugma");
function menyuniYop() { menyu.classList.add("yashirin"); menyuTugma.setAttribute("aria-expanded", "false"); }
menyuTugma.addEventListener("click", (e) => {
  e.stopPropagation();
  const ochiq = menyu.classList.toggle("yashirin") === false;
  menyuTugma.setAttribute("aria-expanded", String(ochiq));
});
document.addEventListener("click", (e) => { if (!menyu.contains(e.target)) menyuniYop(); });
document.addEventListener("keydown", (e) => { if (e.key === "Escape") menyuniYop(); });

// ---------- Yo'naltiruvchi (router) ----------
const SARLAVHALAR = {
  bosh: "sitata.uz — iqtiboslar, mualliflar va o'yinlar", "kim-aytgan": "Kim aytgan? — sitata.uz",
  viktorina: "Viktorina — sitata.uz", lenta: "Iqtiboslar lentasi — sitata.uz", mualliflar: "Mualliflar — sitata.uz",
  muallif: "Muallif — sitata.uz", karta: "Karta yaratish — sitata.uz", reyting: "Reyting — sitata.uz",
  profil: "Profil — sitata.uz", qoidalar: "Qanday o'ynash — sitata.uz", haqida: "Loyiha haqida — sitata.uz",
};

function joriyYol() {
  const hash = decodeURIComponent(location.hash.slice(1));
  if (hash) { const [nom, ...qolgan] = hash.split("/"); return { nom, param: qolgan.join("/") }; }
  if (parametrlar.has("p")) return { nom: "profil", param: parametrlar.get("p") };
  if (SINOV) return { nom: "kim-aytgan" };
  return { nom: "bosh" };
}

let viktorinaTaymeri = null;

function sahifaniKor() {
  let { nom, param } = joriyYol();
  if (nom !== "profilim" && !SARLAVHALAR[nom]) nom = "bosh";
  const bolim = nom === "profilim" ? "profil" : nom;

  clearInterval(viktorinaTaymeri);
  document.querySelectorAll(".sahifa").forEach((s) => s.classList.toggle("yashirin", s.dataset.sahifa !== bolim));
  menyu.querySelectorAll("a").forEach((a) => a.classList.toggle("faol", a.dataset.yol === nom));
  menyuniYop();
  document.title = SARLAVHALAR[bolim];

  const chizuvchilar = {
    bosh: boshniChiz, viktorina: viktorinaBoshi, lenta: lentaniChiz, mualliflar: mualliflarniChiz,
    muallif: () => muallifniChiz(param), karta: () => kartaniChiz(param), reyting: reytingniChiz,
    profilim: profilimniChiz, profil: () => profilSahifasiniKor(param),
  };
  if (chizuvchilar[nom]) chizuvchilar[nom]();
  window.scrollTo(0, 0);
}
window.addEventListener("hashchange", sahifaniKor);

// ---------- Bosh sahifa ----------
function boshniChiz() {
  const s = $("boshSahifa");
  s.innerHTML = "";

  const qahramon = yarat("div", "qahramon");
  qahramon.append(yarat("h1", "", "Hikmatli so'zlar maskani"),
    yarat("p", "", "Buyuk mutafakkirlarning iqtiboslarini o'qing, mualliflarini kashf eting va o'yinda bilimingizni sinang."));
  s.appendChild(qahramon);

  // Kunlik o'yin kartasi
  const oyin = havola("#kim-aytgan", "oyin-karta");
  const holatMatni = holat.tugadi
    ? (holat.yutdi ? `Bugun topdingiz ✓ — ${xatolarSoni()} ta xato bilan` : "Bugun topilmadi — ertaga yangi iqtibos")
    : (holat.urinishlar.length ? "Davom ettiring — o'yin tugamagan" : "Bugungi iqtibos sizni kutmoqda");
  const oyinMatn = yarat("div", "oyin-karta-matn");
  oyinMatn.append(yarat("small", "", "Kunlik o'yin"), yarat("h2", "", "Kim aytgan?"),
    yarat("blockquote", "", "“" + bugungi.matn.split("\n")[0] + (bugungi.matn.includes("\n") ? "…" : "") + "”"),
    yarat("p", "holat", holatMatni), yarat("span", "tugmacha", holat.tugadi ? "Natijani ko'rish" : "O'ynash →"));
  oyin.appendChild(oyinMatn);
  s.appendChild(oyin);

  // Bo'limlar
  const enYaxshi = xotiradanOl("sitataViktorina", 0);
  const bolimlar = [
    ["#viktorina", "Viktorina", enYaxshi ? `Eng yaxshi natijangiz: ${enYaxshi} ball` : "10 savol, vaqtga qarshi", "?"],
    ["#lenta", "Iqtiboslar lentasi", `${IQTIBOSLAR.length} ta iqtibos`, "“"],
    ["#mualliflar", "Mualliflar", `${Object.keys(MUALLIFLAR).length} ta muallif`, "✒"],
    ["#karta", "Karta yaratish", "Story, post yoki kvadrat", "▣"],
    ["#reyting", "Reyting", "Eng yaxshi o'yinchilar", "★"],
    ["#profilim", "Profilim", mening ? mening.ism : "Profil oching", "☺"],
  ];
  const panjara = yarat("div", "bolimlar");
  bolimlar.forEach(([href, nom, izoh, belgi]) => {
    const a = havola(href, "bolim-karta");
    a.append(yarat("span", "bolim-belgi", belgi), yarat("b", "", nom), yarat("span", "", izoh));
    panjara.appendChild(a);
  });
  s.appendChild(panjara);

  // Lentadan bir nechta iqtibos
  const tanlov = aralashtir(ochiqIqtiboslar(), urugliTasodif(bugungiKun + 7)).slice(0, 2);
  if (tanlov.length) {
    s.appendChild(yarat("h3", "bolim-sarlavha", "Lentadan"));
    tanlov.forEach((iq) => s.appendChild(iqtibosKartasi(iq)));
    s.appendChild(havola("#lenta", "barchasi", "Barcha iqtiboslar →"));
  }
}

// ---------- Iqtibos kartasi (lenta, muallif sahifasi, bosh sahifa) ----------
function iqtibosKartasi(iq) {
  const raqam = IQTIBOSLAR.indexOf(iq);
  const k = yarat("article", "iqtibos-karta");
  k.appendChild(yarat("blockquote", "", iq.matn));
  const meta = yarat("div", "iqtibos-meta");
  if (yashirinmi(iq)) {
    meta.append(yarat("span", "mini-portret harfli", "?"));
    const m = yarat("div");
    m.append(yarat("b", "", "Muallifi — bugungi o'yin siri"), havola("#kim-aytgan", "", "Avval o'ynab ko'ring →"));
    meta.appendChild(m);
    k.appendChild(meta);
    return k;
  }
  meta.appendChild(portretEl(iq.muallif));
  const m = yarat("div");
  m.appendChild(havola("#muallif/" + muallifSlug(iq.muallif), "muallif-havola", iq.muallif));
  if (iq.asar) m.appendChild(yarat("span", "asar", iq.asar));
  meta.appendChild(m);
  k.appendChild(meta);

  const amallar = yarat("div", "amallar");
  const sevimlilar = xotiradanOl("sitataSevimli", []);
  const yurak = yarat("button", "amal" + (sevimlilar.includes(raqam) ? " tanlangan" : ""), sevimlilar.includes(raqam) ? "♥ Sevimli" : "♡ Sevimli");
  yurak.type = "button";
  yurak.addEventListener("click", () => {
    const r = xotiradanOl("sitataSevimli", []);
    const bor = r.includes(raqam);
    xotiragaYoz("sitataSevimli", bor ? r.filter((x) => x !== raqam) : [...r, raqam]);
    yurak.classList.toggle("tanlangan", !bor);
    yurak.textContent = bor ? "♡ Sevimli" : "♥ Sevimli";
  });
  const nusxa = yarat("button", "amal", "Nusxa");
  nusxa.type = "button";
  nusxa.addEventListener("click", async () => {
    const ok = await nusxaOl(`“${iq.matn}”\n— ${iq.muallif}${iq.asar ? ", " + iq.asar : ""}\n\n${SAYT_MANZILI}`);
    nusxa.textContent = ok ? "Nusxalandi ✓" : "Nusxa olinmadi";
    setTimeout(() => { nusxa.textContent = "Nusxa"; }, 1500);
  });
  amallar.append(yurak, nusxa, havola("#karta/" + raqam, "amal", "Karta yasash"));
  k.appendChild(amallar);
  return k;
}

// ---------- Iqtiboslar lentasi ----------
const lentaFiltri = { soz: "", kasb: "", sevimli: false };

function lentaniChiz() {
  const s = $("lentaSahifa");
  s.innerHTML = "";
  s.appendChild(yarat("h2", "sahifa-sarlavha", "Iqtiboslar lentasi"));

  const qidiruv = yarat("input", "qidiruv-maydon");
  qidiruv.type = "search"; qidiruv.placeholder = "Iqtibos yoki muallifni qidiring…"; qidiruv.value = lentaFiltri.soz;
  s.appendChild(qidiruv);

  const filtrlar = yarat("div", "filtrlar");
  [["", "Hammasi"], ["Shoir", "Shoirlar"], ["Yozuvchi", "Yozuvchilar"], ["Faylasuf", "Faylasuflar"], ["Olim", "Olimlar"], ["♥", "♥ Sevimlilar"]]
    .forEach(([qiymat, nom]) => {
      const b = yarat("button", "filtr", nom); b.type = "button";
      const faol = qiymat === "♥" ? lentaFiltri.sevimli : (!lentaFiltri.sevimli && lentaFiltri.kasb === qiymat);
      b.classList.toggle("faol", faol);
      b.addEventListener("click", () => {
        if (qiymat === "♥") { lentaFiltri.sevimli = !lentaFiltri.sevimli; lentaFiltri.kasb = ""; }
        else { lentaFiltri.sevimli = false; lentaFiltri.kasb = qiymat; }
        lentaniChiz();
      });
      filtrlar.appendChild(b);
    });
  s.appendChild(filtrlar);

  const royxat = yarat("div", "royxat");
  s.appendChild(royxat);
  const royxatniChiz = () => {
    royxat.innerHTML = "";
    const soz = lentaFiltri.soz.trim().toLowerCase();
    const sevimlilar = xotiradanOl("sitataSevimli", []);
    const topilgan = IQTIBOSLAR.filter((iq) => {
      if (lentaFiltri.sevimli && !sevimlilar.includes(IQTIBOSLAR.indexOf(iq))) return false;
      if (lentaFiltri.kasb && (yashirinmi(iq) || MUALLIFLAR[iq.muallif].kasb !== lentaFiltri.kasb)) return false;
      if (soz) {
        const qayerda = (iq.matn + " " + (yashirinmi(iq) ? "" : iq.muallif + " " + (iq.asar || ""))).toLowerCase();
        if (!qayerda.includes(soz)) return false;
      }
      return true;
    });
    if (!topilgan.length) {
      royxat.appendChild(yarat("p", "bosh-holat", lentaFiltri.sevimli ? "Hali sevimli iqtibos yo'q — ♡ belgisini bosing." : "Hech narsa topilmadi."));
      return;
    }
    // Bugungi iqtibos tepada, qolganlari yangilari birinchi
    [...topilgan].reverse().sort((a, b) => (b === bugungi) - (a === bugungi)).forEach((iq) => royxat.appendChild(iqtibosKartasi(iq)));
  };
  qidiruv.addEventListener("input", () => { lentaFiltri.soz = qidiruv.value; royxatniChiz(); });
  royxatniChiz();
}

// ---------- Mualliflar ----------
function mualliflarniChiz() {
  const s = $("mualliflarSahifa");
  s.innerHTML = "";
  s.appendChild(yarat("h2", "sahifa-sarlavha", "Mualliflar"));
  s.appendChild(yarat("p", "kichik-matn markaz", "Shoirlar, yozuvchilar, faylasuflar va olimlar — davrlar bo'yicha"));
  const panjara = yarat("div", "mualliflar-panjara");
  Object.keys(MUALLIFLAR).sort((a, b) => MUALLIFLAR[a].davr - MUALLIFLAR[b].davr || a.localeCompare(b)).forEach((ism) => {
    const m = MUALLIFLAR[ism];
    const a = havola("#muallif/" + muallifSlug(ism), "muallif-karta");
    a.appendChild(portretEl(ism, "katta"));
    const n = muallifIqtiboslari(ism).length;
    a.append(yarat("b", "", ism), yarat("span", "", `${m.kasb} · ${davrMatni(m.davr)}`),
      yarat("span", "son", n ? `${n} ta iqtibos` : "iqtiboslar tez orada"));
    panjara.appendChild(a);
  });
  s.appendChild(panjara);
}

function muallifniChiz(slug) {
  const s = $("muallifSahifa");
  s.innerHTML = "";
  s.appendChild(havola("#mualliflar", "orqaga", "← Mualliflar"));
  const ism = ismniSlugdan(slug);
  if (!ism) { s.appendChild(yarat("p", "bosh-holat", "Bunday muallif topilmadi.")); return; }
  const m = MUALLIFLAR[ism];
  document.title = ism + " — sitata.uz";

  const bosh = yarat("div", "muallif-bosh");
  bosh.appendChild(portretEl(ism, "eng-katta"));
  bosh.append(yarat("h2", "", ism), yarat("p", "meta", `${m.kasb} · ${m.yillar || davrMatni(m.davr)} · ${m.yurt}`));
  s.appendChild(bosh);
  if (m.bio) s.appendChild(yarat("p", "bio", m.bio));

  s.appendChild(yarat("h3", "bolim-sarlavha", "Iqtiboslari"));
  const iqlar = muallifIqtiboslari(ism);
  if (!iqlar.length) s.appendChild(yarat("p", "bosh-holat", "Bu muallifning iqtiboslari tez orada qo'shiladi."));
  iqlar.forEach((iq) => {
    if (yashirinmi(iq)) {
      const k = yarat("article", "iqtibos-karta yashirin-iqtibos");
      k.append(yarat("p", "", "Bu muallifning bitta iqtibosi bugungi o'yinda — avval o'ynab ko'ring."), havola("#kim-aytgan", "", "Bugungi o'yin →"));
      s.appendChild(k);
    } else s.appendChild(iqtibosKartasi(iq));
  });
}

// ---------- Viktorina ----------
const VIKTORINA_SAVOLLARI = 10, VIKTORINA_SONIYA = 15;
let vik = null;

function oxshashMualliflar(ism, soni) {
  const t = MUALLIFLAR[ism];
  return Object.keys(MUALLIFLAR).filter((x) => x !== ism)
    .map((x) => {
      const m = MUALLIFLAR[x];
      const ball = (m.kasb === t.kasb) + (m.yurt === t.yurt) + (Math.abs(m.davr - t.davr) <= 2) + Math.random() * 1.5;
      return { x, ball };
    })
    .sort((a, b) => b.ball - a.ball).slice(0, soni).map((o) => o.x);
}

function viktorinaBoshi() {
  const s = $("viktorinaSahifa");
  s.innerHTML = "";
  s.appendChild(yarat("h2", "sahifa-sarlavha", "Viktorina"));
  const quti = yarat("div", "vik-quti markaz");
  const savollar = Math.min(VIKTORINA_SAVOLLARI, ochiqIqtiboslar().length);
  quti.append(yarat("p", "katta-belgi", "?"),
    yarat("p", "", `${savollar} ta savol. Iqtibos chiqadi — 4 ta variantdan muallifini tanlang. Har bir savolga ${VIKTORINA_SONIYA} soniya.`),
    yarat("p", "kichik-matn", "To'g'ri javob — 10 ball, ortib qolgan har bir soniya — yana 1 ball."));
  const enYaxshi = xotiradanOl("sitataViktorina", 0);
  if (enYaxshi) quti.appendChild(yarat("p", "eng-yaxshi", `Eng yaxshi natijangiz: ${enYaxshi} ball`));
  const b = yarat("button", "asosiy", "Boshlash"); b.type = "button";
  b.addEventListener("click", viktorinaniBoshla);
  quti.appendChild(b);
  s.appendChild(quti);
}

function viktorinaniBoshla() {
  const tanlov = aralashtir(ochiqIqtiboslar(), Math.random).slice(0, VIKTORINA_SAVOLLARI);
  vik = {
    savollar: tanlov.map((iq) => ({ iq, variantlar: aralashtir([iq.muallif, ...oxshashMualliflar(iq.muallif, 3)], Math.random) })),
    i: 0, ball: 0, togri: 0,
  };
  savolniKorsat();
}

function savolniKorsat() {
  const s = $("viktorinaSahifa");
  const savol = vik.savollar[vik.i];
  s.innerHTML = "";
  const yuqori = yarat("div", "vik-yuqori");
  yuqori.append(yarat("span", "", `Savol ${vik.i + 1} / ${vik.savollar.length}`), yarat("span", "", `${vik.ball} ball`));
  s.appendChild(yuqori);
  const chiziq = yarat("div", "vik-vaqt"); const tolgan = yarat("span"); chiziq.appendChild(tolgan);
  s.appendChild(chiziq);
  const k = yarat("article", "iqtibos-karta vik-iqtibos");
  k.appendChild(yarat("blockquote", "", savol.iq.matn));
  s.appendChild(k);
  s.appendChild(yarat("p", "kichik-matn markaz", "Kim aytgan?"));

  const variantlar = yarat("div", "vik-variantlar");
  let javobBerildi = false, qolgan = VIKTORINA_SONIYA;
  const boshlangan = Date.now();

  const javob = (tanlangan) => {
    if (javobBerildi) return;
    javobBerildi = true;
    clearInterval(viktorinaTaymeri);
    const togri = tanlangan === savol.iq.muallif;
    if (togri) { vik.togri++; vik.ball += 10 + Math.max(0, Math.ceil(qolgan)); }
    [...variantlar.children].forEach((b) => {
      b.disabled = true;
      if (b.dataset.ism === savol.iq.muallif) b.classList.add("togri");
      else if (b.dataset.ism === tanlangan) b.classList.add("xato");
    });
    yuqori.lastChild.textContent = `${vik.ball} ball`;
    setTimeout(() => { vik.i++; if (vik.i < vik.savollar.length) savolniKorsat(); else viktorinaYakuni(); }, 1300);
  };

  savol.variantlar.forEach((ism) => {
    const b = yarat("button", "vik-variant"); b.type = "button"; b.dataset.ism = ism;
    b.append(portretEl(ism), yarat("span", "", ism));
    b.addEventListener("click", () => javob(ism));
    variantlar.appendChild(b);
  });
  s.appendChild(variantlar);

  clearInterval(viktorinaTaymeri);
  viktorinaTaymeri = setInterval(() => {
    qolgan = VIKTORINA_SONIYA - (Date.now() - boshlangan) / 1000;
    tolgan.style.width = Math.max(0, (qolgan / VIKTORINA_SONIYA) * 100) + "%";
    tolgan.classList.toggle("oz", qolgan < 5);
    if (qolgan <= 0) javob(null);
  }, 100);
}

function viktorinaYakuni() {
  const s = $("viktorinaSahifa");
  s.innerHTML = "";
  s.appendChild(yarat("h2", "sahifa-sarlavha", "Viktorina tugadi"));
  const avvalgi = xotiradanOl("sitataViktorina", 0);
  const rekord = vik.ball > avvalgi;
  if (rekord) xotiragaYoz("sitataViktorina", vik.ball);
  const quti = yarat("div", "vik-quti markaz");
  quti.append(yarat("p", "katta-son", String(vik.ball)), yarat("p", "", "ball"),
    yarat("p", "", `${vik.savollar.length} tadan ${vik.togri} ta to'g'ri javob`),
    yarat("p", "eng-yaxshi", rekord ? "Yangi rekord! ★" : `Eng yaxshi natijangiz: ${avvalgi} ball`));
  const qayta = yarat("button", "asosiy", "Qayta o'ynash"); qayta.type = "button";
  qayta.addEventListener("click", viktorinaniBoshla);
  const nusxa = yarat("button", "ikkilamchi", "Natijani nusxalash"); nusxa.type = "button";
  nusxa.addEventListener("click", async () => {
    const ok = await nusxaOl(`sitata.uz viktorinasi: ${vik.ball} ball, ${vik.savollar.length} tadan ${vik.togri} ta to'g'ri.\nSiz ham sinab ko'ring: ${SAYT_MANZILI}#viktorina`);
    nusxa.textContent = ok ? "Nusxalandi ✓" : "Nusxa olinmadi";
  });
  quti.append(qayta, nusxa, havola("#bosh", "barchasi", "Bosh sahifa"));
  s.appendChild(quti);
}

// ---------- Karta yaratish ----------
const KARTA_OLCHAMLARI = { story: [1080, 1920, "Story 9:16"], post: [1080, 1350, "Post 4:5"], kvadrat: [1080, 1080, "Kvadrat 1:1"] };
const KARTA_FONLARI = {
  qogoz:    { nom: "Qog'oz",   bg: ["#FBF4E3", "#E8D9B8"], matn: "#3B2A1A", ikkinchi: "#7A6448", aksent: "#A4502A" },
  zaytun:   { nom: "Zaytun",   bg: ["#56633F", "#323A24"], matn: "#F8F1E1", ikkinchi: "#D9DDC5", aksent: "#E9C46A" },
  tun:      { nom: "Tun",      bg: ["#262B3A", "#12141C"], matn: "#F3EBDD", ikkinchi: "#B7BCC7", aksent: "#C9A26B" },
  terakota: { nom: "Terakota", bg: ["#B9673C", "#7E3F27"], matn: "#FFF7EC", ikkinchi: "#F6DCC6", aksent: "#FFE3A3" },
};
const KARTA_SHRIFTLARI = { lora: ['"Lora", Georgia, serif', "Lora"], playfair: ['"Playfair Display", Georgia, serif', "Playfair"], inter: ['"Inter", system-ui, sans-serif', "Inter"] };
const karta = { raqam: null, olcham: "post", fon: "qogoz", shrift: "lora", portret: true, blob: null };

async function kartaRasminiChiz() {
  const iq = IQTIBOSLAR[karta.raqam];
  const [W, H] = KARTA_OLCHAMLARI[karta.olcham];
  const f = KARTA_FONLARI[karta.fon];
  const shrift = KARTA_SHRIFTLARI[karta.shrift][0];
  try { await Promise.all([document.fonts.load(`600 60px ${shrift}`), document.fonts.load(`italic 500 30px ${shrift}`)]); } catch (e) {}

  const c = document.createElement("canvas"); c.width = W; c.height = H;
  const ctx = c.getContext("2d");
  const g = ctx.createLinearGradient(0, 0, W * 0.4, H);
  g.addColorStop(0, f.bg[0]); g.addColorStop(1, f.bg[1]);
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = f.aksent; ctx.globalAlpha = 0.5; ctx.lineWidth = 3;           // ingichka hoshiya
  ctx.strokeRect(40, 40, W - 80, H - 80); ctx.globalAlpha = 1;

  const P = 110, kenglik = W - 2 * P;
  const portretOlchami = karta.portret ? (karta.olcham === "kvadrat" ? 150 : 200) : 0;
  const pastBlok = 70 + 40 + (portretOlchami ? portretOlchami + 40 : 0) + 120;   // ism, ma'lumot, portret, sayt
  const tepa = karta.olcham === "story" ? 300 : 170;
  const matnBalandligi = H - tepa - 80 - pastBlok - 60;   // qo'shtirnoq ostidan muallif chizig'igacha

  // Katta qo'shtirnoq
  ctx.fillStyle = f.aksent; ctx.textAlign = "left"; ctx.font = `600 200px ${shrift}`;
  ctx.fillText("“", P - 10, tepa + 40);

  // Iqtibos matni — sig'guncha kichrayadi va bo'sh joyning o'rtasiga joylashadi
  let o = { story: 96, post: 88, kvadrat: 76 }[karta.olcham], qatorlar;
  do { ctx.font = `500 ${o}px ${shrift}`; qatorlar = qatorlargaBol(ctx, iq.matn, kenglik); o -= 2; }
  while (qatorlar.length * o * 1.35 > matnBalandligi && o > 30);
  o += 2;
  const blokBalandligi = qatorlar.length * o * 1.35;
  ctx.fillStyle = f.matn; ctx.textAlign = "left";
  let y = tepa + 80 + Math.max(0, (matnBalandligi - blokBalandligi) / 2) + o;
  qatorlar.forEach((q) => { ctx.fillText(q, P, y); y += o * 1.35; });

  // Muallif bloki
  y = H - pastBlok;
  ctx.fillStyle = f.aksent; ctx.fillRect(P, y, 80, 4);
  y += 30;
  let ismX = P;
  if (portretOlchami) {
    const img = await rasmYukla(MUALLIFLAR[iq.muallif].rasm);
    const r = portretOlchami / 2, cx = P + r, cy = y + r;
    ctx.save(); ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.closePath(); ctx.clip();
    if (img) {
      const k = Math.max(portretOlchami / img.width, portretOlchami / img.height);
      const sw = portretOlchami / k, sh = portretOlchami / k;
      ctx.drawImage(img, (img.width - sw) / 2, 0, sw, sh, P, y, portretOlchami, portretOlchami);
    } else {
      ctx.fillStyle = f.aksent; ctx.fillRect(P, y, portretOlchami, portretOlchami);
      ctx.fillStyle = f.bg[1]; ctx.textAlign = "center"; ctx.font = `600 ${r * 0.8}px ${shrift}`;
      ctx.fillText(boshHarflar(iq.muallif), cx, cy + r * 0.28); ctx.textAlign = "left";
    }
    ctx.restore();
    ctx.strokeStyle = f.aksent; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.stroke();
    ismX = P + portretOlchami + 36;
    y += r - 10;
  }
  ctx.fillStyle = f.matn; ctx.font = `600 52px ${shrift}`;
  ctx.fillText(iq.muallif, ismX, y + 20);
  const m = MUALLIFLAR[iq.muallif];
  ctx.fillStyle = f.ikkinchi; ctx.font = `italic 500 30px ${shrift}`;
  ctx.fillText(iq.asar ? iq.asar : `${m.kasb} · ${m.yillar || davrMatni(m.davr)}`, ismX, y + 68);

  ctx.fillStyle = f.ikkinchi; ctx.textAlign = "right"; ctx.font = `600 30px ${shrift}`;
  ctx.fillText("sitata.uz", W - P, H - 80);

  return new Promise((ok) => c.toBlob(ok, "image/png"));
}

function kartaniChiz(param) {
  const s = $("kartaSahifa");
  s.innerHTML = "";
  s.appendChild(yarat("h2", "sahifa-sarlavha", "Karta yaratish"));
  const ochiq = ochiqIqtiboslar();
  const soralgan = IQTIBOSLAR[parseInt(param, 10)];
  if (soralgan && !yashirinmi(soralgan)) karta.raqam = IQTIBOSLAR.indexOf(soralgan);
  if (karta.raqam == null || yashirinmi(IQTIBOSLAR[karta.raqam])) karta.raqam = IQTIBOSLAR.indexOf(ochiq[0]);

  const sozlama = yarat("div", "karta-sozlama");
  // Iqtibos tanlash
  const tanla = yarat("select", "tanlash");
  ochiq.forEach((iq) => {
    const o = yarat("option", "", `${iq.matn.replace(/\n/g, " ").slice(0, 48)}${iq.matn.length > 48 ? "…" : ""} — ${iq.muallif}`);
    o.value = IQTIBOSLAR.indexOf(iq); o.selected = o.value == karta.raqam;
    tanla.appendChild(o);
  });
  const qator = (nom, ichi) => { const q = yarat("div", "sozlama-qator"); q.append(yarat("span", "sozlama-nom", nom), ichi); return q; };
  sozlama.appendChild(qator("Iqtibos", tanla));

  const tanlovGuruhi = (obyekt, kalit, matnOl) => {
    const g = yarat("div", "tanlov-guruhi");
    Object.keys(obyekt).forEach((k) => {
      const b = yarat("button", "filtr" + (karta[kalit] === k ? " faol" : ""), matnOl(k)); b.type = "button";
      if (kalit === "fon") { b.style.setProperty("--namuna", obyekt[k].bg[0]); b.classList.add("fon-namuna"); }
      b.addEventListener("click", () => { karta[kalit] = k; g.querySelectorAll("button").forEach((x) => x.classList.toggle("faol", x === b)); yangila(); });
      g.appendChild(b);
    });
    return g;
  };
  sozlama.appendChild(qator("O'lcham", tanlovGuruhi(KARTA_OLCHAMLARI, "olcham", (k) => KARTA_OLCHAMLARI[k][2])));
  sozlama.appendChild(qator("Fon", tanlovGuruhi(KARTA_FONLARI, "fon", (k) => KARTA_FONLARI[k].nom)));
  sozlama.appendChild(qator("Shrift", tanlovGuruhi(KARTA_SHRIFTLARI, "shrift", (k) => KARTA_SHRIFTLARI[k][1])));
  const portretTanlov = yarat("label", "belgilash");
  const cb = yarat("input"); cb.type = "checkbox"; cb.checked = karta.portret;
  portretTanlov.append(cb, document.createTextNode(" Muallif portretini qo'shish"));
  sozlama.appendChild(portretTanlov);
  s.appendChild(sozlama);

  const korinish = yarat("img", "karta-korinish"); korinish.alt = "Karta ko'rinishi";
  s.appendChild(korinish);
  const ulash = yarat("button", "asosiy", "Kartani ulashish"); ulash.type = "button";
  const yuklab = yarat("button", "ikkilamchi", "Yuklab olish"); yuklab.type = "button";
  const xabar = yarat("p", "ulash-xabar"); xabar.setAttribute("role", "status");
  s.append(ulash, yuklab, xabar);

  let navbat = 0;
  async function yangila() {
    const mening_navbatim = ++navbat;
    ulash.disabled = yuklab.disabled = true; xabar.textContent = "";
    try {
      const blob = await kartaRasminiChiz();
      if (mening_navbatim !== navbat) return;
      karta.blob = blob;
      korinish.src = await new Promise((ok) => { const r = new FileReader(); r.onload = () => ok(r.result); r.readAsDataURL(blob); });
      korinish.className = "karta-korinish " + karta.olcham;
      ulash.disabled = yuklab.disabled = false;
    } catch (e) { xabar.textContent = "Karta chizilmadi — sahifani sayt manzili orqali oching."; }
  }
  tanla.addEventListener("change", () => { karta.raqam = parseInt(tanla.value, 10); yangila(); });
  cb.addEventListener("change", () => { karta.portret = cb.checked; yangila(); });
  ulash.addEventListener("click", () => { if (karta.blob) faylniUlash(karta.blob, "sitata-karta.png", xabar); });
  yuklab.addEventListener("click", () => { if (karta.blob) { rasmniYuklabOl(karta.blob, "sitata-karta.png"); xabar.textContent = "Rasm yuklab olindi."; } });
  yangila();
}

// ---------- Reyting ----------
const REYTING_TURLARI = {
  topilgan: { nom: "Ko'p topganlar", sozla: (q) => q.gt("topilgan", 0).order("topilgan", { ascending: false }).order("ortacha_xato", { ascending: true, nullsFirst: false }),
    asosiy: (r) => `${r.topilgan} ta`, izoh: (r) => `${r.oyinlar} o'yin · o'rtacha ${r.ortacha_xato ?? 0} xato` },
  seriya: { nom: "Seriya", sozla: (q) => q.gt("joriy_seriya", 0).order("joriy_seriya", { ascending: false }).order("eng_uzun_seriya", { ascending: false }),
    asosiy: (r) => `🔥 ${r.joriy_seriya}`, izoh: (r) => `eng uzun seriya: ${r.eng_uzun_seriya} kun` },
  baho: { nom: "Baholar", sozla: (q) => q.gt("baholar_soni", 0).order("ortacha_baho", { ascending: false }).order("baholar_soni", { ascending: false }),
    asosiy: (r) => `★ ${Number(r.ortacha_baho).toFixed(1)}`, izoh: (r) => `${r.baholar_soni} ta baho` },
};
let reytingTuri = "topilgan";

async function reytingniChiz() {
  const s = $("reytingSahifa");
  s.innerHTML = "";
  s.appendChild(yarat("h2", "sahifa-sarlavha", "Reyting"));
  const tablar = yarat("div", "filtrlar markaz-flex");
  Object.keys(REYTING_TURLARI).forEach((k) => {
    const b = yarat("button", "filtr" + (k === reytingTuri ? " faol" : ""), REYTING_TURLARI[k].nom); b.type = "button";
    b.addEventListener("click", () => { reytingTuri = k; reytingniChiz(); });
    tablar.appendChild(b);
  });
  s.appendChild(tablar);
  const royxat = yarat("ol", "reyting-royxat");
  const holatMatni = yarat("p", "bosh-holat", "Yuklanmoqda…");
  s.append(holatMatni, royxat);
  if (!mening) s.appendChild(havola("#kim-aytgan", "barchasi", "Reytingga kirish uchun o'ynang va profil oching →"));

  if (!BAZA_YOQIQ) { holatMatni.textContent = "Reyting hali sozlanmagan."; return; }
  const tur = REYTING_TURLARI[reytingTuri];
  let javob;
  try {
    const m = await mijozOl();
    javob = await tur.sozla(m.from("reyting").select("kod,ism,oyinlar,topilgan,ortacha_xato,joriy_seriya,eng_uzun_seriya,ortacha_baho,baholar_soni")).limit(50);
  } catch (e) { javob = { error: e }; }
  if (REYTING_TURLARI[reytingTuri] !== tur) return; // kutish paytida boshqa tab tanlangan
  if (javob.error) {
    holatMatni.textContent = /reyting|PGRST205|42P01/.test(JSON.stringify(javob.error))
      ? "Reyting jadvali hali yoqilmagan." : "Reytingni yuklab bo'lmadi — internetni tekshiring.";
    return;
  }
  const qatorlar = javob.data || [];
  holatMatni.textContent = qatorlar.length ? "" : "Hali hech kim yo'q — birinchi bo'ling!";
  qatorlar.forEach((r, i) => {
    const li = yarat("li", "reyting-qator" + (mening && r.kod === mening.kod ? " meniki" : ""));
    li.appendChild(yarat("span", "orin", i < 3 ? ["🥇", "🥈", "🥉"][i] : String(i + 1)));
    const nom = yarat("div", "reyting-nom");
    nom.append(havola("?p=" + r.kod, "", r.ism), yarat("small", "", tur.izoh(r)));
    li.append(nom, yarat("b", "reyting-ball", tur.asosiy(r)));
    royxat.appendChild(li);
  });
}

// ---------- Profilim ----------
function profilimniChiz() {
  if (mening) { profilSahifasiniKor(mening.kod); return; }
  const s = $("profilSahifa");
  s.classList.remove("yashirin");
  s.innerHTML = "";
  s.append(yarat("h2", "", "Profilim"));
  if (!BAZA_YOQIQ) { s.appendChild(yarat("p", "kichik-matn", "Profillar hali sozlanmagan.")); return; }
  s.appendChild(yarat("p", "kichik-matn", "Profil oching — natijalaringiz saqlanadi, reytingga kirasiz va do'stlaringiz sizga baho beradi. Ro'yxatdan o'tish shart emas."));
  const qator = yarat("div", "qator profil-forma");
  const kirit = yarat("input"); kirit.placeholder = "Ismingiz"; kirit.maxLength = 30; kirit.autocomplete = "nickname";
  const tugma = yarat("button", "kichik", "Profil ochish"); tugma.type = "button";
  const xato = yarat("p", "kichik-matn");
  tugma.addEventListener("click", async () => {
    const ism = kirit.value.trim();
    if (!ism) { xato.textContent = "Ismingizni yozing."; kirit.focus(); return; }
    tugma.disabled = true; tugma.textContent = "Ochilmoqda…";
    try { await profilYarat(ism); await natijaniYoz(); profilSahifasiniKor(mening.kod); }
    catch (e) { tugma.disabled = false; tugma.textContent = "Profil ochish"; xato.textContent = "Profil ochilmadi — internetni tekshirib, qayta urinib ko'ring."; }
  });
  kirit.addEventListener("keydown", (e) => { if (e.key === "Enter") tugma.click(); });
  qator.append(kirit, tugma);
  s.append(qator, xato);
}

// ---------- Ishga tushirish ----------
portretniQur();
chiz();
natijaniYoz();   // oldingi safar internet bo'lmagan bo'lsa
sahifaniKor();

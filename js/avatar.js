// ===== PROFIL RASMI =====
// profillar.rasm: 'q:<kalit>' — saytdagi tayyor qahramon (muallif portreti yoki chizilgan qahramon),
//                 '<uid>/<uuid>.jpg' — foydalanuvchining o'z surati (ochiq «avatarlar» bucket'i).
// Chizilgan qahramonlar — sayt uchun chizilgan oddiy SVG obrazlar (aktyorlar yoki rasmiy suratlar emas).

const TERI = ["#F1C9A0", "#E0AC7E", "#C98E62"];

// Qahramon tavsifi: fon, teri, soch, bosh kiyim, soqol/mo'ylov, kiyim, buyum, qo'shimchalar
const QAHRAMONLAR = {
  asar: [
    ["otabek", "Otabek", "«O'tgan kunlar»", { fon: "#3F6E99", teri: 0, soch: "qisqa", sochRang: "#2A1D14", bosh: "doppi", yuz: "moylov", kiyim: "#2F6B4F", chiziq: "#D9B26A" }],
    ["kumush", "Kumush", "«O'tgan kunlar»", { fon: "#B5577A", teri: 0, soch: "ormaq", sochRang: "#2A1D14", bosh: "doppi", kiyim: "#C0436B", chiziq: "#F2D06B", ayol: 1 }],
    ["anvar", "Anvar", "«Mehrobdan chayon»", { fon: "#6B5A2E", teri: 1, soch: "qisqa", sochRang: "#1F1712", bosh: "doppi", kiyim: "#4A5E8C", chiziq: "#E8D3A8", buyum: "kitob" }],
    ["nasriddin", "Nasriddin Afandi", "xalq latifalari", { fon: "#D98C3F", teri: 1, bosh: "salla", yuz: "oqsoqol", kiyim: "#7B2E2E", chiziq: "#F2D06B", kulgi: 1 }],
    ["alpomish", "Alpomish", "doston", { fon: "#5A4A7A", teri: 1, bosh: "dubulga", yuz: "soqol", sochRang: "#2A1D14", kiyim: "#8A8F99", buyum: "qilich" }],
    ["gorogli", "Go'ro'g'li", "doston", { fon: "#4F5B3A", teri: 1, bosh: "telpak", yuz: "moylov", sochRang: "#2A1D14", kiyim: "#8C4A2F", buyum: "kamon" }],
    ["majnun", "Majnun", "«Layli va Majnun»", { fon: "#9A7B4F", teri: 2, soch: "tartibsiz", sochRang: "#3A2A1C", yuz: "soqol", kiyim: "#A38B6A" }],
    ["farhod", "Farhod", "«Farhod va Shirin»", { fon: "#7A3F3F", teri: 1, soch: "jingalak", sochRang: "#2A1D14", yuz: "moylov", kiyim: "#4E5B6B", buyum: "tesha" }],
    ["hamlet", "Hamlet", "Shekspir", { fon: "#2E3A4A", teri: 0, soch: "ortga", sochRang: "#1A1410", kiyim: "#1F1F24", yoqa: "#EDE6D6", buyum: "kalla" }],
    ["donkixot", "Don Kixot", "Servantes", { fon: "#B88A3E", teri: 0, bosh: "ritsar", yuz: "echki", sochRang: "#9C9C9C", kiyim: "#8A8F99", ozgin: 1, buyum: "nayza" }],
    ["sherlok", "Sherlok Xolms", "Konan Doyl", { fon: "#5E6B4F", teri: 0, soch: "qisqa", sochRang: "#3A2A1C", bosh: "sherlok", kiyim: "#7A6448", buyum: "trubka" }],
    ["robinzon", "Robinzon Kruzo", "Defo", { fon: "#3E8C7A", teri: 2, bosh: "telpak", yuz: "soqol", sochRang: "#5A3A22", kiyim: "#8C6A3F", buyum: "toti" }],
    ["anna", "Anna Karenina", "Tolstoy", { fon: "#5E3A6B", teri: 0, soch: "turmak", sochRang: "#2A1D14", kiyim: "#3A2440", yoqa: "#EDE6D6", ayol: 1 }],
  ],
  kino: [
    ["shumbola", "Shum bola", "«Shum bola»", { fon: "#E0A040", teri: 1, bosh: "doppi", kiyim: "#3F6E99", chiziq: "#F8F1E1", sepkil: 1, kulgi: 1 }],
    ["sharlo", "Sharlo", "ovsiz kino", { fon: "#8A8F99", teri: 0, soch: "jingalak", sochRang: "#1A1410", bosh: "kotelok", yuz: "chaplinmoylov", kiyim: "#1F1F24", yoqa: "#EDE6D6", buyum: "tayoq" }],
    ["zorro", "Zorro", "sarguzasht kino", { fon: "#9E2B2B", teri: 1, bosh: "zorro", yuz: "moylov", sochRang: "#1A1410", niqob: 1, kiyim: "#1A1A1E", buyum: "qilich" }],
    ["robingud", "Robin Gud", "sarguzasht kino", { fon: "#3F7A3A", teri: 0, soch: "qisqa", sochRang: "#8C5A2B", bosh: "robin", yuz: "echki", sochRang2: "#8C5A2B", kiyim: "#2F5E2A", buyum: "kamon" }],
    ["drakula", "Drakula", "qo'rqinchli kino", { fon: "#3A1F2E", teri: 0, soch: "ortga", sochRang: "#141014", kiyim: "#141014", yoqa: "#9E1B2E", tishlar: 1, rangpar: 1 }],
    ["mumiyo", "Mumiyo", "qo'rqinchli kino", { fon: "#6B5A2E", teri: 0, mumiyo: 1, kiyim: "#E8DCC0" }],
    ["robot", "Robot", "fantastik kino", { fon: "#2A4357", robot: 1, kiyim: "#9AA4AE" }],
    ["kosmonavt", "Kosmonavt", "fantastik kino", { fon: "#141E3A", teri: 1, soch: "qisqa", sochRang: "#2A1D14", skafandr: 1, kiyim: "#E6E6E6" }],
  ],
};

function qahramonSVG(t) {
  const teri = t.rangpar ? "#E8E3EA" : TERI[t.teri || 0];
  const s = [];
  s.push(`<circle cx="50" cy="50" r="50" fill="${t.fon}"/>`);
  // Kiyim (yelka)
  if (t.skafandr) s.push(`<path d="M14 100 Q16 72 50 70 Q84 72 86 100 Z" fill="${t.kiyim}"/><rect x="42" y="78" width="16" height="10" rx="2" fill="#3F6E99"/><circle cx="46" cy="83" r="2" fill="#E04040"/><circle cx="54" cy="83" r="2" fill="#F2D06B"/>`);
  else if (t.robot) s.push(`<path d="M18 100 L22 74 L78 74 L82 100 Z" fill="${t.kiyim}"/><rect x="40" y="80" width="20" height="10" rx="2" fill="#2A4357"/><circle cx="45" cy="85" r="2" fill="#6BE06B"/><circle cx="55" cy="85" r="2" fill="#E04040"/>`);
  else {
    s.push(`<path d="M${t.ozgin ? 20 : 14} 100 Q${t.ozgin ? 22 : 16} 70 50 68 Q${t.ozgin ? 78 : 84} 70 ${t.ozgin ? 80 : 86} 100 Z" fill="${t.kiyim}"/>`);
    if (t.chiziq) for (let x = 24; x <= 76; x += 9) s.push(`<path d="M${x} 100 Q${x + 1} 84 ${x + (x < 50 ? 4 : -4)} 72" stroke="${t.chiziq}" stroke-width="2" fill="none" opacity=".75"/>`);
    if (t.yoqa) s.push(`<path d="M38 70 L50 82 L62 70 Z" fill="${t.yoqa}"/>`);
    if (t.mumiyo) s.push(`<path d="M18 86 L82 80 M16 94 L84 90" stroke="#C9BC9C" stroke-width="3"/>`);
  }
  // Bo'yin
  if (!t.robot && !t.skafandr) s.push(`<rect x="43" y="58" width="14" height="13" rx="4" fill="${teri}"/>`);
  // Orqa soch (uzun)
  const sr = t.sochRang || "#2A1D14";
  if (t.soch === "ormaq") s.push(`<path d="M29 44 Q28 78 34 86 L39 86 Q36 70 37 48 Z M71 44 Q72 78 66 86 L61 86 Q64 70 63 48 Z" fill="${sr}"/>`);
  if (t.soch === "tartibsiz") s.push(`<path d="M24 50 Q18 30 34 22 Q42 12 54 18 Q70 12 76 28 Q86 40 76 58 Q74 46 70 40 L30 40 Q26 46 26 58 Z" fill="${sr}"/>`);
  // Bosh
  if (t.robot) {
    s.push(`<rect x="28" y="22" width="44" height="40" rx="8" fill="#B8C2CC" stroke="#6B7A88" stroke-width="2"/><line x1="50" y1="22" x2="50" y2="12" stroke="#6B7A88" stroke-width="2"/><circle cx="50" cy="10" r="3" fill="#E04040"/>`);
    s.push(`<circle cx="40" cy="40" r="6" fill="#2A4357"/><circle cx="60" cy="40" r="6" fill="#2A4357"/><circle cx="40" cy="40" r="2.5" fill="#8FD3FF"/><circle cx="60" cy="40" r="2.5" fill="#8FD3FF"/><rect x="40" y="51" width="20" height="4" rx="2" fill="#2A4357"/>`);
    return svgOrami(s);
  }
  if (t.skafandr) s.push(`<circle cx="50" cy="42" r="28" fill="#E6E6E6" stroke="#B8B8B8" stroke-width="2"/>`);
  s.push(`<ellipse cx="50" cy="42" rx="${t.ozgin ? 16 : 18}" ry="${t.ozgin ? 22 : 20}" fill="${teri}"/>`);
  s.push(`<ellipse cx="${t.ozgin ? 34 : 32}" cy="44" rx="3" ry="4.5" fill="${teri}"/><ellipse cx="${t.ozgin ? 66 : 68}" cy="44" rx="3" ry="4.5" fill="${teri}"/>`);
  // Old soch
  if (t.soch === "qisqa") s.push(`<path d="M32 40 Q31 22 50 21 Q69 22 68 40 Q64 30 50 29 Q36 30 32 40 Z" fill="${sr}"/>`);
  if (t.soch === "ortga") s.push(`<path d="M32 42 Q30 20 50 20 Q70 20 68 42 Q66 30 58 28 L50 36 L42 28 Q34 30 32 42 Z" fill="${sr}"/>`);
  if (t.soch === "jingalak") s.push(`<path d="M31 40 Q27 30 33 26 Q34 18 42 20 Q46 14 52 18 Q60 14 64 21 Q72 22 69 32 Q71 38 68 41 Q64 30 50 29 Q36 30 31 40 Z" fill="${sr}"/>`);
  if (t.soch === "tartibsiz") s.push(`<path d="M32 38 Q30 22 46 22 Q56 16 64 24 Q70 28 68 38 Q60 28 50 30 Q40 28 32 38 Z" fill="${sr}"/>`);
  if (t.soch === "ormaq" || t.soch === "turmak") s.push(`<path d="M32 42 Q30 22 50 21 Q70 22 68 42 Q62 28 50 28 Q38 28 32 42 Z" fill="${sr}"/>`);
  if (t.soch === "turmak") s.push(`<circle cx="50" cy="18" r="9" fill="${sr}"/>`);
  if (t.mumiyo) s.push(`<path d="M32 30 L68 26 M31 38 L69 35 M32 50 L68 47 M34 58 L66 56" stroke="#C9BC9C" stroke-width="4"/>`);
  // Ko'zlar va qosh
  if (t.niqob) s.push(`<path d="M30 38 Q50 32 70 38 L70 46 Q50 42 30 46 Z" fill="#111"/>`);
  if (t.skafandr) {} // ko'zlar quyida
  const kz = t.mumiyo ? "#3A2A1C" : "#2A1D14";
  s.push(`<circle cx="43" cy="42" r="${t.niqob ? 1.8 : 2.4}" fill="${t.niqob ? "#F8F1E1" : kz}"/><circle cx="57" cy="42" r="${t.niqob ? 1.8 : 2.4}" fill="${t.niqob ? "#F8F1E1" : kz}"/>`);
  if (!t.niqob && !t.mumiyo) s.push(`<path d="M39 36 Q43 34 46 36 M54 36 Q57 34 61 36" stroke="${t.rangpar ? "#141014" : sr}" stroke-width="1.8" fill="none" stroke-linecap="round"/>`);
  if (t.sepkil) s.push(`<g fill="#B5734A" opacity=".7"><circle cx="40" cy="48" r=".9"/><circle cx="43" cy="49.5" r=".9"/><circle cx="38" cy="50" r=".9"/><circle cx="60" cy="48" r=".9"/><circle cx="57" cy="49.5" r=".9"/><circle cx="62" cy="50" r=".9"/></g>`);
  if (t.ayol) s.push(`<circle cx="40" cy="49" r="2.6" fill="#E88A9A" opacity=".45"/><circle cx="60" cy="49" r="2.6" fill="#E88A9A" opacity=".45"/>`);
  // Og'iz
  if (t.tishlar) s.push(`<path d="M44 53 Q50 56 56 53" stroke="#5A1F1F" stroke-width="1.6" fill="none"/><path d="M46 53.6 L47 56.5 L48 54 M52 54 L53 56.5 L54 53.6" fill="#FFF"/>`);
  else if (t.kulgi) s.push(`<path d="M43 52 Q50 59 57 52 Z" fill="#7B2E2E"/>`);
  else if (!t.mumiyo) s.push(`<path d="M45 53 Q50 56 55 53" stroke="#7B3E2E" stroke-width="1.6" fill="none" stroke-linecap="round"/>`);
  // Soqol / mo'ylov
  if (t.yuz === "moylov") s.push(`<path d="M42 51 Q46 47 50 49.5 Q54 47 58 51 Q54 50 50 51.5 Q46 50 42 51 Z" fill="${sr}"/>`);
  if (t.yuz === "chaplinmoylov") s.push(`<rect x="46.5" y="48" width="7" height="3" rx="1" fill="${sr}"/>`);
  if (t.yuz === "soqol" || t.yuz === "oqsoqol") {
    const r = t.yuz === "oqsoqol" ? "#F2EEE6" : sr;
    s.push(`<path d="M32 44 Q34 66 50 72 Q66 66 68 44 Q64 56 58 54 Q50 58 42 54 Q36 56 32 44 Z" fill="${r}"/><path d="M42 51 Q46 47 50 49.5 Q54 47 58 51 Q54 50 50 51.5 Q46 50 42 51 Z" fill="${r}"/>`);
    if (t.kulgi) s.push(`<path d="M44 54 Q50 59 56 54 Z" fill="#7B2E2E"/>`);
  }
  if (t.yuz === "echki") s.push(`<path d="M47 56 Q50 66 53 56 Z" fill="${t.sochRang2 || sr}"/><path d="M43 51 Q50 48 57 51" stroke="${t.sochRang2 || sr}" stroke-width="1.8" fill="none"/>`);
  // Bosh kiyimlar
  const b = t.bosh;
  if (b === "doppi") s.push(`<path d="M32 32 L35 18 Q50 13 65 18 L68 32 Q50 27 32 32 Z" fill="#1F1F24"/><path d="M38 20 l3 4 l-3 4 l-3 -4 z M50 17 l3 4 l-3 4 l-3 -4 z M62 20 l3 4 l-3 4 l-3 -4 z" fill="#F8F1E1"/>`);
  if (b === "salla") s.push(`<ellipse cx="50" cy="24" rx="26" ry="14" fill="#F4EFE4" stroke="#D8CFBD" stroke-width="1.5"/><path d="M28 26 Q50 16 72 24 M30 20 Q50 12 70 18" stroke="#D8CFBD" stroke-width="1.5" fill="none"/><circle cx="50" cy="12" r="4" fill="#2F6B4F"/>`);
  if (b === "dubulga") s.push(`<path d="M30 36 Q30 14 50 12 Q70 14 70 36 Z" fill="#9AA4AE" stroke="#6B7A88" stroke-width="1.5"/><path d="M50 12 L50 2" stroke="#6B7A88" stroke-width="3"/><rect x="48" y="30" width="4" height="14" fill="#6B7A88"/>`);
  if (b === "telpak") s.push(`<path d="M28 34 Q26 12 50 10 Q74 12 72 34 Q50 28 28 34 Z" fill="#3A2A1C"/><path d="M30 30 q3 -4 6 0 q3 -4 6 0 q3 -4 6 0 q3 -4 6 0 q3 -4 6 0 q3 -4 6 0 q3 -4 4 0" stroke="#5A4330" stroke-width="2" fill="none"/>`);
  if (b === "ritsar") s.push(`<path d="M30 30 Q30 14 50 14 Q70 14 70 30 L74 32 L26 32 Z" fill="#C9A44A" stroke="#8A6A1E" stroke-width="1.5"/>`);
  if (b === "sherlok") s.push(`<path d="M30 32 Q30 14 50 14 Q70 14 70 32 Z" fill="#9A7B4F"/><path d="M30 32 L26 36 L36 33 M70 32 L74 36 L64 33" fill="#7A6448" stroke="#7A6448" stroke-width="3"/><path d="M34 24 L66 24 M33 28 L67 28" stroke="#7A6448" stroke-width="1"/>`);
  if (b === "kotelok") s.push(`<ellipse cx="50" cy="30" rx="24" ry="4" fill="#141414"/><path d="M34 30 Q34 12 50 12 Q66 12 66 30 Z" fill="#1F1F24"/>`);
  if (b === "zorro") s.push(`<ellipse cx="50" cy="28" rx="34" ry="6" fill="#141414"/><path d="M36 28 L38 12 L62 12 L64 28 Z" fill="#1A1A1E"/>`);
  if (b === "robin") s.push(`<path d="M28 32 Q40 8 74 22 L66 32 Z" fill="#3F7A3A"/><path d="M60 22 Q74 6 82 10 Q72 14 64 24 Z" fill="#C62828"/>`);
  if (t.skafandr) s.push(`<circle cx="50" cy="42" r="28" fill="#8FD3FF" opacity=".18"/><path d="M30 28 Q38 18 50 16" stroke="#FFF" stroke-width="3" fill="none" opacity=".7"/>`);
  // Buyumlar
  const u = t.buyum;
  if (u === "kitob") s.push(`<rect x="62" y="74" width="20" height="16" rx="1" fill="#8C4A2F" transform="rotate(-12 72 82)"/><rect x="64" y="76" width="16" height="12" fill="#F8F1E1" transform="rotate(-12 72 82)"/>`);
  if (u === "qilich") s.push(`<path d="M80 96 L86 40" stroke="#D0D6DC" stroke-width="4" stroke-linecap="round"/><path d="M76 88 L88 90" stroke="#8A6A1E" stroke-width="4"/>`);
  if (u === "kamon") s.push(`<path d="M80 98 Q96 66 80 34" stroke="#8C5A2B" stroke-width="3.5" fill="none"/><path d="M80 98 L80 34" stroke="#E8DCC0" stroke-width="1"/>`);
  if (u === "tesha") s.push(`<path d="M78 98 L84 50" stroke="#8C5A2B" stroke-width="4"/><path d="M72 52 Q84 42 96 50 L84 54 Z" fill="#9AA4AE"/>`);
  if (u === "nayza") s.push(`<path d="M84 100 L88 18" stroke="#8C5A2B" stroke-width="3"/><path d="M85 22 L88 8 L91 22 Z" fill="#C0C6CC"/>`);
  if (u === "kalla") s.push(`<g transform="translate(70 78)"><ellipse cx="0" cy="0" rx="9" ry="10" fill="#EDE6D6"/><rect x="-5" y="6" width="10" height="7" rx="2" fill="#EDE6D6"/><circle cx="-3.5" cy="0" r="2.6" fill="#2A1D14"/><circle cx="3.5" cy="0" r="2.6" fill="#2A1D14"/></g>`);
  if (u === "trubka") s.push(`<path d="M55 55 Q62 60 66 58" stroke="#5A3A22" stroke-width="2.5" fill="none"/><rect x="64" y="52" width="6" height="8" rx="2" fill="#5A3A22"/>`);
  if (u === "toti") s.push(`<g transform="translate(76 66)"><ellipse cx="0" cy="0" rx="7" ry="10" fill="#3FA34D"/><circle cx="0" cy="-9" r="5.5" fill="#E04040"/><path d="M4 -9 L9 -7 L4 -5 Z" fill="#F2D06B"/><circle cx="1.5" cy="-10" r="1" fill="#111"/></g>`);
  if (u === "tayoq") s.push(`<path d="M80 100 L84 66 Q86 58 92 60" stroke="#3A2A1C" stroke-width="3" fill="none" stroke-linecap="round"/>`);
  return svgOrami(s);
}
const svgOrami = (s) => `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">${s.join("")}</svg>`;   // doira — CSS (border-radius)

// Muallif portretlari (rasmlar/ papkasidagi suratlar)
function muallifQahramonlari() {
  return Object.entries(MUALLIFLAR).filter(([, m]) => m.rasm).map(([ism, m]) => ["m-" + m.rasm.replace(/^.*\//, "").replace(/\.\w+$/, ""), ism, m.yillar || "", m.rasm]);
}

// Kalit bo'yicha rasm manbasi: { img } yoki { svg }
function profilRasmiManbasi(rasm) {
  if (!rasm) return null;
  if (rasm.startsWith("q:m-")) { const q = muallifQahramonlari().find((x) => x[0] === rasm.slice(2)); return q ? { img: q[3], nom: q[1] } : null; }
  if (rasm.startsWith("q:")) {
    for (const guruh of Object.values(QAHRAMONLAR)) {
      const q = guruh.find((x) => x[0] === rasm.slice(2));
      if (q) return { svg: qahramonSVG(q[3]), nom: q[1] };
    }
    return null;
  }
  return { img: `${SUPABASE_URL}/storage/v1/object/public/avatarlar/${rasm}`, nom: "" };
}

// Profil rasmi elementi (rasm bo'lmasa — ism bosh harfi)
function avatarEl(p, olcham, sinf) {
  const q = yarat("span", "avatar" + (sinf ? " " + sinf : ""));
  q.style.width = q.style.height = olcham + "px";
  const m = p && profilRasmiManbasi(p.rasm);
  if (m && m.img) { const i = yarat("img"); i.src = m.img; i.alt = ""; i.loading = "lazy"; i.decoding = "async"; q.appendChild(i); }
  else if (m && m.svg) q.innerHTML = m.svg;
  else {
    q.classList.add("harfli"); q.style.fontSize = Math.round(olcham * 0.42) + "px";
    q.textContent = ((p && p.ism) || "?").trim().charAt(0).toUpperCase();
  }
  q.setAttribute("aria-hidden", "true");
  return q;
}

// O'z suratini kvadratga qirqish: surish va kattalashtirish → 320×320 JPEG
function avatarQirqish(fayl) {
  return new Promise(async (natija) => {
    let manba;
    try { manba = await rasmniOch(fayl); } catch (e) { alert("Bu rasmni ochib bo'lmadi — JPG yoki PNG tanlang."); natija(null); return; }
    const oyna = yarat("div", "tahrir"); oyna.setAttribute("role", "dialog"); oyna.setAttribute("aria-label", "Profil rasmini joylash");
    const bosh = yarat("div", "tahrir-bosh");
    const bekor = yarat("button", "matn-tugma", "Bekor"); bekor.type = "button";
    const tayyor = yarat("button", "kichik", "Tayyor ✓"); tayyor.type = "button";
    bosh.append(bekor, yarat("b", "", "Profil rasmi"), tayyor);
    const maydon = yarat("div", "tahrir-maydon");
    const D = Math.min(300, window.innerWidth - 48);
    const kanvas = yarat("canvas", "avatar-kanvas"); kanvas.width = kanvas.height = 600;
    kanvas.style.width = kanvas.style.height = D + "px";
    maydon.appendChild(kanvas);
    const asboblar = yarat("div", "tahrir-asboblar");
    const zum = yarat("input", "surgich"); zum.type = "range"; zum.min = 1; zum.max = 4; zum.step = 0.01; zum.value = 1; zum.setAttribute("aria-label", "Kattalashtirish");
    const q = yarat("div", "tahrir-qator"); q.append(yarat("small", "", "Kattalik:"), zum);
    asboblar.append(q, yarat("p", "tahrir-izoh", "Rasmni barmoq bilan surib, yuzingizni doira ichiga joylang."));
    oyna.append(bosh, maydon, asboblar);
    document.body.appendChild(oyna); document.body.classList.add("oquvchi-ochiq");

    const asos = Math.max(600 / manba.width, 600 / manba.height);
    let k = 1, x = 0, y = 0;     // x,y — markazdan siljish (kanvas piksellarida)
    const chegarala = () => {
      const w = manba.width * asos * k, h = manba.height * asos * k;
      x = Math.max(-(w - 600) / 2, Math.min((w - 600) / 2, x)); y = Math.max(-(h - 600) / 2, Math.min((h - 600) / 2, y));
    };
    const chiz = (doirasiz) => {
      const c = kanvas.getContext("2d"), w = manba.width * asos * k, h = manba.height * asos * k;
      c.fillStyle = "#FFF"; c.fillRect(0, 0, 600, 600);
      c.drawImage(manba, 300 - w / 2 + x, 300 - h / 2 + y, w, h);
      if (!doirasiz) {
        c.save(); c.fillStyle = "rgba(0,0,0,.5)"; c.beginPath(); c.rect(0, 0, 600, 600); c.arc(300, 300, 296, 0, Math.PI * 2, true); c.fill("evenodd");
        c.strokeStyle = "#F2D06B"; c.lineWidth = 4; c.beginPath(); c.arc(300, 300, 296, 0, Math.PI * 2); c.stroke(); c.restore();
      }
    };
    zum.addEventListener("input", () => { k = Number(zum.value); chegarala(); chiz(); });
    let sur = null;
    kanvas.addEventListener("pointerdown", (e) => { e.preventDefault(); kanvas.setPointerCapture(e.pointerId); sur = [e.clientX, e.clientY, x, y]; });
    kanvas.addEventListener("pointermove", (e) => {
      if (!sur) return;
      const m = 600 / kanvas.getBoundingClientRect().width;
      x = sur[2] + (e.clientX - sur[0]) * m; y = sur[3] + (e.clientY - sur[1]) * m; chegarala(); chiz();
    });
    const tugat = () => { sur = null; };
    kanvas.addEventListener("pointerup", tugat); kanvas.addEventListener("pointercancel", tugat);
    kanvas.addEventListener("wheel", (e) => { e.preventDefault(); k = Math.min(4, Math.max(1, k * (e.deltaY < 0 ? 1.08 : 0.93))); zum.value = k; chegarala(); chiz(); }, { passive: false });

    const yop = (b) => { oyna.remove(); document.body.classList.remove("oquvchi-ochiq"); natija(b); };
    bekor.addEventListener("click", () => yop(null));
    tayyor.addEventListener("click", () => {
      chiz(true);
      const c = document.createElement("canvas"); c.width = c.height = 320;
      c.getContext("2d").drawImage(kanvas, 0, 0, 320, 320);
      c.toBlob((b) => yop(b), "image/jpeg", 0.88);
    });
    chiz();
  });
}

// Profil rasmini tanlash oynasi: telefondan yoki tayyor qahramonlardan
function avatarTanlash(profil, saqlandi) {
  const oyna = yarat("div", "avatar-oyna"); oyna.setAttribute("role", "dialog"); oyna.setAttribute("aria-label", "Profil rasmini tanlash");
  const quti = yarat("div", "avatar-quti");
  const bosh = yarat("div", "avatar-bosh");
  const yop = yarat("button", "oquvchi-yop", "✕"); yop.type = "button"; yop.setAttribute("aria-label", "Yopish");
  bosh.append(yarat("b", "", "Profil rasmi"), yop);
  const tablar = yarat("div", "filtrlar");
  const tana = yarat("div", "avatar-tana");
  const xabar = yarat("p", "kichik-matn");
  quti.append(bosh, tablar, tana, xabar);
  oyna.appendChild(quti);
  document.body.appendChild(oyna);
  const ket = () => oyna.remove();
  yop.addEventListener("click", ket);
  oyna.addEventListener("click", (e) => { if (e.target === oyna) ket(); });

  const saqla = async (rasm, eski) => {
    xabar.textContent = "Saqlanmoqda…";
    const m = await mijozOl();
    const { error } = await m.from("profillar").update({ rasm }).eq("id", profil.id);
    if (error) { xabar.textContent = "Saqlanmadi — qayta urinib ko'ring."; return false; }
    if (eski && !eski.startsWith("q:") && eski !== rasm) m.storage.from("avatarlar").remove([eski]).then(() => {});
    profil.rasm = rasm;
    if (mening && mening.id === profil.id) profilniEsla({ ...mening, rasm });
    ket(); saqlandi(rasm);
    return true;
  };

  const TABLAR = [["telefon", "📷 Telefondan"], ["mualliflar", "✒ Mualliflar"], ["asar", "📚 Asar qahramonlari"], ["kino", "🎬 Kino qahramonlari"]];
  let joriy = "asar";
  const katak = (kalit, nom, izoh, el) => {
    const b = yarat("button", "avatar-katak" + (profil.rasm === "q:" + kalit ? " tanlangan" : "")); b.type = "button";
    b.append(el, yarat("b", "", nom), yarat("small", "", izoh));
    b.addEventListener("click", () => saqla("q:" + kalit, profil.rasm));
    return b;
  };
  const chiz = () => {
    tablar.innerHTML = ""; tana.innerHTML = ""; xabar.textContent = "";
    TABLAR.forEach(([k, nom]) => {
      const b = yarat("button", "filtr" + (k === joriy ? " faol" : ""), nom); b.type = "button";
      b.addEventListener("click", () => { joriy = k; chiz(); }); tablar.appendChild(b);
    });
    if (joriy === "telefon") {
      const t = yarat("div", "avatar-telefon");
      const kamera = yarat("input"); kamera.type = "file"; kamera.accept = "image/*"; kamera.setAttribute("capture", "user"); kamera.className = "yashirin";
      const gal = yarat("input"); gal.type = "file"; gal.accept = "image/*"; gal.className = "yashirin";
      const b1 = yarat("button", "asosiy", "🖼 Galereyadan tanlash"); b1.type = "button"; b1.addEventListener("click", () => gal.click());
      const b2 = yarat("button", "ikkilamchi", "🤳 Suratga olish"); b2.type = "button"; b2.addEventListener("click", () => kamera.click());
      [kamera, gal].forEach((i) => i.addEventListener("change", async () => {
        const f = i.files[0]; i.value = ""; if (!f) return;
        oyna.classList.add("yashirin");
        const blob = await avatarQirqish(f);
        oyna.classList.remove("yashirin");
        if (!blob) return;
        xabar.textContent = "Yuklanmoqda…";
        const m = await mijozOl();
        const yol = `${profil.id}/${crypto.randomUUID()}.jpg`;
        const { error } = await m.storage.from("avatarlar").upload(yol, blob, { contentType: "image/jpeg", upsert: false, cacheControl: "31536000" });
        if (error) { xabar.textContent = "Rasm yuklanmadi — internetni tekshirib, qayta urinib ko'ring."; return; }
        if (!(await saqla(yol, profil.rasm))) m.storage.from("avatarlar").remove([yol]).then(() => {});
      }));
      t.append(avatarEl(profil, 96), b1, b2, kamera, gal, yarat("p", "kichik-matn", "Profil rasmingizni hamma ko'radi."));
      if (profil.rasm) {
        const ol = yarat("button", "matn-tugma", "rasmni olib tashlash"); ol.type = "button";
        ol.addEventListener("click", () => saqla(null, profil.rasm));
        t.appendChild(ol);
      }
      tana.appendChild(t);
      return;
    }
    const panjara = yarat("div", "avatar-panjara");
    if (joriy === "mualliflar") muallifQahramonlari().forEach(([k, nom, izoh, src]) => {
      const s = yarat("span", "avatar"); const i = yarat("img"); i.src = src; i.alt = ""; i.loading = "lazy"; s.appendChild(i);
      panjara.appendChild(katak(k, nom, izoh, s));
    });
    else QAHRAMONLAR[joriy].forEach(([k, nom, izoh, t]) => {
      const s = yarat("span", "avatar"); s.innerHTML = qahramonSVG(t);
      panjara.appendChild(katak(k, nom, izoh, s));
    });
    tana.appendChild(panjara);
  };
  chiz();
}

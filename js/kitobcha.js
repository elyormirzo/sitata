// ===== KITOBCHA — kayfiyati o'zgaradigan qahramon =====
// Oxirgi o'yindan beri o'tgan kunlarga qarab: xursand → kutmoqda → xafa → jahldor → chang bosgan → skelet.
// Bosh sahifada, brauzer yorlig'i belgisida (favicon) va kechki push-eslatmada ko'rinadi.

const KAYFIYATLAR = {
  xursand:  { kun: 0,  muqova: "#4F5B3A", muqova2: "#6E7D4E", gap: (k) => "Barakalla! Bugun ham o'ynadingiz. Ertaga yana kutaman! ✨" },
  kutmoqda: { kun: 1,  muqova: "#6B7A4A", muqova2: "#8A9A62", gap: (k) => "Bugungi iqtibos sizni kutmoqda. Bir daqiqa vaqt ajratasizmi?" },
  xafa:     { kun: 2,  muqova: "#6F7F8F", muqova2: "#91A0AE", gap: (k) => `Sizni sog'indim… ${k} kundan beri ko'rinmaysiz.` },
  jahldor:  { kun: 4,  muqova: "#A33A2A", muqova2: "#C8553D", gap: (k) => `${k} kundan beri yo'qsiz! Seriyangiz kuyib ketyapti! 😤` },
  chang:    { kun: 7,  muqova: "#8D877C", muqova2: "#A9A396", gap: (k) => `Ustimni chang bosdi… ${k} kun o'tdi. Bir varaqlab qo'ying.` },
  skelet:   { kun: 14, muqova: "#E8E2D4", muqova2: "#F4EFE3", gap: (k) => `Meni unutdingiz… ${k} kun. Bitta o'yin — va men yana jonlanaman!` },
};

function kayfiyatNomi(kunlar) {
  if (kunlar == null) return "kutmoqda";
  if (kunlar <= 0) return "xursand";
  if (kunlar === 1) return "kutmoqda";
  if (kunlar <= 3) return "xafa";
  if (kunlar <= 6) return "jahldor";
  if (kunlar <= 13) return "chang";
  return "skelet";
}

// Kitobcha SVG: tik turgan qattiq muqovali kitob, muqovada yuz
function kitobchaSVG(nom, olcham) {
  const k = KAYFIYATLAR[nom];
  const qora = "#2B2118";
  let yuz = "", qoshimcha = "", muqova;
  const kitob = (rang, rang2) => `
    <rect x="22" y="14" width="56" height="74" rx="6" fill="${rang}"/>
    <rect x="22" y="14" width="10" height="74" rx="4" fill="${rang2}" opacity=".7"/>
    <rect x="74" y="18" width="6" height="66" rx="2" fill="#F8F1E1"/>
    <path d="M76 22 V80" stroke="#D8C7A3" stroke-width="1"/>`;
  const ko = (x, y, r = 4.2) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${qora}"/><circle cx="${x + 1.3}" cy="${y - 1.4}" r="1.3" fill="#fff"/>`;

  if (nom === "xursand") {
    muqova = kitob(k.muqova, k.muqova2);
    yuz = `${ko(42, 44)}${ko(60, 44)}
      <path d="M41 55 Q51 66 61 55" stroke="${qora}" stroke-width="3" fill="#C8553D" stroke-linecap="round"/>
      <ellipse cx="36" cy="54" rx="4" ry="2.5" fill="#E9967A" opacity=".8"/><ellipse cx="66" cy="54" rx="4" ry="2.5" fill="#E9967A" opacity=".8"/>`;
    qoshimcha = `<path d="M86 14 l2 5 5 2 -5 2 -2 5 -2 -5 -5 -2 5 -2z" fill="#E9C46A"/>
      <path d="M12 30 l1.5 3.5 3.5 1.5 -3.5 1.5 -1.5 3.5 -1.5 -3.5 -3.5 -1.5 3.5 -1.5z" fill="#E9C46A"/>
      <path d="M14 70 l-6 -6 M86 70 l6 -6" stroke="#4F5B3A" stroke-width="3" stroke-linecap="round"/>`;
  } else if (nom === "kutmoqda") {
    muqova = kitob(k.muqova, k.muqova2);
    yuz = `${ko(42, 45)}${ko(60, 45)}<path d="M44 57 Q51 61 58 57" stroke="${qora}" stroke-width="2.6" fill="none" stroke-linecap="round"/>`;
  } else if (nom === "xafa") {
    muqova = kitob(k.muqova, k.muqova2);
    yuz = `<path d="M36 37 L46 40 M66 37 L56 40" stroke="${qora}" stroke-width="2.4" stroke-linecap="round"/>
      ${ko(42, 46)}${ko(60, 46)}<path d="M43 62 Q51 55 59 62" stroke="${qora}" stroke-width="2.6" fill="none" stroke-linecap="round"/>
      <path d="M62 51 Q60 57 62 60 Q64 57 62 51z" fill="#7FB3E0"/>`;
  } else if (nom === "jahldor") {
    muqova = kitob(k.muqova, k.muqova2);
    yuz = `<path d="M35 38 L47 43 M67 38 L55 43" stroke="${qora}" stroke-width="3.2" stroke-linecap="round"/>
      ${ko(42, 47, 3.8)}${ko(60, 47, 3.8)}<path d="M43 61 Q51 55 59 61" stroke="${qora}" stroke-width="3" fill="none" stroke-linecap="round"/>
      <path d="M42 64 L60 64" stroke="${qora}" stroke-width="0" />`;
    qoshimcha = `<g fill="#B9B2A3" opacity=".9"><circle cx="20" cy="12" r="5"/><circle cx="14" cy="6" r="3.5"/><circle cx="82" cy="10" r="5"/><circle cx="88" cy="4" r="3.5"/></g>
      <path d="M86 30 l6 -3 M86 36 l7 0" stroke="#C8553D" stroke-width="2.4" stroke-linecap="round"/>`;
  } else if (nom === "chang") {
    muqova = kitob(k.muqova, k.muqova2);
    yuz = `<path d="M37 46 Q42 49 47 46 M55 46 Q60 49 65 46" stroke="${qora}" stroke-width="2.6" fill="none" stroke-linecap="round"/>
      <path d="M45 60 L57 60" stroke="${qora}" stroke-width="2.6" stroke-linecap="round"/>`;
    qoshimcha = `<g stroke="#6E685E" stroke-width=".9" fill="none" opacity=".85">
        <path d="M22 14 L40 14 M22 14 L22 32 M22 14 L36 28 M22 14 L30 30 M22 14 L38 21"/>
        <path d="M27 14 Q26 19 22 19 M32 14 Q30 23 22 24 M37 14 Q35 26 22 29"/></g>
      <g fill="#6E685E" opacity=".55"><circle cx="50" cy="20" r="1.2"/><circle cx="62" cy="26" r="1"/><circle cx="44" cy="74" r="1.3"/><circle cx="66" cy="70" r="1"/><circle cx="56" cy="80" r="1.1"/></g>
      <text x="70" y="28" font-family="Georgia" font-size="10" fill="#6E685E">z</text><text x="78" y="20" font-family="Georgia" font-size="8" fill="#6E685E">z</text>`;
  } else {
    // skelet: muqovasi yo'q — umurtqa (kitob orqasi), qovurg'a-varaqlar va bosh suyagi
    muqova = `
      <rect x="22" y="14" width="10" height="74" rx="4" fill="#E8E2D4" stroke="#B8AE98" stroke-width="1.5"/>
      ${[24, 34, 44, 54, 64, 74].map((y) => `<path d="M32 ${y} Q55 ${y - 3} 76 ${y + 1}" stroke="#D8D0BE" stroke-width="3.5" fill="none" stroke-linecap="round"/>`).join("")}
      <ellipse cx="54" cy="46" rx="15" ry="14" fill="#F4EFE3" stroke="#B8AE98" stroke-width="1.5"/>
      <rect x="46" y="55" width="16" height="8" rx="2" fill="#F4EFE3" stroke="#B8AE98" stroke-width="1.5"/>
      <path d="M50 55 V63 M54 55 V63 M58 55 V63" stroke="#B8AE98" stroke-width="1"/>`;
    yuz = `<ellipse cx="48" cy="45" rx="4" ry="4.5" fill="${qora}"/><ellipse cx="60" cy="45" rx="4" ry="4.5" fill="${qora}"/>
      <path d="M54 50 L52 54 L56 54 Z" fill="${qora}"/>`;
    qoshimcha = `<g stroke="#B8AE98" stroke-width="3" stroke-linecap="round"><path d="M12 86 L26 80"/><path d="M80 82 L92 88"/></g>
      <g fill="#E8E2D4" stroke="#B8AE98" stroke-width="1"><circle cx="11" cy="86" r="3"/><circle cx="27" cy="79" r="3"/><circle cx="79" cy="81" r="3"/><circle cx="93" cy="89" r="3"/></g>`;
  }
  const soya = `<ellipse cx="50" cy="93" rx="30" ry="4" fill="#000" opacity=".12"/>`;
  return `<svg viewBox="0 0 100 100" width="${olcham}" height="${olcham}" role="img" aria-label="Kitobcha — ${nom}" xmlns="http://www.w3.org/2000/svg">${soya}${muqova}${yuz}${qoshimcha}</svg>`;
}

// Oxirgi o'yin kuni: shu brauzerdagi yozuv + (profil bo'lsa) bazadagi eng oxirgi o'yin
function oxirgiOyinKuni() { return xotiradanOl("sitataOxirgiOyin", null); }
function oxirgiOyinniYoz(kun) { const eski = oxirgiOyinKuni(); if (eski == null || kun > eski) xotiragaYoz("sitataOxirgiOyin", kun); }
const otganKunlar = () => { const k = oxirgiOyinKuni(); return k == null ? null : Math.max(0, haqiqiyBugun - k); };

async function oxirgiOyinniSinxronla() {
  if (!BAZA_YOQIQ || !mening) return;
  try {
    const m = await mijozOl();
    const { data } = await m.from("oyinlar").select("kun").eq("profil_id", mening.id).order("kun", { ascending: false }).limit(1);
    if (data && data[0]) oxirgiOyinniYoz(data[0].kun);
  } catch (e) { /* oflayn */ }
}

function joriyKayfiyat() {
  if (holat.tugadi && !SINOV) oxirgiOyinniYoz(holat.kun);
  return kayfiyatNomi(otganKunlar());
}

// Bosh sahifadagi qahramon kartasi
function kitobchaKartasi() {
  const nom = joriyKayfiyat(), kunlar = otganKunlar();
  const a = havola("#kim-aytgan", "kitobcha-karta kayfiyat-" + nom);
  const rasm = yarat("span", "kitobcha-rasm"); rasm.innerHTML = kitobchaSVG(nom, 96);
  const gap = yarat("span", "kitobcha-gap", KAYFIYATLAR[nom].gap(kunlar));
  a.append(rasm, gap);
  return a;
}

// Brauzer yorlig'i belgisi va ilova belgisidagi raqam
function kitobchaBelgisiniYangila() {
  const nom = joriyKayfiyat();
  let link = document.querySelector('link[rel="icon"]');
  if (!link) { link = document.createElement("link"); link.rel = "icon"; document.head.appendChild(link); }
  link.type = "image/svg+xml";
  link.href = "data:image/svg+xml," + encodeURIComponent(kitobchaSVG(nom, 64));
  const kunlar = otganKunlar();
  try {
    if (navigator.setAppBadge) {
      if (kunlar != null && kunlar >= 2) navigator.setAppBadge(kunlar).catch(() => {});
      else navigator.clearAppBadge && navigator.clearAppBadge().catch(() => {});
    }
  } catch (e) { /* qo'llab-quvvatlanmaydi */ }
}

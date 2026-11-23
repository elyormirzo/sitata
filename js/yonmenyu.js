// ===== KOMPYUTERDA CHAP TOMONDAGI MENYU =====
// Keng ekranda (1100px dan) chapda belgili doimiy menyu; telefonda ko'rinmaydi (u yerda «Menyu» tugmasi).

const YON_BELGI = (d) => `<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
const YON_MENYU = [
  ["lenta", "Lenta", '<path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>'],
  ["kim-aytgan", "Kim aytgan?", '<path d="M7 7h4v4c0 3-1.5 5-4 6M15 7h4v4c0 3-1.5 5-4 6"/>'],
  ["viktorina", "Viktorina", '<path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2V16h5v-.1c0-.8.4-1.5 1-2A6 6 0 0 0 12 3z"/>'],
  ["duellar", "Duellar", '<path d="m14.5 17.5 6-6V4h-7.5l-6 6M13 19l-2 2-2-2 2-2M5 13l-2 2 2 2 2-2M9.5 14.5 4 20M9.5 9.5 14.5 14.5"/>'],
  ["javon", "Kitob javonim", '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V3H6.5A2.5 2.5 0 0 0 4 5.5z"/><path d="M4 19.5A2.5 2.5 0 0 0 6.5 22H20v-5"/>'],
  ["guruhlar", "Guruhlar", '<path d="M12 7V2.5l4 1.6-4 1.6M2 21h20M4 21v-9l8-5 8 5v9"/><path d="M10 21v-4h4v4M7.5 13.5h1M15.5 13.5h1"/>'],
  ["kitobdoshlar", "Kitobdoshlar", '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c.8-3.5 3.4-5.5 6.5-5.5s5.7 2 6.5 5.5"/><path d="M16 4.5a3.5 3.5 0 0 1 0 7M18 14.8c1.8.7 3 2.5 3.5 5.2"/>'],
  ["birga", "Birga o'qish", '<path d="M2 5h6a4 4 0 0 1 4 4v12a3 3 0 0 0-3-3H2zM22 5h-6a4 4 0 0 0-4 4v12a3 3 0 0 1 3-3h7z"/>'],
  ["mualliflar", "Mualliflar", '<path d="M20 4C11 4 6 10 5 20M20 4c0 6-4 10-10 11M9 13h5"/>'],
  ["liga", "Liga", '<path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0z"/><path d="M17 5h3v2a3 3 0 0 1-3 3M7 5H4v2a3 3 0 0 0 3 3"/>'],
  ["karta", "Karta yaratish", '<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="2"/><path d="m21 16-5-5-9 9"/>'],
  ["profilim", "Profil", '<circle cx="12" cy="8" r="4"/><path d="M4 21c1-4.4 4.2-7 8-7s7 2.6 8 7"/>'],
];

function yonMenyuniQur() {
  if (document.querySelector(".yon-menyu")) return;
  const nav = document.createElement("nav");
  nav.className = "yon-menyu"; nav.setAttribute("aria-label", "Bo'limlar");
  const logo = document.createElement("a"); logo.className = "yon-logo"; logo.href = "#lenta";
  logo.innerHTML = '<span aria-hidden="true">“</span>sitata<span class="logo-uz">.uz</span>';
  nav.appendChild(logo);
  YON_MENYU.forEach(([yol, nom, d]) => {
    const a = document.createElement("a");
    a.href = "#" + yol; a.dataset.yol = yol; a.className = "yon-band";
    a.innerHTML = YON_BELGI(d);
    const s = document.createElement("span"); s.textContent = nom; a.appendChild(s);
    nav.appendChild(a);
  });
  const pastki = document.createElement("div"); pastki.className = "yon-pastki";
  [["#qoidalar", "Qanday o'ynash"], ["#haqida", "Loyiha haqida"], ["maxfiylik.html", "Maxfiylik"]].forEach(([h, t]) => {
    const a = document.createElement("a"); a.href = h; a.textContent = t; pastki.appendChild(a);
  });
  nav.appendChild(pastki);
  document.body.appendChild(nav);
  document.body.classList.add("yon-menyuli");
}
yonMenyuniQur();

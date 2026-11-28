// ===== TEPADAGI PANEL: ob-havo · til · tun rejimi · «Kirish» =====
// Ob-havo — Open-Meteo (kalitsiz, bepul); joylashuv so'ralmaydi, shahar foydalanuvchi tanlaydi.
// Tun rejimi — <html data-mavzu="tun">, ranglar uslub.css oxiridagi blokda (js/mavzu.js oldindan qo'llaydi).

const SHAHARLAR = [
  ["Toshkent", "Ташкент", "Tashkent", 41.311, 69.240], ["Samarqand", "Самарканд", "Samarkand", 39.654, 66.976],
  ["Buxoro", "Бухара", "Bukhara", 39.768, 64.421], ["Andijon", "Андижан", "Andijan", 40.783, 72.344],
  ["Namangan", "Наманган", "Namangan", 40.998, 71.672], ["Farg'ona", "Фергана", "Fergana", 40.384, 71.786],
  ["Qarshi", "Карши", "Karshi", 38.861, 65.790], ["Nukus", "Нукус", "Nukus", 42.460, 59.603],
  ["Urganch", "Ургенч", "Urgench", 41.550, 60.631], ["Jizzax", "Джизак", "Jizzakh", 40.116, 67.842],
  ["Termiz", "Термез", "Termez", 37.224, 67.278], ["Navoiy", "Навои", "Navoiy", 40.103, 65.374],
  ["Guliston", "Гулистан", "Gulistan", 40.490, 68.785],
];
const shaharNomi = (s) => (TIL === "ru" ? s[1] : TIL === "en" ? s[2] : s[0]);
const ochiqKalit = (k, q) => { try { return localStorage.getItem(k) || q; } catch (e) { return q; } };
const yozKalit = (k, v) => { try { localStorage.setItem(k, v); } catch (e) {} };

// WMO ob-havo kodlari → belgi va tavsif
function obHavoTuri(kod, kunduz) {
  if (kod === 0) return [kunduz ? "☀️" : "🌙", "Ochiq osmon"];
  if (kod <= 2) return [kunduz ? "⛅" : "☁️", "Qisman bulutli"];
  if (kod === 3) return ["☁️", "Bulutli"];
  if (kod === 45 || kod === 48) return ["🌫️", "Tuman"];
  if (kod >= 51 && kod <= 57) return ["🌦️", "Mayda yomg'ir"];
  if ((kod >= 61 && kod <= 67) || (kod >= 80 && kod <= 82)) return ["🌧️", "Yomg'ir"];
  if ((kod >= 71 && kod <= 77) || kod === 85 || kod === 86) return ["🌨️", "Qor"];
  if (kod >= 95) return ["⛈️", "Momaqaldiroq"];
  return ["🌡️", ""];
}

async function obHavoOl(sh) {
  const kalit = "sitataObHavo:" + sh[0];
  try {
    const k = JSON.parse(localStorage.getItem(kalit) || "null");
    if (k && Date.now() - k.vaqt < 30 * 60 * 1000) return k.d;      // 30 daqiqa keshlanadi
  } catch (e) {}
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${sh[3]}&longitude=${sh[4]}&current=temperature_2m,weather_code,is_day&timezone=auto`;
  const r = await fetch(url);
  if (!r.ok) throw new Error("ob-havo " + r.status);
  const j = await r.json();
  const d = { t: Math.round(j.current.temperature_2m), kod: j.current.weather_code, kunduz: j.current.is_day === 1 };
  yozKalit(kalit, JSON.stringify({ vaqt: Date.now(), d }));
  return d;
}

// Kichik ochiluvchi ro'yxat (shahar, til)
function ochiluvchi(tugma, qurish) {
  let ro = null;
  const yop = () => { if (ro) { ro.remove(); ro = null; tugma.setAttribute("aria-expanded", "false"); document.removeEventListener("click", tashqi, true); document.removeEventListener("keydown", esc); } };
  const tashqi = (e) => { if (ro && !ro.contains(e.target) && !tugma.contains(e.target)) yop(); };
  const esc = (e) => { if (e.key === "Escape") { yop(); tugma.focus(); } };
  tugma.setAttribute("aria-haspopup", "true"); tugma.setAttribute("aria-expanded", "false");
  tugma.addEventListener("click", () => {
    if (ro) { yop(); return; }
    ro = yarat("div", "yuqori-ochiluvchi"); ro.setAttribute("role", "menu");
    qurish(ro, yop);
    tugma.parentElement.appendChild(ro);
    tugma.setAttribute("aria-expanded", "true");
    document.addEventListener("click", tashqi, true); document.addEventListener("keydown", esc);
    const birinchi = ro.querySelector("button"); if (birinchi) birinchi.focus();
  });
  window.addEventListener("hashchange", yop);
}

function obHavoTugmasi() {
  const quti = yarat("div", "ob-havo-quti");
  const b = yarat("button", "ob-havo"); b.type = "button";
  b.setAttribute("aria-label", "Ob-havo");
  const belgi = yarat("span", "ob-havo-belgi", "🌡️"), daraja = yarat("span", "ob-havo-daraja", "—"), shahar = yarat("span", "ob-havo-shahar");
  b.append(belgi, daraja, shahar);
  quti.appendChild(b);
  const tanlangan = () => SHAHARLAR.find((s) => s[0] === ochiqKalit("sitataShahar", "Toshkent")) || SHAHARLAR[0];
  const yukla = async () => {
    const sh = tanlangan();
    shahar.textContent = shaharNomi(sh);
    try {
      const d = await obHavoOl(sh);
      const [bl, tavsif] = obHavoTuri(d.kod, d.kunduz);
      belgi.textContent = bl; daraja.textContent = (d.t > 0 ? "+" : "") + d.t + "°C";
      b.title = shaharNomi(sh) + ": " + (tavsif ? t(tavsif) + ", " : "") + d.t + "°C";
      quti.classList.remove("yashirin");
    } catch (e) {
      daraja.textContent = "—"; b.title = t("Ob-havo hozir yuklanmadi");
    }
  };
  ochiluvchi(b, (ro, yop) => {
    ro.appendChild(yarat("div", "yuqori-och-sarlavha", "Shaharni tanlang"));
    SHAHARLAR.forEach((sh) => {
      const x = yarat("button", "yuqori-och-qator" + (sh === tanlangan() ? " faol" : ""), shaharNomi(sh)); x.type = "button"; x.setAttribute("role", "menuitem");
      x.addEventListener("click", () => { yozKalit("sitataShahar", sh[0]); yop(); yukla(); });
      ro.appendChild(x);
    });
  });
  yukla();
  setInterval(() => { if (!document.hidden) yukla(); }, 30 * 60 * 1000);
  return quti;
}

const GLOBUS = '<svg viewBox="0 0 24 24" width="21" height="21" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.5 2.6 3.7 5.6 3.7 9s-1.2 6.4-3.7 9c-2.5-2.6-3.7-5.6-3.7-9S9.5 5.6 12 3z"/></svg>';
const OY = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" aria-hidden="true"><path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z"/></svg>';
const QUYOSH = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4"/></svg>';

function tilTugmasi() {
  const quti = yarat("div", "yuqori-til");
  const b = yarat("button", "yuqori-belgi"); b.type = "button"; b.innerHTML = GLOBUS;
  b.setAttribute("aria-label", "Til"); b.title = TILLAR[TIL];
  quti.appendChild(b);
  ochiluvchi(b, (ro) => {
    Object.entries(TILLAR).forEach(([k, nom]) => {
      const x = yarat("button", "yuqori-och-qator" + (k === TIL ? " faol" : ""), nom); x.type = "button"; x.lang = k; x.setAttribute("role", "menuitem");
      x.setAttribute("translate", "no");
      x.addEventListener("click", () => { if (k !== TIL) tilniAlmashtir(k); });
      ro.appendChild(x);
    });
  });
  return quti;
}

function mavzuTugmasi() {
  const b = yarat("button", "yuqori-belgi mavzu-tugma"); b.type = "button";
  const chiz = () => {
    const tun = document.documentElement.getAttribute("data-mavzu") === "tun";
    b.innerHTML = tun ? QUYOSH : OY;
    const nom = tun ? "Kunduzgi rejim" : "Tungi rejim";
    b.setAttribute("aria-label", t(nom)); b.title = t(nom);
    b.setAttribute("aria-pressed", String(tun));
    const r = document.querySelector('meta[name="theme-color"]');
    if (r) r.setAttribute("content", tun ? "#1A1511" : "#4F5B3A");
  };
  b.addEventListener("click", () => {
    const yangi = document.documentElement.getAttribute("data-mavzu") === "tun" ? "kun" : "tun";
    document.documentElement.setAttribute("data-mavzu", yangi);
    yozKalit("sitataMavzu", yangi);
    chiz();
  });
  // Foydalanuvchi o'zi tanlamagan bo'lsa — qurilma sozlamasi o'zgarganda ergashamiz
  if (window.matchMedia) matchMedia("(prefers-color-scheme: dark)").addEventListener?.("change", (e) => {
    if (ochiqKalit("sitataMavzu", "") ) return;
    document.documentElement.setAttribute("data-mavzu", e.matches ? "tun" : "kun"); chiz();
  });
  chiz();
  return b;
}

// «Kirish»: profili yo'q — Google bilan kirish; Google'ga bog'lanmagan profil — hisob sozlamalari; kirgan — ko'rinmaydi
function kirishTugmasi() {
  const b = yarat("button", "kirish-tugma yashirin"); b.type = "button";
  b.innerHTML = '<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="1.9" aria-hidden="true"><circle cx="12" cy="8" r="4"/><path d="M4.5 20.5c1.4-3.6 4.2-5.5 7.5-5.5s6.1 1.9 7.5 5.5"/></svg>';
  b.appendChild(yarat("span", "", "Kirish"));
  let holat = "yoq";
  b.addEventListener("click", () => {
    if (typeof kirishOynasi === "function") { kirishOynasi(); return; }
    if (holat === "anonim") { location.hash = "#profilim/hisob"; return; }
    b.disabled = true;
    const x = { set textContent(v) { if (v) qisqaXabar(v); } };
    googleBilanKir(x, location.hash || "#profilim").finally(() => { b.disabled = false; });
  });
  const tekshir = async () => {
    if (!BAZA_YOQIQ) { b.classList.add("yashirin"); return; }
    let user = null;
    try { user = await sessiyaOl(); } catch (e) {}
    holat = !mening || !user ? "yoq" : (typeof hisobBoglanganmi === "function" ? !hisobBoglanganmi(user) : user.is_anonymous) ? "anonim" : "kirgan";
    b.classList.toggle("yashirin", holat === "kirgan");
    b.title = holat === "anonim" ? t("Profilingizni Telegram yoki Google'ga bog'lang") : t("Telegram yoki Google orqali kirish");
  };
  tekshir();
  setTimeout(tekshir, 2500);
  window.addEventListener("hashchange", () => setTimeout(tekshir, 300));
  return b;
}

function yuqoriniBoshla() {
  const yuqori = document.querySelector(".yuqori"), ong = yuqori && yuqori.querySelector(".yuqori-ong");
  if (!ong || yuqori.querySelector(".mavzu-tugma")) return;
  // Qidiruv va ob-havo — bitta qatorda (telefonda logotip ostida)
  const qidiruv = yuqori.querySelector(".qidiruv");
  const qator = yarat("div", "yuqori-qator2");
  if (qidiruv) { yuqori.insertBefore(qator, qidiruv); qator.appendChild(qidiruv); } else yuqori.insertBefore(qator, ong);
  qator.appendChild(obHavoTugmasi());
  const qongiroq = ong.querySelector("#qongiroq");
  ong.insertBefore(tilTugmasi(), qongiroq);
  ong.insertBefore(mavzuTugmasi(), qongiroq);
  ong.appendChild(kirishTugmasi());
}
if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", yuqoriniBoshla);
else yuqoriniBoshla();

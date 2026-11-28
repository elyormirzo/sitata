// ===== TELEGRAM ORQALI KIRISH =====
// Tugma → sayt bir martalik kod oladi → Telegram'da @bot ochiladi (/start k_<kod>) → bot tasdiqlaydi →
// sayt (har 2 soniyada so'rab turadi) bir martalik token oladi va shu profilga kiradi.
// Telegram'ga ulangan profil bo'lsa — o'sha profil ochiladi; bo'lmasa — saytdagi joriy profil Telegram'ga ulanadi
// yoki (profil yo'q bo'lsa) Telegram'dagi ism bilan yangi profil ochiladi. Server: «telegram» funksiyasi.

const TG_KOD_KALIT = "sitataTgKod";
const TELEGRAM_BELGI = '<svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor" aria-hidden="true"><path d="M21.4 3.6 2.9 10.8c-1.2.5-1.2 1.2 0 1.6l4.7 1.5 1.8 5.6c.2.6.4.8.9.8.4 0 .6-.2.9-.5l2.3-2.2 4.7 3.5c.9.5 1.5.2 1.7-.8l3.1-14.7c.3-1.3-.5-1.9-1.6-1.5zM9 13.6l9.2-5.8c.4-.3.8-.1.5.2l-7.6 6.9-.3 3.3L9 13.6z"/></svg>';

// Hisob Telegram yoki Google'ga bog'langanmi (anonim emas)
const hisobBoglanganmi = (user) => !!user && (!user.is_anonymous || !!(user.app_metadata && user.app_metadata.telegram));

async function tgSorov(tana) {
  const m = await mijozOl();
  const { data } = await m.auth.getSession();
  const token = (data && data.session && data.session.access_token) || SUPABASE_KALIT;
  const r = await fetch(SUPABASE_URL + "/functions/v1/telegram", {
    method: "POST", headers: { "Content-Type": "application/json", apikey: SUPABASE_KALIT, Authorization: "Bearer " + token },
    body: JSON.stringify(tana),
  });
  return r.json().catch(() => ({}));
}

const tgKodOl = () => { try { const x = JSON.parse(sessionStorage.getItem(TG_KOD_KALIT) || "null"); return x && Date.now() - x.vaqt < 10 * 60 * 1000 ? x : null; } catch (e) { return null; } };
const tgKodYoz = (x) => { try { x ? sessionStorage.setItem(TG_KOD_KALIT, JSON.stringify(x)) : sessionStorage.removeItem(TG_KOD_KALIT); } catch (e) {} };

let tgKuzatuv = null;
// holat(matn, turi): oynadagi yozuvni yangilash; tugadi() — muvaffaqiyatdan keyin
async function telegramKutish(kod, holat) {
  clearInterval(tgKuzatuv);
  return new Promise((ok) => {
    let band = false;
    const tekshir = async () => {
      if (band) return; band = true;
      try {
        const j = await tgSorov({ turi: "kirish_holati", kod });
        if (j.holat === "kutish") return;
        clearInterval(tgKuzatuv); tgKodYoz(null);
        if (j.holat === "eskirgan") { holat("Havola eskirgan — qaytadan bosing.", "xato"); ok(false); return; }
        if (j.holat === "xato" || !j.holat) { holat("Kirib bo'lmadi — qayta urinib ko'ring.", "xato"); ok(false); return; }
        const m = await mijozOl();
        if (j.holat === "ulandi") {
          if (m.auth.refreshSession) await m.auth.refreshSession().catch(() => {});
          holat("✓ Telegram profilingizga ulandi!", "ok");
          ok(true); setTimeout(() => location.reload(), 900);
          return;
        }
        // j.holat === "kirish": bir martalik token bilan shu profilga kiramiz
        holat("Profil ochilmoqda…", "kutish");
        const { data, error } = await m.auth.verifyOtp({ type: "magiclink", token_hash: j.token_hash });
        if (error || !data || !data.user) { holat("Kirib bo'lmadi — qayta urinib ko'ring.", "xato"); ok(false); return; }
        try { localStorage.removeItem("kimAytganProfil"); } catch (e) {}
        mening = null;
        await profilniSinxronla(data.user.id);
        if (!mening) await googledanProfilOch(data.user);       // Telegram'dagi ism bilan yangi profil
        if (j.yangi && mening) await tgSorov({ turi: "kirish_yakun", kod });
        holat("✓ Xush kelibsiz" + (mening ? ", " + mening.ism : "") + "!", "ok");
        ok(true);
        setTimeout(() => { history.replaceState(null, "", location.pathname + "#profilim"); location.reload(); }, 900);
      } catch (e) { /* tarmoq uzilishi — keyingi urinishda */ } finally { band = false; }
    };
    tgKuzatuv = setInterval(tekshir, 2000);
    tekshir();
  });
}

// Telegram orqali kirishni boshlash (tugma bosilganda)
async function telegramBilanKir(holat) {
  const oyna = window.open("", "_blank");            // brauzer bloklamasligi uchun — oldin ochamiz
  holat("Telegram ochilmoqda…", "kutish");
  let j = {};
  try { j = await tgSorov({ turi: "kirish_kodi" }); } catch (e) {}
  if (!j.kod || !j.bot) {
    if (oyna) oyna.close();
    holat("Telegram bilan kirish hozir ishlamayapti — birozdan keyin urinib ko'ring.", "xato");
    return false;
  }
  tgKodYoz({ kod: j.kod, bot: j.bot, vaqt: Date.now() });
  const url = `https://t.me/${j.bot}?start=k_${j.kod}`;
  if (oyna) oyna.location.href = url; else location.href = url;
  holat("Telegram'da «Start» (Запустить) ni bosing — bot tasdiqlagach shu sahifaga qayting.", "kutish");
  return telegramKutish(j.kod, holat);
}

// Telegram tugmasi (holat yozuvi bilan) — kirish oynasida va profil sahifalarida
function telegramKirishTugmasi(matn = "Telegram orqali kirish") {
  const q = yarat("div", "tg-kirish");
  const b = yarat("button", "tg-kirish-tugma"); b.type = "button";
  const belgi = yarat("span", "tg-kirish-belgi"); belgi.innerHTML = TELEGRAM_BELGI;
  const yozuv = yarat("span", "tg-kirish-yozuv");
  const sar = yarat("b", "", matn), izoh = yarat("small", "", "Bosing — Telegram'dagi botimiz sizni tasdiqlaydi");
  yozuv.append(sar, izoh);
  b.append(belgi, yozuv);
  const holat = (m, tur) => {
    izoh.textContent = t(m);
    b.classList.toggle("kutish", tur === "kutish"); b.classList.toggle("ok", tur === "ok"); b.classList.toggle("xato", tur === "xato");
    b.disabled = tur === "kutish" || tur === "ok";
  };
  b.addEventListener("click", () => telegramBilanKir(holat).then((ok) => { if (!ok) b.disabled = false; }));
  q.appendChild(b);
  // Telegram'dan qaytganda (sahifa yangilangan bo'lsa ham) kutishni davom ettiramiz
  const kutilgan = tgKodOl();
  if (kutilgan) { holat("Telegram tasdig'i kutilmoqda…", "kutish"); telegramKutish(kutilgan.kod, holat).then((ok) => { if (!ok) b.disabled = false; }); }
  return q;
}

// Kirish oynasi: Telegram (asosiy) va Google
function kirishOynasi() {
  if (document.querySelector(".kirish-oyna")) return;
  const fon = yarat("div", "kirish-oyna"); fon.setAttribute("role", "dialog"); fon.setAttribute("aria-modal", "true"); fon.setAttribute("aria-label", "Kirish");
  const quti = yarat("div", "kirish-quti");
  const yop = yarat("button", "panel-oyna-yop", "✕"); yop.type = "button"; yop.setAttribute("aria-label", "Yopish");
  const belgi = yarat("div", "kirish-belgi"); belgi.innerHTML = TELEGRAM_BELGI.replace(/width="22" height="22"/, 'width="44" height="44"');
  quti.append(yop, belgi, yarat("h3", "", "Telegram orqali kiring"),
    yarat("p", "kichik-matn", "Natijalaringiz saqlanadi, onlayn duelda qatnashasiz va istalgan qurilmadan kira olasiz."));
  const afzal = yarat("ul", "kirish-afzal");
  [["☁️", "Natijalaringiz bulutda saqlanadi", "yashil"], ["⚔️", "Onlayn duelda qatnashing", "kok"], ["📱", "Barcha qurilmalarda bir profil", "sariq"]].forEach(([b, m, r]) => {
    const li = yarat("li", r); li.append(yarat("span", "", b), yarat("b", "", m)); afzal.appendChild(li);
  });
  quti.append(afzal, telegramKirishTugmasi());
  const yoki = yarat("p", "kirish-yoki", "yoki");
  quti.append(yoki, googleKirishTugmasi(location.hash || "#profilim", "Google bilan kirish"));
  const shart = yarat("p", "kichik-matn kirish-shart");
  shart.append(document.createTextNode(t("Davom etsangiz, ") ), havola("maxfiylik.html", "", t("Maxfiylik siyosati")), document.createTextNode(t("ga rozilik bildirasiz.")));
  quti.appendChild(shart);
  fon.appendChild(quti);
  const ket = () => { fon.remove(); document.removeEventListener("keydown", esc); };
  const esc = (e) => { if (e.key === "Escape") ket(); };
  yop.addEventListener("click", ket);
  fon.addEventListener("click", (e) => { if (e.target === fon) ket(); });
  document.addEventListener("keydown", esc);
  document.body.appendChild(fon);
}

// #kirish — kirish oynasini ochadi (bot «Saytga qaytish» tugmasi ham shu manzilga olib keladi)
function kirishManziliniTekshir() {
  if (location.hash !== "#kirish") return;
  history.replaceState(null, "", location.pathname + location.search + "#profilim");
  window.dispatchEvent(new HashChangeEvent("hashchange"));
  setTimeout(kirishOynasi, 200);
}
window.addEventListener("hashchange", kirishManziliniTekshir);
if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", () => setTimeout(kirishManziliniTekshir, 300));
else setTimeout(kirishManziliniTekshir, 300);
// Telegram'dan qaytganda kutilayotgan kod bo'lsa — oynani avtomatik ochamiz
setTimeout(() => { if (tgKodOl()) kirishOynasi(); }, 800);

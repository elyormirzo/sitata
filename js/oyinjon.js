// ===== KUNLIK O'YINNI «JONLI» QILISH =====
// O'yin tepasida: «#328 · Bugun N kishi o'ynadi · X% topdi» (ijtimoiy isbot).
// O'yin tugagach: boshqalar bilan solishtirish, keyingi iqtibosgacha sanoq, «yana nima qilish mumkin» kartalari.
// Baza: kunlik_statistika(kun) — faqat umumiy sonlar.

let kunlikStat = null, kunlikStatVaqti = 0;
async function kunlikStatistikaOl() {
  if (!BAZA_YOQIQ) return null;
  if (kunlikStat && Date.now() - kunlikStatVaqti < 60000) return kunlikStat;
  try {
    const m = await mijozOl();
    const { data } = await m.rpc("kunlik_statistika", { p_kun: bugungiKun });
    kunlikStat = data && data[0] ? data[0] : null; kunlikStatVaqti = Date.now();
  } catch (e) { /* jim */ }
  return kunlikStat;
}
const sonniYoz = (n) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, " ");

// Keyingi iqtibosgacha qolgan vaqt (Toshkent yarim tuni)
function keyingiIqtibosgacha() {
  const hozir = Date.now() + 5 * 3600 * 1000;
  const qoldi = 86400000 - (hozir % 86400000);
  const s = Math.floor(qoldi / 1000);
  return [Math.floor(s / 3600), Math.floor((s % 3600) / 60), s % 60].map((x) => String(x).padStart(2, "0")).join(":");
}

// O'yin tepasidagi qator
async function oyinJonliQatori() {
  const q = $("oyinJonli");
  if (!q) return;
  q.innerHTML = "";
  q.appendChild(yarat("span", "jonli-raqam", `#${oyinRaqami()}`));
  const st = await kunlikStatistikaOl();
  if (st && st.oynaganlar >= 5) {
    const foiz = Math.round((st.topganlar / st.oynaganlar) * 100);
    q.append(yarat("span", "jonli-ayir", "·"), yarat("span", "", t("👥 Bugun {n} kishi o'ynadi", { n: sonniYoz(st.oynaganlar) })),
      yarat("span", "jonli-ayir", "·"), yarat("span", "", t("🎯 {n}% topdi", { n: foiz })));
  } else {
    q.append(yarat("span", "jonli-ayir", "·"), yarat("span", "", t("Har kuni yangi iqtibos — bugungisi sizni kutmoqda")));
  }
}

// O'yin tugagach: solishtirish, sanoq va keyingi qadamlar
let sanoqTaymeri = null;
async function natijaJonliQismi() {
  const q = $("natijaJonli");
  if (!q || !holat.tugadi || q.dataset.kun === String(bugungiKun)) return;
  q.dataset.kun = String(bugungiKun);
  q.innerHTML = "";
  // Boshqalar bilan solishtirish
  const st = await kunlikStatistikaOl();
  if (st && st.oynaganlar >= 5) {
    const xato = xatolarSoni();
    let matn;
    if (!holat.yutdi) matn = t("Bugun {n}% o'yinchi topdi — ertaga albatta topasiz!", { n: Math.round((st.topganlar / st.oynaganlar) * 100) });
    else {
      // Kamroq xato bilan topganlar soni → «X% dan yaxshi»
      const xatolar = st.xatolar || {};
      const yaxshiroq = Object.entries(xatolar).filter(([k]) => Number(k) < xato).reduce((s, [, v]) => s + v, 0);
      const yomonroq = st.oynaganlar - yaxshiroq - (xatolar[xato] || 0);
      const foiz = Math.round((yomonroq / st.oynaganlar) * 100);
      matn = xato === 0 ? t("🎯 Xatosiz! Bugun faqat {n}% o'yinchi bunga erishdi.", { n: Math.max(1, Math.round((st.xatosiz / st.oynaganlar) * 100)) })
        : foiz > 0 ? t("📊 Siz bugungi o'yinchilarning {n} foizidan yaxshiroq natija ko'rsatdingiz!", { n: foiz }) : t("📊 Bugun {n} kishi o'ynadi.", { n: sonniYoz(st.oynaganlar) });
    }
    const joy = $("natijaSolishtir") || q;
    joy.innerHTML = ""; joy.appendChild(yarat("p", "jonli-solishtir", matn));
  }
  // Keyingi iqtibosgacha sanoq
  const sanoq = yarat("div", "jonli-sanoq");
  const vaqt = yarat("b", "", keyingiIqtibosgacha());
  sanoq.append(yarat("span", "", t("⏳ Keyingi iqtibos")), vaqt);
  q.appendChild(sanoq);
  clearInterval(sanoqTaymeri);
  sanoqTaymeri = setInterval(() => {
    if (!document.body.contains(vaqt)) { clearInterval(sanoqTaymeri); return; }
    vaqt.textContent = keyingiIqtibosgacha();
  }, 1000);
  // Yana nima qilish mumkin
  const kartalar = yarat("div", "jonli-kartalar");
  [["#viktorina", "❓", "Viktorina", "10 ta iqtibos — 10 ta muallif"],
   ["#viktorina", "📚", "Maktab testlari", "O'tkan kunlar, Alpomish, Navoiy…"],
   ["#lenta/hammasi", "❝", "Iqtiboslar", "Buyuk adiblarning hikmatlari"],
   ["#mualliflar", "🪶", "Mualliflar", "Hayoti va asarlari"]].forEach(([h, belgi, nom, izoh]) => {
    const a = havola(h, "jonli-karta", "");
    a.append(yarat("span", "", belgi), yarat("b", "", t(nom)), yarat("small", "", t(izoh)));
    kartalar.appendChild(a);
  });
  q.append(yarat("p", "jonli-sarlavha", t("Kutish zerikarli bo'lmasin:")), kartalar);
}

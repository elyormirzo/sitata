// ===== ONLAYN DUEL =====
// #duellar — lobbi (daraja, ball, onlayn o'yinchilar, reyting, chaqiruv, mening duellarim, «Raqib qidirish»)
// #jang/qidir — raqib qidirish (radar): faqat saytda onlayn turgan haqiqiy o'yinchilar bilan; kutilganda — onlayn o'yinchilarni chaqirish
// #jang/<id> — chaqiruv / 3-2-1 / o'yin (10 savol × 15 soniya) / natija (qasos olish)
// #jang/onlayn, #jang/reyting, #jang/mening, #jang/chaqir
// Baza: janglar, jang_reyting, faollik va jang_* funksiyalari — supabase/jang.sql. Holat har soniyada so'raladi.

const JANG_SAVOL_SONI = 10, JANG_SOniya = 15;
const JANG_DARAJALAR = [[0, "Bronza", "🥉"], [50, "Kumush", "🥈"], [150, "Oltin", "🥇"], [300, "Platina", "💠"], [500, "Brilliant", "💎"]];
const jangDarajasi = (ball) => { let d = JANG_DARAJALAR[0]; JANG_DARAJALAR.forEach((x) => { if ((ball || 0) >= x[0]) d = x; }); return { nom: d[1], belgi: d[2], min: d[0] }; };
const QILICH = '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="7.6" fill="currentColor" fill-opacity=".14" stroke-width="1.5"/><circle cx="12" cy="12" r="5" stroke-width=".9" stroke-opacity=".45"/><g fill="currentColor" stroke="none"><path d="M1.6 3.2 3.2 1.6 14.9 13.3 13.3 14.9Z"/><path d="M13.3 14.9 14.9 13.3 21.6 21.6Z"/><path d="M1.6 3.2 3.2 1.6 5 3.4 3.4 5Z" fill-opacity=".5"/></g><g transform="matrix(-1 0 0 1 24 0)"><g fill="currentColor" stroke="none"><path d="M1.6 3.2 3.2 1.6 14.9 13.3 13.3 14.9Z"/><path d="M13.3 14.9 14.9 13.3 21.6 21.6Z"/><path d="M1.6 3.2 3.2 1.6 5 3.4 3.4 5Z" fill-opacity=".5"/></g></g></svg>';   // ikki kesishgan qalam — duel belgisi
// Lobbidagi katta gerb: charm qalqon (tilla hoshiya, perchinlar, sakkiz qirrali naqsh) va ikki kesishgan qalam
const JANG_GERB = "<svg viewBox=\"0 0 120 120\" xmlns=\"http://www.w3.org/2000/svg\" role=\"img\" aria-label=\"Duel\"><defs><radialGradient id=\"jg-charm\" cx=\"42%\" cy=\"38%\" r=\"70%\"><stop offset=\"0\" stop-color=\"#B8693F\"/><stop offset=\".55\" stop-color=\"#8C4A2F\"/><stop offset=\"1\" stop-color=\"#4E2616\"/></radialGradient><linearGradient id=\"jg-tilla\" x1=\"0\" y1=\"0\" x2=\"1\" y2=\"1\"><stop offset=\"0\" stop-color=\"#FBE7A1\"/><stop offset=\".45\" stop-color=\"#E2B24B\"/><stop offset=\"1\" stop-color=\"#9C6B1C\"/></linearGradient><linearGradient id=\"jg-hoshiya\" x1=\"0\" y1=\"0\" x2=\"1\" y2=\"1\"><stop offset=\"0\" stop-color=\"#F6DC8C\"/><stop offset=\".5\" stop-color=\"#C9952F\"/><stop offset=\"1\" stop-color=\"#7A5214\"/></linearGradient><radialGradient id=\"jg-perchin\" cx=\"35%\" cy=\"35%\" r=\"70%\"><stop offset=\"0\" stop-color=\"#FFF4CC\"/><stop offset=\"1\" stop-color=\"#8A5E18\"/></radialGradient><linearGradient id=\"jg-qalam\" x1=\"0\" y1=\"0\" x2=\"1\" y2=\"0\"><stop offset=\"0\" stop-color=\"#14141E\"/><stop offset=\".45\" stop-color=\"#3B3B55\"/><stop offset=\"1\" stop-color=\"#12121A\"/></linearGradient><filter id=\"jg-soya\" x=\"-30%\" y=\"-30%\" width=\"160%\" height=\"160%\"><feDropShadow dx=\"0\" dy=\"1.6\" stdDeviation=\"1.6\" flood-color=\"#000\" flood-opacity=\".45\"/></filter></defs><circle cx=\"60\" cy=\"61.5\" r=\"52\" fill=\"#000\" opacity=\".18\"/><circle cx=\"60\" cy=\"60\" r=\"51\" fill=\"url(#jg-hoshiya)\"/><circle cx=\"60\" cy=\"60\" r=\"44.5\" fill=\"url(#jg-charm)\" stroke=\"#5E3A10\" stroke-width=\"1.2\"/><circle cx=\"107.00\" cy=\"60.00\" r=\"1.9\" fill=\"url(#jg-perchin)\"/><circle cx=\"100.70\" cy=\"83.50\" r=\"1.9\" fill=\"url(#jg-perchin)\"/><circle cx=\"83.50\" cy=\"100.70\" r=\"1.9\" fill=\"url(#jg-perchin)\"/><circle cx=\"60.00\" cy=\"107.00\" r=\"1.9\" fill=\"url(#jg-perchin)\"/><circle cx=\"36.50\" cy=\"100.70\" r=\"1.9\" fill=\"url(#jg-perchin)\"/><circle cx=\"19.30\" cy=\"83.50\" r=\"1.9\" fill=\"url(#jg-perchin)\"/><circle cx=\"13.00\" cy=\"60.00\" r=\"1.9\" fill=\"url(#jg-perchin)\"/><circle cx=\"19.30\" cy=\"36.50\" r=\"1.9\" fill=\"url(#jg-perchin)\"/><circle cx=\"36.50\" cy=\"19.30\" r=\"1.9\" fill=\"url(#jg-perchin)\"/><circle cx=\"60.00\" cy=\"13.00\" r=\"1.9\" fill=\"url(#jg-perchin)\"/><circle cx=\"83.50\" cy=\"19.30\" r=\"1.9\" fill=\"url(#jg-perchin)\"/><circle cx=\"100.70\" cy=\"36.50\" r=\"1.9\" fill=\"url(#jg-perchin)\"/><circle cx=\"60\" cy=\"60\" r=\"38\" fill=\"none\" stroke=\"#E2B24B\" stroke-width=\".8\" stroke-dasharray=\"2.2 2.6\" opacity=\".7\"/><polygon points=\"60.00,30.00 68.42,39.67 81.21,38.79 80.33,51.58 90.00,60.00 80.33,68.42 81.21,81.21 68.42,80.33 60.00,90.00 51.58,80.33 38.79,81.21 39.67,68.42 30.00,60.00 39.67,51.58 38.79,38.79 51.58,39.67\" fill=\"none\" stroke=\"#E2B24B\" stroke-width=\"1.1\" opacity=\".55\"/><polygon points=\"60.00,42.00 64.97,47.99 72.73,47.27 72.01,55.03 78.00,60.00 72.01,64.97 72.73,72.73 64.97,72.01 60.00,78.00 55.03,72.01 47.27,72.73 47.99,64.97 42.00,60.00 47.99,55.03 47.27,47.27 55.03,47.99\" fill=\"#E2B24B\" opacity=\".18\"/><ellipse cx=\"46\" cy=\"38\" rx=\"22\" ry=\"12\" fill=\"#fff\" opacity=\".08\" transform=\"rotate(-30 46 38)\"/><g transform=\"translate(60 60) rotate(-45)\" filter=\"url(#jg-soya)\"><rect x=\"-4.6\" y=\"-52\" width=\"9.2\" height=\"80\" rx=\"4.6\" fill=\"url(#jg-qalam)\"/><rect x=\"-4.6\" y=\"-26\" width=\"9.2\" height=\"3.2\" fill=\"url(#jg-tilla)\"/><rect x=\"-4.6\" y=\"-21\" width=\"9.2\" height=\"1.4\" fill=\"url(#jg-tilla)\" opacity=\".8\"/><rect x=\"1.4\" y=\"-50\" width=\"2\" height=\"22\" rx=\"1\" fill=\"url(#jg-tilla)\"/><circle cx=\"2.4\" cy=\"-28.5\" r=\"1.6\" fill=\"url(#jg-tilla)\"/><rect x=\"-3.4\" y=\"27\" width=\"6.8\" height=\"8\" rx=\"1.5\" fill=\"#1E1E2A\"/><path d=\"M-3.8 35 L3.8 35 L0.9 52 Q0 55 -0.9 52 Z\" fill=\"url(#jg-tilla)\"/><path d=\"M0 40.5 V52.5\" stroke=\"#5A3A12\" stroke-width=\".7\"/><circle cx=\"0\" cy=\"40\" r=\"1.1\" fill=\"#5A3A12\"/><rect x=\"-3.2\" y=\"-50\" width=\"1.6\" height=\"76\" rx=\".8\" fill=\"#fff\" opacity=\".18\"/></g><g transform=\"translate(60 60) rotate(45)\" filter=\"url(#jg-soya)\"><rect x=\"-4.6\" y=\"-52\" width=\"9.2\" height=\"80\" rx=\"4.6\" fill=\"url(#jg-qalam)\"/><rect x=\"-4.6\" y=\"-26\" width=\"9.2\" height=\"3.2\" fill=\"url(#jg-tilla)\"/><rect x=\"-4.6\" y=\"-21\" width=\"9.2\" height=\"1.4\" fill=\"url(#jg-tilla)\" opacity=\".8\"/><rect x=\"1.4\" y=\"-50\" width=\"2\" height=\"22\" rx=\"1\" fill=\"url(#jg-tilla)\"/><circle cx=\"2.4\" cy=\"-28.5\" r=\"1.6\" fill=\"url(#jg-tilla)\"/><rect x=\"-3.4\" y=\"27\" width=\"6.8\" height=\"8\" rx=\"1.5\" fill=\"#1E1E2A\"/><path d=\"M-3.8 35 L3.8 35 L0.9 52 Q0 55 -0.9 52 Z\" fill=\"url(#jg-tilla)\"/><path d=\"M0 40.5 V52.5\" stroke=\"#5A3A12\" stroke-width=\".7\"/><circle cx=\"0\" cy=\"40\" r=\"1.1\" fill=\"#5A3A12\"/><rect x=\"-3.2\" y=\"-50\" width=\"1.6\" height=\"76\" rx=\".8\" fill=\"#fff\" opacity=\".18\"/></g><circle cx=\"60\" cy=\"60\" r=\"4.2\" fill=\"url(#jg-tilla)\" stroke=\"#7A5214\" stroke-width=\".6\"/></svg>";

let jangTaymer = null, jangQidiruv = null;
function jangniTozala() {
  clearInterval(jangTaymer); jangTaymer = null;
  if (jangQidiruv) { clearInterval(jangQidiruv); jangQidiruv = null; mijozOl().then((m) => m && m.rpc("jang_qidiruvni_bekor")).catch(() => {}); }
  document.body.classList.remove("jang-rejim");
}
window.addEventListener("hashchange", () => { if (!/^#jang\/\d+/.test(location.hash) && location.hash !== "#jang/qidir") jangniTozala(); });

// Savollar: iqtibos raqami + 4 ta muallif (har bir o'yinchi o'z tilida ko'radi)
function jangSavollari() {
  const r = aralashtir(ochiqIqtiboslar().filter((iq) => MUALLIFLAR[iq.muallif]), Math.random).slice(0, JANG_SAVOL_SONI);
  return r.map((iq) => ({ i: IQTIBOSLAR.indexOf(iq), togri: iq.muallif, v: aralashtir([iq.muallif, ...oxshashMualliflar(iq.muallif, 3)], Math.random) }));
}
const jangSavolMatni = (sv) => { const iq = IQTIBOSLAR[sv.i]; return iq ? iqtibosMatni(iq) : ""; };

// Sayt ochiq turganda — «onlayn» belgisi (har daqiqada)
async function faollikniYoz() {
  if (!BAZA_YOQIQ || !mening || document.hidden) return;
  try { const m = await mijozOl(); await m.rpc("faollik_yoz"); } catch (e) {}
}
setTimeout(faollikniYoz, 4000); setInterval(faollikniYoz, 60000);
document.addEventListener("visibilitychange", () => { if (!document.hidden) faollikniYoz(); });

function jangAvatar(p, olcham, sinf) { return avatarEl(p || { ism: "?" }, olcham, sinf); }
const BOT_PROFIL = { ism: "Kitobcha bot", rasm: "q:robot" };

// ---------- Lobbi ----------
async function jangLobbi() {
  jangniTozala();
  const s = $("duellarSahifa");
  s.innerHTML = "";
  const q = yarat("div", "jang-lobbi");
  const bosh = yarat("div", "jang-bosh");
  const belgi = yarat("div", "jang-belgi"); belgi.innerHTML = JANG_GERB;
  bosh.append(belgi, yarat("h2", "", "DUEL"), yarat("p", "", "Onlayn bellashuv"));
  q.appendChild(bosh);
  s.appendChild(q);
  const m = await profilniTekshir(s);
  if (!m) return;
  const stat = yarat("div", "jang-stat");
  const ustun = (a, b, sinf) => { const u = yarat("div", "jang-stat-ustun " + (sinf || "")); u.append(yarat("b", "", a), yarat("span", "", b)); return u; };
  q.appendChild(stat);
  const tile = (href, sarlavha, izoh, sinf, belgiMatn) => {
    const a = havola(href, "jang-tile " + (sinf || ""), "");
    a.append(yarat("b", "", sarlavha)); if (izoh) a.appendChild(yarat("small", "", izoh));
    a.appendChild(yarat("span", "jang-tile-belgi", belgiMatn));
    return a;
  };
  const panjara = yarat("div", "jang-tilelar");
  const onlayn = tile("#jang/onlayn", "Onlayn o'yinchilar", "", "", "📡");
  const nishon = yarat("span", "jang-onlayn-son", "…"); onlayn.appendChild(nishon);
  panjara.append(onlayn, tile("#jang/reyting", "Eng zo'rlari", "Reytingni ko'ring", "oltin", "🏆"),
    tile("#jang/chaqir", "Do'stni duelga chaqirish", "", "", "👥"), tile("#jang/mening", "Mening duellarim", "", "", "📋"));
  const qidiruvchi = havola("#jang/qidir", "jang-qidiruvchi yashirin", "");
  q.append(qidiruvchi, panjara);
  q.appendChild(havola("#duellar/eski", "jang-eski", "Kitobdosh bilan navbatma-navbat duel (eski) →"));
  const boshla = havola("#jang/qidir", "jang-katta-tugma", "");
  boshla.innerHTML = QILICH; boshla.appendChild(yarat("span", "", "Raqib qidirish"));
  q.appendChild(yarat("div", "jang-pastki")).appendChild(boshla);

  const [{ data: r }, { data: on }] = await Promise.all([
    m.from("jang_reyting").select("ball,janglar,yutuq").eq("profil_id", mening.id).maybeSingle(),
    m.rpc("onlayn_oyinchilar"),
  ]);
  const ball = r ? r.ball : 0, d = jangDarajasi(ball);
  stat.append(ustun(d.belgi, d.nom, "daraja"), ustun(String(ball), "ball", "ball"), ustun(String(r ? r.janglar : 0), "duellar"));
  nishon.textContent = "● " + ((on && on.soni) || 1);
  if (on && on.qidiryapti > 0) {
    qidiruvchi.textContent = t("🔍 {n} kishi hozir raqib qidiryapti — bosing va darhol bellashing!", { n: on.qidiryapti });
    qidiruvchi.classList.remove("yashirin");
  }
}

// ---------- Raqib qidirish ----------
async function jangQidir() {
  jangniTozala();
  const s = $("duellarSahifa");
  s.innerHTML = "";
  const m = await profilniTekshir(s);
  if (!m) return;
  document.body.classList.add("jang-rejim");
  const q = yarat("div", "jang-qidiruv");
  q.append(yarat("h2", "", "Raqib qidirilmoqda…"), yarat("p", "kichik-matn", "Iltimos, kuting…"));
  const radar = yarat("div", "jang-radar");
  radar.append(yarat("span", "jang-radar-nur"), jangAvatar(mening, 64, "jang-radar-men"));
  const vaqt = yarat("p", "jang-vaqt", "0:00");
  const onlayn = yarat("div", "jang-qidiruv-onlayn yashirin");
  const bekor = yarat("button", "jang-katta-tugma", "✕ Bekor qilish"); bekor.type = "button";
  const xabar = yarat("p", "kichik-matn");
  q.append(radar, vaqt, xabar, onlayn, yarat("div", "jang-pastki")); q.lastChild.appendChild(bekor);
  s.appendChild(q);
  const savollar = jangSavollari();
  const t0 = Date.now();
  bekor.addEventListener("click", () => { location.hash = "#duellar"; });
  // Raqib tez topilmasa — saytda onlayn turganlarni ko'rsatamiz (to'g'ridan-to'g'ri chaqirish uchun)
  let oxirgiRoyxat = 0;
  const onlaynniChiz = async () => {
    oxirgiRoyxat = Date.now();
    const { data } = await m.rpc("onlayn_oyinchilar");
    const r = ((data && data.royxat) || []).slice(0, 8);
    onlayn.innerHTML = ""; onlayn.classList.remove("yashirin");
    if (!r.length) {
      onlayn.append(yarat("p", "kichik-matn", "Hozir saytda boshqa o'yinchi yo'q. Kimdir kirib «Raqib qidirish»ni bossa, duel o'zi boshlanadi. Do'stingizni taklif qiling:"));
      const ul = yarat("button", "jang-ikkinchi", "✈ Telegram'da do'stni taklif qilish"); ul.type = "button";
      ul.addEventListener("click", () => window.open("https://t.me/share/url?url=" + encodeURIComponent(SAYT_MANZILI + "#jang/qidir") + "&text=" + encodeURIComponent(t("Men bilan sitata.uz'da onlayn duel o'yna! ✒️")), "_blank", "noopener"));
      onlayn.appendChild(ul);
      return;
    }
    onlayn.appendChild(yarat("p", "jang-onlayn-sarlavha", t("Saytda hozir onlayn — chaqiring:")));
    const q2 = yarat("div", "jang-royxat");
    r.forEach((p) => { const b = yarat("button", "jang-chaqir", "✒️ Chaqirish"); b.type = "button"; b.addEventListener("click", () => chaqirish(m, p, b)); q2.appendChild(oyinchiQatori(p, b)); });
    onlayn.appendChild(q2);
  };
  let band = false;
  const sora = async () => {
    const sek = Math.floor((Date.now() - t0) / 1000);
    vaqt.textContent = Math.floor(sek / 60) + ":" + String(sek % 60).padStart(2, "0");
    if (sek >= 8 && Date.now() - oxirgiRoyxat > 6000) onlaynniChiz();
    if (band) return; band = true;
    try {
      const { data, error } = await m.rpc("jang_qidir", { p_savollar: savollar });
      if (error) { xabar.textContent = t("Aloqa uzildi — qayta urinilmoqda…"); return; }
      xabar.textContent = "";
      if (data && jangQidiruv) { clearInterval(jangQidiruv); jangQidiruv = null; location.hash = "#jang/" + data; }
    } finally { band = false; }
  };
  jangQidiruv = setInterval(sora, 1500);
  sora();
}

// ---------- Bellashuv sahifasi ----------
async function jangniChiz(param) {
  if (param === "qidir") return jangQidir();
  if (param === "onlayn") return jangOnlayn();
  if (param === "reyting") return jangReytingi();
  if (param === "mening") return jangMening();
  if (param === "chaqir") return jangChaqir();
  if (!/^\d+$/.test(param || "")) { location.hash = "#duellar"; return; }
  jangniTozala();
  const s = $("duellarSahifa");
  s.innerHTML = "";
  const m = await profilniTekshir(s);
  if (!m) return;
  const id = Number(param);
  const st = { id, m, j: null, men: null, raqib: null, profillar: {}, farq: 0, i: null, savolBoshi: 0, javobBand: false, ekran: "", natijaChizildi: false };
  const yangila = async () => {
    const { data: j, error } = await m.rpc("jang_holati", { p_id: id });
    if (error) return;
    if (!j) { s.innerHTML = ""; s.appendChild(yarat("p", "bosh-holat", "Duel topilmadi.")); s.appendChild(havola("#duellar", "asosiy", "Duellarga qaytish")); clearInterval(jangTaymer); return; }
    st.menA = j.a === mening.id;
    // Mahalliy javoblar serverdagidan ko'p bo'lsa (so'rov hali yetib bormagan) — mahalliysini saqlaymiz
    const k = st.menA ? "a_javob" : "b_javob";
    if (st.mahalliy && st.mahalliy.length > (j[k] || []).length && j.holat === "davom") j[k] = st.mahalliy;
    st.mahalliy = j[k];
    st.j = j; st.farq = new Date(j.hozir).getTime() - Date.now();
    if (!st.profillarOlindi) {
      st.profillar = await profillarniOl(m, [j.a, j.b].filter(Boolean));
      st.profillarOlindi = true;
    }
    st.men = st.profillar[mening.id] || mening;
    st.raqib = j.bot ? BOT_PROFIL : st.profillar[st.menA ? j.b : j.a] || { ism: "Raqib" };
    jangEkrani(s, st);
  };
  await yangila();
  if (location.hash === "#jang/" + id) jangTaymer = setInterval(yangila, 1000);
}

const serverVaqti = (st) => Date.now() + st.farq;
const javoblar = (st, menmi) => { const j = st.j; const a = st.menA === menmi; return (a ? j.a_javob : j.b_javob) || []; };
// Bot javoblari: vaqti kelganlarigina ko'rinadi
function raqibKorinadi(st) {
  const r = javoblar(st, false);
  if (!st.j.bot || st.j.holat === "tugadi") return r;
  const otdi = serverVaqti(st) - new Date(st.j.boshlandi).getTime();
  let yig = 0;
  return r.filter((x) => { yig += x.ms + 700; return yig <= otdi; });
}
const togriSoni = (r) => r.filter((x) => x.t).length;

function jangEkrani(s, st) {
  const j = st.j;
  if (j.holat === "taklif") return chaqiruvEkrani(s, st);
  if (j.holat === "bekor" || j.holat === "kutish") {
    if (st.ekran === "bekor") return; st.ekran = "bekor"; s.innerHTML = "";
    const q = yarat("div", "jang-qidiruv"); q.append(yarat("p", "katta-belgi", "🕊"), yarat("h3", "", "Chaqiruv bekor qilindi yoki muddati o'tdi."), havola("#duellar", "jang-katta-tugma", "Duellarga qaytish"));
    s.appendChild(q); clearInterval(jangTaymer); return;
  }
  if (j.holat === "tugadi") return natijaEkrani(s, st);
  // davom
  document.body.classList.add("jang-rejim");
  const qolgan = new Date(j.boshlandi).getTime() - serverVaqti(st);
  if (qolgan > 0) return sanoqEkrani(s, st, qolgan);
  const meniki = javoblar(st, true);
  if (meniki.length >= j.savollar.length) return kutishEkrani(s, st);
  oyinEkrani(s, st, meniki.length);
}

function jangTepasi(st) {
  const j = st.j;
  const top = yarat("div", "jang-tepa");
  const tomon = (p, ball, sinf, reyting) => {
    const el = yarat("div", "jang-tomon " + sinf);
    const d = jangDarajasi(reyting);
    const matn = yarat("div", "jang-tomon-matn"); matn.append(yarat("b", "", p.ism || "?"), yarat("small", "", p === BOT_PROFIL ? "🤖 bot" : d.belgi + " " + t(d.nom)));
    el.append(jangAvatar(p, 44, "jang-av"), matn);
    return el;
  };
  const menR = st.menA ? j.a_reyting : j.b_reyting, uR = st.menA ? j.b_reyting : j.a_reyting;
  const hisob = yarat("div", "jang-hisob");
  hisob.append(yarat("b", "men", String(togriSoni(javoblar(st, true)))), yarat("span", "jang-hisob-belgi"), yarat("b", "u", String(togriSoni(raqibKorinadi(st)))));
  hisob.children[1].innerHTML = QILICH;
  top.append(tomon(st.men, 0, "men", menR), hisob, tomon(st.raqib, 0, "u", uR));
  const yol = yarat("div", "jang-yol");
  const r = javoblar(st, true);
  for (let k = 0; k < j.savollar.length; k++) yol.appendChild(yarat("span", k < r.length ? (r[k].t ? "togri" : "xato") : k === r.length ? "joriy" : ""));
  const w = yarat("div", "jang-tepa-quti"); w.append(top, yol);
  return w;
}

function sanoqEkrani(s, st, qolgan) {
  const n = Math.ceil(qolgan / 1000);
  if (st.ekran === "sanoq" + n) return; st.ekran = "sanoq" + n;
  s.innerHTML = "";
  const q = yarat("div", "jang-sanoq");
  const vs = yarat("div", "jang-vs");
  const tomon = (p) => { const t = yarat("div", ""); t.append(jangAvatar(p, 84, "jang-av-katta"), yarat("b", "", p.ism)); return t; };
  vs.append(tomon(st.men), yarat("span", "jang-vs-belgi", "VS"), tomon(st.raqib));
  q.append(vs, yarat("p", "jang-sanoq-son", String(Math.max(1, n))), yarat("p", "kichik-matn", "10 ta savol · har biriga 15 soniya"));
  s.appendChild(q);
}

function oyinEkrani(s, st, i) {
  if (st.i === i && st.ekran === "oyin") { // faqat tepani yangilaymiz
    const eski = s.querySelector(".jang-tepa-quti"); if (eski) eski.replaceWith(jangTepasi(st));
    return;
  }
  st.ekran = "oyin"; st.i = i; st.javobBand = false;
  const sv = st.j.savollar[i];
  s.innerHTML = "";
  s.appendChild(jangTepasi(st));
  const q = yarat("div", "jang-savol");
  q.append(yarat("p", "jang-savol-raqam", `${i + 1} / ${st.j.savollar.length}`), yarat("blockquote", "jang-iqtibos", "«" + jangSavolMatni(sv) + "»"), yarat("p", "jang-savol-matn", "Kim aytgan?"));
  const variantlar = yarat("div", "jang-variantlar");
  const tugmalar = sv.v.map((ism, k) => {
    const b = yarat("button", "jang-variant"); b.type = "button";
    b.append(yarat("span", "jang-variant-harf", "ABCD"[k]), yarat("span", "", muallifNomi(ism)));
    b.addEventListener("click", () => javobBer(ism));
    variantlar.appendChild(b); return b;
  });
  q.appendChild(variantlar);
  const taymer = yarat("div", "jang-taymer"); const chiziq = yarat("span", ""); taymer.appendChild(chiziq);
  s.append(q, taymer);
  st.savolBoshi = Date.now();
  requestAnimationFrame(() => { chiziq.style.transition = `transform ${JANG_SOniya}s linear`; chiziq.style.transform = "scaleX(0)"; });
  const vaqtTugadi = setTimeout(() => javobBer(null), JANG_SOniya * 1000);
  // Klaviatura: 1-4 yoki A-D
  const tugma = (e) => {
    const k = "1234".indexOf(e.key) >= 0 ? "1234".indexOf(e.key) : "abcd".indexOf(e.key.toLowerCase());
    if (k >= 0 && k < tugmalar.length && !/^(INPUT|TEXTAREA)$/.test((document.activeElement || {}).tagName)) javobBer(sv.v[k]);
  };
  document.addEventListener("keydown", tugma);
  async function javobBer(ism) {
    if (st.javobBand || st.i !== i) return; st.javobBand = true;
    clearTimeout(vaqtTugadi); document.removeEventListener("keydown", tugma);
    const togri = ism === sv.togri, ms = Math.min(JANG_SOniya * 1000, Date.now() - st.savolBoshi);
    tugmalar.forEach((b, k) => {
      b.disabled = true;
      if (sv.v[k] === sv.togri) b.classList.add("togri");
      else if (sv.v[k] === ism) b.classList.add("xato");
    });
    if (ism === null) q.appendChild(yarat("p", "jang-vaqt-tugadi", "⏱ Vaqt tugadi"));
    chiziq.style.transition = "none";
    const javobSorov = st.m.rpc("jang_javob", { p_id: st.id, p_i: i, p_togri: togri, p_ms: ms });
    // Mahalliy holatni darhol yangilaymiz (keyingi so'rovgacha kutmaslik uchun)
    const r = st.menA ? st.j.a_javob : st.j.b_javob;
    if (r.length === i) r.push({ t: togri, ms });
    await Promise.all([javobSorov, new Promise((ok) => setTimeout(ok, 900))]);
    st.ekran = ""; jangEkrani(s, st);
  }
}

function kutishEkrani(s, st) {
  const eski = s.querySelector(".jang-tepa-quti");
  if (st.ekran === "kutish" && eski) { eski.replaceWith(jangTepasi(st)); return; }
  st.ekran = "kutish";
  s.innerHTML = "";
  s.appendChild(jangTepasi(st));
  const q = yarat("div", "jang-qidiruv");
  q.append(yarat("p", "katta-belgi", "⏳"), yarat("h3", "", "Raqib hali o'ylayapti…"), yarat("p", "kichik-matn", "U tugatishi bilan natija chiqadi."));
  s.appendChild(q);
}

function chaqiruvEkrani(s, st) {
  const j = st.j;
  const qoldi = Math.max(0, 90 - Math.floor((serverVaqti(st) - new Date(j.yaratildi).getTime()) / 1000));
  const meniChaqirdi = j.b === mening.id;
  const kalit = "taklif" + (meniChaqirdi ? "b" : "a");
  if (st.ekran === kalit) { const v = s.querySelector(".jang-vaqt"); if (v) v.textContent = qoldi + " s"; return; }
  st.ekran = kalit;
  s.innerHTML = "";
  const q = yarat("div", "jang-qidiruv");
  const u = st.raqib;
  q.append(jangAvatar(u, 84, "jang-av-katta"));
  if (meniChaqirdi) {
    q.append(yarat("h3", "", `${u.ism} ${t(j.tur === "qasos" ? "qasos olmoqchi!" : "sizni onlayn duelga chaqirdi!")}`), yarat("p", "kichik-matn", "10 ta savol · har biriga 15 soniya"), yarat("p", "jang-vaqt", qoldi + " s"));
    const ha = yarat("button", "jang-katta-tugma", "✒️ Qabul qilish"); ha.type = "button";
    const yoq = yarat("button", "jang-ikkinchi", "Rad etish"); yoq.type = "button";
    ha.addEventListener("click", async () => { ha.disabled = true; const { data } = await st.m.rpc("jang_qabul", { p_id: st.id }); if (!data) { st.ekran = ""; } });
    yoq.addEventListener("click", async () => { await st.m.rpc("jang_rad", { p_id: st.id }); location.hash = "#duellar"; });
    q.append(ha, yoq);
  } else {
    q.append(yarat("h3", "", `${u.ism} ${t("javobini kutyapmiz…")}`), yarat("p", "kichik-matn", "Unga bildirishnoma (va Telegram'da xabar) yuborildi."), yarat("p", "jang-vaqt", qoldi + " s"));
    const bekor = yarat("button", "jang-ikkinchi", "✕ Bekor qilish"); bekor.type = "button";
    bekor.addEventListener("click", async () => { await st.m.rpc("jang_rad", { p_id: st.id }); location.hash = "#duellar"; });
    q.appendChild(bekor);
  }
  s.appendChild(q);
}

function natijaEkrani(s, st) {
  const j = st.j;
  const menNat = j.natija === "durang" ? "durang" : (j.natija === "a") === st.menA ? "yutdi" : "yutqazdi";
  const ozgarish = st.menA ? j.a_ozgarish : j.b_ozgarish;
  // Qasos holatini kuzatamiz (natija sahifasi qayta chizilmaydi — faqat tugma)
  if (st.natijaChizildi) { qasosniYangila(st); return; }
  st.natijaChizildi = true; st.ekran = "natija";
  document.body.classList.remove("jang-rejim");
  s.innerHTML = "";
  const tepa = yarat("div", "jang-natija " + menNat);
  const belgilar = { yutdi: ["🏆", "G'alaba!"], yutqazdi: ["😞", "Mag'lubiyat"], durang: ["🤝", "Durang"] };
  tepa.append(yarat("div", "jang-natija-belgi", belgilar[menNat][0]), yarat("h2", "", belgilar[menNat][1]));
  const hisob = yarat("div", "jang-natija-hisob");
  const tomon = (p) => { const t = yarat("div", "jang-natija-tomon"); t.append(jangAvatar(p, 64, "jang-av-katta"), yarat("b", "", p.ism)); return t; };
  const [mb, ub] = st.menA ? [j.a_ball, j.b_ball] : [j.b_ball, j.a_ball];
  const son = yarat("div", "jang-natija-son"); son.append(yarat("b", "men", String(mb)), yarat("span", "", ":"), yarat("b", "u", String(ub)));
  hisob.append(tomon(st.men), son, tomon(st.raqib));
  tepa.appendChild(hisob);
  if (ozgarish != null) tepa.appendChild(yarat("span", "jang-ball " + (ozgarish > 0 ? "plus" : ozgarish < 0 ? "minus" : ""), (ozgarish > 0 ? "+" : "") + ozgarish + " " + t("ball")));
  s.appendChild(tepa);
  // Savollar bo'yicha natija
  s.appendChild(yarat("h3", "jang-natijalar-sarlavha", "Natijalar"));
  s.appendChild(yarat("p", "kichik-matn markaz", "To'g'ri javobni ko'rish uchun raqam ustiga bosing"));
  const ikki = yarat("div", "jang-natija-panjaralar");
  const panjara = (r) => {
    const p = yarat("div", "jang-natija-panjara");
    j.savollar.forEach((sv, k) => {
      const b = yarat("button", "jang-raqam " + (r[k] ? (r[k].t ? "togri" : "xato") : "yoq"), String(k + 1)); b.type = "button";
      b.addEventListener("click", () => {
        const o = panelOynasi(`${k + 1}-savol`);
        o.ichi.append(yarat("blockquote", "panel-iqtibos", "«" + jangSavolMatni(sv) + "»"), yarat("p", "panel-muallif", "✓ " + muallifNomi(sv.togri)));
      });
      p.appendChild(b);
    });
    return p;
  };
  ikki.append(panjara(javoblar(st, true)), yarat("span", "jang-ajratgich"), panjara(javoblar(st, false)));
  s.appendChild(ikki);
  // Tugmalar
  const past = yarat("div", "jang-pastki jang-natija-tugmalar");
  st.qasosTugma = yarat("button", "jang-katta-tugma qasos"); st.qasosTugma.type = "button";
  const uy = havola("#duellar", "jang-uy", ""); uy.innerHTML = '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" aria-hidden="true"><path d="M3 11 12 3l9 8v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/></svg>'; uy.setAttribute("aria-label", t("Duellar"));
  const yangi = havola("#jang/qidir", "jang-ikkinchi", ""); yangi.innerHTML = QILICH; yangi.appendChild(yarat("span", "", "Yangi duel"));
  past.append(st.qasosTugma, yarat("div", "jang-natija-qator"));
  past.lastChild.append(uy, yangi);
  s.appendChild(past);
  st.qasosTugma.addEventListener("click", () => qasosBos(st));
  st.qasosBoshi = Date.now();
  qasosniYangila(st);
  if (j.bot) { clearInterval(jangTaymer); }
  if (typeof kitobchaBelgisiniYangila === "function") kitobchaBelgisiniYangila();
}

// Qasos: 30 soniya ichida; raqib taklif qilgan bo'lsa — «Qabul qilish»
function qasosniYangila(st) {
  const b = st.qasosTugma, j = st.j;
  if (!b) return;
  if (j.bot) { b.innerHTML = QILICH; b.appendChild(yarat("span", "", "Yangi duel")); b.style.removeProperty("--qoldi"); return; }
  if (j.qasos_holat === "davom" && j.qasos_id) { clearInterval(jangTaymer); location.hash = "#jang/" + j.qasos_id; return; }
  const qoldi = Math.max(0, 1 - (Date.now() - st.qasosBoshi) / 30000);
  b.style.setProperty("--qoldi", qoldi);
  b.innerHTML = QILICH;
  if (j.qasos_holat === "taklif" && j.qasos_kim !== mening.id) { b.appendChild(yarat("span", "", t("Raqib qasos so'radi — qabul qilish"))); b.classList.add("taklif"); }
  else if (j.qasos_holat === "taklif") { b.appendChild(yarat("span", "", t("Raqib javobini kutyapmiz…"))); b.disabled = true; }
  else if (j.qasos_holat === "bekor" || qoldi === 0) { b.appendChild(yarat("span", "", t("Qasos vaqti o'tdi"))); b.disabled = true; clearInterval(jangTaymer); }
  else b.appendChild(yarat("span", "", t("Qasos olish")));
}

async function qasosBos(st) {
  const j = st.j, m = st.m;
  st.qasosTugma.disabled = true;
  if (j.bot) { location.hash = "#jang/qidir"; return; }
  const raqibId = st.menA ? j.b : j.a;
  const { data, error } = await m.rpc("jang_taklif", { p_raqib: raqibId, p_savollar: jangSavollari(), p_oldingi: j.id });
  if (error || !data) { st.qasosTugma.disabled = false; qisqaXabar(t("Qasos taklifini yuborib bo'lmadi.")); return; }
  // Raqib allaqachon taklif qilgan bo'lsa — darhol boshlanadi; aks holda javob kutamiz
  const { data: h } = await m.rpc("jang_holati", { p_id: data });
  if (h && h.holat === "davom") { location.hash = "#jang/" + data; return; }
  st.j.qasos_id = data; st.j.qasos_holat = "taklif"; st.j.qasos_kim = mening.id;
  qasosniYangila(st);
}

// ---------- Ro'yxat sahifalari ----------
function jangRoyxatBoshi(s, sarlavha) {
  jangniTozala();
  s.innerHTML = "";
  s.appendChild(havola("#duellar", "orqaga", "← Duel"));
  s.appendChild(yarat("h2", "sahifa-sarlavha", sarlavha));
}
function oyinchiQatori(p, ong) {
  const q = yarat("div", "jang-qator");
  const d = jangDarajasi(p.ball);
  const matn = yarat("div", ""); matn.append(yarat("b", "", p.ism), yarat("small", "kichik-matn", `${d.belgi} ${t(d.nom)} · ${p.ball || 0} ${t("ball")}`));
  q.append(jangAvatar(p, 44), matn);
  if (ong) q.appendChild(ong);
  return q;
}
async function chaqirish(m, p, tugma) {
  tugma.disabled = true;
  const { data, error } = await m.rpc("jang_taklif", { p_raqib: p.id, p_savollar: jangSavollari() });
  if (error || !data) { tugma.disabled = false; qisqaXabar(/ko'p/.test((error && error.message) || "") ? t("Juda ko'p chaqiruv — biroz kuting.") : t("Chaqirib bo'lmadi.")); return; }
  location.hash = "#jang/" + data;
}

async function jangOnlayn() {
  const s = $("duellarSahifa");
  jangRoyxatBoshi(s, "📡 Onlayn o'yinchilar");
  const m = await profilniTekshir(s);
  if (!m) return;
  const { data } = await m.rpc("onlayn_oyinchilar");
  const r = (data && data.royxat) || [];
  s.appendChild(yarat("p", "kichik-matn markaz", t("Hozir saytda: {n}", { n: (data && data.soni) || 1 })));
  if (!r.length) { s.appendChild(yarat("p", "bosh-holat", "Hozircha boshqa hech kim yo'q. «Raqib qidirish»ni bosing — kimdir kirib qidirishni boshlashi bilan duel o'zi boshlanadi.")); s.appendChild(havola("#jang/qidir", "jang-katta-tugma", "Raqib qidirish")); return; }
  const q = yarat("div", "jang-royxat");
  r.forEach((p) => {
    let b;
    if (p.qidiryapti) { b = havola("#jang/qidir", "jang-chaqir qidiryapti", "🔍 Bellashish"); }
    else { b = yarat("button", "jang-chaqir", "✒️ Chaqirish"); b.type = "button"; b.addEventListener("click", () => chaqirish(m, p, b)); }
    q.appendChild(oyinchiQatori(p, b));
  });
  s.appendChild(q);
}

async function jangReytingi() {
  const s = $("duellarSahifa");
  jangRoyxatBoshi(s, "🏆 Eng zo'rlari");
  const m = await profilniTekshir(s);
  if (!m) return;
  const { data } = await m.rpc("jang_reytingi");
  const r = data || [];
  if (!r.length) { s.appendChild(yarat("p", "bosh-holat", "Hali hech kim duel o'ynamagan — birinchi bo'ling!")); return; }
  const q = yarat("div", "jang-royxat");
  r.forEach((p, k) => {
    const qator = oyinchiQatori(p, yarat("span", "jang-orin", k < 3 ? ["🥇", "🥈", "🥉"][k] : String(k + 1)));
    if (p.id === mening.id) qator.classList.add("men");
    q.appendChild(qator);
  });
  s.appendChild(q);
}

async function jangMening() {
  const s = $("duellarSahifa");
  jangRoyxatBoshi(s, "📋 Mening duellarim");
  const m = await profilniTekshir(s);
  if (!m) return;
  const { data } = await m.from("janglar").select("id,a,b,bot,a_ball,b_ball,natija,a_ozgarish,b_ozgarish,tugadi").eq("holat", "tugadi").order("tugadi", { ascending: false }).limit(30);
  const r = data || [];
  if (!r.length) { s.appendChild(yarat("p", "bosh-holat", "Hali duel o'ynamadingiz.")); s.appendChild(havola("#jang/qidir", "jang-katta-tugma", "Raqib qidirish")); return; }
  const profillar = await profillarniOl(m, r.flatMap((d) => [d.a, d.b]).filter(Boolean));
  const q = yarat("div", "jang-royxat");
  r.forEach((d) => {
    const menA = d.a === mening.id;
    const u = d.bot ? BOT_PROFIL : profillar[menA ? d.b : d.a] || { ism: "Raqib" };
    const nat = d.natija === "durang" ? "durang" : (d.natija === "a") === menA ? "yutdi" : "yutqazdi";
    const oz = menA ? d.a_ozgarish : d.b_ozgarish;
    const a = havola("#jang/" + d.id, "jang-qator", "");
    const matn = yarat("div", ""); matn.append(yarat("b", "", u.ism), yarat("small", "kichik-matn", vaqtOldin(d.tugadi)));
    a.append(jangAvatar(u, 44), matn,
      yarat("span", "duel-hisob " + nat, `${menA ? d.a_ball : d.b_ball} : ${menA ? d.b_ball : d.a_ball}`),
      yarat("span", "jang-oz " + (oz > 0 ? "plus" : oz < 0 ? "minus" : ""), oz == null ? "" : (oz > 0 ? "+" : "") + oz));
    q.appendChild(a);
  });
  s.appendChild(q);
}

async function jangChaqir() {
  const s = $("duellarSahifa");
  jangRoyxatBoshi(s, "👥 Do'stni duelga chaqirish");
  const m = await profilniTekshir(s);
  if (!m) return;
  const dostlar = await kitobdoshlarRoyxati(m);
  s.appendChild(yarat("p", "kichik-matn markaz", "Kitobdoshingizni tanlang — unga bildirishnoma va Telegram'da xabar boradi. 90 soniya ichida qabul qilsa, duel boshlanadi."));
  if (!dostlar.length) { s.appendChild(yarat("p", "bosh-holat", "Hali kitobdoshingiz yo'q.")); s.append(havola("#kitobdoshlar", "asosiy", "Kitobdosh qo'shish"), havola("#jang/onlayn", "barchasi", "Onlayn o'yinchilarni chaqirish →")); return; }
  const { data: rey } = await m.from("jang_reyting").select("profil_id,ball").in("profil_id", dostlar.map((p) => p.id));
  const ball = {}; (rey || []).forEach((r) => { ball[r.profil_id] = r.ball; });
  const q = yarat("div", "jang-royxat");
  dostlar.forEach((p) => { const b = yarat("button", "jang-chaqir", "✒️ Chaqirish"); b.type = "button"; b.addEventListener("click", () => chaqirish(m, p, b)); q.appendChild(oyinchiQatori({ ...p, ball: ball[p.id] || 0 }, b)); });
  s.appendChild(q);
}

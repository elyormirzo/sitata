// ===== DARAJALAR VA BALLAR =====
// Ballar bazada hisoblanadi (supabase/ballar.sql): ball_haftalar(p), ball_voqealari(p), profil_bali(p), ball_reytingi.
// Sahifa: #daraja

const DARAJALAR = [
  { nom: "Boshlovchi", min: 0,     max: 99,    ranglar: ["#E9E1D0", "#CFC3A8", "#A89A7C"], shakl: "olti" },
  { nom: "Bronza",     min: 100,   max: 399,   ranglar: ["#F1B58C", "#B5652F", "#7A3A16"], shakl: "olti" },
  { nom: "Kumush",     min: 400,   max: 799,   ranglar: ["#F2F2F2", "#A9ABAF", "#5E6166"], shakl: "olti" },
  { nom: "Oltin",      min: 800,   max: 1399,  ranglar: ["#FFE08A", "#D9A021", "#8A5A06"], shakl: "olti" },
  { nom: "Platina",    min: 1400,  max: 1999,  ranglar: ["#C8F1E4", "#4BA58C", "#1C5546"], shakl: "olti" },
  { nom: "Zumrad",     min: 2000,  max: 4999,  ranglar: ["#9FE8B0", "#1E9A4C", "#0B4A24"], shakl: "olti" },
  { nom: "Olmos",      min: 5000,  max: 9999,  ranglar: ["#E8F4FF", "#8EC3EC", "#3F7DB3"], shakl: "olti" },
  { nom: "Ustoz",      min: 10000, max: 14999, ranglar: ["#E7D3FF", "#8B5CD6", "#4A2486"], shakl: "toj" },
  { nom: "Alloma",     min: 15000, max: 19999, ranglar: ["#FFD1D1", "#C2413B", "#6E1714"], shakl: "toj" },
  { nom: "Afsona",     min: 20000, max: null,  ranglar: ["#FFF6D6", "#E8B923", "#3B2A1A"], shakl: "toj" },
];
const darajaIndeksi = (ball) => { let i = 0; DARAJALAR.forEach((d, j) => { if (ball >= d.min) i = j; }); return i; };

// O'zimizning nishon: olti burchak ichida ochiq kitob (oddiy darajalar), dafna gulchambari ichida toj (yuqori darajalar)
let nishonId = 0;
function nishonSVG(i, olcham, qulf) {
  const d = DARAJALAR[i], [och, orta, toq] = d.ranglar, id = "n" + (++nishonId);
  const kulrang = qulf ? ' filter="url(#' + id + 'k)"' : "";
  const filtr = qulf ? `<filter id="${id}k"><feColorMatrix type="saturate" values="0.15"/></filter>` : "";
  const olti = (r) => [0, 1, 2, 3, 4, 5].map((k) => { const a = Math.PI / 3 * k - Math.PI / 2; return `${50 + r * Math.cos(a)},${50 + r * Math.sin(a)}`; }).join(" ");
  let shakl;
  if (d.shakl === "olti") {
    shakl = `
      <polygon points="${olti(48)}" fill="url(#${id}g)"/>
      <polygon points="${olti(41)}" fill="none" stroke="${och}" stroke-width="2" opacity=".8"/>
      <polygon points="${olti(35)}" fill="none" stroke="${toq}" stroke-width="1.5" opacity=".55"/>
      <polygon points="${olti(29)}" fill="${toq}" opacity=".18"/>
      <path d="M30 40 Q40 35 50 40 L50 66 Q40 61 30 66 Z M70 40 Q60 35 50 40 L50 66 Q60 61 70 66 Z" fill="${och}" stroke="${toq}" stroke-width="1.6" stroke-linejoin="round"/>
      <path d="M50 40 L50 66" stroke="${toq}" stroke-width="1.6"/>
      <path d="M35 45 Q41 42 46 45 M35 51 Q41 48 46 51 M54 45 Q59 42 65 45 M54 51 Q59 48 65 51" stroke="${orta}" stroke-width="1.2" fill="none"/>`;
  } else {
    const barg = (x, y, a) => `<ellipse cx="${x}" cy="${y}" rx="7" ry="3" transform="rotate(${a} ${x} ${y})" fill="${och}" stroke="${toq}" stroke-width=".8"/>`;
    const barglar = [];
    for (let k = 0; k < 7; k++) {
      const t = (k / 6) * Math.PI * 0.8 + Math.PI * 0.6, x = 50 + 38 * Math.cos(t), y = 50 + 38 * Math.sin(t);
      barglar.push(barg(x.toFixed(1), y.toFixed(1), (t * 180 / Math.PI + 90).toFixed(0)));
      barglar.push(barg((100 - x).toFixed(1), y.toFixed(1), (-(t * 180 / Math.PI + 90)).toFixed(0)));
    }
    shakl = `
      <circle cx="50" cy="50" r="46" fill="url(#${id}g)"/>
      <circle cx="50" cy="50" r="31" fill="${toq}" opacity=".2"/>
      ${barglar.join("")}
      <path d="M33 60 L30 40 L40 49 L50 34 L60 49 L70 40 L67 60 Z" fill="${och}" stroke="${toq}" stroke-width="1.8" stroke-linejoin="round"/>
      <rect x="33" y="61" width="34" height="6" rx="2" fill="${orta}" stroke="${toq}" stroke-width="1.4"/>
      <circle cx="50" cy="34" r="2.6" fill="${toq}"/><circle cx="30" cy="40" r="2.2" fill="${toq}"/><circle cx="70" cy="40" r="2.2" fill="${toq}"/>`;
  }
  return `<svg viewBox="0 0 100 100" width="${olcham}" height="${olcham}" role="img" aria-label="${d.nom} nishoni"${qulf ? ' class="qulf"' : ""}>
    <defs>${filtr}<linearGradient id="${id}g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${och}"/><stop offset=".55" stop-color="${orta}"/><stop offset="1" stop-color="${toq}"/></linearGradient></defs>
    <g${kulrang}>${shakl}</g></svg>`;
}

function nishonEl(i, olcham, qulf) { const s = yarat("span", "nishon-svg"); s.innerHTML = nishonSVG(i, olcham, qulf); return s; }

// Profil sahifasi uchun: «Kumush · 520 ball» yorlig'i
function darajaYorligi(profilId) {
  const quti = yarat("a", "daraja-yorliq");
  quti.href = mening && mening.id === profilId ? "#daraja" : "#reyting";
  if (!BAZA_YOQIQ) return quti;
  (async () => {
    try {
      const m = await mijozOl();
      const { data } = await m.rpc("profil_bali", { p: profilId });
      const ball = data || 0, i = darajaIndeksi(ball);
      quti.append(nishonEl(i, 34), yarat("b", "", DARAJALAR[i].nom), yarat("span", "", ` · ${ball} ball`));
    } catch (e) { /* yorliqsiz */ }
  })();
  return quti;
}

// ---------- «Darajam» sahifasi ----------
const darajaHolati = { tanlangan: null, oy: null };

async function darajaChiz() {
  const s = $("darajaSahifa");
  s.innerHTML = "";
  s.appendChild(yarat("h2", "sahifa-sarlavha", "Darajam"));
  const m = await profilniTekshir(s);
  if (!m) return;
  const yuklanmoqda = yarat("p", "bosh-holat", "Yuklanmoqda…"); s.appendChild(yuklanmoqda);
  const [{ data: haftalar, error }, { data: voqealar }] = await Promise.all([
    m.rpc("ball_haftalar", { p: mening.id }), m.rpc("ball_voqealari", { p: mening.id }),
  ]);
  yuklanmoqda.remove();
  if (error) { s.appendChild(yarat("p", "bosh-holat", "Ballarni yuklab bo'lmadi.")); return; }
  const ball = haftalar.length ? haftalar[haftalar.length - 1].jami : 0;
  const joriyIndeks = darajaIndeksi(ball);
  if (darajaHolati.tanlangan == null) darajaHolati.tanlangan = joriyIndeks;

  // Nishonlar karuseli
  const karusel = yarat("div", "nishon-karusel");
  DARAJALAR.forEach((d, i) => {
    const b = yarat("button", "nishon-tugma" + (i === darajaHolati.tanlangan ? " tanlangan" : "")); b.type = "button";
    b.setAttribute("aria-label", d.nom);
    b.appendChild(nishonEl(i, i === darajaHolati.tanlangan ? 116 : 68, i > joriyIndeks));
    b.addEventListener("click", () => { darajaHolati.tanlangan = i; darajaChiz(); });
    karusel.appendChild(b);
  });
  s.appendChild(karusel);
  requestAnimationFrame(() => {
    const t = karusel.querySelector(".tanlangan");
    if (t) karusel.scrollLeft = t.offsetLeft - (karusel.clientWidth - t.offsetWidth) / 2;
  });

  const d = DARAJALAR[darajaHolati.tanlangan];
  const sarlavha = yarat("div", "daraja-sarlavha");
  if (darajaHolati.tanlangan === joriyIndeks) sarlavha.appendChild(yarat("p", "kichik-matn", "Mening darajam"));
  const nomQator = yarat("div", "daraja-nom");
  nomQator.appendChild(yarat("h3", "", d.nom));
  const info = yarat("button", "info-tugma", "i"); info.type = "button"; info.setAttribute("aria-label", "Ball qanday to'planadi");
  nomQator.appendChild(info);
  sarlavha.appendChild(nomQator);
  s.appendChild(sarlavha);

  const qoidalar = yarat("div", "ball-qoidalari yashirin");
  qoidalar.innerHTML = `<b>Ball qanday to'planadi</b>
    <ul><li>«Kim aytgan?»: topsangiz +50 (har xato −5, kamida +25), topa olmasangiz +10</li>
    <li>Viktorina: kunlik birinchi natijaning o'ndan biri</li>
    <li>Kitobdoshlar bilan birga o'qilgan kitobni tugatish: +150</li>
    <li>Iqtibos taklifingiz tasdiqlansa: +30</li>
    <li>Yangi kitobdosh: +10</li>
    <li>Bir hafta umuman o'ynamasangiz: −100 (ball 0 dan pastga tushmaydi)</li></ul>`;
  info.addEventListener("click", () => qoidalar.classList.toggle("yashirin"));
  s.appendChild(qoidalar);

  // Ball chizig'i
  const chegaralar = yarat("div", "ball-chegaralar");
  chegaralar.append(yarat("span", "", String(d.min)),
    yarat("b", "", darajaHolati.tanlangan === joriyIndeks ? String(ball) : ""),
    yarat("span", "", d.max == null ? "∞" : String(d.max)));
  const chiziq = yarat("div", "ball-chiziq"); const tol = yarat("span");
  let foiz = 0;
  if (darajaHolati.tanlangan < joriyIndeks) foiz = 100;
  else if (darajaHolati.tanlangan === joriyIndeks) foiz = d.max == null ? 100 : Math.max(3, Math.round(((ball - d.min) / (d.max - d.min + 1)) * 100));
  tol.style.width = foiz + "%"; chiziq.appendChild(tol);
  s.append(chegaralar, chiziq);
  if (darajaHolati.tanlangan === joriyIndeks && DARAJALAR[joriyIndeks + 1]) {
    s.appendChild(yarat("p", "kichik-matn markaz", `«${DARAJALAR[joriyIndeks + 1].nom}» darajasigacha ${DARAJALAR[joriyIndeks + 1].min - ball} ball qoldi`));
  }

  // Faol haftalar
  const faollar = haftalar.map((h) => h.faol);
  let joriySeriya = 0;
  for (let k = faollar.length - 1; k >= 0; k--) {
    if (faollar[k]) joriySeriya++;
    else if (k === faollar.length - 1) continue;   // joriy hafta hali tugamagan
    else break;
  }
  let rekord = 0, hozir = 0;
  faollar.forEach((f) => { hozir = f ? hozir + 1 : 0; rekord = Math.max(rekord, hozir); });
  const statlar = yarat("div", "hafta-statlar");
  const stat = (belgi, son, nom) => { const q = yarat("div", "hafta-stat"); q.append(yarat("b", "", `${belgi} ${son} hafta`), yarat("span", "", nom)); return q; };
  statlar.append(stat("🔥", joriySeriya, "Faol rejim"), stat("👑", rekord, "Rekordingiz"));
  s.appendChild(statlar);

  s.appendChild(kalendarChiz(haftalar, voqealar || []));
}

const OYLAR = ["Yanvar", "Fevral", "Mart", "Aprel", "May", "Iyun", "Iyul", "Avgust", "Sentabr", "Oktabr", "Noyabr", "Dekabr"];
const sanaMatni = (d) => d.toISOString().slice(0, 10);

function kalendarChiz(haftalar, voqealar) {
  const quti = yarat("div", "kalendar");
  const bugun = new Date(Date.now() + 5 * 3600 * 1000); bugun.setUTCHours(0, 0, 0, 0);   // Toshkent sanasi (UTC ko'rinishida)
  const birinchi = haftalar.length ? new Date(haftalar[0].hafta + "T00:00:00Z") : bugun;
  if (!darajaHolati.oy) darajaHolati.oy = { yil: bugun.getUTCFullYear(), oy: bugun.getUTCMonth() };
  const { yil, oy } = darajaHolati.oy;

  const kunlik = {};
  voqealar.forEach((v) => { kunlik[v.sana] = (kunlik[v.sana] || 0) + v.ball; });
  const haftalik = {};
  haftalar.forEach((h) => { haftalik[h.hafta] = h; });

  const yuqori = yarat("div", "kalendar-yuqori");
  const oldingi = yarat("button", "kalendar-tugma", "‹"); oldingi.type = "button"; oldingi.setAttribute("aria-label", "Oldingi oy");
  const keyingi = yarat("button", "kalendar-tugma", "›"); keyingi.type = "button"; keyingi.setAttribute("aria-label", "Keyingi oy");
  oldingi.disabled = yil * 12 + oy <= birinchi.getUTCFullYear() * 12 + birinchi.getUTCMonth();
  keyingi.disabled = yil * 12 + oy >= bugun.getUTCFullYear() * 12 + bugun.getUTCMonth();
  const surish = (n) => { const t = yil * 12 + oy + n; darajaHolati.oy = { yil: Math.floor(t / 12), oy: t % 12 }; quti.replaceWith(kalendarChiz(haftalar, voqealar)); };
  oldingi.addEventListener("click", () => surish(-1)); keyingi.addEventListener("click", () => surish(1));
  yuqori.append(oldingi, yarat("b", "", `${OYLAR[oy]} ${yil}`), keyingi);
  quti.appendChild(yuqori);

  const jadval = yarat("div", "kalendar-jadval");
  ["Du", "Se", "Ch", "Pa", "Ju", "Sh", "Ya", ""].forEach((k) => jadval.appendChild(yarat("span", "kalendar-bosh", k)));
  const oyBoshi = new Date(Date.UTC(yil, oy, 1));
  const kunlar = new Date(Date.UTC(yil, oy + 1, 0)).getUTCDate();
  let hafta = new Date(oyBoshi); hafta.setUTCDate(1 - ((oyBoshi.getUTCDay() + 6) % 7));   // dushanbaga
  while (hafta <= new Date(Date.UTC(yil, oy, kunlar))) {
    for (let k = 0; k < 7; k++) {
      const kun = new Date(hafta); kun.setUTCDate(hafta.getUTCDate() + k);
      const s = sanaMatni(kun);
      const katak = yarat("span", "kalendar-kun", String(kun.getUTCDate()));
      if (kun.getUTCMonth() !== oy) katak.classList.add("boshqa-oy");
      if (kunlik[s]) { katak.classList.add("faol-kun"); katak.title = `+${kunlik[s]} ball`; }
      if (s === sanaMatni(bugun)) katak.classList.add("bugun");
      jadval.appendChild(katak);
    }
    const h = haftalik[sanaMatni(hafta)];
    const delta = yarat("span", "hafta-delta");
    if (h) {
      delta.textContent = h.ball > 0 ? "+" + h.ball : String(h.ball);
      delta.classList.add(h.ball > 0 ? "musbat" : h.ball < 0 ? "manfiy" : "nol");
    }
    jadval.appendChild(delta);
    hafta.setUTCDate(hafta.getUTCDate() + 7);
  }
  quti.appendChild(jadval);
  quti.appendChild(yarat("p", "kichik-matn markaz", "Yashil — o'ynagan kunlar. O'ngda — haftalik ball."));
  return quti;
}

// Viktorina natijasini bazaga yozish (kuniga birinchi natija hisobga olinadi)
async function viktorinaNatijasiniYoz(ball, xabar) {
  if (!BAZA_YOQIQ || !mening) return;
  try {
    const m = await mijozOl();
    const uid = await kirish();
    if (uid !== mening.id) return;
    const { error } = await m.from("viktorina_natijalari").insert({ profil_id: mening.id, kun: haqiqiyBugun, ball: Math.min(300, ball) });
    if (!error) xabar.textContent = `+${Math.round(ball / 10)} ball darajangizga qo'shildi.`;
    else if (error.code === "23505") xabar.textContent = "Bugungi viktorina bali allaqachon hisoblangan — ertaga yana o'ynang.";
  } catch (e) { /* jim */ }
}

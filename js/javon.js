// ===== KITOB JAVONI VA YILLIK CHALLENGE =====
// Baza: kitob_javoni (o'qimoqchi / o'qiyapman / o'qidim), yillik_maqsad (yil, maqsad).
// Sahifa: #javon. Profil sahifasida — qisqa ko'rinish (boshqalar ham ko'radi).

const JAVONLAR = { oqiyapman: "O'qiyapman", oqidim: "O'qidim", oqimoqchi: "O'qimoqchiman" };
const javonHolati = { tab: "oqiyapman" };
const toshkentSana = () => new Date(Date.now() + 5 * 3600 * 1000).toISOString().slice(0, 10);
const joriyYil = () => Number(toshkentSana().slice(0, 4));

// Kitob muqovasi: nomidan rang, ustida bosh harflar
function muqovaEl(kitob, kichik, rasm) {
  let h = 0; for (const c of kitob) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  const ranglar = [["#8C4A2F", "#6B3E26"], ["#4F5B3A", "#353D26"], ["#3F5F7A", "#2A4357"], ["#7B2E2E", "#5A1F1F"], ["#6B5A2E", "#4A3E1F"], ["#5E3A6B", "#40274A"]];
  const [a, b] = ranglar[h % ranglar.length];
  const m = yarat("span", "muqova" + (kichik ? " kichik" : ""));
  m.style.background = `linear-gradient(90deg, ${b} 0 10%, ${a} 10% 100%)`;
  m.textContent = kitob.split(/\s+/).filter(Boolean).slice(0, 2).map((s) => s[0]).join("").toUpperCase();
  if (rasm && /^data:image\/jpeg;base64,/.test(rasm)) {
    m.classList.add("rasmli"); m.textContent = "";
    m.style.backgroundImage = `url("${rasm}")`;
    m.setAttribute("role", "img"); m.setAttribute("aria-label", kitob + " muqovasi");
  }
  return m;
}

function yulduzlarEl(baho, ozgartir) {
  const q = yarat("span", "kichik-yulduzlar");
  for (let n = 1; n <= 5; n++) {
    const b = yarat(ozgartir ? "button" : "span", n <= (baho || 0) ? "tola" : "", "★");
    if (ozgartir) { b.type = "button"; b.setAttribute("aria-label", n + " yulduz"); b.addEventListener("click", () => ozgartir(n)); }
    q.appendChild(b);
  }
  return q;
}

// Yillik challenge halqasi
function challengeHalqa(soni, maqsad, olcham) {
  const r = 44, a = 2 * Math.PI * r, f = maqsad ? Math.min(1, soni / maqsad) : 0;
  const s = yarat("span", "halqa");
  s.innerHTML = `<svg viewBox="0 0 100 100" width="${olcham}" height="${olcham}" aria-hidden="true">
    <circle cx="50" cy="50" r="${r}" fill="none" stroke="#E2D3B3" stroke-width="9"/>
    <circle cx="50" cy="50" r="${r}" fill="none" stroke="${f >= 1 ? "#C08A2E" : "#4F5B3A"}" stroke-width="9" stroke-linecap="round"
      stroke-dasharray="${(a * f).toFixed(1)} ${a.toFixed(1)}" transform="rotate(-90 50 50)"/>
    <text x="50" y="48" text-anchor="middle" font-family="Lora, Georgia, serif" font-size="22" font-weight="600" fill="#3B2A1A">${soni}</text>
    <text x="50" y="66" text-anchor="middle" font-family="Lora, Georgia, serif" font-size="11" fill="#7A6448">/ ${maqsad || "?"}</text></svg>`;
  return s;
}

function rejaMatni(soni, maqsad) {
  const bugun = new Date(toshkentSana() + "T00:00:00Z");
  const yilBoshi = Date.UTC(bugun.getUTCFullYear(), 0, 1), yilOxiri = Date.UTC(bugun.getUTCFullYear() + 1, 0, 1);
  const kutilgan = Math.floor(maqsad * ((bugun - yilBoshi) / 86400000 + 1) / ((yilOxiri - yilBoshi) / 86400000));
  if (soni >= maqsad) return "🎉 Maqsadga yetdingiz! Barakalla!";
  const farq = soni - kutilgan;
  if (farq > 0) return `Rejadan ${farq} kitob oldindasiz 👏`;
  if (farq === 0) return "Rejaga mos ketyapsiz.";
  return `Rejadan ${-farq} kitob ortdasiz — hali ulgurasiz!`;
}

async function javonMalumoti(m, profilId) {
  const yil = joriyYil();
  const [{ data: kitoblar }, { data: maqsad }] = await Promise.all([
    m.from("kitob_javoni").select("id,kitob,muallif,holat,foiz,baho,sharh,boshlangan,tugatilgan,qoshilgan,fayl_yoli,fayl_nomi,fayl_hajmi,fayl_turi,muqova,sahifalar,sahifa").eq("profil_id", profilId).order("qoshilgan", { ascending: false }),
    m.from("yillik_maqsad").select("maqsad").eq("profil_id", profilId).eq("yil", yil).maybeSingle(),
  ]);
  const royxat = kitoblar || [];
  const yildaOqilgan = royxat.filter((k) => k.holat === "oqidim" && k.tugatilgan && k.tugatilgan.startsWith(String(yil))).length;
  return { kitoblar: royxat, maqsad: maqsad ? maqsad.maqsad : null, yil, yildaOqilgan };
}

// ---------- #javon ----------
async function javonChiz() {
  const s = $("javonSahifa");
  s.innerHTML = "";
  s.appendChild(yarat("h2", "sahifa-sarlavha", "Kitob javonim"));
  const m = await profilniTekshir(s);
  if (!m) return;
  let d;
  try { d = await javonMalumoti(m, mening.id); } catch (e) { s.appendChild(yarat("p", "bosh-holat", "Javonni yuklab bo'lmadi.")); return; }

  // Kunlik o'qish seriyasi va maqsad
  if (typeof seriyaKartasi === "function") s.appendChild(seriyaKartasi(m));
  // Yillik challenge
  const ch = yarat("div", "challenge-quti");
  if (d.maqsad) {
    ch.appendChild(challengeHalqa(d.yildaOqilgan, d.maqsad, 104));
    const matn = yarat("div", "challenge-matn");
    matn.append(yarat("small", "", `${d.yil}-yil challenge`), yarat("b", "", `${d.yildaOqilgan} / ${d.maqsad} kitob`), yarat("span", "", rejaMatni(d.yildaOqilgan, d.maqsad)));
    const oz = yarat("button", "matn-tugma", "maqsadni o'zgartirish"); oz.type = "button";
    oz.addEventListener("click", () => maqsadFormasi(ch, m, d));
    matn.appendChild(oz);
    ch.appendChild(matn);
  } else maqsadFormasi(ch, m, d);
  s.appendChild(ch);

  // Kitob qo'shish
  s.appendChild(kitobQoshishFormasi(m));

  // Javonlar
  const tablar = yarat("div", "manba-tablar javon-tablar");
  Object.keys(JAVONLAR).forEach((k) => {
    const soni = d.kitoblar.filter((x) => x.holat === k).length;
    const b = yarat("button", "manba-tab" + (javonHolati.tab === k ? " faol" : ""), `${JAVONLAR[k]} (${soni})`); b.type = "button";
    b.addEventListener("click", () => { javonHolati.tab = k; javonChiz(); });
    tablar.appendChild(b);
  });
  s.appendChild(tablar);
  const royxat = yarat("div", "royxat");
  const tanlangan = d.kitoblar.filter((k) => k.holat === javonHolati.tab);
  if (javonHolati.tab === "oqidim") tanlangan.sort((a, b) => (b.tugatilgan || "").localeCompare(a.tugatilgan || ""));
  if (!tanlangan.length) royxat.appendChild(yarat("p", "bosh-holat", {
    oqiyapman: "Hozir hech narsa o'qimayapsizmi? Yuqorida kitob qo'shing.",
    oqidim: "O'qilgan kitoblar shu yerda to'planadi.",
    oqimoqchi: "O'qimoqchi bo'lgan kitoblaringizni qo'shib qo'ying — unutib qo'ymaysiz.",
  }[javonHolati.tab]));
  tanlangan.forEach((k) => royxat.appendChild(kitobKartasi(m, k)));
  s.appendChild(royxat);
}

function maqsadFormasi(ch, m, d) {
  ch.innerHTML = "";
  const matn = yarat("div", "challenge-matn");
  matn.append(yarat("b", "", `🎯 ${d.yil}-yilda nechta kitob o'qiysiz?`), yarat("span", "", "Maqsad qo'ying — yil davomida jarayoningizni kuzatib boramiz."));
  const q = yarat("div", "profil-forma");
  const kirit = yarat("input"); kirit.type = "number"; kirit.min = 1; kirit.max = 365; kirit.value = d.maqsad || 12; kirit.inputMode = "numeric";
  const saqla = yarat("button", "kichik", "Saqlash"); saqla.type = "button";
  saqla.addEventListener("click", async () => {
    const n = Math.round(Number(kirit.value));
    if (!(n >= 1 && n <= 365)) { kirit.focus(); return; }
    saqla.disabled = true;
    const { error } = await m.from("yillik_maqsad").upsert({ profil_id: mening.id, yil: d.yil, maqsad: n }, { onConflict: "profil_id,yil" });
    if (error) { saqla.disabled = false; return; }
    javonChiz();
  });
  q.append(kirit, saqla);
  matn.appendChild(q);
  ch.appendChild(matn);
}

// Rasm tanlash: yashirin input; rasm kichraytirilib (≈240px JPEG) qaytariladi
function rasmTanlagich(tayyor, xato) {
  const k = yarat("input"); k.type = "file"; k.accept = "image/*"; k.className = "yashirin";
  k.addEventListener("change", async () => {
    const f = k.files[0]; k.value = "";
    if (!f) return;
    if (!/^image\//.test(f.type) && !/\.(jpe?g|png|webp|gif|bmp|avif)$/i.test(f.name)) { xato("Rasm faylini tanlang (JPG, PNG, WEBP)."); return; }
    if (f.size > 20 * 1024 * 1024) { xato("Rasm juda katta (20 MB gacha)."); return; }
    const mq = await rasmniKichrayt(f).catch(() => null);
    if (mq) tayyor(mq); else xato("Bu rasmni ochib bo'lmadi — JPG yoki PNG tanlang.");
  });
  return k;
}

function kitobQoshishFormasi(m) {
  const quti = yarat("details", "kitob-qoshish");
  quti.appendChild(yarat("summary", "", "+ Kitob qo'shish"));
  const ichi = yarat("div", "karta-sozlama");
  const kitob = yarat("input", "matn-maydon bir-qator"); kitob.placeholder = "Kitob nomi"; kitob.maxLength = 120; kitob.setAttribute("list", "kitoblarRoyxati");
  const royxat = yarat("datalist"); royxat.id = "kitoblarRoyxati";
  KITOBLAR.forEach((k) => { const o = yarat("option"); o.value = k.nom; royxat.appendChild(o); });
  const muallif = yarat("input", "matn-maydon bir-qator"); muallif.placeholder = "Muallifi (ixtiyoriy)"; muallif.maxLength = 60;
  kitob.addEventListener("change", () => { const k = KITOBLAR.find((x) => x.nom === kitob.value.trim()); if (k && !muallif.value) muallif.value = k.muallif; });
  const sahifaMaydon = yarat("input", "matn-maydon bir-qator"); sahifaMaydon.type = "number"; sahifaMaydon.min = 1; sahifaMaydon.max = 20000;
  sahifaMaydon.inputMode = "numeric"; sahifaMaydon.placeholder = "Sahifalar soni (ixtiyoriy)";
  const faylQuti = yarat("label", "fayl-tanlash");
  const fayl = yarat("input"); fayl.type = "file";
  const faylMatn = yarat("span", "", "📎 Kitob fayli (ixtiyoriy) — PDF, EPUB, FB2, TXT, audio va boshqa formatlar, 50 MB gacha");
  faylQuti.append(fayl, faylMatn);
  // Muqova: fayldan avtomatik olinadi yoki foydalanuvchi o'zi rasm tanlaydi
  let muqova = null, muqManba = "";
  const muqQuti = yarat("div", "muqova-korinish");
  const muqKirit = rasmTanlagich(async (mq) => { muqova = mq; muqManba = "o'zim"; muqChiz(); }, (x) => { muqXabar = x; muqChiz(); });
  let muqXabar = "";
  const muqChiz = () => {
    muqQuti.innerHTML = "";
    const t = yarat("div", "");
    const tanla = yarat("button", "matn-tugma", muqova ? "boshqa rasm tanlash" : "🖼 Muqova rasmini yuklash (ixtiyoriy)"); tanla.type = "button";
    tanla.addEventListener("click", () => muqKirit.click());
    if (muqova) {
      const ol = yarat("button", "matn-tugma", "muqovani olib tashlash"); ol.type = "button";
      ol.addEventListener("click", () => { muqova = null; muqManba = "olindi"; muqChiz(); });
      t.append(yarat("small", "", muqManba === "fayl" ? "Muqova fayldan olindi ✓" : "Muqova tanlandi ✓"), tanla, ol);
      muqQuti.appendChild(muqovaEl(kitob.value || "Kitob", false, muqova));
    } else t.appendChild(tanla);
    if (muqXabar) t.appendChild(yarat("small", "", muqXabar));
    muqQuti.append(t, muqKirit);
    muqXabar = "";
  };
  muqChiz();
  // Fayl tanlanganda — nomi va muallifini fayl ichidan aniqlab, bo'sh (yoki avval o'zimiz to'ldirgan) maydonlarga yozamiz
  let avtoKitob = "", avtoMuallif = "", avtoSahifa = "";
  fayl.addEventListener("change", async () => {
    const f = fayl.files[0];
    if (!f) return;
    faylMatn.textContent = `📎 ${f.name} · ${hajmMatni(f.size)} — ma'lumotlar aniqlanmoqda…`;
    const ozimTanlagan = muqManba === "o'zim" || muqManba === "olindi";
    const [d, mq] = await Promise.all([faylMalumoti(f), ozimTanlagan ? null : faylMuqovasi(f)]);
    if (fayl.files[0] !== f) return;
    if (!ozimTanlagan && mq) { muqova = mq; muqManba = "fayl"; muqChiz(); }
    if (!kitob.value.trim() || kitob.value === avtoKitob) { kitob.value = d.kitob; avtoKitob = d.kitob; }
    if (!muallif.value.trim() || muallif.value === avtoMuallif) { muallif.value = d.muallif; avtoMuallif = d.muallif; }
    if (d.sahifalar && (!sahifaMaydon.value || sahifaMaydon.value === avtoSahifa)) { sahifaMaydon.value = avtoSahifa = String(d.sahifalar); }
    faylMatn.textContent = `📎 ${f.name} · ${hajmMatni(f.size)}` +
      (d.manba === "fayl" ? " — nomi va muallifi fayldan olindi ✓" : " — fayl nomidan to'ldirildi, tekshirib ko'ring") +
      (d.sahifalar ? ` · ${d.sahifalar} sahifa hisoblandi` : "");
  });
  const holat = yarat("select", "tanlash");
  Object.entries(JAVONLAR).forEach(([k, v]) => { const o = yarat("option", "", v); o.value = k; o.selected = k === javonHolati.tab; holat.appendChild(o); });
  const tugma = yarat("button", "asosiy", "Javonga qo'yish"); tugma.type = "button";
  const xabar = yarat("p", "kichik-matn");
  tugma.addEventListener("click", async () => {
    const nom = kitob.value.trim();
    if (!nom) { kitob.focus(); return; }
    const f = fayl.files[0];
    if (f && f.size > FAYL_CHEGARA) { xabar.textContent = "Fayl 50 MB dan katta — kichikroq faylni tanlang."; return; }
    tugma.disabled = true;
    const bugun = toshkentSana(), h = holat.value;
    const jami = Math.round(Number(sahifaMaydon.value)) || null;
    if (jami && (jami < 1 || jami > 20000)) { xabar.textContent = "Sahifalar soni 1 dan 20 000 gacha bo'lsin."; sahifaMaydon.focus(); tugma.disabled = false; return; }
    const { data: yangi, error } = await m.from("kitob_javoni").insert({
      profil_id: mening.id, kitob: nom, muallif: muallif.value.trim() || null, holat: h, muqova: muqova || null,
      foiz: h === "oqidim" ? 100 : 0, sahifalar: jami, sahifa: jami ? (h === "oqidim" ? jami : 0) : null, boshlangan: h !== "oqimoqchi" ? bugun : null, tugatilgan: h === "oqidim" ? bugun : null,
    }).select("id").single();
    if (error) { tugma.disabled = false; xabar.textContent = error.code === "23505" ? "Bu kitob javoningizda allaqachon bor." : "Qo'shib bo'lmadi."; return; }
    if (f) {
      xabar.textContent = "Fayl yuklanmoqda…";
      try { await faylniBiriktir(m, { id: yangi.id, muqova: muqova || (muqManba === "olindi" ? "yoq" : null), sahifalar: jami }, f); }
      catch (e) { tugma.disabled = false; xabar.textContent = "Kitob qo'shildi, lekin: " + faylXatosi(e); javonHolati.tab = h; setTimeout(javonChiz, 2500); return; }
    }
    tugma.disabled = false;
    javonHolati.tab = h;
    javonChiz();
  });
  ichi.append(kitob, royxat, muallif, sahifaMaydon, faylQuti, muqQuti, holat, tugma, xabar,
    yarat("p", "kichik-matn", "Fayllar faqat sizga ko'rinadi. Mualliflik huquqi bilan himoyalangan kitoblarni boshqalarga tarqatmang."));
  quti.appendChild(ichi);
  return quti;
}

function kitobKartasi(m, k) {
  const karta = yarat("article", "kitob-karta");
  // Muqova ustiga bosib — o'zi rasm tanlaydi
  const muqTugma = yarat("button", "muqova-tugma"); muqTugma.type = "button";
  muqTugma.title = "Muqovani o'zgartirish"; muqTugma.setAttribute("aria-label", "Muqovani o'zgartirish");
  const muqKirit = rasmTanlagich(async (mq) => {
    const { error } = await m.from("kitob_javoni").update({ muqova: mq }).eq("id", k.id);
    if (error) alert("Muqovani saqlab bo'lmadi."); else javonChiz();
  }, (x) => alert(x));
  muqTugma.append(muqovaEl(k.kitob, false, k.muqova), yarat("span", "muqova-qalam", "✎"));
  muqTugma.addEventListener("click", () => muqKirit.click());
  karta.append(muqTugma, muqKirit);
  const ong = yarat("div", "kitob-ong");
  ong.append(yarat("b", "kitob-nomi", k.kitob), yarat("span", "kichik-matn", k.muallif || ""));
  const yangila = async (q) => { await m.from("kitob_javoni").update(q).eq("id", k.id); javonChiz(); };
  const bugun = toshkentSana();

  if (k.holat === "oqiyapman") {
    // Sahifalar soni ma'lum bo'lsa — surgich sahifa bo'yicha, bo'lmasa foiz bo'yicha
    const S = k.sahifalar;
    const q = yarat("div", "surgich-qator");
    const sur = yarat("input", "surgich"); sur.type = "range"; sur.min = 0;
    if (S) { sur.max = S; sur.step = 1; sur.value = k.sahifa != null ? Math.min(k.sahifa, S) : Math.round((k.foiz / 100) * S); }
    else { sur.max = 100; sur.step = 1; sur.value = k.foiz; }
    sur.setAttribute("aria-label", S ? "Qaysi sahifadasiz" : "Necha foiz o'qildi");
    const fm = yarat("span", "foiz-matn kichik");
    // Qo'lda kiritish: sahifa raqami va foiz — biri o'zgarsa, ikkinchisi ham yangilanadi
    const raqam = (max, belgi) => {
      const i = yarat("input", "progress-son"); i.type = "number"; i.min = 0; i.max = max; i.step = 1;
      i.inputMode = "numeric"; i.setAttribute("aria-label", belgi); return i;
    };
    const kirit = yarat("div", "progress-kirit kichik-matn");
    const foizI = raqam(100, "Necha foiz o'qildi");
    const sahifaI = S ? raqam(S, "Qaysi sahifadasiz") : null;
    const jamiI = S ? null : raqam(20000, "Kitobda necha sahifa bor");
    const guruh = (...b) => { const g = yarat("span", "progress-guruh"); g.append(...b); return g; };
    const foizG = guruh(foizI, " %");
    if (S) kirit.append(guruh("📖 ", sahifaI, ` / ${S} sahifa`), yarat("span", "progress-ayir", "·"), foizG);
    else { jamiI.min = 1; jamiI.placeholder = "?"; kirit.append(foizG, yarat("span", "progress-ayir", "·"), guruh("Jami sahifa: ", jamiI)); }
    const qiymat = () => { const v = Number(sur.value); return S ? { sahifa: v, foiz: Math.min(100, Math.round((v / S) * 100)) } : { foiz: v }; };
    const korsat = (tashqari) => {
      const x = qiymat(); fm.textContent = x.foiz + "%";
      if (tashqari !== foizI) foizI.value = x.foiz;
      if (S && tashqari !== sahifaI) sahifaI.value = x.sahifa;
    };
    korsat();
    let kech = null;
    const saqla = () => { clearTimeout(kech); kech = setTimeout(() => { const x = qiymat(); Object.assign(k, x); m.from("kitob_javoni").update(x).eq("id", k.id).then(() => {}); }, 600); };
    const tugatish = () => { javonHolati.tab = "oqidim"; yangila({ holat: "oqidim", foiz: 100, tugatilgan: bugun, ...(S ? { sahifa: S } : {}) }); };
    sur.addEventListener("input", () => { korsat(); saqla(); });
    const sonOl = (i, max) => { const n = Math.round(Number(i.value)); return i.value === "" || !Number.isFinite(n) ? null : Math.max(0, Math.min(max, n)); };
    if (S) sahifaI.addEventListener("input", () => { const n = sonOl(sahifaI, S); if (n === null) return; sur.value = n; korsat(sahifaI); saqla(); });
    foizI.addEventListener("input", () => {
      const f = sonOl(foizI, 100); if (f === null) return;
      sur.value = S ? Math.round((f / 100) * S) : f; korsat(foizI); saqla();
    });
    // 100% yoki oxirgi sahifa kiritilsa — tugatishni taklif qilamiz
    const oxirmi = () => { if (qiymat().foiz >= 100 && confirm("Kitobni tugatdingizmi?")) tugatish(); };
    [foizI, sahifaI].filter(Boolean).forEach((i) => i.addEventListener("change", () => { korsat(); oxirmi(); }));
    if (jamiI) jamiI.addEventListener("change", () => {
      const n = Math.round(Number(jamiI.value));
      if (!(n >= 1 && n <= 20000)) { jamiI.value = ""; return; }
      yangila({ sahifalar: n, sahifa: Math.round((Number(sur.value) / 100) * n) });
    });
    q.append(sur);
    const tugat = yarat("button", "amal tanlangan", "✓ Tugatdim"); tugat.type = "button";
    tugat.addEventListener("click", tugatish);
    ong.append(q, kirit, tugat);
  } else if (k.holat === "oqimoqchi") {
    const bosh = yarat("button", "amal tanlangan", "O'qishni boshlash"); bosh.type = "button";
    bosh.addEventListener("click", () => { javonHolati.tab = "oqiyapman"; yangila({ holat: "oqiyapman", boshlangan: bugun }); });
    ong.appendChild(bosh);
  } else {
    ong.appendChild(yulduzlarEl(k.baho, (n) => yangila({ baho: n })));
    if (k.tugatilgan || k.sahifalar) ong.appendChild(yarat("span", "kichik-matn",
      [k.tugatilgan ? "O'qildi: " + new Date(k.tugatilgan).toLocaleDateString("uz") : "", k.sahifalar ? k.sahifalar + " sahifa" : ""].filter(Boolean).join(" · ")));
    if (k.sharh) ong.appendChild(yarat("p", "kitob-sharh", "«" + k.sharh + "»"));
    const sharhTugma = yarat("button", "matn-tugma", k.sharh ? "sharhni tahrirlash" : "sharh yozish"); sharhTugma.type = "button";
    sharhTugma.addEventListener("click", () => {
      const t = yarat("textarea", "matn-maydon"); t.rows = 3; t.maxLength = 500; t.value = k.sharh || ""; t.placeholder = "Kitob haqida fikringiz…";
      const sq = yarat("button", "kichik", "Saqlash"); sq.type = "button";
      sq.addEventListener("click", () => yangila({ sharh: t.value.trim() || null }));
      sharhTugma.replaceWith(t, sq); t.focus();
    });
    ong.appendChild(sharhTugma);
  }
  ong.appendChild(faylQatori(m, k, javonChiz));
  if (k.muqova) {
    const muqOl = yarat("button", "matn-tugma", "muqovani olib tashlash"); muqOl.type = "button";
    muqOl.addEventListener("click", async () => { await m.from("kitob_javoni").update({ muqova: null }).eq("id", k.id); javonChiz(); });
    ong.appendChild(muqOl);
  }
  ong.appendChild(havola("#birga/yangi/kitob-" + k.id, "matn-tugma birga-havola",
    k.fayl_yoli && faylTuri(k.fayl_nomi || k.fayl_yoli) !== "yuklab" ? "👥 Kitobdoshlar bilan birga o'qish (fayl bilan)" : "👥 Kitobdoshlar bilan birga o'qish"));
  const ochir = yarat("button", "kitob-ochir", "×"); ochir.type = "button"; ochir.setAttribute("aria-label", "Javondan olib tashlash");
  ochir.addEventListener("click", async () => {
    if (!confirm(`«${k.kitob}»ni javondan olib tashlaysizmi?` + (k.fayl_yoli ? " Biriktirilgan fayl ham o'chiriladi." : ""))) return;
    if (k.fayl_yoli) await m.storage.from("kitoblar").remove([k.fayl_yoli]);
    await m.from("kitob_javoni").delete().eq("id", k.id); javonChiz();
  });
  karta.append(ong, ochir);
  return karta;
}

// ---------- Profil sahifasidagi qisqa ko'rinish ----------
function javonQismi(profil, ozimniki) {
  const quti = yarat("div", "javon-qism");
  if (!BAZA_YOQIQ) return quti;
  (async () => {
    try {
      const m = await mijozOl();
      const d = await javonMalumoti(m, profil.id);
      if (!d.kitoblar.length && !d.maqsad) {
        if (ozimniki) { quti.append(yarat("b", "", "📚 Kitob javoni"), havola("#javon", "matn-tugma", "Javoningizni to'ldiring va yillik maqsad qo'ying →")); }
        return;
      }
      quti.appendChild(yarat("b", "", "📚 Kitob javoni"));
      if (d.maqsad) {
        const ch = yarat("div", "challenge-quti kichik");
        ch.appendChild(challengeHalqa(d.yildaOqilgan, d.maqsad, 64));
        const t = yarat("div", "challenge-matn");
        t.append(yarat("small", "", `${d.yil}-yil challenge`), yarat("b", "", `${d.yildaOqilgan} / ${d.maqsad} kitob`));
        ch.appendChild(t);
        quti.appendChild(ch);
      }
      const oqiyapti = d.kitoblar.filter((k) => k.holat === "oqiyapman").slice(0, 3);
      if (oqiyapti.length) {
        quti.appendChild(yarat("small", "javon-sarlavha", "Hozir o'qiyapti"));
        oqiyapti.forEach((k) => {
          const q = yarat("div", "javon-qator"); q.appendChild(muqovaEl(k.kitob, true, k.muqova));
          const t = yarat("div", ""); t.append(yarat("b", "", k.kitob), yarat("span", "kichik-matn", (k.muallif ? k.muallif + " · " : "") + (k.sahifalar && k.sahifa != null ? `${k.sahifa}/${k.sahifalar} sahifa · ` : "") + k.foiz + "%"));
          q.appendChild(t); quti.appendChild(q);
        });
      }
      const oqigan = d.kitoblar.filter((k) => k.holat === "oqidim").sort((a, b) => (b.tugatilgan || "").localeCompare(a.tugatilgan || "")).slice(0, 4);
      if (oqigan.length) {
        quti.appendChild(yarat("small", "javon-sarlavha", `O'qigan kitoblari (${d.kitoblar.filter((k) => k.holat === "oqidim").length})`));
        oqigan.forEach((k) => {
          const q = yarat("div", "javon-qator"); q.appendChild(muqovaEl(k.kitob, true, k.muqova));
          const t = yarat("div", ""); t.append(yarat("b", "", k.kitob));
          if (k.baho) t.appendChild(yulduzlarEl(k.baho));
          if (k.sharh) t.appendChild(yarat("span", "kichik-matn", "«" + k.sharh.slice(0, 90) + (k.sharh.length > 90 ? "…" : "") + "»"));
          q.appendChild(t); quti.appendChild(q);
        });
      }
      if (ozimniki) quti.appendChild(havola("#javon", "matn-tugma", "Javonni boshqarish →"));
    } catch (e) { /* jim */ }
  })();
  return quti;
}

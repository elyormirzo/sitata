// ===== KITOBDOSHLAR IQTIBOSLARI =====
// Lentaning «👥 Kitobdoshlar» bo'limi: o'qiyotgan kitobingizdan iqtibos joylaysiz — uni faqat kitobdoshlaringiz ko'radi va yoqtiradi.
// Manzil: #lenta/kitobdoshlar. Baza: kitob_iqtiboslari, iqtibos_yoqtirishlar, iqtibos_statistikasi(p) — supabase/iqtiboslar.sql

async function kitobdoshIqtiboslariniChiz(s) {
  const m = await profilniTekshir(s);
  if (!m) return;
  const forma = iqtibosJoylashFormasi(m, s);
  s.appendChild(forma);
  if (typeof lentaFormaniOch !== "undefined" && lentaFormaniOch) {
    lentaFormaniOch = false; forma.open = true;
    setTimeout(() => { forma.scrollIntoView({ block: "start" }); const t = forma.querySelector("textarea"); if (t) t.focus({ preventScroll: true }); }, 50);
  }
  const royxat = yarat("div", "postlar");
  royxat.appendChild(yarat("p", "bosh-holat", "Yuklanmoqda…"));
  s.appendChild(royxat);

  const [{ data: iqtiboslar, error }, { data: dostlar }] = await Promise.all([
    m.from("kitob_iqtiboslari").select("id,profil_id,manba_turi,kitob,muallif,matn,sahifa,yoqtirishlar,vaqt,rasm_yoli").order("vaqt", { ascending: false }).limit(60),
    m.from("kitobdoshlar").select("id").eq("holat", "qabul").limit(1),
  ]);
  royxat.innerHTML = "";
  if (error) { royxat.appendChild(yarat("p", "bosh-holat", "Iqtiboslarni yuklab bo'lmadi.")); return; }
  if (!iqtiboslar.length) {
    const q = yarat("div", "vik-quti markaz");
    q.appendChild(yarat("p", "", dostlar && dostlar.length
      ? "Hali iqtibos yo'q. O'qiyotgan kitobingizdan birinchi iqtibosni siz joylang!"
      : "Bu yerda kitobdoshlaringiz o'qiyotgan kitoblaridan joylagan iqtiboslar chiqadi."));
    if (!dostlar || !dostlar.length) q.appendChild(havola("#kitobdoshlar", "asosiy", "Kitobdosh qo'shish"));
    royxat.appendChild(q);
    return;
  }
  const idlar = iqtiboslar.map((i) => i.id);
  const [profillar, { data: yoqtirganlarim }] = await Promise.all([
    profillarniOl(m, iqtiboslar.map((i) => i.profil_id)),
    m.from("iqtibos_yoqtirishlar").select("iqtibos_id").eq("profil_id", mening.id).in("iqtibos_id", idlar),
  ]);
  const yoqqan = new Set((yoqtirganlarim || []).map((y) => y.iqtibos_id));
  // Rasmlar maxfiy — ko'rish uchun vaqtinchalik havolalar (RLS: egasi va kitobdoshlari)
  const rasmYollari = iqtiboslar.filter((i) => i.rasm_yoli).map((i) => i.rasm_yoli);
  const havolalar = {};
  if (rasmYollari.length) {
    const { data } = await m.storage.from("iqtibos-rasmlar").createSignedUrls(rasmYollari, 3600);
    (data || []).forEach((d) => { if (d.signedUrl) havolalar[d.path] = d.signedUrl; });
  }
  iqtiboslar.forEach((iq) => royxat.appendChild(kitobdoshIqtibosKartasi(m, iq, profillar[iq.profil_id], yoqqan.has(iq.id), havolalar[iq.rasm_yoli])));
}

function iqtibosJoylashFormasi(m, s) {
  const quti = yarat("details", "kitob-qoshish iqtibos-joylash");
  // Yig'ilgan holda — X dagi «Nima yangilik?» qatori kabi: rasm + taklif matni
  const sarlavha = yarat("summary", "iqtibos-yozish");
  if (typeof avatarEl === "function") sarlavha.appendChild(avatarEl(mening, 40, "kichik"));
  sarlavha.append(yarat("span", "", "Qaysi jumla yoqdi? Iqtibos joylang…"), yarat("b", "", "Joylash"));
  quti.appendChild(sarlavha);
  const ichi = yarat("div", "karta-sozlama");
  // Manba turi: kitob, ko'chadagi yozuv, o'zi yozgan fikr yoki boshqa (film, qo'shiq, sayt…)
  let tur = "kitob";
  const turlar = yarat("div", "filtrlar iqtibos-turlari");
  const turTugmalari = IQTIBOS_TURLARI.map(([k, nom]) => {
    const b = yarat("button", "filtr" + (k === tur ? " faol" : ""), nom); b.type = "button";
    b.addEventListener("click", () => { tur = k; turgaQarab(); });
    turlar.appendChild(b); return [k, b];
  });
  const tanlov = yarat("select", "tanlash");
  const kitob = yarat("input", "matn-maydon bir-qator yashirin"); kitob.placeholder = "Kitob nomi"; kitob.maxLength = 120;
  const muallif = yarat("input", "matn-maydon bir-qator yashirin"); muallif.placeholder = "Muallifi (ixtiyoriy)"; muallif.maxLength = 60;
  const matn = yarat("textarea", "matn-maydon"); matn.rows = 4; matn.maxLength = 600; matn.placeholder = "Kitobdagi sizga yoqqan jumla…";
  // Sahifa surati: suratga olish yoki galereyadan → qirqish, belgilash, bezash
  let rasmBlob = null, asliFayl = null, rasmUrl = null;
  const rasmQuti = yarat("div", "iqtibos-rasm-quti");
  const kamera = yarat("input"); kamera.type = "file"; kamera.accept = "image/*"; kamera.setAttribute("capture", "environment"); kamera.className = "yashirin";
  const galereya = yarat("input"); galereya.type = "file"; galereya.accept = "image/*"; galereya.className = "yashirin";
  // Tanlangan manba bo'yicha qiymatlar
  const qiymatlar = () => {
    const k = tur === "kitob" ? kitoblar.find((x) => String(x.id) === tanlov.value) : null;
    if (tur === "kitob") return { k, nom: k ? k.kitob : kitob.value.trim(), mu: k ? k.muallif : muallif.value.trim(), sah: sahifa.value };
    if (tur === "ozim") return { nom: "", mu: "", sah: "" };
    return { nom: kitob.value.trim(), mu: tur === "boshqa" ? muallif.value.trim() : "", sah: "" };
  };
  function matnYozuvi() {
    matn.placeholder = rasmBlob ? "Izoh yoki iqtibos matni (ixtiyoriy)"
      : { kitob: "Kitobdagi sizga yoqqan jumla…", kocha: "Devor, peshtaxta yoki e'londagi yozuv…", ozim: "O'z fikringiz, hikmatli so'zingiz…", boshqa: "Iqtibos matni…" }[tur];
  }
  const sarlavhaOl = () => manbaMatni({ manba_turi: tur, kitob: qiymatlar().nom, muallif: qiymatlar().mu, sahifa: qiymatlar().sah || null }, mening.ism, true);
  const tahrirla = async (f) => {
    if (!f) return;
    const b = await rasmTahrirchisi(f, { sarlavha: sarlavhaOl() });
    if (!b) return;
    asliFayl = f; rasmBlob = b; rasmniKorsat();
  };
  const rasmniKorsat = () => {
    rasmQuti.innerHTML = "";
    if (rasmUrl) { URL.revokeObjectURL(rasmUrl); rasmUrl = null; }
    if (rasmBlob) {
      rasmUrl = URL.createObjectURL(rasmBlob);
      const img = yarat("img", "iqtibos-rasm-oldin"); img.src = rasmUrl; img.alt = "Iqtibos rasmi";
      const qayta = yarat("button", "matn-tugma", "✎ qayta tahrirlash"); qayta.type = "button";
      qayta.addEventListener("click", () => tahrirla(asliFayl));
      const ol = yarat("button", "matn-tugma", "rasmni olib tashlash"); ol.type = "button";
      ol.addEventListener("click", () => { rasmBlob = asliFayl = null; rasmniKorsat(); });
      const t = yarat("div", ""); t.append(qayta, ol);
      rasmQuti.append(img, t);
      matnYozuvi();
    } else {
      const b1 = yarat("button", "amal", "📷 Suratga olish"); b1.type = "button"; b1.addEventListener("click", () => kamera.click());
      const b2 = yarat("button", "amal", "🖼 Galereyadan"); b2.type = "button"; b2.addEventListener("click", () => galereya.click());
      const t = yarat("div", "tugmalar"); t.append(b1, b2);
      rasmQuti.append(yarat("small", "kichik-matn", "Kitob sahifasi yoki ko'chadagi yozuvni rasmga tushirib, kerakli qismini qirqing va belgilang:"), t);
      matnYozuvi();
    }
    rasmQuti.append(kamera, galereya);
  };
  [kamera, galereya].forEach((i) => i.addEventListener("change", () => { const f = i.files[0]; i.value = ""; tahrirla(f); }));
  rasmniKorsat();
  const sahifa = yarat("input", "matn-maydon bir-qator"); sahifa.type = "number"; sahifa.min = 0; sahifa.max = 20000; sahifa.inputMode = "numeric"; sahifa.placeholder = "Sahifa (ixtiyoriy)";
  const hisob = yarat("small", "kichik-matn", "0 / 600");
  const tugma = yarat("button", "asosiy", "Joylash"); tugma.type = "button";
  const xabar = yarat("p", "kichik-matn");
  let kitoblar = [];

  const turgaQarab = () => {
    turTugmalari.forEach(([k, b]) => b.classList.toggle("faol", k === tur));
    tanlov.classList.toggle("yashirin", tur !== "kitob");
    sahifa.classList.toggle("yashirin", tur !== "kitob");
    kitob.placeholder = { kitob: "Kitob nomi", kocha: "Qayerda ko'rdingiz? (ixtiyoriy, masalan: Chorsu, avtobus bekati)", boshqa: "Manba: film, qo'shiq, sayt, suhbat… (ixtiyoriy)" }[tur] || "";
    matnYozuvi();
    tanlovgaQarab();
  };
  const tanlovgaQarab = () => {
    const boshqa = tur === "kitob" ? tanlov.value === "boshqa" : tur !== "ozim";
    kitob.classList.toggle("yashirin", !boshqa); muallif.classList.toggle("yashirin", !(tur === "kitob" ? boshqa : tur === "boshqa"));
    const k = kitoblar.find((x) => String(x.id) === tanlov.value);
    if (k && k.sahifa != null && !sahifa.dataset.qolda) sahifa.value = k.sahifa;
  };
  tanlov.addEventListener("change", tanlovgaQarab);
  sahifa.addEventListener("input", () => { sahifa.dataset.qolda = "1"; });
  matn.addEventListener("input", () => { hisob.textContent = `${matn.value.length} / 600`; });

  // Javondagi kitoblar: avval o'qiyotganlari, keyin qolganlari
  quti.addEventListener("toggle", async () => {
    if (!quti.open || kitoblar.length || tanlov.options.length) return;
    const { data } = await m.from("kitob_javoni").select("id,kitob,muallif,holat,sahifa").eq("profil_id", mening.id).order("yangilangan", { ascending: false });
    const tartib = { oqiyapman: 0, oqidim: 1, oqimoqchi: 2 };
    kitoblar = (data || []).sort((a, b) => tartib[a.holat] - tartib[b.holat]);
    const guruh = (nom, holat) => {
      const g = yarat("optgroup"); g.label = nom;
      kitoblar.filter((k) => k.holat === holat).forEach((k) => { const o = yarat("option", "", k.kitob + (k.muallif ? " — " + k.muallif : "")); o.value = k.id; g.appendChild(o); });
      if (g.children.length) tanlov.appendChild(g);
    };
    guruh("O'qiyapman", "oqiyapman"); guruh("O'qiganlarim", "oqidim"); guruh("O'qimoqchiman", "oqimoqchi");
    const o = yarat("option", "", "Boshqa kitob (javonimda yo'q)…"); o.value = "boshqa"; tanlov.appendChild(o);
    tanlovgaQarab();
  });

  tugma.addEventListener("click", async () => {
    const t = matn.value.trim();
    if (!rasmBlob && t.length < 3) { matn.focus(); xabar.textContent = "Iqtibos matnini yozing yoki rasmga tushiring."; return; }
    const { k, nom, mu, sah } = qiymatlar();
    if (tur === "kitob" && !nom) { kitob.focus(); xabar.textContent = "Kitob nomini yozing."; return; }
    const sv = sah === "" ? null : Math.round(Number(sah));
    tugma.disabled = true; xabar.textContent = "";
    let rasmYoli = null;
    if (rasmBlob) {
      xabar.textContent = "Rasm yuklanmoqda…";
      rasmYoli = `${mening.id}/${crypto.randomUUID()}.jpg`;
      const { error: e1 } = await m.storage.from("iqtibos-rasmlar").upload(rasmYoli, rasmBlob, { contentType: "image/jpeg", upsert: false });
      if (e1) { tugma.disabled = false; xabar.textContent = "Rasm yuklanmadi — internetni tekshirib, qayta urinib ko'ring."; return; }
    }
    const { error } = await m.from("kitob_iqtiboslari").insert({
      manba_turi: tur, kitob_javoni_id: k ? k.id : null, kitob: nom || null, muallif: mu || null,
      matn: t || null, sahifa: Number.isFinite(sv) && sv >= 0 && sv <= 20000 ? sv : null, rasm_yoli: rasmYoli,
    });
    tugma.disabled = false;
    if (error && rasmYoli) m.storage.from("iqtibos-rasmlar").remove([rasmYoli]).then(() => {});
    if (error) { xabar.textContent = /row-level|policy/i.test(error.message || "") ? "Bugun juda ko'p iqtibos joyladingiz — ertaga davom eting." : "Joylab bo'lmadi — qayta urinib ko'ring."; return; }
    lentaniChiz("kitobdoshlar");
  });

  turgaQarab();
  ichi.append(turlar, tanlov, kitob, muallif, rasmQuti, matn, hisob, sahifa, tugma, xabar,
    yarat("p", "kichik-matn", "🔒 Iqtibosingizni faqat kitobdoshlaringiz ko'radi."));
  quti.appendChild(ichi);
  return quti;
}

function kitobdoshIqtibosKartasi(m, iq, p, yoqtirdimmi, rasmUrl) {
  const ism = p && p.ism;
  const ichki = profilIchkiHavola(p);
  const avatar = havola(ichki, "", ""); avatar.setAttribute("aria-label", ism || "Profil");
  if (typeof avatarEl === "function") avatar.appendChild(avatarEl(p, 44, "post-rasm"));
  const bosh = yarat("div", "post-bosh");
  bosh.appendChild(havola(ichki, "post-ism", ism || "Noma'lum"));
  bosh.appendChild(yarat("span", "post-meta", (p && p.taxallus ? "@" + p.taxallus + " · " : "") + vaqtOldin(iq.vaqt)));
  const { k, tana } = postQobigi(avatar, bosh);
  k.classList.add("kitobdosh-iqtibos");

  if (iq.matn) tana.appendChild(yarat("blockquote", "post-matn" + (iq.rasm_yoli ? " rasm-izohi" : ""), iq.matn));
  if (iq.rasm_yoli) {
    const img = yarat("img", "iqtibos-rasm"); img.alt = "Iqtibos rasmi: " + manbaMatni(iq, ism); img.loading = "lazy";
    if (rasmUrl) img.src = rasmUrl;
    img.addEventListener("click", () => rasmniKattaKor(img.src, img.alt));
    tana.appendChild(img);
  }
  tana.appendChild(yarat("p", "post-izoh", manbaMatni(iq, ism)));

  const amallar = yarat("div", "post-amallar");
  const ozimniki = iq.profil_id === mening.id;
  let son = iq.yoqtirishlar, bor = yoqtirdimmi;
  const yurak = postAmal(IKON.yurak, "", ozimniki ? "Yoqtirmalar" : "Yoqtirish", "yurak");
  const chiz = () => {
    yurak.innerHTML = bor ? IKON.yurakTola : IKON.yurak;
    if (son) yurak.appendChild(yarat("span", "", String(son)));
    yurak.classList.toggle("tanlangan", bor);
    yurak.setAttribute("aria-pressed", String(bor));
  };
  chiz();
  if (ozimniki) yurak.disabled = true;
  else yurak.addEventListener("click", async () => {
    yurak.disabled = true;
    const oldin = bor;
    bor = !bor; son += bor ? 1 : -1; chiz();
    const { error } = oldin
      ? await m.from("iqtibos_yoqtirishlar").delete().eq("iqtibos_id", iq.id).eq("profil_id", mening.id)
      : await m.from("iqtibos_yoqtirishlar").insert({ iqtibos_id: iq.id });
    if (error && error.code !== "23505") { bor = oldin; son += bor ? 1 : -1; chiz(); }
    yurak.disabled = false;
  });
  amallar.appendChild(yurak);
  if (iq.matn) amallar.appendChild(nusxaAmali(() => `“${iq.matn || ""}”\n${manbaMatni(iq, ism)}`));
  if (ozimniki) {
    const ochir = postAmal(IKON.ochir, "", "O'chirish", "ochir");
    ochir.addEventListener("click", async () => {
      if (!confirm("Bu iqtibosni o'chirasizmi?")) return;
      await m.from("kitob_iqtiboslari").delete().eq("id", iq.id);
      if (iq.rasm_yoli) await m.storage.from("iqtibos-rasmlar").remove([iq.rasm_yoli]);
      k.remove();
    });
    amallar.appendChild(ochir);
  }
  tana.appendChild(amallar);
  return k;
}

const IQTIBOS_TURLARI = [["kitob", "📖 Kitobdan"], ["kocha", "📍 Ko'chada ko'rdim"], ["ozim", "✍ O'zim yozdim"], ["boshqa", "🎬 Boshqa"]];

// Iqtibos manbasi matni (kartada, nusxada va rasm ramkasida)
function manbaMatni(iq, ism, rasmUchun) {
  const tur = iq.manba_turi || "kitob";
  if (tur === "kitob") {
    if (!iq.kitob) return "";
    return (rasmUchun ? "" : "— ") + "«" + iq.kitob + "»" + (iq.muallif ? (rasmUchun ? " — " : ", ") + iq.muallif : "")
      + (iq.sahifa != null && iq.sahifa !== "" ? (rasmUchun ? `, ${iq.sahifa}-bet` : ` · ${iq.sahifa}-sahifa`) : "");
  }
  if (tur === "kocha") return "📍 Ko'chadagi yozuv" + (iq.kitob ? " · " + iq.kitob : "");
  if (tur === "ozim") return "© " + (ism || "Muallif");   // o'z fikri — mualliflik belgisi bilan: «© Mirzo»
  return (iq.kitob || iq.muallif) ? "— " + [iq.muallif, iq.kitob].filter(Boolean).join(", ") : "";
}

// Rasmni to'liq ekranda ko'rish
function rasmniKattaKor(src, alt) {
  if (!src) return;
  const o = yarat("div", "rasm-katta"); o.setAttribute("role", "dialog"); o.setAttribute("aria-label", alt);
  const img = yarat("img"); img.src = src; img.alt = alt;
  const yop = yarat("button", "oquvchi-yop", "✕"); yop.type = "button"; yop.setAttribute("aria-label", "Yopish");
  o.append(img, yop);
  const ket = () => { o.remove(); document.removeEventListener("keydown", tugma); };
  const tugma = (e) => { if (e.key === "Escape") ket(); };
  o.addEventListener("click", ket); document.addEventListener("keydown", tugma);
  document.body.appendChild(o);
}

// Profil sahifasi: nechta iqtibos yozgan va ularga nechta yoqtirma kelgan

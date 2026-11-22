// ===== KITOBDOSHLAR IQTIBOSLARI =====
// Lentaning «👥 Kitobdoshlar» bo'limi: o'qiyotgan kitobingizdan iqtibos joylaysiz — uni faqat kitobdoshlaringiz ko'radi va yoqtiradi.
// Manzil: #lenta/kitobdoshlar. Baza: kitob_iqtiboslari, iqtibos_yoqtirishlar, iqtibos_statistikasi(p) — supabase/iqtiboslar.sql

async function kitobdoshIqtiboslariniChiz(s) {
  const m = await profilniTekshir(s);
  if (!m) return;
  s.appendChild(iqtibosJoylashFormasi(m, s));
  const royxat = yarat("div", "royxat");
  royxat.appendChild(yarat("p", "bosh-holat", "Yuklanmoqda…"));
  s.appendChild(royxat);

  const [{ data: iqtiboslar, error }, { data: dostlar }] = await Promise.all([
    m.from("kitob_iqtiboslari").select("id,profil_id,kitob,muallif,matn,sahifa,yoqtirishlar,vaqt").order("vaqt", { ascending: false }).limit(60),
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
  iqtiboslar.forEach((iq) => royxat.appendChild(kitobdoshIqtibosKartasi(m, iq, profillar[iq.profil_id], yoqqan.has(iq.id))));
}

function iqtibosJoylashFormasi(m, s) {
  const quti = yarat("details", "kitob-qoshish iqtibos-joylash");
  quti.appendChild(yarat("summary", "", "❝ O'qiyotgan kitobimdan iqtibos joylash"));
  const ichi = yarat("div", "karta-sozlama");
  const tanlov = yarat("select", "tanlash");
  const kitob = yarat("input", "matn-maydon bir-qator yashirin"); kitob.placeholder = "Kitob nomi"; kitob.maxLength = 120;
  const muallif = yarat("input", "matn-maydon bir-qator yashirin"); muallif.placeholder = "Muallifi (ixtiyoriy)"; muallif.maxLength = 60;
  const matn = yarat("textarea", "matn-maydon"); matn.rows = 4; matn.maxLength = 600; matn.placeholder = "Kitobdagi sizga yoqqan jumla…";
  const sahifa = yarat("input", "matn-maydon bir-qator"); sahifa.type = "number"; sahifa.min = 0; sahifa.max = 20000; sahifa.inputMode = "numeric"; sahifa.placeholder = "Sahifa (ixtiyoriy)";
  const hisob = yarat("small", "kichik-matn", "0 / 600");
  const tugma = yarat("button", "asosiy", "Joylash"); tugma.type = "button";
  const xabar = yarat("p", "kichik-matn");
  let kitoblar = [];

  const tanlovgaQarab = () => {
    const boshqa = tanlov.value === "boshqa";
    kitob.classList.toggle("yashirin", !boshqa); muallif.classList.toggle("yashirin", !boshqa);
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
    if (t.length < 3) { matn.focus(); xabar.textContent = "Iqtibos matnini yozing."; return; }
    const k = kitoblar.find((x) => String(x.id) === tanlov.value);
    const nom = k ? k.kitob : kitob.value.trim();
    if (!nom) { kitob.focus(); xabar.textContent = "Kitob nomini yozing."; return; }
    const sv = sahifa.value === "" ? null : Math.round(Number(sahifa.value));
    tugma.disabled = true; xabar.textContent = "";
    const { error } = await m.from("kitob_iqtiboslari").insert({
      kitob_javoni_id: k ? k.id : null, kitob: nom, muallif: (k ? k.muallif : muallif.value.trim()) || null,
      matn: t, sahifa: Number.isFinite(sv) && sv >= 0 && sv <= 20000 ? sv : null,
    });
    tugma.disabled = false;
    if (error) { xabar.textContent = /row-level|policy/i.test(error.message || "") ? "Bugun juda ko'p iqtibos joyladingiz — ertaga davom eting." : "Joylab bo'lmadi — qayta urinib ko'ring."; return; }
    lentaniChiz("kitobdoshlar");
  });

  ichi.append(tanlov, kitob, muallif, matn, hisob, sahifa, tugma, xabar,
    yarat("p", "kichik-matn", "🔒 Iqtibosingizni faqat kitobdoshlaringiz ko'radi."));
  quti.appendChild(ichi);
  return quti;
}

function kitobdoshIqtibosKartasi(m, iq, p, yoqtirdimmi) {
  const k = yarat("article", "iqtibos-karta kitobdosh-iqtibos");
  const bosh = yarat("div", "jarayon-kim");
  bosh.append(profilHavola(p), yarat("small", "", vaqtOldin(iq.vaqt)));
  k.append(bosh, yarat("blockquote", "", iq.matn));
  const manba = yarat("p", "iqtibos-manba", "— «" + iq.kitob + "»" + (iq.muallif ? ", " + iq.muallif : "") + (iq.sahifa != null ? ` · ${iq.sahifa}-sahifa` : ""));
  k.appendChild(manba);

  const amallar = yarat("div", "amallar");
  const ozimniki = iq.profil_id === mening.id;
  let son = iq.yoqtirishlar, bor = yoqtirdimmi;
  const yurak = yarat("button", "amal yoqtirish"); yurak.type = "button";
  const chiz = () => {
    yurak.textContent = (bor ? "♥ " : "♡ ") + (son ? son : "") + (ozimniki ? (son ? " yoqtirma" : "Hali yoqtirma yo'q") : (son ? "" : "Yoqtirish"));
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

  const nusxa = yarat("button", "amal", "Nusxa"); nusxa.type = "button";
  nusxa.addEventListener("click", async () => {
    const ok = await nusxaOl(`“${iq.matn}”\n— ${iq.muallif ? iq.muallif + ", " : ""}«${iq.kitob}»`);
    nusxa.textContent = ok ? "Nusxalandi ✓" : "Nusxa olinmadi";
    setTimeout(() => { nusxa.textContent = "Nusxa"; }, 1500);
  });
  amallar.appendChild(nusxa);
  if (ozimniki) {
    const ochir = yarat("button", "amal", "O'chirish"); ochir.type = "button";
    ochir.addEventListener("click", async () => {
      if (!confirm("Bu iqtibosni o'chirasizmi?")) return;
      await m.from("kitob_iqtiboslari").delete().eq("id", iq.id);
      k.remove();
    });
    amallar.appendChild(ochir);
  }
  k.appendChild(amallar);
  return k;
}

// Profil sahifasi: nechta iqtibos yozgan va ularga nechta yoqtirma kelgan
function iqtibosStatlari(profilId) {
  const q = yarat("div", "statlar iqtibos-statlar yashirin");
  if (!BAZA_YOQIQ) return q;
  (async () => {
    try {
      const m = await mijozOl();
      const { data, error } = await m.rpc("iqtibos_statistikasi", { p: profilId });
      if (error || !data || !data[0]) return;
      const { soni, yoqtirmalar } = data[0];
      [[soni, "❝ iqtibos yozgan"], [yoqtirmalar, "♥ yoqtirma olgan"]].forEach(([n, nom]) => {
        const s = yarat("div", "stat"); s.append(yarat("b", "", String(n)), yarat("span", "", nom)); q.appendChild(s);
      });
      q.classList.remove("yashirin");
    } catch (e) { /* jim */ }
  })();
  return q;
}

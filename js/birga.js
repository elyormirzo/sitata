// ===== KITOBDOSHLAR, «BIRGA O'QIYMIZ» VA BILDIRISHNOMALAR =====
// Manzillar: #kitobdoshlar, #birga, #birga/yangi, #birga/yangi/<kitobdosh-id>, #birga/<o'qish-id>
// Baza: supabase/birga.sql (kitobdoshlar, oqishlar, oqish_azolari, bildirishnomalar)

// ---------- Umumiy ----------
// Profil va kirish kerak bo'lgan sahifalar uchun: profil bo'lmasa — tushuntirish chiqadi
async function profilniTekshir(s) {
  if (!BAZA_YOQIQ) { s.appendChild(yarat("p", "bosh-holat", "Bu bo'lim hali sozlanmagan.")); return null; }
  if (!mening) {
    const q = yarat("div", "vik-quti markaz");
    q.append(yarat("p", "", "Bu bo'limdan foydalanish uchun avval profil oching — bir daqiqa, ro'yxatdan o'tish shart emas."),
      havola("#profilim", "asosiy", "Profil ochish"));
    s.appendChild(q);
    return null;
  }
  try {
    const m = await mijozOl();
    const uid = await kirish();
    if (uid !== mening.id) {
      s.appendChild(yarat("p", "bosh-holat", "Bu qurilmada profilingizga kirish yo'qolgan (brauzer tozalangan bo'lishi mumkin). Yangi profil oching."));
      return null;
    }
    return m;
  } catch (e) {
    s.appendChild(yarat("p", "bosh-holat", "Ulanib bo'lmadi — internetni tekshiring."));
    return null;
  }
}

async function profillarniOl(m, idlar) {
  const royxat = [...new Set(idlar)].filter(Boolean);
  if (!royxat.length) return {};
  const { data } = await m.from("profillar").select("id,kod,ism,taxallus").in("id", royxat);
  const natija = {};
  (data || []).forEach((p) => { natija[p.id] = p; });
  return natija;
}

function profilHavola(p) {
  const a = havola(profilIchkiHavola(p), "profil-nom", p ? p.ism : "Noma'lum");
  if (p && p.taxallus) a.appendChild(yarat("small", "profil-taxallus", " @" + p.taxallus));
  return a;
}
function kichikTugma(matn, sinf) { const b = yarat("button", "amal " + (sinf || ""), matn); b.type = "button"; return b; }
function bolim(s, sarlavha) { s.appendChild(yarat("h3", "bolim-sarlavha", sarlavha)); const q = yarat("div", "royxat"); s.appendChild(q); return q; }

// ---------- Kitobdoshlar ----------
async function kitobdoshlarniChiz() {
  const s = $("kitobdoshlarSahifa");
  s.innerHTML = "";
  s.appendChild(yarat("h2", "sahifa-sarlavha", "Kitobdoshlar"));
  const m = await profilniTekshir(s);
  if (!m) return;

  // Kod bo'yicha qo'shish
  const qosh = yarat("div", "iqtibos-karta");
  qosh.appendChild(yarat("p", "kichik-matn", "Do'stingizning @taxallusini, profil kodini yoki havolasini kiriting:"));
  const qator = yarat("div", "profil-forma");
  const kirit = yarat("input"); kirit.placeholder = "masalan: @mirzo"; kirit.autocapitalize = "off";
  const yubor = yarat("button", "kichik", "Taklif yuborish"); yubor.type = "button";
  qator.append(kirit, yubor);
  const xabar = yarat("p", "kichik-matn");
  const meniki = yarat("p", "kichik-matn");
  meniki.append(document.createTextNode(mening.taxallus ? "Siz: " : "Sizning kodingiz: "), yarat("b", "", mening.taxallus ? "@" + mening.taxallus : mening.kod), document.createTextNode(" — "));
  const nusxa = yarat("button", "matn-tugma", "havolani nusxalash"); nusxa.type = "button";
  nusxa.addEventListener("click", async () => { nusxa.textContent = (await nusxaOl(profilManzili(mening))) ? "nusxalandi ✓" : "nusxa olinmadi"; });
  meniki.appendChild(nusxa);
  qosh.append(qator, xabar, meniki);
  s.appendChild(qosh);

  yubor.addEventListener("click", async () => {
    const t = kirit.value.trim().toLowerCase();
    const izlash = izlashniAniqla(t);
    if (!izlash) { xabar.textContent = "Taxallus (masalan: @mirzo) yoki 6 belgili kod kiriting."; return; }
    if (izlash === mening.kod || izlash === "@" + mening.taxallus || izlash === mening.taxallus) { xabar.textContent = "Bu sizning o'zingiz."; return; }
    yubor.disabled = true;
    const natija = await kitobdoshTaklifi(m, izlash);
    yubor.disabled = false;
    xabar.textContent = natija;
    if (natija.startsWith("Taklif yuborildi")) { kirit.value = ""; setTimeout(kitobdoshlarniChiz, 800); }
  });

  const { data: qatorlar, error } = await m.from("kitobdoshlar").select("id,kimdan,kimga,holat,vaqt").order("vaqt", { ascending: false });
  if (error) { s.appendChild(yarat("p", "bosh-holat", "Ro'yxatni yuklab bo'lmadi.")); return; }
  const boshqa = (r) => (r.kimdan === mening.id ? r.kimga : r.kimdan);
  const profillar = await profillarniOl(m, qatorlar.map(boshqa));

  const kelgan = qatorlar.filter((r) => r.holat === "kutilmoqda" && r.kimga === mening.id);
  const dostlar = qatorlar.filter((r) => r.holat === "qabul");
  const yuborilgan = qatorlar.filter((r) => r.holat === "kutilmoqda" && r.kimdan === mening.id);

  if (kelgan.length) {
    const q = bolim(s, `Kelgan takliflar (${kelgan.length})`);
    kelgan.forEach((r) => {
      const k = yarat("div", "odam-qator");
      k.appendChild(profilHavola(profillar[r.kimdan]));
      const ha = kichikTugma("Qabul qilish", "tanlangan"), yoq = kichikTugma("Rad etish");
      ha.addEventListener("click", async () => { ha.disabled = yoq.disabled = true; await m.from("kitobdoshlar").update({ holat: "qabul" }).eq("id", r.id); kitobdoshlarniChiz(); });
      yoq.addEventListener("click", async () => { ha.disabled = yoq.disabled = true; await m.from("kitobdoshlar").delete().eq("id", r.id); kitobdoshlarniChiz(); });
      const t = yarat("div", "tugmalar"); t.append(ha, yoq); k.appendChild(t);
      q.appendChild(k);
    });
  }

  const q = bolim(s, `Kitobdoshlarim (${dostlar.length})`);
  if (!dostlar.length) q.appendChild(yarat("p", "bosh-holat", "Hali kitobdoshlaringiz yo'q. Kodingizni do'stlaringizga yuboring yoki ularning kodini kiriting."));
  dostlar.forEach((r) => {
    const p = profillar[boshqa(r)];
    const k = yarat("div", "odam-qator");
    k.appendChild(profilHavola(p));
    const t = yarat("div", "tugmalar");
    t.appendChild(havola("#birga/yangi/" + boshqa(r), "amal tanlangan", "Birga o'qish"));
    const ochir = kichikTugma("Olib tashlash");
    ochir.addEventListener("click", async () => {
      if (!confirm(`${p ? p.ism : "Bu odam"}ni kitobdoshlardan olib tashlaysizmi?`)) return;
      await m.from("kitobdoshlar").delete().eq("id", r.id); kitobdoshlarniChiz();
    });
    t.appendChild(ochir); k.appendChild(t);
    q.appendChild(k);
  });

  if (yuborilgan.length) {
    const q2 = bolim(s, "Yuborilgan takliflar");
    yuborilgan.forEach((r) => {
      const k = yarat("div", "odam-qator");
      k.append(profilHavola(profillar[r.kimga]), yarat("span", "kichik-matn", "javob kutilmoqda"));
      const bekor = kichikTugma("Bekor qilish");
      bekor.addEventListener("click", async () => { await m.from("kitobdoshlar").delete().eq("id", r.id); kitobdoshlarniChiz(); });
      k.appendChild(bekor);
      q2.appendChild(k);
    });
  }
}

// Kiritilgan matndan qidiruvni ajratish: "@mirzo", "mirzo", "sitata.uz/@mirzo", "#@mirzo", "?p=t2h2pm", "t2h2pm"
function izlashniAniqla(t) {
  const kod = (t.match(/[?&]p=([a-z0-9]{6})/) || [])[1];
  if (kod) return kod;
  const tx = (t.match(/(?:^|[\/#])@([a-z0-9_]{3,20})\/?$/) || [])[1];
  if (tx) return "@" + tx;
  return /^[a-z0-9_]{3,20}$/.test(t) ? t : null;
}

// Taxallus yoki kod bo'yicha kitobdoshlik taklifi; natija matnini qaytaradi.
// "@..." — faqat taxallus; 6 belgili qiymat — avval kod, keyin taxallus; boshqasi — taxallus.
async function kitobdoshTaklifi(m, izlash) {
  const ol = async (ustun, qiymat) => (await m.from("profillar").select("id,ism").eq(ustun, qiymat).maybeSingle()).data;
  let p = null;
  if (izlash.startsWith("@")) p = await ol("taxallus", taxallusniTozala(izlash));
  else {
    if (/^[a-z0-9]{6}$/.test(izlash)) p = await ol("kod", izlash);
    if (!p && TAXALLUS_SHAKLI.test(izlash)) p = await ol("taxallus", izlash);
  }
  if (!p) return "Bunday foydalanuvchi topilmadi.";
  if (p.id === mening.id) return "Bu sizning o'z profilingiz.";
  const { error } = await m.from("kitobdoshlar").insert({ kimdan: mening.id, kimga: p.id });
  if (!error) return `Taklif yuborildi — ${p.ism} qabul qilsa, kitobdosh bo'lasiz.`;
  if (error.code === "23505") return `${p.ism} bilan allaqachon kitobdoshsiz yoki taklif yuborilgan.`;
  return "Taklif yuborilmadi — qayta urinib ko'ring.";
}

// Boshqa odamning profil sahifasidagi tugma
function kitobdoshTugmasi(profil) {
  const quti = yarat("div", "kitobdosh-quti");
  if (!BAZA_YOQIQ) return quti;
  if (!mening) { quti.appendChild(havola("#profilim", "ikkilamchi havola-tugma", "Kitobdosh bo'lish uchun profil oching")); return quti; }
  (async () => {
    try {
      const m = await mijozOl();
      const uid = await kirish();
      if (uid !== mening.id) return;
      const { data } = await m.from("kitobdoshlar").select("id,kimdan,holat")
        .or(`and(kimdan.eq.${mening.id},kimga.eq.${profil.id}),and(kimdan.eq.${profil.id},kimga.eq.${mening.id})`).maybeSingle();
      quti.innerHTML = "";
      if (data && data.holat === "qabul") {
        quti.append(yarat("p", "kichik-matn", "✓ Kitobdoshingiz"), havola("#birga/yangi/" + profil.id, "ikkilamchi havola-tugma", "Birga o'qishga taklif qilish"));
      } else if (data && data.kimdan === mening.id) {
        quti.appendChild(yarat("p", "kichik-matn", "Kitobdoshlik taklifi yuborilgan — javob kutilmoqda."));
      } else if (data) {
        quti.appendChild(havola("#kitobdoshlar", "ikkilamchi havola-tugma", "Sizga taklif yuborgan — javob berish"));
      } else {
        const b = yarat("button", "ikkilamchi", "Kitobdosh bo'lish"); b.type = "button";
        b.addEventListener("click", async () => {
          b.disabled = true;
          const natija = await kitobdoshTaklifi(m, profil.kod);   // kod — eng aniq
          quti.innerHTML = ""; quti.appendChild(yarat("p", "kichik-matn", natija));
        });
        quti.appendChild(b);
      }
    } catch (e) { /* tugmasiz qoladi */ }
  })();
  return quti;
}

// ---------- Birga o'qiymiz ----------
function birgaChiz(param) {
  const [birinchi, ikkinchi] = (param || "").split("/");
  if (birinchi === "yangi") return yangiOqishChiz(ikkinchi);
  if (/^\d+$/.test(birinchi || "")) return oqishChiz(Number(birinchi));
  return oqishlarRoyxati();
}

function foizChizigi(foiz) {
  const c = yarat("div", "foiz-chiziq"); const t = yarat("span"); t.style.width = foiz + "%"; c.appendChild(t); return c;
}

async function oqishlarRoyxati() {
  const s = $("birgaSahifa");
  s.innerHTML = "";
  s.appendChild(yarat("h2", "sahifa-sarlavha", "Birga o'qiymiz"));
  s.appendChild(yarat("p", "kichik-matn markaz", "Kitob tanlang, kitobdoshlaringizni taklif qiling va bir-biringizning qayergacha o'qiganingizni kuzating."));
  const m = await profilniTekshir(s);
  if (!m) return;
  s.appendChild(havola("#birga/yangi", "asosiy", "+ Yangi birga o'qish"));

  const { data: azoliklar, error } = await m.from("oqish_azolari").select("oqish_id,holat,foiz").eq("profil_id", mening.id);
  if (error) { s.appendChild(yarat("p", "bosh-holat", "Yuklab bo'lmadi.")); return; }
  const idlar = azoliklar.filter((a) => a.holat !== "rad").map((a) => a.oqish_id);
  if (!idlar.length) { s.appendChild(yarat("p", "bosh-holat", "Hali birga o'qish yo'q — birinchisini boshlang!")); return; }
  const [{ data: oqishlar }, { data: azolar }] = await Promise.all([
    m.from("oqishlar").select("id,kitob,muallif,yaratuvchi,tugash,yaratilgan").in("id", idlar).order("yaratilgan", { ascending: false }),
    m.from("oqish_azolari").select("oqish_id,profil_id,holat,foiz").in("oqish_id", idlar),
  ]);
  const profillar = await profillarniOl(m, (oqishlar || []).map((o) => o.yaratuvchi));
  const menikiQayerda = (id) => azoliklar.find((a) => a.oqish_id === id);

  const takliflar = (oqishlar || []).filter((o) => menikiQayerda(o.id).holat === "taklif");
  const faollar = (oqishlar || []).filter((o) => menikiQayerda(o.id).holat === "qabul");

  if (takliflar.length) {
    const q = bolim(s, `Sizga takliflar (${takliflar.length})`);
    takliflar.forEach((o) => {
      const k = havola("#birga/" + o.id, "iqtibos-karta oqish-karta");
      k.append(yarat("b", "oqish-kitob", "«" + o.kitob + "»"), yarat("span", "kichik-matn", (o.muallif ? o.muallif + " · " : "") + "taklif qildi: " + (profillar[o.yaratuvchi] || {}).ism),
        yarat("span", "tugmacha", "Ko'rish va javob berish →"));
      q.appendChild(k);
    });
  }
  const q = bolim(s, "O'qiyotganlarim");
  if (!faollar.length) q.appendChild(yarat("p", "bosh-holat", "Hozircha yo'q."));
  faollar.forEach((o) => {
    const ishtirokchilar = (azolar || []).filter((a) => a.oqish_id === o.id && a.holat === "qabul");
    const k = havola("#birga/" + o.id, "iqtibos-karta oqish-karta");
    k.append(yarat("b", "oqish-kitob", "«" + o.kitob + "»"),
      yarat("span", "kichik-matn", `${o.muallif ? o.muallif + " · " : ""}${ishtirokchilar.length} kishi o'qiyapti`),
      yarat("span", "kichik-matn", `Siz: ${menikiQayerda(o.id).foiz}%`), foizChizigi(menikiQayerda(o.id).foiz));
    q.appendChild(k);
  });
}

async function yangiOqishChiz(tanlanganId) {
  const s = $("birgaSahifa");
  s.innerHTML = "";
  s.appendChild(havola("#birga", "orqaga", "← Birga o'qiymiz"));
  s.appendChild(yarat("h2", "sahifa-sarlavha", "Yangi birga o'qish"));
  const m = await profilniTekshir(s);
  if (!m) return;

  const { data: qatorlar } = await m.from("kitobdoshlar").select("kimdan,kimga").eq("holat", "qabul");
  const dostIdlar = (qatorlar || []).map((r) => (r.kimdan === mening.id ? r.kimga : r.kimdan));
  const profillar = await profillarniOl(m, dostIdlar);
  if (!dostIdlar.length) {
    const q = yarat("div", "vik-quti markaz");
    q.append(yarat("p", "", "Birga o'qish uchun avval kitobdosh qo'shing."), havola("#kitobdoshlar", "asosiy", "Kitobdoshlar"));
    s.appendChild(q);
    return;
  }

  const forma = yarat("div", "karta-sozlama");
  const qator = (nom, ...ichi) => { const q = yarat("div", "sozlama-qator"); q.append(yarat("span", "sozlama-nom", nom), ...ichi); return q; };
  const kitobTanla = yarat("select", "tanlash");
  const boshqa = "__boshqa__";
  [["", "— Kitobni tanlang —"], ...KITOBLAR.map((k, i) => [String(i), `${k.nom} — ${k.muallif}`]), [boshqa, "Boshqa kitob (o'zim yozaman)…"]]
    .forEach(([v, t]) => { const o = yarat("option", "", t); o.value = v; kitobTanla.appendChild(o); });
  const kitobYoz = yarat("input", "matn-maydon bir-qator yashirin"); kitobYoz.placeholder = "Kitob nomi"; kitobYoz.maxLength = 120;
  const muallifYoz = yarat("input", "matn-maydon bir-qator yashirin"); muallifYoz.placeholder = "Muallifi (ixtiyoriy)"; muallifYoz.maxLength = 60;
  kitobTanla.addEventListener("change", () => {
    const b = kitobTanla.value === boshqa;
    kitobYoz.classList.toggle("yashirin", !b); muallifYoz.classList.toggle("yashirin", !b);
    if (b) kitobYoz.focus();
  });
  forma.appendChild(qator("Kitob", kitobTanla, kitobYoz, muallifYoz));

  const dostlar = yarat("div", "dost-tanlov");
  dostIdlar.forEach((id) => {
    const l = yarat("label", "belgilash");
    const cb = yarat("input"); cb.type = "checkbox"; cb.value = id; cb.checked = id === tanlanganId;
    l.append(cb, document.createTextNode(" " + ((profillar[id] || {}).ism || "Noma'lum")));
    dostlar.appendChild(l);
  });
  forma.appendChild(qator("Kimlarni taklif qilasiz?", dostlar));

  const xabar = yarat("textarea", "matn-maydon"); xabar.rows = 2; xabar.maxLength = 300; xabar.placeholder = "Xabar (ixtiyoriy): masalan, «Har kuni 20 betdan o'qiymiz»";
  forma.appendChild(qator("Xabar", xabar));
  const sana = yarat("input", "matn-maydon bir-qator"); sana.type = "date";
  sana.min = new Date().toISOString().slice(0, 10);
  forma.appendChild(qator("Qachongacha o'qib tugatamiz? (ixtiyoriy)", sana));
  s.appendChild(forma);

  const tugma = yarat("button", "asosiy", "Taklif yuborish"); tugma.type = "button";
  const holatMatni = yarat("p", "ulash-xabar");
  s.append(tugma, holatMatni);

  tugma.addEventListener("click", async () => {
    let kitob, muallif;
    if (kitobTanla.value === boshqa) { kitob = kitobYoz.value.trim(); muallif = muallifYoz.value.trim() || null; }
    else if (kitobTanla.value !== "") { const k = KITOBLAR[Number(kitobTanla.value)]; kitob = k.nom; muallif = k.muallif; }
    const tanlanganlar = [...dostlar.querySelectorAll("input:checked")].map((c) => c.value);
    if (!kitob) { holatMatni.textContent = "Kitobni tanlang yoki nomini yozing."; return; }
    if (!tanlanganlar.length) { holatMatni.textContent = "Kamida bitta kitobdoshni tanlang."; return; }
    tugma.disabled = true; holatMatni.textContent = "Yuborilmoqda…";
    try {
      const { data: oqish, error } = await m.from("oqishlar")
        .insert({ kitob, muallif, xabar: xabar.value.trim() || null, tugash: sana.value || null, yaratuvchi: mening.id })
        .select("id").single();
      if (error) throw error;
      const { error: e2 } = await m.from("oqish_azolari").insert([
        { oqish_id: oqish.id, profil_id: mening.id, holat: "qabul" },
        ...tanlanganlar.map((id) => ({ oqish_id: oqish.id, profil_id: id, holat: "taklif" })),
      ]);
      if (e2) throw e2;
      location.hash = "#birga/" + oqish.id;
    } catch (e) {
      tugma.disabled = false;
      holatMatni.textContent = "Yuborilmadi — qayta urinib ko'ring.";
    }
  });
}

async function oqishChiz(id) {
  const s = $("birgaSahifa");
  s.innerHTML = "";
  s.appendChild(havola("#birga", "orqaga", "← Birga o'qiymiz"));
  const m = await profilniTekshir(s);
  if (!m) return;
  const [{ data: o }, { data: azolar }] = await Promise.all([
    m.from("oqishlar").select("id,kitob,muallif,xabar,tugash,yaratuvchi,yaratilgan").eq("id", id).maybeSingle(),
    m.from("oqish_azolari").select("profil_id,holat,foiz,izoh,yangilangan").eq("oqish_id", id),
  ]);
  if (!o) { s.appendChild(yarat("p", "bosh-holat", "Bu birga o'qish topilmadi yoki siz unda qatnashmaysiz.")); return; }
  const profillar = await profillarniOl(m, (azolar || []).map((a) => a.profil_id).concat(o.yaratuvchi));
  const men = (azolar || []).find((a) => a.profil_id === mening.id);

  const bosh = yarat("div", "oqish-bosh");
  bosh.append(yarat("p", "kichik-matn", "Birga o'qiymiz"), yarat("h2", "", "«" + o.kitob + "»"));
  if (o.muallif) bosh.appendChild(yarat("p", "kichik-matn", o.muallif));
  const yaratuvchi = yarat("p", "kichik-matn"); yaratuvchi.append(document.createTextNode("Boshlagan: "), profilHavola(profillar[o.yaratuvchi]));
  bosh.appendChild(yaratuvchi);
  if (o.tugash) {
    const qolgan = Math.ceil((new Date(o.tugash) - new Date(new Date().toISOString().slice(0, 10))) / 86400000);
    bosh.appendChild(yarat("p", "kichik-matn", `Maqsad: ${new Date(o.tugash).toLocaleDateString("uz")} gacha` +
      (qolgan > 0 ? ` · ${qolgan} kun qoldi` : qolgan === 0 ? " · bugun oxirgi kun" : " · muddat o'tdi")));
  }
  if (o.xabar) bosh.appendChild(yarat("blockquote", "oqish-xabar", o.xabar));
  s.appendChild(bosh);

  // Taklifga javob
  if (men && men.holat === "taklif") {
    const q = yarat("div", "vik-quti markaz");
    q.appendChild(yarat("p", "", "Sizni shu kitobni birga o'qishga taklif qilishdi."));
    const ha = yarat("button", "asosiy", "Qo'shilaman"); ha.type = "button";
    const yoq = yarat("button", "ikkilamchi", "Rad etaman"); yoq.type = "button";
    const javob = async (holatNomi) => {
      ha.disabled = yoq.disabled = true;
      await m.from("oqish_azolari").update({ holat: holatNomi, yangilangan: new Date().toISOString() }).eq("oqish_id", id).eq("profil_id", mening.id);
      holatNomi === "rad" ? (location.hash = "#birga") : oqishChiz(id);
    };
    ha.addEventListener("click", () => javob("qabul")); yoq.addEventListener("click", () => javob("rad"));
    q.append(ha, yoq);
    s.appendChild(q);
  }

  // O'z holatimni yangilash
  if (men && men.holat === "qabul") {
    const q = yarat("div", "iqtibos-karta mening-holatim");
    q.appendChild(yarat("b", "", "Qayergacha o'qidingiz?"));
    const foizMatn = yarat("span", "foiz-matn", men.foiz + "%");
    const surgich = yarat("input", "surgich"); surgich.type = "range"; surgich.min = 0; surgich.max = 100; surgich.step = 5; surgich.value = men.foiz;
    surgich.addEventListener("input", () => { foizMatn.textContent = surgich.value + "%"; });
    const izoh = yarat("input", "matn-maydon bir-qator"); izoh.maxLength = 200; izoh.placeholder = "Qisqa izoh (ixtiyoriy): masalan, «3-bob juda ta'sirli»"; izoh.value = men.izoh || "";
    const saqla = yarat("button", "kichik", "Saqlash"); saqla.type = "button";
    const natija = yarat("span", "kichik-matn");
    saqla.addEventListener("click", async () => {
      saqla.disabled = true;
      const { error } = await m.from("oqish_azolari").update({ foiz: Number(surgich.value), izoh: izoh.value.trim() || null, yangilangan: new Date().toISOString() })
        .eq("oqish_id", id).eq("profil_id", mening.id);
      saqla.disabled = false;
      if (error) { natija.textContent = "Saqlanmadi."; return; }
      oqishChiz(id);
    });
    const qator1 = yarat("div", "surgich-qator"); qator1.append(surgich, foizMatn);
    const qator2 = yarat("div", "profil-forma"); qator2.append(izoh, saqla);
    q.append(qator1, qator2, natija);
    s.appendChild(q);
  }

  // Ishtirokchilar
  const royxat = bolim(s, "Ishtirokchilar");
  const tartib = { qabul: 0, taklif: 1, rad: 2 };
  (azolar || []).sort((a, b) => tartib[a.holat] - tartib[b.holat] || b.foiz - a.foiz).forEach((a) => {
    const k = yarat("div", "ishtirokchi" + (a.profil_id === mening.id ? " meniki" : ""));
    const yuqori = yarat("div", "ishtirokchi-yuqori");
    yuqori.appendChild(profilHavola(profillar[a.profil_id]));
    yuqori.appendChild(yarat("span", "kichik-matn", a.holat === "qabul" ? (a.foiz === 100 ? "tugatdi ✓" : a.foiz + "%") : a.holat === "taklif" ? "taklif kutilmoqda" : "rad etdi"));
    k.appendChild(yuqori);
    if (a.holat === "qabul") k.appendChild(foizChizigi(a.foiz));
    if (a.izoh) k.appendChild(yarat("p", "ishtirokchi-izoh", "«" + a.izoh + "»"));
    royxat.appendChild(k);
  });

  // Yaratuvchi o'chira oladi
  if (o.yaratuvchi === mening.id) {
    const ochir = yarat("button", "matn-tugma xavfli", "Bu birga o'qishni o'chirish"); ochir.type = "button";
    ochir.addEventListener("click", async () => {
      if (!confirm("Birga o'qishni hamma uchun o'chirasizmi?")) return;
      await m.from("oqishlar").delete().eq("id", id);
      location.hash = "#birga";
    });
    s.appendChild(ochir);
  }
}

// ---------- Bildirishnomalar (🔔) ----------
const qongiroq = $("qongiroq"), bildirishPanel = $("bildirishPanel");
let bildirishnomalar = [];

async function bildirishMijozi() {
  if (!BAZA_YOQIQ || !mening) return null;
  const m = await mijozOl();
  const { data } = await m.auth.getSession();           // yangi anonim sessiya ochmaymiz — faqat borini tekshiramiz
  if (!data || !data.session || data.session.user.id !== mening.id) return null;
  return m;
}

async function bildirishnomalarniYukla() {
  try {
    const m = await bildirishMijozi();
    if (!m) { qongiroq.classList.add("yashirin"); return; }
    qongiroq.classList.remove("yashirin");
    const { data } = await m.from("bildirishnomalar").select("id,matn,havola,oqildi,vaqt").order("vaqt", { ascending: false }).limit(20);
    bildirishnomalar = data || [];
    const oqilmagan = bildirishnomalar.filter((b) => !b.oqildi).length;
    const son = $("qongiroqSon");
    son.textContent = oqilmagan > 9 ? "9+" : String(oqilmagan);
    son.classList.toggle("yashirin", oqilmagan === 0);
    qongiroq.setAttribute("aria-label", oqilmagan ? `Bildirishnomalar: ${oqilmagan} ta yangi` : "Bildirishnomalar");
    if (!bildirishPanel.classList.contains("yashirin")) panelniChiz();
  } catch (e) { /* keyingi safar */ }
}

function vaqtOldin(vaqt) {
  const daqiqa = Math.round((Date.now() - new Date(vaqt)) / 60000);
  if (daqiqa < 1) return "hozirgina";
  if (daqiqa < 60) return daqiqa + " daqiqa oldin";
  if (daqiqa < 1440) return Math.round(daqiqa / 60) + " soat oldin";
  return Math.round(daqiqa / 1440) + " kun oldin";
}

function panelniChiz() {
  bildirishPanel.innerHTML = "";
  const yuqori = yarat("div", "panel-yuqori");
  yuqori.appendChild(yarat("b", "", "Bildirishnomalar"));
  if (bildirishnomalar.some((b) => !b.oqildi)) {
    const hammasi = yarat("button", "matn-tugma", "Hammasini o'qildi"); hammasi.type = "button";
    hammasi.addEventListener("click", async (e) => {
      e.stopPropagation();
      const m = await bildirishMijozi(); if (!m) return;
      await m.from("bildirishnomalar").update({ oqildi: true }).eq("kimga", mening.id).eq("oqildi", false);
      bildirishnomalarniYukla();
    });
    yuqori.appendChild(hammasi);
  }
  bildirishPanel.appendChild(yuqori);
  if (!bildirishnomalar.length) { bildirishPanel.appendChild(yarat("p", "bosh-holat", "Hozircha bildirishnoma yo'q.")); return; }
  bildirishnomalar.forEach((b) => {
    const a = yarat("button", "bildirish" + (b.oqildi ? "" : " yangi")); a.type = "button";
    a.append(yarat("span", "", b.matn), yarat("small", "", vaqtOldin(b.vaqt)));
    a.addEventListener("click", async () => {
      bildirishPanel.classList.add("yashirin"); qongiroq.setAttribute("aria-expanded", "false");
      if (!b.oqildi) {
        const m = await bildirishMijozi();
        if (m) await m.from("bildirishnomalar").update({ oqildi: true }).eq("id", b.id);
      }
      if (b.havola && b.havola.startsWith("?")) location.href = SAYT_MANZILI + b.havola;
      else if (b.havola) { if (location.hash === b.havola) sahifaniKor(); else location.hash = b.havola; }
      bildirishnomalarniYukla();
    });
    bildirishPanel.appendChild(a);
  });
}

qongiroq.addEventListener("click", (e) => {
  e.stopPropagation();
  menyuniYop();
  const ochiq = bildirishPanel.classList.toggle("yashirin") === false;
  qongiroq.setAttribute("aria-expanded", String(ochiq));
  if (ochiq) { panelniChiz(); bildirishnomalarniYukla(); }
});
document.addEventListener("click", (e) => {
  if (!bildirishPanel.contains(e.target) && e.target !== qongiroq) { bildirishPanel.classList.add("yashirin"); qongiroq.setAttribute("aria-expanded", "false"); }
});

function bildirishnomalarniBoshla() {
  bildirishnomalarniYukla();
  setInterval(() => { if (document.visibilityState === "visible") bildirishnomalarniYukla(); }, 60000);
  document.addEventListener("visibilitychange", () => { if (document.visibilityState === "visible") bildirishnomalarniYukla(); });
}
menyuTugma.addEventListener("click", () => { bildirishPanel.classList.add("yashirin"); qongiroq.setAttribute("aria-expanded", "false"); });
window.addEventListener("hashchange", () => { if (mening && qongiroq.classList.contains("yashirin")) bildirishnomalarniYukla(); });

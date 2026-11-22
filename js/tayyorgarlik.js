// ===== GURUHDA TAYYORGARLIK: MATERIALLAR, SAVOLLAR, MASHQ =====
// Attestatsiya, imtihon yoki test uchun: guruh egasi material va savollar faylini yuklaydi,
// a'zolar kartochka va test rejimlarida mashq qiladi, hamma o'z tayyorgarligini, egasi — eng qiyin savollarni ko'radi.
// Baza: guruh_savollari, savol_natijalari, guruh_materiallari, «guruh-fayllar» xotirasi — supabase/guruhlar.sql

const SHEETJS = "https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js";
const MATERIAL_TURLARI = ["pdf", "docx", "txt", "epub", "fb2", "md"];

// ---------- Fayldan matn ----------
async function pdfMatni(fayl) {
  if (!window.pdfjsLib) await skriptYukla(PDFJS + "pdf.min.js");
  window.pdfjsLib.GlobalWorkerOptions.workerSrc = PDFJS + "pdf.worker.min.js";
  const h = await window.pdfjsLib.getDocument({ data: new Uint8Array(await fayl.arrayBuffer()) }).promise;
  const qismlar = [];
  for (let i = 1; i <= Math.min(h.numPages, 400); i++) {
    const t = await (await h.getPage(i)).getTextContent();
    let qator = "", oldingiY = null;
    t.items.forEach((it) => {
      const y = it.transform ? Math.round(it.transform[5]) : null;
      if (oldingiY !== null && y !== null && Math.abs(y - oldingiY) > 2) { qismlar.push(qator); qator = ""; }
      qator += it.str; oldingiY = y;
      if (it.hasEOL) { qismlar.push(qator); qator = ""; oldingiY = null; }
    });
    if (qator) qismlar.push(qator);
  }
  h.destroy();
  return qismlar.join("\n");
}

// Excel / CSV → savollar (sarlavha bo'yicha yoki ustun tartibi bo'yicha)
async function jadvaldanSavollar(fayl) {
  if (!window.XLSX) await skriptYukla(SHEETJS);
  const kitob = window.XLSX.read(await fayl.arrayBuffer(), { type: "array" });
  const qatorlar = window.XLSX.utils.sheet_to_json(kitob.Sheets[kitob.SheetNames[0]], { header: 1, raw: false, defval: "" })
    .map((r) => r.map((x) => String(x).trim())).filter((r) => r.some(Boolean));
  if (!qatorlar.length) return [];
  const bosh = qatorlar[0].map((x) => x.toLowerCase());
  const top = (...soz) => bosh.findIndex((x) => soz.some((s) => x.includes(s)));
  let iS = top("savol", "question", "вопрос"), iJ = top("javob", "answer", "ответ", "to'g'ri", "togri", "correct", "правиль");
  let variantUst = bosh.map((x, i) => (/^([a-f]|variant|вариант)/.test(x) && i !== iS && i !== iJ ? i : -1)).filter((i) => i >= 0);
  let boshlanish = 1;
  if (iS < 0) {   // sarlavhasiz: 1-ustun savol; 2 ustun — javob; 6+ ustun — savol, A, B, C, D, to'g'ri javob
    boshlanish = 0; iS = 0;
    const n = Math.max(...qatorlar.map((r) => r.length));
    if (n >= 6) { variantUst = [1, 2, 3, 4]; iJ = 5; } else { iJ = 1; variantUst = []; }
  }
  return qatorlar.slice(boshlanish).map((r) => {
    const savol = r[iS];
    if (!savol) return null;
    const variantlar = variantUst.map((i) => r[i]).filter(Boolean);
    let javob = iJ >= 0 ? r[iJ] : "";
    if (variantlar.length >= 2) {
      const harf = javob.trim().toUpperCase().match(/^([A-H])\)?\.?$/);
      if (harf) javob = variantlar["ABCDEFGH".indexOf(harf[1])] || "";
      return { savol, javob: variantlar.includes(javob) ? javob : null, variantlar };
    }
    return { savol, javob: javob || null, variantlar: null };
  }).filter(Boolean);
}

// ---------- Matndan savollarni ajratish ----------
// Tushunadi: «1. Savol?», «Savol: …», «A) variant» (*, + yoki «(to'g'ri)» belgili), «Javob: B» yoki «Javob: matn»,
// «Bilet 3» / «Mavzu: …» sarlavhalari. Javobi yo'q savollar ham olinadi (kartochka sifatida).
function savollarniAjrat(matn) {
  const qatorlar = String(matn).replace(/\r/g, "").split("\n").map((q) => q.replace(/ /g, " ").trim());
  const natija = [];
  let joriy = null, mavzu = null, holat = "savol";
  const RAQAM = /^(?:savol\s*|вопрос\s*|№\s*)?(\d{1,4})\s*[.)\-:]\s*(.+)$/i;
  const SAVOL = /^(?:savol|вопрос|question)\s*[:\-–]\s*(.+)$/i;
  const VARIANT = /^([*+]\s*)?([A-Ha-hА-Еа-е])\s*[).:\-]\s*(.+)$/;
  const JAVOB = /^(?:to['‘’ʻ`]?g['‘’ʻ`]?ri\s+javob|javob|kalit|answer|ответ|правильный\s+ответ)\s*[:\-–]?\s*(.*)$/i;
  const SARLAVHA = /^(bilet|mavzu|bo['‘’ʻ]?lim|билет|тема|раздел)\b\s*(?:№|n|#)?\s*[:\-–]?\s*(.*)$/i;
  const yop = () => {
    if (!joriy) return;
    const variantlar = joriy.variantlar.map((v) => v.matn);
    let javob = joriy.javob.join("\n").trim();
    if (variantlar.length >= 2) {
      let togri = joriy.variantlar.find((v) => v.belgili);
      const harf = javob.toUpperCase().match(/^([A-HА-Е])(?![\p{L}\d])/u);
      if (!togri && harf) togri = joriy.variantlar.find((v) => v.harf.toUpperCase() === harf[1]);
      if (!togri && javob) togri = joriy.variantlar.find((v) => v.matn.toLowerCase() === javob.toLowerCase());
      natija.push({ savol: joriy.savol.join(" ").trim(), javob: togri ? togri.matn : null, variantlar, mavzu: joriy.mavzu });
    } else natija.push({ savol: joriy.savol.join(" ").trim(), javob: javob || null, variantlar: null, mavzu: joriy.mavzu });
    joriy = null;
  };
  const yangi = (matn) => { yop(); joriy = { savol: [matn], variantlar: [], javob: [], mavzu }; holat = "savol"; };
  for (const q of qatorlar) {
    if (!q) { if (holat === "javob" && joriy && joriy.javob.length) holat = "keyin"; continue; }
    let m;
    if ((m = q.match(SARLAVHA)) && q.length < 80 && !/[?]$/.test(q)) { yop(); mavzu = (m[1] + " " + m[2]).trim().replace(/\s+/g, " ").slice(0, 120); continue; }
    if ((m = q.match(JAVOB)) && joriy) { holat = "javob"; if (m[1]) joriy.javob.push(m[1]); continue; }
    if ((m = q.match(VARIANT)) && joriy && holat !== "javob" && (joriy.variantlar.length || /^[AaАа]$/.test(m[2]))) {
      let t = m[3].trim(); let belgili = !!m[1];
      if (/\s*(\(to['‘’ʻ]?g['‘’ʻ]?ri\)|\*|\+)$/i.test(t)) { belgili = true; t = t.replace(/\s*(\(to['‘’ʻ]?g['‘’ʻ]?ri\)|\*|\+)$/i, ""); }
      joriy.variantlar.push({ harf: m[2], matn: t, belgili }); holat = "variant"; continue;
    }
    if ((m = q.match(SAVOL))) { yangi(m[1]); continue; }
    if ((m = q.match(RAQAM)) && (holat !== "javob" || joriy.javob.length)) { yangi(m[2]); continue; }
    if (!joriy) { if (/[?？]$/.test(q)) yangi(q); continue; }   // raqamsiz birinchi savol
    if (holat === "javob") joriy.javob.push(q);
    else if (holat === "variant") joriy.variantlar[joriy.variantlar.length - 1].matn += " " + q;
    else if (holat === "keyin") { yangi(q); }
    else joriy.savol.push(q);
  }
  yop();
  return natija.filter((s) => s.savol.length >= 2).map((s) => ({
    ...s, savol: s.savol.slice(0, 1500), javob: s.javob ? s.javob.slice(0, 4000) : null,
    variantlar: s.variantlar ? s.variantlar.slice(0, 8).map((v) => v.slice(0, 500)) : null,
  }));
}

async function fayldanSavollar(fayl) {
  const k = kengaytma(fayl.name);
  if (["xlsx", "xls", "csv", "ods"].includes(k)) return jadvaldanSavollar(fayl);
  let matn;
  if (k === "docx") matn = await docxMatni(fayl);
  else if (k === "pdf") matn = await pdfMatni(fayl);
  else matn = matnniOch(await fayl.arrayBuffer());
  return savollarniAjrat(matn);
}

// ---------- Guruhning «Mashq» bo'limi ----------
async function guruhMashqi(m, g, tana, egasi) {
  tana.appendChild(yarat("p", "bosh-holat", "Yuklanmoqda…"));
  const [{ data: savollar }, { data: natijalar }, { data: materiallar }] = await Promise.all([
    m.from("guruh_savollari").select("id,savol,javob,variantlar,mavzu,tartib").eq("guruh_id", g.id).order("tartib").order("id").limit(3000),
    m.from("savol_natijalari").select("savol_id,quti,togri,xato,oxirgi").eq("guruh_id", g.id).eq("profil_id", mening.id).limit(3000),
    m.from("guruh_materiallari").select("id,nom,fayl_yoli,fayl_nomi,fayl_hajmi").eq("guruh_id", g.id).order("yaratilgan"),
  ]);
  tana.innerHTML = "";
  const S = savollar || [];
  const N = new Map((natijalar || []).map((n) => [n.savol_id, n]));

  // Materiallar
  if ((materiallar && materiallar.length) || egasi) {
    tana.appendChild(yarat("h3", "bolim-sarlavha", "📁 Materiallar"));
    (materiallar || []).forEach((mt) => {
      const q = yarat("div", "material-qator");
      const och = yarat("button", "material-och"); och.type = "button";
      och.append(yarat("span", "", "📄"), yarat("b", "", mt.nom), yarat("small", "", `${(kengaytma(mt.fayl_nomi) || "").toUpperCase()} · ${hajmMatni(mt.fayl_hajmi || 0)}`));
      och.addEventListener("click", () => oquvchiniOch(m, { id: "g" + mt.id, kitob: mt.nom, fayl_yoli: mt.fayl_yoli, fayl_nomi: mt.fayl_nomi }, { bucket: "guruh-fayllar" }));
      q.appendChild(och);
      if (egasi) {
        const o = yarat("button", "matn-tugma xavfli", "✕"); o.type = "button"; o.setAttribute("aria-label", "Materialni o'chirish");
        o.addEventListener("click", async () => {
          if (!confirm(`«${mt.nom}» materialini o'chirasizmi?`)) return;
          await m.from("guruh_materiallari").delete().eq("id", mt.id);
          await m.storage.from("guruh-fayllar").remove([mt.fayl_yoli]);
          q.remove();
        });
        q.appendChild(o);
      }
      tana.appendChild(q);
    });
    if (egasi) tana.appendChild(materialYuklash(m, g, () => { tana.innerHTML = ""; guruhMashqi(m, g, tana, egasi); }));
  }

  // Savollar va mashq
  tana.appendChild(yarat("h3", "bolim-sarlavha", "📝 Savollar"));
  if (!S.length) {
    tana.appendChild(yarat("p", "bosh-holat", egasi ? "Hali savol yo'q — fayldan yuklang yoki matnni joylang." : "Guruh egasi hali savollar qo'shmagan."));
  } else {
    const ozl = S.filter((s) => (N.get(s.id) || {}).quti >= 2).length;
    const foiz = Math.round((ozl / S.length) * 100);
    const xulosa = yarat("div", "mashq-xulosa");
    const testlar = S.filter((s) => s.variantlar && s.javob).length;
    xulosa.append(yarat("b", "", `${S.length} ta savol`), yarat("span", "kichik-matn", `${testlar} ta test · ${S.length - testlar} ta savol-javob`));
    const bar = yarat("div", "seriya-bar"); const ich = yarat("i", ""); ich.style.width = foiz + "%"; bar.appendChild(ich);
    xulosa.append(bar, yarat("span", "kichik-matn", `Siz ${ozl} tasini o'zlashtirdingiz — ${foiz}%`));
    tana.appendChild(xulosa);

    const rejimlar = yarat("div", "mashq-rejimlar");
    const rejim = (belgi, nom, izoh, fn, faol = true) => {
      const b = yarat("button", "mashq-rejim"); b.type = "button"; b.disabled = !faol;
      b.append(yarat("span", "", belgi), yarat("b", "", nom), yarat("small", "", izoh));
      b.addEventListener("click", fn); rejimlar.appendChild(b);
    };
    const xatolar = S.filter((s) => { const n = N.get(s.id); return n && n.quti < 2 && n.xato > 0; });
    rejim("🃏", "Kartochkalar", "Savol → o'ylang → javobni ko'ring", () => kartochkalar(m, g, S, N, tana, egasi));
    rejim("✅", "Test", "20 ta aralash savol, variantlar bilan", () => mashqTesti(m, g, S, N, tana, egasi, 20), testUchunSavollar(S).length >= 4);
    rejim("🔁", "Xatolarim", xatolar.length ? `${xatolar.length} ta bilmagan savolingiz` : "Hozircha xato yo'q", () => kartochkalar(m, g, xatolar, N, tana, egasi), xatolar.length > 0);
    rejim("📝", "Sinov imtihoni", "50 ta savol, har biriga 45 soniya", () => mashqTesti(m, g, S, N, tana, egasi, 50, 45), testUchunSavollar(S).length >= 10);
    tana.appendChild(rejimlar);
  }

  if (egasi) tana.appendChild(savolQoshish(m, g, S.length, () => { tana.innerHTML = ""; guruhMashqi(m, g, tana, egasi); }));

  if (S.length) {
    // Guruh tayyorgarligi
    tana.appendChild(yarat("h3", "bolim-sarlavha", "📊 Guruh tayyorgarligi"));
    const royxat = yarat("ol", "reyting-royxat");
    tana.appendChild(royxat);
    const { data: hisobot } = await m.rpc("guruh_tayyorgarligi", { g: g.id });
    (hisobot || []).sort((a, b) => b.ozlashtirgan - a.ozlashtirgan || b.korgan - a.korgan).forEach((r, i) => {
      const li = yarat("li", "reyting-qator" + (r.profil_id === mening.id ? " meniki" : ""));
      li.append(yarat("span", "orin", String(i + 1)), avatarEl(r, 34, "jadval"));
      const nom = yarat("div", "reyting-nom");
      const f = Math.round((r.ozlashtirgan / S.length) * 100);
      const b2 = yarat("div", "seriya-bar kichik"); const i2 = yarat("i", ""); i2.style.width = f + "%"; b2.appendChild(i2);
      nom.append(havola(profilIchkiHavola(r), "", r.ism), b2);
      li.append(nom, yarat("b", "reyting-ball", f + "%"));
      royxat.appendChild(li);
    });
    if (egasi) {
      const { data: qiyin } = await m.rpc("qiyin_savollar", { g: g.id });
      if (qiyin && qiyin.length) {
        const det = yarat("details", "qiyin-savollar");
        det.appendChild(yarat("summary", "", `⚠️ Eng ko'p xato qilinayotgan savollar (${qiyin.length})`));
        qiyin.forEach((q) => {
          const p = yarat("p", "");
          const f = Math.round((q.xato / Math.max(1, q.togri + q.xato)) * 100);
          p.append(yarat("span", "qiyin-foiz", f + "% xato"), document.createTextNode(" " + q.savol));
          det.appendChild(p);
        });
        tana.appendChild(det);
      }
    }
  }
}

function materialYuklash(m, g, tayyor) {
  const label = yarat("label", "kichik material-yukla");
  const kirit = yarat("input", "yashirin"); kirit.type = "file"; kirit.accept = MATERIAL_TURLARI.map((k) => "." + k).join(",");
  label.append("+ Material yuklash (PDF, Word, TXT, EPUB)", kirit);
  const xabar = yarat("p", "kichik-matn");
  kirit.addEventListener("change", async () => {
    const f = kirit.files[0];
    if (!f) return;
    const k = kengaytma(f.name);
    if (!MATERIAL_TURLARI.includes(k)) { xabar.textContent = "Bu formatni saytda o'qib bo'lmaydi."; return; }
    if (f.size > 50 * 1024 * 1024) { xabar.textContent = "Fayl 50 MB dan katta."; return; }
    xabar.textContent = "Yuklanmoqda…";
    const yol = `${g.id}/${crypto.randomUUID()}.${k}`;
    const { error } = await m.storage.from("guruh-fayllar").upload(yol, f, { contentType: f.type || "application/octet-stream" });
    if (error) { xabar.textContent = "Yuklanmadi — qayta urinib ko'ring."; return; }
    const { error: e2 } = await m.from("guruh_materiallari").insert({ guruh_id: g.id, nom: f.name.replace(/\.[^.]+$/, "").slice(0, 160), fayl_yoli: yol, fayl_nomi: f.name.slice(0, 200), fayl_hajmi: f.size });
    if (e2) { await m.storage.from("guruh-fayllar").remove([yol]); xabar.textContent = "Saqlanmadi."; return; }
    tayyor();
  });
  const q = yarat("div", "material-yukla-quti"); q.append(label, xabar);
  return q;
}

// ---------- Savollarni qo'shish (fayl yoki matn) ----------
function savolQoshish(m, g, borSoni, tayyor) {
  const det = yarat("details", "kitob-qoshish savol-qoshish");
  det.appendChild(yarat("summary", "", "+ Savollar qo'shish"));
  const ichi = yarat("div", "karta-sozlama");
  const faylLabel = yarat("label", "kichik");
  const fayl = yarat("input", "yashirin"); fayl.type = "file"; fayl.accept = ".docx,.pdf,.txt,.xlsx,.xls,.csv";
  faylLabel.append("📎 Fayldan (Word, PDF, Excel, TXT)", fayl);
  const matn = yarat("textarea", "matn-maydon"); matn.rows = 6;
  matn.placeholder = "Yoki matnni shu yerga joylang:\n\n1. Savol matni?\nA) variant\nB) variant\nC) variant\nJavob: B\n\n2. Ochiq savol?\nJavob: javob matni";
  const ajrat = yarat("button", "ikkilamchi", "Savollarni ajratish"); ajrat.type = "button";
  const xabar = yarat("p", "kichik-matn");
  const oldin = yarat("div", "savol-oldin");
  let topilgan = [];
  const korsat = () => {
    oldin.innerHTML = "";
    if (!topilgan.length) { xabar.textContent = "Savol topilmadi. Har bir savol raqam bilan («1.») yoki «Savol:» bilan boshlanishi kerak."; return; }
    const test = topilgan.filter((s) => s.variantlar && s.javob).length;
    const javobsiz = topilgan.filter((s) => !s.javob).length;
    xabar.textContent = `${topilgan.length} ta savol topildi: ${test} ta test, ${topilgan.length - test - javobsiz} ta savol-javob` + (javobsiz ? `, ${javobsiz} ta javobsiz (faqat kartochkada chiqadi)` : "") + ". Tekshirib, keraksizini o'chiring.";
    topilgan.slice(0, 200).forEach((s, i) => {
      const k = yarat("div", "savol-oldin-karta" + (s.javob ? "" : " javobsiz"));
      const bosh = yarat("div", "");
      bosh.append(yarat("b", "", `${i + 1}. ${s.savol}`));
      if (s.mavzu) bosh.appendChild(yarat("small", "", s.mavzu));
      if (s.variantlar) { const u = yarat("ul", ""); s.variantlar.forEach((v) => u.appendChild(yarat("li", v === s.javob ? "togri" : "", v))); bosh.appendChild(u); }
      else if (s.javob) bosh.appendChild(yarat("p", "", "Javob: " + (s.javob.length > 220 ? s.javob.slice(0, 217) + "…" : s.javob)));
      else bosh.appendChild(yarat("p", "javobsiz", "Javob topilmadi"));
      const o = yarat("button", "matn-tugma xavfli", "✕"); o.type = "button"; o.setAttribute("aria-label", "Olib tashlash");
      o.addEventListener("click", () => { topilgan.splice(i, 1); korsat(); });
      k.append(bosh, o); oldin.appendChild(k);
    });
    if (topilgan.length > 200) oldin.appendChild(yarat("p", "kichik-matn", `…va yana ${topilgan.length - 200} ta`));
    const saqla = yarat("button", "asosiy", `${topilgan.length} ta savolni saqlash`); saqla.type = "button";
    saqla.addEventListener("click", async () => {
      if (borSoni + topilgan.length > 3000) { xabar.textContent = "Bir guruhda ko'pi bilan 3000 ta savol bo'ladi."; return; }
      saqla.disabled = true;
      for (let i = 0; i < topilgan.length; i += 200) {
        const qism = topilgan.slice(i, i + 200).map((s, j) => ({ guruh_id: g.id, savol: s.savol, javob: s.javob, variantlar: s.variantlar, mavzu: s.mavzu || null, tartib: borSoni + i + j }));
        const { error } = await m.from("guruh_savollari").insert(qism);
        if (error) { xabar.textContent = `Saqlashda xato (${i} tasi saqlandi) — qayta urinib ko'ring.`; saqla.disabled = false; return; }
        saqla.textContent = `Saqlanmoqda… ${Math.min(i + 200, topilgan.length)} / ${topilgan.length}`;
      }
      tayyor();
    });
    oldin.appendChild(saqla);
  };
  fayl.addEventListener("change", async () => {
    const f = fayl.files[0];
    if (!f) return;
    xabar.textContent = "Fayl o'qilmoqda…";
    try { topilgan = await fayldanSavollar(f); korsat(); }
    catch (e) { xabar.textContent = "Faylni o'qib bo'lmadi — boshqa formatda saqlab ko'ring (masalan, Word yoki TXT)."; }
  });
  ajrat.addEventListener("click", () => { topilgan = savollarniAjrat(matn.value); korsat(); });
  ichi.append(faylLabel, matn, ajrat, xabar, oldin,
    yarat("p", "kichik-matn", "Excel'da: 1-ustun — savol, keyin A, B, C, D variantlar va to'g'ri javob (yoki 2-ustun — javob)."));
  det.appendChild(ichi);
  return det;
}

// ---------- Natijani yozish ----------
function savolNatijasiniYoz(m, g, N, savol, bildi) {
  const eski = N.get(savol.id) || { quti: 0, togri: 0, xato: 0 };
  const yangi = { savol_id: savol.id, guruh_id: g.id, quti: bildi ? Math.min(5, eski.quti + 1) : 0,
    togri: eski.togri + (bildi ? 1 : 0), xato: eski.xato + (bildi ? 0 : 1), oxirgi: new Date().toISOString() };
  N.set(savol.id, yangi);
  m.from("savol_natijalari").upsert(yangi, { onConflict: "profil_id,savol_id" }).then(() => {});
}

// ---------- Kartochkalar (Leitner qutilari) ----------
function kartochkalar(m, g, savollar, N, tana, egasi) {
  // Tartib: ko'rilmagan va bilinmaganlar oldin, keyin past qutidagilar; bir mashg'ulotda 20 ta
  const navbat = [...savollar].sort((a, b) => {
    const na = N.get(a.id), nb = N.get(b.id);
    const qa = na ? na.quti : -1, qb = nb ? nb.quti : -1;
    return qa - qb || (na ? new Date(na.oxirgi) : 0) - (nb ? new Date(nb.oxirgi) : 0) || Math.random() - 0.5;
  }).slice(0, 20);
  const qaytarilgan = new Set();
  let bildi = 0, bilmadi = 0;
  const chiz = () => {
    tana.innerHTML = "";
    if (!navbat.length) {
      const q = yarat("div", "vik-quti markaz");
      q.append(yarat("p", "katta-belgi", "🎉"), yarat("p", "katta-son", `${bildi} / ${bildi + bilmadi}`), yarat("p", "", "Mashg'ulot tugadi"));
      const yana = yarat("button", "asosiy", "Yana 20 ta"); yana.type = "button";
      yana.addEventListener("click", () => kartochkalar(m, g, savollar, N, tana, egasi));
      const orqa = yarat("button", "ikkilamchi", "Mashq bo'limiga"); orqa.type = "button";
      orqa.addEventListener("click", () => { tana.innerHTML = ""; guruhMashqi(m, g, tana, egasi); });
      q.append(yana, orqa); tana.appendChild(q);
      return;
    }
    const s = navbat[0];
    tana.appendChild(yarat("div", "vik-yuqori kartochka-yuqori", `🃏 Qoldi: ${navbat.length} · ✅ ${bildi} · ❌ ${bilmadi}`));
    const k = yarat("div", "kartochka");
    if (s.mavzu) k.appendChild(yarat("small", "kartochka-mavzu", s.mavzu));
    k.appendChild(yarat("p", "kartochka-savol", s.savol));
    if (s.variantlar) { const u = yarat("ul", "kartochka-variantlar"); s.variantlar.forEach((v, i) => u.appendChild(yarat("li", "", "ABCDEFGH"[i] + ") " + v))); k.appendChild(u); }
    const javob = yarat("div", "kartochka-javob yashirin");
    javob.append(yarat("small", "", "Javob:"), yarat("p", "", s.javob || "Javob kiritilmagan — o'zingiz tekshiring."));
    k.appendChild(javob);
    tana.appendChild(k);
    const tugmalar = yarat("div", "kartochka-tugmalar");
    const kor = yarat("button", "asosiy", "Javobni ko'rish"); kor.type = "button";
    const yoq = yarat("button", "kartochka-yoq yashirin", "❌ Bilmadim"); yoq.type = "button";
    const ha = yarat("button", "kartochka-ha yashirin", "✅ Bildim"); ha.type = "button";
    kor.addEventListener("click", () => { javob.classList.remove("yashirin"); kor.classList.add("yashirin"); yoq.classList.remove("yashirin"); ha.classList.remove("yashirin"); });
    ha.addEventListener("click", () => { savolNatijasiniYoz(m, g, N, s, true); bildi++; navbat.shift(); chiz(); });
    yoq.addEventListener("click", () => {
      savolNatijasiniYoz(m, g, N, s, false); bilmadi++; navbat.shift();
      if (!qaytarilgan.has(s.id)) { qaytarilgan.add(s.id); navbat.splice(Math.min(navbat.length, 4), 0, s); }   // biroz keyin yana chiqadi
      chiz();
    });
    tugmalar.append(kor, yoq, ha);
    tana.appendChild(tugmalar);
    const chiq = yarat("button", "matn-tugma", "Tugatish"); chiq.type = "button";
    chiq.addEventListener("click", () => { navbat.length = 0; chiz(); });
    tana.appendChild(chiq);
  };
  chiz();
  tana.scrollIntoView({ block: "start" });
}

// ---------- Test ----------
// Variantli savollar o'zicha; qisqa javobli savollarga boshqa savollarning javoblaridan variant yasaladi
function testUchunSavollar(S) {
  const qisqaJavoblar = [...new Set(S.filter((s) => s.javob && !s.variantlar && s.javob.length <= 140).map((s) => s.javob))];
  return S.filter((s) => s.javob && (s.variantlar || (s.javob.length <= 140 && qisqaJavoblar.length >= 4))).map((s) => ({
    s, variantlar: s.variantlar ? aralashtir([...s.variantlar], Math.random)
      : aralashtir([s.javob, ...aralashtir(qisqaJavoblar.filter((j) => j !== s.javob), Math.random).slice(0, 3)], Math.random),
  }));
}

function mashqTesti(m, g, S, N, tana, egasi, soni, soniya = 30) {
  const tanlov = aralashtir(testUchunSavollar(S), Math.random).slice(0, soni);
  const xatolar = [];
  const sahifaId = "guruhlarSahifa";
  adab = {
    k: "mashq", belgi: "✅", savollar: tanlov.map((t) => ({ savol: t.s.savol, togri: t.s.javob, variantlar: t.variantlar, _s: t.s })),
    i: 0, ball: 0, togri: 0, sahifaId, soniya,
    javobda: (sv, togri) => { savolNatijasiniYoz(m, g, N, sv._s, togri); if (!togri) xatolar.push(sv); },
    yakun: () => {
      const s = $(sahifaId);
      s.innerHTML = "";
      s.appendChild(havola("#guruh/" + g.id, "orqaga", "← " + g.nom));
      const n = adab.savollar.length, f = Math.round((adab.togri / n) * 100);
      const q = yarat("div", "vik-quti markaz");
      q.append(yarat("p", "katta-belgi", f >= 90 ? "🏆" : f >= 70 ? "🎉" : f >= 50 ? "👍" : "📖"),
        yarat("p", "katta-son", `${adab.togri} / ${n}`), yarat("p", "", `${f}% to'g'ri`));
      const yana = yarat("button", "asosiy", "Yana test"); yana.type = "button";
      yana.addEventListener("click", () => mashqTesti(m, g, S, N, tana, egasi, soni, soniya));
      const orqa = havola("#guruh/" + g.id, "ikkilamchi", "Mashq bo'limiga");
      q.append(yana, orqa);
      s.appendChild(q);
      if (xatolar.length) {
        const det = yarat("details", "qiyin-savollar"); det.open = true;
        det.appendChild(yarat("summary", "", `Xato qilingan savollar (${xatolar.length})`));
        xatolar.forEach((sv) => { const p = yarat("p", ""); p.append(yarat("span", "", sv.savol + " "), yarat("b", "", "→ " + sv.togri)); det.appendChild(p); });
        s.appendChild(det);
      }
    },
  };
  guruhHolati.tab = "mashq";
  adabiyotSavoli();
}

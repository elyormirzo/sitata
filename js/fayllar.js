// ===== KITOB FAYLLARI: yuklash va saytning o'zida o'qish =====
// Ombor: Supabase Storage «kitoblar» (maxfiy, har bir fayl ≤ 50 MB, foydalanuvchiga 30 tagacha, istalgan format).
// Saytda ochiladi: PDF, EPUB, FB2, TXT, audio. Qolganlari (MOBI, AZW3, DJVU, DOCX, ...) — yuklab olinadi.

const FAYL_CHEGARA = 50 * 1024 * 1024;
const EPUB_SKRIPTLAR = [
  "https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js",
  "https://cdn.jsdelivr.net/npm/epubjs@0.3.93/dist/epub.min.js",
];
const PDFJS = "https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/legacy/build/";
const AUDIO_TURLAR = ["mp3", "m4a", "m4b", "aac", "ogg", "oga", "opus", "wav", "flac", "webm"];

const kengaytma = (nom) => (String(nom).match(/\.([a-z0-9]{1,8})$/i) || [])[1]?.toLowerCase() || "";
function faylTuri(nom) {
  const k = kengaytma(nom);
  if (k === "pdf") return "pdf";
  if (k === "epub") return "epub";
  if (k === "fb2") return "fb2";
  if (k === "txt" || k === "md") return "txt";
  if (AUDIO_TURLAR.includes(k)) return "audio";
  return "yuklab";
}
function hajmMatni(b) {
  if (b == null) return "";
  if (b < 1024 * 1024) return Math.max(1, Math.round(b / 1024)) + " KB";
  return (b / 1024 / 1024).toFixed(b < 10 * 1024 * 1024 ? 1 : 0) + " MB";
}
// "Otkan_kunlar-Qodiriy.pdf" → "Otkan kunlar Qodiriy"
const fayldanNom = (nom) => String(nom).replace(/\.[^.]+$/, "").replace(/[_\-.]+/g, " ").replace(/\s+/g, " ").trim().slice(0, 120);

// Faylni yuklab, javondagi kitobga biriktirish (eski fayl bo'lsa — o'chiriladi)
async function faylniBiriktir(m, kitob, fayl) {
  if (fayl.size > FAYL_CHEGARA) throw new Error("katta");
  const uid = await kirish();
  const k = kengaytma(fayl.name);
  const yol = `${uid}/${crypto.randomUUID()}${k ? "." + k : ""}`;
  const { error } = await m.storage.from("kitoblar").upload(yol, fayl, {
    contentType: fayl.type || "application/octet-stream", upsert: false, cacheControl: "3600",
  });
  if (error) throw new Error(/row-level|policy|403/i.test(error.message || "") ? "chegara" : "yuklanmadi");
  const { error: e2 } = await m.from("kitob_javoni").update({
    fayl_yoli: yol, fayl_nomi: fayl.name.slice(0, 200), fayl_hajmi: fayl.size, fayl_turi: (fayl.type || "").slice(0, 100) || null,
  }).eq("id", kitob.id);
  if (e2) { await m.storage.from("kitoblar").remove([yol]); throw new Error("yuklanmadi"); }
  if (kitob.fayl_yoli) await m.storage.from("kitoblar").remove([kitob.fayl_yoli]);
}

async function faylniOlibTashla(m, kitob) {
  if (!kitob.fayl_yoli) return;
  await m.storage.from("kitoblar").remove([kitob.fayl_yoli]);
  await m.from("kitob_javoni").update({ fayl_yoli: null, fayl_nomi: null, fayl_hajmi: null, fayl_turi: null }).eq("id", kitob.id);
}

const faylXatosi = (e) => ({
  katta: "Fayl 50 MB dan katta — kichikroq faylni tanlang.",
  chegara: "Fayllar soni chegarasiga yetdingiz (30 ta). Keraksizlarini olib tashlang.",
}[e.message] || "Fayl yuklanmadi — internetni tekshirib, qayta urinib ko'ring.");

// Kitob kartasidagi fayl qatori
function faylQatori(m, k, yangila) {
  const q = yarat("div", "fayl-qator");
  const xabar = yarat("span", "kichik-matn");
  if (k.fayl_yoli) {
    const tur = faylTuri(k.fayl_nomi || k.fayl_yoli);
    q.appendChild(yarat("span", "fayl-belgi", `📄 ${(kengaytma(k.fayl_nomi || k.fayl_yoli) || "fayl").toUpperCase()} · ${hajmMatni(k.fayl_hajmi)}`));
    const och = yarat("button", "amal tanlangan", tur === "audio" ? "▶ Tinglash" : tur === "yuklab" ? "⬇ Yuklab olish" : "📖 O'qish"); och.type = "button";
    och.addEventListener("click", () => oquvchiniOch(m, k));
    const ol = yarat("button", "matn-tugma", "faylni olib tashlash"); ol.type = "button";
    ol.addEventListener("click", async () => {
      if (!confirm("Faylni o'chirasizmi? Kitob javonda qoladi.")) return;
      await faylniOlibTashla(m, k); yangila();
    });
    q.append(och, ol);
  } else {
    const kirit = yarat("input"); kirit.type = "file"; kirit.className = "yashirin";
    const tanla = yarat("button", "matn-tugma", "📎 Kitob faylini biriktirish"); tanla.type = "button";
    tanla.addEventListener("click", () => kirit.click());
    kirit.addEventListener("change", async () => {
      const f = kirit.files[0]; if (!f) return;
      tanla.disabled = true; xabar.textContent = "Yuklanmoqda…";
      try { await faylniBiriktir(m, k, f); yangila(); }
      catch (e) { tanla.disabled = false; xabar.textContent = faylXatosi(e); }
    });
    q.append(tanla, kirit);
  }
  q.appendChild(xabar);
  return q;
}

// ---------- O'quvchi oynasi ----------
let epubKitob = null;

function oquvchiniYop() {
  const o = $("oquvchi");
  if (o) o.remove();
  if (epubKitob) { try { epubKitob.destroy(); } catch (e) {} epubKitob = null; }
  document.body.classList.remove("oquvchi-ochiq");
  document.removeEventListener("keydown", oquvchiTugmalari);
  document.removeEventListener("keydown", himoyaTugmalari);
}
function oquvchiTugmalari(e) {
  if (e.key === "Escape") oquvchiniYop();
  if (epubKitob && epubKitob.rendition) {
    if (e.key === "ArrowRight") epubKitob.rendition.next();
    if (e.key === "ArrowLeft") epubKitob.rendition.prev();
  }
}

// himoya: kitobdosh birga o'qishda ochganda — yuklab olish yo'q, nusxalash va saqlash bloklangan, ekranda @taxallus belgisi
const oquvchiBloki = (e) => e.preventDefault();
function himoyaTugmalari(e) {
  if ((e.ctrlKey || e.metaKey) && ["s", "p", "c", "a", "x"].includes(e.key.toLowerCase())) e.preventDefault();
}

async function oquvchiniOch(m, k, opts = {}) {
  oquvchiniYop();
  const himoya = !!opts.himoya;
  const tur = faylTuri(k.fayl_nomi || k.fayl_yoli);
  const o = yarat("div", "oquvchi" + (himoya ? " himoyali" : "")); o.id = "oquvchi";
  o.setAttribute("role", "dialog"); o.setAttribute("aria-label", k.kitob);
  const bosh = yarat("div", "oquvchi-bosh");
  const yop = yarat("button", "oquvchi-yop", "✕"); yop.type = "button"; yop.setAttribute("aria-label", "Yopish");
  yop.addEventListener("click", oquvchiniYop);
  const yuklab = yarat("a", "matn-tugma", "⬇ Yuklab olish"); yuklab.target = "_blank"; yuklab.rel = "noopener";
  bosh.append(yarat("b", "", k.kitob), ...(himoya ? [yarat("span", "himoya-belgi", "🔒 faqat o'qish")] : [yuklab]), yop);
  const tana = yarat("div", "oquvchi-tana");
  tana.appendChild(yarat("p", "bosh-holat", "Yuklanmoqda…"));
  o.append(bosh, tana);
  if (himoya) {
    ["contextmenu", "copy", "cut", "dragstart", "selectstart"].forEach((t) => o.addEventListener(t, oquvchiBloki));
    document.addEventListener("keydown", himoyaTugmalari);
    const suv = yarat("div", "suv-belgi"); suv.setAttribute("aria-hidden", "true");
    const yozuv = (mening && mening.taxallus ? "@" + mening.taxallus : (mening ? mening.ism : "")) + " · sitata.uz";
    for (let i = 0; i < 24; i++) suv.appendChild(yarat("span", "", yozuv));
    o.appendChild(suv);
  }
  document.body.appendChild(o);
  document.body.classList.add("oquvchi-ochiq");
  document.addEventListener("keydown", oquvchiTugmalari);

  const [{ data: korish }, { data: yuklash }] = await Promise.all([
    m.storage.from("kitoblar").createSignedUrl(k.fayl_yoli, himoya ? 300 : 3600),
    himoya ? Promise.resolve({ data: null }) : m.storage.from("kitoblar").createSignedUrl(k.fayl_yoli, 3600, { download: k.fayl_nomi || true }),
  ]);
  if (!korish) { tana.innerHTML = ""; tana.appendChild(yarat("p", "bosh-holat", "Faylni ochib bo'lmadi.")); return; }
  yuklab.href = yuklash ? yuklash.signedUrl : korish.signedUrl;
  tana.innerHTML = "";
  try {
    if (tur === "pdf") {
      await pdfniChiz(tana, korish.signedUrl, k.id);
    } else if (tur === "audio") {
      const a = yarat("audio", "oquvchi-audio"); a.controls = true; a.src = korish.signedUrl; a.preload = "metadata";
      a.setAttribute("controlsList", "nodownload noplaybackrate"); a.addEventListener("contextmenu", oquvchiBloki);
      const kalit = "sitataAudio:" + k.id;
      a.addEventListener("loadedmetadata", () => { const t = xotiradanOl(kalit, 0); if (t) a.currentTime = t; });
      a.addEventListener("timeupdate", () => { if (Math.round(a.currentTime) % 5 === 0) xotiragaYoz(kalit, a.currentTime); });
      const q = yarat("div", "oquvchi-audio-quti");
      q.append(muqovaEl(k.kitob), yarat("b", "", k.kitob), yarat("span", "kichik-matn", k.muallif || ""), a);
      tana.appendChild(q);
    } else if (tur === "txt" || tur === "fb2") {
      const buf = await (await fetch(korish.signedUrl)).arrayBuffer();
      const matn = matnniOch(buf);
      tana.appendChild(tur === "fb2" ? fb2niChiz(matn) : txtniChiz(matn));
      oqishJoyiniTikla(tana, k.id);
    } else if (tur === "epub") {
      await epubniChiz(tana, korish.signedUrl, k.id, himoya);
    } else {
      const q = yarat("div", "vik-quti markaz");
      q.append(yarat("p", "katta-belgi", "📄"),
        yarat("p", "", `«${(kengaytma(k.fayl_nomi) || "bu").toUpperCase()}» formatini brauzer ochib bera olmaydi.`),
        yarat("p", "kichik-matn", "Yuklab oling va telefoningiz yoki kompyuteringizdagi o'qish ilovasida oching."));
      if (!himoya) q.appendChild(havola(yuklab.href, "asosiy", "⬇ Yuklab olish"));
      tana.appendChild(q);
    }
  } catch (e) {
    tana.innerHTML = "";
    tana.append(yarat("p", "bosh-holat", "Faylni o'qib bo'lmadi — yuklab olib, boshqa ilovada oching."));
  }
}

// Matn kodirovkasini aniqlash: XML sarlavhasidagi encoding, bo'lmasa UTF-8, juda ko'p xato bo'lsa — windows-1251
function matnniOch(buf) {
  const bosh = new TextDecoder("ascii").decode(buf.slice(0, 200));
  const enc = (bosh.match(/encoding=["']([\w-]+)["']/i) || [])[1];
  if (enc) { try { return new TextDecoder(enc.toLowerCase()).decode(buf); } catch (e) {} }
  const utf = new TextDecoder("utf-8").decode(buf);
  const xato = (utf.match(/�/g) || []).length;
  if (xato > utf.length / 200) { try { return new TextDecoder("windows-1251").decode(buf); } catch (e) {} }
  return utf;
}

function txtniChiz(matn) {
  const q = yarat("div", "oquvchi-matn");
  matn.split(/\n\s*\n/).forEach((x) => { if (x.trim()) q.appendChild(yarat("p", "", x.trim())); });
  return q;
}

// FB2 (XML) → xavfsiz DOM (faqat matn elementlari, HTML qo'yilmaydi)
function fb2niChiz(matn) {
  const q = yarat("div", "oquvchi-matn");
  const xml = new DOMParser().parseFromString(matn, "application/xml");
  const body = xml.getElementsByTagName("body")[0];
  if (!body) return txtniChiz(matn.replace(/<[^>]+>/g, " "));
  const yur = (tugun, ota) => {
    for (const t of tugun.childNodes) {
      if (t.nodeType === 3) { if (t.nodeValue.trim()) ota.appendChild(document.createTextNode(t.nodeValue)); continue; }
      if (t.nodeType !== 1) continue;
      const nom = t.localName;
      let el = null;
      if (nom === "title") el = yarat("h3", "fb2-sarlavha");
      else if (nom === "subtitle") el = yarat("h4");
      else if (nom === "p" || nom === "v" || nom === "text-author") el = yarat("p", nom === "v" ? "sher" : "");
      else if (nom === "emphasis") el = yarat("em");
      else if (nom === "strong") el = yarat("strong");
      else if (nom === "epigraph" || nom === "cite") el = yarat("blockquote", "fb2-iqtibos");
      else if (nom === "stanza") el = yarat("div", "fb2-band");
      else if (nom === "empty-line") { ota.appendChild(yarat("br")); continue; }
      else if (nom === "image" || nom === "binary") continue;
      if (el) { yur(t, el); ota.appendChild(el); } else yur(t, ota);   // section, poem va boshqalar — ichini chizamiz
    }
  };
  yur(body, q);
  return q;
}

// Matnli kitoblarda qayergacha o'qilganini eslab qolish
function oqishJoyiniTikla(tana, id) {
  const kalit = "sitataOqish:" + id;
  requestAnimationFrame(() => { tana.scrollTop = xotiradanOl(kalit, 0); });
  let kech = null;
  tana.addEventListener("scroll", () => { clearTimeout(kech); kech = setTimeout(() => xotiragaYoz(kalit, tana.scrollTop), 300); });
}

async function epubniChiz(tana, url, id, himoya) {
  for (const src of EPUB_SKRIPTLAR) {
    if (src.includes("jszip") && window.JSZip) continue;
    if (src.includes("epub") && window.ePub) continue;
    await skriptYukla(src);
  }
  const buf = await (await fetch(url)).arrayBuffer();
  const joy = yarat("div", "oquvchi-epub"); tana.appendChild(joy);
  const pastki = yarat("div", "oquvchi-boshqaruv");
  const orqa = yarat("button", "kalendar-tugma", "‹"); orqa.type = "button"; orqa.setAttribute("aria-label", "Oldingi sahifa");
  const old = yarat("button", "kalendar-tugma", "›"); old.type = "button"; old.setAttribute("aria-label", "Keyingi sahifa");
  const joyMatn = yarat("span", "kichik-matn", "");
  pastki.append(orqa, joyMatn, old); tana.appendChild(pastki);
  epubKitob = window.ePub(buf);
  const r = epubKitob.renderTo(joy, { width: "100%", height: "100%", flow: "paginated", spread: "none" });
  epubKitob.rendition = r;
  r.themes.default({ body: { "font-family": "Lora, Georgia, serif !important", "line-height": "1.6", color: "#3B2A1A", background: "#FBF5E6" } });
  if (himoya) {
    r.themes.default({ body: { "-webkit-user-select": "none", "user-select": "none", "-webkit-touch-callout": "none" } });
    r.hooks.content.register((c) => ["contextmenu", "copy", "cut", "dragstart", "selectstart"].forEach((t) => c.document.addEventListener(t, oquvchiBloki)));
  }
  const kalit = "sitataEpub:" + id;
  await r.display(xotiradanOl(kalit, undefined) || undefined);
  r.on("relocated", (loc) => {
    xotiragaYoz(kalit, loc.start.cfi);
    if (loc.start.displayed) joyMatn.textContent = `${loc.start.displayed.page} / ${loc.start.displayed.total}`;
  });
  orqa.addEventListener("click", () => r.prev());
  old.addEventListener("click", () => r.next());
  // Telefonda surib varaqlash
  let x0 = null;
  r.on("touchstart", (e) => { x0 = e.changedTouches[0].screenX; });
  r.on("touchend", (e) => { if (x0 == null) return; const d = e.changedTouches[0].screenX - x0; if (Math.abs(d) > 50) (d < 0 ? r.next() : r.prev()); x0 = null; });
}

// PDF: PDF.js bilan sahifalarni chizamiz (telefondagi brauzerlar ichki PDF ko'ruvchisiga ega emas).
// Sahifalar ekranga yaqinlashganda chiziladi; qayergacha o'qilgani eslab qolinadi.
async function pdfniChiz(tana, url, id) {
  if (!window.pdfjsLib) await skriptYukla(PDFJS + "pdf.min.js");
  window.pdfjsLib.GlobalWorkerOptions.workerSrc = PDFJS + "pdf.worker.min.js";
  const data = new Uint8Array(await (await fetch(url)).arrayBuffer());
  const hujjat = await window.pdfjsLib.getDocument({ data }).promise;
  const quti = yarat("div", "oquvchi-pdf-sahifalar");
  tana.appendChild(quti);
  const kenglik = Math.min(tana.clientWidth - 16, 900);
  const birinchi = await hujjat.getPage(1);
  const v1 = birinchi.getViewport({ scale: 1 });
  const nisbat = v1.height / v1.width;
  const sahifalar = [];
  for (let n = 1; n <= hujjat.numPages; n++) {
    const s = yarat("div", "pdf-sahifa"); s.style.height = Math.round(kenglik * nisbat) + "px"; s.style.width = kenglik + "px"; s.dataset.n = n;
    s.appendChild(yarat("span", "pdf-raqam", `${n} / ${hujjat.numPages}`));
    quti.appendChild(s); sahifalar.push(s);
  }
  const chizilgan = new Set();
  const chiz = async (s) => {
    const n = Number(s.dataset.n); if (chizilgan.has(n)) return; chizilgan.add(n);
    const sahifa = await hujjat.getPage(n);
    const v = sahifa.getViewport({ scale: 1 });
    const zichlik = Math.min(window.devicePixelRatio || 1, 2);
    const masshtab = (kenglik / v.width) * zichlik;
    const vp = sahifa.getViewport({ scale: masshtab });
    const c = yarat("canvas"); c.width = vp.width; c.height = vp.height; c.style.width = "100%";
    s.style.height = "auto";
    await sahifa.render({ canvasContext: c.getContext("2d"), viewport: vp }).promise;
    s.insertBefore(c, s.firstChild);
  };
  const kuzatuvchi = new IntersectionObserver((yozuvlar) => yozuvlar.forEach((y) => { if (y.isIntersecting) chiz(y.target); }),
    { root: tana, rootMargin: "800px 0px" });
  sahifalar.forEach((s) => kuzatuvchi.observe(s));
  oqishJoyiniTikla(tana, id);
}

// ===== FAYLDAN KITOB NOMI VA MUALLIFINI ANIQLASH =====
// EPUB (OPF), FB2, PDF (xossalar), MOBI/AZW3 (EXTH), DOCX (core.xml), MP3 (ID3v2), qolganlari — fayl nomidan.
const tozaMatn = (t) => String(t || "").replace(/\s+/g, " ").trim().slice(0, 120);

async function jszipOl() { if (!window.JSZip) await skriptYukla(EPUB_SKRIPTLAR[0]); return window.JSZip; }

function xmlMatni(xml, ...teglar) {
  for (const t of teglar) {
    const el = xml.getElementsByTagNameNS("*", t)[0] || xml.getElementsByTagName(t)[0];
    if (el && el.textContent.trim()) return el.textContent;
  }
  return "";
}

async function epubMalumoti(fayl) {
  const zip = await (await jszipOl()).loadAsync(fayl);
  const container = await zip.file("META-INF/container.xml")?.async("string");
  const opfYol = container && (container.match(/full-path="([^"]+)"/) || [])[1];
  const opf = opfYol && await zip.file(opfYol)?.async("string");
  if (!opf) return {};
  const x = new DOMParser().parseFromString(opf, "application/xml");
  return { kitob: xmlMatni(x, "title"), muallif: xmlMatni(x, "creator") };
}

async function docxMalumoti(fayl) {
  const zip = await (await jszipOl()).loadAsync(fayl);
  const core = await zip.file("docProps/core.xml")?.async("string");
  if (!core) return {};
  const x = new DOMParser().parseFromString(core, "application/xml");
  return { kitob: xmlMatni(x, "title"), muallif: xmlMatni(x, "creator") };
}

async function fb2Malumoti(fayl) {
  const matn = matnniOch(await fayl.slice(0, 200000).arrayBuffer());
  const x = new DOMParser().parseFromString(matn.replace(/<binary[\s\S]*$/, "</FictionBook>"), "application/xml");
  const ti = x.getElementsByTagName("title-info")[0] || x;
  const a = ti.getElementsByTagName("author")[0];
  const muallif = a ? ["first-name", "middle-name", "last-name"].map((t) => (a.getElementsByTagName(t)[0] || {}).textContent || "").filter(Boolean).join(" ") : "";
  return { kitob: (ti.getElementsByTagName("book-title")[0] || {}).textContent || "", muallif };
}

async function pdfMalumoti(fayl) {
  if (!window.pdfjsLib) await skriptYukla(PDFJS + "pdf.min.js");
  window.pdfjsLib.GlobalWorkerOptions.workerSrc = PDFJS + "pdf.worker.min.js";
  const h = await window.pdfjsLib.getDocument({ data: new Uint8Array(await fayl.arrayBuffer()) }).promise;
  const { info } = await h.getMetadata();
  h.destroy();
  return { kitob: info && info.Title, muallif: info && info.Author };
}

// MOBI/AZW3: PalmDB → 0-yozuv → MOBI sarlavhasi → EXTH (100 — muallif, 503 — nom) yoki to'liq nom
async function mobiMalumoti(fayl) {
  const buf = await fayl.slice(0, 300000).arrayBuffer();
  const v = new DataView(buf);
  const r0 = v.getUint32(78);
  if (String.fromCharCode(...new Uint8Array(buf, r0 + 16, 4)) !== "MOBI") return {};
  const mobiUzun = v.getUint32(r0 + 20), kodlash = v.getUint32(r0 + 28) === 65001 ? "utf-8" : "windows-1252";
  const dek = new TextDecoder(kodlash);
  const natija = {};
  const nomJoy = v.getUint32(r0 + 84), nomUzun = v.getUint32(r0 + 88);
  if (nomUzun && r0 + nomJoy + nomUzun <= buf.byteLength) natija.kitob = dek.decode(new Uint8Array(buf, r0 + nomJoy, nomUzun));
  if (v.getUint32(r0 + 128) & 0x40) {
    let p = r0 + 16 + mobiUzun;
    if (String.fromCharCode(...new Uint8Array(buf, p, 4)) === "EXTH") {
      const soni = v.getUint32(p + 8); p += 12;
      for (let i = 0; i < soni && p + 8 <= buf.byteLength; i++) {
        const tur = v.getUint32(p), uz = v.getUint32(p + 4);
        const qiymat = dek.decode(new Uint8Array(buf, p + 8, Math.max(0, uz - 8)));
        if (tur === 100 && !natija.muallif) natija.muallif = qiymat;
        if (tur === 503) natija.kitob = qiymat;
        p += uz;
      }
    }
  }
  return natija;
}

// MP3: ID3v2.3/2.4 — TIT2 (nom), TPE1 (ijrochi/muallif)
async function mp3Malumoti(fayl) {
  const buf = await fayl.slice(0, 256000).arrayBuffer();
  const b = new Uint8Array(buf);
  if (String.fromCharCode(b[0], b[1], b[2]) !== "ID3") return {};
  const versiya = b[3];
  const hajm = ((b[6] & 0x7f) << 21) | ((b[7] & 0x7f) << 14) | ((b[8] & 0x7f) << 7) | (b[9] & 0x7f);
  const natija = {};
  let p = 10;
  while (p + 10 < Math.min(hajm + 10, b.length)) {
    const id = String.fromCharCode(b[p], b[p + 1], b[p + 2], b[p + 3]);
    if (!/^[A-Z0-9]{4}$/.test(id)) break;
    const uz = versiya === 4 ? ((b[p + 4] & 0x7f) << 21) | ((b[p + 5] & 0x7f) << 14) | ((b[p + 6] & 0x7f) << 7) | (b[p + 7] & 0x7f)
      : (b[p + 4] << 24) | (b[p + 5] << 16) | (b[p + 6] << 8) | b[p + 7];
    if (id === "TIT2" || id === "TPE1") {
      const enc = b[p + 10], baytlar = b.slice(p + 11, p + 10 + uz);
      const dek = enc === 1 ? "utf-16" : enc === 2 ? "utf-16be" : enc === 3 ? "utf-8" : "windows-1252";
      const q = new TextDecoder(dek).decode(baytlar).replace(/\u0000/g, "");
      if (id === "TIT2") natija.kitob = q; else natija.muallif = q;
    }
    p += 10 + uz;
  }
  return natija;
}

// Fayl nomidan: "Muallif - Kitob", "Kitob (Muallif)", "Kitob_by_Muallif"
function nomdanMalumot(nom) {
  const t = fayldanNom(nom);
  const n = String(nom).replace(/\.[^.]+$/, "").replace(/_/g, " ");
  const juft = n.split(/\s+[-–—]\s+/);
  if (juft.length === 2) {
    const [a, b] = juft.map(tozaMatn);
    const muallifMi = (s) => !!MUALLIFLAR[s] || /^[A-ZА-ЯЎҚҒҲ][\wʻ'’]+\s+[A-ZА-ЯЎҚҒҲ][\wʻ'’]+$/.test(s);
    return muallifMi(a) && !muallifMi(b) ? { muallif: a, kitob: b } : { kitob: a, muallif: b };
  }
  const qavs = n.match(/^(.+?)\s*\(([^)]+)\)\s*$/);
  if (qavs) return { kitob: tozaMatn(qavs[1]), muallif: tozaMatn(qavs[2]) };
  return { kitob: t };
}

async function faylMalumoti(fayl) {
  const k = kengaytma(fayl.name);
  let m = {};
  try {
    if (k === "epub") m = await epubMalumoti(fayl);
    else if (k === "fb2") m = await fb2Malumoti(fayl);
    else if (k === "pdf") m = await pdfMalumoti(fayl);
    else if (["mobi", "azw", "azw3", "prc"].includes(k)) m = await mobiMalumoti(fayl);
    else if (k === "docx") m = await docxMalumoti(fayl);
    else if (k === "mp3") m = await mp3Malumoti(fayl);
  } catch (e) { m = {}; }
  const nomdan = nomdanMalumot(fayl.name);
  let kitob = tozaMatn(m.kitob), muallif = tozaMatn(m.muallif);
  // PDF va DOCX xossalarida ko'pincha keraksiz qiymat bo'ladi ("Microsoft Word - ...", "Untitled", foydalanuvchi nomi)
  if (/^(untitled|document\d*|microsoft word.*|без названия|новый документ.*)$/i.test(kitob) || /\.(docx?|pdf|indd)$/i.test(kitob)) kitob = "";
  if (/^(user|admin|author|unknown|пользователь|windows user)$/i.test(muallif)) muallif = "";
  // Muallif bir nechta bo'lsa (";" yoki "&") — birinchisi
  muallif = muallif.split(/\s*[;&]\s*/)[0];
  // Ro'yxatdagi kitob bo'lsa — muallifni ro'yxatdan olamiz
  const royxatda = KITOBLAR.find((x) => x.nom.toLowerCase() === (kitob || nomdan.kitob || "").toLowerCase());
  return {
    kitob: kitob || nomdan.kitob || "",
    muallif: muallif || (royxatda && royxatda.muallif) || nomdan.muallif || "",
    manba: kitob || muallif ? "fayl" : "nom",
  };
}

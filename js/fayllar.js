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

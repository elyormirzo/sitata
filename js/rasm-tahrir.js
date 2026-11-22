// ===== IQTIBOS RASMI MUHARRIRI =====
// Kitob sahifasining surati: 1) qirqish (va burish), 2) belgilash (marker / ruchka), 3) bezash (filtr, ramka).
// rasmTahrirchisi(fayl, {sarlavha}) → Promise<Blob|null> (JPEG, uzun tomoni ≤ 1400px)

const TAHRIR_RANGLAR = {
  marker: [["#FFE14D", "sariq"], ["#9BE58A", "yashil"], ["#FF9EC7", "pushti"], ["#8FD3FF", "ko'k"]],
  ruchka: [["#C62828", "qizil"], ["#1E5AA8", "ko'k"], ["#2B2B2B", "qora"]],
};
const TAHRIR_FILTRLAR = [["asl", "Asl"], ["qogoz", "Qog'oz"], ["oqqora", "Oq-qora"], ["yorqin", "Yorqin"]];
const TAHRIR_RAMKALAR = [["yoq", "Ramkasiz"], ["qogoz", "Varaq"], ["kitob", "Teri muqova"], ["polaroid", "Polaroid"]];

async function rasmniOch(fayl) {
  const url = URL.createObjectURL(fayl);
  try {
    const img = await new Promise((ok, xato) => { const i = new Image(); i.onload = () => ok(i); i.onerror = xato; i.src = url; });
    // Katta suratlarni (12 MP) xotira uchun 2200px gacha kichraytiramiz
    const k = Math.min(1, 2200 / Math.max(img.naturalWidth, img.naturalHeight));
    const c = document.createElement("canvas");
    c.width = Math.round(img.naturalWidth * k); c.height = Math.round(img.naturalHeight * k);
    c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
    return c;
  } finally { URL.revokeObjectURL(url); }
}

function burilgan(manba, burchak) {
  if (!burchak) return manba;
  const c = document.createElement("canvas");
  const yon = burchak % 180 !== 0;
  c.width = yon ? manba.height : manba.width; c.height = yon ? manba.width : manba.height;
  const x = c.getContext("2d");
  x.translate(c.width / 2, c.height / 2); x.rotate((burchak * Math.PI) / 180);
  x.drawImage(manba, -manba.width / 2, -manba.height / 2);
  return c;
}

// Filtrlar — piksellar ustida (Safari'da ctx.filter ishlamaydi)
function filtrQol(x, w, h, filtr) {
  if (filtr === "asl") return;
  const d = x.getImageData(0, 0, w, h), p = d.data;
  for (let i = 0; i < p.length; i += 4) {
    let r = p[i], g = p[i + 1], b = p[i + 2];
    if (filtr === "oqqora" || filtr === "qogoz") {
      const y = 0.299 * r + 0.587 * g + 0.114 * b;
      if (filtr === "oqqora") { const v = Math.min(255, Math.max(0, (y - 128) * 1.25 + 135)); r = g = b = v; }
      else { const v = Math.min(255, y * 1.08 + 8); r = v * 1.0 + 6; g = v * 0.93 + 4; b = v * 0.78; }
    } else if (filtr === "yorqin") {
      r = (r - 128) * 1.2 + 140; g = (g - 128) * 1.2 + 140; b = (b - 128) * 1.2 + 140;
    }
    p[i] = r; p[i + 1] = g; p[i + 2] = b;
  }
  x.putImageData(d, 0, 0);
}

function chiziqlarniChiz(x, chiziqlar, w, h) {
  chiziqlar.forEach((ch) => {
    if (ch.nuqtalar.length < 2) return;
    x.save();
    x.lineCap = "round"; x.lineJoin = "round";
    x.strokeStyle = ch.rang;
    if (ch.asbob === "marker") { x.globalCompositeOperation = "multiply"; x.globalAlpha = 0.55; x.lineWidth = ch.qalinlik * w; x.lineCap = "butt"; }
    else { x.lineWidth = Math.max(2, ch.qalinlik * w); }
    x.beginPath();
    ch.nuqtalar.forEach(([px, py], i) => (i ? x.lineTo(px * w, py * h) : x.moveTo(px * w, py * h)));
    x.stroke();
    x.restore();
  });
}

// Qirqilgan + belgilangan + filtrli rasm (ramkasiz)
function ichkiRasm(h, maxTomon) {
  const m = h.aylangan;
  const sx = h.qirq.x * m.width, sy = h.qirq.y * m.height, sw = h.qirq.w * m.width, sh = h.qirq.h * m.height;
  const k = Math.min(1, maxTomon / Math.max(sw, sh));
  const c = document.createElement("canvas");
  c.width = Math.max(1, Math.round(sw * k)); c.height = Math.max(1, Math.round(sh * k));
  const x = c.getContext("2d");
  x.drawImage(m, sx, sy, sw, sh, 0, 0, c.width, c.height);
  filtrQol(x, c.width, c.height, h.filtr);
  chiziqlarniChiz(x, h.chiziqlar, c.width, c.height);
  return c;
}

function ramkaliRasm(h, maxTomon) {
  const ich = ichkiRasm(h, maxTomon);
  const w = ich.width, hh = ich.height;
  if (h.ramka === "yoq") return ich;
  const birlik = Math.max(w, hh) / 100;
  const c = document.createElement("canvas");
  const x = c.getContext("2d");
  const imzo = h.sarlavha || "";
  const polaroid = h.ramka === "polaroid";
  const p = birlik * (polaroid ? 4 : h.ramka === "kitob" ? 6 : 5);
  // Izoh: kesilmaydi — so'zlar bo'yicha qatorlarga bo'linadi (3 tagacha), sig'masa harf kichrayadi
  const kenglik = w + p * 2 - p * 2.4;
  const katta = Math.min(birlik * (polaroid ? 4.2 : 3.6), w * 0.066);
  const izoh = imzo ? matnniJoyla(x, imzo, kenglik, katta, Math.max(katta * 0.6, w * 0.028), 3) : null;
  const qatorBal = izoh ? izoh.olcham * 1.3 : 0;
  const imzoBal = izoh ? izoh.qatorlar.length * qatorBal : 0;
  const belgi = polaroid ? Math.min(birlik * 2.6, w * 0.04) : 0;
  const past = polaroid ? Math.max(birlik * 10, imzoBal + belgi * 1.6 + p * 1.6) : imzo ? imzoBal + p * 1.4 : p;
  c.width = w + p * 2; c.height = hh + p + past;
  if (polaroid) {
    x.fillStyle = "#FFFFFF"; x.fillRect(0, 0, c.width, c.height);
    x.drawImage(ich, p, p);
  } else {
    if (h.ramka === "kitob") {
      const g = x.createLinearGradient(0, 0, c.width, c.height); g.addColorStop(0, "#7A4529"); g.addColorStop(1, "#4E2B18");
      x.fillStyle = g; x.fillRect(0, 0, c.width, c.height);
      x.strokeStyle = "#D9B26A"; x.lineWidth = Math.max(2, birlik * 0.5);
      x.strokeRect(p * 0.45, p * 0.45, c.width - p * 0.9, c.height - p * 0.9);
    } else {
      x.fillStyle = "#F6EEDC"; x.fillRect(0, 0, c.width, c.height);
      x.strokeStyle = "#C9B48E"; x.lineWidth = Math.max(1, birlik * 0.25);
      x.strokeRect(p * 0.5, p * 0.5, c.width - p, c.height - p);
    }
    x.save(); x.shadowColor = "rgba(0,0,0,.35)"; x.shadowBlur = birlik * 1.5; x.shadowOffsetY = birlik * 0.4;
    x.drawImage(ich, p, p); x.restore();
  }
  x.textAlign = "center"; x.textBaseline = "middle";
  const blokBal = imzoBal + (polaroid ? belgi * 1.6 : 0);
  let y = hh + p + (past - blokBal) / 2 + qatorBal / 2;
  if (izoh) {
    x.fillStyle = polaroid ? "#3B2A1A" : h.ramka === "kitob" ? "#F3E3BF" : "#5A4330";
    x.font = `italic ${izoh.olcham}px Lora, Georgia, serif`;
    izoh.qatorlar.forEach((q) => { x.fillText(q, c.width / 2, y); y += qatorBal; });
  }
  if (polaroid) {
    x.font = `${Math.round(belgi)}px Lora, Georgia, serif`; x.fillStyle = "#9A8668";
    x.fillText("sitata.uz", c.width / 2, izoh ? y - qatorBal / 2 + belgi * 1.1 : hh + p + past / 2);
  }
  return c;
}

// Matnni kenglikka so'zlar bo'yicha bo'lish: avval katta harf bilan, sig'masa kichraytirib
function matnniJoyla(x, matn, kenglik, katta, kichik, maxQator) {
  const bol = (olcham) => {
    x.font = `italic ${olcham}px Lora, Georgia, serif`;
    const qatorlar = [];
    let q = "";
    for (const soz of matn.split(/\s+/)) {
      const sinov = q ? q + " " + soz : soz;
      if (!q || x.measureText(sinov).width <= kenglik) q = sinov;
      else { qatorlar.push(q); q = soz; }
    }
    if (q) qatorlar.push(q);
    return qatorlar;
  };
  for (let o = katta; o >= kichik; o *= 0.92) {
    const q = bol(Math.round(o));
    if (q.length <= maxQator && q.every((t) => x.measureText(t).width <= kenglik)) return { olcham: Math.round(o), qatorlar: q };
  }
  // Juda uzun bo'lsa — oxirgi qator qisqartiriladi
  const olcham = Math.round(kichik), q = bol(olcham).slice(0, maxQator);
  x.font = `italic ${olcham}px Lora, Georgia, serif`;
  q[q.length - 1] = qisqart(x, q[q.length - 1], kenglik);
  return { olcham, qatorlar: q };
}

function qisqart(x, matn, kenglik) {
  if (x.measureText(matn).width <= kenglik) return matn;
  let t = matn;
  while (t.length > 1 && x.measureText(t + "…").width > kenglik) t = t.slice(0, -1);
  return t + "…";
}

function rasmTahrirchisi(fayl, opts = {}) {
  return new Promise(async (natija) => {
    let manba;
    try { manba = await rasmniOch(fayl); } catch (e) { alert("Bu rasmni ochib bo'lmadi — JPG yoki PNG tanlang."); natija(null); return; }
    const h = { burchak: 0, aylangan: manba, qirq: { x: 0, y: 0, w: 1, h: 1 }, chiziqlar: [], filtr: "asl", ramka: "qogoz",
      sarlavha: opts.sarlavha || "", asbob: "marker", markerQalinlik: 0.04, rang: TAHRIR_RANGLAR.marker[0][0], qadam: 0 };

    const oyna = yarat("div", "tahrir"); oyna.setAttribute("role", "dialog"); oyna.setAttribute("aria-label", "Rasmni tahrirlash");
    const bosh = yarat("div", "tahrir-bosh");
    const bekor = yarat("button", "matn-tugma", "Bekor"); bekor.type = "button";
    const sarlavha = yarat("b", "");
    const keyingi = yarat("button", "kichik", "Keyingi →"); keyingi.type = "button";
    bosh.append(bekor, sarlavha, keyingi);
    const maydon = yarat("div", "tahrir-maydon");
    const oram = yarat("div", "tahrir-oram");
    const kanvas = yarat("canvas", "tahrir-kanvas");
    const qirqQuti = yarat("div", "qirq-quti");
    ["cy", "oy", "cp", "op"].forEach((b) => { const d = yarat("span", "qirq-burchak " + b); d.dataset.b = b; qirqQuti.appendChild(d); });
    oram.append(kanvas, qirqQuti);
    maydon.appendChild(oram);
    const asboblar = yarat("div", "tahrir-asboblar");
    const orqaga = yarat("button", "matn-tugma", "← Orqaga"); orqaga.type = "button";
    oyna.append(bosh, maydon, asboblar);
    document.body.appendChild(oyna);
    document.body.classList.add("oquvchi-ochiq");

    const yop = (blob) => { oyna.remove(); document.body.classList.remove("oquvchi-ochiq"); natija(blob); };
    bekor.addEventListener("click", () => yop(null));

    // Kanvasni ekranga moslash
    const olchamla = (w, hh) => {
      const maxW = maydon.clientWidth - 24, maxH = maydon.clientHeight - 24;
      const k = Math.min(maxW / w, maxH / hh, 1.5);
      kanvas.style.width = Math.round(w * k) + "px"; kanvas.style.height = Math.round(hh * k) + "px";
    };

    const chiz = () => {
      if (h.qadam === 0) {
        const m = h.aylangan;
        const k = Math.min(1, 1200 / Math.max(m.width, m.height));
        kanvas.width = Math.round(m.width * k); kanvas.height = Math.round(m.height * k);
        kanvas.getContext("2d").drawImage(m, 0, 0, kanvas.width, kanvas.height);
        olchamla(kanvas.width, kanvas.height);
        qirqniJoyla();
      } else {
        const c = h.qadam === 1 ? ichkiRasm(h, 1200) : ramkaliRasm(h, 1000);
        kanvas.width = c.width; kanvas.height = c.height;
        kanvas.getContext("2d").drawImage(c, 0, 0);
        olchamla(c.width, c.height);
      }
    };

    const qirqniJoyla = () => {
      const q = h.qirq;
      Object.assign(qirqQuti.style, { left: q.x * 100 + "%", top: q.y * 100 + "%", width: q.w * 100 + "%", height: q.h * 100 + "%" });
    };

    // Qirqish: burchaklarni yoki butun ramkani sudrash
    let sudrash = null;
    const nisbiy = (e) => { const r = kanvas.getBoundingClientRect(); return [(e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height]; };
    qirqQuti.addEventListener("pointerdown", (e) => {
      if (h.qadam !== 0) return;
      e.preventDefault(); qirqQuti.setPointerCapture(e.pointerId);
      sudrash = { b: e.target.dataset.b || "ich", bosh: nisbiy(e), q: { ...h.qirq } };
    });
    qirqQuti.addEventListener("pointermove", (e) => {
      if (!sudrash) return;
      const [px, py] = nisbiy(e), dx = px - sudrash.bosh[0], dy = py - sudrash.bosh[1], q0 = sudrash.q, min = 0.08;
      let { x, y, w, h: hh } = q0;
      const chek = (v) => Math.min(1, Math.max(0, v));
      if (sudrash.b === "ich") { x = Math.min(1 - w, Math.max(0, q0.x + dx)); y = Math.min(1 - hh, Math.max(0, q0.y + dy)); }
      else {
        if (sudrash.b[0] === "c") { const nx = Math.min(chek(q0.x + dx), q0.x + q0.w - min); w = q0.x + q0.w - nx; x = nx; }
        else w = Math.max(min, chek(q0.x + q0.w + dx) - q0.x);
        if (sudrash.b[1] === "y") { const ny = Math.min(chek(q0.y + dy), q0.y + q0.h - min); hh = q0.y + q0.h - ny; y = ny; }
        else hh = Math.max(min, chek(q0.y + q0.h + dy) - q0.y);
      }
      h.qirq = { x, y, w, h: hh }; qirqniJoyla();
    });
    const tugat = () => { sudrash = null; };
    qirqQuti.addEventListener("pointerup", tugat); qirqQuti.addEventListener("pointercancel", tugat);

    // Belgilash: marker — to'g'ri chiziq (matn qatori ustidan), ruchka — erkin
    let joriy = null;
    kanvas.addEventListener("pointerdown", (e) => {
      if (h.qadam !== 1) return;
      e.preventDefault(); kanvas.setPointerCapture(e.pointerId);
      const n = nisbiy(e);
      joriy = { asbob: h.asbob, rang: h.rang, qalinlik: h.asbob === "marker" ? h.markerQalinlik : 0.006, nuqtalar: [n, n] };
      h.chiziqlar.push(joriy); chiz();
    });
    kanvas.addEventListener("pointermove", (e) => {
      if (!joriy) return;
      const n = nisbiy(e);
      if (joriy.asbob === "marker") joriy.nuqtalar[1] = n; else joriy.nuqtalar.push(n);
      chiz();
    });
    const chiziqTugadi = () => {
      if (joriy) {
        const [a, b] = [joriy.nuqtalar[0], joriy.nuqtalar[joriy.nuqtalar.length - 1]];
        if (joriy.asbob === "marker" && Math.hypot(a[0] - b[0], a[1] - b[1]) < 0.01) { h.chiziqlar.pop(); chiz(); }
      }
      joriy = null;
    };
    kanvas.addEventListener("pointerup", chiziqTugadi); kanvas.addEventListener("pointercancel", chiziqTugadi);

    const tugmaYarat = (matn, faol, bosilganda, sinf) => {
      const b = yarat("button", "tahrir-tugma" + (faol ? " faol" : "") + (sinf ? " " + sinf : ""), matn); b.type = "button";
      b.addEventListener("click", bosilganda); return b;
    };

    const asboblarniChiz = () => {
      asboblar.innerHTML = "";
      const qator = (...el) => { const q = yarat("div", "tahrir-qator"); q.append(...el); asboblar.appendChild(q); return q; };
      if (h.qadam === 0) {
        sarlavha.textContent = "1/3 · Qirqish";
        qator(
          tugmaYarat("⟳ Burish", false, () => {
            h.burchak = (h.burchak + 90) % 360; h.aylangan = burilgan(manba, h.burchak);
            h.qirq = { x: 0, y: 0, w: 1, h: 1 }; chiz();
          }),
          tugmaYarat("⤢ To'liq", false, () => { h.qirq = { x: 0, y: 0, w: 1, h: 1 }; qirqniJoyla(); }));
        asboblar.appendChild(yarat("p", "tahrir-izoh", "Burchaklarni surib, iqtibos turgan qismni ajrating."));
      } else if (h.qadam === 1) {
        sarlavha.textContent = "2/3 · Belgilash";
        qator(
          tugmaYarat("🖍 Marker", h.asbob === "marker", () => { h.asbob = "marker"; h.rang = TAHRIR_RANGLAR.marker[0][0]; asboblarniChiz(); }),
          tugmaYarat("✒ Ruchka", h.asbob === "ruchka", () => { h.asbob = "ruchka"; h.rang = TAHRIR_RANGLAR.ruchka[0][0]; asboblarniChiz(); }),
          tugmaYarat("↶", false, () => { h.chiziqlar.pop(); chiz(); }, "kvadrat"),
          tugmaYarat("Tozalash", false, () => { h.chiziqlar = []; chiz(); }));
        if (h.asbob === "marker") {
          const q = qator(); q.appendChild(yarat("small", "", "Qalinligi:"));
          [[0.025, "Ingichka"], [0.04, "O'rta"], [0.06, "Qalin"]].forEach(([v, nom]) =>
            q.appendChild(tugmaYarat(nom, h.markerQalinlik === v, () => { h.markerQalinlik = v; asboblarniChiz(); })));
        }
        const ranglar = qator();
        TAHRIR_RANGLAR[h.asbob].forEach(([r, nom]) => {
          const b = tugmaYarat("", h.rang === r, () => { h.rang = r; asboblarniChiz(); }, "rang");
          b.style.background = r; b.setAttribute("aria-label", nom + " rang"); ranglar.appendChild(b);
        });
        asboblar.appendChild(yarat("p", "tahrir-izoh", h.asbob === "marker" ? "Marker bilan matn qatori ustidan chapdan o'ngga torting." : "Ruchka bilan tagiga chizing yoki aylantiring."));
        qator(orqaga);
      } else {
        sarlavha.textContent = "3/3 · Bezash";
        const f = qator(); f.appendChild(yarat("small", "", "Filtr:"));
        TAHRIR_FILTRLAR.forEach(([k, nom]) => f.appendChild(tugmaYarat(nom, h.filtr === k, () => { h.filtr = k; asboblarniChiz(); chiz(); })));
        const r = qator(); r.appendChild(yarat("small", "", "Ramka:"));
        TAHRIR_RAMKALAR.forEach(([k, nom]) => r.appendChild(tugmaYarat(nom, h.ramka === k, () => { h.ramka = k; asboblarniChiz(); chiz(); })));
        qator(orqaga);
      }
      keyingi.textContent = h.qadam === 2 ? "Tayyor ✓" : "Keyingi →";
      qirqQuti.classList.toggle("yashirin", h.qadam !== 0);
      kanvas.classList.toggle("chizish", h.qadam === 1);
    };

    orqaga.addEventListener("click", () => { h.qadam = Math.max(0, h.qadam - 1); asboblarniChiz(); chiz(); });
    keyingi.addEventListener("click", () => {
      if (h.qadam < 2) { h.qadam++; asboblarniChiz(); chiz(); return; }
      keyingi.disabled = true;
      const c = ramkaliRasm(h, 1400);
      const sinash = (sifat) => new Promise((ok) => c.toBlob(ok, "image/jpeg", sifat));
      (async () => {
        let b = await sinash(0.86);
        if (b && b.size > 2.8 * 1024 * 1024) b = await sinash(0.7);
        yop(b);
      })();
    });

    asboblarniChiz();
    requestAnimationFrame(chiz);
    window.addEventListener("resize", () => { if (document.body.contains(oyna)) chiz(); });
  });
}

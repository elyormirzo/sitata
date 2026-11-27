// ===== QIDIRUV: tepadagi panelda, sahifa almashganda ham joyida turadi =====
// Mualliflar, iqtiboslar, kitoblar, sayt bo'limlari (shu brauzerdagi ma'lumotlardan) va kitobxonlar (bazadan).
// «/» tugmasi — qidiruvga o'tish; ↑/↓ — tanlash; Enter — ochish; Esc — yopish.

const QIDIRUV_BOLIMLARI = [
  ["#lenta", "Lenta"], ["#kim-aytgan", "Kim aytgan?"], ["#viktorina", "Viktorina"], ["#duellar", "Duellar"],
  ["#javon", "Kitob javonim"], ["#guruhlar", "Sinf va guruhlar"], ["#kitobdoshlar", "Kitobdoshlar"], ["#birga", "Birga o'qiymiz"],
  ["#mualliflar", "Mualliflar"], ["#liga", "Haftalik liga"], ["#karta", "Karta yaratish"], ["#profilim", "Profilim"],
  ["#profilim/daraja", "Darajam"], ["#profilim/reyting", "Reyting"], ["#xulosa", "Yillik xulosa"], ["#qoidalar", "Qanday o'ynash"],
  ["#haqida", "Loyiha haqida"], ["#telegram", "Telegram'ni ulash"],
];

// Qidiruv uchun matnni bir xillashtirish: kichik harf, tutuq belgilari va ortiqcha bo'shliqsiz
const qNorm = (s) => String(s || "").toLowerCase().replace(/[ʻʼ‘’'`´]/g, "").replace(/ё/g, "е").replace(/\s+/g, " ").trim();

// Moslik bahosi: boshidan mos — yuqori, so'z boshidan — o'rta, ichida — past
function qBaho(matn, q) {
  const m = qNorm(matn);
  if (!q || !m) return 0;
  if (m.startsWith(q)) return 3;
  if (m.includes(" " + q)) return 2;
  if (m.includes(q)) return 1;
  return 0;
}

function qidir(soz) {
  const q = qNorm(soz);
  if (q.length < 2) return [];
  const guruhlar = [];
  const ol = (nom, roy, max) => {
    const r = roy.filter((x) => x.baho > 0).sort((a, b) => b.baho - a.baho).slice(0, max);
    if (r.length) guruhlar.push({ nom, r });
  };
  // Mualliflar
  ol("Mualliflar", Object.keys(MUALLIFLAR).map((k) => {
    const v = MUALLIFLAR[k];
    return { baho: Math.max(qBaho(k, q), qBaho(v.ism_ru, q), qBaho(v.ism_en, q)) * 2,
      nom: muallifNomi(k), izoh: [t(v.kasb || ""), v.yillar].filter(Boolean).join(" · "), href: "#muallif/" + muallifSlug(k), rasm: v.rasm };
  }), 5);
  // Bo'limlar
  ol("Bo'limlar", QIDIRUV_BOLIMLARI.map(([href, nom]) => ({ baho: Math.max(qBaho(nom, q), qBaho(t(nom), q)), nom: t(nom), href, belgi: "↪" })), 3);
  // Iqtiboslar (bugungi o'yin javobi oshkor bo'lmasin)
  const iqlar = typeof ochiqIqtiboslar === "function" ? ochiqIqtiboslar() : [];
  ol("Iqtiboslar", iqlar.map((iq) => ({
    baho: Math.max(qBaho(iqtibosMatni(iq), q), qBaho(iq.matn, q) ? 1 : 0),
    nom: "«" + iqtibosMatni(iq) + "»", izoh: muallifNomi(iq.muallif), href: "#muallif/" + muallifSlug(iq.muallif), belgi: "❝",
  })), 6);
  // Kitoblar
  ol("Kitoblar", (typeof KITOBLAR !== "undefined" ? KITOBLAR : []).map((k) => ({
    baho: Math.max(qBaho(k.nom, q), qBaho(k.muallif, q) ? 1 : 0), nom: k.nom, izoh: muallifNomi(k.muallif),
    href: MUALLIFLAR[k.muallif] ? "#muallif/" + muallifSlug(k.muallif) : "#javon", belgi: "📖",
  })), 4);
  return guruhlar;
}

// Kitobxonlar — bazadan (ism yoki taxallus bo'yicha)
async function kitobxonQidir(soz) {
  if (!BAZA_YOQIQ) return [];
  const q = String(soz || "").replace(/^@/, "").replace(/[^\p{L}\p{N}_ ]/gu, "").trim().slice(0, 30);
  if (q.length < 2) return [];
  try {
    const m = await mijozOl();
    const { data } = await m.from("profillar").select("id,kod,ism,taxallus,rasm")
      .or(`taxallus.ilike.${q}%,ism.ilike.%${q}%`).limit(5);
    return (data || []).map((p) => ({ nom: p.ism || "@" + p.taxallus, izoh: p.taxallus ? "@" + p.taxallus : "", href: profilIchkiHavola(p), belgi: "👤" }));
  } catch (e) { return []; }
}

function qidiruvPaneli() {
  const quti = yarat("div", "qidiruv"); quti.setAttribute("role", "search");
  const belgi = yarat("span", "qidiruv-belgi");
  belgi.innerHTML = '<svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="6.5"/><path d="m16 16 4.5 4.5"/></svg>';
  const kirit = yarat("input", "qidiruv-kirit"); kirit.type = "search"; kirit.id = "qidiruvKirit";
  kirit.placeholder = "Muallif, iqtibos, kitob yoki kitobxonni qidiring"; kirit.autocomplete = "off"; kirit.spellcheck = false;
  kirit.setAttribute("aria-label", "Qidiruv"); kirit.setAttribute("role", "combobox"); kirit.setAttribute("aria-expanded", "false");
  kirit.setAttribute("aria-controls", "qidiruvNatija"); kirit.setAttribute("aria-autocomplete", "list"); kirit.enterKeyHint = "search";
  const natija = yarat("div", "qidiruv-natija yashirin"); natija.id = "qidiruvNatija"; natija.setAttribute("role", "listbox");
  quti.append(belgi, kirit, natija);

  let faol = -1, elementlar = [], soni = 0, kechikish = null;
  const yop = () => { natija.classList.add("yashirin"); kirit.setAttribute("aria-expanded", "false"); faol = -1; };
  const ochish = (href) => { yop(); kirit.value = ""; kirit.blur(); if (location.hash === href) window.dispatchEvent(new HashChangeEvent("hashchange")); else location.hash = href; };
  const belgila = (i) => {
    elementlar.forEach((e, j) => { e.classList.toggle("faol", j === i); e.setAttribute("aria-selected", String(j === i)); });
    faol = i; if (elementlar[i]) { elementlar[i].scrollIntoView({ block: "nearest" }); kirit.setAttribute("aria-activedescendant", elementlar[i].id); }
  };
  const chiz = (guruhlar, kutilmoqda) => {
    natija.innerHTML = ""; elementlar = [];
    guruhlar.forEach((g) => {
      natija.appendChild(yarat("div", "qidiruv-guruh", g.nom));
      g.r.forEach((x) => {
        const a = havola(x.href, "qidiruv-qator"); a.id = "qn" + elementlar.length; a.setAttribute("role", "option");
        const b = yarat("span", "qidiruv-q-belgi");
        if (x.rasm) { const img = yarat("img"); img.src = x.rasm; img.alt = ""; img.loading = "lazy"; b.appendChild(img); } else b.textContent = x.belgi || "•";
        const m = yarat("span", "qidiruv-q-matn");
        m.appendChild(yarat("span", "qidiruv-q-nom", x.nom));
        if (x.izoh) m.appendChild(yarat("span", "qidiruv-q-izoh", x.izoh));
        a.append(b, m);
        a.addEventListener("click", (e) => { e.preventDefault(); ochish(x.href); });
        natija.appendChild(a); elementlar.push(a);
      });
    });
    if (!elementlar.length) natija.appendChild(yarat("div", "qidiruv-bosh", kutilmoqda ? "Qidirilmoqda…" : "Hech narsa topilmadi."));
    natija.classList.remove("yashirin"); kirit.setAttribute("aria-expanded", "true");
    belgila(elementlar.length ? 0 : -1);
  };
  const yangila = () => {
    const soz = kirit.value;
    if (qNorm(soz).length < 2) { yop(); return; }
    const guruhlar = qidir(soz);
    const raqam = ++soni;
    chiz(guruhlar, BAZA_YOQIQ);
    clearTimeout(kechikish);
    kechikish = setTimeout(async () => {
      const odamlar = await kitobxonQidir(soz);
      if (raqam !== soni) return;               // bu orada yangi harf yozildi
      chiz(odamlar.length ? [...guruhlar, { nom: "Kitobxonlar", r: odamlar }] : guruhlar, false);
    }, 250);
  };
  kirit.addEventListener("input", yangila);
  kirit.addEventListener("focus", () => { if (qNorm(kirit.value).length >= 2) yangila(); });
  kirit.addEventListener("keydown", (e) => {
    if (e.key === "ArrowDown" && elementlar.length) { e.preventDefault(); belgila((faol + 1) % elementlar.length); }
    else if (e.key === "ArrowUp" && elementlar.length) { e.preventDefault(); belgila((faol - 1 + elementlar.length) % elementlar.length); }
    else if (e.key === "Enter") { e.preventDefault(); const el = elementlar[faol] || elementlar[0]; if (el) ochish(el.getAttribute("href")); }
    else if (e.key === "Escape") { if (!natija.classList.contains("yashirin")) yop(); else { kirit.value = ""; kirit.blur(); } }
  });
  document.addEventListener("click", (e) => { if (!quti.contains(e.target)) yop(); });
  window.addEventListener("hashchange", yop);
  // «/» — qidiruvga o'tish (matn yozilayotgan joyda emas)
  document.addEventListener("keydown", (e) => {
    if (e.key !== "/" || e.ctrlKey || e.metaKey || e.altKey) return;
    const el = document.activeElement;
    if (el && (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName))) return;
    e.preventDefault(); kirit.focus();
  });
  return quti;
}

// Tepadagi panel sahifa almashganda ham joyida qoladi; uning balandligi boshqa yopishqoq qismlar uchun (--yuqori-h)
function qidiruvniBoshla() {
  const yuqori = document.querySelector(".yuqori");
  if (!yuqori || yuqori.querySelector(".qidiruv")) return;
  const ong = yuqori.querySelector(".yuqori-ong");
  yuqori.insertBefore(qidiruvPaneli(), ong);
  const ol = () => document.documentElement.style.setProperty("--yuqori-h", yuqori.offsetHeight + "px");
  ol();
  if ("ResizeObserver" in window) new ResizeObserver(ol).observe(yuqori);
  else window.addEventListener("resize", ol);
}
if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", qidiruvniBoshla);
else qidiruvniBoshla();

// ===== SINF VA GURUHLAR =====
// O'qituvchi yoki sardor guruh ochadi, kodini tarqatadi; a'zolar o'zaro reytingda bellashadi, egasi topshiriq beradi.
// Manzillar: #guruhlar, #guruh/<id>, #qoshil/<kod>. Baza: supabase/guruhlar.sql
// (guruhlar, guruh_azolari, guruh_topshiriqlari, oqish_jurnali; guruh_yarat, guruhga_qoshil, guruhlarim, guruh_reytingi…)

const GURUH_TURLARI = { sinf: "🏫 Sinf", guruh: "👥 Guruh" };
const guruhHolati = { davr: "hafta", olchov: "sahifalar", tab: "reyting" };
const guruhTaklifHavolasi = (kod) => SAYT_MANZILI + "#qoshil/" + kod;

function guruhXatosi(e) {
  const x = String((e && (e.message || e.details)) || e || "");
  if (/chegara/.test(x)) return "Chegaraga yetdingiz: ko'pi bilan 10 ta guruh ochish va 20 ta guruhda bo'lish mumkin.";
  if (/toldi/.test(x)) return "Bu guruh to'lgan (300 kishi).";
  if (/topilmadi/.test(x)) return "Bunday kodli guruh topilmadi — kodni tekshiring.";
  return "Bajarib bo'lmadi — internetni tekshirib, qayta urinib ko'ring.";
}

// ---------- #guruhlar ----------
async function guruhlarniChiz() {
  const s = $("guruhlarSahifa");
  s.innerHTML = "";
  s.appendChild(yarat("h2", "sahifa-sarlavha", "Sinf va guruhlar"));
  s.appendChild(yarat("p", "kichik-matn markaz", "Sinfdoshlaringiz yoki kursdoshlaringiz bilan kim ko'p o'qishini bellashing."));
  const m = await profilniTekshir(s);
  if (!m) return;

  // Kod bilan qo'shilish
  const qoshil = yarat("div", "guruh-kod-qator");
  const kodMaydon = yarat("input", "matn-maydon bir-qator"); kodMaydon.placeholder = "Guruh kodi (masalan, k7m2xp)"; kodMaydon.maxLength = 40;
  kodMaydon.autocapitalize = "off"; kodMaydon.spellcheck = false;
  const qoshilTugma = yarat("button", "kichik", "Qo'shilish"); qoshilTugma.type = "button";
  const kodXabar = yarat("p", "kichik-matn");
  qoshilTugma.addEventListener("click", async () => {
    const kod = ((kodMaydon.value.match(/([a-z0-9]{6})\s*$/i) || [])[1] || "").toLowerCase();
    if (!kod) { kodXabar.textContent = "Kod 6 belgidan iborat bo'ladi."; kodMaydon.focus(); return; }
    qoshilTugma.disabled = true;
    const { data, error } = await m.rpc("guruhga_qoshil", { p_kod: kod });
    qoshilTugma.disabled = false;
    if (error) { kodXabar.textContent = guruhXatosi(error); return; }
    location.hash = "#guruh/" + data;
  });
  qoshil.append(kodMaydon, qoshilTugma);

  // Yangi guruh ochish
  const yangi = yarat("details", "kitob-qoshish");
  yangi.appendChild(yarat("summary", "", "+ Guruh ochish"));
  const ichi = yarat("div", "karta-sozlama");
  const nom = yarat("input", "matn-maydon bir-qator"); nom.placeholder = "Nomi: 11-B sinf, Filologiya 2-kurs, Kitobxonlar klubi…"; nom.maxLength = 60;
  const tur = yarat("select", "tanlash");
  Object.entries(GURUH_TURLARI).forEach(([k, v]) => { const o = yarat("option", "", v); o.value = k; tur.appendChild(o); });
  const yarTugma = yarat("button", "asosiy", "Ochish"); yarTugma.type = "button";
  const yarXabar = yarat("p", "kichik-matn");
  yarTugma.addEventListener("click", async () => {
    const n = nom.value.trim();
    if (n.length < 2) { nom.focus(); return; }
    yarTugma.disabled = true;
    const { data, error } = await m.rpc("guruh_yarat", { p_nom: n, p_tur: tur.value });
    yarTugma.disabled = false;
    if (error) { yarXabar.textContent = guruhXatosi(error); return; }
    location.hash = "#guruh/" + data;
  });
  ichi.append(nom, tur, yarTugma, yarXabar,
    yarat("p", "kichik-matn", "Guruh ochgach, kodini yoki havolasini sinfdoshlaringizga yuborasiz. Siz guruhga kitob topshiriqlarini berasiz."));
  yangi.appendChild(ichi);

  s.append(qoshil, kodXabar, yangi);

  // Mening guruhlarim
  s.appendChild(yarat("h3", "bolim-sarlavha", "Mening guruhlarim"));
  const royxat = yarat("div", "royxat");
  royxat.appendChild(yarat("p", "bosh-holat", "Yuklanmoqda…"));
  s.appendChild(royxat);
  // Bellashuv
  s.appendChild(yarat("h3", "bolim-sarlavha", "🏆 Guruhlar bellashuvi — shu hafta"));
  const bellashuv = yarat("ol", "reyting-royxat");
  s.appendChild(bellashuv);
  s.appendChild(yarat("p", "kichik-matn markaz", "Kamida 3 a'zoli guruhlar · o'qilgan sahifalar bo'yicha"));

  const [{ data: guruhlar, error }, { data: top }] = await Promise.all([m.rpc("guruhlarim"), m.rpc("guruhlar_bellashuvi", { davr: "hafta" })]);
  royxat.innerHTML = "";
  if (error) { royxat.appendChild(yarat("p", "bosh-holat", "Guruhlarni yuklab bo'lmadi.")); }
  else if (!guruhlar.length) {
    royxat.appendChild(yarat("p", "bosh-holat", "Hali hech qaysi guruhda emassiz. Kod bilan qo'shiling yoki o'zingiz oching."));
  } else guruhlar.forEach((g) => {
    const a = havola("#guruh/" + g.id, "guruh-karta", "");
    a.append(yarat("span", "guruh-belgi", g.tur === "sinf" ? "🏫" : "👥"));
    const t = yarat("div", ""); t.append(yarat("b", "", g.nom), yarat("span", "kichik-matn", `${g.azolar} a'zo` + (g.egasi === mening.id ? " · siz ochgansiz" : "")));
    a.append(t, yarat("span", "guruh-otish", "→"));
    royxat.appendChild(a);
  });
  const meniki = new Set((guruhlar || []).map((g) => g.id));
  if (!top || !top.length) bellashuv.appendChild(yarat("p", "bosh-holat", "Hali bellashuvda guruh yo'q."));
  else top.forEach((g, i) => {
    const li = yarat("li", "reyting-qator" + (meniki.has(g.id) ? " meniki" : ""));
    li.appendChild(yarat("span", "orin", i < 3 ? ["🥇", "🥈", "🥉"][i] : String(i + 1)));
    const nomEl = yarat("div", "reyting-nom");
    nomEl.append(meniki.has(g.id) ? havola("#guruh/" + g.id, "", g.nom) : yarat("b", "", g.nom), yarat("small", "", `${GURUH_TURLARI[g.tur] || ""} · ${g.azolar} a'zo`));
    li.append(nomEl, yarat("b", "reyting-ball", `${g.sahifalar} sah.`));
    bellashuv.appendChild(li);
  });
}

// ---------- #qoshil/<kod> ----------
async function qoshilishniChiz(kod) {
  const s = $("guruhlarSahifa");
  s.innerHTML = "";
  s.appendChild(havola("#guruhlar", "orqaga", "← Guruhlar"));
  const m = await profilniTekshir(s);
  if (!m) return;
  kod = String(kod || "").toLowerCase();
  const { data } = await m.rpc("guruh_koddan", { p_kod: kod });
  const g = data && data[0];
  const q = yarat("div", "vik-quti markaz");
  if (!g) { q.appendChild(yarat("p", "", "Bunday guruh topilmadi — havola eskirgan bo'lishi mumkin.")); s.appendChild(q); return; }
  q.append(yarat("p", "katta-belgi", g.tur === "sinf" ? "🏫" : "👥"), yarat("h3", "", g.nom), yarat("p", "kichik-matn", `${g.azolar} a'zo · sizni taklif qilishdi`));
  const b = yarat("button", "asosiy", "Guruhga qo'shilish"); b.type = "button";
  const x = yarat("p", "kichik-matn");
  b.addEventListener("click", async () => {
    b.disabled = true;
    const { data: id, error } = await m.rpc("guruhga_qoshil", { p_kod: kod });
    if (error) { b.disabled = false; x.textContent = guruhXatosi(error); return; }
    location.hash = "#guruh/" + id;
  });
  q.append(b, x);
  s.appendChild(q);
}

// ---------- #guruh/<id> ----------
async function guruhniChiz(param) {
  const s = $("guruhlarSahifa");
  s.innerHTML = "";
  s.appendChild(havola("#guruhlar", "orqaga", "← Guruhlar"));
  const m = await profilniTekshir(s);
  if (!m) return;
  const id = Number(String(param).split("/")[0]);
  const { data: guruhlar } = await m.rpc("guruhlarim");
  const g = (guruhlar || []).find((x) => x.id === id);
  if (!g) {
    s.appendChild(yarat("p", "bosh-holat", "Bu guruhni ko'rish uchun unga a'zo bo'lishingiz kerak. Guruh kodini so'rang."));
    return;
  }
  const egasi = g.egasi === mening.id;
  document.title = g.nom + " — sitata.uz";

  const bosh = yarat("div", "guruh-bosh");
  bosh.append(yarat("span", "guruh-belgi katta", g.tur === "sinf" ? "🏫" : "👥"));
  const t = yarat("div", "");
  t.append(yarat("h2", "", g.nom), yarat("span", "kichik-matn", `${GURUH_TURLARI[g.tur]} · ${g.azolar} a'zo`));
  bosh.appendChild(t);
  s.appendChild(bosh);

  // Taklif qilish: kod va havola
  const taklif = yarat("div", "guruh-taklif");
  const kodEl = yarat("b", "guruh-kod", g.kod);
  const ulash = yarat("button", "kichik", "Taklif qilish"); ulash.type = "button";
  ulash.addEventListener("click", async () => {
    const url = guruhTaklifHavolasi(g.kod);
    const matn = `«${g.nom}» guruhiga qo'shiling — sitata.uz'da birga kitob o'qiymiz! Kod: ${g.kod}`;
    try { if (navigator.share) { await navigator.share({ title: g.nom, text: matn, url }); return; } } catch (e) { return; }
    const ok = await nusxaOl(matn + "\n" + url);
    ulash.textContent = ok ? "Nusxalandi ✓" : "Nusxa olinmadi";
    setTimeout(() => (ulash.textContent = "Taklif qilish"), 1600);
  });
  taklif.append(yarat("span", "kichik-matn", "Guruh kodi:"), kodEl, ulash);
  s.appendChild(taklif);

  // Tablar
  const tablar = yarat("nav", "lenta-tablar guruh-tablar");
  const tana = yarat("div", "guruh-tana");
  const tablarRoyxati = [["mashq", "Mashq"], ["reyting", "Reyting"], ["topshiriq", "Topshiriqlar"], ["azolar", "A'zolar"]];
  const tabniOch = (k) => {
    guruhHolati.tab = k;
    tablar.querySelectorAll(".lenta-tab").forEach((a) => a.classList.toggle("faol", a.dataset.k === k));
    tana.innerHTML = "";
    if (k === "reyting") guruhReytingi(m, g, tana);
    else if (k === "topshiriq") guruhTopshiriqlari(m, g, tana, egasi);
    else if (k === "mashq") guruhMashqi(m, g, tana, egasi);
    else guruhAzolari(m, g, tana, egasi);
  };
  tablarRoyxati.forEach(([k, nom]) => {
    const b = yarat("button", "lenta-tab"); b.type = "button"; b.dataset.k = k;
    b.appendChild(yarat("span", "", nom));
    b.addEventListener("click", () => tabniOch(k));
    tablar.appendChild(b);
  });
  s.append(tablar, tana);
  // Savollari bor guruh (attestatsiya, imtihon) — «Mashq» bo'limidan ochiladi
  if (guruhHolati.guruh !== g.id) {
    guruhHolati.guruh = g.id;
    const { data: soni } = await m.rpc("guruh_savollari_soni", { g: g.id });
    guruhHolati.tab = soni > 0 ? "mashq" : "reyting";
  }
  tabniOch(guruhHolati.tab);
}

const OLCHOVLAR = { sahifalar: ["📖 Sahifa", "sah."], kitoblar: ["📚 Kitob", "kitob"], topilgan: ["🎯 O'yin", "topdi"] };
const DAVRLAR = { hafta: "Shu hafta", oy: "Shu oy", hammasi: "Hammasi" };

async function guruhReytingi(m, g, tana) {
  const filtr = (obyekt, kalit, chiz) => {
    const q = yarat("div", "filtrlar markaz-flex");
    Object.entries(obyekt).forEach(([k, v]) => {
      const b = yarat("button", "filtr" + (guruhHolati[kalit] === k ? " faol" : ""), Array.isArray(v) ? v[0] : v); b.type = "button";
      b.addEventListener("click", () => { guruhHolati[kalit] = k; chiz(); });
      q.appendChild(b);
    });
    return q;
  };
  const chiz = async () => {
    tana.innerHTML = "";
    tana.append(filtr(DAVRLAR, "davr", chiz), filtr(OLCHOVLAR, "olchov", chiz));
    const royxat = yarat("ol", "reyting-royxat");
    const holat = yarat("p", "bosh-holat", "Yuklanmoqda…");
    tana.append(holat, royxat);
    const { davr, olchov } = guruhHolati;
    const { data, error } = await m.rpc("guruh_reytingi", { g: g.id, davr });
    if (guruhHolati.davr !== davr || guruhHolati.olchov !== olchov) return;
    if (error) { holat.textContent = "Reytingni yuklab bo'lmadi."; return; }
    holat.remove();
    const [, birlik] = OLCHOVLAR[olchov];
    data.sort((a, b) => b[olchov] - a[olchov] || b.sahifalar - a.sahifalar || a.ism.localeCompare(b.ism)).forEach((r, i) => {
      const li = yarat("li", "reyting-qator" + (r.profil_id === mening.id ? " meniki" : ""));
      const bor = r[olchov] > 0;
      li.appendChild(yarat("span", "orin", bor && i < 3 ? ["🥇", "🥈", "🥉"][i] : String(i + 1)));
      li.appendChild(avatarEl(r, 38, "jadval"));
      const nom = yarat("div", "reyting-nom");
      nom.append(havola(profilIchkiHavola(r), "", r.ism + (r.profil_id === mening.id ? " (siz)" : "")),
        yarat("small", "", [r.taxallus ? "@" + r.taxallus : "", olchov !== "sahifalar" ? `${r.sahifalar} sahifa` : `${r.kitoblar} kitob`].filter(Boolean).join(" · ")));
      li.append(nom, yarat("b", "reyting-ball", `${r[olchov]} ${birlik}`));
      royxat.appendChild(li);
    });
    tana.appendChild(yarat("p", "kichik-matn markaz", "Sahifalar javondagi «O'qiyapman» kitoblarida belgilaganingizda hisoblanadi."));
  };
  chiz();
}

async function guruhTopshiriqlari(m, g, tana, egasi) {
  if (egasi) {
    const forma = yarat("details", "kitob-qoshish");
    forma.appendChild(yarat("summary", "", "+ Topshiriq berish"));
    const ichi = yarat("div", "karta-sozlama");
    const kitob = yarat("input", "matn-maydon bir-qator"); kitob.placeholder = "Kitob nomi"; kitob.maxLength = 120;
    const royxatId = "guruhKitoblar"; kitob.setAttribute("list", royxatId);
    const dl = yarat("datalist"); dl.id = royxatId;
    (typeof KITOBLAR !== "undefined" ? KITOBLAR : []).forEach((k) => { const o = yarat("option"); o.value = k.nom; dl.appendChild(o); });
    const muallif = yarat("input", "matn-maydon bir-qator"); muallif.placeholder = "Muallifi (ixtiyoriy)"; muallif.maxLength = 60;
    kitob.addEventListener("change", () => {
      const k = (typeof KITOBLAR !== "undefined" ? KITOBLAR : []).find((x) => x.nom.toLowerCase() === kitob.value.trim().toLowerCase());
      if (k && !muallif.value) muallif.value = k.muallif;
    });
    const izoh = yarat("input", "matn-maydon bir-qator"); izoh.placeholder = "Izoh: 1–5 boblar, 120-sahifagacha…"; izoh.maxLength = 200;
    const muddat = yarat("input", "matn-maydon bir-qator"); muddat.type = "date"; muddat.setAttribute("aria-label", "Muddat");
    const b = yarat("button", "asosiy", "Topshiriq berish"); b.type = "button";
    const x = yarat("p", "kichik-matn");
    b.addEventListener("click", async () => {
      if (!kitob.value.trim()) { kitob.focus(); return; }
      b.disabled = true;
      const { error } = await m.from("guruh_topshiriqlari").insert({
        guruh_id: g.id, kitob: kitob.value.trim(), muallif: muallif.value.trim() || null, izoh: izoh.value.trim() || null, muddat: muddat.value || null,
      });
      b.disabled = false;
      if (error) { x.textContent = "Saqlanmadi — qayta urinib ko'ring."; return; }
      tana.innerHTML = ""; guruhTopshiriqlari(m, g, tana, egasi);
    });
    ichi.append(kitob, dl, muallif, izoh, yarat("label", "kichik-matn", "Muddat (ixtiyoriy):"), muddat, b, x,
      yarat("p", "kichik-matn", "A'zolarga bildirishnoma boradi. Kim qancha o'qiganini ular javonidagi shu nomli kitobdan ko'rasiz."));
    forma.appendChild(ichi);
    tana.appendChild(forma);
  }
  const royxat = yarat("div", "royxat");
  royxat.appendChild(yarat("p", "bosh-holat", "Yuklanmoqda…"));
  tana.appendChild(royxat);
  const { data, error } = await m.from("guruh_topshiriqlari").select("id,kitob,muallif,izoh,muddat,yaratilgan").eq("guruh_id", g.id).order("yaratilgan", { ascending: false });
  royxat.innerHTML = "";
  if (error) { royxat.appendChild(yarat("p", "bosh-holat", "Topshiriqlarni yuklab bo'lmadi.")); return; }
  if (!data.length) { royxat.appendChild(yarat("p", "bosh-holat", egasi ? "Hali topshiriq yo'q — birinchisini bering." : "Hali topshiriq berilmagan.")); return; }
  const bugun = toshkentSana();
  data.forEach((t) => {
    const k = yarat("div", "topshiriq-karta");
    const bosh = yarat("div", "topshiriq-bosh");
    const ichki = yarat("div", "");
    ichki.append(yarat("b", "", "«" + t.kitob + "»" + (t.muallif ? " — " + t.muallif : "")));
    if (t.izoh) ichki.appendChild(yarat("span", "", t.izoh));
    if (t.muddat) {
      const otdi = t.muddat < bugun;
      ichki.appendChild(yarat("small", otdi ? "muddat otdi" : "muddat", (otdi ? "Muddat o'tgan: " : "Muddat: ") + new Date(t.muddat + "T00:00").toLocaleDateString("uz")));
    }
    bosh.appendChild(ichki);
    if (egasi) {
      const o = yarat("button", "matn-tugma", "O'chirish"); o.type = "button";
      o.addEventListener("click", async () => { if (!confirm("Topshiriqni o'chirasizmi?")) return; await m.from("guruh_topshiriqlari").delete().eq("id", t.id); k.remove(); });
      bosh.appendChild(o);
    }
    k.appendChild(bosh);
    // Javonimga qo'shish (agar hali yo'q bo'lsa)
    const jarayon = yarat("div", "topshiriq-jarayon");
    jarayon.appendChild(yarat("p", "kichik-matn", "Yuklanmoqda…"));
    k.appendChild(jarayon);
    royxat.appendChild(k);
    topshiriqJarayoni(m, t, jarayon);
  });
}

async function topshiriqJarayoni(m, t, quti) {
  const { data, error } = await m.rpc("topshiriq_jarayoni", { t: t.id });
  quti.innerHTML = "";
  if (error) return;
  const tugatgan = data.filter((r) => r.holat === "oqidim").length;
  const boshlagan = data.filter((r) => r.holat === "oqiyapman").length;
  const men = data.find((r) => r.profil_id === mening.id);
  const xulosa = yarat("p", "kichik-matn", `✓ ${tugatgan} tugatdi · 📖 ${boshlagan} o'qiyapti · ${data.length - tugatgan - boshlagan} boshlamagan`);
  quti.appendChild(xulosa);
  if (!men || !men.holat) {
    const b = yarat("button", "kichik", "📚 Javonimga qo'shish"); b.type = "button";
    b.addEventListener("click", async () => {
      b.disabled = true;
      const { error: e } = await m.from("kitob_javoni").insert({ profil_id: mening.id, kitob: t.kitob, muallif: t.muallif, holat: "oqiyapman", foiz: 0, boshlangan: toshkentSana() });
      if (e) { b.disabled = false; return; }
      topshiriqJarayoni(m, t, quti);
    });
    quti.appendChild(b);
  }
  const det = yarat("details", "topshiriq-azolar");
  det.appendChild(yarat("summary", "", "Kim qancha o'qidi"));
  const tartib = { oqidim: 0, oqiyapman: 1 };
  data.sort((a, b) => (tartib[a.holat] ?? 2) - (tartib[b.holat] ?? 2) || (b.foiz || 0) - (a.foiz || 0)).forEach((r) => {
    const q = yarat("div", "odam-qator");
    q.appendChild(avatarEl(r, 30, "kichik"));
    const n = yarat("div", "odam-nom"); n.appendChild(havola(profilIchkiHavola(r), "", r.ism));
    const holat = r.holat === "oqidim" ? "✓ tugatdi" : r.holat === "oqiyapman" ? (r.sahifalar && r.sahifa != null ? `${r.sahifa}/${r.sahifalar} · ${r.foiz}%` : `${r.foiz || 0}%`) : r.holat === "oqimoqchi" ? "rejada" : "—";
    q.append(n, yarat("span", "topshiriq-holat" + (r.holat === "oqidim" ? " tugadi" : ""), holat));
    det.appendChild(q);
  });
  quti.appendChild(det);
}

async function guruhAzolari(m, g, tana, egasi) {
  const royxat = yarat("div", "royxat");
  royxat.appendChild(yarat("p", "bosh-holat", "Yuklanmoqda…"));
  tana.appendChild(royxat);
  const { data, error } = await m.from("guruh_azolari").select("profil_id,qoshilgan").eq("guruh_id", g.id).order("qoshilgan");
  royxat.innerHTML = "";
  if (error) { royxat.appendChild(yarat("p", "bosh-holat", "A'zolarni yuklab bo'lmadi.")); return; }
  const profillar = await profillarniOl(m, data.map((a) => a.profil_id));
  data.forEach((a) => {
    const p = profillar[a.profil_id] || { id: a.profil_id, ism: "Noma'lum" };
    const q = yarat("div", "odam-qator");
    q.appendChild(profilHavola(p));
    if (a.profil_id === g.egasi) q.appendChild(yarat("span", "kichik-matn", "egasi"));
    else if (egasi) {
      const ch = yarat("button", "amal", "Chiqarish"); ch.type = "button";
      ch.addEventListener("click", async () => {
        if (!confirm(`${p.ism}ni guruhdan chiqarasizmi?`)) return;
        await m.from("guruh_azolari").delete().eq("guruh_id", g.id).eq("profil_id", a.profil_id); q.remove();
      });
      q.appendChild(ch);
    }
    royxat.appendChild(q);
  });
  const pastki = yarat("div", "guruh-pastki");
  if (egasi) {
    const nomOzg = yarat("button", "matn-tugma", "Nomini o'zgartirish"); nomOzg.type = "button";
    nomOzg.addEventListener("click", async () => {
      const n = prompt("Guruhning yangi nomi:", g.nom);
      if (!n || n.trim().length < 2) return;
      const { error: e } = await m.from("guruhlar").update({ nom: n.trim().slice(0, 60) }).eq("id", g.id);
      if (!e) guruhniChiz(String(g.id));
    });
    const ochir = yarat("button", "matn-tugma xavfli", "Guruhni o'chirish"); ochir.type = "button";
    ochir.addEventListener("click", async () => {
      if (!confirm(`«${g.nom}» guruhini butunlay o'chirasizmi? Topshiriqlar ham o'chadi.`)) return;
      const { error: e } = await m.from("guruhlar").delete().eq("id", g.id);
      if (!e) location.hash = "#guruhlar";
    });
    pastki.append(nomOzg, ochir);
  } else {
    const chiq = yarat("button", "matn-tugma xavfli", "Guruhdan chiqish"); chiq.type = "button";
    chiq.addEventListener("click", async () => {
      if (!confirm(`«${g.nom}» guruhidan chiqasizmi?`)) return;
      const { error: e } = await m.from("guruh_azolari").delete().eq("guruh_id", g.id).eq("profil_id", mening.id);
      if (!e) location.hash = "#guruhlar";
    });
    pastki.appendChild(chiq);
  }
  tana.appendChild(pastki);
}

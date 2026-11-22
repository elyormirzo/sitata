// ===== HAFTALIK LIGALAR =====
// Baza: supabase/liga.sql — liga_jadvali(p), liga_tarixi, liga_haftani_yakunla() (dushanba 00:05 cron).
// Sahifa: #liga

const LIGALAR = [
  { nom: "Varaq",     rang: "#CFC3A8", toq: "#8C7E60" },
  { nom: "Daftar",    rang: "#9DC3E6", toq: "#3F6E99" },
  { nom: "Risola",    rang: "#A8D5A2", toq: "#3F7A3A" },
  { nom: "Kitob",     rang: "#E8B87A", toq: "#9A5B1E" },
  { nom: "Kutubxona", rang: "#C3A6E6", toq: "#5E3A8C" },
  { nom: "Xazina",    rang: "#F2D06B", toq: "#8A6A08" },
];

// Liga nishoni: lenta osilgan qalqon, ichida liga raqami qadar varaqlar
function ligaSVG(i, olcham, qulf) {
  const l = LIGALAR[i];
  const varaqlar = Array.from({ length: i + 1 }, (_, k) => `<rect x="${38 - i * 2 + k * 4}" y="${40 - k * 1.5}" width="24" height="30" rx="2" fill="#FBF5E6" stroke="${l.toq}" stroke-width="1.2"/>`).join("");
  return `<svg viewBox="0 0 100 100" width="${olcham}" height="${olcham}" role="img" aria-label="${l.nom} ligasi"${qulf ? ' opacity=".35"' : ""}>
    <path d="M30 6 L30 30 L22 22 L14 30 L14 6 Z" fill="${l.toq}"/><path d="M70 6 L70 30 L78 22 L86 30 L86 6 Z" fill="${l.toq}"/>
    <path d="M50 12 L84 22 L84 50 Q84 78 50 94 Q16 78 16 50 L16 22 Z" fill="${l.rang}" stroke="${l.toq}" stroke-width="3"/>
    <path d="M50 20 L76 28 L76 50 Q76 72 50 85 Q24 72 24 50 L24 28 Z" fill="none" stroke="#FBF5E6" stroke-width="1.5" opacity=".8"/>
    ${varaqlar}</svg>`;
}

function haftaOxirigacha() {
  const hozir = Date.now() + 5 * 3600 * 1000;                     // Toshkent vaqti (UTC ko'rinishida)
  const d = new Date(hozir); const kunNomeri = (d.getUTCDay() + 6) % 7;   // dushanba = 0
  const keyingiDushanba = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() + 7 - kunNomeri);
  const qolgan = keyingiDushanba - hozir;
  const kun = Math.floor(qolgan / 86400000), soat = Math.floor((qolgan % 86400000) / 3600000);
  return kun > 0 ? `${kun} kun ${soat} soat` : `${soat} soat ${Math.floor((qolgan % 3600000) / 60000)} daqiqa`;
}

async function ligaChiz() {
  const s = $("ligaSahifa");
  s.innerHTML = "";
  s.appendChild(yarat("h2", "sahifa-sarlavha", "Haftalik liga"));
  const m = await profilniTekshir(s);
  if (!m) return;
  const yuklanmoqda = yarat("p", "bosh-holat", "Yuklanmoqda…"); s.appendChild(yuklanmoqda);
  const [{ data: qatorlar, error }, { data: tarix }] = await Promise.all([
    m.rpc("liga_jadvali", { p: mening.id }),
    m.from("liga_tarixi").select("hafta,liga,xp,orin,natija").eq("profil_id", mening.id).order("hafta", { ascending: false }).limit(1),
  ]);
  yuklanmoqda.remove();
  if (error) { s.appendChild(yarat("p", "bosh-holat", "Ligani yuklab bo'lmadi.")); return; }
  const liga = qatorlar.length ? qatorlar[0].liga : 0;
  const L = LIGALAR[liga];

  // Ligalar zinapoyasi
  const zina = yarat("div", "liga-zina");
  LIGALAR.forEach((_, i) => {
    const q = yarat("span", "liga-pog" + (i === liga ? " joriy" : ""));
    q.innerHTML = ligaSVG(i, i === liga ? 76 : 40, i > liga);
    q.title = LIGALAR[i].nom;
    zina.appendChild(q);
  });
  s.appendChild(zina);
  const bosh = yarat("div", "liga-bosh");
  bosh.append(yarat("h3", "", L.nom + " ligasi"), yarat("p", "kichik-matn", `Hafta tugashiga: ${haftaOxirigacha()}`));
  s.appendChild(bosh);

  // O'tgan hafta natijasi
  if (tarix && tarix[0]) {
    const t = tarix[0];
    const matn = t.natija === "kotarildi" ? `🏆 O'tgan hafta ${t.orin}-o'rin bilan «${LIGALAR[t.liga + 1].nom}» ligasiga ko'tarildingiz!`
      : t.natija === "tushdi" ? `O'tgan hafta «${LIGALAR[t.liga - 1].nom}» ligasiga tushdingiz. Bu hafta qaytib chiqing!`
      : `O'tgan hafta ${t.orin}-o'rinni egalladingiz (${t.xp} ball).`;
    s.appendChild(yarat("p", "liga-tarix " + t.natija, matn));
  }

  const n = qatorlar.length;
  const yuqori = liga < 5 ? Math.max(1, Math.floor(n * 0.2)) : 0;
  const quyi = liga > 0 && n >= 5 ? Math.floor(n * 0.2) : 0;
  const qoida = [];
  if (yuqori) qoida.push(`eng yaxshi ${yuqori} kishi «${LIGALAR[liga + 1].nom}» ligasiga ko'tariladi`);
  if (liga > 0) qoida.push(quyi ? `oxirgi ${quyi} kishi va hafta davomida ball to'plamaganlar tushadi` : "hafta davomida ball to'plamaganlar tushadi");
  if (qoida.length) s.appendChild(yarat("p", "kichik-matn markaz", "Hafta oxirida " + qoida.join(", ") + "."));

  const rasmlar = await rasmlarniOl(m, qatorlar.map((r) => r.kod));
  const royxat = yarat("ol", "reyting-royxat liga-royxat");
  qatorlar.forEach((r, i) => {
    if (i === yuqori && yuqori > 0 && i < n) royxat.appendChild(yarat("li", "liga-chegara kotarilish", "⬆ Ko'tarilish chegarasi"));
    if (quyi && i === n - quyi) royxat.appendChild(yarat("li", "liga-chegara tushish", "⬇ Tushish chegarasi"));
    const li = yarat("li", "reyting-qator" + (r.meniki ? " meniki" : "") + (i < yuqori ? " zona-yuqori" : "") + ((quyi && i >= n - quyi) || (liga > 0 && r.xp === 0) ? " zona-quyi" : ""));
    li.appendChild(yarat("span", "orin", i < 3 && r.xp > 0 ? ["🥇", "🥈", "🥉"][i] : String(r.orin)));
    li.appendChild(avatarEl({ ism: r.ism, rasm: rasmlar[r.kod] }, 38, "jadval"));
    const nom = yarat("div", "reyting-nom");
    nom.append(havola(profilIchkiHavola(r), "", r.ism + (r.meniki ? " (siz)" : "")), yarat("small", "", r.taxallus ? "@" + r.taxallus : ""));
    li.append(nom, yarat("b", "reyting-ball", `${r.xp} ball`));
    royxat.appendChild(li);
  });
  s.appendChild(royxat);
  if (n === 1) s.appendChild(yarat("p", "kichik-matn markaz", "Hozircha ligada yolg'izsiz — do'stlaringizni taklif qiling, bellashuv qiziqroq bo'ladi!"));
  s.appendChild(havola("#qoidalar", "barchasi", "Ball qanday to'planadi?"));
}

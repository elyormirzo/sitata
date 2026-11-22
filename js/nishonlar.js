// ===== O'QISH SERIYASI VA NISHONLAR =====
// Javonda: 🔥 kunlik o'qish seriyasi va kunlik maqsad (sahifa). Profilda: nishonlar.
// Baza: oqish_jurnali (javonda sahifa belgilanganda yoziladi), oqish_holati(p) — supabase/guruhlar.sql

const NISHONLAR = [
  { k: "kitob1", belgi: "📗", nom: "Birinchi kitob", olchov: "kitoblar", chegara: 1, tavsif: "1 ta kitobni tugating" },
  { k: "kitob5", belgi: "📚", nom: "Kitobxon", olchov: "kitoblar", chegara: 5, tavsif: "5 ta kitob o'qing" },
  { k: "kitob20", belgi: "🐛", nom: "Kitob qurti", olchov: "kitoblar", chegara: 20, tavsif: "20 ta kitob o'qing" },
  { k: "sahifa100", belgi: "📄", nom: "Yuz sahifa", olchov: "jami_sahifa", chegara: 100, tavsif: "Jami 100 sahifa o'qing" },
  { k: "sahifa1000", belgi: "📜", nom: "Ming sahifa", olchov: "jami_sahifa", chegara: 1000, tavsif: "Jami 1000 sahifa o'qing" },
  { k: "sahifa5000", belgi: "🏛", nom: "Kutubxona", olchov: "jami_sahifa", chegara: 5000, tavsif: "Jami 5000 sahifa o'qing" },
  { k: "seriya3", belgi: "🔥", nom: "Uch kun", olchov: "eng_uzun_seriya", chegara: 3, tavsif: "3 kun ketma-ket o'qing" },
  { k: "seriya7", belgi: "⚡", nom: "Bir hafta", olchov: "eng_uzun_seriya", chegara: 7, tavsif: "7 kun ketma-ket o'qing" },
  { k: "seriya30", belgi: "🌋", nom: "Bir oy", olchov: "eng_uzun_seriya", chegara: 30, tavsif: "30 kun ketma-ket o'qing" },
  { k: "iqtibos1", belgi: "❝", nom: "Birinchi iqtibos", olchov: "iqtiboslar", chegara: 1, tavsif: "Lentaga iqtibos joylang" },
  { k: "iqtibos25", belgi: "✒️", nom: "Iqtibosshunos", olchov: "iqtiboslar", chegara: 25, tavsif: "25 ta iqtibos joylang" },
  { k: "yoqtirma50", belgi: "💛", nom: "Sevimli", olchov: "yoqtirmalar", chegara: 50, tavsif: "Iqtiboslaringiz 50 ta yoqtirma olsin" },
  { k: "dost5", belgi: "👥", nom: "Do'stona", olchov: "kitobdoshlar", chegara: 5, tavsif: "5 ta kitobdosh orttiring" },
  { k: "guruh1", belgi: "🏫", nom: "Jamoaviy", olchov: "guruhlar", chegara: 1, tavsif: "Sinf yoki guruhga qo'shiling" },
  { k: "birga1", belgi: "🤝", nom: "Birga o'qidik", olchov: "birga_oqishlar", chegara: 1, tavsif: "Kitobdosh bilan birga kitob tugating" },
  { k: "topgan10", belgi: "🎯", nom: "Topqir", olchov: "topilgan", chegara: 10, tavsif: "«Kim aytgan?»da 10 marta toping" },
  { k: "topgan50", belgi: "🧠", nom: "Bilimdon", olchov: "topilgan", chegara: 50, tavsif: "«Kim aytgan?»da 50 marta toping" },
  { k: "jadid3", belgi: "🖋", nom: "Jadidlar izidan", olchov: "jadid_kitoblar", chegara: 3, tavsif: "Jadid adiblarining 3 ta asarini o'qing" },
];

async function oqishHolatiniOl(m, profilId) {
  const { data, error } = await m.rpc("oqish_holati", { p: profilId });
  if (error || !data || !data[0]) return null;
  return data[0];
}

// Kichik xabar (pastda bir necha soniya)
function qisqaXabar(matn) {
  const x = yarat("div", "qisqa-xabar", matn);
  x.setAttribute("role", "status");
  document.body.appendChild(x);
  requestAnimationFrame(() => x.classList.add("korin"));
  setTimeout(() => { x.classList.remove("korin"); setTimeout(() => x.remove(), 400); }, 3800);
}

// Yangi olingan nishonlarni bir marta e'lon qilamiz (shu qurilmada)
function yangiNishonlarniAyt(h) {
  if (!h || !mening) return;
  const kalit = "sitataNishon_" + mening.id;
  const olingan = NISHONLAR.filter((n) => (h[n.olchov] || 0) >= n.chegara).map((n) => n.k);
  let eski = null;
  try { eski = JSON.parse(localStorage.getItem(kalit)); } catch (e) {}
  try { localStorage.setItem(kalit, JSON.stringify(olingan)); } catch (e) {}
  if (!Array.isArray(eski)) return;   // birinchi marta — eskilarini e'lon qilmaymiz
  const yangi = NISHONLAR.filter((n) => olingan.includes(n.k) && !eski.includes(n.k));
  yangi.forEach((n, i) => setTimeout(() => qisqaXabar(`🏅 Yangi nishon: ${n.belgi} ${n.nom}`), i * 1200));
}

// ---------- Javon tepasidagi seriya kartasi ----------
function seriyaKartasi(m) {
  const q = yarat("div", "seriya-karta");
  q.appendChild(yarat("p", "kichik-matn", "Yuklanmoqda…"));
  (async () => {
    const h = await oqishHolatiniOl(m, mening.id);
    q.innerHTML = "";
    if (!h) { q.remove(); return; }
    yangiNishonlarniAyt(h);
    const olov = yarat("div", "seriya-olov" + (h.bugun > 0 ? " yondi" : ""));
    olov.append(yarat("span", "", "🔥"), yarat("b", "", String(h.joriy_seriya)), yarat("small", "", "kun"));
    const ong = yarat("div", "seriya-ong");
    const maqsad = h.maqsad;
    if (maqsad) {
      const foiz = Math.min(100, Math.round((h.bugun / maqsad) * 100));
      ong.appendChild(yarat("b", "", h.bugun >= maqsad ? `Bugungi maqsad bajarildi ✓` : `Bugun: ${h.bugun} / ${maqsad} sahifa`));
      const bar = yarat("div", "seriya-bar"); const ich = yarat("i", ""); ich.style.width = foiz + "%"; bar.appendChild(ich);
      ong.appendChild(bar);
    } else ong.appendChild(yarat("b", "", h.bugun ? `Bugun: ${h.bugun} sahifa` : "Bugun hali o'qilmadi"));
    ong.appendChild(yarat("span", "kichik-matn",
      h.joriy_seriya ? (h.bugun > 0 ? "Seriya davom etmoqda — ertaga ham o'qing!" : "Bugun ham o'qing — aks holda seriya uziladi.") : "Bugun o'qing — seriya boshlanadi."));
    const maqsadTugma = yarat("button", "matn-tugma", maqsad ? "kunlik maqsad: " + maqsad + " sahifa ✎" : "kunlik maqsad qo'yish"); maqsadTugma.type = "button";
    maqsadTugma.addEventListener("click", () => {
      maqsadTugma.remove();
      const tanlov = yarat("div", "filtrlar seriya-maqsad");
      [5, 10, 20, 30, 50, 100].forEach((n) => {
        const b = yarat("button", "filtr" + (n === maqsad ? " faol" : ""), n + " sahifa"); b.type = "button";
        b.addEventListener("click", async () => {
          await m.from("profillar").update({ kunlik_maqsad: n }).eq("id", mening.id);
          q.replaceWith(seriyaKartasi(m));
        });
        tanlov.appendChild(b);
      });
      ong.appendChild(tanlov);
    });
    ong.appendChild(maqsadTugma);
    q.append(olov, ong);
  })();
  return q;
}

// ---------- Profildagi nishonlar ----------
function nishonlarQismi(m, profil, ozimniki) {
  const q = yarat("div", "nishonlar-qism");
  q.appendChild(yarat("p", "kichik-matn", "Yuklanmoqda…"));
  (async () => {
    const h = await oqishHolatiniOl(m, profil.id);
    q.innerHTML = "";
    if (!h) { q.appendChild(yarat("p", "kichik-matn", "Nishonlarni yuklab bo'lmadi.")); return; }
    if (ozimniki) yangiNishonlarniAyt(h);
    const olingan = NISHONLAR.filter((n) => (h[n.olchov] || 0) >= n.chegara);
    const xulosa = yarat("div", "nishon-xulosa");
    xulosa.append(
      yarat("span", "", `🏅 ${olingan.length} / ${NISHONLAR.length} nishon`),
      yarat("span", "", `🔥 ${h.joriy_seriya} kun seriya`),
      yarat("span", "", `📖 ${h.jami_sahifa} sahifa`));
    q.appendChild(xulosa);
    const panjara = yarat("div", "nishon-panjara");
    NISHONLAR.forEach((n) => {
      const qiymat = h[n.olchov] || 0, bor = qiymat >= n.chegara;
      const k = yarat("div", "nishon-k" + (bor ? " olingan" : ""));
      k.title = n.tavsif;
      k.append(yarat("span", "nishon-belgi", n.belgi), yarat("b", "", n.nom),
        yarat("small", "", bor ? n.tavsif : `${Math.min(qiymat, n.chegara)} / ${n.chegara}`));
      if (!bor) { const bar = yarat("i", "nishon-bar"); bar.style.setProperty("--f", Math.round((qiymat / n.chegara) * 100) + "%"); k.appendChild(bar); }
      panjara.appendChild(k);
    });
    q.appendChild(panjara);
  })();
  return q;
}

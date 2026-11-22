// ===== DO'ST BILAN DUEL =====
// Kitobdoshingizni chaqirasiz: avval siz 10 ta savolga javob berasiz, u keyin xuddi shu savollarga javob beradi.
// Manzillar: #duellar, #duel/yangi/<profil-id>, #duel/<id>. Baza: duellar, duelni_yakunla, duelni_rad_et — supabase/duel.sql

const DUEL_IQTIBOS = { nom: "«Kim aytgan?»", belgi: "❝", izoh: "Iqtibos muallifini toping" };
const duelMavzusi = (k) => (k === "iqtibos" ? DUEL_IQTIBOS : ADABIYOT_MAVZULARI[k]) || { nom: k, belgi: "❓" };

// Duel savollari: adabiyot mavzusi yoki lentadagi iqtiboslar
function duelSavollari(mavzu) {
  if (mavzu !== "iqtibos") return adabiyotSavollari(mavzu);
  return aralashtir(ochiqIqtiboslar(), Math.random).slice(0, 10).map((iq) => ({
    savol: `«${iq.matn.length > 220 ? iq.matn.slice(0, 217) + "…" : iq.matn}» — kim aytgan?`,
    togri: iq.muallif,
    variantlar: aralashtir([iq.muallif, ...oxshashMualliflar(iq.muallif, 3)], Math.random),
  }));
}

function duelNatijasi(d, menId) {
  const men = d.chaqiruvchi === menId;
  const [a, b] = men ? [d.chaqiruvchi_togri, d.raqib_togri] : [d.raqib_togri, d.chaqiruvchi_togri];
  const [ab, bb] = men ? [d.chaqiruvchi_ball, d.raqib_ball] : [d.raqib_ball, d.chaqiruvchi_ball];
  if (d.holat !== "tugadi") return null;
  if (a > b || (a === b && ab > bb)) return "yutdi";
  if (a === b && ab === bb) return "durang";
  return "yutqazdi";
}

async function kitobdoshlarRoyxati(m) {
  const { data } = await m.from("kitobdoshlar").select("kimdan,kimga").eq("holat", "qabul");
  const idlar = (data || []).map((r) => (r.kimdan === mening.id ? r.kimga : r.kimdan));
  const profillar = await profillarniOl(m, idlar);
  return idlar.map((id) => profillar[id]).filter(Boolean).sort((a, b) => a.ism.localeCompare(b.ism));
}

// ---------- #duellar ----------
async function duellarniChiz(param) {
  const s = $("duellarSahifa");
  s.innerHTML = "";
  const [qism, tanlanganId] = String(param || "").split("/");
  if (qism && qism !== "yangi") { duelniChiz(qism); return; }
  s.appendChild(yarat("h2", "sahifa-sarlavha", "⚔️ Duellar"));
  s.appendChild(yarat("p", "kichik-matn markaz", "Kitobdoshingizni bellashuvga chaqiring: bir xil savollar — kim ko'p topadi?"));
  const m = await profilniTekshir(s);
  if (!m) return;

  // Yangi duel
  const yangi = yarat("div", "karta-sozlama duel-yangi");
  yangi.appendChild(yarat("b", "", "Yangi duel"));
  const raqib = yarat("select", "tanlash");
  const mavzu = yarat("select", "tanlash");
  [["iqtibos", DUEL_IQTIBOS], ...Object.entries(ADABIYOT_MAVZULARI)].forEach(([k, mv]) => {
    const o = yarat("option", "", `${mv.belgi} ${mv.nom}`); o.value = k; mavzu.appendChild(o);
  });
  const boshla = yarat("button", "asosiy", "⚔️ Duelni boshlash"); boshla.type = "button";
  const xabar = yarat("p", "kichik-matn");
  yangi.append(raqib, mavzu, boshla, xabar);
  s.appendChild(yangi);

  const royxatlar = yarat("div", "duel-royxatlar");
  royxatlar.appendChild(yarat("p", "bosh-holat", "Yuklanmoqda…"));
  s.appendChild(royxatlar);

  const [dostlar, { data: duellar }] = await Promise.all([
    kitobdoshlarRoyxati(m),
    m.from("duellar").select("id,chaqiruvchi,raqib,mavzu,chaqiruvchi_ball,chaqiruvchi_togri,raqib_ball,raqib_togri,holat,yaratilgan,savollar").order("yaratilgan", { ascending: false }).limit(60),
  ]);
  if (!dostlar.length) {
    raqib.disabled = mavzu.disabled = boshla.disabled = true;
    const o = yarat("option", "", "Hali kitobdoshingiz yo'q"); raqib.appendChild(o);
    xabar.append("Duel faqat kitobdoshlar bilan o'ynaladi. ", havola("#kitobdoshlar", "", "Kitobdosh qo'shish →"));
  } else dostlar.forEach((p) => { const o = yarat("option", "", p.ism + (p.taxallus ? " @" + p.taxallus : "")); o.value = p.id; o.selected = p.id === tanlanganId; raqib.appendChild(o); });

  boshla.addEventListener("click", () => {
    const r = dostlar.find((p) => p.id === raqib.value);
    if (!r) return;
    const k = mavzu.value;
    const savollar = duelSavollari(k);
    if (savollar.length < 3) { xabar.textContent = "Bu mavzuda savollar yetarli emas."; return; }
    adab = {
      k, belgi: duelMavzusi(k).belgi, savollar, i: 0, ball: 0, togri: 0, sahifaId: "duellarSahifa",
      yakun: async () => {
        const sh = $("duellarSahifa");
        sh.innerHTML = "";
        const q = yarat("div", "vik-quti markaz");
        q.append(yarat("p", "katta-belgi", "⚔️"), yarat("p", "katta-son", `${adab.togri} / ${savollar.length}`), yarat("p", "", "Chaqiruv yuborilmoqda…"));
        sh.appendChild(q);
        const { data, error } = await m.from("duellar").insert({
          raqib: r.id, mavzu: k, savollar, chaqiruvchi_ball: Math.min(400, adab.ball), chaqiruvchi_togri: adab.togri,
        }).select("id").single();
        q.lastChild.textContent = error
          ? (/row-level/.test(error.message || "") ? "Yuborilmadi: kutilayotgan chaqiruvlaringiz ko'p (10 ta) — avval ular o'ynasin." : "Yuborilmadi — internetni tekshiring.")
          : `${r.ism}ga chaqiruv yuborildi! U o'ynagach, natijani bildirishnoma orqali bilasiz.`;
        q.appendChild(havola("#duellar", "asosiy", "Duellarga qaytish"));
        if (data) q.appendChild(havola("#duel/" + data.id, "barchasi", "Duel sahifasi →"));
      },
    };
    adabiyotSavoli();
  });

  // Ro'yxatlar
  royxatlar.innerHTML = "";
  const hammasi = duellar || [];
  const profillar = await profillarniOl(m, hammasi.flatMap((d) => [d.chaqiruvchi, d.raqib]));
  const kutyapti = hammasi.filter((d) => d.holat === "kutmoqda" && d.raqib === mening.id);
  const yuborilgan = hammasi.filter((d) => d.holat === "kutmoqda" && d.chaqiruvchi === mening.id);
  const tugagan = hammasi.filter((d) => d.holat === "tugadi");
  const stat = { yutdi: 0, durang: 0, yutqazdi: 0 };
  tugagan.forEach((d) => { stat[duelNatijasi(d, mening.id)]++; });
  if (tugagan.length) royxatlar.appendChild(yarat("p", "duel-stat", `🏆 ${stat.yutdi} g'alaba · 🤝 ${stat.durang} durang · 😅 ${stat.yutqazdi} mag'lubiyat`));

  const qator = (d) => {
    const menChaqirdim = d.chaqiruvchi === mening.id;
    const u = profillar[menChaqirdim ? d.raqib : d.chaqiruvchi] || { ism: "Kitobxon" };
    const mv = duelMavzusi(d.mavzu);
    const a = havola("#duel/" + d.id, "duel-qator", "");
    a.appendChild(avatarEl(u, 40, "kichik"));
    const t = yarat("div", "");
    t.append(yarat("b", "", u.ism), yarat("span", "kichik-matn", `${mv.belgi} ${mv.nom} · ${vaqtOldin(d.yaratilgan)}`));
    a.appendChild(t);
    const n = duelNatijasi(d, mening.id);
    if (n) {
      const [men, u2] = menChaqirdim ? [d.chaqiruvchi_togri, d.raqib_togri] : [d.raqib_togri, d.chaqiruvchi_togri];
      a.appendChild(yarat("span", "duel-hisob " + n, `${men} : ${u2}`));
    } else a.appendChild(yarat("span", "duel-hisob", menChaqirdim ? "kutilmoqda" : "o'ynash →"));
    return a;
  };
  const bolimQosh = (sarlavha, royxat) => {
    if (!royxat.length) return;
    royxatlar.appendChild(yarat("h3", "bolim-sarlavha", sarlavha));
    const q = yarat("div", "royxat"); royxat.forEach((d) => q.appendChild(qator(d))); royxatlar.appendChild(q);
  };
  bolimQosh("🔔 Sizni chaqirishdi", kutyapti);
  bolimQosh("⏳ Javob kutilmoqda", yuborilgan);
  bolimQosh("📜 Natijalar", tugagan.slice(0, 20));
  if (!hammasi.length) royxatlar.appendChild(yarat("p", "bosh-holat", "Hali duel yo'q — birinchisini boshlang!"));
}

// ---------- #duel/<id> ----------
async function duelniChiz(id) {
  const s = $("duellarSahifa");
  s.innerHTML = "";
  s.appendChild(havola("#duellar", "orqaga", "← Duellar"));
  const m = await profilniTekshir(s);
  if (!m) return;
  const { data: d } = await m.from("duellar").select("*").eq("id", Number(id)).maybeSingle();
  if (!d) { s.appendChild(yarat("p", "bosh-holat", "Duel topilmadi.")); return; }
  const profillar = await profillarniOl(m, [d.chaqiruvchi, d.raqib]);
  const ch = profillar[d.chaqiruvchi] || { ism: "Kitobxon" }, rq = profillar[d.raqib] || { ism: "Kitobxon" };
  const mv = duelMavzusi(d.mavzu);
  const n = d.savollar.length;

  // Raqib hali o'ynamagan — o'ynash taklifi
  if (d.holat === "kutmoqda" && d.raqib === mening.id) {
    const q = yarat("div", "vik-quti markaz");
    q.append(yarat("p", "katta-belgi", "⚔️"), yarat("h3", "", `${ch.ism} sizni duelga chaqirdi`),
      yarat("p", "", `${mv.belgi} ${mv.nom} · ${n} ta savol`),
      yarat("p", "eng-yaxshi", `${ch.ism}: ${d.chaqiruvchi_togri} / ${n} to'g'ri`),
      yarat("p", "kichik-matn", "Undan ko'p toping — teng bo'lsa, tezroq javob bergan (ko'p ball olgan) yutadi."));
    const b = yarat("button", "asosiy", "Boshlash"); b.type = "button";
    const rad = yarat("button", "matn-tugma", "Rad etish"); rad.type = "button";
    rad.addEventListener("click", async () => { if (!confirm("Duelni rad etasizmi?")) return; await m.rpc("duelni_rad_et", { p_id: d.id }); location.hash = "#duellar"; });
    b.addEventListener("click", () => {
      adab = {
        k: d.mavzu, belgi: mv.belgi, savollar: d.savollar, i: 0, ball: 0, togri: 0, sahifaId: "duellarSahifa",
        yakun: async () => {
          await m.rpc("duelni_yakunla", { p_id: d.id, p_ball: Math.min(400, adab.ball), p_togri: adab.togri });
          duelniChiz(d.id);
        },
      };
      adabiyotSavoli();
    });
    q.append(b, rad);
    s.appendChild(q);
    return;
  }

  // Natija kartasi
  const karta = yarat("div", "duel-karta");
  const tomon = (p, togri, ball, golib) => {
    const t = yarat("div", "duel-tomon" + (golib ? " golib" : ""));
    t.append(avatarEl(p, 64, "katta"), yarat("b", "", p.ism), yarat("span", "duel-son", togri == null ? "…" : `${togri}/${n}`),
      yarat("small", "", ball == null ? "o'ynamagan" : `${ball} ball`));
    if (golib) t.prepend(yarat("span", "duel-toj", "👑"));
    return t;
  };
  const natija = duelNatijasi(d, d.chaqiruvchi);
  karta.append(tomon(ch, d.chaqiruvchi_togri, d.chaqiruvchi_ball, natija === "yutdi"), yarat("span", "duel-vs", "VS"),
    tomon(rq, d.raqib_togri, d.raqib_ball, natija === "yutqazdi"));
  s.appendChild(yarat("p", "kichik-matn markaz", `${mv.belgi} ${mv.nom}`));
  s.appendChild(karta);
  const holat = d.holat === "rad" ? `${rq.ism} duelni rad etdi.` : d.holat !== "tugadi" ? `${rq.ism} hali o'ynamadi.`
    : natija === "durang" ? "Durang! 🤝" : `${(natija === "yutdi" ? ch : rq).ism} yutdi! 🏆`;
  s.appendChild(yarat("p", "duel-holat", holat));
  if (d.holat === "tugadi") {
    const boshqa = d.chaqiruvchi === mening.id ? d.raqib : d.chaqiruvchi;
    s.appendChild(havola("#duellar/yangi/" + boshqa, "asosiy", "⚔️ Qayta bellashish"));
    // Savollar va to'g'ri javoblar
    const det = yarat("details", "duel-savollar");
    det.appendChild(yarat("summary", "", "Savollar va to'g'ri javoblar"));
    d.savollar.forEach((sv, i) => { const p = yarat("p", ""); p.append(yarat("span", "", `${i + 1}. ${sv.savol} `), yarat("b", "", sv.togri)); det.appendChild(p); });
    s.appendChild(det);
  }
}

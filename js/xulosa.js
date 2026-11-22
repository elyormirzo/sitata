// ===== YILLIK O'QISH XULOSASI =====
// Story kabi varaqlanadigan slaydlar: kitoblar, sahifalar, seriya, sevimli muallif, iqtiboslar, o'yinlar.
// Oxirida — ulashish uchun 1080×1920 rasm. Manzil: #xulosa yoki #xulosa/2026. Baza: yillik_xulosa(yil)

const XULOSA_OYLARI = ["yanvar", "fevral", "mart", "aprel", "may", "iyun", "iyul", "avgust", "sentabr", "oktabr", "noyabr", "dekabr"];
const xulosaSon = (n) => String(Number(n || 0)).replace(/\B(?=(\d{3})+(?!\d))/g, " ");   // 2 380
const XULOSA_RANGLARI = [
  ["#3B1F5C", "#C8507A"], ["#0C2D48", "#2E8BC0"], ["#1B4332", "#52B788"], ["#7E3F27", "#E9A23B"],
  ["#14213D", "#FCA311"], ["#2B2D42", "#8D5A97"], ["#003049", "#D62828"], ["#264653", "#E9C46A"],
];

function xulosaSlaydlari(x) {
  const sl = [];
  const ism = mening ? mening.ism : "";
  sl.push({ belgi: "🎁", katta: String(x.yil), matn: `${ism}, bu — sizning kitob yilingiz`, kichik: "Bir yil ichida nimalar o'qidingiz — keling, ko'ramiz" });
  const k = x.kitoblar || [];
  if (k.length) sl.push({ belgi: "📚", katta: String(k.length), matn: k.length === 1 ? "ta kitobni oxirigacha o'qidingiz" : "ta kitobni oxirigacha o'qidingiz", kitoblar: k });
  else sl.push({ belgi: "📖", katta: "0", matn: "bu yil tugatilgan kitob yo'q", kichik: "Hechqisi yo'q — yangi yil, yangi kitoblar! Javonga birinchisini qo'ying." });
  if (x.sahifalar) {
    const ortacha = x.kunlar ? Math.round(x.sahifalar / x.kunlar) : 0;
    sl.push({ belgi: "📄", katta: xulosaSon(x.sahifalar), matn: "sahifa o'qidingiz",
      kichik: [x.kunlar ? `${x.kunlar} kun o'qidingiz, kuniga o'rtacha ${ortacha} sahifa` : "", x.eng_kop_oy ? `Eng ko'p o'qigan oyingiz — ${XULOSA_OYLARI[x.eng_kop_oy - 1]}` : ""].filter(Boolean).join(". ") });
  }
  if (x.eng_uzun_seriya > 1) sl.push({ belgi: "🔥", katta: String(x.eng_uzun_seriya), matn: "kun ketma-ket o'qidingiz", kichik: x.eng_uzun_seriya >= 30 ? "Bir oydan ortiq! Bu — haqiqiy kitobxonlik." : x.eng_uzun_seriya >= 7 ? "Bir haftadan ortiq uzluksiz — zo'r!" : "Keyingi yil bundan ham uzunroq seriya qilamiz!" });
  if (x.sevimli_muallif) sl.push({ belgi: "✍️", katta: x.sevimli_muallif, kattaKichik: true, matn: "— yilning sevimli muallifingiz", portret: x.sevimli_muallif });
  if (x.iqtiboslar) sl.push({ belgi: "❝", katta: String(x.iqtiboslar), matn: "ta iqtibos joyladingiz",
    kichik: x.yoqtirmalar ? `Ular ${x.yoqtirmalar} ta yoqtirma oldi` : "", iqtibos: x.eng_yaxshi_iqtibos && x.eng_yaxshi_iqtibos.yoqtirishlar ? x.eng_yaxshi_iqtibos : null });
  const qoshimcha = [x.topilgan ? `🎯 «Kim aytgan?»da ${x.topilgan} marta topdingiz` : "", x.duel_galaba ? `⚔️ ${x.duel_galaba} ta duelda g'alaba qozondingiz` : "",
    x.yangi_kitobdoshlar ? `👥 ${x.yangi_kitobdoshlar} ta yangi kitobdosh orttirdingiz` : ""].filter(Boolean);
  if (qoshimcha.length) sl.push({ belgi: "🏆", katta: "Yana", matn: "nimalar qildingiz:", royxat: qoshimcha });
  sl.push({ belgi: "✨", katta: "Rahmat!", matn: `${x.yil}-yil uchun`, kichik: "Xulosangizni do'stlaringiz bilan ulashing", yakun: true });
  return sl;
}

async function xulosaniChiz(param) {
  const s = $("xulosaSahifa");
  s.innerHTML = "";
  const m = await profilniTekshir(s);
  if (!m) return;
  const yil = Number(param) || new Date().getFullYear();
  s.appendChild(yarat("p", "bosh-holat", "Xulosa tayyorlanmoqda…"));
  const { data: x, error } = await m.rpc("yillik_xulosa", { p_yil: yil });
  s.innerHTML = "";
  if (error || !x) { s.appendChild(yarat("p", "bosh-holat", "Xulosani yuklab bo'lmadi.")); return; }
  const slaydlar = xulosaSlaydlari(x);
  let i = 0;

  const ekran = yarat("div", "xulosa-ekran");
  const chiziqlar = yarat("div", "xulosa-chiziqlar");
  slaydlar.forEach(() => chiziqlar.appendChild(yarat("i", "")));
  const yop = havola("#profilim", "xulosa-yop", "✕"); yop.setAttribute("aria-label", "Yopish");
  const tana = yarat("div", "xulosa-tana");
  const orqa = yarat("button", "xulosa-orqa"); orqa.type = "button"; orqa.setAttribute("aria-label", "Oldingi");
  const oldin = yarat("button", "xulosa-oldin"); oldin.type = "button"; oldin.setAttribute("aria-label", "Keyingi");
  ekran.append(chiziqlar, yop, tana, orqa, oldin);
  s.appendChild(ekran);

  const chiz = () => {
    const sl = slaydlar[i];
    const [r1, r2] = XULOSA_RANGLARI[i % XULOSA_RANGLARI.length];
    ekran.style.background = `linear-gradient(160deg, ${r1}, ${r2})`;
    [...chiziqlar.children].forEach((c, j) => c.classList.toggle("toldi", j <= i));
    tana.innerHTML = "";
    tana.classList.remove("kir"); void tana.offsetWidth; tana.classList.add("kir");
    tana.appendChild(yarat("div", "xulosa-belgi", sl.belgi));
    if (sl.portret && typeof portretEl === "function" && MUALLIFLAR[sl.portret]) tana.appendChild(portretEl(sl.portret, "xulosa-portret"));
    tana.appendChild(yarat("div", "xulosa-katta" + (sl.kattaKichik ? " ism" : ""), sl.katta));
    tana.appendChild(yarat("p", "xulosa-matn", sl.matn));
    if (sl.kitoblar) {
      const q = yarat("div", "xulosa-kitoblar");
      sl.kitoblar.slice(0, 12).forEach((k) => {
        const b = yarat("div", "xulosa-kitob");
        if (typeof muqovaEl === "function") b.appendChild(muqovaEl(k.kitob, true, k.muqova));
        b.appendChild(yarat("small", "", k.kitob));
        q.appendChild(b);
      });
      tana.appendChild(q);
      if (sl.kitoblar.length > 12) tana.appendChild(yarat("p", "xulosa-kichik", `va yana ${sl.kitoblar.length - 12} ta`));
    }
    if (sl.iqtibos) {
      const b = yarat("blockquote", "xulosa-iqtibos", "«" + sl.iqtibos.matn + "»");
      tana.append(yarat("p", "xulosa-kichik", "Eng ko'p yoqtirilgan iqtibosingiz:"), b, yarat("p", "xulosa-kichik", `♥ ${sl.iqtibos.yoqtirishlar}`));
    }
    if (sl.royxat) { const u = yarat("ul", "xulosa-royxat"); sl.royxat.forEach((t) => u.appendChild(yarat("li", "", t))); tana.appendChild(u); }
    if (sl.kichik) tana.appendChild(yarat("p", "xulosa-kichik", sl.kichik));
    if (sl.yakun) {
      const tugmalar = yarat("div", "xulosa-tugmalar");
      const ulash = yarat("button", "asosiy", "📤 Ulashish"); ulash.type = "button";
      const yuklab = yarat("button", "ikkilamchi", "Rasmni yuklab olish"); yuklab.type = "button";
      const xabar = yarat("p", "xulosa-kichik");
      let blob = null;
      const tayyorla = async () => blob || (blob = await xulosaRasmi(x));
      ulash.addEventListener("click", async () => { const b = await tayyorla(); faylniUlash(b, `sitata-${x.yil}.png`, xabar); });
      yuklab.addEventListener("click", async () => { const b = await tayyorla(); rasmniYuklabOl(b, `sitata-${x.yil}.png`); xabar.textContent = "Rasm yuklab olindi."; });
      [ulash, yuklab].forEach((b) => b.addEventListener("click", (e) => e.stopPropagation()));
      tugmalar.append(ulash, yuklab, xabar);
      tana.appendChild(tugmalar);
    }
    orqa.disabled = i === 0; oldin.disabled = i === slaydlar.length - 1;
  };
  orqa.addEventListener("click", () => { if (i > 0) { i--; chiz(); } });
  oldin.addEventListener("click", () => { if (i < slaydlar.length - 1) { i++; chiz(); } });
  chiz();
}

// Ulashish uchun rasm (story o'lchami)
async function xulosaRasmi(x) {
  const W = 1080, H = 1920;
  const c = document.createElement("canvas"); c.width = W; c.height = H;
  const ctx = c.getContext("2d");
  const shrift = '"Lora", Georgia, serif';
  try { await document.fonts.load(`600 60px ${shrift}`); } catch (e) {}
  const g = ctx.createLinearGradient(0, 0, W * 0.5, H);
  g.addColorStop(0, "#1A0E3A"); g.addColorStop(1, "#C8507A");
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  if (typeof kartaBezagi === "function") kartaBezagi(ctx, W, H, { bezak: "yulduz", aksent: "#FFD166", matn: "#FFFFFF" });
  ctx.textAlign = "center"; ctx.fillStyle = "#FFFFFF";
  ctx.font = `600 64px ${shrift}`; ctx.fillText(`${x.yil} — kitob yilim`, W / 2, 230);
  ctx.font = `italic 500 40px ${shrift}`; ctx.fillStyle = "#FFE4EA"; ctx.fillText(mening ? mening.ism : "", W / 2, 300);
  const qutilar = [["📚", (x.kitoblar || []).length, "kitob"], ["📄", x.sahifalar, "sahifa"], ["🔥", x.eng_uzun_seriya, "kunlik seriya"], ["❝", x.iqtiboslar, "iqtibos"]];
  qutilar.forEach(([belgi, son, nom], j) => {
    const cx = j % 2 ? W * 0.72 : W * 0.28, cy = 520 + Math.floor(j / 2) * 380;
    ctx.fillStyle = "rgba(255,255,255,.12)";
    ctx.beginPath(); ctx.roundRect ? ctx.roundRect(cx - 220, cy - 150, 440, 320, 40) : ctx.rect(cx - 220, cy - 150, 440, 320); ctx.fill();
    ctx.fillStyle = "#FFFFFF"; ctx.font = `64px ${shrift}`; ctx.fillText(belgi, cx, cy - 50);
    ctx.font = `700 110px ${shrift}`; ctx.fillText(xulosaSon(son), cx, cy + 70);
    ctx.font = `500 38px ${shrift}`; ctx.fillStyle = "#FFE4EA"; ctx.fillText(nom, cx, cy + 130);
  });
  let y = 1350;
  if (x.sevimli_muallif) {
    ctx.fillStyle = "#FFE4EA"; ctx.font = `italic 500 38px ${shrift}`; ctx.fillText("Sevimli muallifim", W / 2, y);
    ctx.fillStyle = "#FFFFFF"; ctx.font = `600 64px ${shrift}`; ctx.fillText(x.sevimli_muallif, W / 2, y + 80); y += 180;
  }
  const kitoblar = (x.kitoblar || []).slice(0, 4).map((k) => "«" + k.kitob + "»").join(" · ");
  if (kitoblar) {
    ctx.fillStyle = "#FFFFFF"; ctx.font = `500 34px ${shrift}`;
    const qatorlar = qatorlargaBol(ctx, kitoblar, W - 200).slice(0, 3);
    qatorlar.forEach((q) => { ctx.fillText(q, W / 2, y); y += 48; });
  }
  ctx.fillStyle = "#FFD166"; ctx.font = `600 40px ${shrift}`;
  ctx.fillText(mening && mening.taxallus ? "sitata.uz/" + mening.taxallus : "sitata.uz", W / 2, H - 110);
  return new Promise((ok) => c.toBlob(ok, "image/png"));
}

// Profil va javondagi kirish tugmasi
function xulosaTugmasi() {
  const yil = new Date().getFullYear();
  const a = havola("#xulosa/" + yil, "xulosa-tugma", "");
  a.append(yarat("span", "", "🎁"), yarat("b", "", `${yil}-yil o'qish xulosangiz`), yarat("span", "", "→"));
  return a;
}

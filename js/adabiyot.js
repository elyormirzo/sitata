// ===== MAKTAB DASTURI VIKTORINALARI =====
// Viktorina sahifasida: asarlar va mavzular bo'yicha savollar (4 ta variant, 20 soniya).
// Savollar to'plami: ADABIYOT_MAVZULARI. Har savol: [savol, to'g'ri javob, 3 ta noto'g'ri variant].
// Ball — oddiy viktorina bilan bir xil (kuniga birinchi natija darajaga qo'shiladi).

const ADABIYOT_MAVZULARI = {
  otkan: {
    nom: "«O'tkan kunlar»", belgi: "📕", izoh: "Abdulla Qodiriy romani",
    savollar: [
      ["«O'tkan kunlar» romanining muallifi kim?", "Abdulla Qodiriy", "Cho'lpon", "Oybek", "Abdulla Qahhor"],
      ["Romanning bosh qahramoni kim?", "Otabek", "Anvar", "Akbarali", "Hoshimjon"],
      ["Otabekning otasi kim?", "Yusufbek hoji", "Mirzakarim qutidor", "Razzoq so'fi", "Solih maxdum"],
      ["Otabekning onasi kim?", "O'zbek oyim", "Oftob oyim", "Zaynab", "Xushro'y"],
      ["Kumushning otasi kim?", "Mirzakarim qutidor", "Yusufbek hoji", "Homid", "Hasanali"],
      ["Kumush qaysi shaharda yashaydi?", "Marg'ilon", "Buxoro", "Samarqand", "Xiva"],
      ["Otabek qaysi shahardan?", "Toshkent", "Marg'ilon", "Qo'qon", "Andijon"],
      ["Otabekning ikkinchi xotini kim?", "Zaynab", "Ra'no", "Zebi", "Barchin"],
      ["Otabekning sodiq xizmatkori kim?", "Hasanali", "Homid", "Miryoqub", "Qorajon"],
      ["Otabek bilan Kumush orasiga nifoq solgan salbiy qahramon kim?", "Homid", "Hasanali", "Yusufbek hoji", "Akbarali mingboshi"],
      ["«O'tkan kunlar» o'zbek adabiyotida qanday asar sifatida mashhur?", "Birinchi o'zbek romani", "Birinchi o'zbek dramasi", "Birinchi xalq dostoni", "Birinchi she'riy to'plam"],
      ["Abdulla Qodiriy qaysi taxallus bilan ham yozgan?", "Julqunboy", "Foniy", "Cho'lpon", "Hamza"],
    ],
  },
  kecha: {
    nom: "«Kecha va kunduz»", belgi: "🌗", izoh: "Cho'lpon romani",
    savollar: [
      ["«Kecha va kunduz» romanining muallifi kim?", "Cho'lpon", "Abdulla Qodiriy", "Fitrat", "Hamza Hakimzoda Niyoziy"],
      ["Romanning bosh qahramoni bo'lgan qiz kim?", "Zebi", "Kumush", "Ra'no", "Barchin"],
      ["Zebining otasi kim?", "Razzoq so'fi", "Yusufbek hoji", "Solih maxdum", "Mirzakarim qutidor"],
      ["Zebi kimga xotin qilib beriladi?", "Akbarali mingboshiga", "Otabekka", "Miryoqubga", "Anvarga"],
      ["Akbarali mingboshining ayyor yordamchisi kim?", "Miryoqub", "Hasanali", "Homid", "Ultontoz"],
      ["Cho'lponning asl ismi nima?", "Abdulhamid", "Abdurauf", "Abdulla", "Mahmudxo'ja"],
      ["«Cho'lpon» taxallusi nimani anglatadi?", "Tong yulduzi", "Qora tun", "Bahor shamoli", "Oy nuri"],
      ["Qaysi asar Cho'lponga tegishli?", "«Yorqinoy»", "«Padarkush»", "«Abulfayzxon»", "«Sarob»"],
    ],
  },
  alpomish: {
    nom: "«Alpomish»", belgi: "🐎", izoh: "O'zbek xalq dostoni",
    savollar: [
      ["«Alpomish» qanday asar?", "Xalq dostoni", "Roman", "Drama", "Hikoya"],
      ["Alpomishning suyuklisi kim?", "Barchin", "Kumush", "Zebi", "Layli"],
      ["Alpomishning otining nomi nima?", "Boychibor", "G'irot", "Duldul", "Rahsh"],
      ["Alpomish qaysi elning botiri?", "Qo'ng'irot", "Qalmoq", "Mang'it", "Qipchoq"],
      ["Alpomishning otasi kim?", "Boybo'ri", "Boysari", "Ultontoz", "Toychixon"],
      ["Barchinning otasi kim?", "Boysari", "Boybo'ri", "Qorajon", "Ultontoz"],
      ["Alpomish bilan do'stlashgan qalmoq botiri kim?", "Qorajon", "Ultontoz", "Toychixon", "Ko'kaldosh"],
      ["Alpomish yo'qligida yurtini egallab olgan zolim kim?", "Ultontoz", "Qorajon", "Boysari", "Toychixon"],
      ["Alpomish qalmoq yurtida necha yil zindonda yotadi?", "7 yil", "3 yil", "12 yil", "40 yil"],
    ],
  },
  navoiy: {
    nom: "Alisher Navoiy", belgi: "🕌", izoh: "Hayoti va asarlari",
    savollar: [
      ["Alisher Navoiy qaysi shaharda tug'ilgan?", "Hirot", "Samarqand", "Buxoro", "Andijon"],
      ["Alisher Navoiy qaysi yili tug'ilgan?", "1441-yil", "1370-yil", "1483-yil", "1501-yil"],
      ["«Xamsa» nechta dostondan iborat?", "5 ta", "3 ta", "7 ta", "4 ta"],
      ["Qaysi doston «Xamsa»ga kirmaydi?", "«Lison ut-tayr»", "«Farhod va Shirin»", "«Layli va Majnun»", "«Saddi Iskandariy»"],
      ["«Xamsa»ning birinchi dostoni qaysi?", "«Hayrat ul-abror»", "«Sab'ai sayyor»", "«Farhod va Shirin»", "«Saddi Iskandariy»"],
      ["Turkiy tilning boyligini isbotlagan Navoiy asari qaysi?", "«Muhokamat ul-lug'atayn»", "«Boburnoma»", "«Qutadg'u bilig»", "«Devonu lug'otit turk»"],
      ["Navoiyning yaqin do'sti bo'lgan Hirot hukmdori kim?", "Husayn Boyqaro", "Amir Temur", "Mirzo Ulug'bek", "Zahiriddin Bobur"],
      ["Navoiy fors tilidagi she'rlarida qaysi taxallusni qo'llagan?", "Foniy", "Navoiy", "Julqunboy", "Cho'lpon"],
    ],
  },
  jadidlar: {
    nom: "Jadidlar", belgi: "🖋", izoh: "Ma'rifatparvarlar va ularning asarlari",
    savollar: [
      ["«Jadid» so'zi nimani anglatadi?", "Yangi", "Eski", "Ilm", "Maktab"],
      ["«Padarkush» dramasining muallifi kim?", "Mahmudxo'ja Behbudiy", "Abdurauf Fitrat", "Hamza Hakimzoda Niyoziy", "Abdulla Avloniy"],
      ["«Turkiy guliston yoxud axloq» asarining muallifi kim?", "Abdulla Avloniy", "Mahmudxo'ja Behbudiy", "Cho'lpon", "Munavvar qori"],
      ["«Tarbiya biz uchun yo hayot — yo mamot, yo najot — yo halokat...» degan so'zlar kimniki?", "Abdulla Avloniy", "Alisher Navoiy", "Abdulla Qodiriy", "Abdurauf Fitrat"],
      ["«Abulfayzxon» fojiasining muallifi kim?", "Abdurauf Fitrat", "Cho'lpon", "Mahmudxo'ja Behbudiy", "Abdulla Qodiriy"],
      ["«Tarjumon» gazetasini chiqargan ma'rifatparvar kim?", "Ismoil Gaspirali", "Mahmudxo'ja Behbudiy", "Is'hoqxon Ibrat", "Sadriddin Ayniy"],
      ["Jadidlar ochgan yangi usuldagi maktablar qanday atalgan?", "Usuli jadid maktablari", "Madrasa", "Qorixona", "Litsey"],
      ["Qaysi adib ham jadidlar safida bo'lgan?", "Abdulla Qodiriy", "Alisher Navoiy", "Zahiriddin Bobur", "Mirzo Ulug'bek"],
    ],
  },
  kim: {
    nom: "Kim yozgan?", belgi: "✍️", izoh: "Asarni muallifi bilan moslang", aralash: true,
    // [asar, muallif] — variantlar boshqa mualliflardan olinadi
    juftlar: [
      ["«Shum bola»", "G'afur G'ulom"], ["«Sen yetim emassan» she'ri", "G'afur G'ulom"],
      ["«Sariq devni minib»", "Xudoyberdi To'xtaboyev"], ["«Dunyoning ishlari»", "O'tkir Hoshimov"],
      ["«Ikki eshik orasi»", "O'tkir Hoshimov"], ["«Yulduzli tunlar»", "Pirimqul Qodirov"],
      ["«Navoiy» romani", "Oybek"], ["«Qutlug' qon»", "Oybek"], ["«Sarob»", "Abdulla Qahhor"],
      ["«Kelinlar qo'zg'aloni»", "Said Ahmad"], ["«Mehrobdan chayon»", "Abdulla Qodiriy"],
      ["«Boburnoma»", "Zahiriddin Muhammad Bobur"], ["«Shaytanat»", "Tohir Malik"],
      ["O'zbekiston davlat madhiyasi so'zlari", "Abdulla Oripov"], ["«O'zbegim» qasidasi", "Erkin Vohidov"],
      ["«Ruhlar isyoni» dostoni", "Erkin Vohidov"], ["«Oq kema»", "Chingiz Aytmatov"],
      ["«Padarkush»", "Mahmudxo'ja Behbudiy"], ["«Abulfayzxon»", "Abdurauf Fitrat"], ["«Kecha va kunduz»", "Cho'lpon"],
    ],
  },
};
const ADABIYOT_SONIYA = 20, ADABIYOT_SAVOLLARI = 10;
let adab = null;

// Mavzudan savollar: aralashtirilgan tartib va variantlar
function adabiyotSavollari(k) {
  const mv = ADABIYOT_MAVZULARI[k];
  let savollar;
  if (mv.aralash) {
    const mualliflar = [...new Set(mv.juftlar.map((j) => j[1]))];
    savollar = mv.juftlar.map(([asar, muallif]) => [`${asar} — kimning asari?`, muallif,
      ...aralashtir(mualliflar.filter((x) => x !== muallif), Math.random).slice(0, 3)]);
  } else savollar = mv.savollar;
  return aralashtir(savollar, Math.random).slice(0, ADABIYOT_SAVOLLARI)
    .map(([savol, togri, ...xato]) => ({ savol, togri, variantlar: aralashtir([togri, ...xato], Math.random) }));
}

// Viktorina sahifasidagi bo'lim: mavzular ro'yxati
function adabiyotBolimi() {
  const q = yarat("div", "adabiyot-bolim");
  q.append(yarat("h3", "bolim-sarlavha", "📚 Maktab dasturi bo'yicha"),
    yarat("p", "kichik-matn markaz", "Asarlar, qahramonlar va mualliflar — imtihon va olimpiadaga tayyorgarlik uchun"));
  const panjara = yarat("div", "adabiyot-panjara");
  Object.entries(ADABIYOT_MAVZULARI).forEach(([k, mv]) => {
    const b = yarat("button", "adabiyot-karta"); b.type = "button";
    const rekord = xotiradanOl("sitataAdabiyot_" + k, null);
    const son = mv.aralash ? mv.juftlar.length : mv.savollar.length;
    b.append(yarat("span", "adabiyot-belgi", mv.belgi), yarat("b", "", mv.nom), yarat("small", "", mv.izoh),
      yarat("span", "adabiyot-son", rekord !== null ? `Eng yaxshi: ${rekord} / ${Math.min(son, ADABIYOT_SAVOLLARI)}` : `${Math.min(son, ADABIYOT_SAVOLLARI)} ta savol`));
    b.addEventListener("click", () => adabiyotniBoshla(k));
    panjara.appendChild(b);
  });
  q.appendChild(panjara);
  return q;
}

function adabiyotniBoshla(k) {
  adab = { k, savollar: adabiyotSavollari(k), i: 0, ball: 0, togri: 0 };
  adabiyotSavoli();
}

function adabiyotSavoli() {
  const s = $(adab.sahifaId || "viktorinaSahifa");
  const sv = adab.savollar[adab.i];
  s.innerHTML = "";
  const yuqori = yarat("div", "vik-yuqori");
  const belgi = adab.belgi || (ADABIYOT_MAVZULARI[adab.k] || {}).belgi || "❓";
  yuqori.append(yarat("span", "", `${belgi} Savol ${adab.i + 1} / ${adab.savollar.length}`), yarat("span", "", `${adab.ball} ball`));
  const chiziq = yarat("div", "vik-vaqt"); const tolgan = yarat("span"); chiziq.appendChild(tolgan);
  const k = yarat("article", "iqtibos-karta adabiyot-savol");
  k.appendChild(yarat("p", "", sv.savol));
  s.append(yuqori, chiziq, k);

  const variantlar = yarat("div", "vik-variantlar adabiyot-variantlar");
  const SONIYA = adab.soniya || ADABIYOT_SONIYA;
  let berildi = false, qolgan = SONIYA;
  const boshlangan = Date.now();
  const javob = (tanlangan) => {
    if (berildi) return;
    berildi = true;
    clearInterval(viktorinaTaymeri);
    if (tanlangan === sv.togri) { adab.togri++; adab.ball += 10 + Math.max(0, Math.ceil(qolgan / 2)); }
    if (adab.javobda) adab.javobda(sv, tanlangan === sv.togri);
    [...variantlar.children].forEach((b) => {
      b.disabled = true;
      if (b.dataset.v === sv.togri) b.classList.add("togri");
      else if (b.dataset.v === tanlangan) b.classList.add("xato");
    });
    yuqori.lastChild.textContent = `${adab.ball} ball`;
    setTimeout(() => { adab.i++; if (adab.i < adab.savollar.length) adabiyotSavoli(); else (adab.yakun || adabiyotYakuni)(); }, tanlangan === sv.togri ? 1100 : 1900);
  };
  sv.variantlar.forEach((v, i) => {
    const b = yarat("button", "vik-variant"); b.type = "button"; b.dataset.v = v;
    b.append(yarat("span", "variant-harf", "ABCD"[i]), yarat("span", "", v));
    b.addEventListener("click", () => javob(v));
    variantlar.appendChild(b);
  });
  s.appendChild(variantlar);
  clearInterval(viktorinaTaymeri);
  viktorinaTaymeri = setInterval(() => {
    qolgan = SONIYA - (Date.now() - boshlangan) / 1000;
    tolgan.style.width = Math.max(0, (qolgan / SONIYA) * 100) + "%";
    tolgan.classList.toggle("oz", qolgan < 6);
    if (qolgan <= 0) javob(null);
  }, 100);
}

function adabiyotYakuni() {
  const s = $("viktorinaSahifa");
  const mv = ADABIYOT_MAVZULARI[adab.k];
  s.innerHTML = "";
  s.appendChild(yarat("h2", "sahifa-sarlavha", mv.nom));
  const kalit = "sitataAdabiyot_" + adab.k;
  const avvalgi = xotiradanOl(kalit, null);
  const rekord = avvalgi === null || adab.togri > avvalgi;
  if (rekord) xotiragaYoz(kalit, adab.togri);
  const n = adab.savollar.length, foiz = adab.togri / n;
  const quti = yarat("div", "vik-quti markaz");
  quti.append(yarat("p", "katta-belgi", foiz === 1 ? "🏆" : foiz >= 0.7 ? "🎉" : foiz >= 0.4 ? "👍" : "📖"),
    yarat("p", "katta-son", `${adab.togri} / ${n}`), yarat("p", "", "to'g'ri javob"),
    yarat("p", "", foiz === 1 ? "A'lo! Asarni juda yaxshi bilasiz." : foiz >= 0.7 ? "Yaxshi natija!" : foiz >= 0.4 ? "Yomon emas — yana bir bor urinib ko'ring." : "Asarni qayta o'qib chiqishni tavsiya qilamiz."),
    yarat("p", "eng-yaxshi", rekord && avvalgi !== null ? "Yangi rekord! ★" : avvalgi !== null ? `Eng yaxshi natijangiz: ${avvalgi} / ${n}` : `${adab.ball} ball`));
  const ballXabari = yarat("p", "kichik-matn");
  quti.appendChild(ballXabari);
  if (adab.ball > 0 && typeof viktorinaNatijasiniYoz === "function") viktorinaNatijasiniYoz(adab.ball, ballXabari);
  const qayta = yarat("button", "asosiy", "Qayta o'ynash"); qayta.type = "button";
  qayta.addEventListener("click", () => adabiyotniBoshla(adab.k));
  const boshqa = yarat("button", "ikkilamchi", "Boshqa mavzu"); boshqa.type = "button";
  boshqa.addEventListener("click", () => viktorinaBoshi());
  const nusxa = yarat("button", "ikkilamchi", "Natijani ulashish"); nusxa.type = "button";
  nusxa.addEventListener("click", async () => {
    const ok = await nusxaOl(`sitata.uz — ${mv.nom} viktorinasi: ${n} tadan ${adab.togri} ta to'g'ri! Siz ham sinab ko'ring: ${SAYT_MANZILI}#viktorina`);
    nusxa.textContent = ok ? "Nusxalandi ✓" : "Nusxa olinmadi";
  });
  quti.append(qayta, boshqa, nusxa);
  s.appendChild(quti);
}

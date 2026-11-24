// ===== KO'P TILLILIK =====
// Til: ?til=ru|en|uz → saqlangan tanlov → O'zbekistonda bo'lsa o'zbekcha → brauzer tili (ru/en) → o'zbekcha.
// t("o'zbekcha matn", {n: 5}) — tarjimasi bo'lsa tarjima, bo'lmasa asl matn ({n} — o'rniga qo'yiladi).
// Statik HTML matnlari sahifa yuklanganda avtomatik tarjima qilinadi (sahifaniTarjimaQil).
// Tarjima qilinmagan joylar vaqtincha o'zbekcha qoladi — sayt bosqichma-bosqich tarjima qilinadi.

const TILLAR = { uz: "O'zbekcha", ru: "Русский", en: "English" };
const TIL = (() => {
  try {
    const p = new URLSearchParams(location.search).get("til");
    if (p && TILLAR[p]) { localStorage.setItem("sitataTil", p); return p; }
    const s = localStorage.getItem("sitataTil");
    if (s && TILLAR[s]) return s;
  } catch (e) { /* xotira yo'q */ }
  try {
    const zona = Intl.DateTimeFormat().resolvedOptions().timeZone || "";
    if (/^Asia\/(Tashkent|Samarkand)$/.test(zona)) return "uz";   // O'zbekistonda — o'zbekcha (telefon ruscha bo'lsa ham)
  } catch (e) {}
  const b = (navigator.languages || [navigator.language || ""]).map((x) => String(x).slice(0, 2).toLowerCase());
  for (const x of b) { if (x === "uz") return "uz"; if (x === "ru") return "ru"; if (x === "en") return "en"; }
  return "uz";
})();
document.documentElement.lang = TIL;

const TARJIMA = {
  ru: {
    // Menyu va navigatsiya
    "Menyu": "Меню", "Mundarija": "Содержание", "Lenta": "Лента", "iqtiboslar": "цитаты", "Kim aytgan?": "Кто сказал?", "kunlik o'yin": "ежедневная игра",
    "Viktorina": "Викторина", "Duellar": "Дуэли", "do'st bilan bellashuv": "соревнование с другом", "Barcha bo'limlar": "Все разделы",
    "Mualliflar": "Авторы", "Karta yaratish": "Создать карточку", "Kitob javonim": "Моя книжная полка", "Birga o'qiymiz": "Читаем вместе",
    "Kitobdoshlar": "Друзья-читатели", "Sinf va guruhlar": "Классы и группы", "bellashuv": "соревнование", "Haftalik liga": "Недельная лига",
    "Profilim": "Мой профиль", "daraja · reyting": "уровень · рейтинг", "Qanday o'ynash": "Как играть", "Loyiha haqida": "О проекте",
    "Portretlar manbasi": "Источники портретов", "Maxfiylik": "Конфиденциальность", "Shartlar": "Условия",
    "Asosiy menyu": "Главное меню", "Bildirishnomalar": "Уведомления", "Profil bo'limlari": "Разделы профиля",
    "Guruhlar": "Группы", "Birga o'qish": "Читать вместе", "Liga": "Лига", "Profil": "Профиль", "Bo'limlar": "Разделы",
    // Kunlik o'yin
    "Harflarni o'z joyiga qo'yib, muallif ismini toping — har bir to'g'ri harf suratning bir bo'lagini ochadi":
      "Расставьте буквы по местам и угадайте автора — каждая верная буква открывает часть портрета",
    "Bugungi iqtibos": "Цитата дня",
    "Harfni sudrab, katakka olib boring — yoki avval harfni, keyin katakni bosing.": "Перетащите букву в клетку — или нажмите сначала на букву, затем на клетку.",
    "Xato qo'yilgan harfdan keyin ishora ochiladi: faoliyat, davr, hudud.": "После ошибки открывается подсказка: род занятий, эпоха, страна.",
    "Natijani rasm bilan ulashish": "Поделиться картинкой", "💬 Natijani matn bilan ulashish": "💬 Поделиться текстом",
    "Natija rasmi: iqtibos, portret va natija": "Картинка с результатом",
    "Xatolar: {x} / {n}": "Ошибки: {x} / {n}", "Faoliyat: {v}": "Род занятий: {v}", "Davr: {v}": "Эпоха: {v}", "Hudud: {v}": "Страна: {v}",
    "Barakalla!": "Браво!", "Bu safar topilmadi": "На этот раз не угадали", "Muallif: {v}": "Автор: {v}",
    "— Kim aytgan? —": "— Кто сказал? —", "Topdim — {x} ta xato bilan": "Угадал — ошибок: {x}", "Bu safar topa olmadim": "На этот раз не угадал",
    "Profilim: ": "Мой профиль: ",
    // Ulashish
    "xatosiz topdim! 🎯": "угадал без ошибок! 🎯", "topdim — {x} ta xato bilan": "угадал — ошибок: {x}", "bugun topa olmadim 😔": "сегодня не угадал 😔",
    "🔥 {n} kun ketma-ket": "🔥 {n} дней подряд", "Siz topa olasizmi? 👉 sitata.uz": "А вы угадаете? 👉 sitata.uz",
    "Natija nusxalandi — Telegram'ga joylang.": "Результат скопирован — вставьте в Telegram.",
    "Natija nusxalandi — Telegram yoki istalgan chatga joylang (Ctrl+V).": "Результат скопирован — вставьте в Telegram или любой чат (Ctrl+V).",
    "Natija matni nusxalandi.": "Текст результата скопирован.", "Matnni belgilab, o'zingiz nusxa oling:": "Выделите текст и скопируйте:",
    "Rasm tayyorlanmoqda…": "Картинка готовится…", "Rasm tayyor — «Natijani ulashish»ni yana bir bor bosing.": "Картинка готова — нажмите «Поделиться» ещё раз.",
    "Ulashish oynasi ochilmadi.": "Окно «Поделиться» не открылось.",
    "Rasm nusxalandi — Telegram yoki Facebook'ga Ctrl+V bilan joylashtiring.": "Картинка скопирована — вставьте её в Telegram или Facebook (Ctrl+V).",
    "Rasm yuklab olindi — uni Instagram, Telegram yoki Facebook'ga joylang.": "Картинка сохранена — опубликуйте её в Instagram, Telegram или Facebook.",
    "Profil havolasi ham nusxalandi — postga yoki izohga joylang.": "Ссылка на профиль тоже скопирована — вставьте её в пост или комментарий.",
    "Ilova ichidagi brauzer ulashishga ruxsat bermaydi — saytni Chrome yoki Safari'da oching, yoki:": "Встроенный браузер не разрешает делиться — откройте сайт в Chrome или Safari, или:",
    "Rasmni barmoq bilan bosib turing va «Rasmni saqlash»ni tanlang, keyin Instagram, Telegram yoki Facebook'ga joylang.":
      "Нажмите и удерживайте картинку, выберите «Сохранить», затем опубликуйте в Instagram, Telegram или Facebook.",
    "Rasm ustida sichqonchaning o'ng tugmasini bosib, «Rasmni saqlash» yoki «Rasmdan nusxa olish»ni tanlang.":
      "Щёлкните по картинке правой кнопкой мыши и выберите «Сохранить» или «Копировать».",
    // Jonli qator va o'yindan keyin
    "👥 Bugun {n} kishi o'ynadi": "👥 Сегодня сыграли: {n}", "🎯 {n}% topdi": "🎯 {n}% угадали",
    "Har kuni yangi iqtibos — bugungisi sizni kutmoqda": "Каждый день новая цитата — сегодняшняя ждёт вас",
    "Bugun {n}% o'yinchi topdi — ertaga albatta topasiz!": "Сегодня угадали {n}% игроков — завтра у вас обязательно получится!",
    "🎯 Xatosiz! Bugun faqat {n}% o'yinchi bunga erishdi.": "🎯 Без ошибок! Сегодня это удалось лишь {n}% игроков.",
    "📊 Siz bugungi o'yinchilarning {n} foizidan yaxshiroq natija ko'rsatdingiz!": "📊 Ваш результат лучше, чем у {n}% сегодняшних игроков!",
    "📊 Bugun {n} kishi o'ynadi.": "📊 Сегодня сыграли: {n}.", "⏳ Keyingi iqtibos": "⏳ Следующая цитата", "Kutish zerikarli bo'lmasin:": "Чтобы ожидание не было скучным:",
    "10 ta iqtibos — 10 ta muallif": "10 цитат — 10 авторов", "Maktab testlari": "Школьные тесты", "O'tkan kunlar, Alpomish, Navoiy…": "Узбекская литература",
    "Iqtiboslar": "Цитаты", "Buyuk adiblarning hikmatlari": "Мудрость великих писателей", "Hayoti va asarlari": "Жизнь и произведения",
    // Profil taklifi
    "Natijangiz saqlanishi, reytingga kirish va do'stlaringizga ulashish uchun Google bilan profil oching — bir bosishda:":
      "Чтобы сохранять результаты, попасть в рейтинг и делиться с друзьями, создайте профиль через Google — в одно нажатие:",
    "Google bilan profil ochish": "Создать профиль через Google", "Google bilan kirish": "Войти через Google",
    // Kasb, hudud, davr
    "Shoir": "Поэт", "Yozuvchi": "Писатель", "Faylasuf": "Философ", "Olim": "Учёный",
    "O'rta Osiyo": "Средняя Азия", "Angliya": "Англия", "Fransiya": "Франция", "Germaniya": "Германия", "Rossiya": "Россия", "Xitoy": "Китай", "Yunoniston": "Греция",
    "Til": "Язык",
  },
  en: {
    "Menyu": "Menu", "Mundarija": "Contents", "Lenta": "Feed", "iqtiboslar": "quotes", "Kim aytgan?": "Who said it?", "kunlik o'yin": "daily game",
    "Viktorina": "Quiz", "Duellar": "Duels", "do'st bilan bellashuv": "challenge a friend", "Barcha bo'limlar": "All sections",
    "Mualliflar": "Authors", "Karta yaratish": "Create a card", "Kitob javonim": "My bookshelf", "Birga o'qiymiz": "Read together",
    "Kitobdoshlar": "Reading friends", "Sinf va guruhlar": "Classes & groups", "bellashuv": "competition", "Haftalik liga": "Weekly league",
    "Profilim": "My profile", "daraja · reyting": "level · ranking", "Qanday o'ynash": "How to play", "Loyiha haqida": "About",
    "Portretlar manbasi": "Portrait sources", "Maxfiylik": "Privacy", "Shartlar": "Terms",
    "Asosiy menyu": "Main menu", "Bildirishnomalar": "Notifications", "Profil bo'limlari": "Profile sections",
    "Guruhlar": "Groups", "Birga o'qish": "Read together", "Liga": "League", "Profil": "Profile", "Bo'limlar": "Sections",
    "Harflarni o'z joyiga qo'yib, muallif ismini toping — har bir to'g'ri harf suratning bir bo'lagini ochadi":
      "Place the letters to spell the author's name — each correct letter reveals a piece of the portrait",
    "Bugungi iqtibos": "Today's quote",
    "Harfni sudrab, katakka olib boring — yoki avval harfni, keyin katakni bosing.": "Drag a letter into a box — or tap a letter, then a box.",
    "Xato qo'yilgan harfdan keyin ishora ochiladi: faoliyat, davr, hudud.": "Each mistake reveals a hint: occupation, era, country.",
    "Natijani rasm bilan ulashish": "Share as image", "💬 Natijani matn bilan ulashish": "💬 Share as text",
    "Natija rasmi: iqtibos, portret va natija": "Result image",
    "Xatolar: {x} / {n}": "Mistakes: {x} / {n}", "Faoliyat: {v}": "Occupation: {v}", "Davr: {v}": "Era: {v}", "Hudud: {v}": "Country: {v}",
    "Barakalla!": "Well done!", "Bu safar topilmadi": "Not this time", "Muallif: {v}": "Author: {v}",
    "— Kim aytgan? —": "— Who said it? —", "Topdim — {x} ta xato bilan": "Solved — {x} mistakes", "Bu safar topa olmadim": "Not solved this time",
    "Profilim: ": "My profile: ",
    "xatosiz topdim! 🎯": "solved with no mistakes! 🎯", "topdim — {x} ta xato bilan": "solved — {x} mistakes", "bugun topa olmadim 😔": "didn't get it today 😔",
    "🔥 {n} kun ketma-ket": "🔥 {n}-day streak", "Siz topa olasizmi? 👉 sitata.uz": "Can you guess it? 👉 sitata.uz",
    "Natija nusxalandi — Telegram'ga joylang.": "Result copied — paste it into a chat.",
    "Natija nusxalandi — Telegram yoki istalgan chatga joylang (Ctrl+V).": "Result copied — paste it into any chat (Ctrl+V).",
    "Natija matni nusxalandi.": "Result text copied.", "Matnni belgilab, o'zingiz nusxa oling:": "Select the text and copy it:",
    "Rasm tayyorlanmoqda…": "Preparing image…", "Rasm tayyor — «Natijani ulashish»ni yana bir bor bosing.": "Image ready — tap «Share» once more.",
    "Ulashish oynasi ochilmadi.": "Couldn't open the share sheet.",
    "Rasm nusxalandi — Telegram yoki Facebook'ga Ctrl+V bilan joylashtiring.": "Image copied — paste it into Telegram or Facebook (Ctrl+V).",
    "Rasm yuklab olindi — uni Instagram, Telegram yoki Facebook'ga joylang.": "Image downloaded — post it on Instagram, Telegram or Facebook.",
    "Profil havolasi ham nusxalandi — postga yoki izohga joylang.": "Your profile link was copied too — paste it into your post or a comment.",
    "Ilova ichidagi brauzer ulashishga ruxsat bermaydi — saytni Chrome yoki Safari'da oching, yoki:": "This in-app browser doesn't allow sharing — open the site in Chrome or Safari, or:",
    "Rasmni barmoq bilan bosib turing va «Rasmni saqlash»ni tanlang, keyin Instagram, Telegram yoki Facebook'ga joylang.":
      "Press and hold the image, choose «Save image», then post it on Instagram, Telegram or Facebook.",
    "Rasm ustida sichqonchaning o'ng tugmasini bosib, «Rasmni saqlash» yoki «Rasmdan nusxa olish»ni tanlang.":
      "Right-click the image and choose «Save image» or «Copy image».",
    "👥 Bugun {n} kishi o'ynadi": "👥 {n} played today", "🎯 {n}% topdi": "🎯 {n}% solved it",
    "Har kuni yangi iqtibos — bugungisi sizni kutmoqda": "A new quote every day — today's is waiting for you",
    "Bugun {n}% o'yinchi topdi — ertaga albatta topasiz!": "{n}% of players solved it today — you'll get tomorrow's!",
    "🎯 Xatosiz! Bugun faqat {n}% o'yinchi bunga erishdi.": "🎯 Flawless! Only {n}% of players did that today.",
    "📊 Siz bugungi o'yinchilarning {n} foizidan yaxshiroq natija ko'rsatdingiz!": "📊 You did better than {n}% of today's players!",
    "📊 Bugun {n} kishi o'ynadi.": "📊 {n} played today.", "⏳ Keyingi iqtibos": "⏳ Next quote in", "Kutish zerikarli bo'lmasin:": "While you wait:",
    "10 ta iqtibos — 10 ta muallif": "10 quotes — 10 authors", "Maktab testlari": "Literature tests", "O'tkan kunlar, Alpomish, Navoiy…": "Uzbek literature",
    "Iqtiboslar": "Quotes", "Buyuk adiblarning hikmatlari": "Wisdom of great writers", "Hayoti va asarlari": "Lives and works",
    "Natijangiz saqlanishi, reytingga kirish va do'stlaringizga ulashish uchun Google bilan profil oching — bir bosishda:":
      "Create a profile with Google to save your results, join the ranking and share with friends — in one tap:",
    "Google bilan profil ochish": "Sign up with Google", "Google bilan kirish": "Sign in with Google",
    "Shoir": "Poet", "Yozuvchi": "Writer", "Faylasuf": "Philosopher", "Olim": "Scientist",
    "O'rta Osiyo": "Central Asia", "Angliya": "England", "Fransiya": "France", "Germaniya": "Germany", "Rossiya": "Russia", "Xitoy": "China", "Yunoniston": "Greece",
    "Til": "Language",
  },
};

function t(matn, q) {
  let r = (TIL !== "uz" && TARJIMA[TIL] && TARJIMA[TIL][matn]) || matn;
  if (q) r = r.replace(/\{(\w+)\}/g, (m, k) => (q[k] !== undefined ? q[k] : m));
  return r;
}

// Muallif ismi va iqtibos matni tanlangan tilda (malumotlar.js dagi ism_ru/ism_en, ru/en)
function muallifNomi(ism) {
  const m = (typeof MUALLIFLAR !== "undefined" && MUALLIFLAR[ism]) || {};
  return (TIL !== "uz" && m["ism_" + TIL]) || ism;
}
const iqtibosMatni = (iq) => (TIL !== "uz" && iq[TIL]) || iq.matn;
const asarNomi = (iq) => (TIL !== "uz" && iq["asar_" + TIL]) || iq.asar;

// Statik HTML: matn tugunlari va atributlar (aniq mos kelganlari) tarjima qilinadi
function sahifaniTarjimaQil(ildiz) {
  if (TIL === "uz") return;
  const lug = TARJIMA[TIL];
  const w = document.createTreeWalker(ildiz || document.body, NodeFilter.SHOW_TEXT);
  const tugunlar = [];
  while (w.nextNode()) tugunlar.push(w.currentNode);
  tugunlar.forEach((n) => {
    const s = n.nodeValue.trim();
    if (s && lug[s]) n.nodeValue = n.nodeValue.replace(s, lug[s]);
  });
  (ildiz || document.body).querySelectorAll("[aria-label],[placeholder],[title],[alt]").forEach((el) => {
    ["aria-label", "placeholder", "title", "alt"].forEach((a) => { const v = el.getAttribute(a); if (v && lug[v]) el.setAttribute(a, lug[v]); });
  });
}

function tilniAlmashtir(til) {
  try { localStorage.setItem("sitataTil", til); } catch (e) {}
  const u = new URL(location.href);
  if (u.searchParams.has("til")) { u.searchParams.delete("til"); location.replace(u.toString()); }
  else location.reload();
}

// Til tanlagich: «O'zbekcha · Русский · English»
function tilTanlagich(sinf) {
  const q = document.createElement("div");
  q.className = "til-tanlagich" + (sinf ? " " + sinf : "");
  q.setAttribute("role", "group"); q.setAttribute("aria-label", t("Til"));
  Object.entries(TILLAR).forEach(([k, nom]) => {
    const b = document.createElement("button"); b.type = "button"; b.textContent = nom;
    b.lang = k; b.className = k === TIL ? "faol" : "";
    if (k === TIL) b.setAttribute("aria-current", "true");
    b.addEventListener("click", () => { if (k !== TIL) tilniAlmashtir(k); });
    q.appendChild(b);
  });
  return q;
}

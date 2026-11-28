// Server xabarlari tarjimasi (push-yubor va telegram funksiyalarida bir xil nusxa).
// Manba: o'zbekcha matn → [ruscha, inglizcha]. {0}, {1} — o'zgaruvchan qismlar.
export type Til = "uz" | "ru" | "en";
export const tilmi = (x: unknown): Til => (x === "ru" || x === "en" ? x : "uz");

const MATN: Record<string, [string, string]> = {
  "Eslatmalar ishlayapti ✓": ["Напоминания работают ✓","Reminders are working ✓"],
  "Endi sitata.uz yangiliklarini o'tkazib yubormaysiz.": ["Теперь вы не пропустите новости sitata.uz.","Now you won't miss any sitata.uz news."],
  "Bugungi iqtibos tayyor 📖": ["Цитата дня готова 📖","Today's quote is ready 📖"],
  "«Kim aytgan?» — muallifni toping va seriyangizni davom ettiring.": ["«Кто сказал?» — угадайте автора и продолжите серию.","«Who said it?» — guess the author and keep your streak going."],
  "📖 Bugungi iqtibos sizni kutmoqda": ["📖 Цитата дня ждёт вас","📖 Today's quote is waiting for you"],
  "Kitobcha kutyapti — bir daqiqa vaqt ajrating.": ["Книжка ждёт — уделите минутку.","Kitobcha is waiting — spare a minute."],
  "😢 Kitobcha xafa": ["😢 Книжка грустит","😢 Kitobcha is sad"],
  "{0} kundan beri ko'rinmaysiz… Bugungi iqtibosni topib, uni xursand qiling.": ["Вас не видно уже {0} дн.… Угадайте цитату дня и порадуйте её.","You've been away for {0} days… Solve today's quote and cheer it up."],
  "😤 Kitobchaning jahli chiqdi!": ["😤 Книжка сердится!","😤 Kitobcha is angry!"],
  "{0} kun! Seriyangiz kuyib ketyapti — hoziroq qayting.": ["{0} дн.! Серия сгорает — возвращайтесь скорее.","{0} days! Your streak is burning — come back now."],
  "🕸 Kitobchani chang bosdi": ["🕸 Книжка покрылась пылью","🕸 Kitobcha is gathering dust"],
  "{0} kundan beri varaqlanmadi. Bir o'yin — va chang ketadi.": ["Её не листали уже {0} дн. Одна игра — и пыль исчезнет.","Not opened for {0} days. One game and the dust is gone."],
  "💀 Kitobcha skeletga aylandi": ["💀 Книжка превратилась в скелет","💀 Kitobcha turned into a skeleton"],
  "{0} kun… Bitta o'yin bilan uni qayta jonlantiring!": ["{0} дн.… Оживите её одной игрой!","{0} days… Bring it back to life with one game!"],
  "📚 sitata.uz boti": ["📚 Бот sitata.uz","📚 The sitata.uz bot"],
  "Men sizga saytdagi yangiliklarni yuboraman: kitobdoshlar, iqtibos yoqtirishlari, duel chaqiruvlari, guruh topshiriqlari va kechqurun — o'qish seriyangiz haqida eslatma.": ["Я присылаю новости сайта: друзья-читатели, лайки цитат, вызовы на дуэль, задания групп, а вечером — напоминание о серии чтения.","I send you news from the site: reading friends, quote likes, duel challenges, group assignments, and in the evening a reminder about your reading streak."],
  "/bugun — bugungi «Kim aytgan?» o'yini\n/stop — xabarlarni to'xtatish\n/davom — xabarlarni qayta yoqish": ["/bugun — игра дня «Кто сказал?»\n/stop — остановить уведомления\n/davom — снова включить уведомления","/bugun — today's «Who said it?» game\n/stop — stop notifications\n/davom — turn notifications back on"],
  "⏳ Bu havola eskirgan. Saytda «Telegram'ni ulash» tugmasini qayta bosing.": ["⏳ Ссылка устарела. Нажмите на сайте «Подключить Telegram» ещё раз.","⏳ This link has expired. Tap «Connect Telegram» on the site again."],
  "✅ {0}, profilingiz ulandi!\n\nEndi saytdagi yangiliklar shu yerga keladi. Kechqurun o'qish seriyangiz haqida eslatib turaman 🔥\n\n/stop — xabarlarni to'xtatish": ["✅ {0}, профиль подключён!\n\nТеперь новости сайта будут приходить сюда. Вечером я напомню о серии чтения 🔥\n\n/stop — остановить уведомления","✅ {0}, your profile is connected!\n\nSite news will now come here. In the evening I'll remind you about your reading streak 🔥\n\n/stop — stop notifications"],
  "Assalomu alaykum! 📚\n\nBotni profilingizga ulash uchun saytda: Profilim → ⚙ Sozlamalar → «Telegram'ni ulash».\n\n": ["Здравствуйте! 📚\n\nЧтобы подключить бота к профилю, на сайте откройте: Мой профиль → ⚙ Настройки → «Подключить Telegram».\n\n","Hello! 📚\n\nTo connect the bot to your profile, on the site go to: My profile → ⚙ Settings → «Connect Telegram».\n\n"],
  "Profilni ulash": ["Подключить профиль","Connect profile"],
  "🔕 Xabarlar to'xtatildi. Qayta yoqish uchun: /davom": ["🔕 Уведомления остановлены. Чтобы включить снова: /davom","🔕 Notifications stopped. To turn them back on: /davom"],
  "🔔 Xabarlar qayta yoqildi.": ["🔔 Уведомления снова включены.","🔔 Notifications are back on."],
  "Avval profilingizni ulang: saytda Profilim → ⚙ Sozlamalar → «Telegram'ni ulash».": ["Сначала подключите профиль: на сайте Мой профиль → ⚙ Настройки → «Подключить Telegram».","Connect your profile first: on the site go to My profile → ⚙ Settings → «Connect Telegram»."],
  "📖 Bugungi iqtibos tayyor — muallifini topa olasizmi?": ["📖 Цитата дня готова — угадаете автора?","📖 Today's quote is ready — can you guess who said it?"],
  "«Kim aytgan?» o'ynash": ["Играть в «Кто сказал?»","Play «Who said it?»"],
  "🔥 {0} kunlik o'qish seriyangiz bor!\nBugun hali o'qimadingiz — 10 sahifa ham yetadi, seriya uzilmasin.": ["🔥 У вас серия чтения {0} дн.!\nСегодня вы ещё не читали — хватит и 10 страниц, чтобы серия не прервалась.","🔥 You have a {0}-day reading streak!\nYou haven't read today — even 10 pages will keep it alive."],
  "📚 Javonimni ochish": ["📚 Открыть полку","📚 Open my shelf"],
  "📖 Bugungi iqtibos sizni kutmoqda — muallifini topa olasizmi?": ["📖 Цитата дня ждёт вас — угадаете автора?","📖 Today's quote is waiting — can you guess who said it?"],
  "😢 Kitobcha {0} kundan beri sizni kutyapti… Bugungi iqtibosni topib, uni xursand qiling.": ["😢 Книжка ждёт вас уже {0} дн.… Угадайте цитату дня и порадуйте её.","😢 Kitobcha has been waiting for you for {0} days… Solve today's quote and cheer it up."],
  "🕸 {0} kun! Kitobchani chang bosdi — bitta o'yin bilan uni jonlantiring.": ["🕸 {0} дн.! Книжка покрылась пылью — оживите её одной игрой.","🕸 {0} days! Kitobcha is gathering dust — bring it back with one game."],
  "Ochish →": ["Открыть →","Open →"],
  "Bugungi «Kim aytgan?» o'yini": ["Игра дня «Кто сказал?»","Today's «Who said it?» game"],
  "Xabarlarni to'xtatish": ["Остановить уведомления","Stop notifications"],
  "Xabarlarni qayta yoqish": ["Снова включить уведомления","Turn notifications back on"],
  "Bot haqida": ["О боте","About the bot"],
  "sitata.uz — kitob o'qish va iqtiboslar jamiyati. Bot saytdagi yangiliklar va o'qish eslatmalarini yuboradi.": ["sitata.uz — сообщество любителей книг и цитат. Бот присылает новости сайта и напоминания о чтении.","sitata.uz — a community for books and quotes. The bot sends site news and reading reminders."],
  "✅ Tasdiqlandi! Endi saytga qayting — kirish o'zi davom etadi.": ["✅ Подтверждено! Вернитесь на сайт — вход продолжится сам.","✅ Confirmed! Go back to the site — sign-in will continue automatically."],
  "⏳ Bu kirish havolasi eskirgan. Saytda «Telegram orqali kirish» tugmasini qayta bosing.": ["⏳ Ссылка для входа устарела. Нажмите на сайте «Войти через Telegram» ещё раз.","⏳ This sign-in link has expired. Tap «Sign in with Telegram» on the site again."],
  "Saytga qaytish": ["Вернуться на сайт","Back to the site"],
};

// Bazadagi bildirishnoma matnlari (SQL triggerlar o'zbekcha yozadi)
const BILDIRISH: Record<string, [string, string]> = {
  "{0} sizni kitobdosh bo'lishga taklif qildi": ["{0} приглашает вас в друзья-читатели","{0} sent you a reading-friend request"],
  "{0} kitobdosh bo'lish taklifingizni qabul qildi": ["{0} принял(а) ваше приглашение в друзья","{0} accepted your friend request"],
  "{0} sizni «{1}»ni birga o'qishga taklif qildi": ["{0} приглашает вас вместе читать «{1}»","{0} invited you to read «{1}» together"],
  "{0} «{1}»ni birga o'qishga qo'shildi": ["{0} присоединяется к совместному чтению «{1}»","{0} joined the read-along of «{1}»"],
  "{0} «{1}»ni birga o'qish taklifini rad etdi": ["{0} отклонил(а) приглашение читать «{1}»","{0} declined to read «{1}» together"],
  "🏆 Tabriklaymiz! {0}-o'rin bilan «{1}» ligasiga ko'tarildingiz": ["🏆 Поздравляем! Вы заняли {0}-е место и поднялись в лигу «{1}»","🏆 Congratulations! You placed #{0} and moved up to the «{1}» league"],
  "📚 {0} «{1}»ni o'qib tugatdi ({2} sahifa) — tabriklang!": ["📚 {0} дочитал(а) «{1}» ({2} стр.) — поздравьте!","📚 {0} finished «{1}» ({2} pages) — congratulate them!"],
  "📚 {0} «{1}»ni o'qib tugatdi — tabriklang!": ["📚 {0} дочитал(а) «{1}» — поздравьте!","📚 {0} finished «{1}» — congratulate them!"],
  "🔁 {0} iqtibosingizni qayta ulashdi: «{1}»": ["🔁 {0} сделал(а) репост вашей цитаты: «{1}»","🔁 {0} reposted your quote: «{1}»"],
  "🔁 {0} iqtibosingizni qayta ulashdi (rasm)": ["🔁 {0} сделал(а) репост вашей цитаты (фото)","🔁 {0} reposted your quote (photo)"],
  "♥ {0} «{1}»dan iqtibosingizni yoqtirdi: «{2}»": ["♥ {0} лайкнул(а) вашу цитату из «{1}»: «{2}»","♥ {0} liked your quote from «{1}»: «{2}»"],
  "♥ {0} «{1}»dan iqtibosingizni yoqtirdi (rasm)": ["♥ {0} лайкнул(а) вашу цитату из «{1}» (фото)","♥ {0} liked your quote from «{1}» (photo)"],
  "♥ {0} iqtibosingizni yoqtirdi: «{1}»": ["♥ {0} лайкнул(а) вашу цитату: «{1}»","♥ {0} liked your quote: «{1}»"],
  "♥ {0} iqtibosingizni yoqtirdi (rasm)": ["♥ {0} лайкнул(а) вашу цитату (фото)","♥ {0} liked your quote (photo)"],
  "📚 {0}: yangi topshiriq — «{1}» ({2})": ["📚 {0}: новое задание — «{1}» ({2})","📚 {0}: new assignment — «{1}» ({2})"],
  "📚 {0}: yangi topshiriq — «{1}»": ["📚 {0}: новое задание — «{1}»","📚 {0}: new assignment — «{1}»"],
  "⚔️ {0} sizni duelga chaqirdi — {1}/{2} topdi. Undan o'ta olasizmi?": ["⚔️ {0} вызывает вас на дуэль — угадано {1}/{2}. Сможете обойти?","⚔️ {0} challenged you to a duel — got {1}/{2}. Can you beat that?"],
  "⚔️ {0} duelni o'ynadi: {1} — {2}, siz yutqazdingiz 😅": ["⚔️ {0} сыграл(а) дуэль: {1} — {2}, вы проиграли 😅","⚔️ {0} played the duel: {1} — {2}, you lost 😅"],
  "⚔️ {0} duelni o'ynadi: {1} — {2}, siz durang 🤝": ["⚔️ {0} сыграл(а) дуэль: {1} — {2}, ничья 🤝","⚔️ {0} played the duel: {1} — {2}, it's a draw 🤝"],
  "⚔️ {0} duelni o'ynadi: {1} — {2}, siz yutdingiz 🏆": ["⚔️ {0} сыграл(а) дуэль: {1} — {2}, вы победили 🏆","⚔️ {0} played the duel: {1} — {2}, you won 🏆"],
  "Kitobdoshingiz": ["Друг-читатель","A reading friend"],
  "Raqibingiz": ["Соперник","Your opponent"],
  "Kitobxon": ["Читатель","A reader"],
  "⚔️ {0} sizni onlayn duelga chaqirdi!": ["⚔️ {0} вызывает вас на онлайн-дуэль!","⚔️ {0} challenged you to an online duel!"],
  "🔥 {0} qasos olmoqchi — onlayn duelga chaqirdi!": ["🔥 {0} хочет реванша — вызывает на онлайн-дуэль!","🔥 {0} wants a rematch — challenged you to an online duel!"],
  "O'tgan hafta «{0}» ligasiga tushdingiz. Bu hafta qaytib chiqing!": ["На прошлой неделе вы опустились в лигу «{0}». Вернитесь на этой неделе!","Last week you dropped to the «{0}» league. Climb back this week!"],
  "Varaq": ["Страница","Page"],
  "Daftar": ["Тетрадь","Notebook"],
  "Risola": ["Брошюра","Booklet"],
  "Kutubxona": ["Библиотека","Library"],
  "Xazina": ["Сокровищница","Treasury"],
  "Kitob": ["Книга","Book"],
};

const qoy = (m: string, q: unknown[]) => m.replace(/\{(\d)\}/g, (x, i) => (q[+i] !== undefined ? String(q[+i]) : x));

// Tayyor matn: m("ru", "Bugungi iqtibos tayyor 📖")
export function m(til: Til, uz: string, ...q: unknown[]): string {
  const r = til === "uz" ? uz : (MATN[uz]?.[til === "ru" ? 0 : 1] ?? uz);
  return qoy(r, q);
}

const naqshlar = Object.keys(BILDIRISH).filter((k) => /\{\d\}/.test(k)).map((k) => {
  const tartib: number[] = [];
  const re = k.split(/(\{\d\})/).map((p) => {
    const x = /^\{(\d)\}$/.exec(p);
    if (!x) return p.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    tartib.push(+x[1]); return "(.+?)";
  }).join("");
  return { re: new RegExp("^" + re + "$", "s"), tartib, k };
});

// Bildirishnoma matnini foydalanuvchi tiliga o'girish (mos naqsh topilmasa — o'zgarishsiz)
export function bildirishnomaMatni(matn: string, til: Til): string {
  if (til === "uz" || !matn) return matn;
  const i = til === "ru" ? 0 : 1;
  const soz = (x: string) => BILDIRISH[x]?.[i] ?? x;
  for (const n of naqshlar) {
    const r = n.re.exec(matn);
    if (!r) continue;
    const q: string[] = [];
    n.tartib.forEach((idx, j) => { q[idx] = soz(r[j + 1]); });
    return qoy(BILDIRISH[n.k][i], q);
  }
  return soz(matn);
}

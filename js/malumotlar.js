// ===== MA'LUMOTLAR: mualliflar va iqtiboslar =====
// Yangi muallif qo'shish: MUALLIFLAR ga yana bitta yozuv qo'shing (kalit — muallifning to'liq ismi).
//   davr  — asr (miloddan avvalgi bo'lsa manfiy son), kasb — faoliyati, yurt — hududi,
//   yillar — hayot yillari, rasm — rasmlar/ papkasidagi fayl (bo'lmasa null — bosh harflar chiqadi),
//   bio — 2–3 jumlalik qisqa ma'lumot.
// Yangi iqtibos qo'shish: IQTIBOSLAR ga { matn, muallif, asar } qo'shing. asar — ixtiyoriy (manba yoki kitob nomi).
// Muhim: har bir iqtibosni ishonchli manbadan tekshiring!

const MUALLIFLAR = {
  "Alisher Navoiy": {
    ism_ru: "Алишер Навои", ism_en: "Alisher Navoi",
    davr: 15, kasb: "Shoir", yurt: "O'rta Osiyo", yillar: "1441–1501", rasm: null,
    bio: "Hirotda tug'ilgan shoir, mutafakkir va davlat arbobi. Turkiy (eski o'zbek) adabiy tilining eng buyuk namoyandasi; «Xamsa», «Xazoyin ul-maoniy», «Muhokamat ul-lug'atayn» kabi asarlar muallifi.",
  },
  "Zahiriddin Bobur": {
    ism_ru: "Захириддин Бабур", ism_en: "Zahiriddin Babur",
    davr: 16, kasb: "Shoir", yurt: "O'rta Osiyo", yillar: "1483–1530", rasm: "rasmlar/bobur.jpg",
    bio: "Andijonda tug'ilgan shoir, tarixchi va sarkarda, Hindistondagi Boburiylar sulolasining asoschisi. Uning «Boburnoma» xotiralari jahon memuar adabiyotining nodir namunasi hisoblanadi.",
  },
  "Mirzo Ulug'bek": {
    ism_ru: "Мирзо Улугбек", ism_en: "Ulugh Beg",
    davr: 15, kasb: "Olim", yurt: "O'rta Osiyo", yillar: "1394–1449", rasm: "rasmlar/ulugbek.jpg",
    bio: "Temuriy hukmdor va buyuk astronom. Samarqandda rasadxona qurdirgan; uning «Ziji jadidi Ko'ragoniy» yulduzlar jadvali asrlar davomida eng aniq jadvallardan biri bo'lgan.",
  },
  "Ibn Sino": {
    ism_ru: "Ибн Сина", ism_en: "Avicenna",
    davr: 11, kasb: "Olim", yurt: "O'rta Osiyo", yillar: "980–1037", rasm: "rasmlar/ibn-sino.jpg",
    bio: "Buxoro yaqinidagi Afshonada tug'ilgan tabib va faylasuf. «Tib qonunlari» asari Sharq va G'arbda ko'p asrlar davomida tibbiyotning asosiy darsligi bo'lgan.",
  },
  "Abu Rayhon Beruniy": {
    ism_ru: "Абу Райхан Бируни", ism_en: "Al-Biruni",
    davr: 11, kasb: "Olim", yurt: "O'rta Osiyo", yillar: "973–1048", rasm: "rasmlar/beruniy.jpg",
    bio: "Xorazmda tug'ilgan qomusiy olim: astronomiya, matematika, geografiya va tarix bo'yicha asarlar yozgan. «Hindiston» va «Qadimgi xalqlardan qolgan yodgorliklar» asarlari bilan mashhur.",
  },
  "Abdulla Qodiriy": {
    ism_ru: "Абдулла Кадыри", ism_en: "Abdulla Qodiriy",
    davr: 20, kasb: "Yozuvchi", yurt: "O'rta Osiyo", yillar: "1894–1938", rasm: null,
    bio: "Toshkentda tug'ilgan yozuvchi, o'zbek romanchiligining asoschisi. «O'tgan kunlar» va «Mehrobdan chayon» romanlari muallifi; 1938-yilda qatag'on qurboni bo'lgan.",
  },
  "Suqrot": {
    ism_ru: "Сократ", ism_en: "Socrates",
    davr: -5, kasb: "Faylasuf", yurt: "Yunoniston", yillar: "mil. av. 470–399", rasm: "rasmlar/suqrot.jpg",
    bio: "Afinalik faylasuf. O'zi asar yozmagan — g'oyalari shogirdi Aflotunning suhbatlari orqali bizgacha yetib kelgan. Savol-javob orqali haqiqatni izlash usuli bilan mashhur.",
  },
  "Aristotel": {
    ism_ru: "Аристотель", ism_en: "Aristotle",
    davr: -4, kasb: "Faylasuf", yurt: "Yunoniston", yillar: "mil. av. 384–322", rasm: "rasmlar/aristotel.jpg",
    bio: "Yunon faylasufi, Aflotunning shogirdi va Iskandar Zulqarnaynning ustozi. Mantiq, axloq, siyosat va tabiatshunoslik bo'yicha asarlari G'arb va Sharq falsafasiga katta ta'sir ko'rsatgan.",
  },
  "Konfutsiy": {
    ism_ru: "Конфуций", ism_en: "Confucius",
    davr: -6, kasb: "Faylasuf", yurt: "Xitoy", yillar: "mil. av. 551–479", rasm: "rasmlar/konfutsiy.jpg",
    bio: "Xitoylik mutafakkir va ustoz, konfutsiylik ta'limotining asoschisi. Uning fikrlari shogirdlari yozib qoldirgan «Lun yuy» («Suhbatlar va mulohazalar») kitobida jamlangan.",
  },
  "Rene Dekart": {
    ism_ru: "Рене Декарт", ism_en: "Rene Descartes",
    davr: 17, kasb: "Faylasuf", yurt: "Fransiya", yillar: "1596–1650", rasm: "rasmlar/dekart.jpg",
    bio: "Fransuz faylasufi va matematigi, yangi davr falsafasining asoschilaridan biri. Analitik geometriyani yaratgan; «Metod haqida mulohaza» asari bilan mashhur.",
  },
  "Frensis Bekon": {
    ism_ru: "Фрэнсис Бэкон", ism_en: "Francis Bacon",
    davr: 16, kasb: "Faylasuf", yurt: "Angliya", yillar: "1561–1626", rasm: "rasmlar/bekon.jpg",
    bio: "Ingliz faylasufi va davlat arbobi. Tajriba va kuzatuvga asoslangan ilmiy uslubning targ'ibotchisi; «Yangi Organon» asari muallifi.",
  },
  "Isaak Nyuton": {
    ism_ru: "Исаак Ньютон", ism_en: "Isaac Newton",
    davr: 17, kasb: "Olim", yurt: "Angliya", yillar: "1643–1727", rasm: "rasmlar/nyuton.jpg",
    bio: "Ingliz fizigi va matematigi. Butun olam tortishish qonuni va harakat qonunlarini kashf etgan; «Natural falsafaning matematik asoslari» asari klassik fizikaga asos solgan.",
  },
  "Uilyam Shekspir": {
    ism_ru: "Уильям Шекспир", ism_en: "William Shakespeare",
    davr: 16, kasb: "Yozuvchi", yurt: "Angliya", yillar: "1564–1616", rasm: "rasmlar/shekspir.jpg",
    bio: "Ingliz dramaturgi va shoiri, jahon adabiyotining eng mashhur siymolaridan biri. «Gamlet», «Romeo va Julyetta», «Qirol Lir», «Otello» asarlari muallifi.",
  },
  "Lev Tolstoy": {
    ism_ru: "Лев Толстой", ism_en: "Leo Tolstoy",
    davr: 19, kasb: "Yozuvchi", yurt: "Rossiya", yillar: "1828–1910", rasm: "rasmlar/tolstoy.jpg",
    bio: "Rus yozuvchisi va mutafakkiri. «Urush va tinchlik» hamda «Anna Karenina» romanlari jahon adabiyotining eng yirik asarlari qatoridan o'rin olgan.",
  },
  "Fyodor Dostoyevskiy": {
    ism_ru: "Фёдор Достоевский", ism_en: "Fyodor Dostoevsky",
    davr: 19, kasb: "Yozuvchi", yurt: "Rossiya", yillar: "1821–1881", rasm: "rasmlar/dostoyevskiy.jpg",
    bio: "Rus yozuvchisi, inson ruhiyatini chuqur tasvirlagan romanlari bilan mashhur. «Jinoyat va jazo», «Aka-uka Karamazovlar», «Telba» asarlari muallifi.",
  },
  "Aleksandr Pushkin": {
    ism_ru: "Александр Пушкин", ism_en: "Alexander Pushkin",
    davr: 19, kasb: "Shoir", yurt: "Rossiya", yillar: "1799–1837", rasm: "rasmlar/pushkin.jpg",
    bio: "Rus shoiri va yozuvchisi, zamonaviy rus adabiy tilining asoschisi hisoblanadi. «Yevgeniy Onegin» she'riy romani muallifi.",
  },
  "Albert Eynshteyn": {
    ism_ru: "Альберт Эйнштейн", ism_en: "Albert Einstein",
    davr: 20, kasb: "Olim", yurt: "Germaniya", yillar: "1879–1955", rasm: "rasmlar/eynshteyn.jpg",
    bio: "Nemis kelib chiqishli fizik, nisbiylik nazariyasining muallifi. 1921-yilda fotoeffekt qonunini tushuntirgani uchun Nobel mukofotiga sazovor bo'lgan.",
  },
};

// Iqtiboslar. «Kim aytgan?» o'yinida har kuni ro'yxatdan navbatdagisi chiqadi.
// Diqqat: ro'yxat tartibini o'zgartirsangiz, kunlik o'yin iqtiboslari ham suriladi — yangilarini oxiriga qo'shing.
const IQTIBOSLAR = [
  { matn: "Odami ersang, demagil odami,\nOniki yo'q xalq g'amidin g'ami.", ru: "Не называй человеком того,\nКто не печётся о горе народа.", en: "Do not call him human\nwho does not share the people's grief.", muallif: "Alisher Navoiy" },
  { matn: "Fikrlayapman, demak, mavjudman.", ru: "Я мыслю, следовательно, существую.", en: "I think, therefore I am.", muallif: "Rene Dekart" },
  { matn: "Har kimki vafo qilsa, vafo topqusidir,\nHar kimki jafo qilsa, jafo topqusidir.", ru: "Кто верность хранит — верность обретёт,\nКто зло причиняет — зло к нему придёт.", en: "Whoever keeps faith will be met with faith,\nwhoever does wrong will be met with wrong.", muallif: "Zahiriddin Bobur" },
  { matn: "Men faqat bir narsani bilaman: hech narsa bilmayman.", ru: "Я знаю только то, что ничего не знаю.", en: "I know that I know nothing.", muallif: "Suqrot" },
  { matn: "Tasavvur bilimdan muhimroq.", ru: "Воображение важнее знания.", en: "Imagination is more important than knowledge.", muallif: "Albert Eynshteyn" },
  { matn: "Bo'lish yoki bo'lmaslik — mana masala.", ru: "Быть или не быть — вот в чём вопрос.", en: "To be, or not to be, that is the question.", asar_ru: "«Гамлет»", asar_en: "\"Hamlet\"", muallif: "Uilyam Shekspir", asar: "«Gamlet»" },
  { matn: "Bilganingni bilaman de, bilmaganingni bilmayman de — mana shu bilimdir.", ru: "Знать, что знаешь, и знать, что не знаешь, — вот настоящее знание.", en: "To know what you know and to know what you do not know — that is true knowledge.", asar_ru: "«Лунь юй»", asar_en: "\"The Analects\"", muallif: "Konfutsiy", asar: "«Lun yuy»" },
  { matn: "Hamma baxtli oilalar bir-biriga o'xshaydi, har bir baxtsiz oila esa o'zicha baxtsiz.", ru: "Все счастливые семьи похожи друг на друга, каждая несчастливая семья несчастлива по-своему.", en: "All happy families are alike; each unhappy family is unhappy in its own way.", asar_ru: "«Анна Каренина»", asar_en: "\"Anna Karenina\"", muallif: "Lev Tolstoy", asar: "«Anna Karenina»" },
  { matn: "Bilim — kuch.", ru: "Знание — сила.", en: "Knowledge is power.", muallif: "Frensis Bekon" },
  { matn: "Go'zallik dunyoni qutqaradi.", ru: "Красота спасёт мир.", en: "Beauty will save the world.", asar_ru: "«Идиот»", asar_en: "\"The Idiot\"", muallif: "Fyodor Dostoyevskiy", asar: "«Telba»" },
  { matn: "Inson tabiatan ijtimoiy mavjudotdir.", ru: "Человек по природе своей есть существо общественное.", en: "Man is by nature a social animal.", asar_ru: "«Политика»", asar_en: "\"Politics\"", muallif: "Aristotel", asar: "«Siyosat»" },
];

// Muallif sahifasi manzili uchun qisqa nom: "Mirzo Ulug'bek" → "mirzo-ulugbek"
const muallifSlug = (ism) => ism.toLowerCase().replace(/['ʻʼ‘’]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

// «Birga o'qiymiz» uchun kitoblar ro'yxati. Ro'yxatda yo'q kitobni foydalanuvchi o'zi yozishi mumkin.
const KITOBLAR = [
  { nom: "O'tgan kunlar", muallif: "Abdulla Qodiriy" },
  { nom: "Mehrobdan chayon", muallif: "Abdulla Qodiriy" },
  { nom: "Boburnoma", muallif: "Zahiriddin Bobur" },
  { nom: "Xamsa", muallif: "Alisher Navoiy" },
  { nom: "Mahbub ul-qulub", muallif: "Alisher Navoiy" },
  { nom: "Urush va tinchlik", muallif: "Lev Tolstoy" },
  { nom: "Anna Karenina", muallif: "Lev Tolstoy" },
  { nom: "Jinoyat va jazo", muallif: "Fyodor Dostoyevskiy" },
  { nom: "Aka-uka Karamazovlar", muallif: "Fyodor Dostoyevskiy" },
  { nom: "Telba", muallif: "Fyodor Dostoyevskiy" },
  { nom: "Gamlet", muallif: "Uilyam Shekspir" },
  { nom: "Romeo va Julyetta", muallif: "Uilyam Shekspir" },
  { nom: "Yevgeniy Onegin", muallif: "Aleksandr Pushkin" },
  { nom: "Lun yuy (Suhbatlar va mulohazalar)", muallif: "Konfutsiy" },
  { nom: "Nikomax axloqi", muallif: "Aristotel" },
  { nom: "Metod haqida mulohaza", muallif: "Rene Dekart" },
];

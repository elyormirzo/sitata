// ===== ISHGA TUSHIRISH (barcha skriptlar yuklangandan keyin) =====
(async () => {
  await kirishQaytishiniTugat();   // Google'dan qaytgan bo'lsa — sessiya va profilni tiklaymiz
  portretniQur();
  chiz();
  natijaniYoz();      // oldingi safar internet bo'lmagan bo'lsa
  sahifaniKor();
  bildirishnomalarniBoshla();
  kitobchaBelgisiniYangila();
  oxirgiOyinniSinxronla().then(() => {     // boshqa qurilmada o'ynagan bo'lsa — Kitobcha kayfiyatini yangilaymiz
    kitobchaBelgisiniYangila();
    if (joriyYol().nom === "bosh") boshniChiz();
  });
})();

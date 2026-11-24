// ===== ISHGA TUSHIRISH (barcha skriptlar yuklangandan keyin) =====
// Til: statik matnlar tarjimasi va til tanlagichlari
sahifaniTarjimaQil(document.body);
[["menyuTil", "menyuda"], ["pastkiTil", "pastkida"]].forEach(([id, sinf]) => { const el = document.getElementById(id); if (el) el.appendChild(tilTanlagich(sinf)); });

(async () => {
  await kirishQaytishiniTugat();   // Google'dan qaytgan bo'lsa — sessiya va profilni tiklaymiz
  portretniQur();
  chiz();
  natijaniYoz();      // oldingi safar internet bo'lmagan bo'lsa
  oyinSeriyasiniOl();  // ulashish matnidagi «🔥 N kun ketma-ket» uchun
  sahifaniKor();
  anonimProfilniTekshir();   // ism bilan ochilgan eski profil — Google'ga bog'lashni so'raymiz
  bildirishnomalarniBoshla();
  kitobchaBelgisiniYangila();
  oxirgiOyinniSinxronla().then(() => {     // boshqa qurilmada o'ynagan bo'lsa — Kitobcha kayfiyatini yangilaymiz
    kitobchaBelgisiniYangila();
    if (joriyYol().nom === "bosh") boshniChiz();
  });
})();

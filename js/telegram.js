// ===== TELEGRAM BOT BILAN ULANISH =====
// Sozlamalarda: «Telegram'ni ulash» → bir martalik kod bilan botga o'tiladi (/start <kod>) → bot profilga ulanadi.
// Keyin saytdagi bildirishnomalar va kechki o'qish eslatmasi Telegram'ga ham keladi.
// Baza: telegram_ulanishlar, telegram_kodi_ol(); server: «telegram» funksiyasi — supabase/telegram.sql

let telegramBot = null;   // bot username (server funksiyasidan bir marta olinadi)
async function telegramBotNomi() {
  if (telegramBot !== null) return telegramBot;
  try {
    const r = await fetch(SUPABASE_URL + "/functions/v1/telegram");
    telegramBot = (await r.json()).bot || "";
  } catch (e) { telegramBot = ""; }
  return telegramBot;
}

function telegramQutisi() {
  const quti = yarat("div", "eslatma-quti telegram-quti");
  quti.appendChild(yarat("b", "", "📨 Telegram"));
  const ichi = yarat("div", "eslatma-ichi");
  quti.appendChild(ichi);
  const chiz = async () => {
    ichi.innerHTML = "";
    if (!BAZA_YOQIQ || !mening) return;
    const m = await mijozOl();
    const [{ data: u }, bot] = await Promise.all([
      m.from("telegram_ulanishlar").select("tg_username,xabarlar").eq("profil_id", mening.id).maybeSingle(),
      telegramBotNomi(),
    ]);
    if (!bot) { ichi.appendChild(yarat("p", "kichik-matn", "Telegram bot hali sozlanmagan.")); return; }
    if (u) {
      ichi.appendChild(yarat("p", "kichik-matn", `✓ Ulangan${u.tg_username ? ": @" + u.tg_username : ""}. Yangiliklar va kechki o'qish eslatmasi @${bot} orqali keladi.`));
      const yoq = yarat("label", "belgilash");
      const cb = yarat("input"); cb.type = "checkbox"; cb.checked = u.xabarlar;
      cb.addEventListener("change", async () => { cb.disabled = true; await m.from("telegram_ulanishlar").update({ xabarlar: cb.checked }).eq("profil_id", mening.id); cb.disabled = false; });
      yoq.append(cb, document.createTextNode(" Telegram'ga xabar yuborilsin"));
      const uz = yarat("button", "matn-tugma", "Telegram'ni uzish"); uz.type = "button";
      uz.addEventListener("click", async () => {
        if (!confirm("Telegram ulanishini uzasizmi?")) return;
        await m.from("telegram_ulanishlar").delete().eq("profil_id", mening.id); chiz();
      });
      ichi.append(yoq, uz);
      return;
    }
    ichi.appendChild(yarat("p", "kichik-matn", "Yoqtirishlar, kitobdosh takliflari, duel chaqiruvlari, guruh topshiriqlari va kechki o'qish eslatmasi Telegram'ga kelsin."));
    const b = yarat("button", "telegram-tugma"); b.type = "button";
    b.innerHTML = '<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true"><path d="M21.4 3.6 2.9 10.8c-1.2.5-1.2 1.2 0 1.6l4.7 1.5 1.8 5.6c.2.6.4.8.9.8.4 0 .6-.2.9-.5l2.3-2.2 4.7 3.5c.9.5 1.5.2 1.7-.8l3.1-14.7c.3-1.3-.5-1.9-1.6-1.5zM9 13.6l9.2-5.8c.4-.3.8-.1.5.2l-7.6 6.9-.3 3.3L9 13.6z"/></svg> Telegram\'ni ulash';
    const x = yarat("p", "kichik-matn");
    b.addEventListener("click", async () => {
      b.disabled = true;
      // Oyna avval ochiladi (brauzer bloklamasligi uchun), manzil kod olingach beriladi
      const oyna = window.open("", "_blank");
      const { data: kod, error } = await m.rpc("telegram_kodi_ol");
      b.disabled = false;
      if (error || !kod) { if (oyna) oyna.close(); x.textContent = "Ulab bo'lmadi — qayta urinib ko'ring."; return; }
      const url = `https://t.me/${bot}?start=${kod}`;
      if (oyna) oyna.location.href = url; else location.href = url;
      x.textContent = "Telegram'da «Start» ni bosing, keyin shu sahifaga qaytib, yangilang.";
      // Ulangach holatni yangilash
      let n = 0;
      const t = setInterval(async () => {
        n++;
        const { data } = await m.from("telegram_ulanishlar").select("profil_id").eq("profil_id", mening.id).maybeSingle();
        if (data || n > 40) { clearInterval(t); if (data) chiz(); }
      }, 3000);
    });
    ichi.append(b, x);
  };
  chiz();
  return quti;
}

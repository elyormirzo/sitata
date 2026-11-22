// sitata.uz xizmat ishchisi (service worker): oflayn ishlash va push-eslatmalar.
// Sayt fayllari o'zgarganda VERSIYA ni oshiring — eski kesh tozalanadi.
const VERSIYA = "sitata-v13";
const ASOSIY = [
  "./", "index.html", "uslub.css", "manifest.webmanifest",
  "js/malumotlar.js", "js/oyin.js", "js/profil.js", "js/sahifalar.js", "js/birga.js", "js/daraja.js", "js/kitobcha.js", "js/liga.js", "js/javon.js", "js/fayllar.js", "js/pwa.js", "js/boshlash.js",
  "ikonkalar/ikonka-192.png", "ikonkalar/ikonka-512.png",
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(VERSIYA).then((c) => c.addAll(ASOSIY)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys()
    .then((k) => Promise.all(k.filter((n) => n !== VERSIYA).map((n) => caches.delete(n))))
    .then(() => self.clients.claim()));
});

// Sahifa, JS, CSS — avval internetdan (yangilanishlar darhol ko'rinsin), bo'lmasa keshdan.
// Rasmlar va ikonkalar — avval keshdan. Shriftlar va kutubxona — keshdan, fonda yangilanadi.
// Supabase so'rovlariga tegmaymiz.
self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  const ozimiz = url.origin === self.location.origin;
  const tashqiKesh = /fonts\.(googleapis|gstatic)\.com|cdn\.jsdelivr\.net/.test(url.host);
  if (!ozimiz && !tashqiKesh) return;

  if (ozimiz && /\/(rasmlar|ikonkalar)\//.test(url.pathname)) {
    e.respondWith(caches.match(req).then((bor) => bor || fetch(req).then((j) => saqla(req, j))));
    return;
  }
  if (tashqiKesh) {
    e.respondWith(caches.match(req).then((bor) => {
      const tarmoq = fetch(req).then((j) => saqla(req, j)).catch(() => bor);
      return bor || tarmoq;
    }));
    return;
  }
  e.respondWith(fetch(req).then((j) => saqla(req, j)).catch(() =>
    caches.match(req, { ignoreSearch: req.mode === "navigate" }).then((bor) => bor || caches.match("index.html"))));
});

function saqla(req, javob) {
  if (javob && (javob.ok || javob.type === "opaque")) {
    const nusxa = javob.clone();
    caches.open(VERSIYA).then((c) => c.put(req, nusxa));
  }
  return javob;
}

// ---------- Push-eslatmalar ----------
self.addEventListener("push", (e) => {
  let d = {};
  try { d = e.data ? e.data.json() : {}; } catch (x) { d = { body: e.data && e.data.text() }; }
  e.waitUntil(self.registration.showNotification(d.title || "sitata.uz", {
    body: d.body || "",
    icon: d.icon || "ikonkalar/ikonka-192.png",
    image: d.rasm,
    badge: "ikonkalar/ikonka-192.png",
    tag: d.tag,
    data: { url: d.url || "./" },
    lang: "uz",
  }));
});

self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  const manzil = new URL(e.notification.data && e.notification.data.url || "./", self.registration.scope).href;
  e.waitUntil(self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((oynalar) => {
    for (const o of oynalar) {
      if (o.url.startsWith(self.registration.scope) && "focus" in o) { o.navigate(manzil); return o.focus(); }
    }
    return self.clients.openWindow(manzil);
  }));
});

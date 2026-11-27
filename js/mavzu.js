// Tun/kun rejimi — sahifa chizilishidan oldin qo'llanadi (oq «yalt» etmasligi uchun <head> ichida yuklanadi).
// Tanlov: localStorage «sitataMavzu» = "tun" | "kun"; tanlanmagan bo'lsa — qurilma sozlamasiga qarab.
(function () {
  var m = null;
  try { m = localStorage.getItem("sitataMavzu"); } catch (e) {}
  if (m !== "tun" && m !== "kun") m = window.matchMedia && matchMedia("(prefers-color-scheme: dark)").matches ? "tun" : "kun";
  document.documentElement.setAttribute("data-mavzu", m);
  var r = document.querySelector('meta[name="theme-color"]');
  if (r) r.setAttribute("content", m === "tun" ? "#1A1511" : r.getAttribute("content"));
})();

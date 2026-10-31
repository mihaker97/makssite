(() => {
  const root = document.documentElement;
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const KEY = "fxw";
  let c, h, leaving = false;

  const mk = () => {
    if (c) return;
    c = document.createElement("div"); c.id = "fxwipe";
    h = document.createElement("div"); h.id = "fxheart"; h.textContent = "♥";
    document.body.append(c, h);
  };
  const radius = (x, y) => Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y)) + 40;
  const place = (x, y) => { c.style.left = (x - 100) + "px"; c.style.top = (y - 100) + "px"; };
  const clear = () => { c.getAnimations().forEach(a => a.cancel()); h.getAnimations().forEach(a => a.cancel()); };
  const EASE = "cubic-bezier(.65,0,.25,1)";

  // круг расходится из точки (x, y) и закрывает экран
  async function cover(x = innerWidth / 2, y = innerHeight / 2) {
    if (reduce) return;
    mk(); clear(); root.classList.add("busy");
    place(x, y); c.style.transform = ""; c.style.display = "block";
    const s = radius(x, y) / 100;
    await c.animate([{ transform: "scale(0)" }, { transform: "scale(" + s + ")" }],
      { duration: 650, easing: EASE, fill: "forwards" }).finished;
    h.style.display = "grid";
    h.animate([{ opacity: 0, transform: "scale(.6)" }, { opacity: 1, transform: "scale(1)" }],
      { duration: 350, easing: "ease-out", fill: "forwards" });
  }

  // круг сжимается к центру и открывает новую страницу
  async function uncover() {
    if (reduce) { root.classList.remove("fxin"); return; }
    mk();
    const x = innerWidth / 2, y = innerHeight / 2, s = radius(x, y) / 100;
    c.style.transform = "scale(" + s + ")";   // держим экран закрытым, пока меняем состояние
    clear(); place(x, y);
    c.style.display = "block"; h.style.display = "grid";
    root.classList.remove("fxin");
    await new Promise(r => setTimeout(r, 250));
    h.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 300, fill: "forwards" });
    await c.animate([{ transform: "scale(" + s + ")" }, { transform: "scale(0)" }],
      { duration: 750, easing: EASE, fill: "forwards" }).finished;
    clear(); c.style.display = "none"; h.style.display = "none"; c.style.transform = "";
    root.classList.remove("busy");
  }

  // уход на другую страницу: закрыть экран, запомнить это и перейти
  async function leave(href, x, y) {
    if (leaving) return;
    leaving = true;
    try { sessionStorage.setItem(KEY, "1"); } catch (e) {}
    await cover(x, y);
    location.href = href;
  }

  // приход с другой страницы: экран уже закрыт, открываем
  let flagged = false;
  try { flagged = sessionStorage.getItem(KEY) === "1"; sessionStorage.removeItem(KEY); } catch (e) {}
  if (flagged && !reduce) root.classList.add("fxin");
  document.addEventListener("DOMContentLoaded", async () => {
    if (!flagged || reduce) { root.classList.remove("fxin"); return; }
    root.classList.add("busy");
    await uncover();
  });

  // возврат кнопкой «назад» из кэша браузера
  addEventListener("pageshow", e => {
    if (!e.persisted) return;
    leaving = false; root.classList.remove("busy", "fxin");
    if (c) { clear(); c.style.display = "none"; h.style.display = "none"; c.style.transform = ""; }
  });

  window.FX = { cover, uncover, leave };
})();

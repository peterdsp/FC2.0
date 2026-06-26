/**
 * Tiny UI helpers, toasts, confetti, pointer-glow tracking for glass cards.
 * No dependencies.
 */

export function toast(msg, ms = 2200) {
  let wrap = document.querySelector(".toast-wrap");
  if (!wrap) {
    wrap = document.createElement("div");
    wrap.className = "toast-wrap";
    document.body.appendChild(wrap);
  }
  const t = document.createElement("div");
  t.className = "toast glass glass-strong";
  t.textContent = msg;
  wrap.appendChild(t);
  setTimeout(() => {
    t.style.transition = "opacity .4s, transform .4s";
    t.style.opacity = "0";
    t.style.transform = "translateY(-12px)";
    setTimeout(() => t.remove(), 400);
  }, ms);
}

const COLORS = ["#0a8a4a", "#d4262e", "#c9a227", "#f4f4f5", "#8a929c"];

export function confettiBurst(count = 28) {
  const cx = window.innerWidth / 2;
  const cy = window.innerHeight / 2.2;
  for (let i = 0; i < count; i++) {
    const c = document.createElement("div");
    c.className = "confetti";
    c.style.background = COLORS[i % COLORS.length];
    c.style.left = cx + "px";
    c.style.top = cy + "px";
    document.body.appendChild(c);
    const angle = Math.random() * Math.PI * 2;
    const dist = 80 + Math.random() * 180;
    const dx = Math.cos(angle) * dist;
    const dy = Math.sin(angle) * dist - 60;
    c.animate(
      [
        { transform: "translate(0,0) rotate(0)", opacity: 1 },
        { transform: `translate(${dx}px, ${dy + 220}px) rotate(${Math.random() * 720}deg)`, opacity: 0 },
      ],
      { duration: 900 + Math.random() * 500, easing: "cubic-bezier(.2,.7,.3,1)" }
    ).onfinish = () => c.remove();
  }
}

/** Make a `.glass` element track the pointer for its inner glow + tilt. */
export function trackPointer(el) {
  el.addEventListener("pointermove", (e) => {
    const r = el.getBoundingClientRect();
    el.style.setProperty("--mx", ((e.clientX - r.left) / r.width) * 100 + "%");
    el.style.setProperty("--my", ((e.clientY - r.top) / r.height) * 100 + "%");
  });
}

export const fmtTime = (s) => {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
};
export const fmtDuration = (s) => {
  const h = Math.floor(s / 3600);
  const m = Math.round((s % 3600) / 60);
  return h ? `${h}ω ${m}λ` : `${m} λεπτά`;
};

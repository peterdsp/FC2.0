/**
 * Top LIVE bar, controls the 24/7 bwinΣΠΟΡ FM 94.6 stream through the unified
 * player and shows the program currently on air (from the daily schedule).
 */
import { playLive, pause, isLivePlaying, onPlayerChange } from "./player.js";
import { currentShow } from "./schedule.js";

export function initLive() {
  const bar = document.getElementById("liveBar");
  const btn = document.getElementById("liveToggle");
  if (!btn) return;

  btn.addEventListener("click", () => (isLivePlaying() ? pause() : playLive()));

  // reflect the unified player's state on the bar
  onPlayerChange((s) => {
    const live = s.kind === "live" && s.playing;
    btn.textContent = live ? "❚❚" : "▶";
    btn.setAttribute("aria-label", live ? "Παύση ζωντανής ροής" : "Έναρξη ζωντανής ροής");
    bar.classList.toggle("playing", live);
    const status = document.getElementById("liveStatus");
    if (status) status.textContent = live ? "Παίζει τώρα" : "Πάτησε για ζωντανά";
  });

  paintNowOnAir();
  setInterval(paintNowOnAir, 60 * 1000); // keep "now on air" fresh
}

function paintNowOnAir() {
  const now = currentShow();
  const el = document.getElementById("liveShow");
  if (!el) return;
  if (now.title) {
    el.innerHTML = `<span class="now-label">Τώρα</span> ${now.title}` +
      (now.nextTitle ? ` <span class="next-label">· Μετά</span> ${now.nextTitle}` : "");
  } else {
    el.textContent = "Ραμαγιά";
  }
}

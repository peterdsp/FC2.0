/**
 * Unified persistent player.
 * ONE <audio> element drives both the 24/7 live radio and on-demand episodes,
 * so only one thing ever plays (tapping an episode naturally takes over from
 * live and vice-versa) and audio NEVER stops when you scroll, open a segment,
 * a quiz, or anything else, the element lives for the whole session.
 *
 * The dock is always visible once something has played, and floats above
 * modals so the user keeps control wherever they are.
 */
import { SHOW } from "./data.js";
import { currentShow } from "./schedule.js";
import { fmtTime } from "./ui.js";

const LIVE_URL = window.FC_LIVE_URL || "https://sportfm.live24.gr/sportfm7712";

const audio = new Audio();
audio.preload = "none";

let state = { kind: null, ep: null }; // kind: 'live' | 'episode'
const changeListeners = new Set();
export function onPlayerChange(fn) { changeListeners.add(fn); return () => changeListeners.delete(fn); }
function emit() { const s = snapshot(); changeListeners.forEach((f) => f(s)); }
export function snapshot() {
  return { kind: state.kind, ep: state.ep, playing: !audio.paused && !!state.kind };
}

const ICONS = {
  play: '<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>',
  pause: '<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M6 5h4v14H6zM14 5h4v14h-4z"/></svg>',
  back: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 17l-5-5 5-5M18 17l-5-5 5-5"/></svg>',
  fwd: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M13 17l5-5-5-5M6 17l5-5-5-5"/></svg>',
  dl: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v12M7 11l5 5 5-5M5 21h14"/></svg>',
};

export function initPlayer() {
  const d = document.createElement("div");
  d.id = "dock";
  d.className = "glass glass-strong lg-refract dock";
  d.innerHTML = `
    <div class="art" id="dockArt">📻</div>
    <div class="info">
      <b id="dockTitle">Fight Club 2.0</b>
      <small id="dockMeta"></small>
    </div>
    <div class="controls" id="dockControls"></div>
    <div class="scrub" id="dockScrubWrap"><i id="dockScrub"></i></div>
  `;
  document.body.appendChild(d);

  audio.addEventListener("timeupdate", () => {
    const i = document.getElementById("dockScrub");
    if (i && audio.duration && state.kind === "episode")
      i.style.width = (audio.currentTime / audio.duration) * 100 + "%";
  });
  audio.addEventListener("play", () => { renderDock(); emit(); });
  audio.addEventListener("pause", () => { renderDock(); emit(); });
  audio.addEventListener("error", () => { renderDock(); emit(); });

  if ("mediaSession" in navigator) {
    navigator.mediaSession.setActionHandler("play", () => audio.play());
    navigator.mediaSession.setActionHandler("pause", () => audio.pause());
    navigator.mediaSession.setActionHandler("seekbackward", () => seek(-15));
    navigator.mediaSession.setActionHandler("seekforward", () => seek(30));
  }
  renderDock();
}

/* ---------- public controls ---------- */
export function playLive() {
  state = { kind: "live", ep: null };
  audio.src = LIVE_URL + "?_=" + Date.now(); // re-join the live edge
  showDock();
  audio.play().catch(() => { renderDock(); emit(); });
  setMeta(SHOW.station, "Live 24/7");
}

export function playEpisode(ep) {
  state = { kind: "episode", ep };
  audio.src = `${SHOW.apiBase}/stream/${ep.id}`;
  showDock();
  // first play of a not-yet-stored episode resolves upstream (a few seconds)
  setMeta(ep.title, ep.file ? `${ep.category} · ${ep.date}` : "Φόρτωση…");
  const cleanup = () => {
    audio.removeEventListener("playing", onPlaying);
    audio.removeEventListener("error", onErr);
  };
  const onPlaying = () => { setMeta(ep.title, `${ep.category} · ${ep.date}`); cleanup(); };
  const onErr = () => { setMeta(ep.title, "Δεν βρέθηκε ήχος γι' αυτό το επεισόδιο"); cleanup(); };
  audio.addEventListener("playing", onPlaying);
  audio.addEventListener("error", onErr);
  audio.play().catch(() => {});
}

export function toggle() {
  if (!state.kind) { playLive(); return; }
  audio.paused ? audio.play() : audio.pause();
}
export function isLivePlaying() { return state.kind === "live" && !audio.paused; }
export function pause() { audio.pause(); }
function seek(delta) { if (state.kind === "episode") audio.currentTime = Math.max(0, audio.currentTime + delta); }

function downloadCurrent() {
  if (state.kind !== "episode") return;
  const a = document.createElement("a");
  a.href = `${SHOW.apiBase}/download/${state.ep.id}`;
  a.download = `${state.ep.id}.mp3`;
  document.body.appendChild(a); a.click(); a.remove();
}

/* ---------- dock rendering ---------- */
function showDock() { document.getElementById("dock")?.classList.add("show"); }
function setMeta(title, meta) {
  const t = document.getElementById("dockTitle"); const m = document.getElementById("dockMeta");
  if (t) t.textContent = title; if (m) m.textContent = meta;
  if ("mediaSession" in navigator)
    navigator.mediaSession.metadata = new MediaMetadata({ title, artist: SHOW.name, album: SHOW.station });
}

function renderDock() {
  const wrap = document.getElementById("dockControls");
  const scrub = document.getElementById("dockScrubWrap");
  const art = document.getElementById("dockArt");
  if (!wrap) return;
  const playing = !audio.paused && !!state.kind;
  const isEp = state.kind === "episode";
  if (art) art.textContent = state.kind === "live" ? "📻" : "🎙️";
  if (scrub) scrub.style.display = isEp ? "block" : "none";

  const btn = (id, icon, cls = "") => `<button id="${id}" class="dock-btn ${cls}">${icon}</button>`;
  wrap.innerHTML =
    (isEp ? btn("dBack", ICONS.back) : "") +
    btn("dToggle", playing ? ICONS.pause : ICONS.play, "primary") +
    (isEp ? btn("dFwd", ICONS.fwd) + btn("dDl", ICONS.dl) : "");

  wrap.querySelector("#dToggle")?.addEventListener("click", toggle);
  wrap.querySelector("#dBack")?.addEventListener("click", () => seek(-15));
  wrap.querySelector("#dFwd")?.addEventListener("click", () => seek(30));
  wrap.querySelector("#dDl")?.addEventListener("click", downloadCurrent);
}

export { fmtTime };

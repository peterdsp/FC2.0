/**
 * Fight Club 2.0, app bootstrap & rendering.
 * Renders home rails from the content model, wires the quiz + player,
 * and binds the live gamification HUD.
 */
import { SHOW, EPISODES, SEGMENTS, QUIZ_PACKS, HISTORY } from "./data.js";
import { subscribe } from "./gamification.js";
import { openQuiz } from "./quiz.js";
import { initPlayer, playEpisode } from "./player.js";
import { initLive } from "./live.js";
import { initMessages } from "./messages.js";
import { popSticker } from "./stickers.js";
import { trackPointer, fmtDuration, toast } from "./ui.js";

const $ = (sel, root = document) => root.querySelector(sel);

/* ---------- HUD (streak / xp / level) ---------- */
function renderHUD(v) {
  $("#xpVal").textContent = v.xp.toLocaleString("el-GR");
  $("#streakVal").textContent = v.streak;
  $("#lvlTitle").textContent = `Lvl ${v.level} · ${v.title}`;
  const ring = $("#lvlRing");
  if (ring) ring.style.background =
    `conic-gradient(var(--gold) ${v.progress * 360}deg, rgba(255,255,255,0.12) 0)`;
}

/* ---------- Episodes rail ---------- */
function renderEpisodes() {
  const rail = $("#epRail");
  rail.innerHTML = EPISODES.map(
    (ep) => `
    <article class="glass lg-refract ep-card" data-ep="${ep.id}">
      <div class="cat">${ep.category}</div>
      <h3>${ep.title}</h3>
      <p class="desc">${ep.description}</p>
      <div class="tags">${ep.tags.map((t) => `<span class="tag">#${t}</span>`).join("")}</div>
      <div class="foot">
        <small style="color:var(--ink-dim)">${fmtDuration(ep.duration)} · ${ep.plays.toLocaleString("el-GR")} ▶</small>
        <button class="play-btn" aria-label="Αναπαραγωγή">▶</button>
      </div>
    </article>`
  ).join("");

  rail.querySelectorAll(".ep-card").forEach((card) => {
    trackPointer(card);
    const ep = EPISODES.find((e) => e.id === card.dataset.ep);
    card.querySelector(".play-btn").addEventListener("click", (e) => {
      e.stopPropagation();
      playEpisode(ep);
      toast(`▶ ${ep.title}`);
    });
    card.addEventListener("click", () => playEpisode(ep));
  });
}

/* ---------- History timeline ---------- */
function renderHistory() {
  const rail = $("#historyRail");
  if (!rail) return;
  rail.innerHTML = HISTORY.map(
    (h) => `
    <article class="glass lg-refract ep-card" style="cursor:default">
      <div class="cat" style="color:var(--gold)">${h.y}</div>
      <p class="desc" style="min-height:auto;margin-top:10px;font-size:14px;color:var(--ink)">${h.t}</p>
    </article>`
  ).join("");
  rail.querySelectorAll(".glass").forEach(trackPointer);
}

/* ---------- Segments ---------- */
function renderSegments() {
  const grid = $("#segGrid");
  grid.innerHTML = SEGMENTS.map(
    (s) => `
    <div class="glass lg-refract seg-tile" data-seg="${s.id}">
      <div class="emoji">${s.emoji}</div>
      <div class="name">${s.name}</div>
    </div>`
  ).join("");
  grid.querySelectorAll(".seg-tile").forEach((t) => {
    trackPointer(t);
    t.addEventListener("click", () => {
      popSticker("read"); // a little FC reaction when you dig into a segment
      // Segments tie back into the matching quiz pack where one exists.
      const pack = QUIZ_PACKS.find((p) => p.name.includes("Legacy")) || QUIZ_PACKS[0];
      openQuiz(pack, { onClose: refresh });
    });
  });
}

/* ---------- Quiz packs ---------- */
function renderPacks(v) {
  const grid = $("#packGrid");
  grid.innerHTML = QUIZ_PACKS.map((p) => {
    const prog = v.packProgress[p.id] || 0;
    return `
    <article class="glass lg-refract pack-card" data-pack="${p.id}">
      <div class="emoji">${p.emoji}</div>
      <h3>${p.name}</h3>
      <div class="count">${p.questions.length} ερωτήσεις · best ${v.bestScores[p.id] || 0}%</div>
      <div class="bar"><i style="width:${prog}%"></i></div>
    </article>`;
  }).join("");

  grid.querySelectorAll(".pack-card").forEach((card) => {
    trackPointer(card);
    const pack = QUIZ_PACKS.find((p) => p.id === card.dataset.pack);
    card.addEventListener("click", () => openQuiz(pack, { onClose: refresh }));
  });
}

let lastView = null;
function refresh() {
  // packs depend on gamification state; re-render with the latest snapshot.
  if (lastView) renderPacks(lastView);
}

/* ---------- Daily challenge ---------- */
function wireDaily() {
  $("#dailyBtn").addEventListener("click", () => {
    const pack = QUIZ_PACKS[Math.floor(Math.random() * QUIZ_PACKS.length)];
    openQuiz(pack, { onClose: refresh });
  });
}

/* ---------- Boot ---------- */
function boot() {
  $("#tagline").textContent = SHOW.tagline;
  $("#hosts").textContent = SHOW.hosts.join(" & ");
  $("#station").textContent = `${SHOW.station} · ${SHOW.slot}`;

  initPlayer();
  initLive();
  initMessages();
  renderEpisodes();
  renderHistory();
  renderSegments();
  wireDaily();
  document.querySelectorAll(".topbar, .hero").forEach(trackPointer);

  subscribe((v) => {
    lastView = v;
    renderHUD(v);
    renderPacks(v);
    const daily = $("#dailyBtn");
    if (v.dailyDone) {
      daily.textContent = "✅ Ολοκληρώθηκε σήμερα";
      daily.classList.remove("glass-btn--primary");
    }
  });
}

document.addEventListener("DOMContentLoaded", boot);

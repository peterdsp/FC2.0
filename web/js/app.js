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

/* ---------- Episodes rail (real archive from fc-api, seed fallback) ---------- */
let EP_LIST = EPISODES;

async function loadEpisodes() {
  try {
    const r = await fetch(`${SHOW.apiBase}/episodes`);
    if (!r.ok) throw 0;
    const data = await r.json();
    if (Array.isArray(data) && data.length) {
      // playable (downloaded) episodes first, then by date desc
      EP_LIST = data.sort((a, b) =>
        (b.file ? 1 : 0) - (a.file ? 1 : 0) || (a.date < b.date ? 1 : -1)
      );
    }
  } catch {
    EP_LIST = EPISODES; // offline-of-backend: keep the seed
  }
}

function renderEpisodes() {
  const rail = $("#epRail");
  rail.innerHTML = EP_LIST.slice(0, 14)
    .map((ep) => {
      const meta = ep.duration
        ? `${fmtDuration(ep.duration)} · ${(ep.plays || 0).toLocaleString("el-GR")} ▶`
        : new Date(ep.date).toLocaleDateString("el-GR", { day: "2-digit", month: "long", year: "numeric" });
      const eraBadge = ep.era ? `<span class="tag">${ep.era.emoji || "🏆"} ${ep.era.label}</span>` : "";
      const tags = (ep.tags || []).map((t) => `<span class="tag">#${t}</span>`).join("");
      return `
    <article class="glass lg-refract ep-card" data-ep="${ep.id}">
      <div class="cat">${ep.category || "Fight Club"}</div>
      <h3>${ep.title}</h3>
      <p class="desc">${ep.description || ""}</p>
      <div class="tags">${eraBadge}${tags}</div>
      <div class="foot">
        <small style="color:var(--ink-dim)">${meta}</small>
        <button class="play-btn" aria-label="Αναπαραγωγή">▶</button>
      </div>
    </article>`;
    })
    .join("");

  rail.querySelectorAll(".ep-card").forEach((card) => {
    trackPointer(card);
    const ep = EP_LIST.find((e) => e.id === card.dataset.ep);
    const play = () => { playEpisode(ep); toast(`▶ ${ep.title}`); };
    card.querySelector(".play-btn").addEventListener("click", (e) => { e.stopPropagation(); play(); });
    card.addEventListener("click", play);
  });
}

/* ---------- Archive browser (year / era filters, image cards) ---------- */
const archState = { filter: null, shown: 24 };

function renderArchive() {
  const filtersEl = $("#archFilters");
  const countEl = $("#archCount");
  if (!filtersEl) return;
  if (!EP_LIST.length || !EP_LIST[0].date) return; // seed has no real archive

  const years = [...new Set(EP_LIST.map((e) => e.year).filter(Boolean))].sort().reverse();
  const eras = [];
  const seen = new Set();
  for (const e of EP_LIST) {
    if (e.era && !seen.has(e.era.id)) { seen.add(e.era.id); eras.push(e.era); }
  }
  if (!archState.filter && years.length) archState.filter = { type: "year", val: years[0] };

  const chip = (label, active, type, val) =>
    `<button class="arch-chip${active ? " on" : ""}" data-type="${type}" data-val="${val}">${label}</button>`;
  filtersEl.innerHTML =
    years.map((y) => chip(y, archState.filter?.val === y, "year", y)).join("") +
    eras.map((er) => chip(`${er.emoji || "🏆"} ${er.label}`, archState.filter?.val === er.id, "era", er.id)).join("");

  filtersEl.querySelectorAll(".arch-chip").forEach((b) =>
    b.addEventListener("click", () => {
      archState.filter = { type: b.dataset.type, val: b.dataset.val };
      archState.shown = 24;
      renderArchive();
    })
  );

  const f = archState.filter;
  const list = EP_LIST.filter((e) =>
    f.type === "year" ? e.year === f.val : e.era && e.era.id === f.val
  );
  if (countEl) countEl.textContent = `${EP_LIST.length} επεισόδια`;

  const grid = $("#archGrid");
  grid.innerHTML = list.slice(0, archState.shown).map((ep) => `
    <article class="glass arch-card" data-ep="${ep.id}">
      <div class="arch-thumb"${ep.image ? ` style="background-image:url('${ep.image}')"` : ""}>
        <button class="play-btn arch-play" aria-label="Αναπαραγωγή">▶</button>
      </div>
      <div class="arch-info">
        <div class="cat">${new Date(ep.date).toLocaleDateString("el-GR", { day: "2-digit", month: "short", year: "numeric" })}</div>
        <h4>${ep.title}</h4>
      </div>
    </article>`).join("");

  grid.querySelectorAll(".arch-card").forEach((card) => {
    const ep = list.find((e) => e.id === card.dataset.ep);
    const play = () => { playEpisode(ep); toast(`▶ ${ep.title}`); };
    card.addEventListener("click", play);
  });

  const more = $("#archMore");
  if (more) {
    more.style.display = list.length > archState.shown ? "inline-flex" : "none";
    more.onclick = () => { archState.shown += 24; renderArchive(); };
  }
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
  renderEpisodes(); // seed immediately
  loadEpisodes().then(() => { renderEpisodes(); renderArchive(); }); // real archive
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

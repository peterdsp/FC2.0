/**
 * Fight Club 2.0, app bootstrap & rendering.
 * Renders home rails from the content model, wires the quiz + player,
 * and binds the live gamification HUD.
 */
import { SHOW, EPISODES, SEGMENTS, QUIZ_PACKS, HISTORY } from "./data.js";
import { subscribe, getView } from "./gamification.js";
import { openQuiz } from "./quiz.js";
import { initPlayer, playEpisode, onPlayerChange } from "./player.js";
import { initLive } from "./live.js";
import { initMessages } from "./messages.js";
import { popSticker } from "./stickers.js";
import { trackPointer, fmtDuration, toast } from "./ui.js";
import { COMPETITIONS, erasForDate } from "./eras.js";

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

/* ---------- By-the-numbers stat band (real archive figures) ---------- */
function renderStats() {
  const dated = EP_LIST.filter((e) => e.date);
  if (!dated.length) return;
  const fmt = (n) => n.toLocaleString("el-GR");
  const eps = $("#stEpisodes");
  if (eps) eps.textContent = dated.length >= 100 ? fmt(Math.floor(dated.length / 10) * 10) + "+" : fmt(dated.length);
  const years = new Set(dated.map((e) => e.year || e.date.slice(0, 4)));
  const yEl = $("#stYears");
  if (yEl) yEl.textContent = Math.max(25, new Date().getFullYear() - 2001);
  // distinct tournament editions represented in the catalog
  const eras = new Set();
  for (const e of dated) for (const er of epEras(e)) eras.add(er.id);
  const erEl = $("#stEras");
  if (erEl) erEl.textContent = eras.size ? eras.size : "—";
}

/* ---------- Bento featured tile (latest episode) ---------- */
function renderFeatured() {
  const tile = $("#bentoFeatured");
  if (!tile || !EP_LIST.length) return;
  const ep = EP_LIST[0];
  const t = $("#featTitle"), m = $("#featMeta");
  if (t) t.textContent = ep.title;
  if (m) m.textContent = ep.date
    ? new Date(ep.date).toLocaleDateString("el-GR", { day: "2-digit", month: "long", year: "numeric" })
    : ep.category || "";
  const play = () => { playEpisode(ep); toast(`▶ ${ep.title}`); };
  tile.onclick = play;
  tile.onkeydown = (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); play(); } };
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
      <div class="cat">${ep.category || "Ραμαγιά"}</div>
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

/* ---------- Archive browser (two-level menu: category → edition) ---------- */
// cat: "year" or a competition id (euro/wc/ucl/uel/uecl). val: a year or era id.
const archState = { cat: null, val: null, shown: 24 };

/** Year + every tournament era an episode falls in (computed from its date). */
function epYear(ep) { return ep.year || (ep.date ? ep.date.slice(0, 4) : null); }
function epEras(ep) {
  if (!ep._eras) ep._eras = ep.date ? erasForDate(ep.date) : ep.era ? [ep.era] : [];
  return ep._eras;
}

function renderArchive() {
  const filtersEl = $("#archFilters");
  const countEl = $("#archCount");
  if (!filtersEl) return;
  if (!EP_LIST.length || !EP_LIST[0].date) return; // seed has no real archive

  // Available years and, per competition family, the editions that have episodes.
  const years = [...new Set(EP_LIST.map(epYear).filter(Boolean))].sort().reverse();
  const editions = {}; // comp id -> Map(eraId -> era) of eras that have episodes
  for (const ep of EP_LIST) {
    for (const er of epEras(ep)) {
      (editions[er.comp] ||= new Map()).set(er.id, er);
    }
  }
  // Top-level categories: Years first, then each competition that has content.
  const cats = [{ id: "year", label: "Έτος", emoji: "📅" }];
  for (const c of Object.values(COMPETITIONS).sort((a, b) => a.order - b.order)) {
    if (editions[c.id]?.size) cats.push(c);
  }

  // Default / heal the selection so it always points at something real.
  const validCat = cats.some((c) => c.id === archState.cat);
  if (!validCat) archState.cat = "year";
  const editionList =
    archState.cat === "year"
      ? years.map((y) => ({ id: y, label: y }))
      : [...editions[archState.cat].values()].sort((a, b) => (a.id < b.id ? 1 : -1));
  if (!editionList.some((e) => e.id === archState.val)) {
    archState.val = editionList[0]?.id ?? null;
  }

  const chip = (label, active, attrs) =>
    `<button class="arch-chip${active ? " on" : ""}" ${attrs}>${label}</button>`;
  filtersEl.innerHTML =
    `<div class="arch-cats">` +
    cats.map((c) => chip(`${c.emoji} ${c.label}`, archState.cat === c.id, `data-cat="${c.id}"`)).join("") +
    `</div><div class="arch-editions">` +
    editionList
      .map((e) => chip(e.short || e.label, archState.val === e.id, `data-edition="${e.id}"`))
      .join("") +
    `</div>`;

  filtersEl.querySelectorAll(".arch-cats .arch-chip").forEach((b) =>
    b.addEventListener("click", () => {
      archState.cat = b.dataset.cat;
      archState.val = null; // re-defaults to the first edition below
      archState.shown = 24;
      renderArchive();
    })
  );
  filtersEl.querySelectorAll(".arch-editions .arch-chip").forEach((b) =>
    b.addEventListener("click", () => {
      archState.val = b.dataset.edition;
      archState.shown = 24;
      renderArchive();
    })
  );

  const list = EP_LIST.filter((e) =>
    archState.cat === "year"
      ? epYear(e) === archState.val
      : epEras(e).some((er) => er.id === archState.val)
  );
  if (countEl) countEl.textContent = `${list.length} από ${EP_LIST.length} επεισόδια`;

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

/* ---------- FC Legacy (real scraped content) ---------- */
let LEGACY = [];

async function loadLegacy() {
  try {
    const r = await fetch(`${SHOW.apiBase}/legacy`);
    if (r.ok) { const d = await r.json(); if (Array.isArray(d) && d.length) LEGACY = d; }
  } catch {}
}

function renderSegments() {
  const grid = $("#segGrid");
  const segs = LEGACY.length ? LEGACY : SEGMENTS.map((s) => ({ ...s, count: 0 }));
  grid.innerHTML = segs.map(
    (s) => `
    <div class="glass lg-refract seg-tile" data-seg="${s.id}">
      <div class="emoji">${s.emoji || "📁"}</div>
      <div class="name">${s.name}</div>
      ${s.count ? `<div class="seg-count">${s.count}</div>` : ""}
    </div>`
  ).join("");
  grid.querySelectorAll(".seg-tile").forEach((t) => {
    trackPointer(t);
    t.addEventListener("click", () => {
      const seg = LEGACY.find((x) => x.id === t.dataset.seg);
      if (seg && seg.entries && seg.entries.length) { popSticker("read"); openLegacy(seg); }
      else openQuiz(PACKS[0], { onClose: refresh }); // fallback if not loaded yet
    });
  });
}

function openLegacy(seg) {
  let scrim = $("#legacyScrim");
  if (!scrim) {
    scrim = document.createElement("div");
    scrim.id = "legacyScrim";
    scrim.className = "modal-scrim";
    scrim.innerHTML = `<div class="glass glass-strong lg-refract modal legacy-modal"></div>`;
    document.body.appendChild(scrim);
    scrim.addEventListener("click", (e) => { if (e.target === scrim) scrim.classList.remove("open"); });
  }
  const body = seg.type === "glossary"
    ? seg.entries.map((e) => `<div class="leg-entry"><b>${e.term}</b><span>${e.def}</span></div>`).join("")
    : seg.entries.map((e) => `<div class="leg-entry msg-like">${e.text}</div>`).join("");
  scrim.querySelector(".legacy-modal").innerHTML = `
    <div class="q-head" style="margin-bottom:14px">
      <b style="font-size:18px">${seg.emoji || ""} ${seg.name}</b>
      <button class="glass-pill" id="legClose" style="cursor:pointer">✕</button>
    </div>
    <div class="leg-list">${body}</div>`;
  scrim.querySelector("#legClose").addEventListener("click", () => scrim.classList.remove("open"));
  scrim.classList.add("open");
}

/* ---------- News (scraped articles from fightclub.gr) ---------- */
async function renderNews() {
  const rail = $("#newsRail");
  if (!rail) return;
  let items = [];
  try { const r = await fetch(`${SHOW.apiBase}/news`); if (r.ok) items = await r.json(); } catch {}
  if (!items.length) { $("#newsSection")?.style && ($("#newsSection").style.display = "none"); return; }
  rail.innerHTML = items.slice(0, 16).map((n) => `
    <a class="glass lg-refract news-card" href="${n.url}" target="_blank" rel="noopener">
      <div class="news-thumb"${n.image ? ` style="background-image:url('${n.image}')"` : ""}></div>
      <div class="news-title">${n.title}</div>
    </a>`).join("");
  rail.querySelectorAll(".news-card").forEach(trackPointer);
}

/* ---------- Quiz packs (shared source of truth: GET /quizzes, seed fallback) ---------- */
let PACKS = QUIZ_PACKS;

async function loadQuizzes() {
  try {
    const r = await fetch(`${SHOW.apiBase}/quizzes`);
    if (!r.ok) throw 0;
    const data = await r.json();
    if (Array.isArray(data) && data.length) PACKS = data;
  } catch {
    PACKS = QUIZ_PACKS; // offline-of-backend: keep the seed
  }
}

function renderPacks(v) {
  const grid = $("#packGrid");
  grid.innerHTML = PACKS.map((p) => {
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
    const pack = PACKS.find((p) => p.id === card.dataset.pack);
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
    const pack = PACKS[Math.floor(Math.random() * PACKS.length)];
    openQuiz(pack, { onClose: refresh });
  });
}

/* ---------- Personal stats (local progress, no backend leaderboard) ---------- */
function wireStats() {
  const link = $("#statsLink");
  if (link) link.addEventListener("click", (e) => { e.preventDefault(); openStats(); });

  // "Όλα τα σεγκμεντ" → open the first real legacy segment, else scroll to it.
  const seg = $("#segLink");
  if (seg) seg.addEventListener("click", (e) => {
    const first = LEGACY.find((s) => s.entries && s.entries.length);
    if (first) { e.preventDefault(); openLegacy(first); }
  });
}

function openStats() {
  const v = lastView || getView();
  let scrim = $("#statsScrim");
  if (!scrim) {
    scrim = document.createElement("div");
    scrim.id = "statsScrim";
    scrim.className = "modal-scrim";
    scrim.innerHTML = `<div class="glass glass-strong lg-refract modal stats-modal"></div>`;
    document.body.appendChild(scrim);
    scrim.addEventListener("click", (e) => { if (e.target === scrim) scrim.classList.remove("open"); });
  }
  const packRows = PACKS.map((p) => {
    const best = v.bestScores[p.id] || 0;
    return `<div class="stat-row">
      <span>${p.emoji} ${p.name}</span>
      <span class="stat-val">${best}%</span>
    </div>
    <div class="bar"><i style="width:${best}%"></i></div>`;
  }).join("");

  scrim.querySelector(".stats-modal").innerHTML = `
    <div class="q-head" style="margin-bottom:14px">
      <b style="font-size:18px">📊 Τα στατιστικά μου</b>
      <button class="glass-pill" id="statsClose" style="cursor:pointer">✕</button>
    </div>
    <div class="stat-cards">
      <div class="stat-card"><div class="big">${v.xp.toLocaleString("el-GR")}</div><small>XP</small></div>
      <div class="stat-card"><div class="big">Lvl ${v.level}</div><small>${v.title}</small></div>
      <div class="stat-card"><div class="big">🔥 ${v.streak}</div><small>σερί ημερών</small></div>
    </div>
    <div class="stat-next">${v.toNext > 0 ? `Άλλα <b>${v.toNext}</b> XP για το επόμενο level` : "Στο μέγιστο level! 🏆"}</div>
    <div class="leg-list" style="margin-top:8px">${packRows}</div>
    <div class="stat-foot">${v.dailyDone ? "✅ Ολοκλήρωσες το daily challenge σήμερα" : "⏳ Το daily challenge σε περιμένει"}</div>`;
  scrim.querySelector("#statsClose").addEventListener("click", () => scrim.classList.remove("open"));
  scrim.classList.add("open");
}

/* ---------- Boot ---------- */
function boot() {
  $("#tagline").textContent = SHOW.tagline;
  $("#hosts").textContent = SHOW.hosts.join(" & ");
  $("#station").textContent = SHOW.slot;

  initPlayer();
  initLive();
  initMessages();

  // Spinner on whichever card's play button is currently loading, so the
  // tap-to-play feedback lives where the user clicked, not just the dock.
  onPlayerChange((s) => {
    document.querySelectorAll(".play-btn.is-loading").forEach((b) => b.classList.remove("is-loading"));
    if (s.buffering && s.ep) {
      document
        .querySelectorAll(`[data-ep="${s.ep.id}"] .play-btn`)
        .forEach((b) => b.classList.add("is-loading"));
    }
  });
  renderEpisodes(); // seed immediately
  renderStats();
  renderFeatured();
  loadEpisodes().then(() => { renderEpisodes(); renderStats(); renderFeatured(); renderArchive(); }); // real archive
  renderHistory();
  renderSegments(); // placeholder, then real content
  loadLegacy().then(renderSegments);
  loadQuizzes().then(() => { if (lastView) renderPacks(lastView); }); // shared /quizzes
  renderNews();
  wireDaily();
  wireStats();
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

/**
 * Gamification engine, the "don't-want-to-leave" loop.
 * XP + levels + daily streaks, persisted in localStorage. Pure, framework-free.
 */
import { LEVELS } from "./data.js";

const KEY = "fc2_state_v1";

const todayStr = () => new Date().toISOString().slice(0, 10);
const yesterdayStr = () => {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
};

function load() {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY));
    if (raw) return raw;
  } catch (_) {}
  return { xp: 0, streak: 0, lastActive: null, packProgress: {}, bestScores: {}, dailyDone: null };
}

let state = load();
const listeners = new Set();

function save() {
  localStorage.setItem(KEY, JSON.stringify(state));
  listeners.forEach((fn) => fn(getView()));
}

/** Roll the daily streak forward / reset on a missed day. */
export function touchStreak() {
  const t = todayStr();
  if (state.lastActive === t) return; // already counted today
  if (state.lastActive === yesterdayStr()) state.streak += 1;
  else state.streak = 1;
  state.lastActive = t;
  save();
}

export function addXP(amount) {
  const before = currentLevel().lvl;
  state.xp += amount;
  save();
  const after = currentLevel().lvl;
  return { leveledUp: after > before, level: after };
}

export function recordQuiz(packId, correct, total, xpGained) {
  const pct = Math.round((correct / total) * 100);
  state.bestScores[packId] = Math.max(state.bestScores[packId] || 0, pct);
  state.packProgress[packId] = pct;
  save();
  return addXP(xpGained);
}

export function markDailyDone() {
  state.dailyDone = todayStr();
  save();
}
export const isDailyDone = () => state.dailyDone === todayStr();

export function currentLevel() {
  let cur = LEVELS[0];
  for (const l of LEVELS) if (state.xp >= l.xp) cur = l;
  return cur;
}
export function nextLevel() {
  return LEVELS.find((l) => l.xp > state.xp) || null;
}

export function getView() {
  const cur = currentLevel();
  const nxt = nextLevel();
  const span = nxt ? nxt.xp - cur.xp : 1;
  const into = state.xp - cur.xp;
  return {
    xp: state.xp,
    streak: state.streak,
    level: cur.lvl,
    title: cur.title,
    progress: nxt ? Math.min(1, into / span) : 1,
    toNext: nxt ? nxt.xp - state.xp : 0,
    bestScores: state.bestScores,
    packProgress: state.packProgress,
    dailyDone: isDailyDone(),
  };
}

export function subscribe(fn) {
  listeners.add(fn);
  fn(getView());
  return () => listeners.delete(fn);
}

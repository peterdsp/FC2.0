/**
 * scheduler.js — the daily content refresh that keeps fc-api (and therefore the
 * web + iOS + Android apps, which are all backend-driven) up to date with no
 * manual work.
 *
 * Once a day it re-runs the scrapers that pull fresh data from the show's own
 * sources, so new episodes, their on-demand streaming links (Mixcloud), news
 * and FC Legacy content appear automatically:
 *
 *   scrape-fightclub.cjs   new episodes + deterministic Mixcloud links
 *   enrich-mixcloud.cjs    fills the real Mixcloud URL per recent episode
 *   scrape-news.cjs        latest articles  → data/news.json
 *   scrape-legacy.cjs      dictionary / listener content → data/legacy.json
 *
 * Safety: each task that OVERWRITES a file is snapshotted first; if the scrape
 * fails, times out, or produces empty/invalid JSON, the previous good file is
 * restored — a flaky network never wipes live content. (scrape-fightclub +
 * enrich-mixcloud already MERGE, preserving downloaded `file` and known links.)
 *
 * Config (env):
 *   FC_SCRAPE_ENABLED   "0"/"false" to turn the scheduler off  (default: on)
 *   FC_SCRAPE_HOUR      server-local hour to run, 0–23          (default: 4)
 *   FC_SCRAPE_ON_BOOT   "1" to also run once at startup         (default: off)
 *   FC_ADMIN_TOKEN      enables POST /admin/refresh (x-admin-token header)
 *
 * Run a one-off refresh from the CLI:  npm run refresh
 */
import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA = path.join(__dirname, "data");
const TASK_TIMEOUT_MS = 5 * 60 * 1000;

/** Ordered daily tasks. `guard` files are restored if a task yields bad data. */
const TASKS = [
  // Sitemap crawl (full catalog) but only enrich the newest episodes each day.
  { name: "episodes", script: "scrape-fightclub.cjs", args: ["--recent", "20"], guard: "episodes.json", minLen: 1 },
  { name: "mixcloud-links", script: "enrich-mixcloud.cjs", args: ["8"], guard: "episodes.json", minLen: 1 },
  { name: "historic", script: "archive-extra.cjs", args: [], guard: "episodes.json", minLen: 1 },
  { name: "news", script: "scrape-news.cjs", args: ["3"], guard: "news.json", minLen: 1 },
  { name: "legacy", script: "scrape-legacy.cjs", args: [], guard: "legacy.json", minLen: 1 },
];

/** Length of a parsed JSON payload (array length or object key count). */
function payloadLen(parsed) {
  return Array.isArray(parsed) ? parsed.length : parsed ? Object.keys(parsed).length : 0;
}

function runTask(t) {
  return new Promise((resolve) => {
    const guardPath = t.guard ? path.join(DATA, t.guard) : null;
    const backup = guardPath && fs.existsSync(guardPath) ? fs.readFileSync(guardPath) : null;
    const started = Date.now();

    const child = spawn(process.execPath, [path.join(__dirname, t.script), ...t.args], {
      cwd: __dirname,
      env: process.env,
    });
    let timedOut = false;
    const killer = setTimeout(() => { timedOut = true; child.kill("SIGKILL"); }, TASK_TIMEOUT_MS);

    child.on("error", (e) => {
      clearTimeout(killer);
      if (backup && guardPath) fs.writeFileSync(guardPath, backup);
      console.warn(`[scheduler] ${t.name}: spawn error (${e.message}) — kept previous data`);
      resolve(false);
    });

    child.on("close", (code) => {
      clearTimeout(killer);
      const secs = ((Date.now() - started) / 1000).toFixed(0);
      let ok = code === 0 && !timedOut;

      if (ok && guardPath) {
        try {
          const len = payloadLen(JSON.parse(fs.readFileSync(guardPath, "utf8")));
          if (len < (t.minLen || 1)) ok = false;
        } catch { ok = false; }
      }

      if (!ok && backup && guardPath) {
        fs.writeFileSync(guardPath, backup);
        console.warn(`[scheduler] ${t.name}: failed (code ${code}${timedOut ? ", timeout" : ""}) — restored ${t.guard}`);
      } else {
        console.log(`[scheduler] ${t.name}: ok in ${secs}s`);
      }
      resolve(ok);
    });
  });
}

let running = false;

/** Run the full refresh once, sequentially. Never throws. */
export async function runDailyRefresh(reason = "scheduled") {
  if (running) {
    console.warn("[scheduler] refresh already in progress — skipping");
    return { skipped: true };
  }
  running = true;
  const t0 = Date.now();
  console.log(`[scheduler] daily refresh start (${reason})`);
  const results = {};
  for (const t of TASKS) results[t.name] = await runTask(t);
  running = false;
  console.log(`[scheduler] daily refresh done in ${((Date.now() - t0) / 1000).toFixed(0)}s`);
  return results;
}

/** Next occurrence of `hour:00` (server-local) strictly after `from`. */
export function nextRunAt(hour, from = new Date()) {
  const next = new Date(from);
  next.setHours(hour, 0, 0, 0);
  if (next <= from) next.setDate(next.getDate() + 1);
  return next;
}

/** Arm the daily timer. Re-chains each day so DST drift self-corrects. */
export function startScheduler() {
  const flag = process.env.FC_SCRAPE_ENABLED;
  if (flag === "0" || flag === "false") {
    console.log("[scheduler] disabled (FC_SCRAPE_ENABLED=0)");
    return;
  }
  const hour = Number.isFinite(+process.env.FC_SCRAPE_HOUR) ? +process.env.FC_SCRAPE_HOUR : 4;

  if (process.env.FC_SCRAPE_ON_BOOT === "1") runDailyRefresh("boot");

  const arm = () => {
    const next = nextRunAt(hour);
    const ms = next - Date.now();
    console.log(`[scheduler] next refresh at ${next.toISOString()} (in ~${Math.round(ms / 3.6e6)}h)`);
    setTimeout(async () => {
      await runDailyRefresh("scheduled");
      arm();
    }, ms);
  };
  arm();
}

// `node scheduler.js` (npm run refresh) → one-off refresh, then exit.
if (process.argv[1] && process.argv[1].endsWith("scheduler.js")) {
  runDailyRefresh("cli").then(() => process.exit(0));
}

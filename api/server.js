/**
 * fc-api, Fight Club 2.0 backend
 * ------------------------------------------------------------------
 * Serves the episode catalog and streams / downloads MP3s with proper
 * HTTP range support (so the web/iOS/Android players can seek and resume).
 *
 *   GET /health              liveness probe
 *   GET /episodes            catalog (JSON)
 *   GET /episodes/:id        single episode metadata
 *   GET /eras                episodes grouped by era (Euro, World Cup, etc.)
 *   GET /schedule            daily on-air program
 *   GET /quizzes             quiz packs (apps share one source of truth)
 *   GET /stream/:id          audio stream, supports `Range` for seeking
 *   GET /download/:id        forces a file download (offline listening)
 *   GET/POST /messages       listener message wall
 *
 * Config via env (all paths are deployment specific, set them yourself):
 *   FC_MEDIA_DIR  path to the MP3 library (default: ./media)
 *   FC_PORT       listen port (default: 8080)
 */
import express from "express";
import cors from "cors";
import fs from "node:fs";
import path from "node:path";
import http from "node:http";
import https from "node:https";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { ERAS, groupByEra } from "./eras.js";
import { SCHEDULE, currentShow } from "./schedule.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MEDIA_DIR = process.env.FC_MEDIA_DIR || path.join(__dirname, "media");
const PORT = process.env.FC_PORT || 8080;
const DATA = path.join(__dirname, "data");

const app = express();
app.use(
  cors({
    origin: [/\.peterdsp\.dev$/, /peterdsp\.github\.io$/, /localhost(:\d+)?$/, /127\.0\.0\.1(:\d+)?$/],
  })
);
app.use(express.json({ limit: "8kb" }));

const readJSON = (f, fallback) => {
  try {
    return JSON.parse(fs.readFileSync(path.join(DATA, f), "utf8"));
  } catch {
    return fallback;
  }
};

const loadEpisodes = () => readJSON("episodes.json", []);
const loadQuizzes = () => readJSON("quizzes.json", []);

/** Resolve an episode id to a safe absolute file path inside MEDIA_DIR. */
function mediaPath(ep) {
  if (!ep?.file) return null;
  const resolved = path.resolve(MEDIA_DIR, ep.file);
  // prevent path traversal, must stay under MEDIA_DIR
  if (!resolved.startsWith(path.resolve(MEDIA_DIR))) return null;
  return resolved;
}

app.get("/health", (_req, res) =>
  res.json({ ok: true, episodes: loadEpisodes().length })
);

app.get("/episodes", (_req, res) => res.json(loadEpisodes()));

app.get("/episodes/:id", (req, res) => {
  const ep = loadEpisodes().find((e) => e.id === req.params.id);
  if (!ep) return res.status(404).json({ error: "not found" });
  res.json(ep);
});

app.get("/quizzes", (_req, res) => res.json(loadQuizzes()));

/** Archive grouped by era (Euro, World Cup, ...) and by year. */
app.get("/eras", (_req, res) => {
  const eps = loadEpisodes();
  res.json({ eras: groupByEra(eps), known: ERAS.map((e) => ({ id: e.id, label: e.label, emoji: e.emoji })) });
});

/** Daily on-air program + the show currently on air. */
app.get("/schedule", (_req, res) => res.json({ schedule: SCHEDULE, now: currentShow() }));

/** Listener message wall (kept small, append-only, capped). */
const MSG_FILE = "messages.json";
app.get("/messages", (_req, res) => res.json(readJSON(MSG_FILE, []).slice(-50)));
app.post("/messages", (req, res) => {
  const name = String(req.body?.name || "Ανώνυμος").slice(0, 40);
  const text = String(req.body?.text || "").trim().slice(0, 280);
  if (!text) return res.status(400).json({ error: "empty message" });
  const msgs = readJSON(MSG_FILE, []);
  const msg = { id: Date.now().toString(36), name, text, at: new Date().toISOString() };
  msgs.push(msg);
  try {
    fs.writeFileSync(path.join(DATA, MSG_FILE), JSON.stringify(msgs.slice(-500), null, 2));
  } catch {
    return res.status(500).json({ error: "could not save" });
  }
  res.status(201).json(msg);
});

/**
 * On-demand source resolver. When an episode has no local file, resolve its
 * upstream audio URL (Mixcloud / YouTube) with yt-dlp and cache it (URLs
 * expire). This lets fc-api proxy any episode live, no storage needed.
 */
const YTDLP = process.env.FC_YTDLP || path.join(process.env.HOME || "", ".local/bin/yt-dlp");
const srcCache = new Map(); // id -> { url, exp }

function resolveSource(ep) {
  return new Promise((resolve) => {
    const c = srcCache.get(ep.id);
    if (c && c.exp > Date.now()) return resolve(c.url);
    const src = ep.mixcloud || (ep.youtube ? `https://www.youtube.com/watch?v=${ep.youtube}` : null);
    if (!src) return resolve(null);
    let out = "";
    const p = spawn(YTDLP, ["-f", "bestaudio[ext=m4a]/bestaudio", "-g", "--no-playlist", src]);
    p.stdout.on("data", (d) => (out += d));
    p.on("error", () => resolve(null));
    p.on("close", () => {
      const url = out.trim().split("\n")[0];
      if (/^https?:/.test(url)) {
        srcCache.set(ep.id, { url, exp: Date.now() + 50 * 60 * 1000 });
        resolve(url);
      } else resolve(null);
    });
  });
}

/** Proxy an upstream audio URL to the client, passing Range through. */
function proxyUpstream(url, req, res, { download, id }) {
  const mod = url.startsWith("https") ? https : http;
  const headers = { "User-Agent": "Mozilla/5.0" };
  if (req.headers.range) headers.Range = req.headers.range;
  const up = mod.get(url, { headers }, (r) => {
    if (r.statusCode >= 400) { res.status(502).json({ error: "upstream " + r.statusCode }); r.resume(); return; }
    res.status(r.statusCode === 206 ? 206 : 200);
    res.setHeader("Accept-Ranges", "bytes");
    res.setHeader("Content-Type", r.headers["content-type"] || "audio/mp4");
    if (r.headers["content-length"]) res.setHeader("Content-Length", r.headers["content-length"]);
    if (r.headers["content-range"]) res.setHeader("Content-Range", r.headers["content-range"]);
    res.setHeader("Cache-Control", "public, max-age=3600");
    if (download) res.setHeader("Content-Disposition", `attachment; filename="${id}.m4a"`);
    r.pipe(res);
  });
  up.on("error", () => { if (!res.headersSent) res.status(502).json({ error: "upstream error" }); });
  req.on("close", () => up.destroy());
}

/** Range-aware audio streaming. Local file if present, else live proxy. */
async function streamAudio(req, res, { download }) {
  const ep = loadEpisodes().find((e) => e.id === req.params.id);
  if (!ep) return res.status(404).json({ error: "not found" });
  const file = mediaPath(ep);

  if (!file || !fs.existsSync(file)) {
    // no local copy: resolve + proxy the upstream source on demand
    const url = await resolveSource(ep);
    if (!url) return res.status(404).json({ error: "audio unavailable" });
    return proxyUpstream(url, req, res, { download, id: ep.id });
  }

  const stat = fs.statSync(file);
  const total = stat.size;
  const range = req.headers.range;
  const ext = path.extname(file).toLowerCase();
  const TYPES = { ".mp3": "audio/mpeg", ".m4a": "audio/mp4", ".aac": "audio/aac", ".webm": "audio/webm", ".opus": "audio/ogg", ".ogg": "audio/ogg" };
  const ctype = TYPES[ext] || "application/octet-stream";

  res.setHeader("Accept-Ranges", "bytes");
  res.setHeader("Content-Type", ctype);
  res.setHeader("Cache-Control", "public, max-age=86400");
  if (download)
    res.setHeader("Content-Disposition", `attachment; filename="${ep.id}${ext}"`);

  if (range) {
    const [startStr, endStr] = range.replace(/bytes=/, "").split("-");
    const start = parseInt(startStr, 10) || 0;
    const end = endStr ? parseInt(endStr, 10) : total - 1;
    if (start >= total) {
      res.status(416).setHeader("Content-Range", `bytes */${total}`);
      return res.end();
    }
    res.status(206);
    res.setHeader("Content-Range", `bytes ${start}-${end}/${total}`);
    res.setHeader("Content-Length", end - start + 1);
    fs.createReadStream(file, { start, end }).pipe(res);
  } else {
    res.setHeader("Content-Length", total);
    fs.createReadStream(file).pipe(res);
  }
}

const safe = (handler) => (req, res) =>
  handler(req, res).catch(() => { if (!res.headersSent) res.status(500).json({ error: "stream error" }); });
app.get("/stream/:id", safe((req, res) => streamAudio(req, res, { download: false })));
app.get("/download/:id", safe((req, res) => streamAudio(req, res, { download: true })));

app.listen(PORT, () => console.log(`fc-api listening on :${PORT}`));

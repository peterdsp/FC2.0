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
    origin: [/\.peterdsp\.dev$/, /localhost(:\d+)?$/, /127\.0\.0\.1(:\d+)?$/],
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

/** Range-aware audio streaming so players can seek instantly. */
function streamAudio(req, res, { download }) {
  const ep = loadEpisodes().find((e) => e.id === req.params.id);
  const file = mediaPath(ep);
  if (!file || !fs.existsSync(file))
    return res.status(404).json({ error: "audio unavailable" });

  const stat = fs.statSync(file);
  const total = stat.size;
  const range = req.headers.range;

  res.setHeader("Accept-Ranges", "bytes");
  res.setHeader("Content-Type", "audio/mpeg");
  res.setHeader("Cache-Control", "public, max-age=86400");
  if (download)
    res.setHeader("Content-Disposition", `attachment; filename="${ep.id}.mp3"`);

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

app.get("/stream/:id", (req, res) => streamAudio(req, res, { download: false }));
app.get("/download/:id", (req, res) => streamAudio(req, res, { download: true }));

app.listen(PORT, () => console.log(`fc-api listening on :${PORT}`));

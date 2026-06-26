/**
 * ingest.js, catalog the MP3 library into episodes.json.
 *
 * Scans FC_MEDIA_DIR recursively for *.mp3, reads basic metadata, derives the
 * era (Euro/World Cup/CL/EL/big events) from the date, and writes
 * data/episodes.json. Re-run whenever new episodes land.
 *
 *   FC_MEDIA_DIR=/path/to/library node ingest.js
 *
 * Filename convention it understands (best-effort, all optional):
 *   2024-03-12 - Category - Title.mp3
 * Anything that doesn't match still gets catalogued with sensible defaults.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { eraForDate } from "./eras.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MEDIA_DIR = process.env.FC_MEDIA_DIR || path.join(__dirname, "media");
const OUT = path.join(__dirname, "data", "episodes.json");

function walk(dir) {
  const out = [];
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full));
    else if (entry.name.toLowerCase().endsWith(".mp3")) out.push(full);
  }
  return out;
}

const slugify = (s) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9α-ω]+/gi, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 60);

function parse(file) {
  const rel = path.relative(MEDIA_DIR, file);
  const base = path.basename(file, ".mp3");
  const stat = fs.statSync(file);

  // try "YYYY-MM-DD - Category - Title"
  const m = base.match(/^(\d{4}-\d{2}-\d{2})\s*-\s*([^-]+?)\s*-\s*(.+)$/);
  const date = m ? m[1] : new Date(stat.mtime).toISOString().slice(0, 10);
  const category = m ? m[2].trim() : "Αρχείο";
  const title = m ? m[3].trim() : base;

  return {
    id: `ep-${date}-${slugify(title)}`.slice(0, 80),
    title,
    date,
    year: date.slice(0, 4),
    month: date.slice(0, 7),
    era: eraForDate(date),
    category,
    file: rel, // relative to MEDIA_DIR; server resolves safely
    bytes: stat.size,
    tags: [],
    description: "",
    plays: 0,
  };
}

const files = walk(MEDIA_DIR);
const episodes = files
  .map(parse)
  .sort((a, b) => (a.date < b.date ? 1 : -1));

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, JSON.stringify(episodes, null, 2));
console.log(`Catalogued ${episodes.length} episodes from ${MEDIA_DIR} → ${OUT}`);

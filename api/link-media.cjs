/**
 * link-media.cjs, attach downloaded audio files to the episode catalog.
 *
 * Scans FC_MEDIA_DIR for audio files, matches them to catalog episodes by the
 * YYYY-MM-DD in the filename, and sets `file` (so /stream and /download work)
 * WITHOUT discarding catalog-only episodes. Re-run after each batch download.
 */
const fs = require("fs");
const path = require("path");

const DIR = process.env.FC_MEDIA_DIR || path.join(__dirname, "media");
const DATA = path.join(__dirname, "data", "episodes.json");
const AUD = /\.(mp3|m4a|aac|webm|opus|ogg)$/i;

function walk(d) {
  let out = [];
  if (!fs.existsSync(d)) return out;
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const f = path.join(d, e.name);
    if (e.isDirectory()) out.push(...walk(f));
    else if (AUD.test(e.name)) out.push(f);
  }
  return out;
}

const eps = JSON.parse(fs.readFileSync(DATA, "utf8"));
const byDate = {};
eps.forEach((e) => (byDate[e.date] = e));

let linked = 0;
for (const f of walk(DIR)) {
  const rel = path.relative(DIR, f);
  const m = path.basename(f).match(/(\d{4}-\d{2}-\d{2})/);
  if (!m) continue;
  const date = m[1];
  const bytes = fs.statSync(f).size;
  if (byDate[date]) {
    byDate[date].file = rel;
    byDate[date].bytes = bytes;
  } else {
    eps.push({
      id: `ep-${date}-fight-club`, title: `Fight Club (${date})`, date,
      year: date.slice(0, 4), month: date.slice(0, 7), era: null,
      category: "Fight Club", file: rel, bytes, tags: [], description: "", plays: 0,
    });
  }
  linked++;
}

fs.writeFileSync(DATA, JSON.stringify(eps, null, 2));
const withFile = eps.filter((e) => e.file).length;
console.log(`linked ${linked} media file(s); ${withFile}/${eps.length} episodes now playable`);

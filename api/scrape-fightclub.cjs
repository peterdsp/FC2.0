/**
 * scrape-fightclub.cjs, build the catalog by scraping the show's OWN site,
 * fightclub.gr/radio/ekpompes (paginated). Per episode we get date, title and
 * artwork straight from the source. Audio is resolved on demand by fc-api from
 * the show's official on-demand (Mixcloud URL is deterministic from the date),
 * so nothing external is shown to the user, fc-api streams it.
 *
 *   node scrape-fightclub.cjs [pages]   # default: all (~149). Use a small N
 *                                        # for the daily "new posts" refresh.
 *
 * Merges into data/episodes.json, preserving any downloaded `file` and known
 * `mixcloud` URLs.
 */
const https = require("https");
const fs = require("fs");
const path = require("path");
const { eraForDate } = require("./eras.js");

const MAX_PAGES = parseInt(process.argv[2] || "149", 10);
const OUT = path.join(__dirname, "data", "episodes.json");
const BASE = "https://fightclub.gr/radio/ekpompes";

const get = (url) =>
  new Promise((resolve) => {
    https.get(url, { headers: { "user-agent": "Mozilla/5.0" } }, (r) => {
      if (r.statusCode >= 400) { r.resume(); return resolve(""); }
      let d = ""; r.on("data", (c) => (d += c)); r.on("end", () => resolve(d));
    }).on("error", () => resolve(""));
  });

const mixcloudFor = (date) => {
  const [y, m, d] = date.split("-");
  return `https://www.mixcloud.com/SPORFM946/fight-club-${d}${m}${y}/`;
};

function parseListing(html) {
  const items = [];
  const re = /<a href="(https:\/\/fightclub\.gr\/radio\/ekpompes\/[^"]+\.html)">\s*<img[^>]*src="([^"]+)"[^>]*alt="([^"]*)"/gi;
  let m;
  while ((m = re.exec(html))) {
    const url = m[1], img = m[2];
    const dm = url.match(/-(\d{1,2})-(\d{1,2})-(\d{4})-/);
    if (!dm) continue;
    const date = `${dm[3]}-${dm[2].padStart(2, "0")}-${dm[1].padStart(2, "0")}`;
    // alt: "Fight Club 2.0 – 18/6/2026 – <Theme>". Normalise dashes & entities,
    // then strip the show name + the date prefix, leaving the episode theme.
    const alt = m[3]
      .replace(/&#8211;|&#8212;|&ndash;|&mdash;|–|—/g, "-")
      .replace(/&#8217;|&rsquo;|’/g, "'")
      .replace(/&amp;/g, "&")
      .replace(/\s+/g, " ").trim();
    const title =
      alt.replace(/^fight club\s*2\.0\s*-?\s*/i, "")
         .replace(/^\d{1,2}\/\d{1,2}\/\d{4}\s*-?\s*/, "")
         .trim() || `Fight Club (${date})`;
    items.push({ date, url, image: img, title });
  }
  return items;
}

(async () => {
  const scraped = new Map();
  for (let p = 1; p <= MAX_PAGES; p++) {
    const html = await get(p === 1 ? BASE : `${BASE}/page/${p}`);
    if (!html) break;
    const items = parseListing(html);
    if (!items.length) break;
    items.forEach((it) => scraped.set(it.date, it));
    if (p % 20 === 0) process.stderr.write(`  …page ${p} (${scraped.size} episodes)\n`);
  }

  // merge with existing (preserve downloaded files + known mixcloud)
  let prev = [];
  try { prev = JSON.parse(fs.readFileSync(OUT, "utf8")); } catch {}
  const prevByDate = Object.fromEntries(prev.map((e) => [e.date, e]));

  const eps = [...scraped.values()]
    .sort((a, b) => (a.date < b.date ? 1 : -1))
    .map((it) => {
      const old = prevByDate[it.date] || {};
      return {
        id: `ep-${it.date}-fight-club`,
        title: it.title,
        date: it.date,
        year: it.date.slice(0, 4),
        month: it.date.slice(0, 7),
        era: eraForDate(it.date),
        category: "Fight Club",
        image: it.image,
        source: it.url,
        mixcloud: old.mixcloud || mixcloudFor(it.date),
        youtube: old.youtube || null,
        file: old.file || null,
        tags: [], description: "", plays: old.plays || 0,
      };
    });

  // keep any older episodes we had but that fell off the scrape window
  for (const e of prev) if (!scraped.has(e.date)) eps.push(e);
  eps.sort((a, b) => (a.date < b.date ? 1 : -1));

  // Enrich: grab each episode's YouTube id (reliable per-episode audio source)
  // from its page. Incremental, concurrency-limited, only for ones missing it.
  const todo = eps.filter((e) => e.source && !e.youtube);
  process.stderr.write(`  enriching ${todo.length} episodes with YouTube ids…\n`);
  let idx = 0;
  const worker = async () => {
    while (idx < todo.length) {
      const e = todo[idx++];
      const html = await get(e.source);
      const m = html.match(/youtube\.com\/embed\/([A-Za-z0-9_-]{11})/);
      if (m) e.youtube = m[1];
    }
  };
  await Promise.all(Array.from({ length: 8 }, worker));

  fs.writeFileSync(OUT, JSON.stringify(eps, null, 2));
  console.log(`catalog: ${eps.length} episodes (${eps[eps.length - 1]?.date} -> ${eps[0]?.date})`);
})();

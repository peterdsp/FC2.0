/**
 * scrape-fightclub.cjs — build the FULL Fight Club catalog from the show's OWN
 * site, fightclub.gr. Driven by the site's XML sitemaps (not fragile pagination),
 * so it captures EVERY episode the site has — both modern slugs
 * (`fight-club-2-0-29-6-2026-nok-aout.html`) and the older date-only slugs
 * (`fight-club-2-0-10-12-2018.html`), back to the start of the site's archive.
 *
 * Audio is resolved on demand by fc-api: each episode carries a deterministic
 * Mixcloud URL (from its date) plus its YouTube id, scraped from the page.
 *
 *   node scrape-fightclub.cjs            # full sitemap crawl (all episodes)
 *   node scrape-fightclub.cjs --recent N # only enrich the N newest (daily run)
 *
 * Merges into data/episodes.json, preserving downloaded `file`, `plays`, and any
 * already-known title/image/youtube so a re-run only fills what's missing.
 */
const https = require("https");
const fs = require("fs");
const path = require("path");
const { eraForDate } = require("./eras.js");

const OUT = path.join(__dirname, "data", "episodes.json");
const SITEMAP_INDEX = "https://fightclub.gr/sitemap_index.xml";
const EKP_RE = /https:\/\/fightclub\.gr\/radio\/ekpompes\/[^<"]+\.html/;

// --recent N → only fetch/enrich the N most-recent episodes (fast daily refresh).
const recentFlag = process.argv.indexOf("--recent");
const RECENT = recentFlag > -1 ? parseInt(process.argv[recentFlag + 1] || "8", 10) : Infinity;
const CONCURRENCY = 8;

const get = (url) =>
  new Promise((resolve) => {
    https
      .get(url, { headers: { "user-agent": "Mozilla/5.0" } }, (r) => {
        if (r.statusCode >= 400) { r.resume(); return resolve(""); }
        let d = ""; r.on("data", (c) => (d += c)); r.on("end", () => resolve(d));
      })
      .on("error", () => resolve(""));
  });

const mixcloudFor = (date) => {
  const [y, m, d] = date.split("-");
  return `https://www.mixcloud.com/SPORFM946/fight-club-${d}${m}${y}/`;
};

/** Pull the episode date out of either slug format. */
function dateFromUrl(url) {
  // matches "-29-6-2026-" (date + title) OR "-10-12-2018." (date-only)
  const m = url.match(/-(\d{1,2})-(\d{1,2})-(20\d{2})(?:[-.])/);
  if (!m) return null;
  return `${m[3]}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}`;
}

/** Humanised fallback title from the slug's title segment (if any). */
function titleFromUrl(url, date) {
  const slug = url.replace(/.*\/ekpompes\//, "").replace(/\.html$/, "");
  const after = slug.replace(/^fight-club-2-0-\d{1,2}-\d{1,2}-20\d{2}-?/, "");
  if (!after) return `Fight Club (${date})`;
  return after.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Clean an og:title into just the episode theme. */
function cleanTitle(raw, date) {
  const t = raw
    .replace(/&#8211;|&#8212;|&ndash;|&mdash;|–|—/g, "-")
    .replace(/&#8217;|&rsquo;|’/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/\s*[-|]\s*Fight ?Club.*$/i, "") // strip site suffix
    .replace(/\s+/g, " ").trim();
  return (
    t.replace(/^fight club\s*2\.0\s*-?\s*/i, "")
      .replace(/^\d{1,2}\/\d{1,2}\/\d{4}\s*-?\s*/, "")
      .trim() || `Fight Club (${date})`
  );
}

/** Every episode URL across all post sitemaps, newest first. */
async function allEpisodeUrls() {
  const idx = await get(SITEMAP_INDEX);
  const maps = (idx.match(/<loc>([^<]+post-sitemap[^<]+)<\/loc>/g) || []).map((x) =>
    x.replace(/<\/?loc>/g, "")
  );
  const byDate = new Map();
  for (const sm of maps) {
    const body = await get(sm);
    const locs = body.match(new RegExp(`<loc>(${EKP_RE.source})</loc>`, "g")) || [];
    for (const loc of locs) {
      const url = loc.replace(/<\/?loc>/g, "");
      const date = dateFromUrl(url);
      if (date && !byDate.has(date)) byDate.set(date, url);
    }
  }
  return [...byDate.entries()]
    .map(([date, url]) => ({ date, url }))
    .sort((a, b) => (a.date < b.date ? 1 : -1));
}

(async () => {
  const urls = await allEpisodeUrls();
  process.stderr.write(`  sitemap: ${urls.length} episode URLs (${urls[urls.length - 1]?.date} → ${urls[0]?.date})\n`);

  let prev = [];
  try { prev = JSON.parse(fs.readFileSync(OUT, "utf8")); } catch {}
  const prevByDate = Object.fromEntries(prev.map((e) => [e.date, e]));

  // Build/merge catalog from the complete URL set.
  const eps = urls.map(({ date, url }) => {
    const old = prevByDate[date] || {};
    return {
      id: `ep-${date}-fight-club`,
      title: old.title && !/^Fight Club \(/.test(old.title) ? old.title : titleFromUrl(url, date),
      date,
      year: date.slice(0, 4),
      month: date.slice(0, 7),
      era: eraForDate(date),
      category: "Fight Club",
      image: old.image || null,
      source: url,
      mixcloud: old.mixcloud || mixcloudFor(date),
      youtube: old.youtube || null,
      file: old.file || null,
      tags: old.tags || [],
      description: old.description || "",
      plays: old.plays || 0,
    };
  });
  // keep anything we had that isn't on the site listing anymore
  for (const e of prev) if (!eps.find((x) => x.date === e.date)) eps.push(e);
  eps.sort((a, b) => (a.date < b.date ? 1 : -1));

  // Enrich missing title/image/youtube straight from each episode page.
  const needs = (e) => !e.youtube || !e.image || /^Fight Club \(/.test(e.title);
  const todo = eps.filter((e) => e.source && needs(e)).slice(0, RECENT);
  process.stderr.write(`  enriching ${todo.length} episodes (title/image/youtube)…\n`);
  let idx = 0;
  const worker = async () => {
    while (idx < todo.length) {
      const e = todo[idx++];
      const html = await get(e.source);
      if (!html) continue;
      const yt = html.match(/(?:youtube\.com\/(?:embed\/|watch\?v=)|youtu\.be\/)([A-Za-z0-9_-]{11})/);
      if (yt) e.youtube = yt[1];
      const img = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i);
      if (img) e.image = img[1];
      const tt = html.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i);
      if (tt) e.title = cleanTitle(tt[1], e.date);
    }
  };
  await Promise.all(Array.from({ length: CONCURRENCY }, worker));

  fs.writeFileSync(OUT, JSON.stringify(eps, null, 2));
  console.log(`catalog: ${eps.length} episodes (${eps[eps.length - 1]?.date} → ${eps[0]?.date})`);
})();

/**
 * scrape-mixcloud.cjs, build the Fight Club episode catalog from the show's
 * official on-demand on Mixcloud (SPORFM946), tagged with era/year/month.
 *
 *   node scrape-mixcloud.cjs [pages]   # default 12 pages of 100
 *
 * Writes data/episodes.json (catalog). Episodes start with file:null; run a
 * download + link-media.cjs to attach audio. Content belongs to the show.
 */
const https = require("https");
const fs = require("fs");
const path = require("path");
const { eraForDate } = require("./eras.js");

const PAGES = parseInt(process.argv[2] || "12", 10);
const OUT = path.join(__dirname, "data", "episodes.json");

const get = (url) =>
  new Promise((res, rej) =>
    https.get(url, { headers: { "user-agent": "Mozilla/5.0" } }, (r) => {
      let d = ""; r.on("data", (c) => (d += c)); r.on("end", () => res(JSON.parse(d)));
    }).on("error", rej)
  );

(async () => {
  let url = "https://api.mixcloud.com/SPORFM946/cloudcasts/?limit=100";
  const fc = [];
  for (let p = 0; p < PAGES && url; p++) {
    const j = await get(url);
    for (const c of j.data || []) {
      if (!/fight\s*club/i.test(c.name || "")) continue;
      const m = (c.name || "").match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
      const date = m
        ? `${m[3]}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}`
        : (c.created_time || "").slice(0, 10);
      fc.push({ title: (c.name || "").trim(), date, mixcloud: c.url });
    }
    url = j.paging && j.paging.next;
  }
  const seen = new Set();
  const eps = fc
    .filter((e) => e.date && !seen.has(e.date) && seen.add(e.date))
    .sort((a, b) => (a.date < b.date ? 1 : -1))
    .map((e) => ({
      id: `ep-${e.date}-fight-club`, title: e.title, date: e.date,
      year: e.date.slice(0, 4), month: e.date.slice(0, 7), era: eraForDate(e.date),
      category: "Fight Club", file: null, mixcloud: e.mixcloud,
      tags: [], description: "", plays: 0,
    }));

  // preserve any already-linked files from a previous catalog
  let prev = [];
  try { prev = JSON.parse(fs.readFileSync(OUT, "utf8")); } catch {}
  const fileByDate = Object.fromEntries(prev.filter((e) => e.file).map((e) => [e.date, e.file]));
  eps.forEach((e) => { if (fileByDate[e.date]) e.file = fileByDate[e.date]; });

  fs.writeFileSync(OUT, JSON.stringify(eps, null, 2));
  console.log(`catalog: ${eps.length} Fight Club episodes (${eps[eps.length-1]?.date} -> ${eps[0]?.date})`);
})();

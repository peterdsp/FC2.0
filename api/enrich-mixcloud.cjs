/**
 * enrich-mixcloud.cjs, fill in the REAL Mixcloud URL per episode (by date) so
 * older episodes whose slug isn't the deterministic one still resolve. Merges
 * into data/episodes.json without disturbing titles/images/files.
 *
 *   node enrich-mixcloud.cjs [pages]   # default 60 (x100 cloudcasts)
 */
const https = require("https");
const fs = require("fs");
const path = require("path");

const PAGES = parseInt(process.argv[2] || "60", 10);
const OUT = path.join(__dirname, "data", "episodes.json");

const get = (url) =>
  new Promise((res) => {
    https.get(url, { headers: { "user-agent": "Mozilla/5.0" } }, (r) => {
      let d = ""; r.on("data", (c) => (d += c)); r.on("end", () => { try { res(JSON.parse(d)); } catch { res({}); } });
    }).on("error", () => res({}));
  });

(async () => {
  let url = "https://api.mixcloud.com/SPORFM946/cloudcasts/?limit=100";
  const map = {};
  for (let p = 0; p < PAGES && url; p++) {
    const j = await get(url);
    for (const c of j.data || []) {
      if (!/fight\s*club/i.test(c.name || "")) continue;
      const m = (c.name || "").match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
      const date = m ? `${m[3]}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}` : (c.created_time || "").slice(0, 10);
      if (date && c.url) map[date] = c.url;
    }
    url = j.paging && j.paging.next;
  }
  const eps = JSON.parse(fs.readFileSync(OUT, "utf8"));
  let n = 0;
  for (const e of eps) if (map[e.date]) { e.mixcloud = map[e.date]; n++; }
  fs.writeFileSync(OUT, JSON.stringify(eps, null, 2));
  const dates = Object.keys(map).sort();
  console.log(`real Mixcloud URLs matched: ${n} | Mixcloud FC coverage ${dates[0]} -> ${dates[dates.length - 1]} (${dates.length} on Mixcloud)`);
})();

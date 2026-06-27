/**
 * scrape-news.cjs, scrape the latest articles from fightclub.gr (the YouTube /
 * top-10 / feature posts) so the app has a News feed served by fc-api.
 * Writes data/news.json.
 */
const https = require("https");
const fs = require("fs");
const path = require("path");

const OUT = path.join(__dirname, "data", "news.json");
const PAGES = parseInt(process.argv[2] || "3", 10);

const get = (url) =>
  new Promise((res) => {
    https.get(url, { headers: { "user-agent": "Mozilla/5.0" } }, (r) => {
      let d = ""; r.on("data", (c) => (d += c)); r.on("end", () => res(d));
    }).on("error", () => res(""));
  });

const decode = (s) =>
  s.replace(/&#8211;|&#8212;|–|—/g, "-").replace(/&#8217;|’/g, "'")
   .replace(/&amp;/g, "&").replace(/&#8230;|…/g, "…").replace(/\s+/g, " ").trim();

function parse(html) {
  const out = [];
  const re = /<a href="(https:\/\/fightclub\.gr\/youtube\/[^"]+\.html)">\s*<img[^>]*src="([^"]+)"[^>]*alt="([^"]*)"/gi;
  let m;
  while ((m = re.exec(html))) {
    const url = m[1], image = m[2], title = decode(m[3]).replace(/^fight club\s*2\.0\s*-?\s*/i, "");
    out.push({ url, image, title });
  }
  return out;
}

(async () => {
  const seen = new Set();
  const items = [];
  for (let p = 1; p <= PAGES; p++) {
    const html = await get(p === 1 ? "https://fightclub.gr/youtube" : `https://fightclub.gr/youtube/page/${p}`);
    if (!html) break;
    const found = parse(html);
    if (!found.length) break;
    for (const it of found) if (!seen.has(it.url)) { seen.add(it.url); items.push(it); }
  }
  fs.writeFileSync(OUT, JSON.stringify(items.slice(0, 60), null, 2));
  console.log(`news: ${items.length} articles`);
})();

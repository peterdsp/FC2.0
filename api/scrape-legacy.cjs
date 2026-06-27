/**
 * scrape-legacy.cjs, scrape the FC Legacy content from fightclub.gr so the app
 * shows the REAL stuff (dictionary terms, listener messages by category), not
 * empty placeholders. Writes data/legacy.json. Re-run by the daily timer.
 */
const https = require("https");
const fs = require("fs");
const path = require("path");

const OUT = path.join(__dirname, "data", "legacy.json");

const get = (url) =>
  new Promise((res) => {
    https.get(url, { headers: { "user-agent": "Mozilla/5.0" } }, (r) => {
      let d = ""; r.on("data", (c) => (d += c)); r.on("end", () => res(d));
    }).on("error", () => res(""));
  });

const decode = (s) =>
  s.replace(/&#8217;|&#8216;|&rsquo;|&lsquo;/g, "'")
   .replace(/&#8220;|&#8221;|&ldquo;|&rdquo;/g, '"')
   .replace(/&#8211;|&#8212;|&ndash;|&mdash;/g, "-")
   .replace(/&#8230;|&hellip;/g, "…")
   .replace(/&amp;/g, "&").replace(/&nbsp;/g, " ")
   .replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();

const TOPICS = [
  { id: "leksiko", name: "Φαϊτκλαμποελληνικό Λεξικό", emoji: "📖", type: "glossary" },
  { id: "megales-alithies", name: "Μεγάλες Αλήθειες", emoji: "💬", type: "topic" },
  { id: "an-o-gkontzos-itan", name: "Αν ο Γκόντζος ήταν…", emoji: "🧠", type: "topic" },
  { id: "trilimmata", name: "Τριλήμματα", emoji: "🔀", type: "topic" },
  { id: "milai-o-laos", name: "Μιλάει ο Λαός", emoji: "📣", type: "topic" },
  { id: "mousante", name: "Μουσαντέ", emoji: "🤙", type: "topic" },
  { id: "paralirimata", name: "Παραληρήματα", emoji: "🔥", type: "topic" },
];

async function scrapeTopic(slug) {
  const html = await get(`https://fightclub.gr/topic/${slug}`);
  return [...html.matchAll(/<div class="message"[^>]*>([\s\S]*?)<\/div>/gi)]
    .map((m) => decode(m[1]))
    .filter((t) => t.length > 3)
    .slice(0, 60)
    .map((text) => ({ text }));
}

async function scrapeGlossary() {
  const url =
    "https://fightclub.gr/wp-admin/admin-ajax.php?action=alm_get_posts&query_type=standard&post_type=glossary&posts_per_page=1000&page=0&repeater=template_1&nonce=735ca1704b";
  let json = {};
  try { json = JSON.parse(await get(url)); } catch {}
  const html = json.html || "";
  return [...html.matchAll(/<span class="leksiko_title">([\s\S]*?)<\/span>([\s\S]*?)(?=<span class="leksiko_title">|<\/div>\s*<div class="leksiko">|$)/gi)]
    .map((m) => ({ term: decode(m[1]), def: decode(m[2]) }))
    .filter((e) => e.term && e.def);
}

(async () => {
  const out = [];
  for (const t of TOPICS) {
    const entries = t.type === "glossary" ? await scrapeGlossary() : await scrapeTopic(t.id);
    out.push({ id: t.id, name: t.name, emoji: t.emoji, type: t.type, count: entries.length, entries });
    process.stderr.write(`  ${t.name}: ${entries.length}\n`);
  }
  fs.writeFileSync(OUT, JSON.stringify(out, null, 2));
  console.log(`legacy: ${out.length} segments, ${out.reduce((n, s) => n + s.count, 0)} entries`);
})();

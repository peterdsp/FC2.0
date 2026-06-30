/**
 * archive-extra.cjs — curated historic episodes that predate the show's own
 * on-demand archive (fightclub.gr only goes back to 2018). These landmark
 * full episodes / specials survive only as scattered fan uploads on YouTube,
 * so they can't be scraped systematically — they're hand-verified here (video
 * id + real date) and merged into the catalog. fc-api streams them via YouTube.
 *
 * Add more as they're found:  { date, title, youtube, note? }
 *
 *   node archive-extra.cjs        # merge into data/episodes.json (idempotent)
 */
const fs = require("fs");
const path = require("path");
const { eraForDate } = require("./eras.js");

const OUT = path.join(__dirname, "data", "episodes.json");

// Verified historic episodes (date = the episode's actual broadcast date).
const EXTRA = [
  { date: "2001-10-29", title: "Η Πρώτη Εκπομπή", youtube: "GZuhKN0IQ54",
    note: "Η ιστορική πρεμιέρα, 29 Οκτωβρίου 2001 στην ΕΡΑ Σπορ." },
  { date: "2007-07-20", title: "Αφιέρωμα στον Στρατό", youtube: "i8p5kmgCJf4",
    note: "Θεματική εκπομπή-αφιέρωμα, 20 Ιουλίου 2007." },
  { date: "2013-07-19", title: "Η τελευταία εκπομπή (πριν το διάλειμμα)", youtube: "Pmy2-Wruh8w",
    note: "Η εκπομπή πριν το προσωρινό «σπάσιμο» του διδύμου." },
  { date: "2016-06-08", title: "The Reunion — Ολόκληρη η εκπομπή", youtube: "p8P8KYbDqFo",
    note: "Το reunion για τα 20 χρόνια του σταθμού." },
  { date: "2016-09-05", title: "Πρεμιέρα σεζόν 2016/17", youtube: "J9UOt5oT8hg",
    note: "Η πρεμιέρα της επίσημης επανένωσης, Σεπτέμβριος 2016." },
];

function toEpisode(x) {
  return {
    id: `ep-${x.date}-historic`,
    title: x.title,
    date: x.date,
    year: x.date.slice(0, 4),
    month: x.date.slice(0, 7),
    era: eraForDate(x.date),
    category: "Ιστορικό αρχείο",
    image: null,
    source: `https://www.youtube.com/watch?v=${x.youtube}`,
    mixcloud: null,
    youtube: x.youtube,
    file: null,
    tags: ["ιστορικό"],
    description: x.note || "",
    plays: 0,
    special: true,
  };
}

let eps = [];
try { eps = JSON.parse(fs.readFileSync(OUT, "utf8")); } catch {}
const byId = new Map(eps.map((e) => [e.id, e]));

let added = 0, updated = 0;
for (const x of EXTRA) {
  const ep = toEpisode(x);
  if (byId.has(ep.id)) {
    // refresh metadata but keep any downloaded file / plays
    const old = byId.get(ep.id);
    Object.assign(old, ep, { file: old.file || null, plays: old.plays || 0 });
    updated++;
  } else {
    eps.push(ep);
    added++;
  }
}

eps.sort((a, b) => (a.date < b.date ? 1 : -1));
fs.writeFileSync(OUT, JSON.stringify(eps, null, 2));
console.log(`historic merge: +${added} added, ${updated} updated → ${eps.length} total (oldest ${eps[eps.length - 1]?.date})`);

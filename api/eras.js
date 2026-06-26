/**
 * eras.js, classify an episode date into a sporting "era" so the archive can be
 * browsed by big events (Euro, World Cup, Champions/Europa League finals, etc.)
 * in addition to year/month. Shared by fc-api and the apps.
 *
 * Each era has a label, an emoji, and one or more [start, end] ISO date ranges.
 */
export const ERAS = [
  { id: "euro-2004", label: "Euro 2004", emoji: "🇬🇷", ranges: [["2004-06-12", "2004-07-04"]] },
  { id: "euro-2008", label: "Euro 2008", emoji: "🏆", ranges: [["2008-06-07", "2008-06-29"]] },
  { id: "euro-2012", label: "Euro 2012", emoji: "🏆", ranges: [["2012-06-08", "2012-07-01"]] },
  { id: "euro-2016", label: "Euro 2016", emoji: "🏆", ranges: [["2016-06-10", "2016-07-10"]] },
  { id: "euro-2020", label: "Euro 2020", emoji: "🏆", ranges: [["2021-06-11", "2021-07-11"]] },
  { id: "euro-2024", label: "Euro 2024", emoji: "🏆", ranges: [["2024-06-14", "2024-07-14"]] },
  { id: "wc-2006", label: "World Cup 2006", emoji: "🌍", ranges: [["2006-06-09", "2006-07-09"]] },
  { id: "wc-2010", label: "World Cup 2010", emoji: "🌍", ranges: [["2010-06-11", "2010-07-11"]] },
  { id: "wc-2014", label: "World Cup 2014", emoji: "🌍", ranges: [["2014-06-12", "2014-07-13"]] },
  { id: "wc-2018", label: "World Cup 2018", emoji: "🌍", ranges: [["2018-06-14", "2018-07-15"]] },
  { id: "wc-2022", label: "World Cup 2022", emoji: "🌍", ranges: [["2022-11-20", "2022-12-18"]] },
  { id: "wc-2026", label: "World Cup 2026", emoji: "🌍", ranges: [["2026-06-11", "2026-07-19"]] },
];

/** Return the matching era object for an ISO date string, or null. */
export function eraForDate(iso) {
  if (!iso) return null;
  for (const e of ERAS) {
    for (const [s, end] of e.ranges) {
      if (iso >= s && iso <= end) return { id: e.id, label: e.label, emoji: e.emoji };
    }
  }
  return null;
}

/** Group a list of episodes by era id (only eras that actually have episodes). */
export function groupByEra(episodes) {
  const out = {};
  for (const ep of episodes) {
    const e = ep.era || eraForDate(ep.date);
    if (!e) continue;
    (out[e.id] ||= { ...e, episodes: [] }).episodes.push(ep);
  }
  return out;
}

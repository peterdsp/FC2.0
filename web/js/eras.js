/**
 * eras.js (browser), classify an episode date into a sporting "era" so the
 * archive can be browsed by big events (Euro, World Cup, Champions / Europa /
 * Conference League knockouts) in addition to by year.
 *
 * This mirrors api/eras.js so the apps can light up the tournament menus from a
 * date alone — no need to wait for the backend to re-bake `ep.era`. Keep the two
 * files in sync when adding editions. A single date can match several eras
 * (the three club competitions overlap their spring knockout windows), so
 * `erasForDate` returns every match.
 */

export const COMPETITIONS = {
  euro: { id: "euro", label: "Euro", emoji: "🏆", order: 1 },
  wc: { id: "wc", label: "Μουντιάλ", emoji: "🌍", order: 2 },
  ucl: { id: "ucl", label: "Champions League", emoji: "⭐", order: 3 },
  uel: { id: "uel", label: "Europa League", emoji: "🟠", order: 4 },
  uecl: { id: "uecl", label: "Conference League", emoji: "🟢", order: 5 },
};

export const ERAS = [
  { id: "euro-2004", label: "Euro 2004", short: "2004", emoji: "🇬🇷", comp: "euro", ranges: [["2004-06-12", "2004-07-04"]] },
  { id: "euro-2008", label: "Euro 2008", short: "2008", emoji: "🏆", comp: "euro", ranges: [["2008-06-07", "2008-06-29"]] },
  { id: "euro-2012", label: "Euro 2012", short: "2012", emoji: "🏆", comp: "euro", ranges: [["2012-06-08", "2012-07-01"]] },
  { id: "euro-2016", label: "Euro 2016", short: "2016", emoji: "🏆", comp: "euro", ranges: [["2016-06-10", "2016-07-10"]] },
  { id: "euro-2020", label: "Euro 2020", short: "2020", emoji: "🏆", comp: "euro", ranges: [["2021-06-11", "2021-07-11"]] },
  { id: "euro-2024", label: "Euro 2024", short: "2024", emoji: "🏆", comp: "euro", ranges: [["2024-06-14", "2024-07-14"]] },
  { id: "euro-2028", label: "Euro 2028", short: "2028", emoji: "🏆", comp: "euro", ranges: [["2028-06-09", "2028-07-09"]] },

  { id: "wc-2002", label: "World Cup 2002", short: "2002", emoji: "🌍", comp: "wc", ranges: [["2002-05-31", "2002-06-30"]] },
  { id: "wc-2006", label: "World Cup 2006", short: "2006", emoji: "🌍", comp: "wc", ranges: [["2006-06-09", "2006-07-09"]] },
  { id: "wc-2010", label: "World Cup 2010", short: "2010", emoji: "🌍", comp: "wc", ranges: [["2010-06-11", "2010-07-11"]] },
  { id: "wc-2014", label: "World Cup 2014", short: "2014", emoji: "🌍", comp: "wc", ranges: [["2014-06-12", "2014-07-13"]] },
  { id: "wc-2018", label: "World Cup 2018", short: "2018", emoji: "🌍", comp: "wc", ranges: [["2018-06-14", "2018-07-15"]] },
  { id: "wc-2022", label: "World Cup 2022", short: "2022", emoji: "🌍", comp: "wc", ranges: [["2022-11-20", "2022-12-18"]] },
  { id: "wc-2026", label: "World Cup 2026", short: "2026", emoji: "🌍", comp: "wc", ranges: [["2026-06-11", "2026-07-19"]] },

  { id: "ucl-2020", label: "Champions League 2019/20", short: "2019/20", emoji: "⭐", comp: "ucl", ranges: [["2020-02-18", "2020-08-23"]] },
  { id: "ucl-2021", label: "Champions League 2020/21", short: "2020/21", emoji: "⭐", comp: "ucl", ranges: [["2021-02-16", "2021-05-29"]] },
  { id: "ucl-2022", label: "Champions League 2021/22", short: "2021/22", emoji: "⭐", comp: "ucl", ranges: [["2022-02-15", "2022-05-28"]] },
  { id: "ucl-2023", label: "Champions League 2022/23", short: "2022/23", emoji: "⭐", comp: "ucl", ranges: [["2023-02-14", "2023-06-10"]] },
  { id: "ucl-2024", label: "Champions League 2023/24", short: "2023/24", emoji: "⭐", comp: "ucl", ranges: [["2024-02-13", "2024-06-01"]] },
  { id: "ucl-2025", label: "Champions League 2024/25", short: "2024/25", emoji: "⭐", comp: "ucl", ranges: [["2025-02-11", "2025-05-31"]] },
  { id: "ucl-2026", label: "Champions League 2025/26", short: "2025/26", emoji: "⭐", comp: "ucl", ranges: [["2026-02-17", "2026-05-30"]] },

  { id: "uel-2020", label: "Europa League 2019/20", short: "2019/20", emoji: "🟠", comp: "uel", ranges: [["2020-02-20", "2020-08-21"]] },
  { id: "uel-2021", label: "Europa League 2020/21", short: "2020/21", emoji: "🟠", comp: "uel", ranges: [["2021-02-18", "2021-05-26"]] },
  { id: "uel-2022", label: "Europa League 2021/22", short: "2021/22", emoji: "🟠", comp: "uel", ranges: [["2022-02-17", "2022-05-18"]] },
  { id: "uel-2023", label: "Europa League 2022/23", short: "2022/23", emoji: "🟠", comp: "uel", ranges: [["2023-02-16", "2023-05-31"]] },
  { id: "uel-2024", label: "Europa League 2023/24", short: "2023/24", emoji: "🟠", comp: "uel", ranges: [["2024-02-15", "2024-05-22"]] },
  { id: "uel-2025", label: "Europa League 2024/25", short: "2024/25", emoji: "🟠", comp: "uel", ranges: [["2025-02-13", "2025-05-21"]] },
  { id: "uel-2026", label: "Europa League 2025/26", short: "2025/26", emoji: "🟠", comp: "uel", ranges: [["2026-02-19", "2026-05-20"]] },

  { id: "uecl-2022", label: "Conference League 2021/22", short: "2021/22", emoji: "🟢", comp: "uecl", ranges: [["2022-02-17", "2022-05-25"]] },
  { id: "uecl-2023", label: "Conference League 2022/23", short: "2022/23", emoji: "🟢", comp: "uecl", ranges: [["2023-02-16", "2023-06-07"]] },
  { id: "uecl-2024", label: "Conference League 2023/24", short: "2023/24", emoji: "🟢", comp: "uecl", ranges: [["2024-02-15", "2024-05-29"]] },
  { id: "uecl-2025", label: "Conference League 2024/25", short: "2024/25", emoji: "🟢", comp: "uecl", ranges: [["2025-02-13", "2025-05-28"]] },
  { id: "uecl-2026", label: "Conference League 2025/26", short: "2025/26", emoji: "🟢", comp: "uecl", ranges: [["2026-02-19", "2026-05-27"]] },
];

const inEra = (iso, era) => era.ranges.some(([s, end]) => iso >= s && iso <= end);
const pub = (e) => ({ id: e.id, label: e.label, short: e.short, emoji: e.emoji, comp: e.comp });

/** Return every era an ISO date falls in (a date can match several). */
export function erasForDate(iso) {
  return iso ? ERAS.filter((e) => inEra(iso, e)).map(pub) : [];
}

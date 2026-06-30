/**
 * schedule.js, the bwinΣΠΟΡ FM 94.6 daily program (weekday grid) and a helper
 * to compute the show currently on air (Europe/Athens time).
 *
 * Schedule belongs to bwinΣΠΟΡ FM 94.6; reproduced here only to show listeners
 * what is on air. Times are [startMinutes, endMinutes] from midnight.
 */
export const SCHEDULE = [
  { start: 360, end: 480, title: "Η ΚΑΛΗ ΜΕΡΑ ΑΠΟ ΤΗΝ ΜΠΑΛΑ ΦΑΙΝΕΤΑΙ" },
  { start: 480, end: 600, title: "ΟΙ ΑΠΟ ΕΔΩ ΤΟΥΣ ΑΠΟ ΕΚΕΙ" },
  { start: 600, end: 690, title: "ΠΡΕΣΑΡΙΣΜΑ" },
  { start: 690, end: 840, title: "ΕΠΙΘΕΣΗ ΑΠΟ ΤΑ ΜΠΑΚ" },
  { start: 840, end: 960, title: "ΜΠΑΜ ΚΑΙ ΚΑΤΩ" },
  { start: 960, end: 1080, title: "ΡΕΠΟΡΤΕΡ" },
  { start: 1080, end: 1200, title: "ΔΥΟ ΛΕΡΕΣ ΜΟΝΟ" },
  { start: 1200, end: 1320, title: "NEWSROOM" },
  { start: 1320, end: 1440, title: "ΡΑΜΑΓΙΑ", flagship: true },
  { start: 0, end: 120, title: "AFTER... ΡΑΔΙΟ" },
  { start: 120, end: 360, title: "ΗΧΟΓΡΑΦΗΜΕΝΗ ΕΚΠΟΜΠΗ" },
];

/** Minutes since midnight in Athens. */
function athensMinutes(d = new Date()) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Athens",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(d);
  const h = +parts.find((p) => p.type === "hour").value % 24;
  const m = +parts.find((p) => p.type === "minute").value;
  return h * 60 + m;
}

/** The slot on air right now, plus the next one. */
export function currentShow(now = new Date()) {
  const mins = athensMinutes(now);
  const slot = SCHEDULE.find((s) => mins >= s.start && mins < s.end) || null;
  // next slot by start time after `mins` (wrapping past midnight)
  const sorted = [...SCHEDULE].sort((a, b) => a.start - b.start);
  const next = sorted.find((s) => s.start > mins) || sorted[0];
  return slot
    ? { title: slot.title, flagship: !!slot.flagship, nextTitle: next?.title || null }
    : { title: null, flagship: false, nextTitle: next?.title || null };
}

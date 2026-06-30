/**
 * schedule.js, the daily program (weekday grid) + the show currently on air
 * (Europe/Athens). The schedule belongs to the station; shown only so
 * listeners know what is playing.
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

function athensMinutes(d = new Date()) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Athens", hour: "2-digit", minute: "2-digit", hour12: false,
  }).formatToParts(d);
  const h = +parts.find((p) => p.type === "hour").value % 24;
  const m = +parts.find((p) => p.type === "minute").value;
  return h * 60 + m;
}

export function currentShow(now = new Date()) {
  const mins = athensMinutes(now);
  const slot = SCHEDULE.find((s) => mins >= s.start && mins < s.end) || null;
  const sorted = [...SCHEDULE].sort((a, b) => a.start - b.start);
  const next = sorted.find((s) => s.start > mins) || sorted[0];
  return {
    title: slot ? slot.title : null,
    flagship: slot ? !!slot.flagship : false,
    nextTitle: next ? next.title : null,
  };
}

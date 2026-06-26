/**
 * Sticker reactions, a little burst of FC personality when you do something:
 * finish a quiz, open an episode, read a segment. Uses emoji + the show's own
 * catchphrases (no copyrighted artwork is redistributed).
 */
const PACKS = {
  win: [
    { e: "🥊", t: "Knockout!" },
    { e: "🏆", t: "Καζαμίας!" },
    { e: "🧠", t: "Γκόντζος energy" },
    { e: "🔥", t: "Φωτιά!" },
  ],
  ok: [
    { e: "🐡", t: "Λαγοκέφαλος approved" },
    { e: "🤙", t: "Μουσαντέ" },
    { e: "💬", t: "Μιλάει ο λαός" },
  ],
  read: [
    { e: "🎙️", t: "Μεγάλη αλήθεια" },
    { e: "📖", t: "Φαϊτκλαμποελληνικά" },
    { e: "🤔", t: "Τρίλημμα..." },
  ],
};

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

/** kind: 'win' | 'ok' | 'read' */
export function popSticker(kind = "ok") {
  const s = pick(PACKS[kind] || PACKS.ok);
  const el = document.createElement("div");
  el.className = "sticker glass glass-strong";
  el.innerHTML = `<span class="st-e">${s.e}</span><span class="st-t">${s.t}</span>`;
  document.body.appendChild(el);
  // start near bottom-center, drift up + fade
  el.animate(
    [
      { transform: "translate(-50%, 30px) scale(.7)", opacity: 0 },
      { transform: "translate(-50%, 0) scale(1)", opacity: 1, offset: 0.18 },
      { transform: "translate(-50%, -10px) scale(1)", opacity: 1, offset: 0.72 },
      { transform: "translate(-50%, -46px) scale(.96)", opacity: 0 },
    ],
    { duration: 1900, easing: "cubic-bezier(.2,.8,.2,1)" }
  ).onfinish = () => el.remove();
}

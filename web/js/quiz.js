/**
 * Quiz player, modal-driven, timed, with instant feedback + celebration.
 * Scoring: base 10 XP per correct answer + up to 10 speed bonus (faster = more).
 */
import { recordQuiz, touchStreak, markDailyDone } from "./gamification.js";
import { toast, confettiBurst } from "./ui.js";
import { popSticker } from "./stickers.js";

const QUESTION_SECONDS = 15;

let active = null;

export function openQuiz(pack, { onClose } = {}) {
  active = {
    pack,
    i: 0,
    correct: 0,
    xp: 0,
    locked: false,
    timer: null,
    timeLeft: QUESTION_SECONDS,
    onClose,
  };
  touchStreak();
  buildShell();
  renderQuestion();
  scrim().classList.add("open");
}

function scrim() {
  return document.getElementById("quizScrim");
}

function buildShell() {
  let s = scrim();
  if (!s) {
    s = document.createElement("div");
    s.className = "modal-scrim";
    s.id = "quizScrim";
    s.innerHTML = `<div class="glass glass-strong lg-refract modal" id="quizModal"></div>`;
    document.body.appendChild(s);
    s.addEventListener("click", (e) => {
      if (e.target === s) closeQuiz();
    });
  }
}

function renderQuestion() {
  const { pack, i } = active;
  const q = pack.questions[i];
  const total = pack.questions.length;
  active.locked = false;
  active.timeLeft = QUESTION_SECONDS;

  const dots = pack.questions
    .map((_, idx) => `<span class="${idx < i ? "done" : idx === i ? "cur" : ""}"></span>`)
    .join("");

  document.getElementById("quizModal").innerHTML = `
    <div class="q-head">
      <div class="q-progress">${dots}</div>
      <div class="q-timer" id="qTimer">${QUESTION_SECONDS}s</div>
    </div>
    <div class="glass-pill" style="margin-bottom:14px">${pack.emoji} ${pack.name} · ${i + 1}/${total}</div>
    <div class="q-text">${q.q}</div>
    <div class="answers" id="answers">
      ${q.a
        .map((ans, idx) => `<button class="answer" data-idx="${idx}">${ans}</button>`)
        .join("")}
    </div>
    <div class="q-fact" id="qFact"></div>
  `;

  document.querySelectorAll("#answers .answer").forEach((btn) => {
    btn.addEventListener("click", () => answer(parseInt(btn.dataset.idx, 10)));
  });

  startTimer();
}

function startTimer() {
  clearInterval(active.timer);
  const el = document.getElementById("qTimer");
  active.timer = setInterval(() => {
    active.timeLeft -= 1;
    if (el) el.textContent = active.timeLeft + "s";
    if (active.timeLeft <= 0) {
      clearInterval(active.timer);
      if (!active.locked) answer(-1); // time out = wrong
    }
  }, 1000);
}

function answer(idx) {
  if (active.locked) return;
  active.locked = true;
  clearInterval(active.timer);

  const q = active.pack.questions[active.i];
  const correct = idx === q.correct;
  const btns = document.querySelectorAll("#answers .answer");
  btns.forEach((b) => (b.disabled = true));

  if (idx >= 0) btns[idx].classList.add(correct ? "correct" : "wrong");
  btns[q.correct].classList.add("correct");

  if (correct) {
    active.correct += 1;
    const speedBonus = Math.round((active.timeLeft / QUESTION_SECONDS) * 10);
    active.xp += 10 + speedBonus;
    confettiBurst();
  }

  const fact = document.getElementById("qFact");
  fact.textContent = "💡 " + q.fact;
  fact.classList.add("show");

  setTimeout(() => {
    active.i += 1;
    if (active.i < active.pack.questions.length) renderQuestion();
    else finish();
  }, 1700);
}

function finish() {
  const { pack, correct, xp } = active;
  const total = pack.questions.length;
  const result = recordQuiz(pack.id, correct, total, xp);
  markDailyDone();

  const perfect = correct === total;
  const emoji = perfect ? "🏆" : correct >= total / 2 ? "🔥" : "💪";
  const headline = perfect
    ? "ΤΕΛΕΙΟ! Γκόντζος Energy!"
    : correct >= total / 2
    ? "Δυνατά! Συνέχισε έτσι."
    : "Καλή αρχή, ξαναπροσπάθησε!";

  document.getElementById("quizModal").innerHTML = `
    <div class="result">
      <div class="big">${emoji}</div>
      <h2>${headline}</h2>
      <div class="score">${correct}/${total} σωστά</div>
      <div class="xp-gain">+${xp} XP</div>
      ${result.leveledUp ? `<div class="glass-pill" style="margin:0 auto 18px">⬆️ Ανέβηκες Level ${result.level}!</div>` : ""}
      <div class="cta-row" style="justify-content:center; display:flex; gap:12px; flex-wrap:wrap">
        <button class="glass-btn glass-btn--primary" id="qRetry">Ξανά</button>
        <button class="glass-btn" id="qDone">Τέλος</button>
      </div>
    </div>
  `;
  if (perfect) confettiBurst(60);
  popSticker(correct >= total / 2 ? "win" : "ok");
  toast(`+${xp} XP 🎯`);

  document.getElementById("qRetry").addEventListener("click", () =>
    openQuiz(pack, { onClose: active.onClose })
  );
  document.getElementById("qDone").addEventListener("click", closeQuiz);
}

export function closeQuiz() {
  clearInterval(active?.timer);
  scrim()?.classList.remove("open");
  active?.onClose?.();
}

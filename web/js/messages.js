/**
 * Messages.
 * Two clearly separate things, so nobody is misled:
 *  1) LIVE on-air: messages that actually reach the show go through the
 *     OFFICIAL bwinΣΠΟΡ FM 94.6 widget (live24). We embed that widget, so the
 *     user submits through the real system. Only open during the show, 22:00-00:00.
 *  2) FC2.0 wall: our own community wall (fc-api /messages). NOT on-air.
 *
 * Posting straight into the station's live system from an unofficial app would
 * break their terms and risks spam, so we route on-air messages through their
 * own widget instead of faking it.
 */
import { SHOW } from "./data.js";
import { currentShow } from "./schedule.js";
import { toast } from "./ui.js";

const OFFICIAL_WIDGET = "https://live24.gr/radio/sportfm.jsp";
const LS = "fc2_messages_v1";
const load = () => { try { return JSON.parse(localStorage.getItem(LS)) || []; } catch { return []; } };
const save = (m) => localStorage.setItem(LS, JSON.stringify(m.slice(-50)));
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

const isShowLive = () => currentShow().flagship; // FIGHT CLUB slot = 22:00-00:00

export function initMessages() {
  const root = document.getElementById("messages");
  if (!root) return;
  const live = isShowLive();

  root.innerHTML = `
    <div class="glass lg-refract msg-box">
      <div class="msg-live ${live ? "on" : "off"}">
        ${live
          ? `<span class="live-dot"></span> <b>Η εκπομπή παίζει τώρα.</b> Στείλε μήνυμα που θα ακουστεί on-air.
             <button class="glass-btn glass-btn--primary msg-live-btn" id="msgLiveBtn">📻 Live μήνυμα στην εκπομπή</button>`
          : `🕙 Τα live μηνύματα προς την εκπομπή ανοίγουν <b>22:00-00:00</b> (ώρα Fight Club).`}
      </div>
      <div class="msg-wall-label">Τοίχος FC2.0 <span>· κοινότητα, όχι on-air</span></div>
      <div class="msg-list" id="msgList"></div>
      <form class="msg-form" id="msgForm" autocomplete="off">
        <input id="msgName" class="msg-input" maxlength="40" placeholder="Όνομα / ψευδώνυμο" />
        <div class="msg-row">
          <input id="msgText" class="msg-input" maxlength="280"
                 placeholder="${live ? "Γράψε στον τοίχο της κοινότητας..." : "Άνοιξε 22:00-00:00 για μηνύματα..."}"
                 ${live ? "" : "disabled"} />
          <button class="msg-send" type="submit" aria-label="Αποστολή" ${live ? "" : "disabled"}>➤</button>
        </div>
      </form>
    </div>`;

  const list = document.getElementById("msgList");
  const render = (msgs) => {
    list.innerHTML = msgs.length
      ? msgs.slice(-30).reverse().map((m) => `<div class="msg"><b>${esc(m.name)}</b><span>${esc(m.text)}</span></div>`).join("")
      : `<div class="msg-empty">Άδειος τοίχος. Γράψε κάτι 💬</div>`;
  };
  render(load());

  fetch(`${SHOW.apiBase}/messages`).then((r) => r.ok && r.json()).then((m) => {
    if (Array.isArray(m) && m.length) { save(m); render(m); }
  }).catch(() => {});

  document.getElementById("msgLiveBtn")?.addEventListener("click", openLiveWidget);

  document.getElementById("msgForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!isShowLive()) { toast("Ανοίγει 22:00-00:00"); return; }
    const name = document.getElementById("msgName").value.trim() || "Ανώνυμος";
    const textEl = document.getElementById("msgText");
    const text = textEl.value.trim();
    if (!text) return;
    const msg = { id: Date.now().toString(36), name, text, at: new Date().toISOString() };
    const msgs = load(); msgs.push(msg); save(msgs); render(msgs);
    textEl.value = "";
    toast("Στάλθηκε στον τοίχο 💬");
    try {
      await fetch(`${SHOW.apiBase}/messages`, {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ name, text }),
      });
    } catch {}
  });
}

/** Open the official station widget in a modal so messages land in the real system. */
function openLiveWidget() {
  let scrim = document.getElementById("liveMsgScrim");
  if (!scrim) {
    scrim = document.createElement("div");
    scrim.id = "liveMsgScrim";
    scrim.className = "modal-scrim";
    scrim.innerHTML = `
      <div class="glass glass-strong lg-refract modal" style="width:min(440px,100%);padding:18px">
        <div class="q-head" style="margin-bottom:12px">
          <b>📻 Live μήνυμα · bwinΣΠΟΡ FM 94.6</b>
          <button class="glass-pill" id="liveMsgClose" style="cursor:pointer">✕</button>
        </div>
        <p style="font-size:13px;color:var(--ink-dim);margin-bottom:12px">Επίσημο widget του σταθμού. Το μήνυμά σου πάει απευθείας στην εκπομπή.</p>
        <iframe src="${OFFICIAL_WIDGET}" style="width:100%;height:460px;border:0;border-radius:12px;background:#fff" loading="lazy"></iframe>
      </div>`;
    document.body.appendChild(scrim);
    scrim.addEventListener("click", (e) => { if (e.target === scrim) scrim.classList.remove("open"); });
    scrim.querySelector("#liveMsgClose").addEventListener("click", () => scrim.classList.remove("open"));
  }
  scrim.classList.add("open");
}

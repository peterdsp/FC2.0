/**
 * Messages — only available while the FIGHT CLUB show is on air (22:00-00:00,
 * Europe/Athens). Outside that window the whole component is closed.
 *
 * One input. When the listener sends:
 *  1) ON-AIR: the message is relayed to the official bwinΣΠΟΡ FM 94.6 system via
 *     fc-api (POST /onair-message), which replays the station's own live24
 *     Hermes call server-side. So it lands live, exactly like
 *     sport-fm.gr/radio/player — without the user touching a second widget.
 *  2) PRIVATE LOG: the same message is kept only in THIS browser (localStorage),
 *     visible only to its author. There is no shared/community wall.
 *
 * If the relay is unavailable (e.g. fc-api offline), we fall back to opening the
 * station's official widget so the message can still be sent by hand.
 */
import { SHOW } from "./data.js";
import { currentShow } from "./schedule.js";
import { toast } from "./ui.js";

const OFFICIAL_WIDGET =
  "https://live24.gr/radio/sportfm.jsp?ref=sportfm&type=iframe&v4=minisite&noplayer=true";

const LS = "fc2_messages_v1";
const load = () => { try { return JSON.parse(localStorage.getItem(LS)) || []; } catch { return []; } };
const save = (m) => localStorage.setItem(LS, JSON.stringify(m.slice(-50)));
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

const isShowLive = () => currentShow().flagship; // FIGHT CLUB slot = 22:00-00:00

export function initMessages() {
  const root = document.getElementById("messages");
  if (!root) return;

  // Closed outside show hours — the entire component is unavailable.
  if (!isShowLive()) {
    root.innerHTML = `
      <div class="glass lg-refract msg-box">
        <div class="msg-live off">
          🕙 Τα μηνύματα προς την εκπομπή είναι ανοιχτά <b>μόνο live</b>, 22:00-00:00 (ώρα Fight Club).
          Γύρνα όταν παίζει η εκπομπή για να στείλεις on-air.
        </div>
      </div>`;
    scheduleReopen(root);
    return;
  }

  root.innerHTML = `
    <div class="glass lg-refract msg-box">
      <div class="msg-live on">
        <span class="live-dot"></span> <b>Η εκπομπή παίζει τώρα.</b>
        Στείλε μήνυμα — πάει on-air στο bwinΣΠΟΡ FM 94.6.
      </div>

      <div class="msg-private-label">🔒 Τα μηνύματά σου <span>· on-air στην εκπομπή + ιδιωτικό αρχείο σε αυτή τη συσκευή</span></div>
      <div class="msg-list" id="msgList"></div>
      <form class="msg-form" id="msgForm" autocomplete="off">
        <input id="msgName" class="msg-input" maxlength="40" placeholder="Όνομα / ψευδώνυμο" />
        <div class="msg-row">
          <input id="msgText" class="msg-input" maxlength="200" placeholder="Γράψε το μήνυμά σου για on-air..." />
          <button class="msg-send" type="submit" aria-label="Αποστολή on-air">➤</button>
        </div>
      </form>
    </div>`;

  const list = document.getElementById("msgList");
  const render = (msgs) => {
    list.innerHTML = msgs.length
      ? msgs.slice(-30).reverse().map((m) =>
          `<div class="msg${m.onair === false ? " msg--pending" : ""}"><b>${esc(m.name)}</b><span>${esc(m.text)}</span>${
            m.onair === false ? `<em class="msg-flag">δεν στάλθηκε on-air</em>` : ""
          }</div>`).join("")
      : `<div class="msg-empty">Κανένα μήνυμα ακόμη. Στείλε το πρώτο 💬</div>`;
  };
  render(load());

  const form = document.getElementById("msgForm");
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!isShowLive()) { toast("Ανοίγει 22:00-00:00"); return; }
    const name = document.getElementById("msgName").value.trim() || "Ανώνυμος";
    const textEl = document.getElementById("msgText");
    const text = textEl.value.trim();
    if (!text) return;

    const btn = form.querySelector(".msg-send");
    btn.disabled = true;
    let onair = false;
    try {
      const r = await fetch(`${SHOW.apiBase}/onair-message`, {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ name, text }),
      });
      onair = r.ok && (await r.json().catch(() => ({}))).ok === true;
    } catch { onair = false; }
    btn.disabled = false;

    // Record privately regardless (author-only, this device).
    const msgs = load();
    msgs.push({ id: Date.now().toString(36), name, text, at: new Date().toISOString(), onair });
    save(msgs);
    render(msgs);
    textEl.value = "";

    if (onair) {
      toast("📻 Στάλθηκε on-air!");
    } else {
      toast("Δεν έφυγε on-air — άνοιξε το επίσημο widget");
      openOfficialWidget(name, text);
    }
  });

  scheduleReopen(root);
}

/** Fallback: open the station's official widget so the user can send by hand. */
function openOfficialWidget(name, text) {
  let scrim = document.getElementById("liveMsgScrim");
  if (!scrim) {
    scrim = document.createElement("div");
    scrim.id = "liveMsgScrim";
    scrim.className = "modal-scrim";
    scrim.innerHTML = `
      <div class="glass glass-strong lg-refract modal" style="width:min(440px,100%);padding:18px">
        <div class="q-head" style="margin-bottom:12px">
          <b>📻 Στείλε on-air · bwinΣΠΟΡ FM 94.6</b>
          <button class="glass-pill" id="liveMsgClose" style="cursor:pointer">✕</button>
        </div>
        <p style="font-size:13px;color:var(--ink-dim);margin-bottom:12px">Το αυτόματο on-air δεν ήταν διαθέσιμο. Στείλε το μήνυμά σου από το επίσημο widget του σταθμού.</p>
        <iframe src="${OFFICIAL_WIDGET}" style="width:100%;height:460px;border:0;border-radius:12px;background:#fff" loading="lazy"></iframe>
      </div>`;
    document.body.appendChild(scrim);
    scrim.addEventListener("click", (e) => { if (e.target === scrim) scrim.classList.remove("open"); });
    scrim.querySelector("#liveMsgClose").addEventListener("click", () => scrim.classList.remove("open"));
  }
  scrim.classList.add("open");
}

/** Re-render when the show opens/closes so the component flips itself live. */
let reopenTimer = null;
function scheduleReopen(root) {
  clearTimeout(reopenTimer);
  reopenTimer = setTimeout(() => { if (document.body.contains(root)) initMessages(); }, 60_000);
}

/**
 * Messages — only available while the FIGHT CLUB show is on air (22:00-00:00,
 * Europe/Athens). Outside that window the whole component is closed.
 *
 * Two clearly separate things, so nobody is misled:
 *  1) ON-AIR: the box that actually reaches the show is the OFFICIAL bwinΣΠΟΡ
 *     FM 94.6 widget (live24), embedded inline below. The user types there and
 *     the message lands live in the station's real system, exactly like
 *     sport-fm.gr/radio/player. We embed their widget instead of POSTing into
 *     their backend ourselves — doing the latter from an unofficial app would
 *     break their terms and invite spam.
 *  2) PRIVATE LOG: an optional personal note kept only in THIS browser
 *     (localStorage). It is visible only to the person who wrote it — there is
 *     no shared/community wall, nothing is sent to a server.
 *
 * The live24 widget runs on live24.gr's own origin inside the iframe, so we
 * cannot read or pre-fill it (cross-origin) — that is why the two inputs stay
 * separate rather than mirroring each other.
 */
import { currentShow } from "./schedule.js";
import { toast } from "./ui.js";

// Official station messages widget (minisite = just the message box, no player).
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
        Γράψε στο επίσημο πλαίσιο και το μήνυμά σου ακούγεται on-air.
      </div>

      <div class="msg-widget-label">📻 On-air · επίσημο widget bwinΣΠΟΡ FM 94.6</div>
      <iframe class="msg-widget" src="${OFFICIAL_WIDGET}" title="Μήνυμα στην εκπομπή — bwinΣΠΟΡ FM 94.6"
              loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>
      <p class="msg-widget-note">Το μήνυμα πάει απευθείας στο σύστημα του σταθμού, όπως στο sport-fm.gr/radio/player.</p>

      <div class="msg-private-label">🔒 Το σημειωματάριό σου <span>· μόνο εσύ το βλέπεις, μένει σε αυτή τη συσκευή</span></div>
      <div class="msg-list" id="msgList"></div>
      <form class="msg-form" id="msgForm" autocomplete="off">
        <input id="msgName" class="msg-input" maxlength="40" placeholder="Όνομα / ψευδώνυμο" />
        <div class="msg-row">
          <input id="msgText" class="msg-input" maxlength="280" placeholder="Κράτα το μήνυμά σου εδώ..." />
          <button class="msg-send" type="submit" aria-label="Αποθήκευση">➤</button>
        </div>
      </form>
    </div>`;

  const list = document.getElementById("msgList");
  const render = (msgs) => {
    list.innerHTML = msgs.length
      ? msgs.slice(-30).reverse().map((m) => `<div class="msg"><b>${esc(m.name)}</b><span>${esc(m.text)}</span></div>`).join("")
      : `<div class="msg-empty">Άδειο σημειωματάριο. Κράτα εδώ ό,τι θες 💬</div>`;
  };
  render(load());

  document.getElementById("msgForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const name = document.getElementById("msgName").value.trim() || "Εγώ";
    const textEl = document.getElementById("msgText");
    const text = textEl.value.trim();
    if (!text) return;
    const msgs = load();
    msgs.push({ id: Date.now().toString(36), name, text, at: new Date().toISOString() });
    save(msgs);
    render(msgs);
    textEl.value = "";
    toast("Αποθηκεύτηκε στο σημειωματάριό σου 🔒");
  });

  scheduleReopen(root);
}

/** Re-render when the show opens/closes so the component flips itself live. */
let reopenTimer = null;
function scheduleReopen(root) {
  clearTimeout(reopenTimer);
  // Re-check on the minute — cheap, and avoids a stale closed/open state.
  reopenTimer = setTimeout(() => { if (document.body.contains(root)) initMessages(); }, 60_000);
}

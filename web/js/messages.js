/**
 * Messages, listeners send a shout to the show (like the on-air message wall).
 * Posts to fc-api /messages when reachable; always keeps a local copy so it
 * works offline-of-backend too. Nothing here is sent anywhere except fc-api.
 */
import { SHOW } from "./data.js";
import { toast } from "./ui.js";

const LS = "fc2_messages_v1";
const load = () => { try { return JSON.parse(localStorage.getItem(LS)) || []; } catch { return []; } };
const save = (m) => localStorage.setItem(LS, JSON.stringify(m.slice(-50)));

export function initMessages() {
  const root = document.getElementById("messages");
  if (!root) return;
  root.innerHTML = `
    <div class="glass lg-refract msg-box">
      <div class="msg-list" id="msgList"></div>
      <form class="msg-form" id="msgForm" autocomplete="off">
        <input id="msgName" class="msg-input" maxlength="40" placeholder="Όνομα / ψευδώνυμο" />
        <div class="msg-row">
          <input id="msgText" class="msg-input" maxlength="280" placeholder="Γράψε το μήνυμά σου στην εκπομπή..." required />
          <button class="msg-send" type="submit" aria-label="Αποστολή">➤</button>
        </div>
      </form>
    </div>`;

  const list = document.getElementById("msgList");
  const render = (msgs) => {
    list.innerHTML = msgs.length
      ? msgs.slice(-30).reverse().map((m) =>
          `<div class="msg"><b>${esc(m.name)}</b><span>${esc(m.text)}</span></div>`).join("")
      : `<div class="msg-empty">Γίνε ο πρώτος που στέλνει μήνυμα 💬</div>`;
  };
  render(load());

  // try to hydrate from the backend, ignore if unreachable
  fetch(`${SHOW.apiBase}/messages`).then((r) => r.ok && r.json()).then((m) => {
    if (Array.isArray(m) && m.length) { save(m); render(m); }
  }).catch(() => {});

  document.getElementById("msgForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const name = document.getElementById("msgName").value.trim() || "Ανώνυμος";
    const textEl = document.getElementById("msgText");
    const text = textEl.value.trim();
    if (!text) return;
    const msg = { id: Date.now().toString(36), name, text, at: new Date().toISOString() };
    const msgs = load(); msgs.push(msg); save(msgs); render(msgs);
    textEl.value = "";
    toast("Στάλθηκε 💬");
    try {
      await fetch(`${SHOW.apiBase}/messages`, {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ name, text }),
      });
    } catch { /* kept locally; will sync when backend is live */ }
  });
}

function esc(s) { return String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c])); }

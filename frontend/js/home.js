// frontend/js/home.js
// Customer dashboard logic + floating chat widget.

// ---------------------------------------------------------------------------
// 1. Auth guard — kick to login if no session
// ---------------------------------------------------------------------------
const session = Session.get();
if (!session || session.role !== "customer") {
  window.location.href = "../login-customer.html";
}

// ---------------------------------------------------------------------------
// 2. Personalize header + greeting + account info
// ---------------------------------------------------------------------------
document.getElementById("user-name").textContent     = session.name;
document.getElementById("user-email").textContent    = session.email;
document.getElementById("greeting-name").textContent = session.name.split(" ")[0];
document.getElementById("avatar-initials").textContent =
  session.name.split(" ").map(p => p[0]).join("").slice(0, 2).toUpperCase();
document.getElementById("acct-name").textContent  = session.name;
document.getElementById("acct-email").textContent = session.email;
document.getElementById("acct-id").textContent    = session.user_id.slice(0, 8) + "…";
document.getElementById("member-since").textContent = new Date().toLocaleDateString("en-IN", { month: "short", year: "numeric" });

// ---------------------------------------------------------------------------
// 3. Logout
// ---------------------------------------------------------------------------
document.getElementById("logout-btn").addEventListener("click", () => {
  Session.clear();
  window.location.href = "../index.html";
});

// ---------------------------------------------------------------------------
// 4. DOM element references (ALL declared here, up top, before any function
//    that uses them runs)
// ---------------------------------------------------------------------------
const bubble      = document.getElementById("chat-bubble");
const panel       = document.getElementById("chat-panel");
const closeBtn    = document.getElementById("chat-close");
const userInput   = document.getElementById("user-input");
const chatWindow  = document.getElementById("chat-window");
const chatForm    = document.getElementById("chat-form");
const sendBtn     = document.getElementById("send-btn");
const welcomeCard = document.getElementById("welcome-card");

// ---------------------------------------------------------------------------
// 5. Chat widget — open/close
// ---------------------------------------------------------------------------
function openChat(initialPrompt = null) {
  bubble.classList.add("is-open");
  panel.classList.add("is-open");
  panel.setAttribute("aria-hidden", "false");

  setTimeout(() => userInput.focus(), 200);

  // If we were given an initial prompt (e.g., from an action card), send it.
  if (initialPrompt) {
    userInput.value = initialPrompt;
    sendMessage();
  }
}

function closeChat() {
  panel.classList.remove("is-open");
  bubble.classList.remove("is-open");
  panel.setAttribute("aria-hidden", "true");
}

bubble.addEventListener("click", () => openChat());
closeBtn.addEventListener("click", closeChat);
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && panel.classList.contains("is-open")) closeChat();
});

// ---------------------------------------------------------------------------
// 6. Action cards open the chat with a prefilled prompt
// ---------------------------------------------------------------------------
const ACTION_PROMPTS = {
  quote: "I want a quote for my vehicle.",
  claim: "I want to file a claim.",
  ask:   "What does my insurance cover?",
};

document.querySelectorAll(".quick-action[data-action], [data-action]").forEach((card) => {
  card.addEventListener("click", () => {
    const action = card.dataset.action;
    openChat(ACTION_PROMPTS[action]);
  });
});

// ---------------------------------------------------------------------------
// 7. Suggested prompts inside chat
// ---------------------------------------------------------------------------
document.addEventListener("click", (e) => {
  const btn = e.target.closest(".suggested-prompt");
  if (!btn) return;
  userInput.value = btn.dataset.prompt;
  sendMessage();
});

// ---------------------------------------------------------------------------
// 8. Chat — sending and receiving messages
// ---------------------------------------------------------------------------
function addMessage(text, sender) {
  // Hide the welcome card on first real message
  if (welcomeCard) welcomeCard.style.display = "none";

  const row = document.createElement("div");
  row.className = "msg-row " + sender;

  const bubble = document.createElement("div");
  bubble.className = "msg-bubble " + sender;
  bubble.textContent = text;

  row.appendChild(bubble);
  chatWindow.appendChild(row);
  chatWindow.scrollTop = chatWindow.scrollHeight;
  return bubble;
}

function addSourcesNote(sources) {
  const row = document.createElement("div");
  row.className = "msg-row";

  const note = document.createElement("div");
  note.className = "text-xs text-slate-500 px-2 -mt-2 mb-1";
  note.textContent = "📎 Source: " + sources.join(" · ");

  row.appendChild(note);
  chatWindow.appendChild(row);
  chatWindow.scrollTop = chatWindow.scrollHeight;
}

function addTypingIndicator() {
  const row = document.createElement("div");
  row.className = "msg-row";
  row.id = "typing-indicator";

  const bubble = document.createElement("div");
  bubble.className = "msg-bubble bot typing-dots";
  bubble.innerHTML = "<span>●</span><span>●</span><span>●</span>";

  row.appendChild(bubble);
  chatWindow.appendChild(row);
  chatWindow.scrollTop = chatWindow.scrollHeight;
}

function removeTypingIndicator() {
  const el = document.getElementById("typing-indicator");
  if (el) el.remove();
}

async function sendMessage() {
  const message = userInput.value.trim();
  if (!message) return;

  addMessage(message, "user");
  userInput.value = "";
  sendBtn.disabled = true;
  addTypingIndicator();

  try {
    const res = await fetch(`${API_BASE}/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...Session.authHeaders(),
      },
      body: JSON.stringify({ message }),
    });

    removeTypingIndicator();

    if (!res.ok) {
      addMessage(`Error: server returned ${res.status}`, "bot");
      return;
    }

    const data = await res.json();
    addMessage(data.reply, "bot");

    if (data.sources && data.sources.length > 0) {
      addSourcesNote(data.sources);
    }

  } catch (err) {
    removeTypingIndicator();
    addMessage("Could not reach the AI. Is the backend running?", "bot");
    console.error(err);
  } finally {
    sendBtn.disabled = false;
    userInput.focus();
  }
}

chatForm.addEventListener("submit", (e) => {
  e.preventDefault();
  sendMessage();
});
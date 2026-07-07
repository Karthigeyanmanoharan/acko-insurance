// frontend/js/auth.js
// Shared session helpers used by every authenticated page.

const API_BASE = "http://127.0.0.1:8000";

const Session = {
  // Save the logged-in user after successful login.
  save(data) {
    localStorage.setItem("acko_token",   data.token);
    localStorage.setItem("acko_user_id", data.user_id);
    localStorage.setItem("acko_name",    data.name);
    localStorage.setItem("acko_email",   data.email);
    localStorage.setItem("acko_role",    data.role);
  },

  // Retrieve session info.
  get() {
    const token = localStorage.getItem("acko_token");
    if (!token) return null;
    return {
      token,
      user_id: localStorage.getItem("acko_user_id"),
      name:    localStorage.getItem("acko_name"),
      email:   localStorage.getItem("acko_email"),
      role:    localStorage.getItem("acko_role"),
    };
  },

  // Clear session on logout.
  clear() {
    ["acko_token","acko_user_id","acko_name","acko_email","acko_role"]
      .forEach(k => localStorage.removeItem(k));
  },

  // Convenience: are we logged in?
  isAuthenticated() {
    return !!localStorage.getItem("acko_token");
  },

  // Convenience: standard auth headers for fetch().
  authHeaders() {
    const token = localStorage.getItem("acko_token");
    return token ? { "X-User-Id": token } : {};
  },
};

// Show a status message inside a #status-msg element.
function showStatus(message, type = "error") {
  const el = document.getElementById("status-msg");
  if (!el) return;
  el.textContent = message;
  el.className = "text-sm rounded-lg px-4 py-3 " + (
    type === "error"   ? "bg-pink-500/10 border border-pink-500/30 text-pink-300" :
    type === "success" ? "bg-mint/10 border border-mint/30 text-mint" :
                         "bg-white/5 border border-white/10 text-slate-300"
  );
}

function hideStatus() {
  const el = document.getElementById("status-msg");
  if (el) el.className = "hidden";
}
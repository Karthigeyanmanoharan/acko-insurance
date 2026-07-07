// frontend/js/login-manager.js
// Handles manager login + redirect.

const form      = document.getElementById("login-form");
const submitBtn = document.getElementById("submit-btn");

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  hideStatus();

  const payload = {
    email:    document.getElementById("email").value.trim(),
    password: document.getElementById("password").value,
  };

  submitBtn.disabled = true;
  submitBtn.textContent = "Authenticating...";

  try {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (!res.ok) {
      showStatus(data.detail || "Login failed. Please try again.", "error");
      return;
    }

    // Block customers from logging in via the manager page.
    if (data.role !== "manager") {
      showStatus("This portal is restricted to Acko managers only.", "error");
      return;
    }

    // Save session and redirect to the manager dashboard.
    Session.save(data);
    showStatus(`Welcome, ${data.name.split(" ")[0]}. Loading dashboard...`, "success");
    setTimeout(() => {
      window.location.href = "manager/dashboard.html";
    }, 900);

  } catch (err) {
    console.error(err);
    showStatus("Could not reach the server. Is the backend running?", "error");
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = "Access Dashboard →";
  }
});
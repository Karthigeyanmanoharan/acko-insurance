// frontend/js/login-customer.js
// Handles customer login + redirect.

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
  submitBtn.textContent = "Signing in...";

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

    // Block managers from logging in via the customer page.
    if (data.role !== "customer") {
      showStatus("This login is for customers only. Use the Manager login.", "error");
      return;
    }

    // Save session and redirect to the chat page.
    Session.save(data);
    showStatus(`Welcome back, ${data.name.split(" ")[0]}! Redirecting...`, "success");
    setTimeout(() => {
      window.location.href = "customer/home.html";
    }, 900);

  } catch (err) {
    console.error(err);
    showStatus("Could not reach the server. Is the backend running?", "error");
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = "Sign In →";
  }
});
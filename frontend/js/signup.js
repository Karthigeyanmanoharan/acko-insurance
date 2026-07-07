// frontend/js/signup.js
// Handles the signup form submission.

const form      = document.getElementById("signup-form");
const submitBtn = document.getElementById("submit-btn");

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  hideStatus();

  const payload = {
    name:     document.getElementById("name").value.trim(),
    email:    document.getElementById("email").value.trim(),
    phone:    document.getElementById("phone").value.trim() || null,
    password: document.getElementById("password").value,
  };

  submitBtn.disabled = true;
  submitBtn.textContent = "Creating account...";

  try {
    const res = await fetch(`${API_BASE}/auth/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (!res.ok) {
      showStatus(data.detail || "Signup failed. Please try again.", "error");
      return;
    }

    showStatus("Account created! Redirecting to login...", "success");
    setTimeout(() => {
      window.location.href = "login-customer.html";
    }, 1200);

  } catch (err) {
    console.error(err);
    showStatus("Could not reach the server. Is the backend running?", "error");
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = "Create Account →";
  }
});
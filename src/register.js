const API_URL = "http://localhost:5000/api/register";

document
  .getElementById("registerForm")
  .addEventListener("submit", async (e) => {
    e.preventDefault();

    const username = document.getElementById("reg-username").value.trim();
    const password = document.getElementById("reg-password").value.trim();
    const confirmPassword = document.getElementById("reg-confirm").value.trim();
    const messageEl = document.getElementById("message");

    // Basic validation
    if (!username || !password || !confirmPassword) {
      messageEl.textContent = "⚠️ All fields are required.";
      messageEl.style.color = "red";
      return;
    }

    if (password !== confirmPassword) {
      messageEl.textContent = "⚠️ Passwords do not match.";
      messageEl.style.color = "red";
      return;
    }

    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password, confirmPassword }),
      });

      const data = await res.json();

      if (res.ok) {
        messageEl.textContent = "✅ Registration successful! Redirecting to log in...";
        messageEl.style.color = "green";

        setTimeout(() => {
          window.location.href = "login.html";
        }, 1000);
      } else {
        messageEl.textContent = `⚠️ ${data.message}`;
        messageEl.style.color = "red";
      }
    } catch (err) {
      messageEl.textContent = "❌ Server error. Try again later.";
      messageEl.style.color = "red";
    }
  });

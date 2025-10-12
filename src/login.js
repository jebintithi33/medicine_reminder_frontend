const API_URL = "http://localhost:5000/api/login";

document
  .getElementById("loginForm")
  .addEventListener("submit", async (e) => {
    e.preventDefault();

    const username = document.getElementById("login-username").value.trim();
    const password = document.getElementById("login-password").value.trim();
    const messageEl = document.getElementById("message");

    if (!username || !password) {
      messageEl.textContent = "⚠️ All fields are required.";
      messageEl.style.color = "red";
      return;
    }

    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (res.ok) {
        messageEl.textContent = "✅ Login successful! Redirecting...";
        messageEl.style.color = "green";

        // Save JWT token for later requests
        localStorage.setItem("token", data.token);
        localStorage.setItem("username", data.username);

        setTimeout(() => {
          window.location.href = "dashboard.html";
        }, 1500);
      } else {
        messageEl.textContent = `⚠️ ${data.message}`;
        messageEl.style.color = "red";
      }
    } catch (err) {
      console.error(err);
      messageEl.textContent = "❌ Server error. Try again later.";
      messageEl.style.color = "red";
    }
  });

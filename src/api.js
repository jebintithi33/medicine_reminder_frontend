const API_URL = 'http://localhost:5000/api';
let token = localStorage.getItem('token');

// ======= REGISTER =======
async function register() {
  const username = document.getElementById('reg-username').value;
  const password = document.getElementById('reg-password').value;
  const confirmPassword = document.getElementById('reg-confirm').value;

  const res = await fetch(`${API_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password, confirmPassword })
  });

  const data = await res.json();
  alert(data.message);
}

// ======= LOGIN =======
async function login() {
  const username = document.getElementById('login-username').value;
  const password = document.getElementById('login-password').value;

  const res = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });

  const data = await res.json();

  if (res.ok) {
    localStorage.setItem('token', data.token);
    token = data.token;
    alert('Login successful!');
  } else {
    alert(data.message);
  }
}

// ======= ADD REMINDER =======
async function addReminder() {
  const name = document.getElementById('med-name').value;
  const frequency = document.getElementById('med-frequency').value;
  const startDate = document.getElementById('med-date').value;
  const startTime = document.getElementById('med-time').value;
  const minInterval = document.getElementById('med-interval').value;

  const res = await fetch(`${API_URL}/reminders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ name, frequency, startDate, startTime, minInterval })
  });

  const data = await res.json();
  if (res.ok) {
    alert('Reminder added!');
  } else {
    alert(data.message);
  }
}

// ======= GET REMINDERS =======
async function getReminders() {
  const res = await fetch(`${API_URL}/reminders`, {
    headers: { Authorization: `Bearer ${token}` }
  });

  const data = await res.json();
  const list = document.getElementById('reminder-list');
  list.innerHTML = '';

  if (res.ok) {
    data.forEach((r) => {
      const li = document.createElement('li');
      li.textContent = `${r.name} - ${new Date(r.startDate).toLocaleDateString()}`;
      list.appendChild(li);
    });
  } else {
    alert(data.message);
  }
}

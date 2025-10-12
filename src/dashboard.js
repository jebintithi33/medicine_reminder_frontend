const API_URL = "http://localhost:5000/api/reminders";
const token = localStorage.getItem("token");

if (!token) {
  window.location.href = "login.html";
}

const addReminderBtn = document.getElementById("addReminderBtn");
const logoutBtn = document.getElementById("logoutBtn");
const modalOverlay = document.getElementById("modalOverlay");
const form = document.getElementById("medicineForm");
const modalTitle = document.getElementById("modalTitle");
const cancelBtn = document.getElementById("cancelBtn");
const saveBtn = document.getElementById("saveBtn");
const tableBody = document.querySelector("#medicineTable tbody");

let editingId = null; // Track if editing

// -------------------- MODAL CONTROL --------------------
addReminderBtn.addEventListener("click", () => openModal());
cancelBtn.addEventListener("click", closeModal);

function openModal(reminder = null) {
  modalOverlay.classList.remove("hidden");
  form.reset();

  if (reminder) {
    // 📝 Editing existing reminder
    modalTitle.textContent = "Update Reminder";
    saveBtn.textContent = "Update";
    editingId = reminder._id;
    document.getElementById("medicineName").value = reminder.name;
    document.getElementById("frequency").value = reminder.frequency;
    document.getElementById("startDate").value = reminder.startDate.split("T")[0];
    document.getElementById("startTime").value = reminder.startTime;
    document.getElementById("interval").value = reminder.minInterval;
  } else {
    // 🆕 New reminder defaults
    modalTitle.textContent = "Add Reminder";
    saveBtn.textContent = "Save";
    editingId = null;

    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const dd = String(today.getDate()).padStart(2, "0");
    const todayStr = `${yyyy}-${mm}-${dd}`;

    document.getElementById("startDate").value = todayStr;   // default: today's date
    document.getElementById("frequency").value = 2;          // default: twice per day
    document.getElementById("startTime").value = "10:00";    // default: 10:00 AM
    document.getElementById("interval").value = 12;          // default: 12-hour interval
  }
}

function closeModal() {
  modalOverlay.classList.add("hidden");
}

// -------------------- ADD / UPDATE REMINDER --------------------
form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const name = document.getElementById("medicineName").value.trim();
  const frequency = parseInt(document.getElementById("frequency").value, 10);
  const startDate = document.getElementById("startDate").value;
  const startTime = document.getElementById("startTime").value;
  const minInterval = parseInt(document.getElementById("interval").value, 10);

  const reminder = { name, frequency, startDate, startTime, minInterval };
  const method = editingId ? "PUT" : "POST";
  const url = editingId ? `${API_URL}/${editingId}` : API_URL;

  try {
    const res = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(reminder),
    });

    const data = await res.json();

    if (res.ok) {
      alert(editingId ? "✅ Reminder updated!" : "✅ Reminder added!");
      closeModal();
      fetchReminders();
    } else {
      alert(`⚠️ ${data.message}`);
    }
  } catch (err) {
    console.error(err);
    alert("❌ Server error.");
  }
});

// -------------------- FETCH REMINDERS --------------------
async function fetchReminders() {
  try {
    const res = await fetch(API_URL, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (res.ok) renderTable(data);
  } catch (err) {
    console.error(err);
  }
}

// -------------------- RENDER TABLE --------------------
function renderTable(reminders) {
  tableBody.innerHTML = "";

  if (!reminders || reminders.length === 0) {
    tableBody.innerHTML = `<tr><td colspan="4">No reminders yet</td></tr>`;
    return;
  }

  reminders.forEach((med) => {
    const nextDose = getNextDose(med.schedule);
    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>${med.name}</td>
      <td>${med.frequency}</td>
      <td>${med.startTime}</td>
      <td>${nextDose ? new Date(nextDose).toLocaleString() : "Done"}</td>
      <td>${nextDose ? getCountdown(nextDose) : "—"}</td>
      <td>
        <button class="action-btn edit" onclick='editReminder(${JSON.stringify(
          med
        )})'>✏️</button>
        <button class="action-btn delete" onclick='deleteReminder("${med._id}")'>🗑️</button>
      </td>
    `;

    tableBody.appendChild(tr);

    if (nextDose) startCountdown(tr.children[2], nextDose);
  });
}

// -------------------- UTILITIES --------------------
function getNextDose(schedule) {
  const now = new Date();
  return schedule.map((d) => new Date(d)).find((d) => d > now) || null;
}

function getCountdown(target) {
  const diff = new Date(target) - new Date();
  if (diff <= 0) return "Now";
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff / (1000 * 60)) % 60);
  return `${hours}h ${minutes}m`;
}

function startCountdown(element, target) {
  const targetTime = new Date(target).getTime();
  let alertShown = false;

  const interval = setInterval(() => {
    const now = Date.now();
    const diff = targetTime - now;

    if (diff <= 0) {
      element.textContent = "Now";
      clearInterval(interval);
      return;
    }

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff / (1000 * 60)) % 60);
    element.textContent = `${hours}h ${minutes}m`;

    // 🔔 Alert 15 minutes before dose time
    if (!alertShown && diff <= 15 * 60 * 1000) {
      alert("⏰ Reminder: Your medicine time is in 15 minutes!");
      alertShown = true;
    }
  }, 60000); // update every 1 minute
}


// -------------------- EDIT / DELETE --------------------
window.editReminder = (med) => openModal(med);

window.deleteReminder = async (id) => {
  if (!confirm("Are you sure you want to delete this reminder?")) return;
  try {
    const res = await fetch(`${API_URL}/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      alert("🗑️ Reminder deleted");
      fetchReminders();
    }
  } catch (err) {
    console.error(err);
  }
};

// -------------------- LOGOUT --------------------
logoutBtn.addEventListener("click", () => {
  localStorage.removeItem("token");
  localStorage.removeItem("username");
  window.location.href = "login.html";
});

// -------------------- INIT --------------------
fetchReminders();

const closeModalBtn = document.getElementById("closeModal");

closeModalBtn.addEventListener("click", closeModal);
cancelBtn.addEventListener("click", closeModal);

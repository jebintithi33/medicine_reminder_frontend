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

let editingId = null; 
let audio = null; 
let alarmTimers = {}; 
let musicPlayed = {}; 

if (localStorage.getItem("soundEnabled") !== "true") {

  document.addEventListener(
    "click",
    () => {
      const unlock = new Audio();
      unlock.muted = true;

      unlock
        .play()
        .then(() => {
          console.log("🔓 Audio unlocked after user interaction");
          localStorage.setItem("soundEnabled", "true");
          alert("🔔 Sound enabled for reminders.");
        })
        .catch((err) => {
          console.warn("⚠️ Failed to unlock audio:", err);
        });
    },
    { once: true } 
  );
}


addReminderBtn.addEventListener("click", () => openModal());
cancelBtn.addEventListener("click", closeModal);

function openModal(reminder = null) {
  modalOverlay.classList.remove("hidden");
  form.reset();

  if (reminder) {
    modalTitle.textContent = "Update Reminder";
    saveBtn.textContent = "Update";
    editingId = reminder._id;
    document.getElementById("medicineName").value = reminder.name;
    document.getElementById("frequency").value = reminder.frequency;
    document.getElementById("startDate").value = reminder.startDate.split("T")[0];
    document.getElementById("startTime").value = reminder.startTime;
    document.getElementById("interval").value = reminder.minInterval;
  } else {
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

function renderTable(reminders) {
  tableBody.innerHTML = "";

  if (!reminders || reminders.length === 0) {
    tableBody.innerHTML = `<tr><td colspan="8">No reminders yet</td></tr>`;
    return;
  }

  reminders.forEach((med) => {
    const nextDose = getNextDose(med.schedule);
    const tr = document.createElement("tr");
    const formattedDate = new Date(med.startDate).toISOString().split('T')[0];
    const startDose = `${formattedDate} ${convertTo12HourFormat(med.startTime)}`;

    tr.innerHTML = `
      <td>${med.name}</td>
      <td>${med.frequency}</td>
      <td>${startDose}</td>
      <td>${nextDose ? convertToAMPM(nextDose) : "Done"}</td>
      <td>
        <span id="countdown-${med._id}">${nextDose ? "—" : "—"}</span>
      </td>
      <td>
        <button class="action-btn edit" onclick='editReminder(${JSON.stringify(
          med
        )})'>✏️</button>
        <button class="action-btn delete" onclick='deleteReminder("${med._id}")'>🗑️</button>
      </td>
      <td>
        <button class="action-btn stop hidden" id="stopBtn-${med._id}" onclick="stopMusic('${med._id}')">Stop ⏰</button>
      </td>
    `;

    tableBody.appendChild(tr);

    if (nextDose) startCountdown(med._id, nextDose);
  });
}

function convertTo12HourFormat(time24) {
  const [hours, minutes] = time24.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const hour12 = hours % 12 || 12;
  return `${hour12}:${String(minutes).padStart(2, '0')} ${period}`;
}

function convertToAMPM(utcTime) {
  const date = new Date(utcTime);

  const options = {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true 
  };

  const amPmTime = date.toLocaleString('en-US', options);
  
  return amPmTime;
}

function getNextDose(schedule) {
  const now = new Date();
  return schedule.map((d) => new Date(d)).find((d) => d > now) || null;
}

function getCountdown(target) {
  const diff = new Date(target) - new Date();
  if (diff <= 0) return "Now";
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff / (1000 * 60)) % 60);
  const seconds = Math.floor((diff / 1000) % 60);
  return `${hours}h ${minutes}m ${seconds}s`;
}

function startCountdown(medId, target) {
  const targetTime = new Date(target).getTime();

  alarmTimers[medId] = setInterval(() => {
    const now = Date.now();
    const diff = targetTime - now;

    if (diff <= 0) {
      document.getElementById(`countdown-${medId}`).textContent = "Now";
      clearInterval(alarmTimers[medId]);
      delete alarmTimers[medId];
      return;
    }

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff / (1000 * 60)) % 60);
    const seconds = Math.floor((diff / 1000) % 60);
    document.getElementById(`countdown-${medId}`).textContent = `${hours}h ${minutes}m ${seconds}s`;

    const alertInput = document.getElementById("alertTime");
    const alertMinutes = parseInt(alertInput?.value || 15, 10); 
    if (
      diff <= alertMinutes * 60 * 1000 &&
      diff > (alertMinutes - 1) * 60 * 1000 &&
      !musicPlayed[medId]
    ) {
      musicPlayed[medId] = true; 
      playMusic(medId);
    }
  }, 1000);
}



function playMusic(medId) {
  if (audio) {
    audio.pause();
    audio.currentTime = 0;
    clearTimeout(stopTimeout);
  }

  const stopBtn = document.getElementById(`stopBtn-${medId}`);
  if (stopBtn) stopBtn.classList.remove("hidden");

  audio = new Audio('src/ring.mp3');
  audio.loop = true;
  audio.play().catch((err) => console.warn("Autoplay blocked:", err));

  stopTimeout = setTimeout(() => {
    stopMusic(medId);
  }, 60000); 
}

function stopMusic(medId) {
  if (audio) {
    audio.pause();
    audio.currentTime = 0;
  }
  clearTimeout(stopTimeout);
  stopTimeout = null;

  const stopBtn = document.getElementById(`stopBtn-${medId}`);
  if (stopBtn) stopBtn.classList.add("hidden");
}


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

logoutBtn.addEventListener("click", () => {
  localStorage.removeItem("token");
  localStorage.removeItem("username");
  window.location.href = "login.html";
});

fetchReminders();

const closeModalBtn = document.getElementById("closeModal");

closeModalBtn.addEventListener("click", closeModal);
cancelBtn.addEventListener("click", closeModal);

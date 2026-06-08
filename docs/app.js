const REPO = "ImmanuelJoseph7/wc-prediction";
const IS_LOCAL = location.hostname === "localhost" || location.hostname === "127.0.0.1";
const DATA_BASE = IS_LOCAL ? "/data" : `https://raw.githubusercontent.com/${REPO}/main/data`;
const API_BASE = `https://api.github.com/repos/${REPO}/actions/workflows/submit-prediction.yml/dispatches`;

function dataUrl(file) {
  if (IS_LOCAL) return `/data/${file}`;
  return `https://api.github.com/repos/${REPO}/contents/data/${file}`;
}

let currentUser = sessionStorage.getItem("wc_user");
let currentPin = sessionStorage.getItem("wc_pin");
let matches = [];
let predictions = [];
let leaderboard = [];
let users = [];

// Auto-login if session exists
(async () => {
  if (currentUser && currentPin) {
    await loadData();
    document.getElementById("login-dialog").close();
    render();
  }
})();

// Data fetching
async function loadData() {
  const fetchJson = (file) => {
    if (IS_LOCAL) return fetch(`/data/${file}`).then(r => r.json());
    return fetch(`https://api.github.com/repos/${REPO}/contents/data/${file}`, {
      headers: { Accept: "application/vnd.github.v3.raw" }
    }).then(r => r.json());
  };
  [matches, predictions, leaderboard, users] = await Promise.all([
    fetchJson("matches.json"),
    fetchJson("predictions.json"),
    fetchJson("leaderboard.json"),
    fetchJson("users.json"),
  ]);
  if (IS_LOCAL) {
    const localPreds = JSON.parse(localStorage.getItem("wc_local_preds") || "[]");
    for (const lp of localPreds) {
      const idx = predictions.findIndex(p => p.user === lp.user && p.match_id === lp.match_id);
      if (idx >= 0) predictions[idx] = lp;
      else predictions.push(lp);
    }
  }
}

// Auth
async function hashPin(pin) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(pin));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, "0")).join("");
}

document.getElementById("login-btn").onclick = async () => {
  const name = document.getElementById("user-select").value;
  const pin = document.getElementById("pin-input").value;
  const err = document.getElementById("login-error");
  if (!name || pin.length !== 4) { err.textContent = "Pick a name and enter 4-digit PIN."; return; }

  await loadData();
  const hash = await hashPin(pin);
  const existing = users.find(u => u.name === name);

  if (existing) {
    if (existing.pin_hash !== hash) { err.textContent = "Wrong PIN."; return; }
  } else {
    err.textContent = "User not found. Please try again in a moment.";
    return;
  }

  currentUser = name;
  currentPin = pin;
  sessionStorage.setItem("wc_user", name);
  sessionStorage.setItem("wc_pin", pin);
  document.getElementById("login-dialog").close();
  render();
};

// Tabs
document.querySelectorAll(".tab").forEach(btn => {
  btn.onclick = () => {
    document.querySelectorAll(".tab").forEach(b => b.classList.remove("active"));
    document.querySelectorAll(".tab-content").forEach(s => s.classList.add("hidden"));
    btn.classList.add("active");
    document.getElementById(`tab-${btn.dataset.tab}`).classList.remove("hidden");
  };
});

// Render
function render() {
  renderPredict();
  renderLeaderboard();
  renderResults();
}

function renderPredict() {
  const now = new Date().toISOString();
  const upcoming = matches.filter(m => m.datetime > now && m.status === "SCHEDULED");
  const container = document.getElementById("matches-list");

  if (!upcoming.length) { container.innerHTML = "<p>No upcoming matches to predict.</p>"; return; }

  container.innerHTML = upcoming.map(m => {
    const existing = predictions.find(p => p.user === currentUser && p.match_id === m.id);
    const hVal = existing ? existing.home_score : "";
    const aVal = existing ? existing.away_score : "";
    const dt = new Date(m.datetime).toLocaleString();
    return `<div class="match-card" data-id="${m.id}">
      <span class="team">${m.home_team}</span>
      <div class="score-inputs">
        <input type="number" min="0" max="20" class="home-score" value="${hVal}">
        <span>–</span>
        <input type="number" min="0" max="20" class="away-score" value="${aVal}">
      </div>
      <span class="team">${m.away_team}</span>
      <span class="meta">${m.group || m.stage} · ${dt}</span>
    </div>`;
  }).join("");

  document.getElementById("submit-preds").disabled = false;
}

function renderLeaderboard() {
  const tbody = document.querySelector("#leaderboard-table tbody");
  const medals = ["🥇", "🥈", "🥉"];
  tbody.innerHTML = leaderboard.map((u, i) =>
    `<tr><td>${medals[i] || i + 1}</td><td>${u.user}</td><td><strong>${u.total_points}</strong></td><td>${u.exact_scores}</td><td>${u.correct_winners}</td><td>${u.predictions_made}</td></tr>`
  ).join("");

  // Breakdown: show all finished match predictions once match has started
  const finished = matches.filter(m => m.status === "FINISHED");
  const breakdown = document.getElementById("breakdown");
  breakdown.innerHTML = finished.map(m => {
    const preds = predictions.filter(p => p.match_id === m.id);
    const rows = preds.map(p => `<li>${p.user}: ${p.home_score}-${p.away_score}</li>`).join("");
    return `<details><summary>${m.home_team} ${m.home_score}–${m.away_score} ${m.away_team}</summary><ul>${rows}</ul></details>`;
  }).join("");
}

function renderResults() {
  const finished = matches.filter(m => m.status === "FINISHED").sort((a, b) => b.datetime.localeCompare(a.datetime));
  document.getElementById("results-list").innerHTML = finished.map(m =>
    `<div class="result-card"><span>${m.home_team}</span><span class="score">${m.home_score} – ${m.away_score}</span><span>${m.away_team}</span></div>`
  ).join("") || "<p>No results yet.</p>";
}

// Submit predictions
document.getElementById("submit-preds").onclick = async () => {
  const cards = document.querySelectorAll(".match-card");
  const preds = [];
  cards.forEach(card => {
    const h = card.querySelector(".home-score").value;
    const a = card.querySelector(".away-score").value;
    if (h !== "" && a !== "") {
      preds.push({ match_id: parseInt(card.dataset.id), home_score: parseInt(h), away_score: parseInt(a) });
    }
  });

  if (!preds.length) { document.getElementById("submit-status").textContent = "Enter at least one prediction."; return; }

  const status = document.getElementById("submit-status");

  if (IS_LOCAL) {
    // Save to localStorage so they persist on refresh
    const stored = JSON.parse(localStorage.getItem("wc_local_preds") || "[]");
    const updated = stored.filter(p => !(p.user === currentUser && preds.some(np => np.match_id === p.match_id)));
    for (const p of preds) {
      updated.push({ user: currentUser, match_id: p.match_id, home_score: p.home_score, away_score: p.away_score, submitted_at: new Date().toISOString() });
    }
    localStorage.setItem("wc_local_preds", JSON.stringify(updated));
    predictions = updated;
    status.textContent = `✓ Saved ${preds.length} prediction(s) for ${currentUser}.`;
    render();
    return;
  }

  status.textContent = "Submitting…";
  let pat = localStorage.getItem("wc_pat");
  if (!pat) {
    pat = prompt("One-time setup: enter the family GitHub token (ask Dad):");
    if (!pat) { status.textContent = "Cancelled."; return; }
    localStorage.setItem("wc_pat", pat);
  }

  try {
    const resp = await fetch(API_BASE, {
      method: "POST",
      headers: { Authorization: `token ${pat}`, "Content-Type": "application/json" },
      body: JSON.stringify({ ref: "main", inputs: { user: currentUser, pin: currentPin, predictions: JSON.stringify(preds) } }),
    });
    if (resp.status === 204) {
      status.textContent = "✓ Submitted! Results update in ~30s.";
    } else {
      status.textContent = `Error: ${resp.status}`;
    }
  } catch (e) {
    status.textContent = `Failed: ${e.message}`;
  }
};

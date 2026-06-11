const REPO = "ImmanuelJoseph7/wc-prediction";
const IS_LOCAL = location.hostname === "localhost" || location.hostname === "127.0.0.1";

const FLAGS = {
  "Algeria":"dz","Argentina":"ar","Australia":"au","Austria":"at","Belgium":"be",
  "Bosnia-Herzegovina":"ba","Brazil":"br","Canada":"ca","Cape Verde Islands":"cv",
  "Colombia":"co","Congo DR":"cd","Croatia":"hr","Curaçao":"cw","Czechia":"cz",
  "Ecuador":"ec","Egypt":"eg","England":"gb-eng","France":"fr","Germany":"de",
  "Ghana":"gh","Haiti":"ht","Iran":"ir","Iraq":"iq","Ivory Coast":"ci",
  "Japan":"jp","Jordan":"jo","Mexico":"mx","Morocco":"ma","Netherlands":"nl",
  "New Zealand":"nz","Norway":"no","Panama":"pa","Paraguay":"py","Portugal":"pt",
  "Qatar":"qa","Saudi Arabia":"sa","Scotland":"gb-sct","Senegal":"sn",
  "South Africa":"za","South Korea":"kr","Spain":"es","Sweden":"se",
  "Switzerland":"ch","Tunisia":"tn","Turkey":"tr","United States":"us",
  "Uruguay":"uy","Uzbekistan":"uz"
};
const flag = (team) => {
  const code = FLAGS[team];
  return code ? `<img src="https://flagcdn.com/24x18/${code}.png" alt="${team}" style="vertical-align:middle;margin:0 4px">` : "";
};
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

// Populate user select from users.json
async function populateUserSelect() {
  const fetchJson = (file) => {
    if (IS_LOCAL) return fetch(`/data/${file}`).then(r => r.json());
    return fetch(`https://raw.githubusercontent.com/${REPO}/main/data/${file}?t=${Date.now()}`).then(r => r.json());
  };
  const u = await fetchJson("users.json");
  const sel = document.getElementById("user-select");
  sel.innerHTML = '<option value="">Pick your name…</option>';
  u.forEach(user => { sel.innerHTML += `<option>${user.name}</option>`; });
  users = u;
}

// Auto-login if session exists
(async () => {
  if (currentUser && currentPin) {
    await loadData();
    document.getElementById("login-dialog").close();
    render();
  } else {
    await populateUserSelect();
  }
})();

// Data fetching
async function loadData() {
  const fetchJson = (file) => {
    if (IS_LOCAL) return fetch(`/data/${file}`).then(r => r.json());
    return fetch(`https://raw.githubusercontent.com/${REPO}/main/data/${file}?t=${Date.now()}`).then(r => r.json());
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

// Registration
document.getElementById("register-btn").onclick = async () => {
  const btn = document.getElementById("register-btn");
  const name = document.getElementById("reg-name").value.trim();
  const pin = document.getElementById("reg-pin").value;
  const confirm = document.getElementById("reg-pin-confirm").value;
  const err = document.getElementById("reg-error");
  const success = document.getElementById("reg-success");
  err.textContent = ""; success.textContent = "";

  if (!/^[A-Z][a-z]+ [A-Z]$/.test(name)) { err.textContent = "Format: First Name + Last Initial (e.g. Samuel G)"; return; }
  if (!/^\d{4}$/.test(pin)) { err.textContent = "PIN must be exactly 4 digits."; return; }
  if (pin !== confirm) { err.textContent = "PINs don't match."; return; }
  if (users.find(u => u.name === name)) { err.textContent = "Name already taken."; return; }

  btn.disabled = true;
  btn.textContent = "Registering…";
  const hash = await hashPin(pin);

  if (IS_LOCAL) {
    users.push({ name, pin_hash: hash, created_at: new Date().toISOString() });
    success.textContent = "✓ Registered! Select your name above to login.";
    btn.disabled = false;
    btn.textContent = "Register";
    await populateUserSelect();
    return;
  }

  let pat = localStorage.getItem("wc_pat");
  if (!pat) {
    pat = prompt("One-time setup: enter the family GitHub token (ask Immanuel):");
    if (!pat) { err.textContent = "Cancelled."; btn.disabled = false; btn.textContent = "Register"; return; }
    localStorage.setItem("wc_pat", pat);
  }

  try {
    const resp = await fetch(`https://api.github.com/repos/${REPO}/actions/workflows/register-user.yml/dispatches`, {
      method: "POST",
      headers: { Authorization: `token ${pat}`, "Content-Type": "application/json" },
      body: JSON.stringify({ ref: "main", inputs: { user: name, pin_hash: hash } }),
    });
    if (resp.status === 204) {
      success.textContent = "✓ Registered! Wait ~30s then refresh to login.";
    } else {
      err.textContent = `Error: ${resp.status}`;
      btn.disabled = false;
      btn.textContent = "Register";
    }
  } catch (e) {
    err.textContent = `Failed: ${e.message}`;
    btn.disabled = false;
    btn.textContent = "Register";
  }
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
  const now = new Date();
  const cutoff = new Date(now.getTime() + 48 * 60 * 60 * 1000).toISOString();
  const upcoming = matches.filter(m => m.datetime > now.toISOString() && m.datetime <= cutoff && (m.status === "SCHEDULED" || m.status === "TIMED"));
  const container = document.getElementById("matches-list");

  if (!upcoming.length) { container.innerHTML = "<p>No upcoming matches to predict.</p>"; return; }

  container.innerHTML = upcoming.map(m => {
    const existing = predictions.find(p => p.user === currentUser && p.match_id === m.id);
    const hVal = existing ? existing.home_score : "";
    const aVal = existing ? existing.away_score : "";
    const dt = new Date(m.datetime).toLocaleString([], { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
    const diff = new Date(m.datetime) - now;
    const d = Math.floor(diff / 86400000);
    const h = Math.floor((diff % 86400000) / 3600000);
    const min = Math.floor((diff % 3600000) / 60000);
    const sec = Math.floor((diff % 60000) / 1000);
    const countdown = d > 0 ? `${d}d ${h}h ${min}m` : h > 0 ? `${h}h ${min}m` : `${min}m ${sec}s`;
    const groupLabel = (m.group || m.stage).replace("GROUP_", "Group ").replace("_", " ");
    return `<div class="match-card" data-id="${m.id}">
      <span class="group-tag">${groupLabel}</span>
      <div class="match-time"><strong>${dt}</strong></div>
      <div class="score-row">
        <span class="team home">${m.home_team} ${flag(m.home_team)}</span>
        <input type="number" min="0" max="20" class="home-score" value="${hVal}">
        <span class="vs">–</span>
        <input type="number" min="0" max="20" class="away-score" value="${aVal}">
        <span class="team away">${flag(m.away_team)} ${m.away_team}</span>
      </div>
      <div class="countdown">⏱ ${countdown}</div>
    </div>`;
  }).join("");

  document.getElementById("submit-preds").disabled = false;
}

function renderLeaderboard() {
  const tbody = document.querySelector("#leaderboard-table tbody");
  const medals = ["🥇", "🥈", "🥉"];
  tbody.innerHTML = leaderboard.map((u, i) => {
    const recent = (u.match_results || []).slice(-5).map(r =>
      r.points === 7 ? '<span class="dot dot-exact">●</span>' : r.points === 2 ? '<span class="dot dot-correct">●</span>' : '<span class="dot dot-wrong">●</span>'
    ).join("");
    return `<tr><td>${medals[i] || i + 1}</td><td>${u.user}</td><td>${u.predictions_made}</td><td><strong>${u.total_points}</strong></td><td>${u.correct_winners}</td><td>${u.exact_scores}</td><td class="recent">${recent}</td></tr>`;
  }).join("");

  // Breakdown: show all finished match predictions once match has started
  const finished = matches.filter(m => m.status === "FINISHED").sort((a, b) => b.datetime.localeCompare(a.datetime));
  const breakdown = document.getElementById("breakdown");
  breakdown.innerHTML = finished.map(m => {
    const preds = predictions.filter(p => p.match_id === m.id);
    const rows = preds.map(p => {
      const result = leaderboard.flatMap(u => u.match_results || []).find(r => r.match_id === m.id && leaderboard.find(lu => lu.user === p.user)?.match_results?.includes(r));
      const pts = leaderboard.find(u => u.user === p.user)?.match_results?.find(r => r.match_id === m.id)?.points;
      const cls = pts === 7 ? 'exact' : pts === 2 ? 'correct' : 'wrong';
      return `<li class="pred-${cls}">${p.user}: ${p.home_score}-${p.away_score}</li>`;
    }).join("");
    return `<details><summary>${flag(m.home_team)} ${m.home_team} ${m.home_score}–${m.away_score} ${m.away_team} ${flag(m.away_team)}</summary><ul class="pred-list">${rows}</ul></details>`;
  }).join("");
}

function renderResults() {
  const finished = matches.filter(m => m.status === "FINISHED").sort((a, b) => b.datetime.localeCompare(a.datetime));
  document.getElementById("results-list").innerHTML = finished.map(m =>
    `<div class="result-card"><span>${flag(m.home_team)} ${m.home_team}</span><span class="score">${m.home_score} – ${m.away_score}</span><span>${m.away_team} ${flag(m.away_team)}</span></div>`
  ).join("") || "<p>No results yet.</p>";
}

// Submit predictions
// Live countdown ticker for matches < 1 hour away
setInterval(() => {
  const now = new Date();
  document.querySelectorAll(".match-card").forEach(card => {
    const m = matches.find(x => x.id === parseInt(card.dataset.id));
    if (!m) return;
    const diff = new Date(m.datetime) - now;
    if (diff <= 0) { renderPredict(); return; }
    if (diff < 3600000) {
      const min = Math.floor(diff / 60000);
      const sec = Math.floor((diff % 60000) / 1000);
      card.querySelector(".countdown").textContent = `⏱ ${min}m ${sec}s`;
    }
  });
}, 1000);

document.getElementById("submit-preds").onclick = async () => {
  const btn = document.getElementById("submit-preds");
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
  btn.disabled = true;
  btn.textContent = "Submitting…";

  if (IS_LOCAL) {
    const stored = JSON.parse(localStorage.getItem("wc_local_preds") || "[]");
    const updated = stored.filter(p => !(p.user === currentUser && preds.some(np => np.match_id === p.match_id)));
    for (const p of preds) {
      updated.push({ user: currentUser, match_id: p.match_id, home_score: p.home_score, away_score: p.away_score, submitted_at: new Date().toISOString() });
    }
    localStorage.setItem("wc_local_preds", JSON.stringify(updated));
    predictions = updated;
    status.textContent = `✓ Saved ${preds.length} prediction(s) for ${currentUser}.`;
    btn.disabled = false;
    btn.textContent = "Submit Predictions";
    render();
    return;
  }

  status.textContent = "Submitting… please wait ~30s";
  let pat = localStorage.getItem("wc_pat");
  if (!pat) {
    pat = prompt("One-time setup: enter the family GitHub token (ask Immanuel):");
    if (!pat) { status.textContent = "Cancelled."; btn.disabled = false; btn.textContent = "Submit Predictions"; return; }
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
      btn.disabled = false;
      btn.textContent = "Submit Predictions";
    }
  } catch (e) {
    status.textContent = `Failed: ${e.message}`;
    btn.disabled = false;
    btn.textContent = "Submit Predictions";
  }
};

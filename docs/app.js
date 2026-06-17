const SUPABASE_URL = "https://mxmaedzsfvrugdmcjzri.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im14bWFlZHpzZnZydWdkbWNqenJpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE1MDU2NjEsImV4cCI6MjA5NzA4MTY2MX0.KHm7x2Huxi1JPeGZPfxLY6AIIIl6c4bbkXz4fxWBnYk";
const HEADERS = {"apikey": SUPABASE_KEY, "Authorization": `Bearer ${SUPABASE_KEY}`};

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

const TLA = {
  "Algeria":"ALG","Argentina":"ARG","Australia":"AUS","Austria":"AUT","Belgium":"BEL",
  "Bosnia-Herzegovina":"BIH","Brazil":"BRA","Canada":"CAN","Cape Verde Islands":"CPV",
  "Colombia":"COL","Congo DR":"COD","Croatia":"CRO","Curaçao":"CUW","Czechia":"CZE",
  "Ecuador":"ECU","Egypt":"EGY","England":"ENG","France":"FRA","Germany":"GER",
  "Ghana":"GHA","Haiti":"HAI","Iran":"IRN","Iraq":"IRQ","Ivory Coast":"CIV",
  "Japan":"JPN","Jordan":"JOR","Mexico":"MEX","Morocco":"MAR","Netherlands":"NED",
  "New Zealand":"NZL","Norway":"NOR","Panama":"PAN","Paraguay":"PAR","Portugal":"POR",
  "Qatar":"QAT","Saudi Arabia":"KSA","Scotland":"SCO","Senegal":"SEN",
  "South Africa":"RSA","South Korea":"KOR","Spain":"ESP","Sweden":"SWE",
  "Switzerland":"SUI","Tunisia":"TUN","Turkey":"TUR","United States":"USA",
  "Uruguay":"URU","Uzbekistan":"UZB"
};

function teamForm(team) {
  const finished = matches.filter(m => m.status === "FINISHED" && (m.home_team === team || m.away_team === team))
    .sort((a, b) => b.datetime.localeCompare(a.datetime));
  if (!finished.length) return "";
  return '<div class="team-form">' + finished.map(m => {
    const isHome = m.home_team === team;
    const opp = isHome ? m.away_team : m.home_team;
    const gf = isHome ? m.home_score : m.away_score;
    const ga = isHome ? m.away_score : m.home_score;
    const cls = gf > ga ? "form-win" : gf < ga ? "form-loss" : "form-draw";
    return `<span class="form-item ${cls}">${flag(opp)}${TLA[opp] || opp} ${gf}-${ga}</span>`;
  }).join("") + '</div>';
}

let currentUser = sessionStorage.getItem("wc_user");
let currentPin = sessionStorage.getItem("wc_pin");
let matches = [];
let predictions = [];
let leaderboard = [];
let users = [];

async function sb(table, query = "") {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${query}`, {headers: HEADERS});
  return r.json();
}

async function populateUserSelect() {
  users = await sb("users", "select=name,pin_hash");
  const sel = document.getElementById("user-select");
  sel.innerHTML = '<option value="">Pick your name…</option>';
  users.forEach(u => { sel.innerHTML += `<option>${u.name}</option>`; });
}

(async () => {
  if (currentUser && currentPin) {
    await loadData();
    document.getElementById("login-dialog").close();
    if (currentUser === "Immanuel J") document.getElementById("admin-link").style.display = "block";
    render();
  } else {
    await populateUserSelect();
  }
})();

async function loadData() {
  const [m, p, u] = await Promise.all([
    sb("matches", "select=*&order=kickoff.asc"),
    sb("predictions", "select=*"),
    sb("users", "select=name,pin_hash"),
  ]);
  matches = m.map(r => ({id: r.id, home_team: r.home_team, away_team: r.away_team, group: r.group_name, stage: r.stage, datetime: r.kickoff, status: r.status, home_score: r.home_score, away_score: r.away_score}));
  predictions = p.map(r => ({user: r.user_name, match_id: r.match_id, home_score: r.home_score, away_score: r.away_score, submitted_at: r.submitted_at}));
  users = u;
  computeLeaderboard();
}

function computeLeaderboard() {
  const finished = matches.filter(m => m.status === "FINISHED" && m.home_score !== null);
  const stats = {};
  users.forEach(u => { stats[u.name] = {user: u.name, total_points: 0, correct_winners: 0, exact_scores: 0, predictions_made: 0, games_played: 0, match_results: []}; });

  for (const u of users) {
    const userPreds = predictions.filter(p => p.user === u.name);
    stats[u.name].predictions_made = userPreds.length;
    for (const p of userPreds) {
      const m = finished.find(fm => fm.id === p.match_id);
      if (!m) continue;
      stats[u.name].games_played++;
      let pts = 0;
      if (p.home_score === m.home_score && p.away_score === m.away_score) {
        pts = 7; stats[u.name].exact_scores++; stats[u.name].correct_winners++;
      } else if (Math.sign(p.home_score - p.away_score) === Math.sign(m.home_score - m.away_score)) {
        pts = 2; stats[u.name].correct_winners++;
      }
      stats[u.name].total_points += pts;
      stats[u.name].match_results.push({match_id: p.match_id, prediction: `${p.home_score}-${p.away_score}`, actual: `${m.home_score}-${m.away_score}`, points: pts});
    }
  }
  leaderboard = Object.values(stats).sort((a, b) => b.total_points - a.total_points);
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
  if (!existing) { err.textContent = "User not found."; return; }
  if (existing.pin_hash !== hash) { err.textContent = "Wrong PIN."; return; }

  currentUser = name;
  currentPin = pin;
  sessionStorage.setItem("wc_user", name);
  sessionStorage.setItem("wc_pin", pin);
  document.getElementById("login-dialog").close();
  if (name === "Immanuel J") document.getElementById("admin-link").style.display = "block";
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

  const resp = await fetch(`${SUPABASE_URL}/rest/v1/users`, {
    method: "POST", headers: {...HEADERS, "Content-Type": "application/json", "Prefer": "return=minimal"},
    body: JSON.stringify({name, pin_hash: hash})
  });
  if (resp.ok) {
    success.textContent = "✓ Registered! Select your name above to login.";
    await populateUserSelect();
  } else {
    err.textContent = `Error: ${resp.status}`;
  }
  btn.disabled = false;
  btn.textContent = "Register";
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
  sb("metadata", "key=eq.scores_fetched_at&select=value").then(r => {
    if (r.length) {
      const t = new Date(r[0].value).toLocaleString([], { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
      const txt = `Scores updated: ${t}`;
      document.getElementById("last-updated").textContent = txt;
      document.getElementById("last-updated-bd").textContent = txt;
      document.getElementById("last-updated-res").textContent = txt;
    }
  });
  renderPredict();
  renderLeaderboard();
  renderBreakdown();
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
      <div class="form-row">
        <div class="form-col">${teamForm(m.home_team)}</div>
        <div class="form-col">${teamForm(m.away_team)}</div>
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
    const recent = (u.match_results || []).slice(-5).reverse().map(r =>
      r.points === 7 ? '<span class="dot dot-exact">●</span>' : r.points === 2 ? '<span class="dot dot-correct">●</span>' : '<span class="dot dot-wrong">●</span>'
    ).join("");
    return `<tr><td>${medals[i] || i + 1}</td><td>${u.user}</td><td>${u.predictions_made}</td><td>${u.games_played}</td><td><strong>${u.total_points}</strong></td><td>${u.correct_winners}</td><td>${u.exact_scores}</td><td class="recent">${recent}</td></tr>`;
  }).join("");
}

function renderBreakdown() {
  const finished = matches.filter(m => m.status === "FINISHED").sort((a, b) => b.datetime.localeCompare(a.datetime));
  if (!finished.length) { document.getElementById("breakdown-wrap").innerHTML = "<p>No completed matches yet.</p>"; return; }

  const sorted = [...leaderboard].sort((a, b) => b.total_points - a.total_points);
  const initials = sorted.map(u => u.user.split(" ").map(w => w[0]).join(""));

  let html = '<table class="breakdown-table"><thead><tr><th>Game</th>';
  html += sorted.map((u, i) => `<th title="${u.user}">${initials[i]}</th>`).join("");
  html += '</tr></thead><tbody>';

  for (const m of finished) {
    html += `<tr><td class="game-cell">${flag(m.home_team)}<span class="abr">${m.home_score}–${m.away_score}</span>${flag(m.away_team)}</td>`;
    for (const u of sorted) {
      const p = predictions.find(pr => pr.user === u.user && pr.match_id === m.id);
      if (!p) { html += '<td class="bd-cell bd-none">–</td>'; continue; }
      const pts = u.match_results?.find(r => r.match_id === m.id)?.points;
      const cls = pts === 7 ? 'bd-exact' : pts === 2 ? 'bd-correct' : 'bd-wrong';
      html += `<td class="bd-cell ${cls}">${p.home_score}-${p.away_score}</td>`;
    }
    html += '</tr>';
  }
  html += '</tbody></table>';
  document.getElementById("breakdown-wrap").innerHTML = html;
}

function renderResults() {
  const finished = matches.filter(m => m.status === "FINISHED").sort((a, b) => b.datetime.localeCompare(a.datetime));
  document.getElementById("results-list").innerHTML = finished.map(m =>
    `<div class="result-card"><span>${flag(m.home_team)} ${m.home_team}</span><span class="score">${m.home_score} – ${m.away_score}</span><span>${m.away_team} ${flag(m.away_team)}</span></div>`
  ).join("") || "<p>No results yet.</p>";
}

// Live countdown ticker
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

// Submit predictions
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

  if (!confirm(`Submit ${preds.length} prediction(s)? You can't undo this.`)) return;

  const status = document.getElementById("submit-status");
  btn.disabled = true;
  btn.textContent = "Submitting…";

  // Verify PIN
  const hash = await hashPin(currentPin);
  const user = users.find(u => u.name === currentUser);
  if (!user || user.pin_hash !== hash) {
    status.textContent = "Auth failed. Please re-login.";
    btn.disabled = false; btn.textContent = "Submit Predictions";
    return;
  }

  // Upsert predictions to Supabase
  const rows = preds.map(p => ({user_name: currentUser, match_id: p.match_id, home_score: p.home_score, away_score: p.away_score, submitted_at: new Date().toISOString()}));
  const resp = await fetch(`${SUPABASE_URL}/rest/v1/predictions?on_conflict=user_name,match_id`, {
    method: "POST",
    headers: {...HEADERS, "Content-Type": "application/json", "Prefer": "return=minimal,resolution=merge-duplicates"},
    body: JSON.stringify(rows)
  });

  if (resp.ok) {
    alert(`✓ Saved ${preds.length} prediction(s)!`);
    await loadData();
    render();
  } else {
    status.textContent = `Error: ${resp.status}`;
  }
  btn.disabled = false;
  btn.textContent = "Submit Predictions";
};

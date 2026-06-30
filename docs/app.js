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
  const stageMap = {"GROUP_STAGE":"GS","LAST_32":"R32","LAST_16":"R16","QUARTER_FINALS":"QF","SEMI_FINALS":"SF","THIRD_PLACE":"3rd","FINAL":"F"};
  const gsCount = {};
  const gsSorted = [...finished].reverse();
  gsSorted.forEach(m => {
    if (m.stage === "GROUP_STAGE") {
      [m.home_team, m.away_team].forEach(t => { gsCount[t] = (gsCount[t] || 0) + 1; });
    }
  });
  const gsTracker = {};
  return '<div class="team-form">' + finished.map(m => {
    const isHome = m.home_team === team;
    const opp = isHome ? m.away_team : m.home_team;
    const gf = isHome ? m.home_score : m.away_score;
    const ga = isHome ? m.away_score : m.home_score;
    const cls = gf > ga ? "form-win" : gf < ga ? "form-loss" : "form-draw";
    let stg = stageMap[m.stage] || m.stage;
    if (m.stage === "GROUP_STAGE") {
      gsTracker[team] = (gsTracker[team] || gsCount[team] || 0);
      stg = `GS${gsTracker[team]}`;
      gsTracker[team]--;
    }
    const penHome = isHome ? m.pen_home_score : m.pen_away_score;
    const penAway = isHome ? m.pen_away_score : m.pen_home_score;
    const scoreStr = penHome != null ? `${gf}(${penHome})-${ga}(${penAway})` : `${gf}-${ga}`;
    return `<span class="form-item ${cls}">${scoreStr} ${flag(opp)}${TLA[opp] || opp} (${stg})</span>`;
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

function showSignedIn() {
  const el = document.getElementById("signed-in-as");
  el.innerHTML = `Signed in as <strong>${currentUser}</strong> · <a href="#" id="sign-off-link">Sign off</a>`;
  el.style.display = "block";
  document.getElementById("sign-off-link").onclick = (e) => {
    e.preventDefault();
    sessionStorage.removeItem("wc_user");
    sessionStorage.removeItem("wc_pin");
    location.reload();
  };
}

(async () => {
  if (currentUser && currentPin) {
    await loadData();
    document.getElementById("login-dialog").close();
    if (currentUser === "Immanuel J") document.getElementById("admin-link").style.display = "block";
    showSignedIn();
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
  matches = m.map(r => ({id: r.id, home_team: r.home_team, away_team: r.away_team, group: r.group_name, stage: r.stage, datetime: r.kickoff, status: r.status, home_score: r.home_score, away_score: r.away_score, pen_winner: r.pen_winner, pen_home_score: r.pen_home_score, pen_away_score: r.pen_away_score}));
  predictions = p.map(r => ({user: r.user_name, match_id: r.match_id, home_score: r.home_score, away_score: r.away_score, pen_winner: r.pen_winner, submitted_at: r.submitted_at}));
  users = u;
  computeLeaderboard();
}

let lbGroup = [], lbKnockout = [], lbCombined = [];
let activePhase = "knockout";
let bdPhase = "knockout";

function isKnockoutStage(stage) { return stage !== "GROUP_STAGE"; }

const BRACKET_PAIRS = [
  [537417, 537418], [537415, 537416], [537421, 537422], [537419, 537420],
  [537423, 537424], [537425, 537426], [537429, 537430], [537427, 537428],
  [537376, 537375], [537377, 537378], [537379, 537380], [537381, 537382],
  [537383, 537384], [537385, 537386], [537387, 537388]
];

function scoreMatch(p, m) {
  let pts = 0, exact = false, correctWinner = false;
  if (p.home_score === m.home_score && p.away_score === m.away_score) {
    pts = 7; exact = true; correctWinner = true;
  } else if (Math.sign(p.home_score - p.away_score) === Math.sign(m.home_score - m.away_score)) {
    pts = 2; correctWinner = true;
  } else if (m.pen_winner) {
    // Match went to pens (draw) but user predicted a winner — check if they picked the advancing team
    const predWinner = p.home_score > p.away_score ? "home" : p.away_score > p.home_score ? "away" : null;
    if (predWinner && predWinner === m.pen_winner) { pts = 2; correctWinner = true; }
  }
  // +3 for correct penalty winner
  if (m.pen_winner && p.pen_winner && p.pen_winner === m.pen_winner) { pts += 3; }
  return {pts, exact, correctWinner};
}

function buildLeaderboard(finishedMatches, phaseFilter) {
  const matchIds = new Set(finishedMatches.map(m => m.id));
  const phaseMatchIds = new Set(matches.filter(phaseFilter).map(m => m.id));
  const stats = {};
  users.forEach(u => { stats[u.name] = {user: u.name, total_points: 0, correct_winners: 0, exact_scores: 0, wrong: 0, pen_correct: 0, predictions_made: 0, games_played: 0, match_results: []}; });
  for (const u of users) {
    stats[u.name].predictions_made = predictions.filter(p => p.user === u.name && phaseMatchIds.has(p.match_id)).length;
    const userPreds = predictions.filter(p => p.user === u.name && matchIds.has(p.match_id));
    for (const p of userPreds) {
      const m = finishedMatches.find(fm => fm.id === p.match_id);
      if (!m) continue;
      stats[u.name].games_played++;
      const {pts, exact, correctWinner} = scoreMatch(p, m);
      if (exact) stats[u.name].exact_scores++;
      else if (correctWinner) stats[u.name].correct_winners++;
      else stats[u.name].wrong++;
      if (m.pen_winner && p.pen_winner && p.pen_winner === m.pen_winner) stats[u.name].pen_correct++;
      stats[u.name].total_points += pts;
      stats[u.name].match_results.push({match_id: p.match_id, prediction: `${p.home_score}-${p.away_score}`, actual: `${m.home_score}-${m.away_score}`, points: pts});
    }
  }
  return Object.values(stats).sort((a, b) => b.total_points - a.total_points);
}

function computeLeaderboard() {
  const finished = matches.filter(m => m.status === "FINISHED" && m.home_score !== null);
  const groupMatches = finished.filter(m => !isKnockoutStage(m.stage));
  const knockoutMatches = finished.filter(m => isKnockoutStage(m.stage));
  lbGroup = buildLeaderboard(groupMatches, m => !isKnockoutStage(m.stage));
  lbKnockout = buildLeaderboard(knockoutMatches, m => isKnockoutStage(m.stage));
  lbCombined = buildLeaderboard(finished, () => true);
  leaderboard = lbKnockout;
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
  showSignedIn();
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

// Leaderboard sub-tabs
document.querySelectorAll(".lb-tab").forEach(btn => {
  btn.onclick = () => {
    document.querySelectorAll(".lb-tab").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    activePhase = btn.dataset.phase;
    renderLeaderboard();
  };
});

// Breakdown sub-tabs
document.querySelectorAll(".bd-tab").forEach(btn => {
  btn.onclick = () => {
    document.querySelectorAll(".bd-tab").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    bdPhase = btn.dataset.phase;
    renderBreakdown();
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
    const isKnockout = m.stage !== "GROUP_STAGE";
    const penWinner = existing?.pen_winner || "";
    let bracketInfo = "";
    if (isKnockout) {
      const pair = BRACKET_PAIRS.find(p => p.includes(m.id));
      if (pair) {
        const otherId = pair[0] === m.id ? pair[1] : pair[0];
        const other = matches.find(x => x.id === otherId);
        if (other && other.home_team) {
          const otherWinner = other.status === "FINISHED" ? (other.pen_winner ? (other.pen_winner === "home" ? other.home_team : other.away_team) : (other.home_score > other.away_score ? other.home_team : other.away_team)) : null;
          bracketInfo = otherWinner
            ? `<div class="bracket-info">Winner plays ${flag(otherWinner)} ${otherWinner}</div>`
            : `<div class="bracket-info">Winner plays ${flag(other.home_team)} ${other.home_team} / ${flag(other.away_team)} ${other.away_team}</div>`;
        }
      }
    }
    const penHtml = isKnockout ? `<div class="pen-row hidden" data-pen="${m.id}">
      <span>Penalty Winner:</span>
      <div class="pen-btns">
        <button type="button" class="pen-btn ${penWinner === "home" ? "pen-active" : ""}" data-val="home">${flag(m.home_team)}${TLA[m.home_team] || m.home_team}</button>
        <button type="button" class="pen-btn ${penWinner === "away" ? "pen-active" : ""}" data-val="away">${flag(m.away_team)}${TLA[m.away_team] || m.away_team}</button>
      </div>
    </div>` : "";
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
      ${penHtml}
      ${bracketInfo}
      <div class="form-row">
        <div class="form-col">${teamForm(m.home_team)}</div>
        <div class="form-col">${teamForm(m.away_team)}</div>
      </div>
      <div class="countdown">⏱ ${countdown}</div>
    </div>`;
  }).join("");

  document.getElementById("submit-preds").disabled = false;

  // Show pen picker for knockout draws
  document.querySelectorAll(".match-card").forEach(card => {
    const hInput = card.querySelector(".home-score");
    const aInput = card.querySelector(".away-score");
    const penRow = card.querySelector(".pen-row");
    if (!penRow) return;
    const toggle = () => {
      if (hInput.value !== "" && aInput.value !== "" && hInput.value === aInput.value) {
        penRow.classList.remove("hidden");
      } else {
        penRow.classList.add("hidden");
        penRow.querySelectorAll(".pen-btn").forEach(b => b.classList.remove("pen-active"));
      }
    };
    hInput.addEventListener("input", toggle);
    aInput.addEventListener("input", toggle);
    toggle();
    // Toggle button clicks
    penRow.querySelectorAll(".pen-btn").forEach(btn => {
      btn.onclick = () => {
        penRow.querySelectorAll(".pen-btn").forEach(b => b.classList.remove("pen-active"));
        btn.classList.add("pen-active");
      };
    });
  });
}

function renderLeaderboard() {
  let data = activePhase === "group" ? lbGroup : activePhase === "knockout" ? lbKnockout : lbCombined;
  if (activePhase === "combined") data = [...data].sort((a, b) => (b.games_played ? b.total_points / b.games_played : 0) - (a.games_played ? a.total_points / a.games_played : 0));
  leaderboard = data;
  const thead = document.querySelector("#leaderboard-table thead tr");
  const tbody = document.querySelector("#leaderboard-table tbody");
  const medals = ["🥇", "🥈", "🥉"];
  const isGroup = activePhase === "group";
  const isCombined = activePhase === "combined";
  thead.innerHTML = isGroup
    ? '<th>#</th><th>Name</th><th>MP</th><th>GC</th><th>PTS</th><th>✓</th><th>🎯</th><th>Recent</th>'
    : isCombined
    ? '<th>#</th><th>Name</th><th>MP</th><th>GC</th><th>PTS</th><th>PPG</th><th>🎯</th><th>✓</th><th>❌</th><th>🅿️</th>'
    : '<th>#</th><th>Name</th><th>MP</th><th>GC</th><th>PTS</th><th>🎯</th><th>✓</th><th>❌</th><th>🅿️</th>';
  tbody.innerHTML = data.map((u, i) => {
    if (isGroup) {
      const recent = (u.match_results || []).sort((a, b) => {
        const ma = matches.find(m => m.id === a.match_id);
        const mb = matches.find(m => m.id === b.match_id);
        return (ma?.datetime || "").localeCompare(mb?.datetime || "");
      }).slice(-5).reverse().map(r =>
        r.points >= 7 ? '<span class="dot dot-exact">●</span>' : r.points >= 2 ? '<span class="dot dot-correct">●</span>' : '<span class="dot dot-wrong">●</span>'
      ).join("");
      return `<tr><td>${medals[i] || i + 1}</td><td>${u.user}</td><td>${u.predictions_made}</td><td>${u.games_played}</td><td><strong>${u.total_points}</strong></td><td>${u.correct_winners}</td><td>${u.exact_scores}</td><td class="recent">${recent}</td></tr>`;
    }
    const ppg = u.games_played ? (u.total_points / u.games_played).toFixed(2) : "–";
    if (isCombined) return `<tr><td>${medals[i] || i + 1}</td><td>${u.user}</td><td>${u.predictions_made}</td><td>${u.games_played}</td><td><strong>${u.total_points}</strong></td><td><strong>${ppg}</strong></td><td>${u.exact_scores}</td><td>${u.correct_winners}</td><td>${u.wrong}</td><td>${u.pen_correct}</td></tr>`;
    return `<tr><td>${medals[i] || i + 1}</td><td>${u.user}</td><td>${u.predictions_made}</td><td>${u.games_played}</td><td><strong>${u.total_points}</strong></td><td>${u.exact_scores}</td><td>${u.correct_winners}</td><td>${u.wrong}</td><td>${u.pen_correct}</td></tr>`;
  }).join("");
  document.getElementById("lb-legend").textContent = isGroup
    ? "MP = Matches Predicted · GC = Games Competed · PTS = Points · ✓ = Correct Outcome · 🎯 = Exact Score"
    : isCombined
    ? "MP = Matches Predicted · GC = Games Competed · PTS = Points · PPG = Points Per Game · 🎯 = Exact (7) · ✓ = Correct Outcome (2) · ❌ = Wrong (0) · 🅿️ = Pen Pick (3)"
    : "MP = Matches Predicted · GC = Games Competed · PTS = Points · 🎯 = Exact (7) · ✓ = Correct Outcome (2) · ❌ = Wrong (0) · 🅿️ = Pen Pick (3)";
}

function renderBreakdown() {
  let finished = matches.filter(m => m.status === "FINISHED").sort((a, b) => b.datetime.localeCompare(a.datetime));
  if (bdPhase === "group") finished = finished.filter(m => !isKnockoutStage(m.stage));
  else if (bdPhase === "knockout") finished = finished.filter(m => isKnockoutStage(m.stage));
  if (!finished.length) { document.getElementById("breakdown-wrap").innerHTML = "<p>No completed matches yet.</p>"; return; }

  const bdData = bdPhase === "group" ? lbGroup : bdPhase === "knockout" ? lbKnockout : lbCombined;
  const sorted = [...bdData].sort((a, b) => b.total_points - a.total_points);
  const initials = sorted.map(u => u.user.split(" ").map(w => w[0]).join(""));

  let html = '<table class="breakdown-table"><thead><tr><th>Game</th>';
  html += sorted.map((u, i) => `<th title="${u.user}">${initials[i]}</th>`).join("");
  html += '</tr></thead><tbody>';

  for (const m of finished) {
    html += `<tr><td class="game-cell">${flag(m.home_team)}<span class="abr">${m.pen_home_score != null ? `${m.home_score}(${m.pen_home_score})` : m.home_score}–${m.pen_away_score != null ? `${m.away_score}(${m.pen_away_score})` : m.away_score}</span>${flag(m.away_team)}</td>`;
    for (const u of sorted) {
      const p = predictions.find(pr => pr.user === u.user && pr.match_id === m.id);
      if (!p) { html += '<td class="bd-cell bd-none">–</td>'; continue; }
      const pts = u.match_results?.find(r => r.match_id === m.id)?.points ?? 0;
      const cls = pts >= 7 ? 'bd-exact' : pts >= 2 ? 'bd-correct' : 'bd-wrong';
      html += `<td class="bd-cell ${cls}">${p.home_score}-${p.away_score}</td>`;
    }
    html += '</tr>';
  }
  html += '</tbody></table>';
  document.getElementById("breakdown-wrap").innerHTML = html;
}

function renderResults() {
  const getWinner = (m) => { if (!m || m.status !== "FINISHED") return null; if (m.pen_winner) return m.pen_winner === "home" ? m.home_team : m.away_team; return m.home_score > m.away_score ? m.home_team : m.away_score > m.home_score ? m.away_team : null; };
  const finished = matches.filter(m => m.status === "FINISHED").sort((a, b) => b.datetime.localeCompare(a.datetime));
  const stageOrder = ["FINAL", "THIRD_PLACE", "SEMI_FINALS", "QUARTER_FINALS", "LAST_16", "LAST_32", "GROUP_STAGE"];
  const stageNames = {"FINAL":"Final","THIRD_PLACE":"Third Place","SEMI_FINALS":"Semi-Finals","QUARTER_FINALS":"Quarter-Finals","LAST_16":"Round of 16","LAST_32":"Round of 32","GROUP_STAGE":"Group Stage"};
  const grouped = {};
  for (const m of finished) { (grouped[m.stage] = grouped[m.stage] || []).push(m); }
  let html = "";
  for (const stage of stageOrder) {
    if (!grouped[stage]) continue;
    const open = stage !== "GROUP_STAGE" ? "open" : "";
    html += `<details class="stage-group" ${open}><summary>${stageNames[stage] || stage} (${grouped[stage].length})</summary>`;
    for (const m of grouped[stage]) {
      const homeScoreDisplay = m.pen_home_score != null ? `${m.home_score}(${m.pen_home_score})` : `${m.home_score}`;
      const awayScoreDisplay = m.pen_away_score != null ? `${m.away_score}(${m.pen_away_score})` : `${m.away_score}`;
      const penInfo = m.pen_winner ? `<div class="pen-info">${m.pen_winner === "home" ? m.home_team : m.away_team} wins on pens</div>` : "";
      let nextInfo = "";
      if (isKnockoutStage(m.stage) && m.stage !== "FINAL" && m.stage !== "THIRD_PLACE") {
        const pair = BRACKET_PAIRS.find(p => p.includes(m.id));
        if (pair) {
          const otherId = pair[0] === m.id ? pair[1] : pair[0];
          const other = matches.find(x => x.id === otherId);
          const winner = getWinner(m);
          const otherWinner = getWinner(other);
          if (winner) {
            if (otherWinner) nextInfo = `<div class="next-info">Next: ${flag(winner)} ${winner} vs ${flag(otherWinner)} ${otherWinner}</div>`;
            else if (other && other.home_team) nextInfo = `<div class="next-info">Next: ${flag(winner)} ${winner} vs ${flag(other.home_team)} ${other.home_team} / ${flag(other.away_team)} ${other.away_team}</div>`;
          }
        }
      }
      html += `<div class="result-card"><span>${flag(m.home_team)} ${m.home_team}</span><span class="score">${homeScoreDisplay} – ${awayScoreDisplay}</span><span>${m.away_team} ${flag(m.away_team)}</span>${penInfo}${nextInfo}</div>`;
    }
    html += `</details>`;
  }
  document.getElementById("results-list").innerHTML = html || "<p>No results yet.</p>";
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
      const pred = { match_id: parseInt(card.dataset.id), home_score: parseInt(h), away_score: parseInt(a) };
      const penActive = card.querySelector('.pen-btn.pen-active');
      if (penActive && h === a) pred.pen_winner = penActive.dataset.val;
      preds.push(pred);
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
  const rows = preds.map(p => ({user_name: currentUser, match_id: p.match_id, home_score: p.home_score, away_score: p.away_score, pen_winner: p.pen_winner || null, submitted_at: new Date().toISOString()}));
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

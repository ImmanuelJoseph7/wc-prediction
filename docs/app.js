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
const CRESTS = {
  "Arsenal FC":"57","Aston Villa FC":"58","Chelsea FC":"61","Everton FC":"62",
  "Fulham FC":"63","Liverpool FC":"64","Manchester City FC":"65","Manchester United FC":"66",
  "Newcastle United FC":"67","Sunderland AFC":"71","Tottenham Hotspur FC":"73",
  "Hull City AFC":"322","Leeds United FC":"341","Ipswich Town FC":"349",
  "Nottingham Forest FC":"351","Crystal Palace FC":"354","Brighton & Hove Albion FC":"397",
  "Brentford FC":"402","AFC Bournemouth":"bournemouth","Coventry City FC":"1076"
};

// Official short names and TLAs from football-data.org
const SHORT_NAMES = {
  "Arsenal FC":"Arsenal","Aston Villa FC":"Aston Villa","Chelsea FC":"Chelsea",
  "Everton FC":"Everton","Fulham FC":"Fulham","Liverpool FC":"Liverpool",
  "Manchester City FC":"Man City","Manchester United FC":"Man United",
  "Newcastle United FC":"Newcastle","Sunderland AFC":"Sunderland",
  "Tottenham Hotspur FC":"Tottenham","Hull City AFC":"Hull City",
  "Leeds United FC":"Leeds United","Ipswich Town FC":"Ipswich Town",
  "Nottingham Forest FC":"Nottingham","Crystal Palace FC":"Crystal Palace",
  "Brighton & Hove Albion FC":"Brighton","Brentford FC":"Brentford",
  "AFC Bournemouth":"Bournemouth","Coventry City FC":"Coventry City"
};
const PL_TLA = {
  "Arsenal FC":"ARS","Aston Villa FC":"AVL","Chelsea FC":"CHE","Everton FC":"EVE",
  "Fulham FC":"FUL","Liverpool FC":"LIV","Manchester City FC":"MCI",
  "Manchester United FC":"MUN","Newcastle United FC":"NEW","Sunderland AFC":"SUN",
  "Tottenham Hotspur FC":"TOT","Hull City AFC":"HUL","Leeds United FC":"LEE",
  "Ipswich Town FC":"IPS","Nottingham Forest FC":"NOT","Crystal Palace FC":"CRY",
  "Brighton & Hove Albion FC":"BHA","Brentford FC":"BRE","AFC Bournemouth":"BOU",
  "Coventry City FC":"COV"
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

const flag = (team) => {
  const code = FLAGS[team];
  if (code) return `<img src="https://flagcdn.com/24x18/${code}.png" alt="${team}" style="vertical-align:middle;margin:0 4px">`;
  const crest = CRESTS[team];
  if (crest) return `<img src="https://crests.football-data.org/${crest}.png" alt="${team}" width="18" height="18" style="vertical-align:middle;margin:0 4px">`;
  return "";
};
const shortName = (team) => SHORT_NAMES[team] || team;
const teamTLA = (team) => TLA[team] || PL_TLA[team] || team;
const COMP_LOGOS = {
  "PL": "https://crests.football-data.org/PL.png",
  "WC": "https://crests.football-data.org/wm26.png",
  "CL": "https://crests.football-data.org/CL.png"
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
let activeGameId = sessionStorage.getItem("activeGameId") ? parseInt(sessionStorage.getItem("activeGameId")) : null;
let activeGame = null;
let allGames = [];
let matches = [];
let predictions = [];
let leaderboard = [];
let users = [];


async function sb(table, query = "") {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${query}`, {headers: HEADERS});
  return r.json();
}

// No populateUserSelect needed — login uses a text input for username

function showSignedIn() {
  const el = document.getElementById("signed-in-as");
  el.innerHTML = `Signed in as <strong>${currentUser}</strong> · <a href="#" id="sign-off-link">Sign off</a>`;
  el.style.display = "block";
  document.getElementById("sign-off-link").onclick = (e) => {
    e.preventDefault();
    sessionStorage.removeItem("wc_user");
    sessionStorage.removeItem("wc_pin");
    sessionStorage.removeItem("activeGameId");
    location.reload();
  };
}

async function loadGames() {
  const [games, gameUsers] = await Promise.all([
    sb("games", "select=*&order=created_at.desc"),
    sb("game_users", `user_name=eq.${encodeURIComponent(currentUser)}&select=game_id`)
  ]);
  allGames = games;
  const joinedIds = new Set(gameUsers.map(gu => gu.game_id));
  const joined = games.filter(g => joinedIds.has(g.id));
  const available = games.filter(g => !joinedIds.has(g.id) && g.joinable);
  renderDashboard(joined, available);
}

function renderDashboard(joined, available) {
  const joinedEl = document.getElementById("joined-games");
  const availableEl = document.getElementById("available-games");
  const availableSection = document.getElementById("available-games-section");

  joinedEl.innerHTML = joined.length
    ? joined.map(g => {
        const logo = COMP_LOGOS[g.competition_code] ? `<img src="${COMP_LOGOS[g.competition_code]}" alt="${g.name}" class="game-card-logo">` : "";
        return `<div class="game-card" data-game-id="${g.id}">
          ${logo}<div class="game-card-info"><strong>${g.name}</strong><small class="game-status ${g.status}">${g.status}</small></div>
          <button class="game-enter-btn" data-game-id="${g.id}">Enter</button>
        </div>`;
      }).join("")
    : "<p>No games yet.</p>";

  if (available.length) {
    availableSection.style.display = "";
    availableEl.innerHTML = available.map(g => {
      const logo = COMP_LOGOS[g.competition_code] ? `<img src="${COMP_LOGOS[g.competition_code]}" alt="${g.name}" class="game-card-logo">` : "";
      return `<div class="game-card" data-game-id="${g.id}">
        ${logo}<div class="game-card-info"><strong>${g.name}</strong><small class="game-status ${g.status}">${g.status}</small></div>
        <button class="game-join-btn" data-game-id="${g.id}">Join</button>
      </div>`;
    }).join("");
  } else {
    availableSection.style.display = "none";
  }

  document.querySelectorAll(".game-enter-btn").forEach(btn => {
    btn.onclick = () => enterGame(parseInt(btn.dataset.gameId));
  });
  document.querySelectorAll(".game-join-btn").forEach(btn => {
    btn.onclick = () => joinGame(parseInt(btn.dataset.gameId));
  });
}

async function joinGame(gameId) {
  const resp = await fetch(`${SUPABASE_URL}/rest/v1/game_users`, {
    method: "POST",
    headers: {...HEADERS, "Content-Type": "application/json", "Prefer": "return=minimal"},
    body: JSON.stringify({game_id: gameId, user_name: currentUser})
  });
  if (resp.ok) {
    await loadGames();
  }
}

async function enterGame(gameId) {
  activeGameId = gameId;
  activeGame = allGames.find(g => g.id === gameId);
  predictMatchday = null;
  bdMatchday = null;
  sessionStorage.setItem("activeGameId", gameId);

  // Hide dashboard, show game view
  document.getElementById("game-dashboard").classList.add("hidden");
  document.getElementById("game-nav").style.display = "";
  document.getElementById("game-header").style.display = "";
  document.getElementById("game-header-name").textContent = activeGame.name;
  document.querySelectorAll(".tab-content").forEach(s => s.classList.add("hidden"));
  document.querySelector(".tab.active")?.click();

  await loadData();
  render();
}

function showDashboard() {
  activeGameId = null;
  activeGame = null;
  sessionStorage.removeItem("activeGameId");

  // Hide game view, show dashboard
  document.getElementById("game-dashboard").classList.remove("hidden");
  document.getElementById("game-nav").style.display = "none";
  document.getElementById("game-header").style.display = "none";
  document.querySelectorAll(".tab-content").forEach(s => s.classList.add("hidden"));

  loadGames();
}

(async () => {
  if (currentUser && currentPin) {
    document.getElementById("login-dialog").close();
    if (currentUser === "Immanuel J") document.getElementById("admin-link").style.display = "block";
    showSignedIn();

    // If user has an active game, go straight to it; otherwise show dashboard
    if (activeGameId) {
      allGames = await sb("games", "select=*&order=created_at.desc");
      activeGame = allGames.find(g => g.id === activeGameId);
      if (activeGame) {
        document.getElementById("game-header").style.display = "";
        document.getElementById("game-header-name").textContent = activeGame.name;
        await loadData();
        render();
      } else {
        showDashboard();
      }
    } else {
      document.getElementById("game-nav").style.display = "none";
      document.querySelectorAll(".tab-content").forEach(s => s.classList.add("hidden"));
      await loadGames();
      document.getElementById("game-dashboard").classList.remove("hidden");
    }
  }
})();

async function loadData() {
  const [m, p, u, gu] = await Promise.all([
    sb("matches_v2", `game_id=eq.${activeGameId}&select=*&order=kickoff.asc`),
    sb("predictions_v2", `game_id=eq.${activeGameId}&select=*`),
    sb("users", "select=name,username,pin_hash"),
    sb("game_users", `game_id=eq.${activeGameId}&select=user_name`),
  ]);
  matches = m.map(r => ({id: r.id, external_id: r.external_id, home_team: r.home_team, away_team: r.away_team, group: r.group_name, stage: r.stage, matchday: r.matchday, datetime: r.kickoff, status: r.status, home_score: r.home_score, away_score: r.away_score, pen_winner: r.pen_winner, pen_home_score: r.pen_home_score, pen_away_score: r.pen_away_score}));
  predictions = p.map(r => ({user: r.user_name, match_id: r.match_id, home_score: r.home_score, away_score: r.away_score, pen_winner: r.pen_winner, submitted_at: r.submitted_at}));
  const memberNames = new Set(gu.map(g => g.user_name));
  users = u.filter(usr => memberNames.has(usr.name));
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
  const rules = activeGame ? activeGame.scoring_rules : {exact_score: 7, correct_outcome: 2, penalty_winner_bonus: 3, correct_advancing_team: 2};
  let pts = 0, exact = false, correctWinner = false;
  if (p.home_score === m.home_score && p.away_score === m.away_score) {
    pts = rules.exact_score; exact = true; correctWinner = true;
  } else if (Math.sign(p.home_score - p.away_score) === Math.sign(m.home_score - m.away_score)) {
    pts = rules.correct_outcome; correctWinner = true;
  } else if (m.pen_winner) {
    // Match went to pens (draw) but user predicted a winner — check if they picked the advancing team
    const predWinner = p.home_score > p.away_score ? "home" : p.away_score > p.home_score ? "away" : null;
    if (predWinner && predWinner === m.pen_winner) { pts = rules.correct_advancing_team || rules.correct_outcome; correctWinner = true; }
  }
  // Penalty winner bonus
  if (m.pen_winner && p.pen_winner && p.pen_winner === m.pen_winner) { pts += rules.penalty_winner_bonus || 0; }
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
  const username = document.getElementById("user-username").value.trim();
  const pin = document.getElementById("pin-input").value;
  const err = document.getElementById("login-error");
  if (!username || pin.length !== 4) { err.textContent = "Enter your username and 4-digit PIN."; return; }

  const hash = await hashPin(pin);
  const result = await sb("users", `username=eq.${encodeURIComponent(username)}&select=name,username,pin_hash`);
  if (!result.length) { err.textContent = "Username not found."; return; }
  const existing = result[0];
  if (existing.pin_hash !== hash) { err.textContent = "Wrong PIN."; return; }

  currentUser = existing.name;
  currentPin = pin;
  sessionStorage.setItem("wc_user", existing.name);
  sessionStorage.setItem("wc_pin", pin);
  document.getElementById("login-dialog").close();
  if (existing.username === "ImmanuelJ") document.getElementById("admin-link").style.display = "block";
  showSignedIn();

  // Show game dashboard
  document.getElementById("game-nav").style.display = "none";
  document.querySelectorAll(".tab-content").forEach(s => s.classList.add("hidden"));
  await loadGames();
  document.getElementById("game-dashboard").classList.remove("hidden");
};

// Registration
document.getElementById("register-btn").onclick = async () => {
  const btn = document.getElementById("register-btn");
  const username = document.getElementById("reg-username").value.trim();
  const name = document.getElementById("reg-name").value.trim();
  const pin = document.getElementById("reg-pin").value;
  const confirm = document.getElementById("reg-pin-confirm").value;
  const err = document.getElementById("reg-error");
  const success = document.getElementById("reg-success");
  err.textContent = ""; success.textContent = "";

  if (!/^[A-Z][a-z]+[A-Z]$/.test(username)) { err.textContent = "Username format: FirstnameI (e.g. SamuelG) — no spaces."; return; }
  if (!/^[A-Z][a-z]+ [A-Z]$/.test(name)) { err.textContent = "Display name format: Firstname I (e.g. Samuel G)."; return; }
  if (!/^\d{4}$/.test(pin)) { err.textContent = "PIN must be exactly 4 digits."; return; }
  if (pin !== confirm) { err.textContent = "PINs don't match."; return; }

  // Check username not taken
  const existing = await sb("users", `username=eq.${encodeURIComponent(username)}&select=username`);
  if (existing.length) { err.textContent = "Username already taken."; return; }

  btn.disabled = true;
  btn.textContent = "Registering…";
  const hash = await hashPin(pin);

  const resp = await fetch(`${SUPABASE_URL}/rest/v1/users`, {
    method: "POST", headers: {...HEADERS, "Content-Type": "application/json", "Prefer": "return=minimal"},
    body: JSON.stringify({name, username, pin_hash: hash})
  });
  if (resp.ok) {
    success.textContent = "✓ Registered! Enter your username above to login.";
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
  sb("game_metadata", `game_id=eq.${activeGameId}&key=eq.scores_fetched_at&select=value`).then(r => {
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
  renderTable();
  renderScoring();
}

let predictMatchday = null; // for matchday navigation

function renderPredict() {
  const now = new Date();
  const container = document.getElementById("matches-list");
  let upcoming;

  if (activeGame && activeGame.prediction_window === 'matchday') {
    // Matchday-based: show all matches for the selected matchday
    // Find the next matchday that has unfinished matches
    if (predictMatchday === null) {
      const matchdays = [...new Set(matches.filter(m => m.matchday).map(m => m.matchday))].sort((a, b) => a - b);
      predictMatchday = matchdays.find(md => matches.some(m => m.matchday === md && m.status !== "FINISHED")) || matchdays[matchdays.length - 1] || 1;
    }

    const mdMatches = matches.filter(m => m.matchday === predictMatchday && m.home_team && m.away_team);
    const maxMatchday = Math.max(...matches.filter(m => m.matchday).map(m => m.matchday));
    const minMatchday = Math.min(...matches.filter(m => m.matchday).map(m => m.matchday));

    // Navigation header
    let navHtml = `<div class="matchday-nav">
      <button class="md-prev" ${predictMatchday <= minMatchday ? 'disabled' : ''}>◀</button>
      <strong>Matchday ${predictMatchday}</strong>
      <button class="md-next" ${predictMatchday >= maxMatchday ? 'disabled' : ''}>▶</button>
    </div>`;

    if (!mdMatches.length) {
      container.innerHTML = navHtml + "<p>No matches for this matchday.</p>";
    } else {
      upcoming = mdMatches.sort((a, b) => a.datetime.localeCompare(b.datetime));
      container.innerHTML = navHtml + renderMatchCards(upcoming, now);
      document.getElementById("submit-preds").disabled = false;
    }

    // Nav handlers
    container.querySelector(".md-prev")?.addEventListener("click", () => { predictMatchday--; renderPredict(); });
    container.querySelector(".md-next")?.addEventListener("click", () => { predictMatchday++; renderPredict(); });

  } else {
    // Time-based: 48h for group stage, all confirmed for knockout
    const cutoff = new Date(now.getTime() + 48 * 60 * 60 * 1000).toISOString();
    upcoming = matches.filter(m => m.datetime > now.toISOString() && (m.status === "SCHEDULED" || m.status === "TIMED") && m.home_team && m.away_team && (isKnockoutStage(m.stage) || m.datetime <= cutoff));

    if (!upcoming.length) { container.innerHTML = "<p>No upcoming matches to predict.</p>"; return; }

    container.innerHTML = renderMatchCards(upcoming, now);
    document.getElementById("submit-preds").disabled = false;
  }

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
    penRow.querySelectorAll(".pen-btn").forEach(btn => {
      btn.onclick = () => {
        penRow.querySelectorAll(".pen-btn").forEach(b => b.classList.remove("pen-active"));
        btn.classList.add("pen-active");
      };
    });
  });
}

function renderMatchCards(matchList, now) {
  const hasKnockout = activeGame && activeGame.scoring_rules.has_knockout;
  return matchList.map(m => {
    const existing = predictions.find(p => p.user === currentUser && p.match_id === m.id);
    const hVal = existing ? existing.home_score : "";
    const aVal = existing ? existing.away_score : "";
    const dt = new Date(m.datetime).toLocaleString([], { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
    const diff = new Date(m.datetime) - now;
    const isPast = diff <= 0;
    const d = Math.floor(diff / 86400000);
    const h = Math.floor((diff % 86400000) / 3600000);
    const min = Math.floor((diff % 3600000) / 60000);
    const sec = Math.floor((diff % 60000) / 1000);
    const countdown = isPast ? (m.status === "FINISHED" ? "✓ Finished" : "🔴 Live") : d > 0 ? `${d}d ${h}h ${min}m` : h > 0 ? `${h}h ${min}m` : `${min}m ${sec}s`;
    const isKnockout = hasKnockout && m.stage !== "GROUP_STAGE" && m.stage !== "REGULAR_SEASON";
    const penWinner = existing?.pen_winner || "";
    let bracketInfo = "";
    if (isKnockout) {
      const pair = BRACKET_PAIRS.find(p => p.includes(m.external_id));
      if (pair) {
        const otherId = pair[0] === m.external_id ? pair[1] : pair[0];
        const other = matches.find(x => x.external_id === otherId);
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
    const disabled = isPast ? "disabled" : "";
    return `<div class="match-card ${isPast ? 'match-past' : ''}" data-id="${m.id}">
      <div class="match-time"><strong>${dt}</strong></div>
      <div class="score-row">
        <span class="team home">${shortName(m.home_team)} ${flag(m.home_team)}</span>
        <input type="number" min="0" max="20" class="home-score" value="${hVal}" ${disabled}>
        <span class="vs">–</span>
        <input type="number" min="0" max="20" class="away-score" value="${aVal}" ${disabled}>
        <span class="team away">${flag(m.away_team)} ${shortName(m.away_team)}</span>
      </div>
      ${penHtml}
      ${bracketInfo}
      <div class="countdown">⏱ ${countdown}</div>
    </div>`;
  }).join("");
}

function renderLeaderboard() {
  const hasKnockout = activeGame && activeGame.scoring_rules.has_knockout;
  const lbTabs = document.querySelector("#tab-leaderboard .lb-tabs");

  if (hasKnockout) {
    lbTabs.style.display = "";
  } else {
    lbTabs.style.display = "none";
  }

  let data;
  if (!hasKnockout) {
    // League format: single overall leaderboard
    data = lbCombined;
  } else {
    data = activePhase === "group" ? lbGroup : activePhase === "knockout" ? lbKnockout : lbCombined;
    if (activePhase === "combined") data = [...data].sort((a, b) => (b.games_played ? b.total_points / b.games_played : 0) - (a.games_played ? a.total_points / a.games_played : 0));
  }
  leaderboard = data;
  const thead = document.querySelector("#leaderboard-table thead tr");
  const tbody = document.querySelector("#leaderboard-table tbody");
  const medals = ["🥇", "🥈", "🥉"];
  const rules = activeGame ? activeGame.scoring_rules : {};
  const exactPts = rules.exact_score || 7;
  const correctPts = rules.correct_outcome || 2;

  if (!hasKnockout) {
    // League format
    thead.innerHTML = '<th>#</th><th>Name</th><th>MP</th><th>GC</th><th>PTS</th><th>🎯</th><th>✓</th><th>❌</th><th>Recent</th>';
    tbody.innerHTML = data.map((u, i) => {
      const recent = (u.match_results || []).sort((a, b) => {
        const ma = matches.find(m => m.id === a.match_id);
        const mb = matches.find(m => m.id === b.match_id);
        return (ma?.datetime || "").localeCompare(mb?.datetime || "");
      }).slice(-5).reverse().map(r =>
        r.points >= exactPts ? '<span class="dot dot-exact">●</span>' : r.points >= correctPts ? '<span class="dot dot-correct">●</span>' : '<span class="dot dot-wrong">●</span>'
      ).join("");
      return `<tr><td>${medals[i] || i + 1}</td><td>${u.user}</td><td>${u.predictions_made}</td><td>${u.games_played}</td><td><strong>${u.total_points}</strong></td><td>${u.exact_scores}</td><td>${u.correct_winners}</td><td>${u.wrong}</td><td class="recent">${recent}</td></tr>`;
    }).join("");
    document.getElementById("lb-legend").textContent = `MP = Matches Predicted · GC = Games Competed · PTS = Points · 🎯 = Exact (${exactPts}) · ✓ = Correct Outcome (${correctPts}) · ❌ = Wrong (0)`;
  } else {
    // Cup format (existing logic)
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
          r.points >= exactPts ? '<span class="dot dot-exact">●</span>' : r.points >= correctPts ? '<span class="dot dot-correct">●</span>' : '<span class="dot dot-wrong">●</span>'
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
      ? `MP = Matches Predicted · GC = Games Competed · PTS = Points · PPG = Points Per Game · 🎯 = Exact (${exactPts}) · ✓ = Correct Outcome (${correctPts}) · ❌ = Wrong (0) · 🅿️ = Pen Pick`
      : `MP = Matches Predicted · GC = Games Competed · PTS = Points · 🎯 = Exact (${exactPts}) · ✓ = Correct Outcome (${correctPts}) · ❌ = Wrong (0) · 🅿️ = Pen Pick`;
  }
}

let bdMatchday = null;

function renderBreakdown() {
  const isLeague = activeGame && activeGame.prediction_window === 'matchday';
  const hasKnockout = activeGame && activeGame.scoring_rules.has_knockout;
  const bdTabs = document.querySelector("#tab-breakdown .lb-tabs");
  if (hasKnockout) { bdTabs.style.display = ""; } else { bdTabs.style.display = "none"; }

  let finished = matches.filter(m => m.status === "FINISHED").sort((a, b) => b.datetime.localeCompare(a.datetime));
  if (hasKnockout) {
    if (bdPhase === "group") finished = finished.filter(m => !isKnockoutStage(m.stage));
    else if (bdPhase === "knockout") finished = finished.filter(m => isKnockoutStage(m.stage));
  }
  if (!finished.length) { document.getElementById("breakdown-wrap").innerHTML = "<p>No completed matches yet.</p>"; return; }

  // For leagues: paginate by matchday
  if (isLeague) {
    const matchdays = [...new Set(finished.filter(m => m.matchday).map(m => m.matchday))].sort((a, b) => b - a);
    if (bdMatchday === null || !matchdays.includes(bdMatchday)) bdMatchday = matchdays[0];
    finished = finished.filter(m => m.matchday === bdMatchday);
    const minMd = matchdays[matchdays.length - 1];
    const maxMd = matchdays[0];

    const nav = `<div class="matchday-nav" style="margin-bottom:0.75rem">
      <button class="bd-md-prev" ${bdMatchday >= maxMd ? 'disabled' : ''}>◀ Newer</button>
      <strong>Matchday ${bdMatchday}</strong>
      <button class="bd-md-next" ${bdMatchday <= minMd ? 'disabled' : ''}>Older ▶</button>
    </div>`;

    const bdData = lbCombined;
    const sorted = [...bdData].sort((a, b) => b.total_points - a.total_points);
    const initials = sorted.map(u => u.user.split(" ").map(w => w[0]).join(""));

    let html = nav + '<div class="table-wrap"><table class="breakdown-table"><thead><tr><th>Game</th>';
    html += sorted.map((u, i) => `<th title="${u.user}">${initials[i]}</th>`).join("");
    html += '</tr></thead><tbody>';
    for (const m of finished) {
      html += `<tr><td class="game-cell">${flag(m.home_team)}<span class="abr">${shortName(m.home_team)} ${m.home_score}–${m.away_score} ${shortName(m.away_team)}</span>${flag(m.away_team)}</td>`;
      for (const u of sorted) {
        const p = predictions.find(pr => pr.user === u.user && pr.match_id === m.id);
        if (!p) { html += '<td class="bd-cell bd-none">–</td>'; continue; }
        const pts = u.match_results?.find(r => r.match_id === m.id)?.points ?? 0;
        const rules = activeGame ? activeGame.scoring_rules : {};
        const cls = pts >= (rules.exact_score || 7) ? 'bd-exact' : pts >= (rules.correct_outcome || 2) ? 'bd-correct' : 'bd-wrong';
        html += `<td class="bd-cell ${cls}">${p.home_score}-${p.away_score}</td>`;
      }
      html += '</tr>';
    }
    html += '</tbody></table></div>';
    document.getElementById("breakdown-wrap").innerHTML = html;

    document.querySelector(".bd-md-prev")?.addEventListener("click", () => {
      const idx = matchdays.indexOf(bdMatchday);
      if (idx > 0) { bdMatchday = matchdays[idx - 1]; renderBreakdown(); }
    });
    document.querySelector(".bd-md-next")?.addEventListener("click", () => {
      const idx = matchdays.indexOf(bdMatchday);
      if (idx < matchdays.length - 1) { bdMatchday = matchdays[idx + 1]; renderBreakdown(); }
    });
    return;
  }

  // Cup: existing full-matrix breakdown
  const bdData = hasKnockout ? (bdPhase === "group" ? lbGroup : bdPhase === "knockout" ? lbKnockout : lbCombined) : lbCombined;
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
  const isLeague = activeGame && activeGame.prediction_window === 'matchday';
  const finished = matches.filter(m => m.status === "FINISHED").sort((a, b) => b.datetime.localeCompare(a.datetime));
  if (!finished.length) { document.getElementById("results-list").innerHTML = "<p>No results yet.</p>"; return; }

  let html = "";

  if (isLeague) {
    // Group by matchday descending
    const matchdays = [...new Set(finished.filter(m => m.matchday).map(m => m.matchday))].sort((a, b) => b - a);
    for (const md of matchdays) {
      const mdMatches = finished.filter(m => m.matchday === md).sort((a, b) => a.datetime.localeCompare(b.datetime));
      html += `<details class="stage-group" ${md === matchdays[0] ? "open" : ""}><summary>Matchday ${md} (${mdMatches.length})</summary>`;
      for (const m of mdMatches) {
        const homeScoreDisplay = m.pen_home_score != null ? `${m.home_score}(${m.pen_home_score})` : `${m.home_score}`;
        const awayScoreDisplay = m.pen_away_score != null ? `${m.away_score}(${m.pen_away_score})` : `${m.away_score}`;
        html += `<div class="result-card"><span>${flag(m.home_team)} ${shortName(m.home_team)}</span><span class="score">${homeScoreDisplay} – ${awayScoreDisplay}</span><span>${shortName(m.away_team)} ${flag(m.away_team)}</span></div>`;
      }
      html += `</details>`;
    }
  } else {
    // Cup: group by stage
    const getWinner = (m) => { if (!m || m.status !== "FINISHED") return null; if (m.pen_winner) return m.pen_winner === "home" ? m.home_team : m.away_team; return m.home_score > m.away_score ? m.home_team : m.away_score > m.home_score ? m.away_team : null; };
    const stageOrder = ["FINAL", "THIRD_PLACE", "SEMI_FINALS", "QUARTER_FINALS", "LAST_16", "LAST_32", "GROUP_STAGE"];
    const stageNames = {"FINAL":"Final","THIRD_PLACE":"Third Place","SEMI_FINALS":"Semi-Finals","QUARTER_FINALS":"Quarter-Finals","LAST_16":"Round of 16","LAST_32":"Round of 32","GROUP_STAGE":"Group Stage"};
    const grouped = {};
    for (const m of finished) { (grouped[m.stage] = grouped[m.stage] || []).push(m); }
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
          const pair = BRACKET_PAIRS.find(p => p.includes(m.external_id));
          if (pair) {
            const otherId = pair[0] === m.external_id ? pair[1] : pair[0];
            const other = matches.find(x => x.external_id === otherId);
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
  }

  document.getElementById("results-list").innerHTML = html;
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
  const rows = preds.map(p => ({game_id: activeGameId, user_name: currentUser, match_id: p.match_id, home_score: p.home_score, away_score: p.away_score, pen_winner: p.pen_winner || null, submitted_at: new Date().toISOString()}));
  const resp = await fetch(`${SUPABASE_URL}/rest/v1/predictions_v2?on_conflict=game_id,user_name,match_id`, {
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

// Back to dashboard
document.getElementById("back-to-dashboard").onclick = (e) => {
  e.preventDefault();
  showDashboard();
};

function renderTable() {
  const isLeague = activeGame && activeGame.prediction_window === 'matchday';
  const tableBtn = document.getElementById("tab-btn-table");
  tableBtn.style.display = isLeague ? "" : "none";
  if (!isLeague) return;

  const finished = matches.filter(m => m.status === "FINISHED" && m.home_score !== null);
  const standings = {};

  // Initialise all teams
  matches.forEach(m => {
    if (m.home_team) standings[m.home_team] = standings[m.home_team] || {mp:0,w:0,d:0,l:0,gf:0,ga:0};
    if (m.away_team) standings[m.away_team] = standings[m.away_team] || {mp:0,w:0,d:0,l:0,gf:0,ga:0};
  });

  // Compute from finished matches
  for (const m of finished) {
    const h = standings[m.home_team];
    const a = standings[m.away_team];
    if (!h || !a) continue;
    h.mp++; a.mp++;
    h.gf += m.home_score; h.ga += m.away_score;
    a.gf += m.away_score; a.ga += m.home_score;
    if (m.home_score > m.away_score)      { h.w++; a.l++; }
    else if (m.home_score < m.away_score) { h.l++; a.w++; }
    else                                   { h.d++; a.d++; }
  }

  const rows = Object.entries(standings).map(([team, s]) => ({
    team, ...s,
    gd: s.gf - s.ga,
    pts: s.w * 3 + s.d
  })).sort((a, b) => b.pts - a.pts || b.gd - a.gd || b.gf - a.gf || a.team.localeCompare(b.team));

  let html = `<table class="league-table">
    <thead><tr>
      <th>#</th><th colspan="2">Club</th>
      <th>MP</th><th>W</th><th>D</th><th>L</th>
      <th>GF</th><th>GA</th><th>GD</th><th><strong>Pts</strong></th>
    </tr></thead><tbody>`;

  const colCount = 11;

  rows.forEach((r, i) => {
    const crestId = CRESTS[r.team];
    const crestHtml = crestId
      ? `<img src="https://crests.football-data.org/${crestId}.png" alt="${shortName(r.team)}" width="20" height="20" style="vertical-align:middle">`
      : "";
    const gdStr = r.gd > 0 ? `+${r.gd}` : `${r.gd}`;
    const teamKey = r.team.replace(/[^a-z0-9]/gi, "_");
    html += `<tr class="league-row" data-team="${r.team}" style="cursor:pointer">
      <td>${i + 1}</td>
      <td style="width:24px">${crestHtml}</td>
      <td class="team-name">${shortName(r.team)} <small class="expand-hint">▸</small></td>
      <td>${r.mp}</td><td>${r.w}</td><td>${r.d}</td><td>${r.l}</td>
      <td>${r.gf}</td><td>${r.ga}</td><td>${gdStr}</td>
      <td><strong>${r.pts}</strong></td>
    </tr>
    <tr class="team-results-row hidden" id="results-${teamKey}">
      <td colspan="${colCount}" class="team-results-cell">
        ${buildTeamResults(r.team, finished)}
      </td>
    </tr>`;
  });

  html += '</tbody></table>';
  document.getElementById("league-table-wrap").innerHTML = html;

  // Click to expand/collapse team results
  document.querySelectorAll(".league-row").forEach(row => {
    row.onclick = () => {
      const team = row.dataset.team;
      const teamKey = team.replace(/[^a-z0-9]/gi, "_");
      const resultsRow = document.getElementById(`results-${teamKey}`);
      const hint = row.querySelector(".expand-hint");
      const isHidden = resultsRow.classList.contains("hidden");
      resultsRow.classList.toggle("hidden", !isHidden);
      if (hint) hint.textContent = isHidden ? "▾" : "▸";
    };
  });
}

function buildTeamResults(team, finished) {
  const teamMatches = finished
    .filter(m => m.home_team === team || m.away_team === team)
    .sort((a, b) => b.datetime.localeCompare(a.datetime));

  if (!teamMatches.length) return '<p style="margin:0.5rem 0;color:#888;font-size:0.85rem">No results yet.</p>';

  return teamMatches.map(m => {
    const isHome = m.home_team === team;
    const opp = isHome ? m.away_team : m.home_team;
    const gf = isHome ? m.home_score : m.away_score;
    const ga = isHome ? m.away_score : m.home_score;
    const cls = gf > ga ? 'tr-win' : gf < ga ? 'tr-loss' : 'tr-draw';
    const label = gf > ga ? 'W' : gf < ga ? 'L' : 'D';
    const scoreStr = isHome ? `${gf}–${ga}` : `${ga}–${gf}`;
    const oppCrest = flag(opp);
    return `<div class="team-result-row">
      <span class="tr-badge ${cls}">${label}</span>
      <span class="tr-score">${scoreStr}</span>
      <span class="tr-opp">${oppCrest} ${shortName(opp)}</span>
      <span class="tr-md">MD${m.matchday}</span>
    </div>`;
  }).join("");
}

// Dynamic scoring tab
function renderScoring() {
  if (!activeGame) return;
  const rules = activeGame.scoring_rules;
  let html = '<table class="scoring-table">';
  html += `<tr><td>🎯 Exact score</td><td><strong>${rules.exact_score} pts</strong></td></tr>`;
  html += `<tr><td>✓ Correct outcome (win/draw/loss)</td><td><strong>${rules.correct_outcome} pts</strong></td></tr>`;
  html += `<tr><td>❌ Wrong outcome</td><td><strong>${rules.wrong_outcome} pts</strong></td></tr>`;
  html += '</table>';

  if (rules.has_knockout) {
    html += '<h3>Knockout Bonuses</h3>';
    html += '<table class="scoring-table">';
    if (rules.correct_advancing_team) {
      html += `<tr><td>✓ Predicted correct advancing team (if match goes to pens)</td><td><strong>${rules.correct_advancing_team} pts</strong></td></tr>`;
    }
    if (rules.penalty_winner_bonus) {
      html += `<tr><td>🅿️ Correct penalty winner pick</td><td><strong>+${rules.penalty_winner_bonus} pts</strong></td></tr>`;
    }
    html += '</table>';
  }

  document.getElementById("scoring-content").innerHTML = html;
}

# FIFA 2026 Family Predictor — Specification

## Overview

A static web app hosted on GitHub Pages where 4 family members (Dad, Mum, Boy, Girl) predict FIFA World Cup 2026 match scores. GitHub Actions handles backend logic. Data lives as JSON files in the repo. Zero cost, zero servers.

---

## Users

| User | PIN |
|------|-----|
| Dad  | Set on first use |
| Mum  | Set on first use |
| Boy  | Set on first use |
| Girl | Set on first use |

On first visit, each user selects their name and creates a 4-digit PIN. PIN is stored in `data/users.json`. Subsequent visits require name + PIN to access.

---

## Scoring Rules

| Outcome | Points |
|---------|--------|
| Correct winner/draw outcome, wrong score | 2 |
| Exact score correct (includes winner bonus) | 7 (5 + 2) |
| Wrong outcome | 0 |

Examples:
- Match result: Brazil 2–1 Germany
  - Prediction 2–1 → 7 pts (exact score + correct winner)
  - Prediction 3–0 → 2 pts (correct winner, wrong score)
  - Prediction 1–1 → 0 pts (wrong outcome)
- Match result: 1–1 draw
  - Prediction 1–1 → 7 pts
  - Prediction 0–0 → 2 pts (correct outcome = draw)
  - Prediction 2–1 → 0 pts

---

## Features

### Prediction Submission
- User selects their name, enters PIN
- Sees list of upcoming matches with score inputs (home goals / away goals)
- Submits predictions
- Submission triggers a GitHub Actions workflow_dispatch that writes to `data/predictions.json`
- Predictions are hidden from other users until match kicks off

### Prediction Locking
- Predictions lock at match kickoff time
- Frontend hides prediction form for started/completed matches
- Backend rejects any late submissions

### Live Scores
- GitHub Action runs every 15 minutes during match days
- Fetches results from football-data.org free API
- Updates `data/matches.json` with final scores
- Triggers points calculation

### Leaderboard
- Auto-calculated after each score update
- Shows: rank, name, total points, correct winners, exact scores
- Per-match breakdown: who predicted what, actual result, points earned

### Admin
- Repository owner (Dad) can edit JSON files directly in GitHub to correct/adjust anything
- Push triggers GitHub Pages rebuild

---

## Architecture

```
GitHub Repository: family-wc-predictor
│
├── docs/                        ← GitHub Pages root
│   ├── index.html               ← Single-page app
│   ├── app.js                   ← All frontend logic
│   └── style.css                ← Football-themed clean styling
│
├── data/
│   ├── matches.json             ← FIFA 2026 schedule + results
│   ├── predictions.json         ← All user predictions
│   ├── leaderboard.json         ← Calculated standings
│   └── users.json               ← User PINs (hashed)
│
├── scripts/
│   ├── fetch_scores.py          ← Pull results from football-data.org
│   ├── calculate.py             ← Scoring engine → leaderboard.json
│   └── seed_matches.py          ← One-time: populate match schedule
│
├── .github/workflows/
│   ├── fetch-scores.yml         ← Scheduled: every 15 min on match days
│   └── submit-prediction.yml    ← workflow_dispatch: accept predictions
│
├── requirements.txt
└── README.md
```

---

## Data Schemas

### matches.json
```json
[
  {
    "id": 1,
    "home_team": "Mexico",
    "away_team": "Canada",
    "group": "A",
    "stage": "Group",
    "datetime": "2026-06-11T18:00:00Z",
    "status": "SCHEDULED|IN_PLAY|FINISHED",
    "home_score": null,
    "away_score": null
  }
]
```

### predictions.json
```json
[
  {
    "user": "Dad",
    "match_id": 1,
    "home_score": 2,
    "away_score": 1,
    "submitted_at": "2026-06-10T12:00:00Z"
  }
]
```

### leaderboard.json
```json
[
  {
    "user": "Dad",
    "total_points": 14,
    "correct_winners": 3,
    "exact_scores": 1,
    "predictions_made": 10,
    "match_results": [
      {
        "match_id": 1,
        "prediction": "2-1",
        "actual": "2-1",
        "points": 7
      }
    ]
  }
]
```

### users.json
```json
[
  {
    "name": "Dad",
    "pin_hash": "sha256_hash_here",
    "created_at": "2026-06-08T10:00:00Z"
  }
]
```

---

## Tech Stack

| Component | Technology |
|-----------|-----------|
| Frontend | Vanilla HTML + CSS + JavaScript (single page) |
| Styling | Pico CSS (lightweight) + custom football theme |
| Backend | Python scripts executed by GitHub Actions |
| Data | JSON files committed to repository |
| Hosting | GitHub Pages (served from `/docs`) |
| Score API | football-data.org (free tier, 10 req/min) |
| CI/CD | GitHub Actions |

---

## Workflow Details

### fetch-scores.yml
- **Trigger:** Cron schedule every 15 minutes (active during tournament: June 11 – July 19, 2026)
- **Steps:**
  1. Checkout repo
  2. Setup Python
  3. Install requirements
  4. Run `fetch_scores.py` (uses secret `FOOTBALL_API_KEY`)
  5. Run `calculate.py`
  6. Commit & push updated JSON files (if changed)

### submit-prediction.yml
- **Trigger:** workflow_dispatch with inputs: `user`, `pin`, `predictions` (JSON string)
- **Steps:**
  1. Checkout repo
  2. Validate PIN against `users.json`
  3. Validate no predictions are for matches already started
  4. Merge new predictions into `predictions.json`
  5. Run `calculate.py` (in case past results exist)
  6. Commit & push

---

## Frontend Design

### Theme
- Football-themed, clean design
- Green pitch colours (#1B5E20 dark green, #4CAF50 main green, #E8F5E9 light)
- White cards on subtle green background
- Clean sans-serif font
- Responsive (works on phone for the kids)

### Pages (single page, tabbed or sectioned)
1. **Login** — Pick name from dropdown, enter/create PIN
2. **Predict** — Upcoming matches, score inputs, submit button
3. **Leaderboard** — Rankings table + per-match breakdown
4. **Results** — Completed matches with scores

---

## Secrets Required (GitHub Repo Settings)

| Secret | Purpose |
|--------|---------|
| `FOOTBALL_API_KEY` | football-data.org API key |
| `ACTIONS_PAT` | Personal access token (for Actions to push commits & trigger workflow_dispatch from frontend) |

---

## Setup Steps

1. Create GitHub repo `family-wc-predictor`
2. Enable GitHub Pages from `/docs` folder (main branch)
3. Register at https://www.football-data.org/client/register → get API key
4. Create a GitHub Personal Access Token with `repo` and `actions` scope
5. Add both as repository secrets
6. Run `seed_matches.py` once to populate `data/matches.json` with FIFA 2026 schedule
7. Share the GitHub Pages URL with family

---

## Future Enhancements (not in v1)

- ADLS sync (nightly GitHub Action uploads JSON to Azure Data Lake)
- Delta table format for reporting in Databricks/Synapse
- Bonus predictions (tournament winner, golden boot, etc.)
- Group stage standings predictions
- Push notifications when results come in

---

## Constraints & Limitations

- Prediction submission has slight delay (GitHub Actions takes ~30s to run)
- Score updates are near-real-time (15 min lag max)
- Max 4 users hardcoded (trivial to add more later)
- football-data.org free tier: 10 requests/min — more than sufficient
- GitHub Actions free tier: 2000 min/month — this uses ~5 min/day max

---

## Timeline

FIFA 2026 runs June 11 – July 19, 2026. App should be deployed and tested before June 11.

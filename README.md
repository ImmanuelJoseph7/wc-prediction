# ⚽ Family WC Predictor 2026

A zero-cost FIFA World Cup 2026 prediction game for the family. Frontend on GitHub Pages, data in Supabase, scores fetched via GitHub Actions.

---

## Features

- **Predict:** Pick scores for upcoming matches (next 48 hours)
- **Leaderboard:** Auto-calculated with group/knockout/combined views
- **Breakdown:** Matrix view showing everyone's predictions vs actual results
- **Results:** Completed matches with scores, including penalty shootouts shown as `1(3) – 1(4)`
- **Penalty support:** Knockout predictions include a penalty winner pick (+3 bonus points)
- **Sign off:** Switch between users on shared devices

---

## Scoring

### Group Stage

| Outcome | Points |
|---------|--------|
| 🎯 Exact score | 7 |
| ✓ Correct outcome (wrong score) | 2 |
| ❌ Wrong outcome | 0 |

### Knockout Stage

Same as above, plus:

| Outcome | Points |
|---------|--------|
| ✓ Predicted correct advancing team (if match goes to pens) | 2 |
| 🅿️ Correct penalty winner pick | +3 |

---

## Architecture

```
GitHub Pages (frontend)
├── docs/
│   ├── index.html          ← Main app (Predict, Leaderboard, Breakdown, Results, Scoring)
│   ├── app.js              ← Frontend logic, reads/writes Supabase directly
│   ├── style.css           ← PicoCSS + custom styling
│   └── admin-preds.html    ← Admin: view all predictions
│
├── scripts/
│   └── fetch_scores.py     ← Fetches scores from API → PATCHes Supabase
│
└── .github/workflows/
    └── fetch-scores.yml    ← Cron: every 45 min during tournament

Supabase (database)
├── users (name, pin_hash)
├── matches (id, teams, scores, pen_winner, pen_home_score, pen_away_score, status)
├── predictions (user_name, match_id, scores, pen_winner)
└── metadata (key/value store)
```

---

## Data Flow

1. **Predictions:** Browser → Supabase REST API (instant upsert)
2. **Score updates:** GitHub Action → football-data.org → Supabase REST API
3. **Leaderboard:** Computed client-side from matches + predictions

---

## Tech Stack

| Component | Technology |
|-----------|-----------|
| Frontend | Vanilla HTML/CSS/JS (single page, tabbed) |
| Styling | Pico CSS + custom |
| Database | Supabase (Postgres, free tier) |
| Score Fetcher | Python script on GitHub Actions cron |
| Hosting | GitHub Pages (`/docs`) |
| Score Source | football-data.org (free tier, v4 API) |

---

## Penalty Shootout Handling

The football-data.org API includes penalty goals in `fullTime`. The fetch script derives:

```
match_score = regularTime + extraTime
pen_scores = fullTime - regularTime - extraTime
pen_winner = whoever scored more in the shootout
```

This works reliably even before the API finalizes its `winner` field.

---

## Setup

1. Create a Supabase project and run the schema SQL
2. Create a GitHub repo and push this code
3. Enable GitHub Pages from `/docs` on `main`
4. Get a free API key from [football-data.org](https://www.football-data.org/client/register)
5. Add repo secrets: `FOOTBALL_API_KEY`, `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`
6. Seed matches: `FOOTBALL_API_KEY=your_key python scripts/seed_matches.py`
7. Share the GitHub Pages URL with family!

---

## Security

- **Anon key** (in frontend): read access + prediction writes via RLS
- **Service role key** (in GitHub Action only): bypasses RLS for score updates
- **PIN auth:** SHA-256 hashed, checked client-side (simple family game)
- **Secrets:** API keys stored in GitHub repo secrets, never committed

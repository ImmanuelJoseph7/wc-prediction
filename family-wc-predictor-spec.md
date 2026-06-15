# FIFA 2026 Family Predictor — Specification

## Overview

A web app hosted on GitHub Pages where family members predict FIFA World Cup 2026 match scores. Data lives in Supabase (Postgres). Score fetching runs via a lightweight GitHub Action. Zero cost.

---

## Users

- Dynamic registration: any family member can register with "First Name + Last Initial" format and a 4-digit PIN
- PIN stored as SHA-256 hash in the database
- Currently 10 players

---

## Scoring Rules

| Outcome | Points |
|---------|--------|
| Exact score correct | 7 |
| Correct winner/draw outcome, wrong score | 2 |
| Wrong outcome | 0 |

---

## Features

### Prediction Submission
- User logs in with name + PIN
- Sees upcoming matches (next 48 hours) with score inputs
- Confirmation popup before submit
- Predictions written instantly to Supabase (upsert)
- Predictions visible to others only after match kicks off (via Breakdown tab)

### Prediction Locking
- Frontend only shows matches that haven't started yet
- Once kickoff passes, the match disappears from the predict tab

### Live Scores
- GitHub Action runs every ~45 minutes
- Fetches results from football-data.org free API
- PATCHes scores directly to Supabase
- Updates `metadata.scores_fetched_at` timestamp
- Guard: never overwrites existing scores with null (API glitch protection)

### Leaderboard
- Computed client-side from live Supabase data
- Shows: rank, name, MP (matches predicted), GC (games completed), PTS, correct winners, exact scores, recent form dots
- Legend at bottom explains abbreviations

### Breakdown Tab
- Matrix view: games as rows (most recent first), players as columns (sorted by points)
- Color-coded cells: green (exact), yellow (correct winner), red (wrong)
- Sticky game column with horizontal scroll for player columns

### Results Tab
- Completed matches with scores, grid layout (home - score - away)

### Admin
- Admin link visible only to Immanuel J after login
- `admin-preds.html`: matrix of all upcoming predictions (PIN protected)
- `admin.html`: manual score entry (legacy, reads from GitHub — to be updated)
- Database editable directly via Supabase dashboard/SQL editor

---

## Architecture

```
GitHub Pages (frontend)
│
├── docs/
│   ├── index.html               ← Main app (tabs: Predict, Leaderboard, Breakdown, Results)
│   ├── app.js                   ← Frontend logic, reads/writes Supabase directly
│   ├── style.css                ← Football-themed styling (PicoCSS + custom)
│   ├── admin-preds.html         ← Admin: view all upcoming predictions
│   └── admin.html               ← Admin: manual score entry (legacy)
│
├── scripts/
│   └── fetch_scores.py          ← Fetches scores from API → PATCHes Supabase
│
├── .github/workflows/
│   └── fetch-scores.yml         ← Scheduled: every 45 min (only active workflow)
│
├── data/                        ← Legacy JSON files (frozen snapshot, no longer used)
│
└── .env                         ← Local dev secrets (gitignored)


Supabase (database + REST API)
│
├── users (name, pin_hash, created_at)
├── matches (id, home_team, away_team, group_name, stage, kickoff, status, home_score, away_score)
├── predictions (user_name, match_id, home_score, away_score, submitted_at) [UNIQUE: user_name + match_id]
└── metadata (key, value) → stores scores_fetched_at timestamp
```

---

## Data Flow

1. **Predictions:** Browser → Supabase REST API (instant upsert)
2. **Registration:** Browser → Supabase REST API (instant insert)
3. **Reading data:** Browser → Supabase REST API (anon key, RLS enforced)
4. **Score updates:** GitHub Action → football-data.org API → Supabase REST API (service_role key)
5. **Leaderboard:** Computed client-side from matches + predictions data

---

## Tech Stack

| Component | Technology |
|-----------|-----------|
| Frontend | Vanilla HTML + CSS + JavaScript (single page, tabbed) |
| Styling | Pico CSS + custom overrides |
| Database | Supabase (Postgres) — free tier |
| API | Supabase REST API (auto-generated from schema) |
| Score Fetcher | Python script on GitHub Actions cron |
| Hosting | GitHub Pages (served from `/docs`) |
| Score Source | football-data.org (free tier) |

---

## Security

- **Anon key** (public, in frontend): allows reads + prediction inserts/updates via RLS policies
- **Service_role key** (secret, in GitHub Action): bypasses RLS for score updates
- **RLS policies:** all tables readable by anyone; predictions insertable/updatable by anyone; matches only updatable by service_role
- **PIN auth:** checked client-side against stored hash (simple family game, not high-security)

---

## Secrets

### GitHub Repository Secrets
| Secret | Purpose |
|--------|---------|
| `FOOTBALL_API_KEY` | football-data.org API key |
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_SERVICE_KEY` | Service role key (bypasses RLS) |

### No longer needed
- `ACTIONS_PAT` — was used for workflow_dispatch from frontend (removed)

---

## Supabase Project

- **URL:** https://mxmaedzsfvrugdmcjzri.supabase.co
- **Region:** (as configured)
- **Free tier limits:** 500 MB storage, unlimited API requests

---

## GitHub Actions Usage

After Supabase migration:
- Only `fetch-scores.yml` runs (~45 min intervals)
- No git commits = no Pages deployments triggered
- Each run: ~10 seconds, billed as 1 minute
- Estimated: ~30 min/month (vs ~300+ previously)

---

## Disabled Workflows
- `submit-prediction.yml` — replaced by direct Supabase writes
- `register-user.yml` — replaced by direct Supabase writes
- `admin-scores.yml` — replaced by Supabase dashboard or admin page

---

## Setup Steps (for fresh deploy)

1. Create Supabase project → run schema SQL
2. Create GitHub repo, push code
3. Enable GitHub Pages from `/docs` on `main`
4. Add secrets: `FOOTBALL_API_KEY`, `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`
5. Seed matches from football-data.org API
6. Share the GitHub Pages URL

---

## Future Enhancements

- Update `admin.html` to use Supabase (currently legacy)
- Bonus predictions (tournament winner, golden boot)
- Push notifications / auto-refresh when scores update
- Supabase Edge Function to replace GitHub Action for score fetching (fully serverless)
- Group stage standings predictions

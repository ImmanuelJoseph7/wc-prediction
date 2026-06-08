# ⚽ Family WC Predictor 2026

A zero-cost FIFA World Cup 2026 prediction game for the family, hosted entirely on GitHub Pages + GitHub Actions.

## Setup

1. Create a GitHub repo and push this code
2. Enable GitHub Pages from `/docs` on `main` branch
3. Get a free API key from [football-data.org](https://www.football-data.org/client/register)
4. Create a GitHub PAT with `repo` + `actions` scope
5. Add secrets to repo settings: `FOOTBALL_API_KEY`, `ACTIONS_PAT`
6. Update `REPO` in `docs/app.js` with your `username/repo-name`
7. Run `seed_matches.py` once:
   ```bash
   FOOTBALL_API_KEY=your_key python scripts/seed_matches.py
   ```
8. Commit & push — share the GitHub Pages URL with family!

## Scoring

| Result | Points |
|--------|--------|
| Exact score | 7 |
| Correct outcome (wrong score) | 2 |
| Wrong outcome | 0 |

## How It Works

- **Predict:** Pick scores for upcoming matches → triggers GitHub Actions workflow
- **Scores:** Auto-fetched every 15 minutes during the tournament
- **Leaderboard:** Recalculated after every score update

"""Seed matches for a game from football-data.org into Supabase matches_v2."""
import os
import requests

API_KEY = os.environ["FOOTBALL_API_KEY"]
SUPABASE_URL = os.environ.get("SUPABASE_URL", "https://mxmaedzsfvrugdmcjzri.supabase.co")
SUPABASE_KEY = os.environ["SUPABASE_SERVICE_KEY"]
HEADERS = {"apikey": SUPABASE_KEY, "Authorization": f"Bearer {SUPABASE_KEY}", "Content-Type": "application/json", "Prefer": "return=minimal"}

# Configuration
GAME_ID = 3  # Premier League 2026/27
COMPETITION = "PL"
SEASON = 2026


def main():
    # Fetch all matches from football-data.org
    resp = requests.get(
        f"https://api.football-data.org/v4/competitions/{COMPETITION}/matches?season={SEASON}",
        headers={"X-Auth-Token": API_KEY}
    )
    resp.raise_for_status()
    api_matches = resp.json()["matches"]
    print(f"Fetched {len(api_matches)} matches from football-data.org")

    # Check what's already seeded
    r = requests.get(
        f"{SUPABASE_URL}/rest/v1/matches_v2?game_id=eq.{GAME_ID}&select=external_id",
        headers={"apikey": SUPABASE_KEY, "Authorization": f"Bearer {SUPABASE_KEY}"}
    )
    existing = {m["external_id"] for m in r.json()}
    print(f"Already in DB: {len(existing)} matches")

    # Build rows for new matches
    rows = []
    for m in api_matches:
        if m["id"] in existing:
            continue
        rows.append({
            "game_id": GAME_ID,
            "external_id": m["id"],
            "home_team": m["homeTeam"]["name"],
            "away_team": m["awayTeam"]["name"],
            "group_name": None,
            "stage": m.get("stage", "REGULAR_SEASON"),
            "matchday": m.get("matchday"),
            "kickoff": m["utcDate"],
            "status": m["status"],
            "home_score": m["score"]["fullTime"]["home"],
            "away_score": m["score"]["fullTime"]["away"],
        })

    if not rows:
        print("No new matches to insert.")
        return

    # Insert in batches of 50
    batch_size = 50
    inserted = 0
    for i in range(0, len(rows), batch_size):
        batch = rows[i:i + batch_size]
        resp = requests.post(
            f"{SUPABASE_URL}/rest/v1/matches_v2",
            headers=HEADERS,
            json=batch
        )
        if resp.status_code == 201:
            inserted += len(batch)
        else:
            print(f"Error inserting batch {i}: {resp.status_code} {resp.text}")
            break

    print(f"Inserted {inserted} new matches for game_id={GAME_ID}.")


if __name__ == "__main__":
    main()

"""Fetch latest match scores from football-data.org and update Supabase."""
import os
import requests

API_KEY = os.environ["FOOTBALL_API_KEY"]
SUPABASE_URL = os.environ["SUPABASE_URL"]
SUPABASE_KEY = os.environ["SUPABASE_SERVICE_KEY"]
HEADERS = {"apikey": SUPABASE_KEY, "Authorization": f"Bearer {SUPABASE_KEY}", "Content-Type": "application/json", "Prefer": "return=minimal"}

URL = "https://api.football-data.org/v4/competitions/WC/matches?season=2026"


def main():
    resp = requests.get(URL, headers={"X-Auth-Token": API_KEY})
    resp.raise_for_status()
    api_matches = resp.json()["matches"]

    # Get current matches from Supabase
    r = requests.get(f"{SUPABASE_URL}/rest/v1/matches?select=id,status,home_score,away_score,home_team,away_team",
                     headers={"apikey": SUPABASE_KEY, "Authorization": f"Bearer {SUPABASE_KEY}"})
    local = {m["id"]: m for m in r.json()}

    updated = 0
    for api in api_matches:
        mid = api["id"]
        new_status = api["status"]
        new_home = api["score"]["fullTime"]["home"]
        new_away = api["score"]["fullTime"]["away"]
        new_home_team = api["homeTeam"]["name"]
        new_away_team = api["awayTeam"]["name"]

        if mid in local:
            match = local[mid]
            # Never overwrite existing scores with null
            if match["home_score"] is not None and new_home is None:
                continue
            if (match["status"] != new_status or match["home_score"] != new_home or
                    match["away_score"] != new_away or match["home_team"] != new_home_team or
                    match["away_team"] != new_away_team):
                payload = {"status": new_status, "home_team": new_home_team, "away_team": new_away_team}
                if new_home is not None:
                    payload["home_score"] = new_home
                    payload["away_score"] = new_away
                requests.patch(f"{SUPABASE_URL}/rest/v1/matches?id=eq.{mid}", headers=HEADERS, json=payload)
                updated += 1

    print(f"Updated {updated} match(es)." if updated else "No changes.")

    # Update last fetched timestamp
    requests.patch(f"{SUPABASE_URL}/rest/v1/metadata?key=eq.scores_fetched_at",
                   headers=HEADERS, json={"value": __import__('datetime').datetime.utcnow().isoformat() + "Z"})


if __name__ == "__main__":
    main()

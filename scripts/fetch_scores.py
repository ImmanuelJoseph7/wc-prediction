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
        score = api["score"]
        new_status = api["status"]
        new_home_team = api["homeTeam"]["name"]
        new_away_team = api["awayTeam"]["name"]

        # Determine if this is a penalty shootout match
        is_pens = score.get("duration") == "PENALTY_SHOOTOUT"

        # For penalty matches, derive scores from the components
        # fullTime includes pen goals, so: pen goals = fullTime - regularTime - extraTime
        if is_pens:
            ft_home = score["fullTime"]["home"]
            ft_away = score["fullTime"]["away"]
            rt_home = score.get("regularTime", {}).get("home")
            et_home = score.get("extraTime", {}).get("home", 0)
            rt_away = score.get("regularTime", {}).get("away")
            et_away = score.get("extraTime", {}).get("away", 0)

            # Need regularTime to derive anything useful
            if rt_home is None or ft_home is None:
                continue

            new_home = rt_home + (et_home or 0)  # Match score is 90min + extra time
            new_away = rt_away + (et_away or 0)
            new_pen_home = ft_home - rt_home - (et_home or 0)
            new_pen_away = ft_away - rt_away - (et_away or 0)

            # Winner is whoever scored more in the shootout
            if new_pen_home > new_pen_away:
                new_pen_winner = "home"
            elif new_pen_away > new_pen_home:
                new_pen_winner = "away"
            else:
                # Shouldn't happen in a valid shootout, skip until API settles
                continue
        else:
            new_home = score["fullTime"]["home"]
            new_away = score["fullTime"]["away"]
            new_pen_winner = None
            new_pen_home = None
            new_pen_away = None

        if mid in local:
            match = local[mid]
            # Never overwrite existing scores with null
            if match["home_score"] is not None and new_home is None:
                continue
            # Never overwrite existing team names with null
            if match["home_team"] is not None and new_home_team is None:
                new_home_team = match["home_team"]
            if match["away_team"] is not None and new_away_team is None:
                new_away_team = match["away_team"]
            if (match["status"] != new_status or match["home_score"] != new_home or
                    match["away_score"] != new_away or match["home_team"] != new_home_team or
                    match["away_team"] != new_away_team):
                payload = {"status": new_status}
                if new_home_team is not None:
                    payload["home_team"] = new_home_team
                if new_away_team is not None:
                    payload["away_team"] = new_away_team
                if new_home is not None:
                    payload["home_score"] = new_home
                    payload["away_score"] = new_away
                if new_pen_winner:
                    payload["pen_winner"] = new_pen_winner
                if new_pen_home is not None:
                    payload["pen_home_score"] = new_pen_home
                if new_pen_away is not None:
                    payload["pen_away_score"] = new_pen_away
                requests.patch(f"{SUPABASE_URL}/rest/v1/matches?id=eq.{mid}", headers=HEADERS, json=payload)
                updated += 1

    print(f"Updated {updated} match(es)." if updated else "No changes.")

    # Update last fetched timestamp
    from datetime import datetime, timezone
    requests.patch(f"{SUPABASE_URL}/rest/v1/metadata?key=eq.scores_fetched_at",
                   headers=HEADERS, json={"value": datetime.now(timezone.utc).isoformat()})


if __name__ == "__main__":
    main()

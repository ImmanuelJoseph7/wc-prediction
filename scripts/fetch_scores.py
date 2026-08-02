"""Fetch latest match scores from football-data.org and update Supabase."""
import os
import requests
from datetime import datetime, timezone

API_KEY = os.environ["FOOTBALL_API_KEY"]
SUPABASE_URL = os.environ["SUPABASE_URL"]
SUPABASE_KEY = os.environ["SUPABASE_SERVICE_KEY"]
HEADERS = {"apikey": SUPABASE_KEY, "Authorization": f"Bearer {SUPABASE_KEY}", "Content-Type": "application/json", "Prefer": "return=minimal"}
READ_HEADERS = {"apikey": SUPABASE_KEY, "Authorization": f"Bearer {SUPABASE_KEY}"}

API_BASE = "https://api.football-data.org/v4/competitions"


def get_active_games():
    """Get all active games from Supabase."""
    r = requests.get(
        f"{SUPABASE_URL}/rest/v1/games?status=eq.active&select=id,competition_code,season",
        headers=READ_HEADERS
    )
    return r.json()


def fetch_and_update(game):
    """Fetch scores for a game and update Supabase."""
    game_id = game["id"]
    comp_code = game["competition_code"]
    season = game["season"]

    # Fetch from football-data.org
    resp = requests.get(
        f"{API_BASE}/{comp_code}/matches?season={season}",
        headers={"X-Auth-Token": API_KEY}
    )
    resp.raise_for_status()
    api_matches = resp.json()["matches"]

    # Get current matches from Supabase (new table)
    r = requests.get(
        f"{SUPABASE_URL}/rest/v1/matches_v2?game_id=eq.{game_id}&select=id,external_id,status,home_score,away_score,home_team,away_team",
        headers=READ_HEADERS
    )
    local_by_ext = {m["external_id"]: m for m in r.json()}

    updated = 0
    for api in api_matches:
        ext_id = api["id"]
        score = api["score"]
        new_status = api["status"]
        new_home_team = api["homeTeam"]["name"]
        new_away_team = api["awayTeam"]["name"]

        # Determine if this is a penalty shootout match
        is_pens = score.get("duration") == "PENALTY_SHOOTOUT"

        # For penalty matches, derive scores from the components
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

            new_home = rt_home + (et_home or 0)
            new_away = rt_away + (et_away or 0)
            new_pen_home = ft_home - rt_home - (et_home or 0)
            new_pen_away = ft_away - rt_away - (et_away or 0)

            # Winner is whoever scored more in the shootout
            if new_pen_home > new_pen_away:
                new_pen_winner = "home"
            elif new_pen_away > new_pen_home:
                new_pen_winner = "away"
            else:
                continue
        else:
            new_home = score["fullTime"]["home"]
            new_away = score["fullTime"]["away"]
            new_pen_winner = None
            new_pen_home = None
            new_pen_away = None

        if ext_id in local_by_ext:
            match = local_by_ext[ext_id]
            internal_id = match["id"]

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
                requests.patch(
                    f"{SUPABASE_URL}/rest/v1/matches_v2?id=eq.{internal_id}",
                    headers=HEADERS, json=payload
                )
                updated += 1

    print(f"[{comp_code}] Updated {updated} match(es)." if updated else f"[{comp_code}] No changes.")

    # Update last fetched timestamp
    requests.post(
        f"{SUPABASE_URL}/rest/v1/game_metadata",
        headers={**HEADERS, "Prefer": "return=minimal,resolution=merge-duplicates"},
        json={"game_id": game_id, "key": "scores_fetched_at", "value": datetime.now(timezone.utc).isoformat()}
    )


def main():
    games = get_active_games()
    if not games:
        print("No active games.")
        return
    for game in games:
        fetch_and_update(game)


if __name__ == "__main__":
    main()

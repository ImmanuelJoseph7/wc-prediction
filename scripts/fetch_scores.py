"""Fetch latest match scores from football-data.org and update matches.json."""
import json
import os
import requests

API_KEY = os.environ["FOOTBALL_API_KEY"]
URL = "https://api.football-data.org/v4/competitions/WC/matches?season=2026"
HEADERS = {"X-Auth-Token": API_KEY}


def main():
    resp = requests.get(URL, headers=HEADERS)
    resp.raise_for_status()
    api_matches = {m["id"]: m for m in resp.json()["matches"]}

    with open("data/matches.json") as f:
        local_matches = json.load(f)

    changed = False
    local_by_id = {m["id"]: m for m in local_matches}

    for mid, api in api_matches.items():
        if mid in local_by_id:
            match = local_by_id[mid]
            new_status = api["status"]
            new_home = api["score"]["fullTime"]["home"]
            new_away = api["score"]["fullTime"]["away"]
            new_home_team = api["homeTeam"]["name"]
            new_away_team = api["awayTeam"]["name"]

            if (match["status"] != new_status or
                    match["home_score"] != new_home or
                    match["away_score"] != new_away or
                    match["home_team"] != new_home_team or
                    match["away_team"] != new_away_team):
                # Never overwrite existing scores with null
                if match["home_score"] is not None and new_home is None:
                    continue
                match["status"] = new_status
                match["home_score"] = new_home if new_home is not None else match["home_score"]
                match["away_score"] = new_away if new_away is not None else match["away_score"]
                match["home_team"] = new_home_team
                match["away_team"] = new_away_team
                changed = True
        else:
            local_matches.append({
                "id": mid,
                "home_team": api["homeTeam"]["name"],
                "away_team": api["awayTeam"]["name"],
                "group": api.get("group"),
                "stage": api["stage"],
                "datetime": api["utcDate"],
                "status": api["status"],
                "home_score": api["score"]["fullTime"]["home"],
                "away_score": api["score"]["fullTime"]["away"],
            })
            changed = True

    if changed:
        local_matches.sort(key=lambda x: x["datetime"])
        with open("data/matches.json", "w") as f:
            json.dump(local_matches, f, indent=2)
        print("Matches updated.")
    else:
        print("No changes.")


if __name__ == "__main__":
    main()

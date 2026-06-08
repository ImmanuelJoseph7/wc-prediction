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
    for match in local_matches:
        api = api_matches.get(match["id"])
        if not api:
            continue
        new_status = api["status"]
        new_home = api["score"]["fullTime"]["home"]
        new_away = api["score"]["fullTime"]["away"]

        if (match["status"] != new_status or
                match["home_score"] != new_home or
                match["away_score"] != new_away):
            match["status"] = new_status
            match["home_score"] = new_home
            match["away_score"] = new_away
            changed = True

    if changed:
        with open("data/matches.json", "w") as f:
            json.dump(local_matches, f, indent=2)
        print("Matches updated.")
    else:
        print("No changes.")


if __name__ == "__main__":
    main()

"""One-time script to seed data/matches.json from football-data.org API."""
import json
import os
import requests

API_KEY = os.environ["FOOTBALL_API_KEY"]
URL = "https://api.football-data.org/v4/competitions/WC/matches?season=2026"
HEADERS = {"X-Auth-Token": API_KEY}


def main():
    resp = requests.get(URL, headers=HEADERS)
    resp.raise_for_status()
    data = resp.json()

    matches = []
    for m in data["matches"]:
        matches.append({
            "id": m["id"],
            "home_team": m["homeTeam"]["name"],
            "away_team": m["awayTeam"]["name"],
            "group": m.get("group"),
            "stage": m["stage"],
            "datetime": m["utcDate"],
            "status": m["status"],
            "home_score": m["score"]["fullTime"]["home"],
            "away_score": m["score"]["fullTime"]["away"],
        })

    matches.sort(key=lambda x: x["datetime"])

    with open("data/matches.json", "w") as f:
        json.dump(matches, f, indent=2)

    print(f"Seeded {len(matches)} matches.")


if __name__ == "__main__":
    main()

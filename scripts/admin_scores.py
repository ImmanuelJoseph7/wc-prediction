"""Apply manually entered scores to matches.json."""
import json
import os

scores = json.loads(os.environ["INPUT_SCORES"])

with open("data/matches.json") as f:
    matches = json.load(f)

by_id = {m["id"]: m for m in matches}

for s in scores:
    m = by_id.get(s["match_id"])
    if m:
        m["home_score"] = s["home_score"]
        m["away_score"] = s["away_score"]
        m["status"] = "FINISHED"

with open("data/matches.json", "w") as f:
    json.dump(matches, f, indent=2)

print(f"Updated {len(scores)} match(es).")

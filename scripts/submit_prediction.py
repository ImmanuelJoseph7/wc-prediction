"""Validate and save a prediction submission."""
import json
import hashlib
import sys
import os
from datetime import datetime, timezone

user = os.environ["INPUT_USER"]
pin = os.environ["INPUT_PIN"]
preds_raw = os.environ["INPUT_PREDICTIONS"]

# Validate PIN
with open("data/users.json") as f:
    users = json.load(f)
user_rec = next((u for u in users if u["name"] == user), None)
if not user_rec:
    print(f"User {user} not found")
    sys.exit(1)
pin_hash = hashlib.sha256(pin.encode()).hexdigest()
if user_rec["pin_hash"] != pin_hash:
    print("Invalid PIN")
    sys.exit(1)

# Validate match times
with open("data/matches.json") as f:
    matches = {m["id"]: m for m in json.load(f)}
now = datetime.now(timezone.utc).isoformat()
new_preds = json.loads(preds_raw)
for p in new_preds:
    m = matches.get(p["match_id"])
    if not m:
        print(f"Match {p['match_id']} not found")
        sys.exit(1)
    if m["datetime"] <= now:
        print(f"Match {p['match_id']} already started")
        sys.exit(1)

# Merge predictions
with open("data/predictions.json") as f:
    all_preds = json.load(f)
existing_keys = {p["match_id"] for p in new_preds}
all_preds = [p for p in all_preds if not (p["user"] == user and p["match_id"] in existing_keys)]
for p in new_preds:
    all_preds.append({
        "user": user,
        "match_id": p["match_id"],
        "home_score": p["home_score"],
        "away_score": p["away_score"],
        "submitted_at": datetime.now(timezone.utc).isoformat(),
    })
with open("data/predictions.json", "w") as f:
    json.dump(all_preds, f, indent=2)
print(f"Saved {len(new_preds)} predictions for {user}.")

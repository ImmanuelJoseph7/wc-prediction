"""Seed Supabase from existing JSON data files.

Usage: 
  SUPABASE_URL=https://xxx.supabase.co SUPABASE_SERVICE_KEY=eyJ... python seed_supabase.py

Uses the service_role key (not anon) to bypass RLS.
"""
import json
import os
import requests

SUPABASE_URL = os.environ["SUPABASE_URL"]
SUPABASE_KEY = os.environ["SUPABASE_SERVICE_KEY"]
HEADERS = {"apikey": SUPABASE_KEY, "Authorization": f"Bearer {SUPABASE_KEY}", "Content-Type": "application/json", "Prefer": "return=minimal"}

def post(table, data):
    r = requests.post(f"{SUPABASE_URL}/rest/v1/{table}", headers=HEADERS, json=data)
    if r.status_code not in (200, 201):
        print(f"Error inserting {table}: {r.status_code} {r.text}")
    return r

# Seed users
with open("data/users.json") as f:
    users = json.load(f)
rows = [{"name": u["name"], "pin_hash": u["pin_hash"], "created_at": u["created_at"]} for u in users]
post("users", rows)
print(f"Seeded {len(rows)} users")

# Seed matches
with open("data/matches.json") as f:
    matches = json.load(f)
rows = [{"id": m["id"], "home_team": m["home_team"], "away_team": m["away_team"],
         "group_name": m.get("group"), "stage": m["stage"], "kickoff": m["datetime"],
         "status": m["status"], "home_score": m["home_score"], "away_score": m["away_score"]} for m in matches]
post("matches", rows)
print(f"Seeded {len(rows)} matches")

# Seed predictions
with open("data/predictions.json") as f:
    predictions = json.load(f)
rows = [{"user_name": p["user"], "match_id": p["match_id"], "home_score": p["home_score"],
         "away_score": p["away_score"], "submitted_at": p.get("submitted_at")} for p in predictions]
# Batch in chunks of 100
for i in range(0, len(rows), 100):
    post("predictions", rows[i:i+100])
print(f"Seeded {len(rows)} predictions")

print("Done!")

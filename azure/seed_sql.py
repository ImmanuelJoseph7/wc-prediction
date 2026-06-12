"""Seed Azure SQL from existing JSON data files.

Usage: SQL_CONNECTION_STRING="..." python seed_sql.py
"""
import json
import os
import pyodbc

conn = pyodbc.connect(os.environ["SQL_CONNECTION_STRING"])
cursor = conn.cursor()

# Seed users
with open("data/users.json") as f:
    users = json.load(f)
for u in users:
    cursor.execute("INSERT INTO users (name, pin_hash, created_at) VALUES (?, ?, ?)",
                   u["name"], u["pin_hash"], u["created_at"])

# Seed matches
with open("data/matches.json") as f:
    matches = json.load(f)
for m in matches:
    cursor.execute(
        "INSERT INTO matches (id, home_team, away_team, group_name, stage, kickoff, status, home_score, away_score) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
        m["id"], m["home_team"], m["away_team"], m.get("group"), m["stage"], m["datetime"], m["status"], m["home_score"], m["away_score"])

# Seed predictions
with open("data/predictions.json") as f:
    predictions = json.load(f)
for p in predictions:
    cursor.execute(
        "INSERT INTO predictions (user_name, match_id, home_score, away_score, submitted_at) VALUES (?, ?, ?, ?, ?)",
        p["user"], p["match_id"], p["home_score"], p["away_score"], p.get("submitted_at"))

conn.commit()
conn.close()
print(f"Seeded {len(users)} users, {len(matches)} matches, {len(predictions)} predictions.")

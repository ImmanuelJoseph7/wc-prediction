"""Azure Functions for WC Prediction app."""
import json
import hashlib
import os
import azure.functions as func
import pyodbc
import requests

app = func.FunctionApp(http_auth_level=func.AuthLevel.ANONYMOUS)

def get_conn():
    return pyodbc.connect(os.environ["SQL_CONNECTION_STRING"])


@app.route(route="matches", methods=["GET"])
def get_matches(req: func.HttpRequest) -> func.HttpResponse:
    """Return all matches."""
    with get_conn() as conn:
        rows = conn.execute(
            "SELECT id, home_team, away_team, group_name, stage, kickoff, status, home_score, away_score FROM matches ORDER BY kickoff"
        ).fetchall()
    matches = [{"id": r[0], "home_team": r[1], "away_team": r[2], "group": r[3], "stage": r[4],
                "datetime": r[5].isoformat() + "Z", "status": r[6], "home_score": r[7], "away_score": r[8]} for r in rows]
    return func.HttpResponse(json.dumps(matches), mimetype="application/json",
                             headers={"Access-Control-Allow-Origin": "*"})


@app.route(route="predictions", methods=["GET"])
def get_predictions(req: func.HttpRequest) -> func.HttpResponse:
    """Return all predictions."""
    with get_conn() as conn:
        rows = conn.execute(
            "SELECT user_name, match_id, home_score, away_score, submitted_at FROM predictions"
        ).fetchall()
    preds = [{"user": r[0], "match_id": r[1], "home_score": r[2], "away_score": r[3],
              "submitted_at": r[4].isoformat() + "Z"} for r in rows]
    return func.HttpResponse(json.dumps(preds), mimetype="application/json",
                             headers={"Access-Control-Allow-Origin": "*"})


@app.route(route="users", methods=["GET"])
def get_users(req: func.HttpRequest) -> func.HttpResponse:
    """Return all users (names only)."""
    with get_conn() as conn:
        rows = conn.execute("SELECT name FROM users ORDER BY name").fetchall()
    users = [{"name": r[0]} for r in rows]
    return func.HttpResponse(json.dumps(users), mimetype="application/json",
                             headers={"Access-Control-Allow-Origin": "*"})


@app.route(route="submit", methods=["POST"])
def submit_prediction(req: func.HttpRequest) -> func.HttpResponse:
    """Submit predictions for a user."""
    body = req.get_json()
    user = body["user"]
    pin = body["pin"]
    predictions = body["predictions"]

    pin_hash = hashlib.sha256(pin.encode()).hexdigest()
    with get_conn() as conn:
        row = conn.execute("SELECT pin_hash FROM users WHERE name = ?", user).fetchone()
        if not row or row[0] != pin_hash:
            return func.HttpResponse(json.dumps({"error": "Invalid credentials"}), status_code=401,
                                     mimetype="application/json", headers={"Access-Control-Allow-Origin": "*"})

        for p in predictions:
            conn.execute("""
                MERGE predictions AS t
                USING (SELECT ? AS user_name, ? AS match_id) AS s
                ON t.user_name = s.user_name AND t.match_id = s.match_id
                WHEN MATCHED THEN UPDATE SET home_score = ?, away_score = ?, submitted_at = GETUTCDATE()
                WHEN NOT MATCHED THEN INSERT (user_name, match_id, home_score, away_score) VALUES (?, ?, ?, ?);
            """, user, p["match_id"], p["home_score"], p["away_score"],
                user, p["match_id"], p["home_score"], p["away_score"])
        conn.commit()

    return func.HttpResponse(json.dumps({"ok": True}), mimetype="application/json",
                             headers={"Access-Control-Allow-Origin": "*"})


@app.route(route="register", methods=["POST"])
def register_user(req: func.HttpRequest) -> func.HttpResponse:
    """Register a new user."""
    body = req.get_json()
    name = body["name"]
    pin_hash = body["pin_hash"]

    with get_conn() as conn:
        existing = conn.execute("SELECT 1 FROM users WHERE name = ?", name).fetchone()
        if existing:
            return func.HttpResponse(json.dumps({"error": "Name taken"}), status_code=409,
                                     mimetype="application/json", headers={"Access-Control-Allow-Origin": "*"})
        conn.execute("INSERT INTO users (name, pin_hash) VALUES (?, ?)", name, pin_hash)
        conn.commit()

    return func.HttpResponse(json.dumps({"ok": True}), mimetype="application/json",
                             headers={"Access-Control-Allow-Origin": "*"})


@app.route(route="leaderboard", methods=["GET"])
def get_leaderboard(req: func.HttpRequest) -> func.HttpResponse:
    """Compute and return leaderboard."""
    with get_conn() as conn:
        rows = conn.execute("""
            SELECT p.user_name, p.match_id, p.home_score AS ph, p.away_score AS pa,
                   m.home_score AS mh, m.away_score AS ma
            FROM predictions p
            JOIN matches m ON p.match_id = m.id
            WHERE m.status = 'FINISHED' AND m.home_score IS NOT NULL
        """).fetchall()

    from collections import defaultdict
    stats = defaultdict(lambda: {"total_points": 0, "correct_winners": 0, "exact_scores": 0,
                                  "predictions_made": 0, "games_played": 0, "match_results": []})

    # Count total predictions per user
    with get_conn() as conn:
        pred_counts = conn.execute("SELECT user_name, COUNT(*) FROM predictions GROUP BY user_name").fetchall()
    for r in pred_counts:
        stats[r[0]]["predictions_made"] = r[1]

    for r in rows:
        user, match_id, ph, pa, mh, ma = r
        stats[user]["games_played"] += 1
        if ph == mh and pa == ma:
            pts = 7
            stats[user]["exact_scores"] += 1
            stats[user]["correct_winners"] += 1
        elif (ph > pa) == (mh > ma) and (ph < pa) == (mh < ma) and (ph == pa) == (mh == ma):
            pts = 2
            stats[user]["correct_winners"] += 1
        else:
            pts = 0
        stats[user]["total_points"] += pts
        stats[user]["match_results"].append({
            "match_id": match_id, "prediction": f"{ph}-{pa}", "actual": f"{mh}-{ma}", "points": pts
        })

    # Include users with no predictions
    with get_conn() as conn:
        all_users = conn.execute("SELECT name FROM users").fetchall()
    for r in all_users:
        if r[0] not in stats:
            stats[r[0]] = {"total_points": 0, "correct_winners": 0, "exact_scores": 0,
                           "predictions_made": 0, "games_played": 0, "match_results": []}

    leaderboard = [{"user": k, **v} for k, v in stats.items()]
    leaderboard.sort(key=lambda x: x["total_points"], reverse=True)

    return func.HttpResponse(json.dumps(leaderboard), mimetype="application/json",
                             headers={"Access-Control-Allow-Origin": "*"})


@app.route(route="admin/scores", methods=["POST"])
def admin_scores(req: func.HttpRequest) -> func.HttpResponse:
    """Admin: manually set match scores."""
    body = req.get_json()
    scores = body["scores"]
    with get_conn() as conn:
        for s in scores:
            conn.execute("UPDATE matches SET home_score = ?, away_score = ?, status = 'FINISHED' WHERE id = ?",
                         s["home_score"], s["away_score"], s["match_id"])
        conn.commit()
    return func.HttpResponse(json.dumps({"ok": True}), mimetype="application/json",
                             headers={"Access-Control-Allow-Origin": "*"})


@app.timer_trigger(schedule="0 */45 * * * *", arg_name="timer")
def fetch_scores(timer: func.TimerRequest) -> None:
    """Fetch scores from football-data.org every 45 minutes."""
    api_key = os.environ["FOOTBALL_API_KEY"]
    resp = requests.get("https://api.football-data.org/v4/competitions/WC/matches?season=2026",
                        headers={"X-Auth-Token": api_key})
    resp.raise_for_status()
    api_matches = resp.json()["matches"]

    with get_conn() as conn:
        for m in api_matches:
            conn.execute("""
                UPDATE matches SET status = ?, home_score = ?, away_score = ?, home_team = ?, away_team = ?
                WHERE id = ? AND (status != ? OR home_score != ? OR away_score != ? OR home_team != ? OR away_team != ?)
            """, m["status"], m["score"]["fullTime"]["home"], m["score"]["fullTime"]["away"],
                m["homeTeam"]["name"], m["awayTeam"]["name"],
                m["id"], m["status"], m["score"]["fullTime"]["home"], m["score"]["fullTime"]["away"],
                m["homeTeam"]["name"], m["awayTeam"]["name"])
        conn.commit()

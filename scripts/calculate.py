"""Calculate points and generate leaderboard.json from matches and predictions."""
import json

USERS = ["Dad", "Mum", "Boy", "Girl"]


def outcome(home, away):
    if home > away:
        return "H"
    if away > home:
        return "A"
    return "D"


def score_prediction(pred_home, pred_away, actual_home, actual_away):
    if pred_home == actual_home and pred_away == actual_away:
        return 7
    if outcome(pred_home, pred_away) == outcome(actual_home, actual_away):
        return 2
    return 0


def main():
    with open("data/matches.json") as f:
        matches = {m["id"]: m for m in json.load(f)}
    with open("data/predictions.json") as f:
        predictions = json.load(f)

    leaderboard = []
    for user in USERS:
        user_preds = [p for p in predictions if p["user"] == user]
        total = 0
        correct_winners = 0
        exact_scores = 0
        match_results = []

        for p in user_preds:
            m = matches.get(p["match_id"])
            if not m or m["status"] != "FINISHED":
                continue
            pts = score_prediction(
                p["home_score"], p["away_score"],
                m["home_score"], m["away_score"]
            )
            total += pts
            if pts == 7:
                exact_scores += 1
            if pts >= 2:
                correct_winners += 1
            match_results.append({
                "match_id": p["match_id"],
                "prediction": f"{p['home_score']}-{p['away_score']}",
                "actual": f"{m['home_score']}-{m['away_score']}",
                "points": pts,
            })

        leaderboard.append({
            "user": user,
            "total_points": total,
            "correct_winners": correct_winners,
            "exact_scores": exact_scores,
            "predictions_made": len(user_preds),
            "match_results": match_results,
        })

    leaderboard.sort(key=lambda x: x["total_points"], reverse=True)

    with open("data/leaderboard.json", "w") as f:
        json.dump(leaderboard, f, indent=2)

    print("Leaderboard updated.")


if __name__ == "__main__":
    main()

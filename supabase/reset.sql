-- Reset and recreate (paste in Supabase SQL Editor)
DROP TABLE IF EXISTS predictions;
DROP TABLE IF EXISTS matches;
DROP TABLE IF EXISTS users;

CREATE TABLE users (
    name TEXT PRIMARY KEY,
    pin_hash TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE matches (
    id INT PRIMARY KEY,
    home_team TEXT,
    away_team TEXT,
    group_name TEXT,
    stage TEXT NOT NULL,
    kickoff TIMESTAMPTZ NOT NULL,
    status TEXT NOT NULL DEFAULT 'TIMED',
    home_score INT,
    away_score INT
);

CREATE TABLE predictions (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_name TEXT NOT NULL REFERENCES users(name),
    match_id INT NOT NULL REFERENCES matches(id),
    home_score INT NOT NULL,
    away_score INT NOT NULL,
    submitted_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE (user_name, match_id)
);

CREATE INDEX idx_predictions_match ON predictions(match_id);
CREATE INDEX idx_predictions_user ON predictions(user_name);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE predictions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read users" ON users FOR SELECT USING (true);
CREATE POLICY "Anyone can read matches" ON matches FOR SELECT USING (true);
CREATE POLICY "Anyone can read predictions" ON predictions FOR SELECT USING (true);
CREATE POLICY "Anyone can register" ON users FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can insert predictions" ON predictions FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update predictions" ON predictions FOR UPDATE USING (true);
CREATE POLICY "Service role updates matches" ON matches FOR INSERT WITH CHECK (true);
CREATE POLICY "Service role updates matches scores" ON matches FOR UPDATE USING (true);

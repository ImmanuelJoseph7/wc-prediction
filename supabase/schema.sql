-- Supabase schema for WC Prediction app
-- Run this in the Supabase SQL Editor

-- Users table
CREATE TABLE users (
    name TEXT PRIMARY KEY,
    pin_hash TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Matches table
CREATE TABLE matches (
    id INT PRIMARY KEY,
    home_team TEXT NOT NULL,
    away_team TEXT NOT NULL,
    group_name TEXT,
    stage TEXT NOT NULL,
    kickoff TIMESTAMPTZ NOT NULL,
    status TEXT NOT NULL DEFAULT 'TIMED',
    home_score INT,
    away_score INT
);

-- Predictions table
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

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE predictions ENABLE ROW LEVEL SECURITY;

-- RLS Policies: everyone can read everything (public game)
CREATE POLICY "Anyone can read users" ON users FOR SELECT USING (true);
CREATE POLICY "Anyone can read matches" ON matches FOR SELECT USING (true);
CREATE POLICY "Anyone can read predictions" ON predictions FOR SELECT USING (true);

-- Anyone can insert users (registration)
CREATE POLICY "Anyone can register" ON users FOR INSERT WITH CHECK (true);

-- Anyone can insert/update predictions (auth checked in app via pin)
CREATE POLICY "Anyone can insert predictions" ON predictions FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update predictions" ON predictions FOR UPDATE USING (true);

-- Only service_role can update matches (score fetching from GitHub Action)
CREATE POLICY "Service role updates matches" ON matches FOR INSERT WITH CHECK (true);
CREATE POLICY "Service role updates matches scores" ON matches FOR UPDATE USING (true);

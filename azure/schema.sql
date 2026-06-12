-- Azure SQL schema for WC Prediction app

CREATE TABLE users (
    id INT IDENTITY(1,1) PRIMARY KEY,
    name NVARCHAR(50) NOT NULL UNIQUE,
    pin_hash NVARCHAR(64) NOT NULL,
    created_at DATETIME2 DEFAULT GETUTCDATE()
);

CREATE TABLE matches (
    id INT PRIMARY KEY,  -- football-data.org match ID
    home_team NVARCHAR(50) NOT NULL,
    away_team NVARCHAR(50) NOT NULL,
    group_name NVARCHAR(20),
    stage NVARCHAR(30) NOT NULL,
    kickoff DATETIME2 NOT NULL,
    status NVARCHAR(20) NOT NULL DEFAULT 'TIMED',
    home_score INT NULL,
    away_score INT NULL
);

CREATE TABLE predictions (
    id INT IDENTITY(1,1) PRIMARY KEY,
    user_name NVARCHAR(50) NOT NULL,
    match_id INT NOT NULL,
    home_score INT NOT NULL,
    away_score INT NOT NULL,
    submitted_at DATETIME2 DEFAULT GETUTCDATE(),
    CONSTRAINT FK_predictions_match FOREIGN KEY (match_id) REFERENCES matches(id),
    CONSTRAINT UQ_user_match UNIQUE (user_name, match_id)
);

CREATE INDEX IX_predictions_match ON predictions(match_id);
CREATE INDEX IX_predictions_user ON predictions(user_name);
CREATE INDEX IX_matches_status ON matches(status);

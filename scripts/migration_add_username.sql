-- Migration: Add username field to users table
-- Usernames are the display name with spaces removed (e.g. "Samuel G" -> "SamuelG")

-- 1. Add the column (nullable initially so we can populate it first)
ALTER TABLE users ADD COLUMN IF NOT EXISTS username TEXT;

-- 2. Populate from existing names
UPDATE users SET username = REPLACE(name, ' ', '') WHERE username IS NULL;

-- 3. Add unique + not null constraints
ALTER TABLE users ALTER COLUMN username SET NOT NULL;
ALTER TABLE users ADD CONSTRAINT users_username_unique UNIQUE (username);

-- 4. (Optional) Add index for fast login lookups
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);

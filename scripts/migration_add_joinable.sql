-- Migration: Add joinable flag to games table
ALTER TABLE games ADD COLUMN IF NOT EXISTS joinable boolean NOT NULL DEFAULT false;

-- Set PL as joinable now (WC is completed, leave as false)
UPDATE games SET joinable = true WHERE competition_code = 'PL';

-- RLS: allow anon to update joinable column on games
-- (admin page is PIN-protected client-side; acceptable for a family app)
CREATE POLICY "allow anon update joinable" ON games
  FOR UPDATE TO anon
  USING (true)
  WITH CHECK (true);

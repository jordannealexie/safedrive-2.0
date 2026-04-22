-- ============================================================
-- SafeDrive 2.0 — Prototype Snapshots Schema Migration
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor → New Query)
-- ============================================================

-- 1. Create prototype_snapshots table
CREATE TABLE IF NOT EXISTS prototype_snapshots (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id        TEXT NOT NULL,
  session_id       TEXT,
  captured_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  ear_value        REAL,
  drowsiness_state TEXT,
  is_moving        BOOLEAN DEFAULT false,
  speed_kmh        REAL,
  gps_lat          REAL,
  gps_lon          REAL,
  fps              REAL,
  image_url        TEXT,
  source           TEXT NOT NULL DEFAULT 'live',
  pi_hostname      TEXT DEFAULT 'raspi4b',
  raw_payload      JSONB,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE(driver_id, captured_at)
);

-- 2. Indexes for fast queries
CREATE INDEX IF NOT EXISTS idx_snapshots_driver
  ON prototype_snapshots(driver_id, captured_at DESC);

CREATE INDEX IF NOT EXISTS idx_snapshots_session
  ON prototype_snapshots(session_id);

CREATE INDEX IF NOT EXISTS idx_snapshots_source
  ON prototype_snapshots(source);

-- 3. Enable REPLICA IDENTITY FULL for Supabase Realtime
ALTER TABLE prototype_snapshots REPLICA IDENTITY FULL;

-- 4. View: latest snapshot per driver (single-row fast lookup)
CREATE OR REPLACE VIEW latest_driver_snapshot AS
SELECT DISTINCT ON (driver_id)
  id, driver_id, session_id, captured_at, ear_value,
  drowsiness_state, is_moving, speed_kmh, gps_lat, gps_lon,
  fps, image_url, source, raw_payload, created_at
FROM prototype_snapshots
ORDER BY driver_id, captured_at DESC;

-- 5. RLS policies
ALTER TABLE prototype_snapshots ENABLE ROW LEVEL SECURITY;

-- Service role (Pi backend) has full access
CREATE POLICY "service_role_full_access"
  ON prototype_snapshots FOR ALL
  USING (true) WITH CHECK (true);

-- Anon/authenticated role can read
CREATE POLICY "anon_read_snapshots"
  ON prototype_snapshots FOR SELECT
  USING (true);

-- 6. Add to Supabase Realtime publication
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE prototype_snapshots;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================
-- Migration complete! Verify with:
--   SELECT * FROM prototype_snapshots LIMIT 1;
--   SELECT * FROM latest_driver_snapshot;
-- ============================================================

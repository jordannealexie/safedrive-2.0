-- SafeDrive 2.0 Supabase Schema
-- Tables designed to match the prototype's domain.py data model

-- Drivers table
CREATE TABLE IF NOT EXISTS drivers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL DEFAULT '',
    bus_id TEXT NOT NULL DEFAULT 'BUS-001',
    status TEXT NOT NULL DEFAULT 'Normal',
    last_alert TEXT DEFAULT 'N/A',
    risk_level TEXT NOT NULL DEFAULT 'Low',
    face_registered BOOLEAN DEFAULT TRUE,
    face_registered_at TEXT,
    total_sessions INTEGER DEFAULT 0,
    today_work_hours REAL DEFAULT 0.0,
    today_sessions INTEGER DEFAULT 0,
    detection_status TEXT DEFAULT 'monitoring',
    baseline_status TEXT DEFAULT 'learned',
    baseline_confidence INTEGER DEFAULT 80,
    first_seen TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Alerts table
CREATE TABLE IF NOT EXISTS alerts (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL,
    driver TEXT NOT NULL,
    bus TEXT NOT NULL DEFAULT 'BUS-001',
    timestamp TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'Active',
    severity TEXT NOT NULL DEFAULT 'Medium',
    ear_value REAL DEFAULT 0.0,
    alarm_type TEXT DEFAULT 'buzzer_oled',
    session_id TEXT DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sessions table
CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    driver_id TEXT NOT NULL,
    driver TEXT NOT NULL,
    bus_id TEXT NOT NULL DEFAULT 'BUS-001',
    start_time TEXT,
    end_time TEXT,
    status TEXT NOT NULL DEFAULT 'active',
    alert_count INTEGER DEFAULT 0,
    drowsiness_events INTEGER DEFAULT 0,
    start_timestamp REAL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Event statistics (hourly and daily counts)
CREATE TABLE IF NOT EXISTS event_stats (
    id SERIAL PRIMARY KEY,
    stat_type TEXT NOT NULL,  -- 'hourly' or 'daily'
    stat_key INTEGER NOT NULL,  -- hour (0-23) or weekday (0-6)
    count INTEGER NOT NULL DEFAULT 0,
    UNIQUE(stat_type, stat_key)
);

-- Settings table (single row)
CREATE TABLE IF NOT EXISTS settings (
    id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
    data JSONB NOT NULL DEFAULT '{}'::jsonb,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Disable RLS for prototype (simpler, no auth needed)
ALTER TABLE drivers DISABLE ROW LEVEL SECURITY;
ALTER TABLE alerts DISABLE ROW LEVEL SECURITY;
ALTER TABLE sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE event_stats DISABLE ROW LEVEL SECURITY;
ALTER TABLE settings DISABLE ROW LEVEL SECURITY;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_alerts_driver ON alerts(driver);
CREATE INDEX IF NOT EXISTS idx_alerts_created ON alerts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sessions_driver ON sessions(driver_id);
CREATE INDEX IF NOT EXISTS idx_sessions_status ON sessions(status);

-- Driver notes table (admin notes per driver)
CREATE TABLE IF NOT EXISTS driver_notes (
    driver_id TEXT PRIMARY KEY REFERENCES drivers(id) ON DELETE CASCADE,
    content TEXT NOT NULL DEFAULT '',
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE driver_notes DISABLE ROW LEVEL SECURITY;

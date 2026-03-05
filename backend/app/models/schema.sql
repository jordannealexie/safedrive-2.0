-- backend/app/models/schema.sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role VARCHAR(50) CHECK (role IN ('admin', 'operator')) DEFAULT 'operator',
    hashed_password TEXT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE drivers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    driver_code VARCHAR(50) UNIQUE NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(50),
    license_number VARCHAR(100),
    profile_image_url TEXT,
    risk_level VARCHAR(20) CHECK (risk_level IN ('low', 'medium', 'high')) DEFAULT 'low',
    total_alerts INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    INDEX idx_driver_risk (risk_level),
    INDEX idx_driver_active (is_active)
);

CREATE TABLE buses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bus_id VARCHAR(100) UNIQUE NOT NULL,
    plate_number VARCHAR(50) UNIQUE NOT NULL,
    model VARCHAR(100),
    capacity INTEGER,
    device_id VARCHAR(100),
    device_status VARCHAR(20) CHECK (device_status IN ('online', 'offline', 'maintenance')) DEFAULT 'offline',
    current_driver_id UUID REFERENCES drivers(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    INDEX idx_bus_device_status (device_status)
);

CREATE TABLE devices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    device_serial VARCHAR(100) UNIQUE NOT NULL,
    bus_id UUID REFERENCES buses(id) ON DELETE CASCADE,
    camera_status VARCHAR(20) DEFAULT 'operational',
    gps_status VARCHAR(20) DEFAULT 'operational',
    power_source VARCHAR(20),
    firmware_version VARCHAR(50),
    last_heartbeat TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE location_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bus_id UUID REFERENCES buses(id) ON DELETE CASCADE,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    speed DECIMAL(5, 2),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    INDEX idx_location_bus_time (bus_id, timestamp DESC)
);

CREATE TABLE alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    alert_type VARCHAR(50) CHECK (alert_type IN ('drowsy', 'continuous_drowsy', 'device_offline', 'other')),
    driver_id UUID REFERENCES drivers(id) ON DELETE SET NULL,
    bus_id UUID REFERENCES buses(id) ON DELETE SET NULL,
    severity VARCHAR(20) CHECK (severity IN ('low', 'medium', 'high')) DEFAULT 'medium',
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    status VARCHAR(20) CHECK (status IN ('pending', 'acknowledged', 'resolved', 'ignored')) DEFAULT 'pending',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    resolved_at TIMESTAMP WITH TIME ZONE,
    INDEX idx_alert_status (status),
    INDEX idx_alert_created (created_at DESC)
);

CREATE TABLE driver_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    driver_id UUID REFERENCES drivers(id) ON DELETE CASCADE,
    bus_id UUID REFERENCES buses(id) ON DELETE SET NULL,
    start_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    end_time TIMESTAMP WITH TIME ZONE,
    alert_count INTEGER DEFAULT 0
);
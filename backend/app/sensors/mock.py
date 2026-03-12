"""Mock sensor implementations for testing without physical hardware."""

import math
import random
import time
from datetime import datetime, timezone

from app.models.schemas import GPSReading, AccelReading, BuzzerStatus, OLEDStatus

# --- Mutable state ---
_mock_gps = GPSReading(
    latitude=14.5995,
    longitude=120.9842,
    altitude=12.5,
    speed_kmh=45.0,
    fix=True,
    satellites=8,
    timestamp=datetime.now(timezone.utc),
)

_mock_accel = AccelReading(
    ax=0.05, ay=-0.02, az=1.01,
    magnitude=1.01, is_moving=False,
    timestamp=datetime.now(timezone.utc),
)

_buzzer_active = False
_buzzer_last_triggered: datetime | None = None

_oled_lines: list[str] = ["SafeDrive Ready"]
_oled_last_updated = datetime.now(timezone.utc)


# --- GPS ---

def gps_read() -> GPSReading:
    global _mock_gps
    # Simulate small drift
    _mock_gps = GPSReading(
        latitude=_mock_gps.latitude + random.uniform(-0.0001, 0.0001),
        longitude=_mock_gps.longitude + random.uniform(-0.0001, 0.0001),
        altitude=_mock_gps.altitude + random.uniform(-0.5, 0.5),
        speed_kmh=max(0, _mock_gps.speed_kmh + random.uniform(-2, 2)),
        fix=True,
        satellites=random.randint(6, 12),
        timestamp=datetime.now(timezone.utc),
    )
    return _mock_gps


def gps_set(lat: float, lon: float, alt: float = 0.0, speed: float = 0.0):
    global _mock_gps
    _mock_gps = GPSReading(
        latitude=lat, longitude=lon, altitude=alt,
        speed_kmh=speed, fix=True, satellites=8,
        timestamp=datetime.now(timezone.utc),
    )


# --- Accelerometer ---

def accel_read() -> AccelReading:
    global _mock_accel
    ax = random.uniform(-0.1, 0.1)
    ay = random.uniform(-0.1, 0.1)
    az = 1.0 + random.uniform(-0.05, 0.05)
    mag = math.sqrt(ax**2 + ay**2 + az**2)
    # If GPS speed > 5 km/h, simulate motion with higher magnitude
    if _mock_gps.speed_kmh and _mock_gps.speed_kmh > 5:
        ax += random.uniform(0.15, 0.35)
        mag = math.sqrt(ax**2 + ay**2 + az**2)
    _mock_accel = AccelReading(
        ax=round(ax, 4), ay=round(ay, 4), az=round(az, 4),
        magnitude=round(mag, 4),
        is_moving=mag > 1.2,
        timestamp=datetime.now(timezone.utc),
    )
    return _mock_accel


def accel_set(ax: float, ay: float, az: float):
    global _mock_accel
    mag = math.sqrt(ax**2 + ay**2 + az**2)
    _mock_accel = AccelReading(
        ax=ax, ay=ay, az=az, magnitude=round(mag, 4),
        is_moving=mag > 1.2,
        timestamp=datetime.now(timezone.utc),
    )


def accel_is_moving() -> bool:
    return _mock_accel.is_moving


# --- Buzzer ---

def buzzer_buzz(duration_ms: int = 500, check_moving_fn=None) -> BuzzerStatus:
    global _buzzer_active, _buzzer_last_triggered
    if check_moving_fn and not check_moving_fn():
        return BuzzerStatus(
            active=False, last_triggered=_buzzer_last_triggered,
            suppressed=True,
            suppression_reason="Bus stationary — alarm suppressed",
        )
    _buzzer_active = True
    _buzzer_last_triggered = datetime.now(timezone.utc)
    time.sleep(min(duration_ms, 100) / 1000.0)  # Short sleep in mock
    _buzzer_active = False
    return BuzzerStatus(active=False, last_triggered=_buzzer_last_triggered)


def buzzer_stop():
    global _buzzer_active
    _buzzer_active = False


def buzzer_is_active() -> bool:
    return _buzzer_active


# --- OLED ---

def oled_show(line1: str = "", line2: str = "", line3: str = ""):
    global _oled_lines, _oled_last_updated
    _oled_lines = [l for l in [line1, line2, line3] if l]
    if not _oled_lines:
        _oled_lines = ["SafeDrive Ready"]
    _oled_last_updated = datetime.now(timezone.utc)


def oled_show_alert(alert_type: str, severity: str = "medium"):
    global _oled_lines, _oled_last_updated
    icon = "!!" if severity == "high" else "!"
    _oled_lines = [f"[{icon}] ALERT", alert_type, f"Severity: {severity.upper()}"]
    _oled_last_updated = datetime.now(timezone.utc)


def oled_clear():
    global _oled_lines, _oled_last_updated
    _oled_lines = []
    _oled_last_updated = datetime.now(timezone.utc)


def oled_get_status() -> OLEDStatus:
    return OLEDStatus(
        current_message=" | ".join(_oled_lines) if _oled_lines else "SafeDrive Ready",
        lines=_oled_lines,
        last_updated=_oled_last_updated,
    )

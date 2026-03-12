"""Domain API routes — Drivers, Alerts, Sessions, Dashboard stats.

All data is derived from the safedrive_ai drowsiness detection system
running on the prototype.  A background poller reads the shared state
file and builds an in-memory event log.
"""

import json
import time
import threading
from datetime import datetime, timezone, timedelta
from pathlib import Path

from fastapi import APIRouter, HTTPException

router = APIRouter(prefix="/api", tags=["Domain"])

STATE_FILE = Path("/tmp/safedrive_oled_state.json")

# ---------------------------------------------------------------------------
# In-memory tracker — populated by a background thread
# ---------------------------------------------------------------------------

_lock = threading.Lock()

# Tracks unique drivers seen (driver_id → info dict)
_drivers: dict[str, dict] = {}

# Drowsiness alerts logged from state changes
_alerts: list[dict] = []

# Active / completed sessions (keyed by driver_id for active ones)
_active_sessions: dict[str, dict] = {}
_completed_sessions: list[dict] = []

# Previous state for change detection
_prev_state: dict = {}

# Session counter
_session_counter = 0

# Drowsiness events by hour (hour → count)
_events_by_hour: dict[int, int] = {}

# Drowsiness events by weekday (0=Mon → count)
_events_by_day: dict[int, int] = {}


def _poll_state():
    """Background thread: poll the safedrive_ai state file."""
    global _prev_state, _session_counter

    while True:
        try:
            if STATE_FILE.exists():
                data = json.loads(STATE_FILE.read_text())
                _process_state(data)
        except Exception:
            pass
        time.sleep(1)


def _process_state(data: dict):
    global _prev_state, _session_counter
    now = datetime.now(timezone.utc)
    driver_id = data.get("driver_id", "UNKNOWN")
    state = data.get("drowsiness_state", "ALERT")
    ear = data.get("ear_value", 0.0)
    is_moving = data.get("is_moving", False)
    prev_state_name = _prev_state.get("drowsiness_state", "ALERT")
    prev_driver = _prev_state.get("driver_id", "")

    with _lock:
        # --- Track drivers ---
        if driver_id and driver_id != "UNKNOWN":
            if driver_id not in _drivers:
                _drivers[driver_id] = {
                    "id": driver_id,
                    "name": driver_id,
                    "busId": "BUS-001",
                    "status": "Normal",
                    "lastAlert": "N/A",
                    "riskLevel": "Low",
                    "faceRegistered": True,
                    "faceRegisteredAt": now.strftime("%Y-%m-%d %H:%M"),
                    "totalSessions": 0,
                    "todayWorkHours": 0.0,
                    "todaySessions": 0,
                    "detectionStatus": "monitoring",
                    "baselineStatus": "learned",
                    "baselineConfidence": 80,
                    "firstSeen": now.isoformat(),
                }
            drv = _drivers[driver_id]
            drv["detectionStatus"] = "drowsy_detected" if state in ("DROWSY", "CRITICAL") else "monitoring"
            drv["status"] = state if state in ("DROWSY", "CRITICAL") else ("Online" if is_moving else "Normal")

        # --- Session tracking ---
        if driver_id and driver_id != "UNKNOWN":
            if driver_id not in _active_sessions:
                _session_counter += 1
                _active_sessions[driver_id] = {
                    "id": f"SES-{now.strftime('%Y%m%d')}-{_session_counter:03d}",
                    "driverId": driver_id,
                    "driver": driver_id,
                    "busId": "BUS-001",
                    "startTime": now.strftime("%Y-%m-%d %H:%M"),
                    "endTime": None,
                    "status": "active",
                    "alertCount": 0,
                    "drowsinessEvents": 0,
                    "startTimestamp": now.timestamp(),
                }
                if driver_id in _drivers:
                    _drivers[driver_id]["totalSessions"] += 1
                    _drivers[driver_id]["todaySessions"] += 1
        elif driver_id == "UNKNOWN" and prev_driver and prev_driver != "UNKNOWN":
            # Driver left — end session
            if prev_driver in _active_sessions:
                sess = _active_sessions.pop(prev_driver)
                sess["endTime"] = now.strftime("%Y-%m-%d %H:%M")
                sess["status"] = "completed"
                _completed_sessions.append(sess)

        # --- Drowsiness event detection ---
        if state in ("DROWSY", "CRITICAL") and prev_state_name == "ALERT":
            alert_id = f"ALT{len(_alerts)+1:03d}"
            alert = {
                "id": alert_id,
                "type": "Drowsiness Detected" if state == "DROWSY" else "Critical Drowsiness",
                "driver": driver_id,
                "bus": "BUS-001",
                "timestamp": now.strftime("%Y-%m-%d %H:%M:%S"),
                "status": "Active",
                "severity": "High" if state == "CRITICAL" else "Medium",
                "ear_value": ear,
                "alarmType": "buzzer_oled",
                "sessionId": _active_sessions.get(driver_id, {}).get("id", ""),
            }
            _alerts.append(alert)

            _events_by_hour[now.hour] = _events_by_hour.get(now.hour, 0) + 1
            _events_by_day[now.weekday()] = _events_by_day.get(now.weekday(), 0) + 1

            if driver_id in _active_sessions:
                _active_sessions[driver_id]["drowsinessEvents"] += 1
                _active_sessions[driver_id]["alertCount"] += 1
            if driver_id in _drivers:
                _drivers[driver_id]["lastAlert"] = "Just now"
                _drivers[driver_id]["riskLevel"] = "High" if state == "CRITICAL" else "Medium"

    _prev_state = dict(data)


# Start the background poller
_poller = threading.Thread(target=_poll_state, daemon=True)
_poller.start()


# ---------------------------------------------------------------------------
# Helper
# ---------------------------------------------------------------------------

def _session_duration(sess: dict) -> str:
    start_ts = sess.get("startTimestamp", 0)
    if not start_ts:
        return "0m"
    elapsed = time.time() - start_ts
    h = int(elapsed // 3600)
    m = int((elapsed % 3600) // 60)
    return f"{h}h {m}m" if h else f"{m}m"


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@router.get("/dashboard/stats")
def dashboard_stats():
    with _lock:
        today_drowsy = sum(
            1 for a in _alerts
            if a["type"] in ("Drowsiness Detected", "Critical Drowsiness")
        )
        active_sessions = len(_active_sessions)
        driver_count = len(_drivers)
        alert_count = len(_alerts)

        stats = [
            {"label": "Registered Drivers", "value": str(driver_count), "trend": "", "icon": "Users"},
            {"label": "Drowsy Today", "value": str(today_drowsy), "trend": "", "icon": "UserX", "color": "text-brand-red"},
            {"label": "Alerts Today", "value": str(alert_count), "trend": "", "icon": "AlertTriangle"},
            {"label": "Active Sessions", "value": str(active_sessions), "trend": "", "icon": "Cpu"},
        ]

        day_names = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
        incidents = [{"day": d, "incidents": _events_by_day.get(i, 0)} for i, d in enumerate(day_names)]

        hours = [f"{h:02d}:00" for h in range(0, 24, 4)]
        peak = [{"hour": h, "incidents": _events_by_hour.get(int(h.split(":")[0]), 0)} for h in hours]

        recent = _alerts[-5:][::-1]
        recent_fmt = []
        for a in recent:
            recent_fmt.append({
                "id": a["id"],
                "type": a["type"],
                "driver": a["driver"],
                "time": a["timestamp"],
                "status": a["status"],
                "sessionId": a.get("sessionId", ""),
                "alarmTriggered": True,
            })

        # Detection feed from state file
        feed = []
        state = {}
        try:
            if STATE_FILE.exists():
                state = json.loads(STATE_FILE.read_text())
        except Exception:
            pass
        if state:
            feed.append({
                "id": "DET-LIVE",
                "driverId": state.get("driver_id", "UNKNOWN"),
                "driver": state.get("driver_id", "UNKNOWN"),
                "type": state.get("drowsiness_state", "ALERT").lower(),
                "confidence": int(min(100, state.get("ear_value", 0) * 200)),
                "timestamp": datetime.now(timezone.utc).strftime("%H:%M:%S"),
                "alarmTriggered": state.get("drowsiness_state") in ("DROWSY", "CRITICAL"),
                "alarmType": "buzzer_oled" if state.get("drowsiness_state") in ("DROWSY", "CRITICAL") else "none",
                "vehicleMoving": state.get("is_moving", False),
                "baselineDeviation": 0,
            })

        return {
            "stats": stats,
            "drowsinessIncidents": incidents,
            "peakHours": peak,
            "recentAlerts": recent_fmt,
            "detectionFeed": feed,
        }


@router.get("/sessions")
def list_sessions():
    with _lock:
        result = []
        for s in _active_sessions.values():
            sess = dict(s)
            sess["duration"] = _session_duration(sess)
            result.append(sess)
        for s in _completed_sessions[-10:]:
            result.append(s)
        return result


@router.get("/work-hours")
def list_work_hours():
    with _lock:
        result = []
        for driver_id, drv in _drivers.items():
            total_h = 0.0
            sessions = []
            for s in list(_active_sessions.values()) + _completed_sessions:
                if s.get("driverId") == driver_id:
                    start_ts = s.get("startTimestamp", 0)
                    dur = (time.time() - start_ts) / 3600 if s.get("status") == "active" else 0
                    total_h += dur
                    sessions.append({
                        "start": s.get("startTime", "").split(" ")[-1] if s.get("startTime") else "",
                        "end": s.get("endTime", "").split(" ")[-1] if s.get("endTime") else None,
                        "duration": dur,
                        "active": s.get("status") == "active",
                    })
            result.append({
                "driverId": driver_id,
                "driver": drv.get("name", driver_id),
                "todayTotal": round(total_h, 2),
                "sessions": sessions,
                "threshold4h": total_h >= 4,
                "threshold8h": total_h >= 8,
                "reminderActive": total_h >= 4,
                "weeklyHours": [0, 0, 0, 0, 0, 0, 0],
            })
        return result


@router.get("/drivers")
def list_drivers():
    with _lock:
        return list(_drivers.values()) if _drivers else []


@router.get("/drivers/{driver_id}")
def get_driver(driver_id: str):
    with _lock:
        driver = _drivers.get(driver_id)
    if not driver:
        raise HTTPException(status_code=404, detail="Driver not found")
    sessions = [s for s in list(_active_sessions.values()) + _completed_sessions if s.get("driverId") == driver_id]
    return {"driver": driver, "sessions": sessions, "workHours": None}


@router.get("/alerts")
def list_alerts():
    with _lock:
        return list(reversed(_alerts[-50:]))


@router.get("/buses")
def list_buses():
    from app.routers.sensors import get_latest_gps, get_latest_accel

    gps = get_latest_gps()
    accel = get_latest_accel()

    state = {}
    try:
        if STATE_FILE.exists():
            state = json.loads(STATE_FILE.read_text())
    except Exception:
        pass

    driver_id = state.get("driver_id", "UNKNOWN")
    drowsy_state = state.get("drowsiness_state", "ALERT")

    bus = {
        "id": "BUS-001",
        "driver": driver_id,
        "driverId": driver_id,
        "status": "Online" if accel.is_moving else "Stationary",
        "battery": "—",
        "speed": f"{gps.speed_kmh:.0f} km/h" if gps.speed_kmh else "0 km/h",
        "location": [gps.latitude or 0, gps.longitude or 0],
        "detectionStatus": drowsy_state.lower(),
        "sessionId": _active_sessions.get(driver_id, {}).get("id", ""),
    }
    return [bus]

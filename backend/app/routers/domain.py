"""Domain API routes — Drivers, Alerts, Sessions, Dashboard stats.

All data is derived from the safedrive_ai drowsiness detection system
running on the prototype.  A background poller reads the shared state
file and builds an in-memory event log.  Data is persisted to Supabase.
"""

import os
import json
import time
import logging
import threading
from datetime import datetime, timezone, timedelta
from pathlib import Path

from fastapi import APIRouter, HTTPException

router = APIRouter(prefix="/api", tags=["Domain"])

STATE_FILE = Path("/tmp/safedrive_oled_state.json")

# Philippine Standard Time (UTC+8)
PHT = timezone(timedelta(hours=8))

_log = logging.getLogger(__name__)

SESSION_GRACE_PERIOD_SECONDS = 20 * 60
DELETED_DRIVER_COOLDOWN_SECONDS = 60

# ---------------------------------------------------------------------------
# Supabase client
# ---------------------------------------------------------------------------

_SUPABASE_URL = os.environ.get("SUPABASE_URL", "https://idlpmawnxqihjjaqzaky.supabase.co")
_SUPABASE_KEY = (
    os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
    or os.environ.get("SUPABASE_KEY")
    or "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlkbHBtYXdueHFpaGpqYXF6YWt5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMzMDYyNzgsImV4cCI6MjA4ODg4MjI3OH0.blj6SUvha9Hk8ZXXdB8awCeanEQ4RWcNyMnQk40KxjE"
)

_sb = None
try:
    from supabase import create_client
    _sb = create_client(_SUPABASE_URL, _SUPABASE_KEY)
    _log.info("Supabase client initialized")
except Exception as e:
    _log.warning("Supabase not available, running in-memory only: %s", e)

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

# Track when an active driver's signal went missing so we can apply grace period.
_missing_since: dict[str, float] = {}

# Driver IDs explicitly deleted by an operator; temporarily suppress recreation
# from noisy live state, then allow reappearance after cooldown.
_deleted_drivers: dict[str, float] = {}

# Previous state for change detection
_prev_state: dict = {}

# Session counter
_session_counter = 0

# Drowsiness events by hour (hour → count)
_events_by_hour: dict[int, int] = {}

# Drowsiness events by weekday (0=Mon → count)
_events_by_day: dict[int, int] = {}


# ---------------------------------------------------------------------------
# Supabase sync helpers
# ---------------------------------------------------------------------------

def _sb_upsert_driver(driver: dict):
    """Upsert a driver record to Supabase."""
    if not _sb:
        return
    try:
        row = {
            "id": driver["id"],
            "name": driver.get("name", ""),
            "bus_id": driver.get("busId", "BUS-001"),
            "status": driver.get("status", "Normal"),
            "last_alert": driver.get("lastAlert", "N/A"),
            "risk_level": driver.get("riskLevel", "Low"),
            "face_registered": driver.get("faceRegistered", True),
            "face_registered_at": driver.get("faceRegisteredAt"),
            "total_sessions": driver.get("totalSessions", 0),
            "today_work_hours": driver.get("todayWorkHours", 0.0),
            "today_sessions": driver.get("todaySessions", 0),
            "detection_status": driver.get("detectionStatus", "monitoring"),
            "baseline_status": driver.get("baselineStatus", "learned"),
            "baseline_confidence": driver.get("baselineConfidence", 80),
        }
        _sb.table("drivers").upsert(row).execute()
    except Exception as e:
        _log.warning("Supabase driver upsert failed: %s", e)


def _sb_insert_alert(alert: dict):
    """Insert an alert record to Supabase."""
    if not _sb:
        return
    try:
        row = {
            "id": alert["id"],
            "type": alert["type"],
            "driver": alert["driver"],
            "bus": alert.get("bus", "BUS-001"),
            "timestamp": alert["timestamp"],
            "status": alert.get("status", "Active"),
            "severity": alert.get("severity", "Medium"),
            "ear_value": alert.get("ear_value", 0.0),
            "alarm_type": alert.get("alarmType", "buzzer_oled"),
            "session_id": alert.get("sessionId", ""),
        }
        _sb.table("alerts").upsert(row).execute()
    except Exception as e:
        _log.warning("Supabase alert insert failed: %s", e)


def _sb_upsert_session(sess: dict):
    """Upsert a session record to Supabase."""
    if not _sb:
        return
    try:
        row = {
            "id": sess["id"],
            "driver_id": sess["driverId"],
            "driver": sess.get("driver", ""),
            "bus_id": sess.get("busId", "BUS-001"),
            "start_time": sess.get("startTime"),
            "end_time": sess.get("endTime"),
            "status": sess.get("status", "active"),
            "alert_count": sess.get("alertCount", 0),
            "drowsiness_events": sess.get("drowsinessEvents", 0),
            "start_timestamp": sess.get("startTimestamp", 0),
        }
        _sb.table("sessions").upsert(row).execute()
    except Exception as e:
        _log.warning("Supabase session upsert failed: %s", e)


def _sb_upsert_event_stat(stat_type: str, stat_key: int, count: int):
    """Upsert an event stat to Supabase."""
    if not _sb:
        return
    try:
        _sb.table("event_stats").upsert(
            {"stat_type": stat_type, "stat_key": stat_key, "count": count},
            on_conflict="stat_type,stat_key"
        ).execute()
    except Exception as e:
        _log.warning("Supabase event_stats upsert failed: %s", e)


def _load_from_supabase():
    """Restore domain data from Supabase on startup."""
    global _session_counter
    if not _sb:
        return
    try:
        # Load drivers
        rows = _sb.table("drivers").select("*").execute().data
        for r in rows:
            _drivers[r["id"]] = {
                "id": r["id"],
                "name": r.get("name", r["id"]),
                "busId": r.get("bus_id", "BUS-001"),
                "status": r.get("status", "Normal"),
                "lastAlert": r.get("last_alert", "N/A"),
                "riskLevel": r.get("risk_level", "Low"),
                "faceRegistered": r.get("face_registered", True),
                "faceRegisteredAt": r.get("face_registered_at"),
                "totalSessions": r.get("total_sessions", 0),
                "todayWorkHours": r.get("today_work_hours", 0.0),
                "todaySessions": r.get("today_sessions", 0),
                "detectionStatus": r.get("detection_status", "monitoring"),
                "baselineStatus": r.get("baseline_status", "learned"),
                "baselineConfidence": r.get("baseline_confidence", 80),
                "firstSeen": r.get("first_seen", ""),
            }

        # Load alerts (last 200)
        rows = _sb.table("alerts").select("*").order("created_at", desc=True).limit(200).execute().data
        for r in reversed(rows):
            _alerts.append({
                "id": r["id"],
                "type": r["type"],
                "driver": r["driver"],
                "bus": r.get("bus", "BUS-001"),
                "timestamp": r["timestamp"],
                "status": r.get("status", "Active"),
                "severity": r.get("severity", "Medium"),
                "ear_value": r.get("ear_value", 0.0),
                "alarmType": r.get("alarm_type", "buzzer_oled"),
                "sessionId": r.get("session_id", ""),
            })

        # Load sessions — mark old active ones as completed
        rows = _sb.table("sessions").select("*").order("created_at", desc=True).limit(200).execute().data
        max_counter = 0
        for r in rows:
            # Extract counter from session ID like SES-20260312-003
            try:
                c = int(r["id"].split("-")[-1])
                if c > max_counter:
                    max_counter = c
            except (ValueError, IndexError):
                pass

            sess = {
                "id": r["id"],
                "driverId": r["driver_id"],
                "driver": r.get("driver", ""),
                "busId": r.get("bus_id", "BUS-001"),
                "startTime": r.get("start_time"),
                "endTime": r.get("end_time"),
                "status": r.get("status", "completed"),
                "alertCount": r.get("alert_count", 0),
                "drowsinessEvents": r.get("drowsiness_events", 0),
                "startTimestamp": r.get("start_timestamp", 0),
            }
            if sess["status"] == "active":
                sess["status"] = "completed"
                if not sess.get("endTime"):
                    sess["endTime"] = datetime.now(PHT).strftime("%Y-%m-%d %I:%M %p")
                _sb_upsert_session(sess)
            _completed_sessions.append(sess)
        _session_counter = max_counter

        # Load event stats
        rows = _sb.table("event_stats").select("*").execute().data
        for r in rows:
            if r["stat_type"] == "hourly":
                _events_by_hour[r["stat_key"]] = r["count"]
            elif r["stat_type"] == "daily":
                _events_by_day[r["stat_key"]] = r["count"]

        _log.info("Loaded from Supabase: %d drivers, %d alerts, %d sessions",
                  len(_drivers), len(_alerts), len(_completed_sessions))
    except Exception as e:
        _log.warning("Failed to load from Supabase: %s", e)


# Load persisted data on import
_load_from_supabase()


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
    now = datetime.now(PHT)
    now_ts = now.timestamp()
    driver_id = data.get("driver_id", "UNKNOWN")
    state = data.get("drowsiness_state", "ALERT")
    ear = data.get("ear_value", 0.0)
    is_moving = data.get("is_moving", False)
    prev_state_name = _prev_state.get("drowsiness_state", "ALERT")

    # Collect items to sync to Supabase after releasing the lock
    sync_driver = None
    sync_alert = None
    sync_session = None
    sync_session_ends = []
    sync_events = []

    with _lock:
        # --- Track drivers ---
        if driver_id and driver_id != "UNKNOWN":
            deleted_at = _deleted_drivers.get(driver_id)
            if deleted_at is not None:
                if now_ts - deleted_at < DELETED_DRIVER_COOLDOWN_SECONDS:
                    _prev_state = dict(data)
                    return
                _deleted_drivers.pop(driver_id, None)
            if driver_id not in _drivers:
                _drivers[driver_id] = {
                    "id": driver_id,
                    "name": driver_id,
                    "busId": "BUS-001",
                    "status": "Normal",
                    "lastAlert": "N/A",
                    "riskLevel": "Low",
                    "faceRegistered": True,
                    "faceRegisteredAt": now.strftime("%Y-%m-%d %I:%M %p"),
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

        # --- Session tracking with grace period ---
        current_driver = driver_id if driver_id and driver_id != "UNKNOWN" else None

        for active_driver in list(_active_sessions.keys()):
            if active_driver == current_driver:
                _missing_since.pop(active_driver, None)
                continue

            if active_driver not in _missing_since:
                _missing_since[active_driver] = now_ts

            if now_ts - _missing_since[active_driver] >= SESSION_GRACE_PERIOD_SECONDS:
                sess = _active_sessions.pop(active_driver)
                sess["endTime"] = now.strftime("%Y-%m-%d %I:%M %p")
                sess["status"] = "completed"
                _completed_sessions.append(sess)
                sync_session_ends.append(dict(sess))
                _missing_since.pop(active_driver, None)

        if current_driver and current_driver not in _active_sessions:
            _session_counter += 1
            _active_sessions[current_driver] = {
                "id": f"SES-{now.strftime('%Y%m%d')}-{_session_counter:03d}",
                "driverId": current_driver,
                "driver": current_driver,
                "busId": "BUS-001",
                "startTime": now.strftime("%Y-%m-%d %I:%M %p"),
                "endTime": None,
                "status": "active",
                "alertCount": 0,
                "drowsinessEvents": 0,
                "startTimestamp": now_ts,
            }
            _missing_since.pop(current_driver, None)
            if current_driver in _drivers:
                _drivers[current_driver]["totalSessions"] += 1
                _drivers[current_driver]["todaySessions"] += 1
            sync_driver = dict(_drivers[current_driver])
            sync_session = dict(_active_sessions[current_driver])

        # --- Drowsiness event detection ---
        if state in ("DROWSY", "CRITICAL") and prev_state_name == "ALERT":
            alert_id = f"ALT{len(_alerts)+1:03d}"
            alert = {
                "id": alert_id,
                "type": "Drowsiness Detected" if state == "DROWSY" else "Critical Drowsiness",
                "driver": driver_id,
                "bus": "BUS-001",
                "timestamp": now.strftime("%Y-%m-%d %I:%M:%S %p"),
                "status": "Active",
                "severity": "High" if state == "CRITICAL" else "Medium",
                "ear_value": ear,
                "alarmType": "buzzer_oled",
                "sessionId": _active_sessions.get(driver_id, {}).get("id", ""),
            }
            _alerts.append(alert)
            sync_alert = dict(alert)

            _events_by_hour[now.hour] = _events_by_hour.get(now.hour, 0) + 1
            _events_by_day[now.weekday()] = _events_by_day.get(now.weekday(), 0) + 1
            sync_events.append(("hourly", now.hour, _events_by_hour[now.hour]))
            sync_events.append(("daily", now.weekday(), _events_by_day[now.weekday()]))

            if driver_id in _active_sessions:
                _active_sessions[driver_id]["drowsinessEvents"] += 1
                _active_sessions[driver_id]["alertCount"] += 1
                sync_session = dict(_active_sessions[driver_id])
            if driver_id in _drivers:
                _drivers[driver_id]["lastAlert"] = "Just now"
                _drivers[driver_id]["riskLevel"] = "High" if state == "CRITICAL" else "Medium"
                sync_driver = dict(_drivers[driver_id])

    _prev_state = dict(data)

    # Sync to Supabase in background thread (non-blocking)
    if sync_driver or sync_alert or sync_session or sync_session_ends or sync_events:
        def _do_sync():
            if sync_driver:
                _sb_upsert_driver(sync_driver)
            if sync_alert:
                _sb_insert_alert(sync_alert)
            if sync_session:
                _sb_upsert_session(sync_session)
            for ended_sess in sync_session_ends:
                _sb_upsert_session(ended_sess)
            for st, sk, sc in sync_events:
                _sb_upsert_event_stat(st, sk, sc)
        threading.Thread(target=_do_sync, daemon=True).start()


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
                "timestamp": datetime.now(PHT).strftime("%I:%M:%S %p"),
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
        result = []
        now_ts = time.time()
        for drv in _drivers.values():
            deleted_at = _deleted_drivers.get(drv["id"])
            if deleted_at is not None and now_ts - deleted_at < DELETED_DRIVER_COOLDOWN_SECONDS:
                continue
            if deleted_at is not None:
                _deleted_drivers.pop(drv["id"], None)
            d = dict(drv)
            if d["id"] not in _active_sessions:
                d["status"] = "Offline"
                d["detectionStatus"] = "idle"
            result.append(d)
        return result


@router.delete("/drivers/{driver_id}")
def delete_driver(driver_id: str):
    with _lock:
        if driver_id not in _drivers:
            raise HTTPException(status_code=404, detail="Driver not found")

    # Delete from Supabase first when configured; fail fast if persistence fails.
    if _sb:
        try:
            _sb.table("alerts").delete().eq("driver", driver_id).execute()
            _sb.table("sessions").delete().eq("driver_id", driver_id).execute()
            _sb.table("driver_notes").delete().eq("driver_id", driver_id).execute()
            _sb.table("drivers").delete().eq("id", driver_id).execute()
        except Exception as e:
            _log.warning("Supabase delete failed for %s: %s", driver_id, e)
            raise HTTPException(status_code=500, detail="Failed to delete driver from database")

    with _lock:
        del _drivers[driver_id]
        _deleted_drivers[driver_id] = time.time()
        _active_sessions.pop(driver_id, None)
        _missing_since.pop(driver_id, None)
        # Remove driver's alerts and sessions
        _alerts[:] = [a for a in _alerts if a.get("driver") != driver_id]
        _completed_sessions[:] = [s for s in _completed_sessions if s.get("driverId") != driver_id]

    return {"ok": True}


@router.get("/drivers/{driver_id}")
def get_driver(driver_id: str):
    with _lock:
        driver = _drivers.get(driver_id)
        if not driver:
            raise HTTPException(status_code=404, detail="Driver not found")
        sessions = [s for s in list(_active_sessions.values()) + _completed_sessions if s.get("driverId") == driver_id]

        # Per-driver drowsiness incidents by day of week
        day_names = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
        driver_day_counts: dict[int, int] = {i: 0 for i in range(7)}
        driver_name = driver.get("name", driver_id)
        for a in _alerts:
            if a.get("driver") not in (driver_id, driver_name):
                continue
            try:
                dt = datetime.strptime(a["timestamp"], "%Y-%m-%d %H:%M:%S")
                driver_day_counts[dt.weekday()] += 1
            except (ValueError, KeyError):
                pass
        driver_incidents = [{"day": d, "incidents": driver_day_counts[i]} for i, d in enumerate(day_names)]

    return {"driver": driver, "sessions": sessions, "workHours": None, "drowsinessIncidents": driver_incidents}


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

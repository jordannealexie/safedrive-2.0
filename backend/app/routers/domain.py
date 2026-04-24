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
FRAME_FILE = Path("/tmp/safedrive_frame.jpg")

# Philippine Standard Time (UTC+8)
PHT = timezone(timedelta(hours=8))

_log = logging.getLogger(__name__)

SESSION_GRACE_PERIOD_SECONDS = 30 * 60
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

# Snapshot throttle: driver_id → last capture timestamp
_snapshot_last_ts: dict[str, float] = {}
SNAPSHOT_INTERVAL_SECONDS = 5

# Offline snapshot queue file
_SNAPSHOT_QUEUE_FILE = Path("/tmp/snapshot_queue.json")


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


def _sb_update_alert_status(alert_id: str, status: str):
    """Update an alert status in Supabase."""
    if not _sb:
        return
    try:
        _sb.table("alerts").update({"status": status}).eq("id", alert_id).execute()
    except Exception as e:
        _log.warning("Supabase alert status update failed (%s -> %s): %s", alert_id, status, e)


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


def _sb_upsert_snapshot(snapshot: dict):
    """Upsert a prototype snapshot to Supabase. Queue locally on failure."""
    if not _sb:
        _queue_snapshot(snapshot)
        return
    try:
        _sb.table("prototype_snapshots").upsert(
            snapshot,
            on_conflict="driver_id,captured_at"
        ).execute()
    except Exception as e:
        _log.warning("Supabase snapshot upsert failed: %s", e)
        _queue_snapshot(snapshot)


def _sb_upload_frame(driver_id: str, timestamp_str: str) -> str | None:
    """Upload the current camera frame to Supabase Storage and return its public URL."""
    if not _sb:
        return None
    if not FRAME_FILE.exists():
        return None
    try:
        frame_data = FRAME_FILE.read_bytes()
        if len(frame_data) < 1000:  # Too small = corrupt
            return None

        # Build a unique path: frames/{driver_id}/{YYYYMMDD}/{timestamp}.jpg
        ts = datetime.now(PHT)
        date_folder = ts.strftime("%Y%m%d")
        safe_ts = ts.strftime("%H%M%S_%f")[:-3]  # HHMMss_mmm
        storage_path = f"frames/{driver_id}/{date_folder}/{safe_ts}.jpg"

        # Upload to Supabase Storage
        _sb.storage.from_("snapshot-frames").upload(
            path=storage_path,
            file=frame_data,
            file_options={"content-type": "image/jpeg", "upsert": "true"}
        )

        # Build public URL
        public_url = f"{_SUPABASE_URL}/storage/v1/object/public/snapshot-frames/{storage_path}"
        return public_url
    except Exception as e:
        _log.warning("Frame upload failed: %s", e)
        return None


def _queue_snapshot(snapshot: dict):
    """Persist a failed snapshot to local queue for later retry."""
    try:
        queue = []
        if _SNAPSHOT_QUEUE_FILE.exists():
            queue = json.loads(_SNAPSHOT_QUEUE_FILE.read_text())
        queue.append(snapshot)
        # Cap queue to prevent disk bloat
        if len(queue) > 5000:
            queue = queue[-5000:]
        _SNAPSHOT_QUEUE_FILE.write_text(json.dumps(queue))
    except Exception as e:
        _log.warning("Failed to queue snapshot locally: %s", e)


def _flush_snapshot_queue():
    """Retry sending queued snapshots to Supabase."""
    if not _sb or not _SNAPSHOT_QUEUE_FILE.exists():
        return
    try:
        queue = json.loads(_SNAPSHOT_QUEUE_FILE.read_text())
        if not queue:
            return
        _log.info("Flushing %d queued snapshots to Supabase", len(queue))
        batch_size = 50
        remaining = []
        for i in range(0, len(queue), batch_size):
            batch = queue[i:i + batch_size]
            try:
                _sb.table("prototype_snapshots").upsert(
                    batch,
                    on_conflict="driver_id,captured_at"
                ).execute()
            except Exception:
                remaining.extend(batch)
        if remaining:
            _SNAPSHOT_QUEUE_FILE.write_text(json.dumps(remaining))
        else:
            _SNAPSHOT_QUEUE_FILE.unlink(missing_ok=True)
            _log.info("Snapshot queue fully flushed")
    except Exception as e:
        _log.warning("Failed to flush snapshot queue: %s", e)


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

        # Load sessions
        rows = _sb.table("sessions").select("*").order("created_at", desc=True).limit(200).execute().data
        max_counter = 0
        active_loaded: set[str] = set()
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
                # Keep at most one active session per driver (latest only).
                did = sess.get("driverId")
                if did and did not in active_loaded:
                    _active_sessions[did] = sess
                    active_loaded.add(did)
                else:
                    _completed_sessions.append(sess)
            else:
                _completed_sessions.append(sess)
        _session_counter = max_counter

        # On restart, restored active sessions should not keep accumulating time
        # unless confirmed by fresh live state updates.
        now_ts = datetime.now(PHT).timestamp()
        for did in active_loaded:
            _missing_since[did] = now_ts - SESSION_GRACE_PERIOD_SECONDS

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

# Flush any queued snapshots from previous offline periods
threading.Thread(target=_flush_snapshot_queue, daemon=True).start()


def _poll_state():
    """Background thread: poll the safedrive_ai state file."""
    global _prev_state, _session_counter
    _poll_counter = 0

    while True:
        try:
            if STATE_FILE.exists():
                data = json.loads(STATE_FILE.read_text())
                _process_state(data)
        except Exception:
            pass
        # Periodically flush queued snapshots (every ~60s)
        _poll_counter += 1
        if _poll_counter % 60 == 0:
            try:
                _flush_snapshot_queue()
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
    sync_alert_updates: list[tuple[str, str]] = []
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

            # If another known driver is currently detected, close prior active
            # sessions immediately. Grace period only applies to unknown/missing
            # driver windows.
            if current_driver and active_driver != current_driver:
                sess = _active_sessions.pop(active_driver)
                sess["endTime"] = now.strftime("%Y-%m-%d %I:%M %p")
                sess["status"] = "completed"
                _completed_sessions.append(sess)
                sync_session_ends.append(dict(sess))
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

        # --- Auto-resolve latest active alert when driver returns to normal ---
        if prev_state_name in ("DROWSY", "CRITICAL") and state == "ALERT" and driver_id and driver_id != "UNKNOWN":
            for alert in reversed(_alerts):
                if alert.get("driver") == driver_id and alert.get("status") == "Active":
                    alert["status"] = "Resolved"
                    sync_alert_updates.append((alert["id"], "Resolved"))
                    break

    _prev_state = dict(data)

    # --- Capture prototype snapshot (throttled) ---
    sync_snapshot = None
    if current_driver and current_driver != "UNKNOWN":
        last_snap = _snapshot_last_ts.get(current_driver, 0)
        if now_ts - last_snap >= SNAPSHOT_INTERVAL_SECONDS:
            _snapshot_last_ts[current_driver] = now_ts
            sync_snapshot = {
                "driver_id": current_driver,
                "session_id": _active_sessions.get(current_driver, {}).get("id"),
                "captured_at": now.isoformat(),
                "ear_value": ear,
                "drowsiness_state": state,
                "is_moving": is_moving,
                "speed_kmh": data.get("speed_kmh"),
                "gps_lat": data.get("gps_lat") or data.get("latitude"),
                "gps_lon": data.get("gps_lon") or data.get("longitude"),
                "fps": data.get("fps"),
                "image_url": None,  # Will be filled by _do_sync
                "source": "live",
                "pi_hostname": "raspi4b",
                "raw_payload": data,
            }

    # Sync to Supabase in background thread (non-blocking)
    if sync_driver or sync_alert or sync_alert_updates or sync_session or sync_session_ends or sync_events or sync_snapshot:
        def _do_sync():
            if sync_driver:
                _sb_upsert_driver(sync_driver)
            if sync_alert:
                _sb_insert_alert(sync_alert)
            for alert_id, alert_status in sync_alert_updates:
                _sb_update_alert_status(alert_id, alert_status)
            if sync_session:
                _sb_upsert_session(sync_session)
            for ended_sess in sync_session_ends:
                _sb_upsert_session(ended_sess)
            for st, sk, sc in sync_events:
                _sb_upsert_event_stat(st, sk, sc)
            if sync_snapshot:
                # Upload frame image if available
                frame_url = _sb_upload_frame(
                    sync_snapshot["driver_id"],
                    sync_snapshot["captured_at"]
                )
                if frame_url:
                    sync_snapshot["image_url"] = frame_url
                _sb_upsert_snapshot(sync_snapshot)
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


def _parse_session_dt(value: str | None) -> datetime | None:
    if not value:
        return None
    try:
        return datetime.strptime(value, "%Y-%m-%d %I:%M %p").replace(tzinfo=PHT)
    except Exception:
        return None


def _parse_alert_dt(value: str | None) -> datetime | None:
    if not value:
        return None
    try:
        return datetime.strptime(value, "%Y-%m-%d %I:%M:%S %p").replace(tzinfo=PHT)
    except Exception:
        return None


def _format_session_clock(value: str | None) -> str | None:
    if not value:
        return None
    dt = _parse_session_dt(value)
    if dt:
        return dt.strftime("%I:%M %p")

    # Keep a best-effort fallback for legacy/unexpected formats.
    parts = str(value).split(" ")
    if len(parts) >= 3:
        return " ".join(parts[-2:])
    return str(value)


def _to_session_payload(sess: dict) -> dict:
    payload = dict(sess)
    dur_h = _session_hours(sess, datetime.now(PHT))
    total_minutes = max(0, int(round(dur_h * 60)))
    h = total_minutes // 60
    m = total_minutes % 60
    payload["duration"] = f"{h}h {m}m" if h else f"{m}m"
    return payload


def _session_hours(sess: dict, now: datetime) -> float:
    if sess.get("status") == "active":
        start_dt = _parse_session_dt(sess.get("startTime"))
        if not start_dt:
            start_ts = sess.get("startTimestamp", 0)
            if start_ts:
                try:
                    start_dt = datetime.fromtimestamp(float(start_ts), tz=PHT)
                except Exception:
                    start_dt = None
        end_dt = now
    else:
        # Completed sessions are most reliable from explicit start/end strings.
        start_dt = _parse_session_dt(sess.get("startTime"))
        end_dt = _parse_session_dt(sess.get("endTime"))
        if (not start_dt or not end_dt) and sess.get("startTimestamp"):
            try:
                start_dt = datetime.fromtimestamp(float(sess.get("startTimestamp")), tz=PHT)
            except Exception:
                start_dt = None

    if not start_dt or not end_dt:
        return 0.0

    if not end_dt or end_dt < start_dt:
        return 0.0
    return max(0.0, (end_dt - start_dt).total_seconds() / 3600)


def _is_noise_session(sess: dict, now: datetime) -> bool:
    if sess.get("status") != "completed":
        return False
    if (sess.get("alertCount") or 0) > 0:
        return False
    if (sess.get("drowsinessEvents") or 0) > 0:
        return False
    return _session_hours(sess, now) < (2 / 60)


def _is_today_session(sess: dict, now: datetime) -> bool:
    start_dt = _parse_session_dt(sess.get("startTime"))
    if not start_dt and sess.get("startTimestamp"):
        try:
            start_dt = datetime.fromtimestamp(float(sess.get("startTimestamp")), tz=PHT)
        except Exception:
            start_dt = None
    if not start_dt:
        return False
    return start_dt.date() == now.date()


def _fetch_today_sessions_from_supabase() -> list[dict]:
    if not _sb:
        return []
    try:
        day_start = datetime.now(PHT).strftime("%Y-%m-%d")
        rows = (
            _sb.table("sessions")
            .select("*")
            .gte("created_at", day_start)
            .order("created_at", desc=True)
            .limit(500)
            .execute()
            .data
        )
        result: list[dict] = []
        for r in rows:
            result.append(
                {
                    "id": r["id"],
                    "driverId": r.get("driver_id", ""),
                    "driver": r.get("driver", r.get("driver_id", "")),
                    "busId": r.get("bus_id", "BUS-001"),
                    "startTime": r.get("start_time"),
                    "endTime": r.get("end_time"),
                    "status": r.get("status", "completed"),
                    "alertCount": r.get("alert_count", 0),
                    "drowsinessEvents": r.get("drowsiness_events", 0),
                    "startTimestamp": r.get("start_timestamp", 0),
                }
            )
        return result
    except Exception as e:
        _log.warning("Failed to fetch today's sessions from Supabase: %s", e)
        return []


def _fetch_today_alerts_from_supabase() -> list[dict]:
    if not _sb:
        return []
    try:
        day_start = datetime.now(PHT).strftime("%Y-%m-%d")
        rows = (
            _sb.table("alerts")
            .select("*")
            .gte("created_at", day_start)
            .order("created_at", desc=True)
            .limit(500)
            .execute()
            .data
        )
        result: list[dict] = []
        for r in rows:
            result.append(
                {
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
                }
            )
        return result
    except Exception as e:
        _log.warning("Failed to fetch today's alerts from Supabase: %s", e)
        return []


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
                "alarmTriggered": a.get("status") == "Active" and a.get("alarmType", "none") != "none",
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
    now = datetime.now(PHT)
    sb_sessions = _fetch_today_sessions_from_supabase()

    with _lock:
        active_sessions = [dict(s) for s in _active_sessions.values()]
        completed_sessions = [dict(s) for s in _completed_sessions]

    by_id: dict[str, dict] = {}
    base_sessions = sb_sessions if sb_sessions else completed_sessions
    for s in base_sessions + active_sessions:
        sid = s.get("id")
        if sid:
            by_id[sid] = s

    sessions = list(by_id.values())
    sessions = [s for s in sessions if not _is_noise_session(s, now)]
    sessions.sort(key=lambda s: (s.get("startTime") or "", s.get("id") or ""), reverse=True)
    return [_to_session_payload(s) for s in sessions]


@router.get("/work-hours")
def list_work_hours():
    now = datetime.now(PHT)
    sb_sessions = _fetch_today_sessions_from_supabase()
    sb_alerts = _fetch_today_alerts_from_supabase()

    with _lock:
        drivers_snapshot = {k: dict(v) for k, v in _drivers.items()}
        mem_sessions = [dict(s) for s in list(_active_sessions.values()) + _completed_sessions]
        mem_alerts = [dict(a) for a in _alerts]

    by_id: dict[str, dict] = {}
    for s in sb_sessions + mem_sessions:
        sid = s.get("id")
        if sid:
            by_id[sid] = s
    all_sessions = [s for s in by_id.values() if _is_today_session(s, now)]

    alert_by_id: dict[str, dict] = {}
    for a in sb_alerts + mem_alerts:
        aid = a.get("id")
        if aid:
            alert_by_id[aid] = a
    alert_source = list(alert_by_id.values())
    alert_times_by_driver: dict[str, list[datetime]] = {}
    for a in alert_source:
        driver = a.get("driver")
        ts = _parse_alert_dt(a.get("timestamp"))
        if not driver or not ts:
            continue
        alert_times_by_driver.setdefault(driver, []).append(ts)

    driver_ids = set(drivers_snapshot.keys())
    driver_ids.update(s.get("driverId") for s in all_sessions if s.get("driverId"))

    result = []
    for driver_id in sorted(driver_ids):
        drv = drivers_snapshot.get(driver_id, {"name": driver_id})
        total_h = 0.0
        sessions = []
        driver_alert_times = sorted(alert_times_by_driver.get(driver_id, []))
        for s in all_sessions:
            if s.get("driverId") != driver_id:
                continue
            if _is_noise_session(s, now):
                continue
            dur = _session_hours(s, now)
            session_end_display = _format_session_clock(s.get("endTime"))

            # If a completed session end time is stretched far beyond observed
            # alert activity for that specific session window.
            if s.get("status") == "completed":
                start_dt = _parse_session_dt(s.get("startTime"))
                end_dt = _parse_session_dt(s.get("endTime"))
                if start_dt and end_dt and driver_alert_times:
                    session_alerts = [t for t in driver_alert_times if start_dt <= t <= end_dt]
                    if session_alerts:
                        latest_session_alert = session_alerts[-1]
                        inferred_end = latest_session_alert + timedelta(seconds=SESSION_GRACE_PERIOD_SECONDS)
                        if inferred_end < end_dt:
                            dur = max(0.0, (inferred_end - start_dt).total_seconds() / 3600)
                            session_end_display = inferred_end.strftime("%I:%M %p")

            total_h += dur
            sessions.append(
                {
                    "id": s.get("id", ""),
                    "start": _format_session_clock(s.get("startTime")) or "",
                    "end": session_end_display,
                    "duration": round(dur, 2),
                    "active": s.get("status") == "active",
                }
            )

        # Fallback: if session durations are missing, estimate from today's fault-log timestamps.
        if total_h < 0.01:
            ts_list = sorted(alert_times_by_driver.get(driver_id, []))
            if len(ts_list) >= 2:
                inferred = max(0.0, (ts_list[-1] - ts_list[0]).total_seconds() / 3600)
                total_h = round(inferred, 2)
            elif len(ts_list) == 1:
                total_h = 0.08

        result.append(
            {
                "driverId": driver_id,
                "driver": drv.get("name", driver_id),
                "todayTotal": round(total_h, 2),
                "sessions": sessions,
                "threshold4h": total_h >= 4,
                "threshold8h": total_h >= 8,
                "reminderActive": total_h >= 4,
                "weeklyHours": [0, 0, 0, 0, 0, 0, 0],
            }
        )
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
        alerts_snapshot = [dict(a) for a in _alerts]

    # Per-driver drowsiness incidents by day of week
    day_names = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
    driver_day_counts: dict[int, int] = {i: 0 for i in range(7)}
    driver_name = driver.get("name", driver_id)
    alert_source = _fetch_today_alerts_from_supabase() or alerts_snapshot
    for a in alert_source:
        if a.get("driver") not in (driver_id, driver_name):
            continue
        dt = _parse_alert_dt(a.get("timestamp"))
        if not dt:
            continue
        driver_day_counts[dt.weekday()] += 1
    driver_incidents = [{"day": d, "incidents": driver_day_counts[i]} for i, d in enumerate(day_names)]

    return {"driver": driver, "sessions": sessions, "workHours": None, "drowsinessIncidents": driver_incidents}


@router.get("/alerts")
def list_alerts():
    sb_alerts = _fetch_today_alerts_from_supabase()
    with _lock:
        mem_alerts = [dict(a) for a in _alerts]

    by_id: dict[str, dict] = {}
    source_alerts = sb_alerts if sb_alerts else mem_alerts
    for a in source_alerts:
        aid = a.get("id")
        if aid:
            by_id[aid] = a

    # Include unsynced in-memory alerts in case they're newer than Supabase write timing.
    for a in mem_alerts[-20:]:
        aid = a.get("id")
        if aid:
            by_id[aid] = a

    merged = list(by_id.values())
    merged.sort(key=lambda a: (a.get("timestamp") or "", a.get("id") or ""), reverse=True)
    return merged


@router.put("/alerts/{alert_id}")
def update_alert_status(alert_id: str, body: dict):
    new_status = (body.get("status") or "").strip()
    if new_status not in ("Active", "Resolved"):
        raise HTTPException(status_code=400, detail="Invalid status")

    with _lock:
        target = next((a for a in _alerts if a.get("id") == alert_id), None)
        if not target:
            raise HTTPException(status_code=404, detail="Alert not found")
        target["status"] = new_status
        updated = dict(target)

    if _sb:
        try:
            _sb_update_alert_status(alert_id, new_status)
        except Exception as e:
            _log.warning("Supabase alert status update failed for %s: %s", alert_id, e)
            raise HTTPException(status_code=500, detail="Failed to update alert in database")

    return updated


@router.put("/alerts")
def update_all_alert_status(body: dict):
    new_status = (body.get("status") or "").strip()
    if new_status not in ("Active", "Resolved"):
        raise HTTPException(status_code=400, detail="Invalid status")

    with _lock:
        for a in _alerts:
            a["status"] = new_status

    if _sb:
        try:
            _sb.table("alerts").update({"status": new_status}).neq("id", "").execute()
        except Exception as e:
            _log.warning("Supabase bulk alert status update failed: %s", e)
            raise HTTPException(status_code=500, detail="Failed to update alerts in database")

    return {"ok": True, "status": new_status}


@router.delete("/alerts/{alert_id}")
def delete_alert(alert_id: str):
    with _lock:
        target = next((a for a in _alerts if a.get("id") == alert_id), None)
        if not target:
            raise HTTPException(status_code=404, detail="Alert not found")

    if _sb:
        try:
            _sb.table("alerts").delete().eq("id", alert_id).execute()
        except Exception as e:
            _log.warning("Supabase delete failed for alert %s: %s", alert_id, e)
            raise HTTPException(status_code=500, detail="Failed to delete alert from database")

    with _lock:
        _alerts[:] = [a for a in _alerts if a.get("id") != alert_id]

    return {"ok": True}


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

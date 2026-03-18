from __future__ import annotations

from collections import defaultdict
from datetime import datetime, timedelta, timezone
import requests

SUPABASE_URL = "https://idlpmawnxqihjjaqzaky.supabase.co/rest/v1"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlkbHBtYXdueHFpaGpqYXF6YWt5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMzMDYyNzgsImV4cCI6MjA4ODg4MjI3OH0.blj6SUvha9Hk8ZXXdB8awCeanEQ4RWcNyMnQk40KxjE"
PHT = timezone(timedelta(hours=8))

HEADERS = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}",
    "Content-Type": "application/json",
}


def pht_now() -> datetime:
    return datetime.now(PHT)


def parse_alert_ts(value: str) -> datetime:
    return datetime.strptime(value, "%Y-%m-%d %I:%M:%S %p").replace(tzinfo=PHT)


def fmt_session_ts(dt: datetime) -> str:
    return dt.astimezone(PHT).strftime("%Y-%m-%d %I:%M %p")


def get_today_iso_date() -> str:
    return pht_now().strftime("%Y-%m-%d")


def api_get(path: str, params: dict[str, str]):
    r = requests.get(f"{SUPABASE_URL}/{path}", headers=HEADERS, params=params, timeout=30)
    r.raise_for_status()
    return r.json()


def api_delete(path: str, params: dict[str, str]):
    r = requests.delete(f"{SUPABASE_URL}/{path}", headers=HEADERS, params=params, timeout=30)
    r.raise_for_status()


def api_insert(path: str, rows: list[dict]):
    if not rows:
        return
    r = requests.post(
        f"{SUPABASE_URL}/{path}",
        headers={**HEADERS, "Prefer": "return=representation"},
        json=rows,
        timeout=30,
    )
    r.raise_for_status()


def api_update(path: str, params: dict[str, str], body: dict):
    r = requests.patch(
        f"{SUPABASE_URL}/{path}",
        headers={**HEADERS, "Prefer": "return=representation"},
        params=params,
        json=body,
        timeout=30,
    )
    r.raise_for_status()


def main():
    today = get_today_iso_date()
    print(f"Using date filter: {today}")

    alerts = api_get(
        "alerts",
        {
            "select": "id,driver,bus,timestamp,created_at",
            "created_at": f"gte.{today}",
            "order": "created_at.asc",
            "limit": "2000",
        },
    )
    if not alerts:
        print("No today alerts found. Nothing to migrate.")
        return

    alerts_by_driver: dict[str, list[dict]] = defaultdict(list)
    for a in alerts:
        driver = a.get("driver") or ""
        if not driver:
            continue
        try:
            a["_dt"] = parse_alert_ts(a["timestamp"])
        except Exception:
            continue
        alerts_by_driver[driver].append(a)

    if not alerts_by_driver:
        print("No parsable today alerts. Nothing to migrate.")
        return

    drivers = sorted(alerts_by_driver.keys())
    print(f"Drivers to migrate: {drivers}")

    rebuilt_sessions: list[dict] = []
    alert_to_session: dict[str, str] = {}

    day_prefix = pht_now().strftime("SES-%Y%m%d-")
    counter = 1

    for driver in drivers:
        items = sorted(alerts_by_driver[driver], key=lambda x: x["_dt"])
        groups: list[list[dict]] = []
        current: list[dict] = []

        for item in items:
            if not current:
                current = [item]
                continue
            gap = item["_dt"] - current[-1]["_dt"]
            if gap > timedelta(minutes=30):
                groups.append(current)
                current = [item]
            else:
                current.append(item)
        if current:
            groups.append(current)

        for g in groups:
            start_dt = g[0]["_dt"]
            end_dt = g[-1]["_dt"]
            sid = f"{day_prefix}{counter:03d}"
            counter += 1

            status = "active" if (pht_now() - end_dt) <= timedelta(minutes=30) else "completed"
            end_time = None if status == "active" else fmt_session_ts(end_dt)

            rebuilt_sessions.append(
                {
                    "id": sid,
                    "driver_id": driver,
                    "driver": driver,
                    "bus_id": g[-1].get("bus") or "BUS-001",
                    "start_time": fmt_session_ts(start_dt),
                    "end_time": end_time,
                    "status": status,
                    "alert_count": len(g),
                    "drowsiness_events": len(g),
                    "start_timestamp": start_dt.timestamp(),
                    "created_at": start_dt.astimezone(timezone.utc).isoformat(),
                }
            )

            for a in g:
                alert_to_session[a["id"]] = sid

    print(f"Rebuilt sessions count: {len(rebuilt_sessions)}")

    # Delete today's sessions for impacted drivers
    for driver in drivers:
        api_delete(
            "sessions",
            {
                "driver_id": f"eq.{driver}",
                "created_at": f"gte.{today}",
            },
        )

    # Insert rebuilt sessions
    api_insert("sessions", rebuilt_sessions)

    # Remap alerts.session_id
    for aid, sid in alert_to_session.items():
        api_update("alerts", {"id": f"eq.{aid}"}, {"session_id": sid})

    # Update driver counters/hours for today
    sessions_by_driver: dict[str, list[dict]] = defaultdict(list)
    for s in rebuilt_sessions:
        sessions_by_driver[s["driver_id"]].append(s)

    for driver, items in sessions_by_driver.items():
        total_h = 0.0
        for s in items:
            st = datetime.fromtimestamp(float(s["start_timestamp"]), tz=PHT)
            if s["status"] == "active":
                et = pht_now()
            else:
                et = datetime.strptime(s["end_time"], "%Y-%m-%d %I:%M %p").replace(tzinfo=PHT)
            total_h += max(0.0, (et - st).total_seconds() / 3600)

        api_update(
            "drivers",
            {"id": f"eq.{driver}"},
            {
                "today_sessions": len(items),
                "today_work_hours": round(total_h, 2),
            },
        )

    print("Migration complete.")


if __name__ == "__main__":
    main()

"""One-time migration: convert all Supabase timestamps from UTC to PHT (UTC+8) 12-hour format."""
from supabase import create_client
from datetime import datetime, timedelta

sb = create_client(
    'https://idlpmawnxqihjjaqzaky.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlkbHBtYXdueHFpaGpqYXF6YWt5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMzMDYyNzgsImV4cCI6MjA4ODg4MjI3OH0.blj6SUvha9Hk8ZXXdB8awCeanEQ4RWcNyMnQk40KxjE'
)


def convert_ts(ts, fmt_in, fmt_out):
    """Convert a timestamp from UTC to PHT (+8h) and reformat."""
    if not ts or "AM" in ts or "PM" in ts:
        return None
    try:
        dt = datetime.strptime(ts, fmt_in)
        dt_pht = dt + timedelta(hours=8)
        return dt_pht.strftime(fmt_out)
    except ValueError:
        return None


# 1. Fix alert timestamps
alerts = sb.table("alerts").select("id, timestamp").execute().data
print(f"Found {len(alerts)} alerts")
fixed = 0
for a in alerts:
    new_ts = convert_ts(a["timestamp"], "%Y-%m-%d %H:%M:%S", "%Y-%m-%d %I:%M:%S %p")
    if new_ts:
        sb.table("alerts").update({"timestamp": new_ts}).eq("id", a["id"]).execute()
        fixed += 1
print(f"  Fixed {fixed} alert timestamps")

# 2. Fix session start/end times
sessions = sb.table("sessions").select("id, start_time, end_time").execute().data
print(f"Found {len(sessions)} sessions")
fixed_s = 0
for s in sessions:
    updates = {}
    new_start = convert_ts(s.get("start_time"), "%Y-%m-%d %H:%M", "%Y-%m-%d %I:%M %p")
    new_end = convert_ts(s.get("end_time"), "%Y-%m-%d %H:%M", "%Y-%m-%d %I:%M %p")
    if new_start:
        updates["start_time"] = new_start
    if new_end:
        updates["end_time"] = new_end
    if updates:
        sb.table("sessions").update(updates).eq("id", s["id"]).execute()
        fixed_s += 1
print(f"  Fixed {fixed_s} session timestamps")

# 3. Fix driver face_registered_at
drivers = sb.table("drivers").select("id, face_registered_at").execute().data
print(f"Found {len(drivers)} drivers")
fixed_d = 0
for d in drivers:
    new_ts = convert_ts(d.get("face_registered_at"), "%Y-%m-%d %H:%M", "%Y-%m-%d %I:%M %p")
    if new_ts:
        sb.table("drivers").update({"face_registered_at": new_ts}).eq("id", d["id"]).execute()
        fixed_d += 1
print(f"  Fixed {fixed_d} driver timestamps")

print("Migration complete!")

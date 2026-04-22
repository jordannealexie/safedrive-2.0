"""
SafeDrive 2.0 — Historical Session Recovery Audit
==================================================

Compares sessions in Supabase vs prototype snapshots to find:
- Fully synced sessions (have snapshots)
- Partially synced sessions (some snapshots missing)
- Missing sessions (no snapshots at all)

Usage on the Pi:
    export SUPABASE_URL="https://idlpmawnxqihjjaqzaky.supabase.co"
    export SUPABASE_KEY="<service_role_key>"
    python3 audit_snapshots.py
"""

import os
import sys
from datetime import datetime

try:
    from supabase import create_client
except ImportError:
    print("ERROR: supabase-py not installed. Run: pip install supabase")
    sys.exit(1)

SUPABASE_URL = os.environ.get("SUPABASE_URL", "https://idlpmawnxqihjjaqzaky.supabase.co")
SUPABASE_KEY = (
    os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
    or os.environ.get("SUPABASE_KEY")
    or os.environ.get("SUPABASE_ANON_KEY", "")
)

if not SUPABASE_KEY:
    print("ERROR: Set SUPABASE_KEY or SUPABASE_SERVICE_ROLE_KEY environment variable")
    sys.exit(1)

sb = create_client(SUPABASE_URL, SUPABASE_KEY)


def fetch_all_sessions():
    """Fetch all sessions from Supabase."""
    data = sb.table("sessions").select("id, driver_id, driver, status, start_time, end_time, alert_count, drowsiness_events").order("created_at", desc=True).limit(1000).execute()
    return data.data or []


def fetch_snapshot_counts_by_session():
    """Count snapshots per session."""
    data = sb.table("prototype_snapshots").select("session_id").limit(10000).execute()
    counts = {}
    for row in (data.data or []):
        sid = row.get("session_id")
        if sid:
            counts[sid] = counts.get(sid, 0) + 1
    return counts


def fetch_snapshot_counts_by_driver():
    """Count snapshots per driver."""
    data = sb.table("prototype_snapshots").select("driver_id").limit(10000).execute()
    counts = {}
    for row in (data.data or []):
        did = row.get("driver_id")
        if did:
            counts[did] = counts.get(did, 0) + 1
    return counts


def main():
    print("=" * 70)
    print("  SafeDrive 2.0 — Snapshot Sync Audit Report")
    print(f"  Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 70)

    # Fetch data
    print("\nFetching sessions from Supabase...")
    sessions = fetch_all_sessions()
    print(f"  Found {len(sessions)} sessions")

    print("Counting snapshots per session...")
    snap_by_session = fetch_snapshot_counts_by_session()
    total_snaps = sum(snap_by_session.values())
    print(f"  Found {total_snaps} total snapshots across {len(snap_by_session)} sessions")

    print("Counting snapshots per driver...")
    snap_by_driver = fetch_snapshot_counts_by_driver()

    # Categorize sessions
    fully_synced = []
    partially_synced = []
    missing = []

    for sess in sessions:
        sid = sess.get("id", "")
        count = snap_by_session.get(sid, 0)

        if count == 0:
            missing.append((sess, count))
        elif count < 5:
            # Sessions with very few snapshots are "partial"
            partially_synced.append((sess, count))
        else:
            fully_synced.append((sess, count))

    # Print results
    print("\n" + "-" * 70)
    print(f"  SESSION SYNC SUMMARY")
    print("-" * 70)
    print(f"  {'Category':<25} {'Count':>8} {'Snapshots':>12}")
    print(f"  {'─' * 25} {'─' * 8} {'─' * 12}")
    print(f"  {'✅ Fully Synced':<25} {len(fully_synced):>8} {sum(c for _, c in fully_synced):>12}")
    print(f"  {'⚠️  Partially Synced':<25} {len(partially_synced):>8} {sum(c for _, c in partially_synced):>12}")
    print(f"  {'❌ Missing (no snaps)':<25} {len(missing):>8} {'0':>12}")
    print(f"  {'─' * 25} {'─' * 8} {'─' * 12}")
    print(f"  {'TOTAL':<25} {len(sessions):>8} {total_snaps:>12}")

    # Detail: Missing sessions
    if missing:
        print(f"\n{'─' * 70}")
        print(f"  MISSING SESSIONS (no snapshots)")
        print(f"{'─' * 70}")
        print(f"  {'Session ID':<25} {'Driver':<20} {'Status':<12} {'Alerts':>6}")
        print(f"  {'─' * 25} {'─' * 20} {'─' * 12} {'─' * 6}")
        for sess, _ in missing[:20]:
            print(f"  {sess.get('id', '?'):<25} {sess.get('driver', '?'):<20} {sess.get('status', '?'):<12} {sess.get('alert_count', 0):>6}")
        if len(missing) > 20:
            print(f"  ... and {len(missing) - 20} more")

    # Detail: Partially synced
    if partially_synced:
        print(f"\n{'─' * 70}")
        print(f"  PARTIALLY SYNCED SESSIONS")
        print(f"{'─' * 70}")
        print(f"  {'Session ID':<25} {'Driver':<20} {'Snapshots':>10}")
        print(f"  {'─' * 25} {'─' * 20} {'─' * 10}")
        for sess, count in partially_synced:
            print(f"  {sess.get('id', '?'):<25} {sess.get('driver', '?'):<20} {count:>10}")

    # Driver summary
    print(f"\n{'─' * 70}")
    print(f"  SNAPSHOTS BY DRIVER")
    print(f"{'─' * 70}")
    print(f"  {'Driver ID':<30} {'Snapshots':>10}")
    print(f"  {'─' * 30} {'─' * 10}")
    for did, count in sorted(snap_by_driver.items(), key=lambda x: -x[1]):
        print(f"  {did:<30} {count:>10}")
    if not snap_by_driver:
        print(f"  (no snapshots found)")

    print(f"\n{'=' * 70}")
    if missing:
        print(f"  ⚠️  {len(missing)} sessions have NO snapshots — consider backfill")
    else:
        print(f"  ✅ All sessions have snapshots — no backfill needed")
    print(f"{'=' * 70}")


if __name__ == "__main__":
    main()

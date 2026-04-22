/**
 * Backfill historical snapshot data from existing sessions & alerts in Supabase.
 * 
 * Run: node backfill_snapshots.mjs
 */
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://idlpmawnxqihjjaqzaky.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlkbHBtYXdueHFpaGpqYXF6YWt5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMzMDYyNzgsImV4cCI6MjA4ODg4MjI3OH0.blj6SUvha9Hk8ZXXdB8awCeanEQ4RWcNyMnQk40KxjE';

const sb = createClient(SUPABASE_URL, SUPABASE_KEY);

async function main() {
    console.log('=== SafeDrive Snapshot Backfill ===\n');

    // 1. Fetch all alerts (they contain EAR values and drowsiness states)
    console.log('Fetching alerts from Supabase...');
    const { data: alerts, error: alertErr } = await sb
        .from('alerts')
        .select('*')
        .order('created_at', { ascending: true })
        .limit(5000);
    if (alertErr) { console.error('Failed to fetch alerts:', alertErr); return; }
    console.log(`  Found ${alerts.length} alerts`);

    // 2. Fetch all sessions
    console.log('Fetching sessions from Supabase...');
    const { data: sessions, error: sessErr } = await sb
        .from('sessions')
        .select('*')
        .order('created_at', { ascending: true })
        .limit(5000);
    if (sessErr) { console.error('Failed to fetch sessions:', sessErr); return; }
    console.log(`  Found ${sessions.length} sessions`);

    // 3. Check existing snapshot count
    const { count } = await sb
        .from('prototype_snapshots')
        .select('*', { count: 'exact', head: true });
    console.log(`  Existing snapshots: ${count || 0}`);

    // 4. Build snapshot records from alerts
    const snapshots = [];

    for (const alert of alerts) {
        const timestamp = alert.timestamp || alert.created_at;
        if (!timestamp) continue;

        // Parse the timestamp
        let capturedAt;
        try {
            // Try ISO format first
            capturedAt = new Date(timestamp);
            if (isNaN(capturedAt.getTime())) {
                // Try "YYYY-MM-DD HH:MM:SS AM/PM" format
                capturedAt = new Date(timestamp.replace(/(\d+):(\d+):(\d+)\s+(AM|PM)/i, (_, h, m, s, ampm) => {
                    let hour = parseInt(h);
                    if (ampm.toUpperCase() === 'PM' && hour !== 12) hour += 12;
                    if (ampm.toUpperCase() === 'AM' && hour === 12) hour = 0;
                    return `${hour.toString().padStart(2, '0')}:${m}:${s}`;
                }));
            }
            if (isNaN(capturedAt.getTime())) continue;
        } catch { continue; }

        snapshots.push({
            driver_id: alert.driver,
            session_id: alert.session_id || null,
            captured_at: capturedAt.toISOString(),
            ear_value: alert.ear_value || null,
            drowsiness_state: alert.type?.includes('Critical') ? 'CRITICAL' : 'DROWSY',
            is_moving: true,
            speed_kmh: null,
            gps_lat: null,
            gps_lon: null,
            fps: null,
            image_url: null,
            source: 'backfill',
            pi_hostname: 'raspi4b',
            raw_payload: { backfilled_from: 'alert', alert_id: alert.id, original_timestamp: timestamp },
        });
    }

    // 5. Also create periodic "normal" snapshots for each session to fill gaps
    for (const sess of sessions) {
        const startTime = sess.start_time || sess.created_at;
        if (!startTime) continue;

        let startDt;
        try {
            startDt = new Date(startTime);
            if (isNaN(startDt.getTime())) continue;
        } catch { continue; }

        // Create one snapshot at session start
        snapshots.push({
            driver_id: sess.driver_id,
            session_id: sess.id,
            captured_at: startDt.toISOString(),
            ear_value: 0.30,  // Normal EAR value
            drowsiness_state: 'ALERT',
            is_moving: true,
            speed_kmh: null,
            gps_lat: null,
            gps_lon: null,
            fps: null,
            image_url: null,
            source: 'backfill',
            pi_hostname: 'raspi4b',
            raw_payload: { backfilled_from: 'session_start', session_id: sess.id },
        });

        // Create a mid-session snapshot if session has end time
        const endTime = sess.end_time;
        if (endTime) {
            let endDt;
            try {
                endDt = new Date(endTime);
                if (isNaN(endDt.getTime())) continue;
            } catch { continue; }

            const midTs = new Date((startDt.getTime() + endDt.getTime()) / 2);
            snapshots.push({
                driver_id: sess.driver_id,
                session_id: sess.id,
                captured_at: midTs.toISOString(),
                ear_value: 0.28,
                drowsiness_state: 'ALERT',
                is_moving: true,
                speed_kmh: null,
                gps_lat: null,
                gps_lon: null,
                fps: null,
                image_url: null,
                source: 'backfill',
                pi_hostname: 'raspi4b',
                raw_payload: { backfilled_from: 'session_mid', session_id: sess.id },
            });
        }
    }

    console.log(`\nPrepared ${snapshots.length} backfill snapshots`);

    if (snapshots.length === 0) {
        console.log('No snapshots to backfill.');
        return;
    }

    // 6. Upsert in batches
    const BATCH = 50;
    let inserted = 0;
    let skipped = 0;
    for (let i = 0; i < snapshots.length; i += BATCH) {
        const batch = snapshots.slice(i, i + BATCH);
        const { error } = await sb
            .from('prototype_snapshots')
            .upsert(batch, { onConflict: 'driver_id,captured_at', ignoreDuplicates: true });
        if (error) {
            console.error(`  Batch ${Math.floor(i / BATCH) + 1} error:`, error.message);
            skipped += batch.length;
        } else {
            inserted += batch.length;
            process.stdout.write(`\r  Inserted: ${inserted} / ${snapshots.length}`);
        }
    }

    console.log(`\n\n✅ Backfill complete: ${inserted} inserted, ${skipped} skipped/errored`);

    // 7. Final count
    const { count: finalCount } = await sb
        .from('prototype_snapshots')
        .select('*', { count: 'exact', head: true });
    console.log(`Total snapshots in Supabase: ${finalCount}`);
}

main().catch(console.error);

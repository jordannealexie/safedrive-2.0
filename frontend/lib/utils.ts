import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Format any timestamp string to Philippine Time (UTC+8) in 12-hour format. */
export function formatTimestamp(ts: string | undefined | null, includeDate = true): string {
  if (!ts) return '';
  // If already has AM/PM, return as-is
  if (/[AP]M$/i.test(ts.trim())) return ts;
  const d = new Date(ts);
  if (isNaN(d.getTime())) return ts;
  return d.toLocaleString('en-PH', {
    timeZone: 'Asia/Manila',
    ...(includeDate ? { year: 'numeric', month: '2-digit', day: '2-digit' } : {}),
    hour: 'numeric',
    minute: '2-digit',
    second: includeDate ? '2-digit' : undefined,
    hour12: true,
  });
}

export function parseAppTimestamp(ts: string | undefined | null): Date | null {
  if (!ts) return null;

  const native = new Date(ts);
  if (!Number.isNaN(native.getTime())) return native;

  const m = ts.match(/^(\d{4})-(\d{2})-(\d{2})\s+(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM)$/i);
  if (!m) return null;

  const [, y, mo, d, hh, mm, ss, ampm] = m;
  let hour = parseInt(hh, 10);
  if (ampm.toUpperCase() === 'PM' && hour < 12) hour += 12;
  if (ampm.toUpperCase() === 'AM' && hour === 12) hour = 0;

  return new Date(
    parseInt(y, 10),
    parseInt(mo, 10) - 1,
    parseInt(d, 10),
    hour,
    parseInt(mm, 10),
    ss ? parseInt(ss, 10) : 0,
    0,
  );
}

export function isWithinDateRange(ts: string | undefined | null, startYmd: string | null, endYmd: string | null): boolean {
  if (!startYmd && !endYmd) return true;
  const d = parseAppTimestamp(ts);
  if (!d) return false;

  if (startYmd) {
    const start = new Date(`${startYmd}T00:00:00`);
    if (d < start) return false;
  }

  if (endYmd) {
    const end = new Date(`${endYmd}T23:59:59.999`);
    if (d > end) return false;
  }

  return true;
}

export function buildDateRangeFromPreset(preset: 'all' | 'today' | '7d' | '30d' | 'custom') {
  const now = new Date();
  const toYmd = (v: Date) => v.toISOString().split('T')[0];

  if (preset === 'all') return { start: null as string | null, end: null as string | null };
  if (preset === 'today') {
    const ymd = toYmd(now);
    return { start: ymd, end: ymd };
  }

  if (preset === '7d' || preset === '30d') {
    const days = preset === '7d' ? 7 : 30;
    const start = new Date(now);
    start.setDate(now.getDate() - (days - 1));
    return { start: toYmd(start), end: toYmd(now) };
  }

  return { start: null as string | null, end: null as string | null };
}

export function getDateRangeLabel(startYmd: string | null, endYmd: string | null): string {
  if (!startYmd && !endYmd) return 'All Time';
  if (startYmd && endYmd && startYmd === endYmd) return startYmd;
  if (startYmd && endYmd) return `${startYmd} to ${endYmd}`;
  if (startYmd) return `From ${startYmd}`;
  return `Until ${endYmd}`;
}

export interface IncidentSeriesPoint {
  label: string;
  incidents: number;
}

function startOfDay(d: Date): Date {
  const next = new Date(d);
  next.setHours(0, 0, 0, 0);
  return next;
}

function endOfDay(d: Date): Date {
  const next = new Date(d);
  next.setHours(23, 59, 59, 999);
  return next;
}

function addDays(d: Date, days: number): Date {
  const next = new Date(d);
  next.setDate(next.getDate() + days);
  return next;
}

function addMonths(d: Date, months: number): Date {
  const next = new Date(d);
  next.setMonth(next.getMonth() + months);
  return next;
}

function formatBucketLabel(d: Date, mode: 'day' | 'week' | 'month'): string {
  if (mode === 'day') {
    return d.toLocaleDateString('en-PH', { month: 'short', day: 'numeric' });
  }
  if (mode === 'week') {
    return `Wk ${d.toLocaleDateString('en-PH', { month: 'short', day: 'numeric' })}`;
  }
  return d.toLocaleDateString('en-PH', { month: 'short', year: 'numeric' });
}

export function buildIncidentSeries(
  timestamps: Array<string | undefined | null>,
  startYmd: string | null,
  endYmd: string | null,
): IncidentSeriesPoint[] {
  const parsed = timestamps
    .map((ts) => parseAppTimestamp(ts))
    .filter((d): d is Date => Boolean(d))
    .sort((a, b) => a.getTime() - b.getTime());

  if (parsed.length === 0) return [];

  const derivedStart = startOfDay(parsed[0]);
  const derivedEnd = endOfDay(parsed[parsed.length - 1]);
  const rangeStart = startYmd ? startOfDay(new Date(`${startYmd}T00:00:00`)) : derivedStart;
  const rangeEnd = endYmd ? endOfDay(new Date(`${endYmd}T23:59:59.999`)) : derivedEnd;

  if (rangeEnd < rangeStart) return [];

  const totalDays = Math.max(1, Math.ceil((rangeEnd.getTime() - rangeStart.getTime()) / 86400000) + 1);
  const mode: 'day' | 'week' | 'month' = totalDays <= 31 ? 'day' : totalDays <= 180 ? 'week' : 'month';

  const buckets: Array<{ start: Date; end: Date; label: string; incidents: number }> = [];
  let cursor = new Date(rangeStart);

  while (cursor <= rangeEnd) {
    let nextCursor: Date;
    if (mode === 'day') {
      nextCursor = addDays(cursor, 1);
    } else if (mode === 'week') {
      nextCursor = addDays(cursor, 7);
    } else {
      nextCursor = addMonths(cursor, 1);
      nextCursor.setDate(1);
    }

    const bucketEnd = new Date(Math.min(rangeEnd.getTime(), nextCursor.getTime() - 1));
    buckets.push({
      start: new Date(cursor),
      end: bucketEnd,
      label: formatBucketLabel(cursor, mode),
      incidents: 0,
    });
    cursor = nextCursor;
  }

  parsed.forEach((d) => {
    if (d < rangeStart || d > rangeEnd) return;
    const bucket = buckets.find((b) => d >= b.start && d <= b.end);
    if (bucket) bucket.incidents += 1;
  });

  return buckets.map((b) => ({ label: b.label, incidents: b.incidents }));
}

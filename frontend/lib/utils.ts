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

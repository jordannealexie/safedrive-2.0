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

export const DAY_KEYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// Meeting dates are stored as "YYYY-MM-DD" in the creator's local calendar.
// Don't use toISOString() or new Date("YYYY-MM-DD") for these: both go through
// UTC and shift the day for anyone east or west of UTC.

export function toDateKey(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function parseDateKey(key) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(key || "");
  if (!match) return null;
  return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
}

export function dayKeyOf(key) {
  const date = parseDateKey(key);
  return date ? DAY_KEYS[date.getDay()] : "";
}

export function weekdayLabel(key) {
  const date = parseDateKey(key);
  return date ? date.toLocaleDateString(undefined, { weekday: "short" }) : "";
}

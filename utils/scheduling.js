import { dayKeyOf } from "./date";

export const START_HOUR = 8;
export const END_HOUR = 23;

// "1 Hour" / "2 Hours" -> 1 / 2
export function parseDurationHours(duration) {
  return parseInt(duration || "1 Hour", 10) || 1;
}

// "0 mins" / "15 mins" / "1 Hour" -> hours as a fraction
export function parseFlexHours(timeFlex) {
  const flexStr = timeFlex || "0";
  const numMatch = flexStr.match(/(\d+)/);
  const baseNum = numMatch ? parseInt(numMatch[1], 10) : 0;
  const flexMinutes = /hour/i.test(flexStr) ? baseNum * 60 : baseNum;
  return flexMinutes / 60;
}

// The real meeting window for a slot, and the whole hours it occupies.
export function slotWindow(startHour, meeting) {
  const realStart = startHour + parseFlexHours(meeting.timeFlex);
  const realEnd = realStart + parseDurationHours(meeting.duration);
  const blockStart = Math.floor(realStart);
  const blockEnd = Math.ceil(realEnd);
  const hours = [];
  for (let h = blockStart; h < blockEnd; h += 1) hours.push(h);
  return { realStart, realEnd, blockStart, blockEnd, hours };
}

const toLabel = (timeFloat) => {
  const hour = Math.floor(timeFloat);
  const minutes = Math.round((timeFloat - hour) * 60);
  return `${String(hour).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
};

// Booked hours, derived from the scheduled meetings a user is in. Stored on the
// user's own profile so others can see when they're busy without reading
// their meetings. Past one-off meetings are dropped.
export function computeBusy(meetings, todayKey) {
  const busy = [];
  for (const m of meetings) {
    if (!m.selectedSlot || !m.date) continue;
    if (!m.recurring && m.date < todayKey) continue;
    busy.push({
      date: m.date,
      hours: slotWindow(m.selectedSlot.startHour, m).hours,
      recurring: !!m.recurring,
    });
  }
  busy.sort((a, b) =>
    a.date === b.date ? a.hours[0] - b.hours[0] : a.date < b.date ? -1 : 1
  );
  return busy;
}

export function busyHoursOn(busy, dateKey) {
  const hours = new Set();
  if (!Array.isArray(busy) || !dateKey) return hours;
  const dayKey = dayKeyOf(dateKey);
  for (const entry of busy) {
    const applies =
      entry.date === dateKey ||
      (entry.recurring &&
        entry.date <= dateKey &&
        dayKeyOf(entry.date) === dayKey);
    if (applies) entry.hours.forEach((h) => hours.add(h));
  }
  return hours;
}

// schedules: one { availability, busy } per participant.
// Returns slots where everyone is free for the whole flex-adjusted window.
export function recommendSlots(meeting, schedules) {
  const dayKey = dayKeyOf(meeting?.date);
  if (!dayKey) return [];

  const freeSets = schedules.map(({ availability, busy }) => {
    const busyHours = busyHoursOn(busy, meeting.date);
    const day = Array.isArray(availability?.[dayKey]) ? availability[dayKey] : [];
    return new Set(day.filter((h) => !busyHours.has(h)));
  });

  const durationHours = parseDurationHours(meeting.duration);
  const slots = [];
  for (let h = START_HOUR; h <= END_HOUR - durationHours + 1; h += 1) {
    const { realStart, realEnd, blockStart, blockEnd, hours } = slotWindow(h, meeting);
    if (blockStart < START_HOUR || blockEnd > END_HOUR + 1) continue;
    if (realStart >= 24 || realEnd > 24) continue;
    if (!freeSets.every((free) => hours.every((hour) => free.has(hour)))) continue;
    slots.push({ startHour: h, label: `${toLabel(realStart)} - ${toLabel(realEnd)}` });
  }
  return slots;
}

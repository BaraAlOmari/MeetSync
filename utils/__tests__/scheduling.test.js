import {
  busyHoursOn,
  computeBusy,
  parseFlexHours,
  recommendSlots,
  slotWindow,
} from "../scheduling";

// 2026-10-19 is a Monday.
const MONDAY = "2026-10-19";
const allMonday = (hours) => ({ Mon: hours });

describe("parsing", () => {
  it("reads time flex values", () => {
    expect(parseFlexHours("0 mins")).toBe(0);
    expect(parseFlexHours("30 mins")).toBe(0.5);
    expect(parseFlexHours("1 Hour")).toBe(1);
  });

  it("blocks every hour a flexed slot touches", () => {
    const w = slotWindow(10, { duration: "1 Hour", timeFlex: "30 mins" });
    expect(w.hours).toEqual([10, 11]);
  });
});

describe("recommendSlots", () => {
  const meeting = { date: MONDAY, duration: "1 Hour", timeFlex: "0 mins" };

  it("only suggests hours everyone has free", () => {
    const slots = recommendSlots(meeting, [
      { availability: allMonday([9, 10, 11]) },
      { availability: allMonday([10, 11, 12]) },
    ]);
    expect(slots.map((s) => s.label)).toEqual(["10:00 - 11:00", "11:00 - 12:00"]);
  });

  it("skips hours a participant has booked on that date", () => {
    const slots = recommendSlots(meeting, [
      { availability: allMonday([10, 11]) },
      {
        availability: allMonday([10, 11]),
        busy: [{ date: MONDAY, hours: [10], recurring: false }],
      },
    ]);
    expect(slots.map((s) => s.startHour)).toEqual([11]);
  });

  it("ignores bookings on other Mondays", () => {
    const slots = recommendSlots(meeting, [
      {
        availability: allMonday([10]),
        busy: [{ date: "2026-10-26", hours: [10], recurring: false }],
      },
    ]);
    expect(slots).toHaveLength(1);
  });

  it("returns nothing without a valid date", () => {
    expect(recommendSlots({ ...meeting, date: "" }, [{ availability: allMonday([10]) }])).toEqual([]);
  });
});

describe("busy hours", () => {
  const scheduled = (extra) => ({
    date: MONDAY,
    duration: "2 Hours",
    timeFlex: "0 mins",
    selectedSlot: { startHour: 14 },
    ...extra,
  });

  it("derives booked hours from scheduled meetings and drops past ones", () => {
    const busy = computeBusy(
      [
        scheduled(),
        scheduled({ date: "2026-10-01" }),
        { date: MONDAY, duration: "1 Hour" }, // not scheduled yet
      ],
      MONDAY
    );
    expect(busy).toEqual([{ date: MONDAY, hours: [14, 15], recurring: false }]);
  });

  it("keeps past recurring meetings and applies them to later weeks", () => {
    const busy = computeBusy([scheduled({ date: "2026-10-05", recurring: true })], MONDAY);
    expect([...busyHoursOn(busy, MONDAY)]).toEqual([14, 15]);
    expect(busyHoursOn(busy, "2026-10-20").size).toBe(0); // Tuesday
    expect(busyHoursOn(busy, "2026-09-28").size).toBe(0); // before it started
  });
});

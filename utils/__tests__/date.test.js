import { dayKeyOf, parseDateKey, toDateKey } from "../date";

// `npm run test:tz` runs this file under several time zones.
describe(`date keys (${Intl.DateTimeFormat().resolvedOptions().timeZone})`, () => {
  it("keeps the local calendar day late in the evening and early in the morning", () => {
    expect(toDateKey(new Date(2026, 0, 10, 0, 30))).toBe("2026-01-10");
    expect(toDateKey(new Date(2026, 0, 10, 23, 30))).toBe("2026-01-10");
  });

  it("round-trips through parseDateKey", () => {
    expect(toDateKey(parseDateKey("2026-03-29"))).toBe("2026-03-29");
    expect(toDateKey(parseDateKey("2026-12-31"))).toBe("2026-12-31");
  });

  it("returns the weekday of the stored date", () => {
    expect(dayKeyOf("2026-10-19")).toBe("Mon");
    expect(dayKeyOf("2026-10-25")).toBe("Sun");
  });

  it("handles missing or malformed dates", () => {
    expect(parseDateKey("")).toBeNull();
    expect(parseDateKey("10/19/2026")).toBeNull();
    expect(dayKeyOf(undefined)).toBe("");
  });
});

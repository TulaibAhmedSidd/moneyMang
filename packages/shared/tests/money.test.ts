import { toMinorUnits, toMajorUnits, formatMoney } from "../src/utils/money";
import { getLocalDayBounds, getLocalMonthBounds } from "../src/utils/dates";

describe("Money Utilities", () => {
  describe("toMinorUnits", () => {
    it("should convert float amounts to integer minor units based on currency metadata", () => {
      expect(toMinorUnits(10.5, "USD")).toBe(1050);
      expect(toMinorUnits(123.456, "USD")).toBe(12346); // rounds
      expect(toMinorUnits(500, "PKR")).toBe(50000);
      expect(toMinorUnits(500.5, "JPY")).toBe(501); // JPY has 0 minor units, factor is 1, round(500.5) is 501
    });
  });

  describe("toMajorUnits", () => {
    it("should convert minor units back to major float units", () => {
      expect(toMajorUnits(1050, "USD")).toBe(10.5);
      expect(toMajorUnits(50000, "PKR")).toBe(500);
      expect(toMajorUnits(500, "JPY")).toBe(500);
    });
  });

  describe("formatMoney", () => {
    it("should format minor-unit values to localized format strings", () => {
      expect(formatMoney(1050, "USD")).toBe("$10.50");
      expect(formatMoney(500, "JPY")).toBe("¥500");
      expect(formatMoney(50000, "PKR")).toBe("Rs. 500.00");
    });
  });
});

describe("Date & Timezone Utilities", () => {
  describe("getLocalDayBounds", () => {
    it("should calculate correct start and end boundaries for a date in a given timezone", () => {
      const dateStr = "2026-08-09T18:30:00.000Z"; // 6:30 PM UTC
      const timezone = "Asia/Karachi"; // UTC+5

      // In Pakistan, this time is 11:30 PM on August 9, 2026.
      // So the local day start should correspond to local 2026-08-09T00:00:00 in Karachi (UTC+5), which is 2026-08-08T19:00:00Z.
      const bounds = getLocalDayBounds(dateStr, timezone);

      expect(bounds.start.toISOString()).toBe("2026-08-08T19:00:00.000Z");
      expect(bounds.end.toISOString()).toBe("2026-08-09T18:59:59.999Z");
    });
  });

  describe("getLocalMonthBounds", () => {
    it("should calculate correct month boundaries for a month in a given timezone", () => {
      const year = 2026;
      const month = 8; // August
      const timezone = "America/New_York"; // UTC-4 in summer DST

      // Month starts August 1st at 00:00:00 local time
      // local: 2026-08-01 00:00:00 UTC-4 -> UTC: 2026-08-01 04:00:00Z
      const bounds = getLocalMonthBounds(year, month, timezone);

      expect(bounds.start.toISOString()).toBe("2026-08-01T04:00:00.000Z");
    });
  });
});

/**
 * Calculates start and end Date boundaries in UTC for a specific calendar day
 * relative to a target timezone.
 * Useful for ensuring a transaction at 11:30 PM local time appears on the correct local day.
 */
export function getLocalDayBounds(dateInput: Date | string, timezone: string): { start: Date; end: Date } {
  const localDate = new Date(dateInput);

  // Use Intl to format the date in target timezone to find year, month, day
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    year: "numeric",
    month: "numeric",
    day: "numeric",
  });

  const parts = formatter.formatToParts(localDate);
  const getPart = (type: string) => parseInt(parts.find((p) => p.type === type)?.value || "0", 10);

  const year = getPart("year");
  const month = getPart("month") - 1; // 0-indexed in JS
  const day = getPart("day");

  // Construct start of day in local time
  const localStart = new Date(Date.UTC(year, month, day, 0, 0, 0, 0));
  
  // Find local start in UTC by comparing format offsets or using tz offset logic.
  // A clean way is to estimate offset and adjust. Let's get the timezone offset in ms:
  const tzOffsetMs = getTimezoneOffset(timezone, localStart);

  const startUtc = new Date(localStart.getTime() - tzOffsetMs);
  const endUtc = new Date(startUtc.getTime() + 24 * 60 * 60 * 1000 - 1); // 23:59:59.999

  return { start: startUtc, end: endUtc };
}

/**
 * Calculates start and end Date boundaries in UTC for a specific month
 * relative to a target timezone.
 */
export function getLocalMonthBounds(year: number, month: number, timezone: string): { start: Date; end: Date } {
  // month is 1-indexed (1 = Jan, 12 = Dec)
  const monthIdx = month - 1;

  const localStart = new Date(Date.UTC(year, monthIdx, 1, 0, 0, 0, 0));
  const localEnd = new Date(Date.UTC(year, monthIdx + 1, 1, 0, 0, 0, 0));

  const startOffset = getTimezoneOffset(timezone, localStart);
  const endOffset = getTimezoneOffset(timezone, localEnd);

  const startUtc = new Date(localStart.getTime() - startOffset);
  const endUtc = new Date(localEnd.getTime() - endOffset - 1);

  return { start: startUtc, end: endUtc };
}

/**
 * Helper to calculate timezone offset in milliseconds for a specific UTC date.
 */
export function getTimezoneOffset(timeZone: string, date: Date): number {
  const tzString = date.toLocaleString("en-US", { timeZone });
  const localDate = new Date(tzString);
  const utcDate = new Date(date.toLocaleString("en-US", { timeZone: "UTC" }));
  return localDate.getTime() - utcDate.getTime();
}

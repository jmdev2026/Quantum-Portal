// A viewing preference only. Laravel must authorize every requested organization.
export type DashboardScope = { type: "all" } | { type: "customer"; customer_id: number };

export const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

export const isCount = (value: unknown): value is number => Number.isSafeInteger(value) && (value as number) >= 0;

export const textOrNull = (value: unknown) => (typeof value === "string" && value.trim() !== "" ? value : null);

// Agreed backend format: RFC 3339 date-time with an explicit Z or ±HH:MM offset and 0–9 fractional digits.
// Date.parse alone is not used because it accepts "1", date-only and zone-less values and rolls Feb 30 into March.
const RFC3339 = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.(\d{1,9}))?(?:Z|([+-])(\d{2}):(\d{2}))$/;

const MONTH_DAYS = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
const isLeapYear = (year: number) => (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
const daysInMonth = (year: number, month: number) => (month === 2 && isLeapYear(year) ? 29 : MONTH_DAYS[month - 1]);

/** Epoch milliseconds for a strictly valid RFC 3339 instant, otherwise null. */
export function parseInstant(value: unknown): number | null {
  if (typeof value !== "string") return null;
  const match = RFC3339.exec(value);
  if (!match) return null;
  const [year, month, day, hour, minute, second] = match.slice(1, 7).map(Number);
  const [, , , , , , , fraction, sign, offsetHour, offsetMinute] = match;
  if (month < 1 || month > 12 || day < 1 || day > daysInMonth(year, month)) return null;
  if (hour > 23 || minute > 59 || second > 59) return null;
  if (sign && (Number(offsetHour) > 23 || Number(offsetMinute) > 59)) return null;

  const date = new Date(0);
  date.setUTCFullYear(year, month - 1, day);
  date.setUTCHours(hour, minute, second, fraction ? Number(fraction.padEnd(3, "0").slice(0, 3)) : 0);
  const offset = sign ? (sign === "-" ? -1 : 1) * (Number(offsetHour) * 60 + Number(offsetMinute)) : 0;
  return date.getTime() - offset * 60_000;
}

// Tolerated provider/browser clock difference before a historical timestamp counts as implausibly in the future.
export const CLOCK_SKEW_TOLERANCE_MS = 5 * 60_000;

export type TimestampCheck =
  | { kind: "missing" | "null" | "malformed" }
  | { kind: "future" | "valid"; value: string; time: number };

/** Classifies a historical event time (sync, observation, update); `now` is injectable for deterministic tests. */
export function checkHistoricalTimestamp(value: unknown, now: number): TimestampCheck {
  if (value === undefined) return { kind: "missing" };
  if (value === null) return { kind: "null" };
  const time = parseInstant(value);
  if (time === null) return { kind: "malformed" };
  return { kind: time > now + CLOCK_SKEW_TOLERANCE_MS ? "future" : "valid", value: value as string, time };
}

/** A historical timestamp usable as evidence, or null when missing, malformed or beyond the skew tolerance. */
export const historicalTimestampOrNull = (value: unknown, now: number) => {
  const check = checkHistoricalTimestamp(value, now);
  return check.kind === "valid" ? check.value : null;
};

export function parseScope(value: unknown): DashboardScope | null {
  if (!isRecord(value)) return null;
  if (value.type === "all") return { type: "all" };
  if (value.type === "customer" && Number.isSafeInteger(value.customer_id)) {
    return { type: "customer", customer_id: value.customer_id as number };
  }
  return null;
}

export const sameScope = (a: DashboardScope, b: DashboardScope) =>
  a.type === b.type && (a.type === "all" || (b.type === "customer" && a.customer_id === b.customer_id));

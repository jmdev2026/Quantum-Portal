// A viewing preference only. Laravel must authorize every requested organization.
export type DashboardScope = { type: "all" } | { type: "customer"; customer_id: number };

export const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

export const isCount = (value: unknown): value is number => Number.isSafeInteger(value) && (value as number) >= 0;

export const textOrNull = (value: unknown) => (typeof value === "string" && value.trim() !== "" ? value : null);

export const timestampOrNull = (value: unknown) =>
  typeof value === "string" && !Number.isNaN(Date.parse(value)) ? value : null;

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

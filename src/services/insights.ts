import { buildUnavailableInsights } from "@/mocks/insights";
import {
  isRecord,
  parseScope,
  sameScope,
  textOrNull,
  timestampOrNull,
  type DashboardScope,
} from "@/services/dashboard-response";

export const INSIGHT_CATEGORIES = ["security", "tip", "operations"] as const;
export type InsightCategory = (typeof INSIGHT_CATEGORIES)[number];

export const INSIGHT_PRIORITIES = ["critical", "high", "medium", "low", "informational"] as const;
export type InsightPriority = (typeof INSIGHT_PRIORITIES)[number];

export const INSIGHT_TEXT_LIMITS = { id: 64, title: 140, summary: 500, source: 60 } as const;
export const MAX_DISPLAYED_INSIGHTS = 50;

export type InsightsStatus = "ready" | "stale" | "empty" | "unavailable" | "error";

export type InsightResource = {
  id: number | string;
  category: InsightCategory;
  title: string;
  summary: string;
  priority?: InsightPriority | null;
  source: string | null;
  observed_at?: string | null;
  updated_at?: string | null;
};

export type InsightsResource = {
  scope: DashboardScope;
  status: InsightsStatus;
  insights: InsightResource[] | null;
  source: string | null;
  last_synced_at?: string | null;
  message?: string | null;
};

export type InsightsResponse = { data: InsightsResource };

export type Insight = {
  id: string;
  category: InsightCategory;
  title: string;
  summary: string;
  priority: InsightPriority | null;
  source: string | null;
  observedAt: string | null;
  updatedAt: string | null;
};

type SyncInfo = { source: string | null; lastSyncedAt: string | null };

export type InsightsState =
  | { kind: "loading" }
  | ({ kind: "ready" | "stale"; insights: Insight[]; hiddenCount: number } & SyncInfo)
  | ({ kind: "empty" | "unavailable" } & SyncInfo)
  | { kind: "error"; message: string };

// Proposed Quantum Shield Laravel route — not a Guardz endpoint. Laravel authenticates the request, validates
// customer access, enforces tenant isolation and returns only normalized, authorized insights for the requested scope.
// TODO(api): GET /api/dashboard/insights — read-only security, tip and operations insights for the requested view
// request: { customer_id?: number }  (omit customer_id for the All Customers view)
// response: { data: { scope: { type: "all" } | { type: "customer", customer_id }, status, insights: [{ id, category: "security" | "tip" | "operations", title, summary, priority: "critical" | "high" | "medium" | "low" | "informational" | null, source, observed_at, updated_at }] | null, source, last_synced_at, message } }
export async function getInsights(scope: DashboardScope): Promise<InsightsResponse> {
  await new Promise((resolve) => setTimeout(resolve, 250));
  return buildUnavailableInsights(scope);
}

const categories = new Set<unknown>(INSIGHT_CATEGORIES);
const priorities = new Set<unknown>(INSIGHT_PRIORITIES);

const boundedText = (value: unknown, limit: number) => {
  const text = textOrNull(value)?.replace(/\s+/g, " ").trim();
  if (!text) return null;
  return text.length > limit ? `${text.slice(0, limit - 1).trimEnd()}…` : text;
};

function parseId(value: unknown): string | null {
  if (Number.isSafeInteger(value) && (value as number) >= 0) return String(value);
  if (typeof value === "string" && value.trim() !== "" && value.length <= INSIGHT_TEXT_LIMITS.id) return value.trim();
  return null;
}

function parseInsight(value: unknown): Insight | null {
  if (!isRecord(value)) return null;
  const id = parseId(value.id);
  const title = boundedText(value.title, INSIGHT_TEXT_LIMITS.title);
  const summary = boundedText(value.summary, INSIGHT_TEXT_LIMITS.summary);
  if (!id || !title || !summary || !categories.has(value.category)) return null;
  if (value.priority !== undefined && value.priority !== null && !priorities.has(value.priority)) return null;
  return {
    id,
    category: value.category as InsightCategory,
    title,
    summary,
    priority: (value.priority as InsightPriority | null | undefined) ?? null,
    source: boundedText(value.source, INSIGHT_TEXT_LIMITS.source),
    observedAt: timestampOrNull(value.observed_at),
    updatedAt: timestampOrNull(value.updated_at),
  };
}

function parseInsights(value: unknown): Insight[] | null {
  if (!Array.isArray(value)) return null;
  const seen = new Set<string>();
  const insights: Insight[] = [];
  for (const entry of value) {
    const insight = parseInsight(entry);
    if (!insight || seen.has(insight.id)) return null;
    seen.add(insight.id);
    insights.push(insight);
  }
  return insights;
}

export function normalizeInsights(response: unknown, requested: DashboardScope): InsightsState {
  const data = isRecord(response) ? response.data : null;
  if (!isRecord(data)) return { kind: "error", message: "Insights came back in an unexpected format." };

  const scope = parseScope(data.scope);
  if (!scope || !sameScope(scope, requested)) {
    return { kind: "error", message: "Insights did not match the selected customer view." };
  }

  const sync = {
    source: boundedText(data.source, INSIGHT_TEXT_LIMITS.source),
    lastSyncedAt: timestampOrNull(data.last_synced_at),
  };

  switch (data.status) {
    case "ready":
    case "stale": {
      const insights = parseInsights(data.insights);
      if (!insights) return { kind: "error", message: "Received invalid or duplicate insight records." };
      return {
        kind: data.status,
        insights: insights.slice(0, MAX_DISPLAYED_INSIGHTS),
        hiddenCount: Math.max(0, insights.length - MAX_DISPLAYED_INSIGHTS),
        ...sync,
      };
    }
    case "empty":
    case "unavailable":
      return { kind: data.status, ...sync };
    case "error":
      return { kind: "error", message: boundedText(data.message, 200) ?? "The insights provider reported an error." };
    default:
      return { kind: "error", message: "Received an unrecognized status." };
  }
}

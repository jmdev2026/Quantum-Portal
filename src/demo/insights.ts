import type { DashboardScope } from "@/services/dashboard-response";
import type { InsightCategory, InsightPriority, InsightsResponse } from "@/services/insights";
import type { ControlStatus, SecurityControlKey } from "@/services/security-coverage";

// Fictional demonstration observations. Not Guardz findings, and never sent to or stored by any backend.
export const DEMO_INSIGHTS_SOURCE = "Simulated demo data";

export type DemoInsight = {
  id: string;
  category: InsightCategory;
  title: string;
  summary: string;
  priority: InsightPriority | null;
  // Demo control statuses this observation describes; kept in step with src/demo/security-coverage.ts.
  relatesTo: { key: SecurityControlKey; status: ControlStatus }[];
};

// Defined explicitly rather than aggregated from individual customers.
export const DEMO_ALL_CUSTOMER_INSIGHTS: DemoInsight[] = [
  {
    id: "demo-all-1",
    category: "security",
    title: "Review identity threat monitoring across the portfolio",
    summary:
      "Identity Threat Detection & Response is marked Needs attention in the simulated All Customers view. Review how identity alerts are monitored and escalated.",
    priority: "high",
    relatesTo: [{ key: "itdr", status: "needs_attention" }],
  },
  {
    id: "demo-all-2",
    category: "security",
    title: "Evaluate dark web monitoring follow-up procedures",
    summary:
      "Dark Web Monitoring is marked Needs attention in the simulated portfolio view. Confirm who reviews exposed-credential notices and how affected users are contacted.",
    priority: "medium",
    relatesTo: [{ key: "dark_web_monitoring", status: "needs_attention" }],
  },
  {
    id: "demo-all-3",
    category: "tip",
    title: "Strengthen the awareness and phishing program",
    summary:
      "Security Awareness Training and Phishing Simulations are both marked Needs attention in this demonstration. A regular training and simulation schedule can help keep habits current.",
    priority: "medium",
    relatesTo: [
      { key: "security_awareness_training", status: "needs_attention" },
      { key: "phishing_simulations", status: "needs_attention" },
    ],
  },
  {
    id: "demo-all-4",
    category: "operations",
    title: "Confirm visibility for controls reported as Unknown",
    summary:
      "External Footprint Scan and Cloud Data Protection show Unknown in the simulated portfolio view. Check whether these controls are in scope and how their status would be reported.",
    priority: "low",
    relatesTo: [
      { key: "external_footprint_scan", status: "unknown" },
      { key: "cloud_data_protection", status: "unknown" },
    ],
  },
  {
    id: "demo-all-5",
    category: "operations",
    title: "Establish recurring operational security reviews",
    summary:
      "Schedule a regular review of control statuses and open issues with each customer so that changes are discussed and recorded consistently.",
    priority: "informational",
    relatesTo: [],
  },
];

// Keyed by the IDs in src/mocks/customers.ts (Demo Customer A = 1, B = 2, C = 3).
export const DEMO_CUSTOMER_INSIGHTS: ReadonlyMap<number, DemoInsight[]> = new Map([
  [
    1,
    [
      {
        id: "demo-a-1",
        category: "security",
        title: "Review phishing simulation activity",
        summary:
          "Phishing Simulations is the only control marked Needs attention for Demo Customer A. Review how often simulations run and how results are followed up.",
        priority: "medium",
        relatesTo: [{ key: "phishing_simulations", status: "needs_attention" }],
      },
      {
        id: "demo-a-2",
        category: "tip",
        title: "Keep security education short and frequent",
        summary:
          "Security Awareness Training is marked Covered in this demonstration. Brief, regular refreshers can help keep that training relevant between annual sessions.",
        priority: "informational",
        relatesTo: [{ key: "security_awareness_training", status: "covered" }],
      },
      {
        id: "demo-a-3",
        category: "tip",
        title: "Pair simulation results with targeted topics",
        summary:
          "Because Phishing Simulations is marked Needs attention, use the themes from recent simulations to choose the next awareness topics, so education focuses on the scenarios people found hardest.",
        priority: "low",
        relatesTo: [{ key: "phishing_simulations", status: "needs_attention" }],
      },
    ],
  ],
  [
    2,
    [
      {
        id: "demo-b-1",
        category: "security",
        title: "Review identity threat detection",
        summary:
          "Identity Threat Detection & Response is marked Needs attention for Demo Customer B. Confirm how identity alerts are monitored and who responds to them.",
        priority: "high",
        relatesTo: [{ key: "itdr", status: "needs_attention" }],
      },
      {
        id: "demo-b-2",
        category: "security",
        title: "Examine external footprint monitoring coverage",
        summary:
          "External Footprint Scan is marked Needs attention in this demonstration. Check that the customer's public-facing domains and services are included in scanning.",
        priority: "medium",
        relatesTo: [{ key: "external_footprint_scan", status: "needs_attention" }],
      },
      {
        id: "demo-b-3",
        category: "operations",
        title: "Review dark web monitoring workflows",
        summary:
          "Dark Web Monitoring is marked Needs attention for Demo Customer B. Agree on who reviews exposure notices and how quickly affected users are contacted.",
        priority: "medium",
        relatesTo: [{ key: "dark_web_monitoring", status: "needs_attention" }],
      },
      {
        id: "demo-b-4",
        category: "tip",
        title: "Improve phishing simulation and awareness activities",
        summary:
          "Security Awareness Training and Phishing Simulations are both marked Needs attention. A combined plan of short training and periodic simulations can help both areas.",
        priority: "medium",
        relatesTo: [
          { key: "security_awareness_training", status: "needs_attention" },
          { key: "phishing_simulations", status: "needs_attention" },
        ],
      },
    ],
  ],
  [
    3,
    [
      {
        id: "demo-c-1",
        category: "security",
        title: "Review identity security controls",
        summary:
          "Identity Threat Detection & Response is marked Needs attention for Demo Customer C. Review identity monitoring and the steps taken when an alert is raised.",
        priority: "high",
        relatesTo: [{ key: "itdr", status: "needs_attention" }],
      },
      {
        id: "demo-c-2",
        category: "operations",
        title: "Validate external footprint scan visibility",
        summary:
          "External Footprint Scan shows Unknown in this demonstration. Confirm whether scanning is configured for this customer and how its status would be reported.",
        priority: "medium",
        relatesTo: [{ key: "external_footprint_scan", status: "unknown" }],
      },
      {
        id: "demo-c-3",
        category: "tip",
        title: "Strengthen phishing simulation activities",
        summary:
          "Phishing Simulations is marked Needs attention for Demo Customer C. Running simulations on a predictable schedule makes progress easier to track.",
        priority: "medium",
        relatesTo: [{ key: "phishing_simulations", status: "needs_attention" }],
      },
    ],
  ],
]);

// Unknown customers get an explicit error, never another customer's insights.
export function buildDemoInsights(scope: DashboardScope): InsightsResponse {
  const fixture = scope.type === "all" ? DEMO_ALL_CUSTOMER_INSIGHTS : DEMO_CUSTOMER_INSIGHTS.get(scope.customer_id);
  if (!fixture) {
    return {
      data: {
        scope,
        status: "error",
        insights: null,
        source: DEMO_INSIGHTS_SOURCE,
        last_synced_at: null,
        message: "No demonstration data exists for this customer.",
      },
    };
  }
  return {
    data: {
      scope,
      status: "ready",
      insights: fixture.map(({ id, category, title, summary, priority }) => ({
        id,
        category,
        title,
        summary,
        priority,
        source: DEMO_INSIGHTS_SOURCE,
        observed_at: null,
        updated_at: null,
      })),
      source: DEMO_INSIGHTS_SOURCE,
      last_synced_at: null,
      message: null,
    },
  };
}

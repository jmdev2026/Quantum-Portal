import type { Detection, DetectionsState } from "@/services/security-detections";
import { SEVERITY_LEVELS, type SeverityLevel } from "@/services/security-severity";

export type DetectionFilters = { search: string; severity: SeverityLevel | "all"; sort: "severity" | "title-asc" | "title-desc" };
export const DEFAULT_DETECTION_FILTERS: DetectionFilters = { search: "", severity: "all", sort: "severity" };
const compareText = (a: string, b: string) => a < b ? -1 : a > b ? 1 : 0;

export function filterDetections(records: readonly Detection[], filters: DetectionFilters): Detection[] {
  const query = filters.search.trim().toLowerCase();
  return records.filter(record =>
    (filters.severity === "all" || record.severity === filters.severity) &&
    [record.title, record.summary, record.customerName, record.source].some(text => text.toLowerCase().includes(query)),
  ).sort((a, b) => {
    const title = compareText(a.title.toLowerCase(), b.title.toLowerCase());
    const primary = filters.sort === "severity" ? SEVERITY_LEVELS.indexOf(a.severity) - SEVERITY_LEVELS.indexOf(b.severity) : filters.sort === "title-desc" ? -title : title;
    return primary || title || compareText(a.id, b.id);
  });
}

export function selectedDetection(state: DetectionsState, id: string | null): Detection | null {
  return state.kind === "ready" ? state.detections.find(record => record.id === id) ?? null : null;
}

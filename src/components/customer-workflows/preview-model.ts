export const ONBOARDING_NOTICE = "Demonstration only. No customer account, tenant, service agreement or invitation has been created.";
export const SETTINGS_NOTICE = "Configuration preview — not saved";
export const SERVICE_CHOICES = ["Security reporting", "Backup reporting", "Users & Devices visibility"] as const;
export const ENVIRONMENTS = ["Cloud-first", "Hybrid", "On-premises"] as const;
export const REVIEW_CADENCES = ["Weekly", "Monthly", "Quarterly"] as const;
export const TIME_ZONES = ["UTC", "America/New_York", "Europe/London", "Australia/Sydney"] as const;
export type OnboardingDraft = { organization: string; contact: string; email: string; services: string[]; environment: string; notes: string };
export const emptyOnboarding = (): OnboardingDraft => ({ organization: "", contact: "", email: "", services: [], environment: "", notes: "" });
export type SettingsDraft = { label: string; timeZone: string; cadence: string; sections: string[] };
export const initialSettings = (): SettingsDraft => ({ label: "Demo: Monthly review", timeZone: "UTC", cadence: "Monthly", sections: [...SERVICE_CHOICES] });
const demoText = (value: string, min: number, max: number) => value.length >= min && value.length <= max && /^Demo: [A-Za-z][A-Za-z ,.'()-]*$/.test(value) && !/www\.|[A-Za-z]\.[A-Za-z]|\b(password|credential|token|secret|api key)\b/i.test(value);
const choices = (values: string[], allowed: readonly string[]) => values.length > 0 && new Set(values).size === values.length && values.every(value => allowed.includes(value));
export function validateOnboarding(draft: OnboardingDraft, step: number): string | null {
  if (step === 0 && !demoText(draft.organization.trim(), 12, 80)) return "Organization must start with Demo: and contain 12–80 fictional letters and punctuation.";
  if (step === 1 && (!demoText(draft.contact.trim(), 10, 80) || draft.email.length > 80 || /\s/.test(draft.email) || !/^[a-z]+(?:[.-][a-z]+)*@demo\.(example\.com|example\.net|example\.org)$/.test(draft.email))) return "Use a fictional contact starting with Demo: and an address such as contact@demo.example.com. Real contact information is not permitted.";
  if (step === 2 && !choices(draft.services, SERVICE_CHOICES)) return "Choose at least one supported reporting area.";
  if (step === 3 && (!ENVIRONMENTS.includes(draft.environment as typeof ENVIRONMENTS[number]) || (draft.notes !== "" && !demoText(draft.notes.trim(), 12, 200)))) return "Choose an environment. Optional fictional notes must start with Demo: and contain 12–200 letters and punctuation, without links or identifiers.";
  return null;
}
export function validateAllOnboarding(draft: OnboardingDraft) { return [0, 1, 2, 3].map(step => validateOnboarding(draft, step)).find(Boolean) ?? null; }
export function validateSettings(draft: SettingsDraft): string | null {
  if (!demoText(draft.label.trim(), 12, 80)) return "Review label must start with Demo: and contain 12–80 fictional letters and punctuation.";
  if (!TIME_ZONES.includes(draft.timeZone as typeof TIME_ZONES[number]) || !REVIEW_CADENCES.includes(draft.cadence as typeof REVIEW_CADENCES[number]) || !choices(draft.sections, SERVICE_CHOICES)) return "Choose a listed time zone, cadence and at least one reporting area.";
  return null;
}

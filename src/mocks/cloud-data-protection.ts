import { capabilityFixtures } from "@/mocks/security-capability-fixtures";

export const cloudDataProtectionResponse = capabilityFixtures("cloud-data-protection", "cloud observation", [
  { category: "shared-storage", severity: null, observation: "Fictional shared-storage visibility scenario. No actual cloud drive, customer file, sharing event or data-loss incident is represented." },
  { category: "mail-service", severity: null, observation: "Fictional cloud mail-service visibility scenario. No tenant account, verified protection, backup coverage or recovery point is represented." },
]);

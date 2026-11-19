import { capabilityFixtures } from "@/mocks/security-capability-fixtures";

export const externalFootprintResponse = capabilityFixtures("external-footprint", "exposure", [
  { category: "domain", severity: "medium", observation: "Fictional domain-ownership review scenario. This reserved example domain has not been scanned; no public IP address, open port or vulnerability is asserted." },
  { category: "certificate", severity: "low", observation: "Fictional certificate-visibility scenario. No certificate was retrieved and no expiration or confirmed exposure is reported." },
]);

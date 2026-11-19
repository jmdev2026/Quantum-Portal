import { capabilityFixtures } from "@/mocks/security-capability-fixtures";

export const emailProtectionResponse = capabilityFixtures("email-protection", "email finding", [
  { category: "impersonation", severity: null, observation: "Fictional message-label classification scenario illustrating a possible impersonation review. No email body, sender, recipient or delivered message is included." },
  { category: "attachment-review", severity: null, observation: "Fictional attachment-review classification scenario. There is no actual attachment or malicious link; no message was scanned or quarantined." },
]);

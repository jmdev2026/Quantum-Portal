import Link from "next/link";
import { SharedPage } from "@/components/shared-experience/shared-ui";
import { governanceAction, governancePanel } from "@/components/governance/governance-ui";
export default function NotFound() { return <SharedPage title="Page not found" description="404 · This destination does not exist. An unknown route never grants access or selects another customer."><section className={governancePanel}><h2 className="text-xl font-semibold">Choose an existing destination</h2><p className="text-sm">Use global navigation search or return to the Dashboard. No record availability or authorization decision is implied.</p><Link href="/" className={governanceAction}>Return to Dashboard</Link></section></SharedPage>; }

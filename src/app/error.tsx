"use client";
import Link from "next/link";
import { SharedPage } from "@/components/shared-experience/shared-ui";
import { governanceAction, governancePanel } from "@/components/governance/governance-ui";
export default function ApplicationError({ reset }: { error: Error & { digest?: string }; reset: () => void }) { return <SharedPage title="This workspace could not be displayed" description="An application error occurred. It is not an empty dataset or a successful operation."><section className={governancePanel}><h2 className="text-xl font-semibold">Try rendering this workspace again</h2><p role="alert" className="text-sm">No sensitive error details are displayed. Retrying renders the workspace again; it does not connect a missing backend.</p><div className="flex flex-wrap gap-2"><button className={governanceAction} onClick={reset}>Retry Workspace</button><Link href="/help" className={governanceAction}>Help & Support</Link></div></section></SharedPage>; }

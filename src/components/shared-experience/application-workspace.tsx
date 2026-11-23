"use client";
import { useDashboardMode } from "@/components/dashboard-mode/dashboard-mode-provider";
import { WorkflowBoundary } from "@/components/customer-workflows/workflow-boundary";
import { SharedPage } from "@/components/shared-experience/shared-ui";
import { AuthenticationPreview, AccessMessage } from "@/components/shared-experience/access-preview";
import { AccountWorkspace } from "@/components/shared-experience/account-workspace";
import { NotificationsWorkspace } from "@/components/shared-experience/notifications-workspace";
import { HelpWorkspace } from "@/components/shared-experience/help-workspace";
import { SHARED_ROUTES } from "@/components/shared-experience/experience-model";
export function ApplicationWorkspace({ experience }: { experience: typeof SHARED_ROUTES[number] }) {
  const { mode } = useDashboardMode();
  const title = ({ "sign-in": "Authentication Design", "access-denied": "Access & Session State Preview", account: "Account", notifications: "Notification Center", help: "Help & Support" })[experience];
  return <SharedPage title={title} description={experience === "help" ? "Practical guidance for using Quantum Shield Command and understanding its current integration boundaries." : "Frontend experience only. No real authentication, account mutation or operational message delivery is connected."}>
    {(experience === "sign-in" || experience === "access-denied") && <AuthenticationPreview key={experience} denied={experience === "access-denied"} />}
    {experience === "help" && <HelpWorkspace />}
    {experience === "account" && (mode === "live" ? <AccessMessage state="required" /> : <WorkflowBoundary><AccountWorkspace /></WorkflowBoundary>)}
    {experience === "notifications" && <WorkflowBoundary><NotificationsWorkspace /></WorkflowBoundary>}
  </SharedPage>;
}

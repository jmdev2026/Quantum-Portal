import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

export function DrilldownLink({ href, children }: { href: string; children: React.ReactNode }) {
  return <Link href={href} className="inline-flex min-h-10 items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-shield-300 outline-none hover:bg-shield-500/10 hover:text-shield-200 focus-visible:ring-2 focus-visible:ring-shield-400">{children}<ArrowUpRight aria-hidden className="h-4 w-4 shrink-0" /></Link>;
}

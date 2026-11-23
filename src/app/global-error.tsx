"use client";
import Link from "next/link";
export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <html lang="en"><body style={{ margin: 0, background: "#07090a", color: "#e6eaeb", fontFamily: "system-ui", lineHeight: 1.5 }}><main style={{ maxWidth: 640, padding: 32, margin: "auto" }}><p>Quantum Shield Command</p><h1>Application unavailable</h1><p role="alert">The application shell could not be displayed. No sensitive technical details are exposed and no operation is confirmed.</p><button onClick={reset} style={{ padding: 16, background: "#131718", color: "#e6eaeb", border: "1px solid #39ff88", borderRadius: 8 }}>Retry Application</button><p><Link href="/" style={{ color: "#7dffb0" }}>Return to Dashboard</Link></p></main></body></html>;
}

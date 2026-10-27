"use client";

import { useEffect, useState } from "react";
import { formatCoveragePercentage } from "@/services/security-coverage";

type CoverageGaugeProps =
  | { variant: "value"; percentage: number; stale: boolean }
  | { variant: "loading" | "neutral" };

export function CoverageGauge(props: CoverageGaugeProps) {
  const target = props.variant === "value" ? props.percentage : 0;
  const [drawn, setDrawn] = useState(0);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setDrawn(target));
    return () => cancelAnimationFrame(frame);
  }, [target]);

  const label =
    props.variant === "value"
      ? `Security coverage ${formatCoveragePercentage(props.percentage)}${props.stale ? ", possibly out of date" : ""}`
      : props.variant === "loading"
        ? "Loading security coverage"
        : "Security coverage not available";

  return (
    <div role="img" aria-label={label} className="relative aspect-square w-36 shrink-0 sm:w-40">
      <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90" aria-hidden>
        <circle
          cx="60"
          cy="60"
          r="52"
          fill="none"
          strokeWidth="10"
          className={`stroke-ink-700 ${props.variant === "loading" ? "animate-pulse" : ""}`}
          strokeDasharray={props.variant === "neutral" ? "2 4" : undefined}
          pathLength={props.variant === "neutral" ? 108 : undefined}
        />
        {props.variant === "value" && (
          <circle
            cx="60"
            cy="60"
            r="52"
            fill="none"
            strokeWidth="10"
            pathLength={100}
            strokeDasharray={`${drawn} 100`}
            strokeLinecap={props.percentage > 0 ? "round" : "butt"}
            className={`motion-safe:transition-[stroke-dasharray] motion-safe:duration-700 motion-safe:ease-out ${
              props.stale ? "stroke-shield-600/60" : "stroke-shield-400"
            }`}
          />
        )}
      </svg>
      <div aria-hidden className="absolute inset-0 flex flex-col items-center justify-center text-center">
        {props.variant === "value" ? (
          <>
            <span
              className={`text-3xl font-semibold leading-none tabular-nums ${props.stale ? "text-ink-300" : "text-ink-100"}`}
            >
              {formatCoveragePercentage(props.percentage)}
            </span>
            <span className="mt-1.5 font-mono text-[10px] uppercase tracking-wider text-ink-400">Coverage</span>
          </>
        ) : props.variant === "loading" ? (
          <span className="h-6 w-14 animate-pulse rounded bg-ink-700" />
        ) : (
          <>
            <span className="text-2xl font-semibold leading-none text-ink-400">--</span>
            <span className="mt-1.5 font-mono text-[10px] uppercase tracking-wider text-ink-400">Not available</span>
          </>
        )}
      </div>
    </div>
  );
}

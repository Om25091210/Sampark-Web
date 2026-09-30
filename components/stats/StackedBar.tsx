"use client";

import { useState } from "react";
import { formatCount } from "./chartUtils";

export interface StackedSegment {
  key: string;
  label: string;
  value: number;
  /** A CSS colour token. */
  color: string;
  /** Ink for a label set INSIDE this fill, picked for contrast against it. */
  ink: "dark" | "light";
  /** Overrides the formatted value in the legend/tooltip (e.g. "45%") and, being
   *  already a share, suppresses the separate percentage column. */
  display?: string;
}

interface StackedBarProps {
  segments: StackedSegment[];
  ariaLabel: string;
  emptyLabel?: string;
}

const MIN_INLINE_SHARE = 12; // % of the bar a segment needs before a label fits inside it

// One horizontal bar split into parts of a whole (<= 5 parts). Each part is a hit target
// with its own tooltip; the legend below repeats every value, so the tooltip never gates one.
export default function StackedBar({ segments, ariaLabel, emptyLabel = "कोई डेटा उपलब्ध नहीं है।" }: StackedBarProps) {
  const [active, setActive] = useState<number | null>(null);
  const total = segments.reduce((s, x) => s + x.value, 0);

  if (total === 0) {
    return (
      <p className="t-body-sm" style={{ color: "var(--text-tertiary)" }}>
        {emptyLabel}
      </p>
    );
  }

  const share = (v: number) => Math.round((v / total) * 100);
  const shown = segments.filter((s) => s.value > 0);
  // Centre of each drawn segment as a % of the bar, for tooltip placement.
  const centres = shown.map((s, i) => {
    const before = shown.slice(0, i).reduce((sum, x) => sum + x.value, 0);
    return ((before + s.value / 2) / total) * 100;
  });
  const activeSeg = active !== null ? shown[active] : undefined;

  return (
    <div>
      <div style={{ position: "relative" }} onPointerLeave={() => setActive(null)}>
        <div role="group" aria-label={ariaLabel} style={{ display: "flex", gap: 2, height: 28, borderRadius: "var(--radius-sm)", overflow: "hidden" }}>
          {shown.map((s, i) => (
            <div
              key={s.key}
              tabIndex={0}
              aria-label={`${s.label}: ${s.display ?? formatCount(s.value)} (${share(s.value)}%)`}
              onPointerEnter={() => setActive(i)}
              onFocus={() => setActive(i)}
              onBlur={() => setActive(null)}
              style={{
                flexGrow: s.value,
                flexBasis: 0,
                minWidth: 3,
                background: s.color,
                opacity: active === null || active === i ? 1 : 0.5,
                transition: "opacity 0.15s var(--ease)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                outline: "none",
              }}
            >
              {share(s.value) >= MIN_INLINE_SHARE && (
                <span className="tabular-nums" style={{ fontSize: "0.75rem", fontWeight: 700, color: s.ink === "light" ? "var(--on-dark)" : "var(--text-primary)" }}>
                  {share(s.value)}%
                </span>
              )}
            </div>
          ))}
        </div>

        {activeSeg !== undefined && active !== null && (
          <div className="chart-tooltip" style={{ left: `${Math.min(86, Math.max(14, centres[active] ?? 50))}%`, top: 0 }}>
            <div className="t-caption">{activeSeg.label}</div>
            <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", marginTop: 2 }}>
              <span style={{ width: 12, height: 3, borderRadius: 2, background: activeSeg.color, flexShrink: 0 }} />
              <strong className="tabular-nums" style={{ fontSize: "0.9375rem", color: "var(--text-primary)" }}>
                {activeSeg.display ?? formatCount(activeSeg.value)}
              </strong>
              {activeSeg.display === undefined && <span className="t-caption tabular-nums">{share(activeSeg.value)}%</span>}
            </div>
          </div>
        )}
      </div>

      <ul style={{ listStyle: "none", margin: 0, padding: 0, marginTop: "var(--space-4)", display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
        {segments.map((s) => (
          <li key={s.key} style={{ display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
            <span style={{ width: 10, height: 10, borderRadius: 3, background: s.color, flexShrink: 0 }} />
            <span style={{ flex: 1, fontSize: "0.8125rem", color: "var(--text-secondary)" }}>{s.label}</span>
            <span className="tabular-nums" style={{ fontSize: "0.8125rem", fontWeight: 700, color: "var(--text-primary)" }}>
              {s.display ?? formatCount(s.value)}
            </span>
            {/* A segment that brings its own display value (already a percentage) has no second column to add. */}
            {s.display === undefined && (
              <span className="tabular-nums t-caption" style={{ width: 40, textAlign: "right" }}>
                {share(s.value)}%
              </span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

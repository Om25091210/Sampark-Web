"use client";

import { useState } from "react";
import { TIERS } from "@/components/dashboard/BarChart";
import type { RecencyByThanaRow } from "@/lib/api";

interface RecencyRowsProps {
  rows: RecencyByThanaRow[];
  ariaLabel: string;
}

// Each thana as one 100% stacked bar of the four recency tiers, ordered as the caller gave.
// Tier colours are the design system's status ramp (same as the dashboard's recency chart),
// each tier is named in the legend, and the exact counts live in the tooltip and table twin.
export default function RecencyRows({ rows, ariaLabel }: RecencyRowsProps) {
  const [active, setActive] = useState<number | null>(null);

  if (rows.length === 0) {
    return (
      <p className="t-body-sm" style={{ color: "var(--text-tertiary)" }}>
        कोई डेटा उपलब्ध नहीं है।
      </p>
    );
  }

  return (
    <div>
      <ul style={{ listStyle: "none", margin: 0, padding: 0, marginBottom: "var(--space-4)", display: "flex", flexWrap: "wrap", gap: "var(--space-2) var(--space-5)" }}>
        {TIERS.map((t) => (
          <li key={t.key} style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
            <span style={{ width: 10, height: 10, borderRadius: 3, background: t.color, flexShrink: 0 }} />
            <span className="t-caption" style={{ fontWeight: 500 }}>
              {t.label}
            </span>
          </li>
        ))}
      </ul>

      <ul aria-label={ariaLabel} style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: "var(--space-3)" }} onPointerLeave={() => setActive(null)}>
        {rows.map((r, i) => (
          <li
            key={r.thana}
            tabIndex={0}
            onPointerEnter={() => setActive(i)}
            onFocus={() => setActive(i)}
            onBlur={() => setActive(null)}
            aria-label={`${r.thana}: ${TIERS.map((t) => `${t.label} ${r[t.key]}`).join(", ")}, कुल ${r.total}`}
            style={{ position: "relative", outline: "none", display: "flex", alignItems: "center", gap: "var(--space-3)", opacity: active === null || active === i ? 1 : 0.6, transition: "opacity 0.15s var(--ease)" }}
          >
            <span style={{ width: 96, flexShrink: 0, fontSize: "0.8125rem", fontWeight: 600, color: "var(--text-primary)" }}>{r.thana}</span>
            <div style={{ flex: 1, display: "flex", gap: 2, height: 12, background: "var(--track)", borderRadius: "var(--radius-sm)", overflow: "hidden" }}>
              {r.total > 0 &&
                TIERS.map((t) =>
                  r[t.key] > 0 ? <div key={t.key} style={{ flexGrow: r[t.key], flexBasis: 0, minWidth: 2, background: t.color }} /> : null,
                )}
            </div>
            <span className="t-caption tabular-nums" style={{ width: 28, textAlign: "right" }}>
              {r.total}
            </span>

            {active === i && (
              <div className="chart-tooltip" style={{ left: "50%", top: 0 }}>
                <div className="t-caption">
                  {r.thana} · कुल {r.total} कैडर
                </div>
                {TIERS.map((t) => (
                  <div key={t.key} style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", marginTop: 2 }}>
                    <span style={{ width: 12, height: 3, borderRadius: 2, background: t.color, flexShrink: 0 }} />
                    <strong className="tabular-nums" style={{ fontSize: "0.875rem", color: "var(--text-primary)" }}>
                      {r[t.key]}
                    </strong>
                    <span className="t-caption">{t.label}</span>
                  </div>
                ))}
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

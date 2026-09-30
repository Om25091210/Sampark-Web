"use client";

import { useState, type KeyboardEvent } from "react";
import { barPath, formatCount, niceScale } from "./chartUtils";

export interface ColumnSeries {
  key: string;
  label: string;
  /** A CSS colour token. */
  color: string;
}

export interface ColumnCategory {
  key: string;
  label: string;
  /** Value per series key; a missing key is 0. */
  values: Record<string, number>;
}

interface StackedColumnsProps {
  categories: ColumnCategory[];
  series: ColumnSeries[];
  ariaLabel: string;
  /** What one unit is, for the tooltip ("कैडर"). */
  unit: string;
}

const W = 800;
const H = 280;
const PAD = { l: 44, r: 8, t: 24, b: 30 };
const MAX_BAR = 24; // thin marks: capped, never filling the slot
const GAP = 2; // surface gap between stacked segments

// Vertical stacked columns over ordered/nominal categories (years, age bands). A legend is
// always present (>= 2 series); the tooltip lists every series at the hovered category, and
// only the tallest column carries a direct label -- the axis, tooltip and table hold the rest.
export default function StackedColumns({ categories, series, ariaLabel, unit }: StackedColumnsProps) {
  const [active, setActive] = useState<number | null>(null);

  const n = categories.length;
  const totals = categories.map((c) => series.reduce((s, x) => s + (c.values[x.key] ?? 0), 0));
  const peak = Math.max(0, ...totals);
  const scale = niceScale(peak);
  const plotW = W - PAD.l - PAD.r;
  const plotH = H - PAD.t - PAD.b;
  const band = n > 0 ? plotW / n : plotW;
  const barW = Math.min(MAX_BAR, Math.max(2, band - 8));
  const xCenter = (i: number) => PAD.l + band * (i + 0.5);
  const yOf = (v: number) => PAD.t + (1 - v / scale.max) * plotH;
  const peakIndex = peak > 0 ? totals.indexOf(peak) : -1;
  const labelEvery = Math.max(1, Math.ceil(n / 12));

  const activeIdx = active !== null && active < n ? active : null;
  const activeCat = activeIdx !== null ? categories[activeIdx] : undefined;

  function onKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    if (n === 0) return;
    let next: number;
    if (e.key === "ArrowRight") next = activeIdx === null ? 0 : Math.min(n - 1, activeIdx + 1);
    else if (e.key === "ArrowLeft") next = activeIdx === null ? n - 1 : Math.max(0, activeIdx - 1);
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = n - 1;
    else if (e.key === "Escape") return setActive(null);
    else return;
    e.preventDefault();
    setActive(next);
  }

  if (n === 0 || peak === 0) {
    return (
      <p className="t-body-sm" style={{ color: "var(--text-tertiary)" }}>
        कोई डेटा उपलब्ध नहीं है।
      </p>
    );
  }

  return (
    <div>
      <div
        className="chart-focusable"
        role="group"
        aria-label={ariaLabel}
        tabIndex={0}
        onKeyDown={onKeyDown}
        onBlur={() => setActive(null)}
        onPointerLeave={() => setActive(null)}
        style={{ position: "relative" }}
      >
        <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "auto", display: "block", overflow: "visible" }} aria-hidden="true">
          {scale.ticks.map((t) => (
            <g key={t}>
              <line x1={PAD.l} x2={W - PAD.r} y1={yOf(t)} y2={yOf(t)} style={{ stroke: t === 0 ? "var(--chart-axis)" : "var(--chart-grid)" }} strokeWidth={1} />
              <text x={PAD.l - 8} y={yOf(t) + 4} textAnchor="end" style={{ fill: "var(--text-tertiary)" }} fontSize={11}>
                {formatCount(t)}
              </text>
            </g>
          ))}

          {categories.map((c, i) => {
            const dim = activeIdx === null || activeIdx === i ? 1 : 0.5;
            const present = series.filter((s) => (c.values[s.key] ?? 0) > 0);
            let cum = 0;
            return (
              <g key={c.key} style={{ opacity: dim, transition: "opacity 0.15s var(--ease)" }}>
                {present.map((s, si) => {
                  const v = c.values[s.key] ?? 0;
                  const top = yOf(cum + v);
                  // A 2px surface gap above every segment that has one beneath it.
                  const bottom = yOf(cum) - (si > 0 ? GAP : 0);
                  cum += v;
                  if (bottom - top < 1) return null;
                  return <path key={s.key} d={barPath(xCenter(i) - barW / 2, top, barW, bottom, si === present.length - 1)} style={{ fill: s.color }} />;
                })}
              </g>
            );
          })}

          {peakIndex >= 0 && (
            <text x={xCenter(peakIndex)} y={yOf(peak) - 6} textAnchor="middle" style={{ fill: "var(--text-secondary)" }} fontSize={11} fontWeight={600}>
              {formatCount(peak)}
            </text>
          )}

          {categories.map((c, i) =>
            i % labelEvery === 0 ? (
              <text key={c.key} x={xCenter(i)} y={H - 8} textAnchor="middle" style={{ fill: "var(--text-tertiary)" }} fontSize={11}>
                {c.label}
              </text>
            ) : null,
          )}

          {categories.map((c, i) => (
            <rect key={c.key} x={PAD.l + band * i} y={PAD.t} width={band} height={plotH} fill="transparent" onPointerEnter={() => setActive(i)} onPointerMove={() => setActive(i)} />
          ))}
        </svg>

        {activeCat !== undefined && activeIdx !== null && (
          <div
            className="chart-tooltip"
            style={{
              left: `${Math.min(86, Math.max(14, (xCenter(activeIdx) / W) * 100))}%`,
              top: `${Math.max(26, (yOf(totals[activeIdx] ?? 0) / H) * 100)}%`,
            }}
          >
            <div className="t-caption">{activeCat.label}</div>
            {series.map((s) => (
              <div key={s.key} style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", marginTop: 2 }}>
                <span style={{ width: 12, height: 3, borderRadius: 2, background: s.color, flexShrink: 0 }} />
                <strong className="tabular-nums" style={{ fontSize: "0.875rem", color: "var(--text-primary)" }}>
                  {formatCount(activeCat.values[s.key] ?? 0)}
                </strong>
                <span className="t-caption">{s.label}</span>
              </div>
            ))}
            <div className="t-caption tabular-nums" style={{ marginTop: 4, paddingTop: 4, borderTop: "1px solid var(--border)" }}>
              कुल {formatCount(totals[activeIdx] ?? 0)} {unit}
            </div>
          </div>
        )}

        <span className="sr-only" aria-live="polite">
          {activeCat !== undefined && activeIdx !== null ? `${activeCat.label}: कुल ${formatCount(totals[activeIdx] ?? 0)} ${unit}` : ""}
        </span>
      </div>

      <ul style={{ listStyle: "none", margin: 0, padding: 0, marginTop: "var(--space-4)", display: "flex", flexWrap: "wrap", gap: "var(--space-2) var(--space-5)" }}>
        {series.map((s) => (
          <li key={s.key} style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
            <span style={{ width: 10, height: 10, borderRadius: 3, background: s.color, flexShrink: 0 }} />
            <span className="t-caption" style={{ fontWeight: 500 }}>
              {s.label}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

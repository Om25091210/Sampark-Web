"use client";

import { useState, type KeyboardEvent } from "react";
import { barPath, formatCount, formatDayLong, formatDayShort, niceScale, weekdayOf } from "./chartUtils";

export interface DailyPoint {
  date: string;
  value: number;
}

interface DailyBarChartProps {
  /** Accessible name of the chart. */
  label: string;
  points: DailyPoint[];
  /** A CSS colour token, e.g. "var(--chart-cat-1)". One series -> one colour. */
  color: string;
  /** What one unit is, for the tooltip ("रिपोर्ट"). */
  unit: string;
  /** Held frame while a refetch is in flight: previous render at reduced opacity. */
  loading?: boolean;
  /** Centered overlay for empty / loading / error states. */
  message?: string | null;
}

// Geometry in SVG user units; the viewBox scales to the card, so marks stay proportional.
const W = 800;
const H = 260;
const PAD = { l: 44, r: 8, t: 22, b: 30 };
const MAX_BAR = 24; // bars are thin: capped, never filling their slot
const GAP = 2; // surface gap between adjacent bars
const MAX_X_LABELS = 10;

export default function DailyBarChart({ label, points, color, unit, loading = false, message = null }: DailyBarChartProps) {
  const [active, setActive] = useState<number | null>(null);

  const n = points.length;
  const peak = points.reduce((m, p) => Math.max(m, p.value), 0);
  const scale = niceScale(peak);
  const plotW = W - PAD.l - PAD.r;
  const plotH = H - PAD.t - PAD.b;
  const base = PAD.t + plotH;
  const band = n > 0 ? plotW / n : plotW;
  const barW = Math.min(MAX_BAR, Math.max(1, band - GAP));
  const xCenter = (i: number) => PAD.l + band * (i + 0.5);
  const yOf = (v: number) => PAD.t + (1 - v / scale.max) * plotH;
  const labelEvery = Math.max(1, Math.ceil(n / MAX_X_LABELS));
  const peakIndex = peak > 0 ? points.findIndex((p) => p.value === peak) : -1;

  // The range can shrink under a live hover/focus; never index past the end.
  const activeIdx = active !== null && active < n ? active : null;
  const activePoint = activeIdx !== null ? points[activeIdx] : undefined;

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

  return (
    <div
      className="chart-focusable"
      role="group"
      aria-label={label}
      tabIndex={0}
      onKeyDown={onKeyDown}
      onBlur={() => setActive(null)}
      onPointerLeave={() => setActive(null)}
      style={{ position: "relative", opacity: loading ? 0.55 : 1, transition: "opacity 0.2s var(--ease)" }}
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

        {points.map((p, i) =>
          p.value > 0 ? (
            <path
              key={p.date}
              d={barPath(xCenter(i) - barW / 2, yOf(p.value), barW, base)}
              style={{ fill: color, opacity: activeIdx === null || activeIdx === i ? 1 : 0.5, transition: "opacity 0.15s var(--ease)" }}
            />
          ) : null,
        )}

        {/* The extreme is the one direct label; every other value lives in the tooltip and table. */}
        {peakIndex >= 0 && (
          <text x={xCenter(peakIndex)} y={yOf(peak) - 6} textAnchor="middle" style={{ fill: "var(--text-secondary)" }} fontSize={11} fontWeight={600}>
            {formatCount(peak)}
          </text>
        )}

        {points.map((p, i) =>
          i % labelEvery === 0 ? (
            <text key={p.date} x={xCenter(i)} y={H - 8} textAnchor="middle" style={{ fill: "var(--text-tertiary)" }} fontSize={11}>
              {formatDayShort(p.date)}
            </text>
          ) : null,
        )}

        {/* Hit targets: the whole band, far larger than the (thin) bar it belongs to. */}
        {points.map((p, i) => (
          <rect
            key={p.date}
            x={PAD.l + band * i}
            y={PAD.t}
            width={band}
            height={plotH}
            fill="transparent"
            onPointerEnter={() => setActive(i)}
            onPointerMove={() => setActive(i)}
          />
        ))}
      </svg>

      {activePoint !== undefined && activeIdx !== null && (
        <div
          className="chart-tooltip"
          style={{
            left: `${Math.min(86, Math.max(14, (xCenter(activeIdx) / W) * 100))}%`,
            top: `${Math.max(26, (yOf(activePoint.value) / H) * 100)}%`,
          }}
        >
          <div className="t-caption">
            {formatDayLong(activePoint.date)} · {weekdayOf(activePoint.date)}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", marginTop: 2 }}>
            <span style={{ width: 12, height: 3, borderRadius: 2, background: color, flexShrink: 0 }} />
            <strong className="tabular-nums" style={{ fontSize: "0.9375rem", color: "var(--text-primary)" }}>
              {formatCount(activePoint.value)}
            </strong>
            <span className="t-caption">{unit}</span>
          </div>
        </div>
      )}

      {message && (
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", pointerEvents: "none" }}>
          <span className="t-body-sm" style={{ color: "var(--text-tertiary)", background: "var(--surface)", padding: "var(--space-2) var(--space-4)", borderRadius: "var(--radius-md)" }}>
            {message}
          </span>
        </div>
      )}

      <span className="sr-only" aria-live="polite">
        {activePoint !== undefined ? `${formatDayLong(activePoint.date)}: ${formatCount(activePoint.value)} ${unit}` : ""}
      </span>
    </div>
  );
}

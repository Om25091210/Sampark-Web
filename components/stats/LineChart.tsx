"use client";

import { useState, type KeyboardEvent } from "react";
import { formatCount, niceScale } from "./chartUtils";

export interface LinePoint {
  label: string;
  value: number;
}

interface LineChartProps {
  points: LinePoint[];
  ariaLabel: string;
  /** A CSS colour token. One series -> one colour, no legend box. */
  color: string;
  /** What one unit is, for the tooltip ("कैडर"). */
  unit: string;
}

const W = 800;
const H = 260;
const PAD = { l: 44, r: 28, t: 24, b: 30 };

// A single-series line (2px, round joins) with a faint area wash, a crosshair that snaps to
// the nearest x, and the end value as its one direct label.
export default function LineChart({ points, ariaLabel, color, unit }: LineChartProps) {
  const [active, setActive] = useState<number | null>(null);

  const n = points.length;
  const peak = Math.max(0, ...points.map((p) => p.value));
  const scale = niceScale(peak);
  const plotW = W - PAD.l - PAD.r;
  const plotH = H - PAD.t - PAD.b;
  const base = PAD.t + plotH;
  const x = (i: number) => (n === 1 ? PAD.l + plotW / 2 : PAD.l + (i * plotW) / (n - 1));
  const y = (v: number) => PAD.t + (1 - v / scale.max) * plotH;
  const labelEvery = Math.max(1, Math.ceil(n / 12));
  const line = points.map((p, i) => `${i === 0 ? "M" : "L"}${x(i)},${y(p.value)}`).join(" ");
  const area = n > 1 ? `${line} L${x(n - 1)},${base} L${x(0)},${base} Z` : "";

  const activeIdx = active !== null && active < n ? active : null;
  const activePoint = activeIdx !== null ? points[activeIdx] : undefined;
  const last = points[n - 1];

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

  const slot = n > 1 ? plotW / (n - 1) : plotW;

  return (
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
            <line x1={PAD.l} x2={W - PAD.r} y1={y(t)} y2={y(t)} style={{ stroke: t === 0 ? "var(--chart-axis)" : "var(--chart-grid)" }} strokeWidth={1} />
            <text x={PAD.l - 8} y={y(t) + 4} textAnchor="end" style={{ fill: "var(--text-tertiary)" }} fontSize={11}>
              {formatCount(t)}
            </text>
          </g>
        ))}

        {area && <path d={area} style={{ fill: color }} opacity={0.1} />}
        <path d={line} fill="none" style={{ stroke: color }} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />

        {activeIdx !== null && <line x1={x(activeIdx)} x2={x(activeIdx)} y1={PAD.t} y2={base} style={{ stroke: "var(--chart-axis)" }} strokeWidth={1} />}

        {/* End marker: r >= 4 with a 2px surface ring so it stays legible over the line. */}
        {last && (
          <>
            <circle cx={x(n - 1)} cy={y(last.value)} r={4} style={{ fill: color, stroke: "var(--surface)" }} strokeWidth={2} />
            <text x={x(n - 1)} y={y(last.value) - 10} textAnchor="end" style={{ fill: "var(--text-secondary)" }} fontSize={11} fontWeight={600}>
              {formatCount(last.value)}
            </text>
          </>
        )}
        {activeIdx !== null && activePoint !== undefined && activeIdx !== n - 1 && (
          <circle cx={x(activeIdx)} cy={y(activePoint.value)} r={4} style={{ fill: color, stroke: "var(--surface)" }} strokeWidth={2} />
        )}

        {points.map((p, i) =>
          i % labelEvery === 0 ? (
            <text key={`${p.label}-${i}`} x={x(i)} y={H - 8} textAnchor="middle" style={{ fill: "var(--text-tertiary)" }} fontSize={11}>
              {p.label}
            </text>
          ) : null,
        )}

        {/* The crosshair finds the x: each column of the plot is a hit target for its nearest point. */}
        {points.map((p, i) => (
          <rect key={`${p.label}-hit-${i}`} x={x(i) - slot / 2} y={PAD.t} width={slot} height={plotH} fill="transparent" onPointerEnter={() => setActive(i)} onPointerMove={() => setActive(i)} />
        ))}
      </svg>

      {activePoint !== undefined && activeIdx !== null && (
        <div className="chart-tooltip" style={{ left: `${Math.min(86, Math.max(14, (x(activeIdx) / W) * 100))}%`, top: `${Math.max(26, (y(activePoint.value) / H) * 100)}%` }}>
          <div className="t-caption">{activePoint.label}</div>
          <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", marginTop: 2 }}>
            <span style={{ width: 12, height: 3, borderRadius: 2, background: color, flexShrink: 0 }} />
            <strong className="tabular-nums" style={{ fontSize: "0.9375rem", color: "var(--text-primary)" }}>
              {formatCount(activePoint.value)}
            </strong>
            <span className="t-caption">{unit}</span>
          </div>
        </div>
      )}

      <span className="sr-only" aria-live="polite">
        {activePoint !== undefined ? `${activePoint.label}: ${formatCount(activePoint.value)} ${unit}` : ""}
      </span>
    </div>
  );
}

"use client";

import { useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import { formatCount, niceScale } from "./chartUtils";

export interface ScatterPoint {
  key: string;
  label: string;
  /** Secondary text in the tooltip (e.g. the thana). */
  sub?: string;
  x: number;
  /** 0-100. */
  y: number;
}

interface ScatterChartProps {
  points: ScatterPoint[];
  ariaLabel: string;
  xTitle: string;
  yTitle: string;
  /** A horizontal hairline (e.g. the overall rate) that gives each dot something to be above or below. */
  reference?: { value: number; label: string };
}

const W = 800;
const H = 320;
const PAD = { l: 52, r: 16, t: 16, b: 44 };
const R = 5; // r >= 4: an 8px+ dot
const HIT = 44; // nearest-point radius in viewBox units (~24px+ on screen)
const Y_TICKS = [0, 25, 50, 75, 100];

// One dot per entity. Hover is nearest-point, not dead-centre: the pointer only has to be
// CLOSEST to a dot, so an 8px mark is never a pinpoint to hit. Keyboard walks the dots in
// x order; the table twin in the caller carries every value regardless.
export default function ScatterChart({ points, ariaLabel, xTitle, yTitle, reference }: ScatterChartProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [active, setActive] = useState<number | null>(null);

  const ordered = [...points].sort((a, b) => a.x - b.x || a.y - b.y);
  const n = ordered.length;
  const xs = niceScale(Math.max(0, ...ordered.map((p) => p.x)));
  const plotW = W - PAD.l - PAD.r;
  const plotH = H - PAD.t - PAD.b;
  const px = (v: number) => PAD.l + (v / xs.max) * plotW;
  const py = (v: number) => PAD.t + (1 - v / 100) * plotH;

  const activeIdx = active !== null && active < n ? active : null;
  const activePoint = activeIdx !== null ? ordered[activeIdx] : undefined;

  function onMove(e: PointerEvent<SVGSVGElement>) {
    const svg = svgRef.current;
    if (!svg || n === 0) return;
    const box = svg.getBoundingClientRect();
    const scale = W / box.width;
    const mx = (e.clientX - box.left) * scale;
    const my = (e.clientY - box.top) * scale;
    let best = -1;
    let bestD = HIT * HIT;
    ordered.forEach((p, i) => {
      const d = (px(p.x) - mx) ** 2 + (py(p.y) - my) ** 2;
      if (d <= bestD) {
        best = i;
        bestD = d;
      }
    });
    setActive(best === -1 ? null : best);
  }

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

  if (n === 0) {
    return (
      <p className="t-body-sm" style={{ color: "var(--text-tertiary)" }}>
        कोई डेटा उपलब्ध नहीं है।
      </p>
    );
  }

  return (
    <div className="chart-focusable" role="group" aria-label={ariaLabel} tabIndex={0} onKeyDown={onKeyDown} onBlur={() => setActive(null)} onPointerLeave={() => setActive(null)} style={{ position: "relative" }}>
      <svg ref={svgRef} viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "auto", display: "block", overflow: "visible" }} onPointerMove={onMove} aria-hidden="true">
        {Y_TICKS.map((t) => (
          <g key={t}>
            <line x1={PAD.l} x2={W - PAD.r} y1={py(t)} y2={py(t)} style={{ stroke: t === 0 ? "var(--chart-axis)" : "var(--chart-grid)" }} strokeWidth={1} />
            <text x={PAD.l - 8} y={py(t) + 4} textAnchor="end" style={{ fill: "var(--text-tertiary)" }} fontSize={11}>
              {t}%
            </text>
          </g>
        ))}
        {xs.ticks.map((t) => (
          <text key={t} x={px(t)} y={H - 24} textAnchor="middle" style={{ fill: "var(--text-tertiary)" }} fontSize={11}>
            {formatCount(t)}
          </text>
        ))}
        <text x={PAD.l + plotW / 2} y={H - 6} textAnchor="middle" style={{ fill: "var(--text-secondary)" }} fontSize={11}>
          {xTitle}
        </text>
        <text x={12} y={PAD.t + plotH / 2} textAnchor="middle" transform={`rotate(-90 12 ${PAD.t + plotH / 2})`} style={{ fill: "var(--text-secondary)" }} fontSize={11}>
          {yTitle}
        </text>

        {reference && (
          <g>
            <line x1={PAD.l} x2={W - PAD.r} y1={py(reference.value)} y2={py(reference.value)} style={{ stroke: "var(--text-disabled)" }} strokeWidth={1} />
            {/* Left edge: dots pile up on the right when every officer carries a similar load. */}
            <text x={PAD.l + 6} y={py(reference.value) - 5} textAnchor="start" style={{ fill: "var(--text-tertiary)" }} fontSize={11}>
              {reference.label}
            </text>
          </g>
        )}

        {ordered.map((p, i) => (
          <circle
            key={p.key}
            cx={px(p.x)}
            cy={py(p.y)}
            r={activeIdx === i ? R + 2 : R}
            style={{ fill: "var(--chart-cat-1)", stroke: "var(--surface)", opacity: activeIdx === null || activeIdx === i ? 1 : 0.55 }}
            strokeWidth={2}
          />
        ))}
      </svg>

      {activePoint !== undefined && (
        <div className="chart-tooltip" style={{ left: `${Math.min(86, Math.max(14, (px(activePoint.x) / W) * 100))}%`, top: `${Math.max(26, (py(activePoint.y) / H) * 100)}%` }}>
          <div className="t-caption">
            {activePoint.label}
            {activePoint.sub ? ` · ${activePoint.sub}` : ""}
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: "var(--space-2)", marginTop: 2 }}>
            <strong className="tabular-nums" style={{ fontSize: "0.9375rem", color: "var(--text-primary)" }}>
              {activePoint.y}%
            </strong>
            <span className="t-caption tabular-nums">· {formatCount(activePoint.x)} कैडर</span>
          </div>
        </div>
      )}

      <span className="sr-only" aria-live="polite">
        {activePoint !== undefined ? `${activePoint.label}: ${activePoint.y}% पूर्णता, ${activePoint.x} कैडर` : ""}
      </span>
    </div>
  );
}

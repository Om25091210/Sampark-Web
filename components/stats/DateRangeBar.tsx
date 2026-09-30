"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { daysInclusive, shiftDay, todayIst } from "./chartUtils";

// Matches the backend's cap on /stats/reports/daily.
export const MAX_RANGE_DAYS = 366;

interface DateRangeBarProps {
  from: string;
  to: string;
  onChange: (from: string, to: string) => void;
}

// Renders bare controls -- the caller owns the `.filter-row` they sit in, so the date
// range and the dimension filters read as one row above the charts they scope.
export default function DateRangeBar({ from, to, onChange }: DateRangeBarProps) {
  const today = todayIst();
  const length = daysInclusive(from, to);

  const presets = [
    { key: "today", label: "आज", from: today },
    { key: "7", label: "7 दिन", from: shiftDay(today, -6) },
    { key: "30", label: "30 दिन", from: shiftDay(today, -29) },
    { key: "90", label: "90 दिन", from: shiftDay(today, -89) },
    { key: "mtd", label: "इस माह", from: `${today.slice(0, 8)}01` },
  ];
  const activeKey = presets.find((p) => p.from === from && to === today)?.key;

  // Slide the whole window by its own length; the next window is capped at today and
  // keeps its length, so stepping forward from a short tail never shrinks the range.
  function shift(direction: -1 | 1) {
    if (direction === -1) return onChange(shiftDay(from, -length), shiftDay(to, -length));
    const nextTo = shiftDay(to, length) > today ? today : shiftDay(to, length);
    onChange(shiftDay(nextTo, -(length - 1)), nextTo);
  }

  function changeFrom(value: string) {
    if (!value) return;
    const nextTo = value > to ? value : to;
    // Over the cap: keep what the reader just picked and pull `to` in.
    onChange(value, daysInclusive(value, nextTo) > MAX_RANGE_DAYS ? shiftDay(value, MAX_RANGE_DAYS - 1) : nextTo);
  }

  function changeTo(value: string) {
    if (!value) return;
    const nextTo = value > today ? today : value;
    const nextFrom = from > nextTo ? nextTo : from;
    onChange(daysInclusive(nextFrom, nextTo) > MAX_RANGE_DAYS ? shiftDay(nextTo, -(MAX_RANGE_DAYS - 1)) : nextFrom, nextTo);
  }

  return (
    <>
      <div className="seg-tabs" role="group" aria-label="अवधि चुनें" style={{ flex: "0 0 auto" }}>
        {presets.map((p) => (
          <button key={p.key} type="button" className="seg-tab" data-active={p.key === activeKey} onClick={() => onChange(p.from, today)}>
            {p.label}
          </button>
        ))}
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
        <button type="button" className="btn btn--ghost btn--sm" aria-label="पिछली अवधि" onClick={() => shift(-1)}>
          <ChevronLeft size={16} strokeWidth={1.75} />
        </button>
        <input
          type="date"
          className="input"
          aria-label="प्रारंभ तिथि"
          value={from}
          max={to}
          onChange={(e) => changeFrom(e.target.value)}
          style={{ height: 38, width: 150 }}
        />
        <span className="t-caption">से</span>
        <input
          type="date"
          className="input"
          aria-label="अंतिम तिथि"
          value={to}
          max={today}
          onChange={(e) => changeTo(e.target.value)}
          style={{ height: 38, width: 150 }}
        />
        <button type="button" className="btn btn--ghost btn--sm" aria-label="अगली अवधि" disabled={to >= today} onClick={() => shift(1)}>
          <ChevronRight size={16} strokeWidth={1.75} />
        </button>
      </div>

      <span className="t-caption tabular-nums">{length} दिन (अधिकतम {MAX_RANGE_DAYS})</span>
    </>
  );
}

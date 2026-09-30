"use client";

import { useState, type ReactNode } from "react";
import { BarChart3, List } from "lucide-react";

interface ChartCardProps {
  title: string;
  sub?: string;
  /** Headline figures shown beside the toggle (e.g. total, daily average). */
  aside?: ReactNode;
  chart: ReactNode;
  /** The table twin of `chart`. */
  table: ReactNode;
}

export default function ChartCard({ title, sub, aside, chart, table }: ChartCardProps) {
  const [view, setView] = useState<"chart" | "table">("chart");
  const showingTable = view === "table";

  return (
    <div className="dash-card">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "var(--space-4)", flexWrap: "wrap", marginBottom: "var(--space-5)" }}>
        <div>
          <h3 className="t-h4">{title}</h3>
          {sub && (
            <p className="t-caption" style={{ marginTop: 2 }}>
              {sub}
            </p>
          )}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-4)" }}>
          {aside}
          <button
            type="button"
            className="btn btn--ghost btn--sm"
            aria-pressed={showingTable}
            onClick={() => setView(showingTable ? "chart" : "table")}
          >
            {showingTable ? <BarChart3 size={16} strokeWidth={1.75} /> : <List size={16} strokeWidth={1.75} />}
            {showingTable ? "चार्ट देखें" : "तालिका देखें"}
          </button>
        </div>
      </div>
      {showingTable ? table : chart}
    </div>
  );
}

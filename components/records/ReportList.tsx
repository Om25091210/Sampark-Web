"use client";

import ReportCard from "./ReportCard";
import { ALERT_LEVELS, type AlertLevel, type Cadre } from "@/lib/cadres";

interface ReportListProps {
  cadres: Cadre[];
  total: number;
  alertLevel: AlertLevel | "all";
  onAlertLevel: (value: AlertLevel | "all") => void;
}

const TABS: { value: AlertLevel | "all"; label: string }[] = [
  { value: "all", label: "सभी" },
  ...ALERT_LEVELS,
];

export default function ReportList({ cadres, total, alertLevel, onAlertLevel }: ReportListProps) {
  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflowY: "auto", background: "var(--bg)" }}>
      {/* Sticky header */}
      <div
        style={{
          padding: "var(--space-4) var(--space-5) var(--space-3)",
          background: "var(--surface)",
          borderBottom: "1px solid var(--border)",
          position: "sticky",
          top: 0,
          zIndex: 2,
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--space-3)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
            <h2 className="t-h4">रिपोर्टिंग रिकॉर्ड</h2>
            <span className="badge badge--brand tabular-nums">{total}</span>
          </div>
          <span className="t-caption tabular-nums">{cadres.length} परिणाम</span>
        </div>

        {/* Alert-level tabs */}
        <div style={{ display: "flex", gap: "var(--space-2)", flexWrap: "wrap" }}>
          {TABS.map((tab) => {
            const active = alertLevel === tab.value;
            return (
              <button
                key={tab.value}
                onClick={() => onAlertLevel(tab.value)}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "var(--space-1)",
                  padding: "5px var(--space-3)",
                  borderRadius: "var(--radius-full)",
                  border: "1.5px solid",
                  borderColor: active ? "var(--brand)" : "var(--border)",
                  background: active ? "var(--brand-soft)" : "var(--surface)",
                  color: active ? "var(--brand-strong)" : "var(--text-secondary)",
                  fontSize: "0.8125rem",
                  fontWeight: active ? 600 : 400,
                  cursor: "pointer",
                  transition: "var(--transition)",
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Cards */}
      <div style={{ padding: "var(--space-4)", display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
        {cadres.length === 0 ? (
          <div style={{ textAlign: "center", padding: "var(--space-16) var(--space-5)", color: "var(--text-tertiary)", fontSize: "0.875rem" }}>
            कोई रिकॉर्ड नहीं मिला
          </div>
        ) : (
          cadres.map((c) => <ReportCard key={c.id} cadre={c} />)
        )}
      </div>
    </div>
  );
}

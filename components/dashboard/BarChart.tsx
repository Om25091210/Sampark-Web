import type { DashboardStats } from "@/lib/api";

const PLOT_H = 180; // px — chart plot area height
const GRID_LINES = 4; // subtle horizontal rules

// ADR-039/041/046. The four reporting-recency tiers, least → most overdue, sharing
// the exact label set the mobile app and /stats/dashboard use — never renamed or
// reordered here. Colour ramps through the design system's four status tokens
// (never a raw hex) so severity reads left-to-right without a legend.
type RecencyKey = "current" | "overdue1m" | "overdue2m" | "overdue3m";

const TIERS: { key: RecencyKey; label: string; color: string }[] = [
  { key: "current", label: "सामान्य", color: "var(--emerald)" },
  { key: "overdue1m", label: "सतर्क", color: "var(--amber)" },
  { key: "overdue2m", label: "जोखिम", color: "var(--violet)" },
  { key: "overdue3m", label: "उच्च जोखिम", color: "var(--rose)" },
];

interface BarChartProps {
  stats: DashboardStats | null;
  error?: boolean;
}

export default function BarChart({ stats, error }: BarChartProps) {
  const recency = stats?.reportingRecency;
  const values = TIERS.map((t) => (recency ? recency[t.key] : 0));
  const total = values.reduce((s, v) => s + v, 0);
  const maxVal = Math.max(1, ...values);

  return (
    <div className="dash-card">
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "var(--space-4)", marginBottom: "var(--space-6)" }}>
        <div>
          <h3 className="t-h4">रिपोर्टिंग की स्थिति</h3>
          <p className="t-caption" style={{ marginTop: "2px" }}>
            अंतिम रिपोर्ट के आधार पर सभी सक्रिय कैडरों का वितरण
          </p>
        </div>
        <span className="badge badge--brand tabular-nums">{stats ? stats.totalCadres : "—"} कुल</span>
      </div>

      {error && (
        <p className="t-body-sm" style={{ color: "var(--rose)" }}>
          आंकड़े लोड नहीं हो सके।
        </p>
      )}

      {!error && (
        <>
          {/* Plot area */}
          <div style={{ position: "relative", height: PLOT_H }}>
            {/* Horizontal gridlines only */}
            {Array.from({ length: GRID_LINES + 1 }).map((_, i) => (
              <div
                key={i}
                style={{
                  position: "absolute",
                  left: 0,
                  right: 0,
                  top: `${(i / GRID_LINES) * 100}%`,
                  borderTop: "1px solid var(--border)",
                  opacity: i === GRID_LINES ? 1 : 0.6,
                }}
              />
            ))}

            {/* Bars */}
            <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "flex-end", gap: "var(--space-5)", paddingInline: "var(--space-3)" }}>
              {TIERS.map((tier, i) => {
                const value = values[i]!;
                const heightPct = stats ? (value / maxVal) * 100 : 0;
                return (
                  <div key={tier.key} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-end", height: "100%" }}>
                    {stats && (
                      <span className="tabular-nums" style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "var(--space-2)" }}>
                        {value}
                      </span>
                    )}
                    <div
                      title={`${tier.label}: ${value}`}
                      style={{
                        width: "100%",
                        maxWidth: 72,
                        height: stats ? `${heightPct}%` : 4,
                        minHeight: 4,
                        background: stats ? tier.color : "var(--bar-muted)",
                        borderRadius: "var(--radius-sm) var(--radius-sm) 0 0",
                        transition: "height 0.4s var(--ease)",
                      }}
                    />
                  </div>
                );
              })}
            </div>
          </div>

          {/* Tier labels + share of total */}
          <div style={{ display: "flex", gap: "var(--space-5)", marginTop: "var(--space-3)", paddingInline: "var(--space-3)" }}>
            {TIERS.map((tier, i) => {
              const value = values[i]!;
              const pct = stats && total > 0 ? Math.round((value / total) * 100) : null;
              return (
                <div key={tier.key} style={{ flex: 1, textAlign: "center" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>
                    <span style={{ width: 8, height: 8, borderRadius: 2, background: tier.color, flexShrink: 0 }} />
                    <span className="t-caption" style={{ fontSize: "0.6875rem", fontWeight: 500 }}>{tier.label}</span>
                  </div>
                  {pct !== null && (
                    <div className="t-caption tabular-nums" style={{ fontSize: "0.6875rem", marginTop: "2px" }}>
                      {pct}%
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

import { BAR_CHART_DATA } from "@/lib/constants";

const PLOT_H = 180; // px — chart plot area height
const GRID_LINES = 4; // subtle horizontal rules

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
      <span style={{ width: 10, height: 10, borderRadius: 3, background: color }} />
      <span className="t-caption" style={{ fontWeight: 500 }}>{label}</span>
    </div>
  );
}

interface BarChartProps {
  title?: string;
  subtitle?: string;
}

export default function BarChart({
  title = "कार्य और रिपोर्टिंग आवृत्ति",
  subtitle = "पिछले 6 माह का अवलोकन",
}: BarChartProps) {
  const maxVal = Math.max(...BAR_CHART_DATA.map((d) => Math.max(d.tasks, d.reports)));

  return (
    <div className="dash-card">
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "var(--space-4)", marginBottom: "var(--space-6)" }}>
        <div>
          <h3 className="t-h4">{title}</h3>
          <p className="t-caption" style={{ marginTop: "2px" }}>{subtitle}</p>
        </div>
        <div style={{ display: "flex", gap: "var(--space-4)", alignItems: "center" }}>
          <LegendDot color="var(--brand)" label="कार्य" />
          <LegendDot color="var(--bar-muted)" label="रिपोर्ट" />
        </div>
      </div>

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
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "flex-end", gap: "var(--space-3)" }}>
          {BAR_CHART_DATA.map((d, i) => (
            <div key={i} style={{ flex: 1, display: "flex", alignItems: "flex-end", justifyContent: "center", gap: "var(--space-1)", height: "100%" }}>
              <div
                title={`कार्य: ${d.tasks}`}
                style={{
                  flex: 1,
                  maxWidth: 22,
                  height: `${(d.tasks / maxVal) * 100}%`,
                  minHeight: 4,
                  background: "var(--brand)",
                  borderRadius: "var(--radius-sm) var(--radius-sm) 0 0",
                  transition: "height 0.4s var(--ease)",
                }}
              />
              <div
                title={`रिपोर्ट: ${d.reports}`}
                style={{
                  flex: 1,
                  maxWidth: 22,
                  height: `${(d.reports / maxVal) * 100}%`,
                  minHeight: 4,
                  background: "var(--bar-muted)",
                  borderRadius: "var(--radius-sm) var(--radius-sm) 0 0",
                  transition: "height 0.4s var(--ease)",
                }}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Month labels */}
      <div style={{ display: "flex", gap: "var(--space-3)", marginTop: "var(--space-3)" }}>
        {BAR_CHART_DATA.map((d, i) => (
          <div key={i} className="t-caption tabular-nums" style={{ flex: 1, textAlign: "center", fontSize: "0.6875rem" }}>
            {d.month}
          </div>
        ))}
      </div>
    </div>
  );
}

import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { RECENT_REPORTS, STATUS_COLORS } from "@/lib/constants";

type BadgeTone = "brand" | "success" | "pending" | "danger" | "neutral";

const STATUS_TONE: Record<string, BadgeTone> = {
  completed: "success",
  pending: "pending",
  waiting: "danger",
  active: "brand",
};

const cellStyle = { padding: "var(--space-3) var(--space-2)" } as const;

export default function RecentReportsTable() {
  return (
    <div className="dash-card">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--space-5)" }}>
        <div>
          <h3 className="t-h4">हाल की रिपोर्ट</h3>
          <p className="t-caption" style={{ marginTop: "2px" }}>अद्यतन गतिविधि</p>
        </div>
        <Button variant="secondary" size="sm">सभी देखें</Button>
      </div>

      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--border)" }}>
              {["व्यक्ति", "थाना", "स्थिति", "समय"].map((h) => (
                <th
                  key={h}
                  className="t-overline"
                  style={{ textAlign: "left", padding: "0 var(--space-2) var(--space-3)" }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {RECENT_REPORTS.map((r) => {
              const sc = STATUS_COLORS[r.status];
              return (
                <tr key={r.id} style={{ borderBottom: "1px solid var(--border)" }}>
                  {/* Person */}
                  <td style={cellStyle}>
                    <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
                      <div
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: "var(--radius-full)",
                          background: "linear-gradient(135deg, var(--brand), var(--navy))",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "#fff",
                          fontSize: "0.6875rem",
                          fontWeight: 700,
                          flexShrink: 0,
                        }}
                      >
                        {r.avatar}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--text-primary)" }}>
                          {r.person}
                        </div>
                        <div
                          style={{
                            fontSize: "0.6875rem",
                            color: "var(--text-tertiary)",
                            maxWidth: 200,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {r.preview}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Thana */}
                  <td style={cellStyle}>
                    <span style={{ fontSize: "0.8125rem", color: "var(--text-secondary)" }}>{r.thana}</span>
                  </td>

                  {/* Status */}
                  <td style={cellStyle}>
                    <Badge tone={STATUS_TONE[r.status] ?? "neutral"}>{sc.label}</Badge>
                  </td>

                  {/* Time */}
                  <td style={cellStyle}>
                    <span className="tabular-nums" style={{ fontSize: "0.75rem", color: "var(--text-tertiary)", whiteSpace: "nowrap" }}>
                      {r.time}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

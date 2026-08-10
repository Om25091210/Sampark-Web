"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { listReports, type WireReport } from "@/lib/api";
import { getInitials, formatDate } from "@/lib/cadres";

const PLACE_LABEL: Record<WireReport["reportingPlace"], string> = {
  thana: "थाना",
  village: "गांव",
};

const STATUS_TONE: Record<WireReport["personStatus"], "success" | "danger"> = {
  alive: "success",
  dead: "danger",
};

const STATUS_LABEL: Record<WireReport["personStatus"], string> = {
  alive: "जीवित",
  dead: "मृत",
};

const cellStyle = { padding: "var(--space-3) var(--space-2)" } as const;
const PAGE_SIZE = 6;

export default function RecentReportsTable() {
  const router = useRouter();
  const [reports, setReports] = useState<WireReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    listReports({ page: 1, pageSize: PAGE_SIZE })
      .then((res) => setReports(res.data))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="dash-card">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--space-5)" }}>
        <div>
          <h3 className="t-h4">हाल की रिपोर्ट</h3>
          <p className="t-caption" style={{ marginTop: "2px" }}>अद्यतन गतिविधि</p>
        </div>
        <Button variant="secondary" size="sm" onClick={() => router.push("/records")}>
          सभी देखें
        </Button>
      </div>

      {error && (
        <p className="t-body-sm" style={{ color: "var(--rose)" }}>
          रिपोर्ट लोड नहीं हो सकीं।
        </p>
      )}
      {!error && loading && <p className="t-caption">लोड हो रहा है...</p>}
      {!error && !loading && reports.length === 0 && (
        <p className="t-body-sm" style={{ color: "var(--text-tertiary)" }}>
          अभी तक कोई रिपोर्ट दर्ज नहीं हुई।
        </p>
      )}

      {!error && !loading && reports.length > 0 && (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border)" }}>
                {["व्यक्ति", "रिपोर्टिंग स्थान", "स्थिति", "समय"].map((h) => (
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
              {reports.map((r) => (
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
                        {r.cadre ? getInitials(r.cadre.name) : "?"}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--text-primary)" }}>
                          {r.cadre?.name ?? `कैडर #${r.cadreId}`}
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
                          {r.currentActivity}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Reporting place */}
                  <td style={cellStyle}>
                    <span style={{ fontSize: "0.8125rem", color: "var(--text-secondary)" }}>
                      {PLACE_LABEL[r.reportingPlace]}
                    </span>
                  </td>

                  {/* Person status */}
                  <td style={cellStyle}>
                    <Badge tone={STATUS_TONE[r.personStatus]}>{STATUS_LABEL[r.personStatus]}</Badge>
                  </td>

                  {/* Time */}
                  <td style={cellStyle}>
                    <span className="tabular-nums" style={{ fontSize: "0.75rem", color: "var(--text-tertiary)", whiteSpace: "nowrap" }}>
                      {formatDate(r.reportedAt)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

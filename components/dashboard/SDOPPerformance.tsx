"use client";

import { useEffect, useState } from "react";
import { FileText } from "lucide-react";
import { getHierarchyStats, type HierarchyStats } from "@/lib/api";

// ADR-055: HQ (super_admin) gets one row per SDOP (level "admins"); an SDOP
// (admin) caller gets one row per their own officer instead (level "officers")
// -- same endpoint, caller-scoped. The heading follows whichever came back
// rather than always claiming "SDOP प्रदर्शन", which would be wrong for an
// SDOP viewing their own team.
export default function SDOPPerformance() {
  const [stats, setStats] = useState<HierarchyStats | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    getHierarchyStats()
      .then(setStats)
      .catch(() => setError(true));
  }, []);

  const heading = stats?.level === "officers" ? "अधिकारी प्रदर्शन" : "SDOP प्रदर्शन";
  const rows = stats?.rows ?? [];

  return (
    <>
      <div className="dash-card">
        <h3 className="t-h4">{heading}</h3>
        <p className="t-caption" style={{ marginTop: "2px", marginBottom: "var(--space-5)" }}>
          क्षेत्र-वार रिपोर्टिंग दर
        </p>

        {error && (
          <p className="t-body-sm" style={{ color: "var(--rose)" }}>
            आंकड़े लोड नहीं हो सके।
          </p>
        )}
        {!error && stats === null && <p className="t-caption">लोड हो रहा है...</p>}
        {!error && stats !== null && rows.length === 0 && (
          <p className="t-body-sm" style={{ color: "var(--text-tertiary)" }}>
            कोई डेटा उपलब्ध नहीं है।
          </p>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-5)" }}>
          {rows.map((row) => (
            <div key={row.id}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "var(--space-2)" }}>
                <span style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--text-primary)" }}>
                  {row.name}
                </span>
                <span className="tabular-nums" style={{ fontSize: "0.8125rem", fontWeight: 700, color: "var(--brand-strong)" }}>
                  {row.reportingCompletion}%
                </span>
              </div>
              {/* Track */}
              <div style={{ height: 6, background: "var(--track)", borderRadius: "var(--radius-full)", overflow: "hidden" }}>
                {/* Fill with rounded caps */}
                <div
                  style={{
                    height: "100%",
                    width: `${row.reportingCompletion}%`,
                    background: "var(--brand)",
                    borderRadius: "var(--radius-full)",
                    transition: "width 0.5s var(--ease)",
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Monthly Report strip (deep neutral accent card). Still mock -- no
          org-wide "reports this month" stat exists (DashboardStats only has
          reportsThisWeek), so there's nothing real to wire this to yet. */}
      <div
        style={{
          background: "var(--navy)",
          borderRadius: "var(--radius-xl)",
          padding: "var(--space-5)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
          <span
            style={{
              width: 40,
              height: 40,
              background: "rgba(14,165,196,0.18)",
              borderRadius: "var(--radius-lg)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--brand)",
              flexShrink: 0,
            }}
          >
            <FileText size={18} strokeWidth={1.75} />
          </span>
          <div>
            <div style={{ color: "var(--on-dark)", fontSize: "0.8125rem", fontWeight: 600 }}>
              माह की रिपोर्ट
            </div>
            <div style={{ color: "var(--on-dark-faint)", fontSize: "0.6875rem" }}>
              इस माह सबमिट की गईं
            </div>
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div className="tabular-nums" style={{ color: "var(--brand)", fontSize: "1.5rem", fontWeight: 800, letterSpacing: "-0.02em" }}>
            156
          </div>
          <div style={{ color: "var(--on-dark-faint)", fontSize: "0.625rem" }}>
            +12% से पिछले माह
          </div>
        </div>
      </div>
    </>
  );
}

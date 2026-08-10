"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Topbar from "@/components/layout/Topbar";
import Container from "@/components/ui/Container";
import Badge from "@/components/ui/Badge";
import ReportDetailModal from "@/components/dashboard/ReportDetailModal";
import { listReports, type WireReport } from "@/lib/api";
import { getInitials, formatDate } from "@/lib/cadres";

const PAGE_SIZE = 20;

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

// Dashboard "इस सप्ताह रिपोर्ट" tile drill-down. Defaults to the last 7 days (the
// same window /stats/dashboard's reportsThisWeek count uses); an optional `since`
// ISO cutoff in the URL can override it. No filter UI here on purpose — this page
// shows exactly what the tile counted, not a general-purpose report browser.
export default function ReportsPage() {
  return (
    <Suspense fallback={null}>
      <ReportsPageInner />
    </Suspense>
  );
}

function ReportsPageInner() {
  const searchParams = useSearchParams();
  // No `since` param (the dashboard card's default link) means "this week", the
  // same window /stats/dashboard's reportsThisWeek count uses. Computed inside the
  // effect, not at render time, so the page stays a pure function of its props.
  const sinceParam = searchParams.get("since");

  const [reports, setReports] = useState<WireReport[]>([]);
  const [selectedReport, setSelectedReport] = useState<WireReport | null>(null);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const since = sinceParam ?? new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    listReports({ reportedAfter: since, page: 1, pageSize: PAGE_SIZE })
      .then((res) => {
        setReports(res.data);
        setTotal(res.total);
        setHasMore(res.hasMore);
        setPage(1);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [sinceParam]);

  function loadMore() {
    const since = sinceParam ?? new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const nextPage = page + 1;
    setLoading(true);
    listReports({ reportedAfter: since, page: nextPage, pageSize: PAGE_SIZE })
      .then((res) => {
        setReports((prev) => [...prev, ...res.data]);
        setHasMore(res.hasMore);
        setPage(nextPage);
      })
      .finally(() => setLoading(false));
  }

  return (
    <>
      <Topbar
        title="इस सप्ताह की रिपोर्ट"
        subtitle="पिछले 7 दिनों में दर्ज की गई रिपोर्ट"
      />
      <div style={{ paddingBlock: "var(--space-8)" }}>
        <Container>
          <div className="dash-card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--space-5)" }}>
              <h3 className="t-h4">रिपोर्ट सूची</h3>
              <span className="badge badge--brand tabular-nums">{total}</span>
            </div>

            {error && (
              <p className="t-body-sm" style={{ color: "var(--rose)" }}>
                रिपोर्ट लोड नहीं हो सकीं।
              </p>
            )}
            {!error && loading && reports.length === 0 && <p className="t-caption">लोड हो रहा है...</p>}
            {!error && !loading && reports.length === 0 && (
              <p className="t-body-sm" style={{ color: "var(--text-tertiary)" }}>
                इस दायरे में कोई रिपोर्ट दर्ज नहीं हुई।
              </p>
            )}

            {reports.length > 0 && (
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
                      <tr
                        key={r.id}
                        onClick={() => setSelectedReport(r)}
                        style={{ borderBottom: "1px solid var(--border)", cursor: "pointer", transition: "var(--transition)" }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = "var(--surface-hover)")}
                        onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                      >
                        <td style={{ padding: "var(--space-3) var(--space-2)" }}>
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
                                  maxWidth: 240,
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
                        <td style={{ padding: "var(--space-3) var(--space-2)" }}>
                          <span style={{ fontSize: "0.8125rem", color: "var(--text-secondary)" }}>
                            {PLACE_LABEL[r.reportingPlace]}
                          </span>
                        </td>
                        <td style={{ padding: "var(--space-3) var(--space-2)" }}>
                          <Badge tone={STATUS_TONE[r.personStatus]}>{STATUS_LABEL[r.personStatus]}</Badge>
                        </td>
                        <td style={{ padding: "var(--space-3) var(--space-2)" }}>
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

            {hasMore && (
              <div style={{ padding: "var(--space-4)", textAlign: "center" }}>
                <button className="btn btn--sm" onClick={loadMore} disabled={loading}>
                  {loading ? "लोड हो रहा है..." : "और लोड करें"}
                </button>
              </div>
            )}
          </div>
        </Container>
      </div>

      {selectedReport && (
        <ReportDetailModal report={selectedReport} onClose={() => setSelectedReport(null)} />
      )}
    </>
  );
}

"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import Topbar from "@/components/layout/Topbar";
import Container from "@/components/ui/Container";
import Badge from "@/components/ui/Badge";
import ReportDetailModal from "@/components/dashboard/ReportDetailModal";
import {
  getCadre,
  listReportsByCadre,
  type WireCadre,
  type WireReport,
} from "@/lib/api";
import { getInitials, initialTag, tagLevel, ALERT_META, CATEGORY_CHIP } from "@/lib/cadres";

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

/** `9 जुलाई 2026, 14:30` — matches the report detail modal's stamp format. */
function formatStamp(iso: string): string {
  const d = new Date(iso);
  const date = d.toLocaleDateString("hi-IN", { day: "numeric", month: "long", year: "numeric" });
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${date}, ${hh}:${mm}`;
}

function todayISODate(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

// The web equivalent of the mobile app's cadre reporting-record screen
// (app/(main)/cadre/[id]/reports.tsx) -- same identity header, same date-only
// filter (ADR-024), same report list feeding the same report-detail view, so
// a card tapped in the records list opens the same record on both platforms.
export default function CadreReportingRecordPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const cadreId = Number(id);

  const [cadre, setCadre] = useState<WireCadre | null>(null);
  const [cadreError, setCadreError] = useState(false);

  const [date, setDate] = useState<string>("");
  const [reports, setReports] = useState<WireReport[]>([]);
  const [selectedReport, setSelectedReport] = useState<WireReport | null>(null);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  function handleDateChange(next: string) {
    setDate(next);
    setLoading(true);
  }

  useEffect(() => {
    getCadre(cadreId)
      .then(setCadre)
      .catch(() => setCadreError(true));
  }, [cadreId]);

  useEffect(() => {
    listReportsByCadre(cadreId, { date: date || undefined, page: 1, pageSize: PAGE_SIZE })
      .then((res) => {
        setReports(res.data);
        setTotal(res.total);
        setHasMore(res.hasMore);
        setPage(1);
        setError(false);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [cadreId, date]);

  function loadMore() {
    const nextPage = page + 1;
    setLoading(true);
    listReportsByCadre(cadreId, { date: date || undefined, page: nextPage, pageSize: PAGE_SIZE })
      .then((res) => {
        setReports((prev) => [...prev, ...res.data]);
        setHasMore(res.hasMore);
        setPage(nextPage);
      })
      .finally(() => setLoading(false));
  }

  const tag = cadre ? initialTag(cadre) : null;
  const accent = ALERT_META[tagLevel(tag)];

  return (
    <>
      <Topbar
        title="रिपोर्टिंग रिकॉर्ड"
        subtitle={cadre?.name}
        backHref="/records"
      />
      <div style={{ paddingBlock: "var(--space-8)" }}>
        <Container>
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-5)" }}>
            {/* Identity card */}
            {cadreError ? (
              <div className="dash-card">
                <p className="t-body-sm" style={{ color: "var(--rose)" }}>यह कैडर नहीं मिला।</p>
              </div>
            ) : cadre ? (
              <div className="dash-card" style={{ display: "flex", alignItems: "center", gap: "var(--space-4)" }}>
                <div
                  style={{
                    width: 52,
                    height: 52,
                    borderRadius: "var(--radius-full)",
                    background: "linear-gradient(135deg, var(--brand), var(--navy))",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#fff",
                    fontSize: "0.9375rem",
                    fontWeight: 700,
                    flexShrink: 0,
                  }}
                >
                  {getInitials(cadre.name)}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="t-h4">{cadre.name}</div>
                  <div className="t-caption" style={{ marginTop: "2px" }}>
                    {cadre.thana} · {cadre.designation}
                  </div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "var(--space-2)", flexShrink: 0 }}>
                  <Link href={`/records/${cadreId}/profile`} className="btn btn--secondary btn--sm" style={{ textDecoration: "none" }}>
                    प्रोफाइल देखें
                  </Link>
                  <div style={{ display: "flex", gap: "var(--space-2)" }}>
                    <span className="badge badge--brand">{CATEGORY_CHIP[cadre.category]}</span>
                    {tag && (
                      <span className="badge" style={{ background: accent.soft, color: accent.color }}>
                        <span style={{ width: 5, height: 5, borderRadius: "50%", background: accent.color }} />
                        {tag}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <p className="t-caption">लोड हो रहा है...</p>
            )}

            {/* Date filter (ADR-024) — same date-only filter as the mobile screen */}
            <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
              <input
                type="date"
                className="input"
                value={date}
                max={todayISODate()}
                onChange={(e) => handleDateChange(e.target.value)}
                aria-label="तारीख चुनें"
                style={{ maxWidth: 200 }}
              />
              {date && (
                <button className="btn btn--secondary btn--sm" onClick={() => handleDateChange("")}>
                  सभी दिखाएं
                </button>
              )}
            </div>

            {/* Report list */}
            <div className="dash-card">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--space-5)" }}>
                <h3 className="t-h4">रिपोर्ट सूची</h3>
                <span className="badge badge--brand tabular-nums">{total}</span>
              </div>

              {error && (
                <p className="t-body-sm" style={{ color: "var(--rose)" }}>रिपोर्ट लोड नहीं हो सकीं।</p>
              )}
              {!error && loading && reports.length === 0 && <p className="t-caption">लोड हो रहा है...</p>}
              {!error && !loading && reports.length === 0 && (
                <p className="t-body-sm" style={{ color: "var(--text-tertiary)" }}>
                  {date ? "इस तारीख को कोई रिपोर्ट नहीं" : "कोई रिपोर्ट नहीं मिली"}
                </p>
              )}

              {reports.length > 0 && (
                <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
                  {reports.map((r) => (
                    <div
                      key={r.id}
                      onClick={() => setSelectedReport(r)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "var(--space-3)",
                        padding: "var(--space-3)",
                        borderRadius: "var(--radius-md)",
                        cursor: "pointer",
                        transition: "var(--transition)",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "var(--surface-hover)")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                    >
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--text-primary)" }}>
                          {PLACE_LABEL[r.reportingPlace]} · {r.specificLocation}
                        </div>
                        <div className="t-caption tabular-nums" style={{ marginTop: "2px" }}>
                          {formatStamp(r.reportedAt)}
                        </div>
                      </div>
                      <Badge tone={STATUS_TONE[r.personStatus]}>{STATUS_LABEL[r.personStatus]}</Badge>
                    </div>
                  ))}
                </div>
              )}

              {hasMore && (
                <div style={{ textAlign: "center", marginTop: "var(--space-5)" }}>
                  <button className="btn btn--sm" onClick={loadMore} disabled={loading}>
                    {loading ? "लोड हो रहा है..." : "और लोड करें"}
                  </button>
                </div>
              )}
            </div>
          </div>
        </Container>
      </div>

      {selectedReport && (
        <ReportDetailModal report={selectedReport} onClose={() => setSelectedReport(null)} />
      )}
    </>
  );
}

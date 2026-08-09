"use client";

import { useEffect, useState } from "react";
import Topbar from "@/components/layout/Topbar";
import Container from "@/components/ui/Container";
import StatCard from "@/components/dashboard/StatCard";
import BarChart from "@/components/dashboard/BarChart";
import SDOPPerformance from "@/components/dashboard/SDOPPerformance";
import RecentReportsTable from "@/components/dashboard/RecentReportsTable";
import ActivityFeed from "@/components/dashboard/ActivityFeed";
import { getDashboardStats, type DashboardStats } from "@/lib/api";

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    getDashboardStats()
      .then(setStats)
      .catch(() => setError(true));
  }, []);

  const cards: { label: string; value: string; color: "accent" | "danger" | "success" | "orange"; icon: string }[] = [
    { label: "कुल कैडर", value: stats ? String(stats.totalCadres) : "—", color: "accent", icon: "cadres" },
    { label: "सक्रिय अलर्ट", value: stats ? String(stats.activeAlerts) : "—", color: "danger", icon: "alerts" },
    { label: "इस सप्ताह रिपोर्ट", value: stats ? String(stats.reportsThisWeek) : "—", color: "success", icon: "reports" },
    { label: "लंबित रिपोर्टिंग", value: stats ? String(stats.pendingReporting) : "—", color: "orange", icon: "waiting" },
  ];

  return (
    <>
      <Topbar
        title="प्रदर्शन डैशबोर्ड"
        subtitle="बीजापुर पुलिस — आज का अवलोकन"
      />

      <div style={{ paddingBlock: "var(--space-8)" }}>
        <Container>
          <div className="animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: "var(--space-6)" }}>

            {/* Metric cards — real /stats/dashboard data (ADR-030-scoped to the caller) */}
            {error && (
              <div className="card" style={{ padding: "var(--space-4)", color: "var(--rose)" }}>
                आंकड़े लोड नहीं हो सके। कृपया पेज रीलोड करें।
              </div>
            )}
            <div className="stat-grid">
              {cards.map((card) => (
                <StatCard
                  key={card.label}
                  label={card.label}
                  value={card.value}
                  color={card.color}
                  icon={card.icon}
                />
              ))}
            </div>

            {/* Body: main column (chart + reports) + right rail (SDOP + activity).
                RecentReportsTable (GET /reports) and SDOPPerformance
                (GET /stats/hierarchy) are wired to real data. BarChart's monthly
                tasks-vs-reports trend and ActivityFeed's cross-domain live feed
                have no backing endpoint (no org-wide time-series stat, no unified
                activity log across reports/changes/contact-updates) -- out of
                Phase 1 backend scope, so both stay mock. Flagged, not silently
                left looking real. */}
            <div className="dash-columns">
              <div className="dash-col">
                <BarChart />
                <RecentReportsTable />
              </div>
              <div className="dash-col">
                <SDOPPerformance />
                <ActivityFeed />
              </div>
            </div>
          </div>
        </Container>
      </div>
    </>
  );
}

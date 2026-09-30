"use client";

import { useEffect, useState } from "react";
import StatCard from "@/components/dashboard/StatCard";
import BarChart from "@/components/dashboard/BarChart";
import { getDashboardStats, getHierarchyStats, type DashboardStats, type HierarchyStats } from "@/lib/api";
import StackedBar, { type StackedSegment } from "./StackedBar";
import { formatCount } from "./chartUtils";

export default function OverviewTab() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [hierarchy, setHierarchy] = useState<HierarchyStats | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    getDashboardStats()
      .then(setStats)
      .catch(() => setError(true));
    // The completion and unassigned cards read the rollup; if it fails they show "—" and
    // the rest of the page is unaffected.
    getHierarchyStats()
      .then(setHierarchy)
      .catch(() => undefined);
  }, []);

  const dash = (n: number | undefined) => (n === undefined ? "—" : formatCount(n));

  const cards: { label: string; value: string; color: "accent" | "danger" | "success" | "orange"; icon: string; href?: string }[] = [
    { label: "कुल कैडर", value: dash(stats?.totalCadres), color: "accent", icon: "cadres", href: "/records" },
    { label: "सक्रिय अलर्ट", value: dash(stats?.activeAlerts), color: "danger", icon: "alerts", href: "/records?alertLevel=critical" },
    { label: "इस सप्ताह रिपोर्ट", value: dash(stats?.reportsThisWeek), color: "success", icon: "reports", href: "/reports" },
    { label: "लंबित रिपोर्टिंग", value: dash(stats?.pendingReporting), color: "orange", icon: "waiting", href: "/records?pendingReporting=true" },
    { label: "समग्र रिपोर्टिंग पूर्णता", value: hierarchy ? `${hierarchy.overallCompletion}%` : "—", color: "success", icon: "done" },
    { label: "बिना अधिकारी कैडर", value: dash(hierarchy?.unassignedCadres), color: "accent", icon: "tasks" },
  ];

  // Register composition. A surrendered cadre with a null origin (or an `other` origin
  // with no district/state yet) is in `total` but in none of the three origin buckets --
  // shown as its own "अवर्गीकृत" part rather than silently dropped from the bar.
  const s = stats?.byCategory.surrendered;
  const register: StackedSegment[] = s
    ? [
        { key: "district", label: "समर्पित · बीजापुर जिला", value: s.district, color: "var(--chart-cat-1)", ink: "dark" },
        { key: "otherDistrict", label: "समर्पित · दीगर जिला", value: s.otherDistrict, color: "var(--chart-cat-2)", ink: "light" },
        { key: "otherState", label: "समर्पित · दीगर राज्य", value: s.otherState, color: "var(--chart-cat-3)", ink: "dark" },
        { key: "thana", label: "थाना", value: stats?.byCategory.thana ?? 0, color: "var(--chart-cat-4)", ink: "dark" },
        {
          key: "unclassified",
          label: "समर्पित · अवर्गीकृत",
          value: Math.max(0, s.total - s.district - s.otherDistrict - s.otherState),
          color: "var(--bar-muted)",
          ink: "dark",
        },
      ]
    : [];

  // Status colours here MEAN status (good / warning / critical) and ship with a label.
  const alerts: StackedSegment[] = stats
    ? [
        { key: "normal", label: "सामान्य", value: stats.alertLevelBreakdown.normal, color: "var(--emerald)", ink: "light", display: `${stats.alertLevelBreakdown.normal}%` },
        { key: "warning", label: "चेतावनी", value: stats.alertLevelBreakdown.warning, color: "var(--amber)", ink: "dark", display: `${stats.alertLevelBreakdown.warning}%` },
        { key: "critical", label: "अति-आवश्यक", value: stats.alertLevelBreakdown.critical, color: "var(--rose)", ink: "light", display: `${stats.alertLevelBreakdown.critical}%` },
      ]
    : [];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-6)" }}>
      {error && (
        <div className="card" style={{ padding: "var(--space-4)", color: "var(--rose)" }}>
          आंकड़े लोड नहीं हो सके। कृपया पेज रीलोड करें।
        </div>
      )}

      <p className="t-caption">
        वर्तमान स्थिति — ये आंकड़े आज के हैं, तारीख के अनुसार देखने के लिए &ldquo;रिपोर्टिंग&rdquo; टैब खोलें।
      </p>

      <div className="stat-grid-3">
        {cards.map((c) => (
          <StatCard key={c.label} label={c.label} value={c.value} color={c.color} icon={c.icon} href={c.href} />
        ))}
      </div>

      <div className="profile-grid">
        <div className="dash-card">
          <h3 className="t-h4">रजिस्टर की संरचना</h3>
          <p className="t-caption" style={{ marginTop: 2, marginBottom: "var(--space-5)" }}>
            समर्पित (मूल स्थान के अनुसार) और थाना कैडर
          </p>
          {stats ? <StackedBar segments={register} ariaLabel="रजिस्टर की संरचना" /> : <p className="t-caption">{error ? "आंकड़े लोड नहीं हो सके।" : "लोड हो रहा है..."}</p>}
          {stats && (
            <p className="t-caption" style={{ marginTop: "var(--space-4)", paddingTop: "var(--space-3)", borderTop: "1px solid var(--border)" }}>
              जेल/जमानत रजिस्टर (अलग, ऊपर के कुल में शामिल नहीं):{" "}
              <strong className="tabular-nums" style={{ color: "var(--text-primary)" }}>
                {formatCount(stats.byCategory.jail)}
              </strong>{" "}
              कैडर
            </p>
          )}
        </div>

        <div className="dash-card">
          <h3 className="t-h4">अलर्ट स्तर का अनुपात</h3>
          <p className="t-caption" style={{ marginTop: 2, marginBottom: "var(--space-5)" }}>
            सभी कैडर में हिस्सा (%)
          </p>
          {stats ? <StackedBar segments={alerts} ariaLabel="अलर्ट स्तर का अनुपात" /> : <p className="t-caption">{error ? "आंकड़े लोड नहीं हो सके।" : "लोड हो रहा है..."}</p>}
        </div>
      </div>

      <BarChart stats={stats} error={error} />
    </div>
  );
}

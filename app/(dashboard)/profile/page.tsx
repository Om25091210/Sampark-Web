"use client";

import { useState } from "react";
import { MapPin, CheckCircle2 } from "lucide-react";
import Topbar from "@/components/layout/Topbar";
import Container from "@/components/ui/Container";
import Badge from "@/components/ui/Badge";
import ProfileCard from "@/components/profile/ProfileCard";
import InfoGrid from "@/components/profile/InfoGrid";
import Timeline from "@/components/profile/Timeline";

const TABS = ["व्यक्तिगत जानकारी", "रिपोर्ट", "लोकेशन", "समयरेखा"];

function MapCard() {
  return (
    <div className="card" style={{ overflow: "hidden", height: 220, position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(135deg, var(--brand-soft) 0%, var(--surface-sunken) 100%)" }} />
      <svg style={{ position: "absolute", inset: 0 }} width="100%" height="100%" viewBox="0 0 400 220" preserveAspectRatio="xMidYMid slice">
        {[0, 44, 88, 132, 176, 220].map((y) => (
          <line key={`h${y}`} x1="0" y1={y} x2="400" y2={y} stroke="rgba(15,23,42,0.06)" strokeWidth="1" />
        ))}
        {[0, 50, 100, 150, 200, 250, 300, 350, 400].map((x) => (
          <line key={`v${x}`} x1={x} y1="0" x2={x} y2="220" stroke="rgba(15,23,42,0.06)" strokeWidth="1" />
        ))}
        <path d="M 0 110 Q 100 88 200 110 Q 300 132 400 110" stroke="rgba(15,23,42,0.14)" strokeWidth="2.5" fill="none" strokeLinecap="round" />
        <path d="M 110 0 Q 128 110 118 220" stroke="rgba(15,23,42,0.12)" strokeWidth="2" fill="none" strokeLinecap="round" />
      </svg>
      <div style={{ position: "relative", zIndex: 2, display: "flex", flexDirection: "column", alignItems: "center", gap: "var(--space-2)" }}>
        <span style={{ color: "var(--rose)", filter: "drop-shadow(0 4px 8px rgba(225,29,72,0.35))" }}>
          <MapPin size={32} strokeWidth={2} fill="var(--rose)" color="#fff" />
        </span>
        <span style={{ background: "var(--surface)", borderRadius: "var(--radius-md)", padding: "4px var(--space-3)", fontSize: "0.6875rem", fontWeight: 600, color: "var(--text-primary)", boxShadow: "var(--shadow-sm)" }}>
          बीजापुर सदर
        </span>
      </div>
    </div>
  );
}

function ReportsTab() {
  const rows = [
    { month: "जून 2026", status: "पूर्ण", date: "28 जून" },
    { month: "मई 2026", status: "पूर्ण", date: "31 मई" },
    { month: "अप्रैल 2026", status: "पूर्ण", date: "28 अप्रैल" },
    { month: "मार्च 2026", status: "पूर्ण", date: "30 मार्च" },
    { month: "फरवरी 2026", status: "लंबित", date: "—" },
  ];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
      {rows.map((r, i) => (
        <div key={i} className="dash-card" style={{ padding: "var(--space-4) var(--space-5)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--text-primary)" }}>{r.month}</div>
            <div className="t-caption" style={{ marginTop: 2 }}>रिपोर्टिंग तिथि: {r.date}</div>
          </div>
          <Badge tone={r.status === "पूर्ण" ? "success" : "pending"}>{r.status}</Badge>
        </div>
      ))}
    </div>
  );
}

function LocationHistory() {
  const items = [
    { loc: "बीजापुर सदर थाना", date: "28 जून 2026", time: "10:30 AM" },
    { loc: "बीजापुर पुलिस अधीक्षक कार्यालय", date: "15 जून 2026", time: "02:15 PM" },
    { loc: "बीजापुर सदर थाना", date: "05 जून 2026", time: "11:00 AM" },
  ];
  return (
    <div className="dash-card">
      <h3 className="t-h4" style={{ marginBottom: "var(--space-4)" }}>लोकेशन इतिहास</h3>
      <div style={{ display: "flex", flexDirection: "column" }}>
        {items.map((l, i) => (
          <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "var(--space-3)", padding: "var(--space-3) 0", borderBottom: i < items.length - 1 ? "1px solid var(--border)" : "none" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
              <span style={{ width: 30, height: 30, borderRadius: "var(--radius-full)", background: "var(--brand-soft)", color: "var(--brand-strong)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <MapPin size={14} strokeWidth={1.75} />
              </span>
              <div>
                <div style={{ fontSize: "0.8125rem", fontWeight: 500, color: "var(--text-primary)" }}>{l.loc}</div>
                <div className="t-caption tabular-nums" style={{ fontSize: "0.6875rem", marginTop: 2 }}>{l.date} · {l.time}</div>
              </div>
            </div>
            <CheckCircle2 size={16} strokeWidth={1.75} color="var(--emerald)" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState(0);

  return (
    <>
      <Topbar title="प्रोफाइल" subtitle="राजेश कुमार सिंह — BP-1042" />

      <div style={{ flex: 1, overflowY: "auto", paddingBlock: "var(--space-8)" }}>
        <Container>
          <div className="profile-layout animate-fade-in">
            <ProfileCard />

            <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-5)", minWidth: 0 }}>
              {/* Segmented tabs */}
              <div className="seg-tabs">
                {TABS.map((tab, i) => (
                  <button key={tab} className="seg-tab" data-active={activeTab === i} onClick={() => setActiveTab(i)}>
                    {tab}
                  </button>
                ))}
              </div>

              {activeTab === 0 && (
                <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-5)" }}>
                  <InfoGrid />
                  <MapCard />
                </div>
              )}
              {activeTab === 1 && <ReportsTab />}
              {activeTab === 2 && (
                <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-5)" }}>
                  <MapCard />
                  <LocationHistory />
                </div>
              )}
              {activeTab === 3 && <Timeline />}
            </div>
          </div>
        </Container>
      </div>
    </>
  );
}

import { Phone, Pencil } from "lucide-react";
import { PROFILE_DATA } from "@/lib/constants";

// Quick facts only — full detail lives in the right-hand tab cards, so the
// summary card stays compact instead of duplicating every field.
const QUICK_FACTS = [
  { label: "फ़ोन", value: PROFILE_DATA.phone },
  { label: "थाना", value: PROFILE_DATA.thana },
  { label: "जन्म तिथि", value: PROFILE_DATA.dob },
  { label: "जिला", value: PROFILE_DATA.district },
];

function StatTile({ value, label, color }: { value: string; label: string; color: string }) {
  return (
    <div style={{ padding: "var(--space-4) var(--space-5)", flex: 1 }}>
      <div className="tabular-nums" style={{ fontSize: "1.5rem", fontWeight: 800, letterSpacing: "-0.02em", color }}>
        {value}
      </div>
      <div className="t-caption" style={{ marginTop: 2 }}>{label}</div>
    </div>
  );
}

export default function ProfileCard() {
  return (
    <div className="card card--elevated" style={{ width: "100%", overflow: "hidden", padding: 0 }}>
      {/* Banner */}
      <div style={{ height: 88, background: "linear-gradient(135deg, var(--navy), var(--brand))" }} />

      {/* Avatar */}
      <div style={{ padding: "0 var(--space-5)", marginTop: -36, marginBottom: "var(--space-4)" }}>
        <div
          style={{
            width: 72,
            height: 72,
            borderRadius: "var(--radius-full)",
            background: "linear-gradient(135deg, var(--brand), var(--navy))",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#fff",
            fontSize: "1.375rem",
            fontWeight: 800,
            border: "3px solid var(--surface)",
            boxShadow: "var(--shadow-md)",
          }}
        >
          {PROFILE_DATA.avatar}
        </div>
      </div>

      {/* Identity */}
      <div style={{ padding: "0 var(--space-5) var(--space-4)" }}>
        <h2 className="t-h4" style={{ fontSize: "1.0625rem" }}>{PROFILE_DATA.name}</h2>
        <p className="t-caption" style={{ marginTop: 2 }}>
          {PROFILE_DATA.rank} · {PROFILE_DATA.badge}
        </p>
        <p className="t-caption" style={{ color: "var(--text-disabled)" }}>{PROFILE_DATA.thana}</p>
      </div>

      {/* Stats */}
      <div style={{ display: "flex", borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)" }}>
        <StatTile value={String(PROFILE_DATA.totalReports)} label="कुल रिपोर्ट" color="var(--brand-strong)" />
        <div style={{ width: 1, background: "var(--border)" }} />
        <StatTile value={`${PROFILE_DATA.complianceRate}%`} label="अनुपालन दर" color="var(--emerald)" />
      </div>

      {/* Actions */}
      <div style={{ padding: "var(--space-4) var(--space-5)", display: "flex", gap: "var(--space-3)" }}>
        <button className="btn btn--sm" style={{ flex: 1, background: "var(--emerald-soft)", color: "var(--emerald)" }}>
          <Phone size={14} strokeWidth={2} />
          फ़ोन करें
        </button>
        <button className="btn btn--sm" style={{ flex: 1, background: "var(--brand-soft)", color: "var(--brand-strong)" }}>
          <Pencil size={14} strokeWidth={2} />
          संपादित
        </button>
      </div>

      {/* Quick facts */}
      <div style={{ padding: "var(--space-2) var(--space-5) var(--space-5)", borderTop: "1px solid var(--border)" }}>
        <div className="t-overline" style={{ margin: "var(--space-4) 0 var(--space-3)" }}>मुख्य जानकारी</div>
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
          {QUICK_FACTS.map((f) => (
            <div key={f.label} style={{ display: "flex", justifyContent: "space-between", gap: "var(--space-3)", alignItems: "baseline" }}>
              <span style={{ fontSize: "0.75rem", color: "var(--text-tertiary)", fontWeight: 500, flexShrink: 0 }}>{f.label}</span>
              <span style={{ fontSize: "0.8125rem", color: "var(--text-primary)", fontWeight: 500, textAlign: "right", lineHeight: 1.4 }}>{f.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

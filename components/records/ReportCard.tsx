import Link from "next/link";
import {
  CATEGORY_CHIP,
  ALERT_META,
  initialTag,
  tagLevel,
  formatDate,
  getInitials,
  type Cadre,
} from "@/lib/cadres";

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ fontSize: "0.8125rem", lineHeight: 1.5 }}>
      <span style={{ color: "var(--text-tertiary)" }}>{label} : </span>
      <span style={{ color: "var(--text-secondary)" }}>{value}</span>
    </div>
  );
}

export default function ReportCard({ cadre }: { cadre: Cadre }) {
  const tag = initialTag(cadre);
  const accent = ALERT_META[tagLevel(tag)];

  return (
    // Same destination + interaction the mobile card's onPress opens (the
    // cadre's reporting record) — a card in this list is a person, tapping it
    // opens their record, on web exactly as it does on mobile.
    <Link
      href={`/records/${cadre.id}`}
      className="card card--elevated"
      style={{ display: "flex", overflow: "hidden", padding: 0, cursor: "pointer", textDecoration: "none", color: "inherit" }}
    >
      {/* Alert accent bar */}
      <div style={{ width: 4, background: accent.color, alignSelf: "stretch", flexShrink: 0 }} />

      <div style={{ flex: 1, minWidth: 0, padding: "var(--space-4)", display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
        {/* Zone 1: Identity */}
        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: "var(--radius-full)",
              background: "linear-gradient(135deg, var(--brand), var(--navy))",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              fontSize: "0.75rem",
              fontWeight: 700,
              flexShrink: 0,
            }}
          >
            {getInitials(cadre.name)}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: "0.875rem", lineHeight: 1.4 }}>
              <span style={{ color: "var(--text-tertiary)" }}>नाम : </span>
              <span style={{ color: "var(--text-primary)", fontWeight: 600 }}>{cadre.name}</span>
            </div>
            <div style={{ fontSize: "0.8125rem", lineHeight: 1.4 }}>
              <span style={{ color: "var(--text-tertiary)" }}>नंबर : </span>
              <span style={{ color: "var(--text-secondary)" }}>{cadre.phone}</span>
            </div>
          </div>
          {tag && (
            <span
              className="badge"
              style={{ background: accent.soft, color: accent.color, alignSelf: "flex-start" }}
            >
              <span style={{ width: 5, height: 5, borderRadius: "50%", background: accent.color }} />
              {tag}
            </span>
          )}
        </div>

        <div style={{ height: 1, background: "var(--border)" }} />

        {/* Zone 2: Location + Role */}
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-1)" }}>
          <InfoRow label="थाना" value={cadre.thana} />
          <InfoRow label="वर्तमान निवास" value={cadre.currentAddress} />
          <InfoRow label="पद/जिम्मेदारी" value={cadre.designation} />
        </div>

        {/* Zone 3: Footer */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "var(--space-3)" }}>
          <span className="badge badge--brand">{CATEGORY_CHIP[cadre.category]}</span>
          {cadre.alertDate && (
            <span style={{ fontSize: "0.75rem", fontWeight: 500, color: "var(--brand-strong)" }} className="tabular-nums">
              {formatDate(cadre.alertDate)}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

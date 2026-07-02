import { User, Phone, Briefcase, FileText, type LucideIcon } from "lucide-react";
import { PROFILE_DATA } from "@/lib/constants";

interface InfoCard {
  title: string;
  Icon: LucideIcon;
  tone: { bg: string; fg: string };
  rows: { label: string; value: string }[];
}

const INFO_CARDS: InfoCard[] = [
  {
    title: "व्यक्तिगत पहचान",
    Icon: User,
    tone: { bg: "var(--brand-soft)", fg: "var(--brand-strong)" },
    rows: [
      { label: "नाम", value: PROFILE_DATA.name },
      { label: "जन्म तिथि", value: PROFILE_DATA.dob },
      { label: "जिला", value: PROFILE_DATA.district },
      { label: "राज्य", value: PROFILE_DATA.state },
    ],
  },
  {
    title: "संपर्क जानकारी",
    Icon: Phone,
    tone: { bg: "var(--amber-soft)", fg: "var(--amber)" },
    rows: [
      { label: "फ़ोन", value: PROFILE_DATA.phone },
      { label: "पता", value: PROFILE_DATA.address },
    ],
  },
  {
    title: "आधिकारिक विवरण",
    Icon: Briefcase,
    tone: { bg: "var(--emerald-soft)", fg: "var(--emerald)" },
    rows: [
      { label: "बैज", value: PROFILE_DATA.badge },
      { label: "थाना", value: PROFILE_DATA.thana },
      { label: "रैंक", value: PROFILE_DATA.rank },
      { label: "सेवा आरंभ", value: PROFILE_DATA.joiningDate },
    ],
  },
  {
    title: "आत्मसमर्पण विवरण",
    Icon: FileText,
    tone: { bg: "var(--violet-soft)", fg: "var(--violet)" },
    rows: [
      { label: "केस संख्या", value: PROFILE_DATA.caseNo },
      { label: "आत्मसमर्पण तिथि", value: PROFILE_DATA.surrenderDate },
      { label: "अनुपालन दर", value: `${PROFILE_DATA.complianceRate}%` },
      { label: "कुल रिपोर्ट", value: String(PROFILE_DATA.totalReports) },
    ],
  },
];

export default function InfoGrid() {
  return (
    <div className="profile-grid">
      {INFO_CARDS.map(({ title, Icon, tone, rows }) => (
        <div key={title} className="dash-card">
          <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)", marginBottom: "var(--space-4)", paddingBottom: "var(--space-3)", borderBottom: "1px solid var(--border)" }}>
            <span
              style={{
                width: 32,
                height: 32,
                background: tone.bg,
                color: tone.fg,
                borderRadius: "var(--radius-md)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <Icon size={16} strokeWidth={1.75} />
            </span>
            <h3 className="t-h4" style={{ fontSize: "0.875rem" }}>{title}</h3>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
            {rows.map((row) => (
              <div key={row.label} style={{ display: "flex", justifyContent: "space-between", gap: "var(--space-4)", alignItems: "baseline" }}>
                <span style={{ fontSize: "0.8125rem", color: "var(--text-tertiary)", fontWeight: 500, flexShrink: 0 }}>{row.label}</span>
                <span style={{ fontSize: "0.8125rem", color: "var(--text-primary)", fontWeight: 500, textAlign: "right", lineHeight: 1.45 }}>{row.value}</span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

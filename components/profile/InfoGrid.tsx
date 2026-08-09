"use client";

import { useEffect, useState } from "react";
import { User, Phone, Briefcase, type LucideIcon } from "lucide-react";
import { me, type WireUser } from "@/lib/api";
import { ROLE_LABELS, STATUS_LABELS } from "@/lib/users";

interface InfoCard {
  title: string;
  Icon: LucideIcon;
  tone: { bg: string; fg: string };
  rows: { label: string; value: string }[];
}

// GET /auth/me's AuthUser has no DOB/district/state/case-number/surrender-date/
// compliance-rate -- those belong to the Cadre domain, not a User account. The
// mock version of this component modeled a logged-in admin/SDOP/super_admin as
// if they were a surrendered cadre, which never matched what the backend can
// actually return. These three cards show only real WireUser fields.
function buildCards(user: WireUser): InfoCard[] {
  return [
    {
      title: "पहचान",
      Icon: User,
      tone: { bg: "var(--brand-soft)", fg: "var(--brand-strong)" },
      rows: [
        { label: "नाम", value: user.name },
        { label: "भूमिका", value: ROLE_LABELS[user.role] },
        { label: "स्थिति", value: STATUS_LABELS[user.status ?? "active"] },
      ],
    },
    {
      title: "संपर्क जानकारी",
      Icon: Phone,
      tone: { bg: "var(--amber-soft)", fg: "var(--amber)" },
      rows: [
        { label: "फ़ोन", value: user.phone ?? "—" },
        { label: "ईमेल", value: user.email ?? "—" },
      ],
    },
    {
      title: "आधिकारिक विवरण",
      Icon: Briefcase,
      tone: { bg: "var(--emerald-soft)", fg: "var(--emerald)" },
      rows: [
        { label: "पदनाम", value: user.designation ?? "—" },
        { label: "थाना", value: user.thana ?? "—" },
        { label: "उप-मंडल", value: user.subDivision ?? "—" },
      ],
    },
  ];
}

export default function InfoGrid() {
  const [user, setUser] = useState<WireUser | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    me()
      .then(setUser)
      .catch(() => setError(true));
  }, []);

  if (error) {
    return <p className="t-body-sm" style={{ color: "var(--rose)" }}>जानकारी लोड नहीं हो सकी।</p>;
  }
  if (user === null) {
    return <p className="t-caption">लोड हो रहा है...</p>;
  }

  return (
    <div className="profile-grid">
      {buildCards(user).map(({ title, Icon, tone, rows }) => (
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

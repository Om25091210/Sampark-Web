"use client";

import { useEffect, useState } from "react";
import { Phone, Mail } from "lucide-react";
import { me, type WireUser } from "@/lib/api";
import { ROLE_LABELS, STATUS_LABELS } from "@/lib/users";
import { getInitials } from "@/lib/cadres";

// Quick facts only — full detail lives in the right-hand tab cards, so the
// summary card stays compact instead of duplicating every field.
export default function ProfileCard() {
  const [user, setUser] = useState<WireUser | null>(null);

  useEffect(() => {
    me()
      .then(setUser)
      .catch(() => setUser(null));
  }, []);

  const scope = user?.thana ?? user?.subDivision ?? "मुख्यालय";
  const quickFacts = user
    ? [
        { label: "फ़ोन", value: user.phone ?? "—" },
        { label: "ईमेल", value: user.email ?? "—" },
        { label: "थाना / उप-मंडल", value: scope },
        { label: "स्थिति", value: STATUS_LABELS[user.status ?? "active"] },
      ]
    : [];

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
          {user ? getInitials(user.name) : "—"}
        </div>
      </div>

      {/* Identity */}
      <div style={{ padding: "0 var(--space-5) var(--space-4)" }}>
        <h2 className="t-h4" style={{ fontSize: "1.0625rem" }}>{user?.name ?? "लोड हो रहा है..."}</h2>
        {user && (
          <p className="t-caption" style={{ marginTop: 2 }}>
            {ROLE_LABELS[user.role]}{user.designation ? ` · ${user.designation}` : ""}
          </p>
        )}
        {user && <p className="t-caption" style={{ color: "var(--text-disabled)" }}>{scope}</p>}
      </div>

      {/* Actions */}
      <div style={{ padding: "var(--space-4) var(--space-5)", display: "flex", gap: "var(--space-3)", borderTop: "1px solid var(--border)" }}>
        <button className="btn btn--sm" style={{ flex: 1, background: "var(--emerald-soft)", color: "var(--emerald)" }} disabled={!user?.phone}>
          <Phone size={14} strokeWidth={2} />
          फ़ोन करें
        </button>
        <button className="btn btn--sm" style={{ flex: 1, background: "var(--brand-soft)", color: "var(--brand-strong)" }} disabled={!user?.email}>
          <Mail size={14} strokeWidth={2} />
          ईमेल करें
        </button>
      </div>

      {/* Quick facts */}
      <div style={{ padding: "var(--space-2) var(--space-5) var(--space-5)", borderTop: "1px solid var(--border)" }}>
        <div className="t-overline" style={{ margin: "var(--space-4) 0 var(--space-3)" }}>मुख्य जानकारी</div>
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
          {quickFacts.map((f) => (
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

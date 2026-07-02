import { Check, ThumbsUp, Clock, Phone, RefreshCw, type LucideIcon } from "lucide-react";
import { ACTIVITY_FEED } from "@/lib/constants";

const TYPE_CONFIG: Record<string, { fg: string; bg: string; Icon: LucideIcon }> = {
  submit: { fg: "var(--brand-strong)", bg: "var(--brand-soft)", Icon: Check },
  approve: { fg: "var(--emerald)", bg: "var(--emerald-soft)", Icon: ThumbsUp },
  pending: { fg: "var(--amber)", bg: "var(--amber-soft)", Icon: Clock },
  contact: { fg: "var(--rose)", bg: "var(--rose-soft)", Icon: Phone },
  update: { fg: "var(--text-tertiary)", bg: "var(--surface-sunken)", Icon: RefreshCw },
};

export default function ActivityFeed() {
  return (
    <div className="dash-card">
      <div style={{ marginBottom: "var(--space-5)" }}>
        <h3 className="t-h4">लाइव गतिविधि</h3>
        <p className="t-caption" style={{ marginTop: "2px" }}>वास्तविक समय अपडेट</p>
      </div>

      <div style={{ display: "flex", flexDirection: "column" }}>
        {ACTIVITY_FEED.map((item, i) => {
          const tc = TYPE_CONFIG[item.type] ?? TYPE_CONFIG.update;
          const isLast = i === ACTIVITY_FEED.length - 1;
          return (
            <div
              key={item.id}
              style={{ display: "flex", gap: "var(--space-3)", paddingBottom: isLast ? 0 : "var(--space-5)", position: "relative" }}
            >
              {/* Connector line */}
              {!isLast && (
                <div
                  style={{
                    position: "absolute",
                    left: 13,
                    top: 28,
                    bottom: 0,
                    width: 1,
                    background: "var(--border)",
                  }}
                />
              )}

              {/* Icon dot */}
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: "var(--radius-full)",
                  background: tc.bg,
                  color: tc.fg,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  zIndex: 1,
                }}
              >
                <tc.Icon size={13} strokeWidth={2.25} />
              </div>

              <div style={{ flex: 1, paddingTop: 2 }}>
                <div style={{ fontSize: "0.8125rem", fontWeight: 500, color: "var(--text-primary)", lineHeight: 1.45 }}>
                  {item.text}
                </div>
                <div className="t-caption" style={{ fontSize: "0.6875rem", marginTop: 2 }}>
                  {item.time}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

import { Check, ShieldCheck, ThumbsUp, RefreshCw, Bell, type LucideIcon } from "lucide-react";

interface TimelineEvent {
  id: number;
  title: string;
  desc: string;
  date: string;
  Icon: LucideIcon;
  color: string;
  bg: string;
}

const TIMELINE_EVENTS: TimelineEvent[] = [
  { id: 1, title: "मासिक रिपोर्ट जमा", desc: "जून 2026 की रिपोर्ट सफलतापूर्वक जमा की गई", date: "28 जून 2026", Icon: Check, color: "var(--brand-strong)", bg: "var(--brand-soft)" },
  { id: 2, title: "थाना भ्रमण सत्यापन", desc: "अधिकारी द्वारा उपस्थिति सत्यापित की गई", date: "15 जून 2026", Icon: ShieldCheck, color: "var(--emerald)", bg: "var(--emerald-soft)" },
  { id: 3, title: "माह रिपोर्ट अनुमोदित", desc: "मई की रिपोर्ट थाना प्रभारी द्वारा अनुमोदित", date: "05 जून 2026", Icon: ThumbsUp, color: "var(--emerald)", bg: "var(--emerald-soft)" },
  { id: 4, title: "पता अपडेट", desc: "निवास पता बदलने की जानकारी दी गई", date: "20 मई 2026", Icon: RefreshCw, color: "var(--amber)", bg: "var(--amber-soft)" },
  { id: 5, title: "रिपोर्टिंग लंबित", desc: "समय पर रिपोर्ट न मिलने पर अनुस्मारक भेजा गया", date: "01 मई 2026", Icon: Bell, color: "var(--rose)", bg: "var(--rose-soft)" },
];

export default function Timeline() {
  return (
    <div className="dash-card">
      <h3 className="t-h4" style={{ marginBottom: "var(--space-5)" }}>गतिविधि समयरेखा</h3>

      <div style={{ display: "flex", flexDirection: "column" }}>
        {TIMELINE_EVENTS.map((event, i) => {
          const isLast = i === TIMELINE_EVENTS.length - 1;
          return (
            <div key={event.id} style={{ display: "flex", gap: "var(--space-4)", paddingBottom: isLast ? 0 : "var(--space-5)", position: "relative" }}>
              {!isLast && (
                <div style={{ position: "absolute", left: 15, top: 32, bottom: 0, width: 1, background: "var(--border)" }} />
              )}

              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: "var(--radius-full)",
                  background: event.bg,
                  color: event.color,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  zIndex: 1,
                }}
              >
                <event.Icon size={15} strokeWidth={2.25} />
              </div>

              <div style={{ flex: 1, paddingTop: 4 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "var(--space-3)", marginBottom: 2 }}>
                  <span style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--text-primary)" }}>{event.title}</span>
                  <span className="t-caption tabular-nums" style={{ fontSize: "0.6875rem", flexShrink: 0 }}>{event.date}</span>
                </div>
                <p style={{ fontSize: "0.8125rem", color: "var(--text-secondary)", lineHeight: 1.5 }}>{event.desc}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

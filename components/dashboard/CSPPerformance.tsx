import { FileText } from "lucide-react";
import { CSP_PERFORMANCE } from "@/lib/constants";

export default function CSPPerformance() {
  return (
    <>
      <div className="dash-card">
        <h3 className="t-h4">CSP प्रदर्शन</h3>
        <p className="t-caption" style={{ marginTop: "2px", marginBottom: "var(--space-5)" }}>
          क्षेत्र-वार रिपोर्टिंग दर
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-5)" }}>
          {CSP_PERFORMANCE.map((csp, i) => (
            <div key={i}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "var(--space-2)" }}>
                <span style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--text-primary)" }}>
                  {csp.name}
                </span>
                <span className="tabular-nums" style={{ fontSize: "0.8125rem", fontWeight: 700, color: "var(--brand-strong)" }}>
                  {csp.progress}%
                </span>
              </div>
              {/* Track */}
              <div style={{ height: 6, background: "var(--track)", borderRadius: "var(--radius-full)", overflow: "hidden" }}>
                {/* Fill with rounded caps */}
                <div
                  style={{
                    height: "100%",
                    width: `${csp.progress}%`,
                    background: "var(--brand)",
                    borderRadius: "var(--radius-full)",
                    transition: "width 0.5s var(--ease)",
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Monthly Report strip (deep neutral accent card) */}
      <div
        style={{
          background: "var(--navy)",
          borderRadius: "var(--radius-xl)",
          padding: "var(--space-5)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "var(--space-4)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
          <span
            style={{
              width: 40,
              height: 40,
              background: "rgba(14,165,196,0.18)",
              borderRadius: "var(--radius-lg)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--brand)",
              flexShrink: 0,
            }}
          >
            <FileText size={18} strokeWidth={1.75} />
          </span>
          <div>
            <div style={{ color: "var(--on-dark)", fontSize: "0.8125rem", fontWeight: 600 }}>
              माह की रिपोर्ट
            </div>
            <div style={{ color: "var(--on-dark-faint)", fontSize: "0.6875rem" }}>
              इस माह सबमिट की गईं
            </div>
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div className="tabular-nums" style={{ color: "var(--brand)", fontSize: "1.5rem", fontWeight: 800, letterSpacing: "-0.02em" }}>
            156
          </div>
          <div style={{ color: "var(--on-dark-faint)", fontSize: "0.625rem" }}>
            +12% से पिछले माह
          </div>
        </div>
      </div>
    </>
  );
}

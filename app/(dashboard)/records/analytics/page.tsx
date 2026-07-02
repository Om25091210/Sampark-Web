import Topbar from "@/components/layout/Topbar";
import Container from "@/components/ui/Container";

// ─── Cadre analytics data (mirrors the mobile StatsPage) ──────────────────────

const MONTHLY = {
  labels: ["जन", "फर", "मार", "अप्र", "मई", "जून"],
  reports: [18, 24, 20, 28, 22, 34],
  alerts: [5, 3, 8, 4, 6, 4],
};

// Validated categorical palette (CVD worst ΔE 12.5) — concrete hex so SVG
// strokes render regardless of CSS-token load timing.
const CATEGORY = [
  { label: "समर्पित", value: 86, color: "#0EA5C4" }, // cyan (brand)
  { label: "थाना", value: 112, color: "#4F6BE0" }, // indigo
  { label: "जेल", value: 34, color: "#E0699A" }, // magenta
  { label: "अन्य", value: 16, color: "#94A3B8" }, // slate — "other" bucket
];

// Severity (status) — softened shades that harmonise with the categorical set.
const ALERT = [
  { label: "अति-आवश्यक", value: 12, color: "#DC4C4C" },
  { label: "चेतावनी", value: 22, color: "#E0993A" },
  { label: "सामान्य", value: 82, color: "#1FA37A" }, // teal-green → ties to brand
  { label: "निष्क्रिय", value: 132, color: "#B4BCC9" },
];

const OFFICERS = [
  { name: "रवि प्रकाश नेताम", pct: 85 },
  { name: "अनुज पटेल", pct: 72 },
  { name: "सीमा वर्मा", pct: 91 },
  { name: "देवराज कुमार", pct: 60 },
  { name: "प्रीति श्रीवास्तव", pct: 78 },
];

function perfTone(pct: number): { color: string; soft: string } {
  if (pct >= 90) return { color: "var(--emerald)", soft: "var(--emerald-soft)" };
  if (pct >= 75) return { color: "var(--brand-strong)", soft: "var(--brand-soft)" };
  return { color: "var(--amber)", soft: "var(--amber-soft)" };
}

// ─── Radial gauge (reused view) — now for officer completion ──────────────────

function Gauge({ pct, color, size = 92 }: { pct: number; color: string; size?: number }) {
  const stroke = 9;
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - pct / 100);
  return (
    <div style={{ position: "relative", width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--track)" strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={offset} style={{ transition: "stroke-dashoffset 0.6s var(--ease)" }} />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <span className="tabular-nums" style={{ fontSize: "1rem", fontWeight: 800, letterSpacing: "-0.02em", color }}>{pct}%</span>
      </div>
    </div>
  );
}

function OfficerCompletion() {
  return (
    <div className="dash-card">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: "var(--space-3)", marginBottom: "var(--space-5)" }}>
        <div>
          <h3 className="t-h4">अधिकारी पूर्णता दर</h3>
          <p className="t-caption" style={{ marginTop: 2 }}>रिपोर्टिंग पूर्णता (%)</p>
        </div>
        <span className="t-caption tabular-nums">{OFFICERS.length} अधिकारी</span>
      </div>

      <div className="hscroll" style={{ display: "flex", flexDirection: "row", gap: "var(--space-4)", overflowX: "auto", paddingBottom: "var(--space-3)" }}>
        {OFFICERS.map((o) => (
          <div key={o.name} className="card" style={{ width: 168, flexShrink: 0, padding: "var(--space-5)", display: "flex", flexDirection: "column", alignItems: "center", gap: "var(--space-3)", textAlign: "center" }}>
            <Gauge pct={o.pct} color={perfTone(o.pct).color} />
            <div style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--text-primary)", lineHeight: 1.3 }}>{o.name}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Smooth area/line trend — monthly reports vs alerts ───────────────────────

function smoothPath(pts: { x: number; y: number }[]): string {
  if (pts.length < 2) return "";
  let d = `M ${pts[0].x},${pts[0].y}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] ?? p2;
    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C ${cp1x},${cp1y} ${cp2x},${cp2y} ${p2.x},${p2.y}`;
  }
  return d;
}

function TrendChart() {
  const W = 800, H = 280;
  const padL = 14, padR = 14, padT = 20, padB = 32;
  const plotW = W - padL - padR;
  const plotH = H - padT - padB;
  const max = Math.max(...MONTHLY.reports, ...MONTHLY.alerts);
  const niceMax = Math.ceil(max / 10) * 10;
  const baseline = padT + plotH;
  const X = (i: number) => padL + (i * plotW) / (MONTHLY.labels.length - 1);
  const Y = (v: number) => padT + (1 - v / niceMax) * plotH;

  const reportsPts = MONTHLY.reports.map((v, i) => ({ x: X(i), y: Y(v) }));
  const alertsPts = MONTHLY.alerts.map((v, i) => ({ x: X(i), y: Y(v) }));
  const reportsLine = smoothPath(reportsPts);
  const alertsLine = smoothPath(alertsPts);
  const reportsArea = `${reportsLine} L ${X(MONTHLY.labels.length - 1)},${baseline} L ${X(0)},${baseline} Z`;
  const grid = [0, 0.25, 0.5, 0.75, 1];

  return (
    <div className="dash-card">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "var(--space-4)", marginBottom: "var(--space-5)" }}>
        <div>
          <h3 className="t-h4">मासिक गतिविधि</h3>
          <p className="t-caption" style={{ marginTop: 2 }}>रिपोर्ट और अलर्ट — जनवरी से जून 2026</p>
        </div>
        <div style={{ display: "flex", gap: "var(--space-4)", alignItems: "center" }}>
          <span style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
            <span style={{ width: 14, height: 3, borderRadius: 2, background: "var(--brand)" }} />
            <span className="t-caption" style={{ fontWeight: 500 }}>रिपोर्ट</span>
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
            <span style={{ width: 14, height: 3, borderRadius: 2, background: "var(--rose)" }} />
            <span className="t-caption" style={{ fontWeight: 500 }}>अलर्ट</span>
          </span>
        </div>
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "auto", display: "block", overflow: "visible" }}>
        <defs>
          <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(14,165,196,0.26)" />
            <stop offset="100%" stopColor="rgba(14,165,196,0)" />
          </linearGradient>
        </defs>

        {grid.map((t, i) => {
          const gy = padT + t * plotH;
          return (
            <g key={i}>
              <line x1={padL} x2={W - padR} y1={gy} y2={gy} style={{ stroke: "var(--border)" }} strokeWidth={1} />
              <text x={0} y={gy - 4} style={{ fill: "var(--text-disabled)" }} fontSize={11}>{Math.round(niceMax * (1 - t))}</text>
            </g>
          );
        })}

        <path d={reportsArea} fill="url(#trendFill)" />
        <path d={alertsLine} fill="none" style={{ stroke: "var(--rose)" }} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
        <path d={reportsLine} fill="none" style={{ stroke: "var(--brand)" }} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />

        {alertsPts.map((p, i) => (
          <circle key={`a${i}`} cx={p.x} cy={p.y} r={3} style={{ fill: "var(--surface)", stroke: "var(--rose)" }} strokeWidth={2.5} />
        ))}
        {reportsPts.map((p, i) => (
          <circle key={`r${i}`} cx={p.x} cy={p.y} r={4} style={{ fill: "var(--surface)", stroke: "var(--brand)" }} strokeWidth={3} />
        ))}

        {MONTHLY.labels.map((m, i) => (
          <text key={m} x={X(i)} y={H - 8} textAnchor="middle" style={{ fill: "var(--text-tertiary)" }} fontSize={12}>{m}</text>
        ))}
      </svg>
    </div>
  );
}

// ─── Donut distribution (new view type) ───────────────────────────────────────

function DonutChart({ title, sub, segments }: { title: string; sub: string; segments: { label: string; value: number; color: string }[] }) {
  const total = segments.reduce((s, x) => s + x.value, 0);
  const size = 150, stroke = 20;
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const GAP = 3; // surface gap between segments
  let acc = 0;

  return (
    <div className="dash-card">
      <h3 className="t-h4">{title}</h3>
      <p className="t-caption" style={{ marginTop: 2, marginBottom: "var(--space-5)" }}>{sub}</p>

      <div style={{ display: "flex", gap: "var(--space-6)", alignItems: "center", flexWrap: "wrap" }}>
        <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
          <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
            <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--track)" strokeWidth={stroke} />
            {segments.map((seg) => {
              const full = (seg.value / total) * circ;
              const dash = Math.max(full - GAP, 1);
              const el = (
                <circle
                  key={seg.label}
                  cx={size / 2}
                  cy={size / 2}
                  r={r}
                  fill="none"
                  stroke={seg.color}
                  strokeWidth={stroke}
                  strokeDasharray={`${dash} ${circ - dash}`}
                  strokeDashoffset={-acc}
                />
              );
              acc += full;
              return el;
            })}
          </svg>
          <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
            <span className="tabular-nums" style={{ fontSize: "1.375rem", fontWeight: 800, letterSpacing: "-0.02em", color: "var(--text-primary)" }}>{total}</span>
            <span className="t-caption" style={{ fontSize: "0.625rem" }}>कुल</span>
          </div>
        </div>

        <div style={{ flex: 1, minWidth: 160, display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
          {segments.map((seg) => (
            <div key={seg.label} style={{ display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
              <span style={{ width: 10, height: 10, borderRadius: 3, background: seg.color, flexShrink: 0 }} />
              <span style={{ flex: 1, fontSize: "0.8125rem", color: "var(--text-secondary)" }}>{seg.label}</span>
              <span className="tabular-nums" style={{ fontSize: "0.8125rem", fontWeight: 700, color: "var(--text-primary)" }}>{seg.value}</span>
              <span className="tabular-nums t-caption" style={{ width: 40, textAlign: "right" }}>{Math.round((seg.value / total) * 100)}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function AnalyticsPage() {
  return (
    <>
      <Topbar title="रिपोर्ट विश्लेषण" subtitle="कैडर, श्रेणी और अलर्ट का विस्तृत विश्लेषण" />

      <div style={{ paddingBlock: "var(--space-8)" }}>
        <Container>
          <div className="animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: "var(--space-6)" }}>
            <OfficerCompletion />
            <TrendChart />
            <div className="profile-grid">
              <DonutChart title="श्रेणी वितरण" sub="कैडर की श्रेणी के अनुसार" segments={CATEGORY} />
              <DonutChart title="अलर्ट स्तर वितरण" sub="प्राथमिकता के अनुसार" segments={ALERT} />
            </div>
          </div>
        </Container>
      </div>
    </>
  );
}

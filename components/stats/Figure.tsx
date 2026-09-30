interface FigureProps {
  label: string;
  value: string;
}

// A small headline figure for a chart card's header. Proportional digits (not tabular):
// tabular-nums is for columns that must align, and loosens a standalone number.
export default function Figure({ label, value }: FigureProps) {
  return (
    <div style={{ textAlign: "right" }}>
      <div className="t-caption">{label}</div>
      <div style={{ fontSize: "1.125rem", fontWeight: 800, letterSpacing: "-0.02em", color: "var(--text-primary)" }}>{value}</div>
    </div>
  );
}

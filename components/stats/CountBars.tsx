import { formatCount } from "./chartUtils";

export interface CountRow {
  key: string;
  label: string;
  count: number;
}

interface CountBarsProps {
  rows: CountRow[];
  /** The long tail folded together (a distribution's "अन्य"). Drawn muted. */
  other?: number;
  /** Rows with no value recorded ("दर्ज नहीं"). Drawn muted, so a gap reads as a gap. */
  unknown?: number;
  /** Denominator for the share column. */
  total: number;
  ariaLabel: string;
  /** A CSS colour token for the named rows. One measure, nominal categories -> one colour. */
  color?: string;
}

// Horizontal bars of COUNTS against the largest one, with each row's share of `total`.
// Named rows share one colour (length carries magnitude); the folded tail and the blanks
// are muted so they are visibly "not a category".
export default function CountBars({ rows, other = 0, unknown = 0, total, ariaLabel, color = "var(--chart-cat-1)" }: CountBarsProps) {
  const all = [
    ...rows.map((r) => ({ ...r, muted: false })),
    ...(other > 0 ? [{ key: "__other", label: "अन्य", count: other, muted: true }] : []),
    ...(unknown > 0 ? [{ key: "__unknown", label: "दर्ज नहीं", count: unknown, muted: true }] : []),
  ];
  const max = Math.max(1, ...all.map((r) => r.count));

  if (total === 0 || all.length === 0) {
    return (
      <p className="t-body-sm" style={{ color: "var(--text-tertiary)" }}>
        कोई डेटा उपलब्ध नहीं है।
      </p>
    );
  }

  return (
    <ul aria-label={ariaLabel} style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
      {all.map((r) => (
        <li key={r.key}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: "var(--space-3)", marginBottom: 4 }}>
            <span style={{ fontSize: "0.8125rem", fontWeight: r.muted ? 400 : 600, color: r.muted ? "var(--text-tertiary)" : "var(--text-primary)" }}>{r.label}</span>
            <span style={{ display: "flex", alignItems: "baseline", gap: "var(--space-3)" }}>
              <span className="tabular-nums" style={{ fontSize: "0.8125rem", fontWeight: 700, color: "var(--text-primary)" }}>
                {formatCount(r.count)}
              </span>
              <span className="t-caption tabular-nums" style={{ minWidth: 36, textAlign: "right" }}>
                {Math.round((r.count / total) * 100)}%
              </span>
            </span>
          </div>
          <div style={{ height: 8, background: "var(--track)", borderRadius: "var(--radius-full)", overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${(r.count / max) * 100}%`, background: r.muted ? "var(--bar-muted)" : color, borderRadius: "var(--radius-full)", transition: "width 0.5s var(--ease)" }} />
          </div>
        </li>
      ))}
    </ul>
  );
}

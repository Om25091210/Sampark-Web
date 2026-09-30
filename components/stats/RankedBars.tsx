import { formatCount } from "./chartUtils";

export interface RankedRow {
  key: string;
  label: string;
  /** Secondary text beside the label (e.g. the sub-division). */
  caption?: string;
  /** 0-100, or null when there is nothing to measure (0 cadres is not 0% -- and not 100%). */
  pct: number | null;
  /** The counts behind the percentage, e.g. "12 / 20 कैडर". */
  detail: string;
}

interface RankedBarsProps {
  rows: RankedRow[];
  ariaLabel: string;
  emptyLabel?: string;
}

// Horizontal bars in the order given (the caller ranks). One measure across nominal
// categories -> one colour: length carries magnitude, so hue is left free.
export default function RankedBars({ rows, ariaLabel, emptyLabel = "कोई डेटा उपलब्ध नहीं है।" }: RankedBarsProps) {
  if (rows.length === 0) {
    return (
      <p className="t-body-sm" style={{ color: "var(--text-tertiary)" }}>
        {emptyLabel}
      </p>
    );
  }

  return (
    <ul aria-label={ariaLabel} style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
      {rows.map((row) => (
        <li key={row.key}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: "var(--space-3)", marginBottom: "var(--space-2)" }}>
            <span style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--text-primary)" }}>
              {row.label}
              {row.caption && (
                <span className="t-caption" style={{ marginLeft: "var(--space-2)", fontWeight: 400 }}>
                  {row.caption}
                </span>
              )}
            </span>
            <span style={{ display: "flex", alignItems: "baseline", gap: "var(--space-3)" }}>
              <span className="t-caption tabular-nums">{row.detail}</span>
              <span className="tabular-nums" style={{ minWidth: 40, textAlign: "right", fontSize: "0.8125rem", fontWeight: 700, color: row.pct === null ? "var(--text-disabled)" : "var(--text-primary)" }}>
                {row.pct === null ? "—" : `${formatCount(row.pct)}%`}
              </span>
            </span>
          </div>
          <div style={{ height: 8, background: "var(--track)", borderRadius: "var(--radius-full)", overflow: "hidden" }}>
            {row.pct !== null && (
              <div style={{ height: "100%", width: `${row.pct}%`, background: "var(--chart-cat-1)", borderRadius: "var(--radius-full)", transition: "width 0.5s var(--ease)" }} />
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}

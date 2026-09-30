import type { HierarchyThanaRow } from "@/lib/api";

interface ThanaTilesProps {
  rows: HierarchyThanaRow[];
}

// Tile-cartogram: one tile per thana, grouped by sub-division, shaded by completion.
// Not a geographic map -- public map tiles would send queries outside India (root data-
// residency rule), and this reads the same question ("where is it thin?") without one.
// Sequential shading: one hue, light -> dark; a thana with no cadres has nothing to shade.
function shade(pct: number): string {
  return `color-mix(in srgb, var(--brand) ${10 + Math.round(pct * 0.9)}%, var(--surface))`;
}

export default function ThanaTiles({ rows }: ThanaTilesProps) {
  const groups = new Map<string, HierarchyThanaRow[]>();
  for (const r of rows) {
    const key = r.subDivision ?? "अन्य";
    groups.set(key, [...(groups.get(key) ?? []), r]);
  }

  if (rows.length === 0) {
    return (
      <p className="t-body-sm" style={{ color: "var(--text-tertiary)" }}>
        कोई डेटा उपलब्ध नहीं है।
      </p>
    );
  }

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "var(--space-5)" }}>
        {[...groups.entries()].map(([subDivision, thanas]) => (
          <div key={subDivision}>
            <div className="t-overline" style={{ marginBottom: "var(--space-2)" }}>
              {subDivision}
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
              {thanas.map((t) => {
                const empty = t.assignedCadres === 0;
                return (
                  <div
                    key={t.thana}
                    tabIndex={0}
                    title={empty ? `${t.thana}: कोई कैडर नहीं` : `${t.thana}: ${t.reportingCompletion}% (${t.currentCadres} / ${t.assignedCadres} कैडर)`}
                    aria-label={empty ? `${t.thana}: कोई कैडर नहीं` : `${t.thana}: ${t.reportingCompletion}% पूर्णता, ${t.currentCadres} / ${t.assignedCadres} कैडर`}
                    style={{
                      width: 92,
                      height: 60,
                      padding: "var(--space-2) var(--space-3)",
                      borderRadius: "var(--radius-md)",
                      border: "1px solid var(--border)",
                      background: empty ? "var(--surface-sunken)" : shade(t.reportingCompletion),
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                    }}
                  >
                    <span style={{ fontSize: "0.6875rem", fontWeight: 600, color: "var(--text-primary)", lineHeight: 1.25 }}>{t.thana}</span>
                    <span className="tabular-nums" style={{ fontSize: "0.9375rem", fontWeight: 800, color: empty ? "var(--text-disabled)" : "var(--text-primary)" }}>
                      {empty ? "—" : `${t.reportingCompletion}%`}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)", marginTop: "var(--space-5)" }}>
        <span className="t-caption tabular-nums">0%</span>
        <span style={{ width: 160, height: 8, borderRadius: "var(--radius-full)", background: "linear-gradient(to right, color-mix(in srgb, var(--brand) 10%, var(--surface)), var(--brand))", border: "1px solid var(--border)" }} />
        <span className="t-caption tabular-nums">100%</span>
        <span className="t-caption" style={{ marginLeft: "var(--space-3)" }}>
          पूर्णता (गहरा = अधिक)
        </span>
      </div>
    </div>
  );
}

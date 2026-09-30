"use client";

import { getSurrenders, type SurrenderYearRow } from "@/lib/api";
import ChartCard from "./ChartCard";
import ChartTable from "./ChartTable";
import Figure from "./Figure";
import LineChart from "./LineChart";
import RegionFilters from "./RegionFilters";
import StackedColumns from "./StackedColumns";
import { formatCount, type ParamReader, type UpdateParams } from "./chartUtils";
import { useStatsQuery } from "./hooks";

interface SurrenderTabProps {
  params: ParamReader;
  update: UpdateParams;
}

const UNDATED = "वर्ष दर्ज नहीं";

const zeroYear = (year: string): SurrenderYearRow => ({
  year, total: 0, district: 0, otherDistrict: 0, otherState: 0, unclassified: 0, DVCM: 0, ACM: 0, PM: 0,
  otherRank: 0, active: 0, activeRecent: 0, deceased: 0, untraceable: 0, otherExempt: 0,
});

/** Every year from the first to the last dated one, gaps filled with a real zero (a year in
 *  which nobody surrendered belongs on the axis). The undated group stays last. */
function withYearGaps(years: SurrenderYearRow[]): { dated: SurrenderYearRow[]; undated: SurrenderYearRow | null } {
  const dated = years.filter((y) => y.year !== null);
  const undated = years.find((y) => y.year === null) ?? null;
  if (dated.length === 0) return { dated: [], undated };
  const byYear = new Map(dated.map((y) => [Number(y.year), y]));
  const nums = [...byYear.keys()];
  const [lo, hi] = [Math.min(...nums), Math.max(...nums)];
  const filled: SurrenderYearRow[] = [];
  for (let y = lo; y <= hi; y++) filled.push(byYear.get(y) ?? zeroYear(String(y)));
  return { dated: filled, undated };
}

// Ordered classes (DVCM > ACM > PM) take one hue stepped light -> dark, not four categorical hues.
const RANK_SERIES = [
  { key: "DVCM", label: "DVCM", color: "var(--brand-strong)" },
  { key: "ACM", label: "ACM", color: "var(--brand)" },
  { key: "PM", label: "PM", color: "color-mix(in srgb, var(--brand) 55%, var(--surface))" },
  { key: "otherRank", label: "अन्य / दर्ज नहीं", color: "var(--bar-muted)" },
];

// Same colours as the register-composition bar on the overview: an origin keeps its colour everywhere.
const ORIGIN_SERIES = [
  { key: "district", label: "बीजापुर जिला", color: "var(--chart-cat-1)" },
  { key: "otherDistrict", label: "दीगर जिला", color: "var(--chart-cat-2)" },
  { key: "otherState", label: "दीगर राज्य", color: "var(--chart-cat-3)" },
  { key: "unclassified", label: "अवर्गीकृत", color: "var(--bar-muted)" },
];

export default function SurrenderTab({ params, update }: SurrenderTabProps) {
  const subDivision = params.get("sd") ?? "";
  const thana = params.get("thana") ?? "";
  const { data, loading, error } = useStatsQuery(`${subDivision}|${thana}`, () =>
    getSurrenders({ subDivision: subDivision || undefined, thana: thana || undefined }),
  );

  const { dated, undated } = withYearGaps(data?.years ?? []);
  const label = (y: SurrenderYearRow) => y.year ?? UNDATED;

  const columns = (keys: readonly string[]) =>
    dated.map((y) => ({ key: y.year ?? "", label: y.year ?? "", values: Object.fromEntries(keys.map((k) => [k, y[k as keyof SurrenderYearRow] as number])) }));

  // Cumulative over dated years only: the undated group has no place on a time axis, and is
  // reported beside the chart so the line is never mistaken for the whole register.
  const cumulative = dated.map((y, i) => ({
    label: y.year ?? "",
    value: dated.slice(0, i + 1).reduce((sum, d) => sum + d.total, 0),
  }));

  const rows = undated ? [...dated, undated] : dated;
  const pct = (part: number, whole: number) => (whole === 0 ? 0 : Math.round((part / whole) * 100));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-6)" }}>
      <div className="filter-row">
        <RegionFilters params={params} update={update} />
        <span className="t-caption">समर्पित रजिस्टर — वर्तमान स्थिति</span>
      </div>

      {data === null && (
        <p className="t-caption" style={{ color: error ? "var(--rose)" : undefined }}>
          {error ? "आंकड़े लोड नहीं हो सके।" : "लोड हो रहा है..."}
        </p>
      )}
      {error && data !== null && <p className="t-caption" style={{ color: "var(--rose)" }}>ताज़ा आंकड़े लोड नहीं हो सके — पिछले आंकड़े दिख रहे हैं।</p>}

      {data !== null && (
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-6)", opacity: loading ? 0.55 : 1, transition: "opacity 0.2s var(--ease)" }}>
          <ChartCard
            title="वर्ष-वार समर्पण"
            sub="समर्पण वर्ष के अनुसार कैडर, मूल स्थान के हिसाब से"
            aside={
              <div style={{ display: "flex", gap: "var(--space-5)" }}>
                <Figure label="कुल समर्पित" value={formatCount(data.total)} />
                {undated && <Figure label={UNDATED} value={formatCount(undated.total)} />}
              </div>
            }
            chart={<StackedColumns ariaLabel="वर्ष और मूल स्थान के अनुसार समर्पण" unit="कैडर" series={ORIGIN_SERIES} categories={columns(ORIGIN_SERIES.map((s) => s.key))} />}
            table={<ChartTable caption="वर्ष-वार समर्पण" headers={["वर्ष", "बीजापुर जिला", "दीगर जिला", "दीगर राज्य", "अवर्गीकृत", "कुल"]} rows={rows.map((y) => [label(y), y.district, y.otherDistrict, y.otherState, y.unclassified, y.total])} />}
          />

          <ChartCard
            title="संचयी समर्पण"
            sub="हर वर्ष के अंत तक कुल कितने कैडर समर्पित हो चुके थे"
            aside={undated ? <span className="t-caption tabular-nums">{formatCount(undated.total)} कैडर का वर्ष दर्ज नहीं — रेखा में शामिल नहीं</span> : undefined}
            chart={<LineChart points={cumulative} ariaLabel="संचयी समर्पण" color="var(--chart-cat-1)" unit="कैडर" />}
            table={<ChartTable caption="संचयी समर्पण" headers={["वर्ष", "उस वर्ष", "संचयी"]} rows={dated.map((y, i) => [y.year ?? "", y.total, cumulative[i]?.value ?? 0])} />}
          />

          <ChartCard
            title="वर्ष-वार समर्पण — रैंक के अनुसार"
            sub="DVCM / ACM / PM"
            chart={<StackedColumns ariaLabel="वर्ष और रैंक के अनुसार समर्पण" unit="कैडर" series={RANK_SERIES} categories={columns(RANK_SERIES.map((s) => s.key))} />}
            table={<ChartTable caption="वर्ष और रैंक के अनुसार समर्पण" headers={["वर्ष", "DVCM", "ACM", "PM", "अन्य / दर्ज नहीं"]} rows={rows.map((y) => [label(y), y.DVCM, y.ACM, y.PM, y.otherRank])} />}
          />

          <div className="dash-card">
            <h3 className="t-h4">समर्पण वर्ष के अनुसार वर्तमान स्थिति</h3>
            <p className="t-caption" style={{ marginTop: 2, marginBottom: "var(--space-5)" }}>
              सक्रिय = जिन पर कोई स्थायी चिह्न नहीं। ताज़ा रिपोर्ट = सक्रिय कैडरों में से जिनकी रिपोर्ट पिछले 30 दिन में दर्ज हुई।
            </p>
            <ChartTable
              caption="समर्पण वर्ष के अनुसार वर्तमान स्थिति"
              headers={["वर्ष", "कुल", "सक्रिय", "ताज़ा रिपोर्ट", "ताज़ा रिपोर्ट %", "फौत", "अप्राप्य", "अन्य छूट"]}
              rows={rows.map((y) => [label(y), y.total, y.active, y.activeRecent, pct(y.activeRecent, y.active), y.deceased, y.untraceable, y.otherExempt])}
            />
          </div>
        </div>
      )}
    </div>
  );
}

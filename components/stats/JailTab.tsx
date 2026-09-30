"use client";

import StatCard from "@/components/dashboard/StatCard";
import { listCadres, type ListCadresParams } from "@/lib/api";
import ChartCard from "./ChartCard";
import ChartTable from "./ChartTable";
import CountBars, { type CountRow } from "./CountBars";
import RegionFilters from "./RegionFilters";
import StackedBar from "./StackedBar";
import { formatCount, type ParamReader, type UpdateParams } from "./chartUtils";
import { useStatsQuery, useThanaOptions } from "./hooks";

interface JailTabProps {
  params: ParamReader;
  update: UpdateParams;
}

type Stage = NonNullable<ListCadresParams["caseStage"]>[number];

const CUSTODY: { key: Stage; label: string }[] = [
  { key: "in_jail", label: "जेल में निरुद्ध" },
  { key: "on_bail", label: "जमानत पर" },
];
const PROGRESS: { key: Stage; label: string }[] = [
  { key: "under_investigation", label: "विवेचनाधीन" },
  { key: "under_trial", label: "विचाराधीन" },
  { key: "concluded", label: "निर्णीत (विवेचना व विचारण पूर्ण)" },
];

interface JailCounts {
  total: number;
  firYes: number;
  firNo: number;
  stage: Record<Stage, number>;
  uapa: number;
  harm: number;
  both: number;
}

const share = (n: number, total: number) => (total === 0 ? 0 : Math.round((n / total) * 100));
const tableRows = (rows: CountRow[], total: number): (string | number)[][] => rows.map((r) => [r.label, r.count, share(r.count, total)]);

// Every number here is the exact `total` the server returns for a one-row page of
// GET /cadres with the matching filter -- a count of PEOPLE in the जेल/जमानत register,
// never a tally of a fetched page. (Cases-per-person and court/crime-thana breakdowns
// would need a backend aggregate, so they are not drawn.)
async function loadJail(thana: string[] | undefined): Promise<JailCounts> {
  const count = (extra: Partial<ListCadresParams>) =>
    listCadres({ category: ["jail"], thana, pageSize: 1, ...extra }).then((r) => r.total);
  const stages = [...CUSTODY, ...PROGRESS].map((s) => s.key);
  const [total, firYes, firNo, uapa, harm, both, ...perStage] = await Promise.all([
    count({}),
    count({ hasFir: "yes" }),
    count({ hasFir: "no" }),
    count({ uapaApplied: true }),
    count({ publicHarm: true }),
    count({ uapaApplied: true, publicHarm: true }),
    ...stages.map((s) => count({ caseStage: [s] })),
  ]);
  const stage = Object.fromEntries(stages.map((s, i) => [s, perStage[i] ?? 0])) as Record<Stage, number>;
  return { total, firYes, firNo, stage, uapa, harm, both };
}

export default function JailTab({ params, update }: JailTabProps) {
  const subDivision = params.get("sd") ?? "";
  const thana = params.get("thana") ?? "";
  const { rows: thanaRows } = useThanaOptions();

  // GET /cadres has a thana filter but no sub-division one, so a sub-division becomes the
  // list of its thanas (from the backend's own scoped thana list -- no local copy of the
  // jurisdiction table). The cadre's thana here is their RESIDENCE thana.
  const thanas = thana ? [thana] : subDivision ? thanaRows.filter((r) => r.subDivision === subDivision).map((r) => r.thana) : undefined;
  const ready = !subDivision || thana !== "" || thanaRows.length > 0;

  const { data, loading, error } = useStatsQuery(`${(thanas ?? []).join(",")}`, () => loadJail(thanas), ready);
  const d = data;
  const total = d?.total ?? 0;

  const custody: CountRow[] = d ? CUSTODY.map((s) => ({ key: s.key, label: s.label, count: d.stage[s.key] })) : [];
  const progress: CountRow[] = d ? PROGRESS.map((s) => ({ key: s.key, label: s.label, count: d.stage[s.key] })) : [];
  const severity: CountRow[] = d
    ? [
        { key: "uapa", label: "यूएपीए लगा है", count: d.uapa },
        { key: "harm", label: "जनहानि हुई", count: d.harm },
        { key: "both", label: "दोनों", count: d.both },
      ]
    : [];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-6)" }}>
      <div className="filter-row">
        <RegionFilters params={params} update={update} />
        <span className="t-caption">वर्तमान स्थिति — थाना = व्यक्ति का निवास थाना</span>
      </div>

      {d === null && (
        <p className="t-caption" style={{ color: error ? "var(--rose)" : undefined }}>
          {error ? "आंकड़े लोड नहीं हो सके।" : "लोड हो रहा है..."}
        </p>
      )}
      {error && d !== null && <p className="t-caption" style={{ color: "var(--rose)" }}>ताज़ा आंकड़े लोड नहीं हो सके — पिछले आंकड़े दिख रहे हैं।</p>}

      {d !== null && (
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-6)", opacity: loading ? 0.55 : 1, transition: "opacity 0.2s var(--ease)" }}>
          <div className="stat-grid-3">
            <StatCard label="जेल/जमानत रजिस्टर (व्यक्ति)" value={formatCount(d.total)} color="accent" icon="cadres" href="/records" />
            <StatCard label="यूएपीए लगा" value={formatCount(d.uapa)} color="danger" icon="alerts" />
            <StatCard label="जनहानि वाले मामलों में शामिल" value={formatCount(d.harm)} color="orange" icon="alerts" />
          </div>

          <p className="t-caption">
            एक व्यक्ति के एक से अधिक मामले हो सकते हैं और अलग-अलग चरणों में हो सकते हैं — इसलिए नीचे के चरणों का योग कुल से अधिक हो सकता है। हर संख्या &ldquo;कम से कम एक मामला इस चरण में&rdquo; वाले व्यक्तियों की है।
          </p>

          <div className="profile-grid">
            <ChartCard
              title="अपराध क्रमांक (FIR)"
              sub="कम से कम एक मामले में अपराध क्रमांक दर्ज है या नहीं"
              chart={
                <StackedBar
                  ariaLabel="अपराध क्रमांक दर्ज / दर्ज नहीं"
                  segments={[
                    { key: "yes", label: "अपराध क्रमांक दर्ज", value: d.firYes, color: "var(--chart-cat-1)", ink: "dark" },
                    { key: "no", label: "दर्ज नहीं", value: d.firNo, color: "var(--bar-muted)", ink: "dark" },
                  ]}
                />
              }
              table={<ChartTable caption="अपराध क्रमांक" headers={["स्थिति", "व्यक्ति", "%"]} rows={[["अपराध क्रमांक दर्ज", d.firYes, share(d.firYes, total)], ["दर्ज नहीं", d.firNo, share(d.firNo, total)]]} />}
            />

            <ChartCard
              title="गंभीरता"
              sub="यूएपीए और जनहानि (कम से कम एक मामले में)"
              chart={<CountBars rows={severity} total={total} ariaLabel="यूएपीए और जनहानि वाले व्यक्ति" color="var(--chart-cat-3)" />}
              table={<ChartTable caption="गंभीरता" headers={["श्रेणी", "व्यक्ति", "%"]} rows={tableRows(severity, total)} />}
            />

            <ChartCard
              title="हिरासत की स्थिति"
              sub="जेल में निरुद्ध / जमानत पर"
              chart={<CountBars rows={custody} total={total} ariaLabel="हिरासत की स्थिति के अनुसार व्यक्ति" />}
              table={<ChartTable caption="हिरासत की स्थिति" headers={["स्थिति", "व्यक्ति", "%"]} rows={tableRows(custody, total)} />}
            />

            <ChartCard
              title="मामले की प्रगति"
              sub="विवेचना → विचारण → निर्णय"
              chart={<CountBars rows={progress} total={total} ariaLabel="मामले की प्रगति के अनुसार व्यक्ति" color="var(--chart-cat-2)" />}
              table={<ChartTable caption="मामले की प्रगति" headers={["चरण", "व्यक्ति", "%"]} rows={tableRows(progress, total)} />}
            />
          </div>
        </div>
      )}
    </div>
  );
}

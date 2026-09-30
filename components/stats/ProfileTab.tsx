"use client";

import { getCadreProfile, type CadreProfileStats, type ProfileDistribution } from "@/lib/api";
import ChartCard from "./ChartCard";
import ChartTable from "./ChartTable";
import CountBars, { type CountRow } from "./CountBars";
import RankedBars, { type RankedRow } from "./RankedBars";
import RegionFilters from "./RegionFilters";
import StackedBar, { type StackedSegment } from "./StackedBar";
import StackedColumns from "./StackedColumns";
import { formatCount, type ParamReader, type UpdateParams } from "./chartUtils";
import { useStatsQuery } from "./hooks";

interface ProfileTabProps {
  params: ParamReader;
  update: UpdateParams;
}

const share = (n: number, total: number) => (total === 0 ? 0 : Math.round((n / total) * 100));

const distRows = (d: ProfileDistribution): CountRow[] => d.rows.map((r) => ({ key: r.label, label: r.label, count: r.count }));

// The table twin of a CountBars chart: every named value, the folded tail, and the blanks.
const distTable = (d: ProfileDistribution, total: number): (string | number)[][] => [
  ...d.rows.map((r) => [r.label, r.count, share(r.count, total)]),
  ...(d.other > 0 ? [["अन्य", d.other, share(d.other, total)]] : []),
  ...(d.unknown > 0 ? [["दर्ज नहीं", d.unknown, share(d.unknown, total)]] : []),
];

const fixedTable = (rows: CountRow[], unknown: number, total: number): (string | number)[][] => [
  ...rows.map((r) => [r.label, r.count, share(r.count, total)]),
  ...(unknown > 0 ? [["दर्ज नहीं", unknown, share(unknown, total)]] : []),
];

export default function ProfileTab({ params, update }: ProfileTabProps) {
  const category = params.get("cat") === "surrendered" ? "surrendered" : params.get("cat") === "thana" ? "thana" : undefined;
  const subDivision = params.get("sd") ?? "";
  const thana = params.get("thana") ?? "";

  const { data, loading, error } = useStatsQuery(`${category}|${subDivision}|${thana}`, () =>
    getCadreProfile({ category, subDivision: subDivision || undefined, thana: thana || undefined }),
  );

  const p: CadreProfileStats | null = data;
  const total = p?.total ?? 0;

  const covItems: { key: string; label: string; filled: number }[] = p
    ? [
        { key: "dob", label: "जन्म तिथि", filled: p.coverage.dateOfBirth },
        { key: "gender", label: "लिंग", filled: p.coverage.gender },
        { key: "caste", label: "जाति", filled: p.coverage.caste },
        { key: "district", label: "गृह ज़िला", filled: p.coverage.district },
        { key: "post", label: "पद (Post)", filled: p.coverage.post },
        { key: "rank", label: "रैंक वर्ग (DVCM/ACM/PM)", filled: p.coverage.rankClass },
        { key: "grade", label: "श्रेणी (A/B/C)", filled: p.coverage.grade },
        { key: "photo", label: "फ़ोटो", filled: p.coverage.photo },
      ]
    : [];
  // 0 cadres is not 0% filled (nor 100%): nothing to measure, so the bar stays empty.
  const coverage: RankedRow[] = covItems.map((c) => ({
    key: c.key,
    label: c.label,
    pct: total === 0 ? null : share(c.filled, total),
    detail: `${formatCount(c.filled)} / ${formatCount(total)}`,
  }));

  const gender: StackedSegment[] = p
    ? [
        { key: "male", label: "पुरुष", value: p.gender.male, color: "var(--chart-cat-1)", ink: "dark" },
        { key: "female", label: "महिला", value: p.gender.female, color: "var(--chart-cat-3)", ink: "dark" },
        { key: "unknown", label: "दर्ज नहीं", value: p.gender.unknown, color: "var(--bar-muted)", ink: "dark" },
      ]
    : [];

  const grade: CountRow[] = p
    ? [
        { key: "A", label: "श्रेणी A", count: p.grade.A },
        { key: "B", label: "श्रेणी B", count: p.grade.B },
        { key: "C", label: "श्रेणी C", count: p.grade.C },
        { key: "jail", label: "जेल", count: p.grade.jail },
        { key: "death", label: "मृत्यु", count: p.grade.death },
      ]
    : [];
  const rank: CountRow[] = p
    ? [
        { key: "DVCM", label: "DVCM", count: p.rankClass.DVCM },
        { key: "ACM", label: "ACM", count: p.rankClass.ACM },
        { key: "PM", label: "PM", count: p.rankClass.PM },
      ]
    : [];
  // Only the five permanent marks: "no mark" is not missing data, just the rest of the register.
  const permanent: CountRow[] = p
    ? [
        { key: "deceased", label: "फौत", count: p.permanentStatus.deceased },
        { key: "government_job", label: "शासकीय नौकरी", count: p.permanentStatus.government_job },
        { key: "gs", label: "GS", count: p.permanentStatus.gs },
        { key: "living_elsewhere", label: "अन्य जिले में निवासरत", count: p.permanentStatus.living_elsewhere },
        { key: "untraceable", label: "अप्राप्य", count: p.permanentStatus.untraceable },
      ]
    : [];

  const distCard = (title: string, sub: string, d: ProfileDistribution, aria: string) =>
    p && (
      <ChartCard
        title={title}
        sub={sub}
        chart={<CountBars rows={distRows(d)} other={d.other} unknown={d.unknown} total={total} ariaLabel={aria} />}
        table={<ChartTable caption={aria} headers={[title, "कैडर", "%"]} rows={distTable(d, total)} />}
      />
    );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-6)" }}>
      <div className="filter-row">
        <select
          className="input"
          aria-label="रजिस्टर"
          value={category ?? ""}
          onChange={(e) => update({ cat: e.target.value || undefined })}
          style={{ height: 38, width: 150 }}
        >
          <option value="">सभी रजिस्टर</option>
          <option value="surrendered">समर्पित</option>
          <option value="thana">थाना</option>
        </select>
        <RegionFilters params={params} update={update} />
        <span className="t-caption">वर्तमान स्थिति — जेल/जमानत रजिस्टर शामिल नहीं</span>
      </div>

      {p === null && (
        <p className="t-caption" style={{ color: error ? "var(--rose)" : undefined }}>
          {error ? "आंकड़े लोड नहीं हो सके।" : "लोड हो रहा है..."}
        </p>
      )}
      {error && p !== null && <p className="t-caption" style={{ color: "var(--rose)" }}>ताज़ा आंकड़े लोड नहीं हो सके — पिछले आंकड़े दिख रहे हैं।</p>}

      {p !== null && (
        <div className="profile-grid" style={{ opacity: loading ? 0.55 : 1, transition: "opacity 0.2s var(--ease)" }}>
          <ChartCard
            title="डेटा भरने की दर"
            sub={`${formatCount(total)} कैडर में से कितनों के लिए यह जानकारी दर्ज है`}
            chart={<RankedBars rows={coverage} ariaLabel="डेटा भरने की दर" />}
            table={<ChartTable caption="डेटा भरने की दर" headers={["जानकारी", "दर्ज", "कुल", "%"]} rows={covItems.map((c) => [c.label, c.filled, total, share(c.filled, total)])} />}
          />

          <ChartCard
            title="लिंग"
            sub="पुरुष / महिला"
            chart={<StackedBar segments={gender} ariaLabel="लिंग का अनुपात" />}
            table={<ChartTable caption="लिंग" headers={["लिंग", "कैडर", "%"]} rows={gender.map((g) => [g.label, g.value, share(g.value, total)])} />}
          />

          <div style={{ gridColumn: "1 / -1" }}>
            <ChartCard
              title="आयु वर्ग और लिंग"
              sub="जन्म तिथि से निकाली गई आयु"
              aside={p.age.noDob > 0 ? <span className="t-caption tabular-nums">जन्म तिथि दर्ज नहीं: {formatCount(p.age.noDob)}</span> : undefined}
              chart={
                <StackedColumns
                  ariaLabel="आयु वर्ग और लिंग के अनुसार कैडर"
                  unit="कैडर"
                  series={[
                    { key: "male", label: "पुरुष", color: "var(--chart-cat-1)" },
                    { key: "female", label: "महिला", color: "var(--chart-cat-3)" },
                    { key: "unknownGender", label: "लिंग दर्ज नहीं", color: "var(--bar-muted)" },
                  ]}
                  categories={p.age.bands.map((b) => ({ key: b.band, label: b.band, values: { male: b.male, female: b.female, unknownGender: b.unknownGender } }))}
                />
              }
              table={<ChartTable caption="आयु वर्ग और लिंग" headers={["आयु वर्ग", "पुरुष", "महिला", "लिंग दर्ज नहीं"]} rows={p.age.bands.map((b) => [b.band, b.male, b.female, b.unknownGender])} />}
            />
          </div>

          {distCard("जाति", "सबसे अधिक 10 जातियां", p.caste, "जाति के अनुसार कैडर")}
          {distCard("पद / रैंक (Designation)", "सबसे अधिक 10 पद", p.designation, "पद के अनुसार कैडर")}
          {distCard("पद (Post)", "जिला रजिस्टर का Post कॉलम — सबसे अधिक 10", p.post, "Post के अनुसार कैडर")}
          {distCard("गृह ज़िला", "सबसे अधिक 10 ज़िले", p.district, "गृह ज़िले के अनुसार कैडर")}

          <ChartCard
            title="रैंक वर्ग"
            sub="DVCM / ACM / PM"
            chart={<CountBars rows={rank} unknown={p.rankClass.unset} total={total} ariaLabel="रैंक वर्ग के अनुसार कैडर" />}
            table={<ChartTable caption="रैंक वर्ग" headers={["रैंक वर्ग", "कैडर", "%"]} rows={fixedTable(rank, p.rankClass.unset, total)} />}
          />
          <ChartCard
            title="श्रेणी (प्राथमिकता)"
            sub="A > B > C — रिपोर्टिंग की अवधि तय करती है"
            chart={<CountBars rows={grade} unknown={p.grade.unset} total={total} ariaLabel="श्रेणी के अनुसार कैडर" />}
            table={<ChartTable caption="श्रेणी" headers={["श्रेणी", "कैडर", "%"]} rows={fixedTable(grade, p.grade.unset, total)} />}
          />
          <ChartCard
            title="स्थायी चिह्न"
            sub="इन कैडरों की रिपोर्टिंग आवश्यक नहीं"
            chart={<CountBars rows={permanent} total={total} ariaLabel="स्थायी चिह्न के अनुसार कैडर" />}
            table={<ChartTable caption="स्थायी चिह्न" headers={["स्थायी चिह्न", "कैडर", "%"]} rows={fixedTable(permanent, 0, total)} />}
          />
        </div>
      )}
    </div>
  );
}

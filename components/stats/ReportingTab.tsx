"use client";

import { getReportsDaily, type ReportsDailyStats } from "@/lib/api";
import ChartCard from "./ChartCard";
import ChartTable from "./ChartTable";
import DailyBarChart from "./DailyBarChart";
import DateRangeBar, { MAX_RANGE_DAYS } from "./DateRangeBar";
import Figure from "./Figure";
import RegionFilters from "./RegionFilters";
import {
  dayKeyOr,
  daysInclusive,
  formatAvg,
  formatCount,
  formatDayLong,
  shiftDay,
  todayIst,
  weekdayOf,
  type ParamReader,
  type UpdateParams,
} from "./chartUtils";
import { useStatsQuery } from "./hooks";

interface ReportingTabProps {
  params: ParamReader;
  update: UpdateParams;
}

export default function ReportingTab({ params, update }: ReportingTabProps) {
  // The URL is untrusted input: anything malformed, reversed or over the cap falls back
  // to a valid window instead of surfacing as a 400 from the API.
  const to = dayKeyOr(params.get("to"), todayIst());
  const rawFrom = dayKeyOr(params.get("from"), shiftDay(to, -29));
  const from =
    rawFrom > to || daysInclusive(rawFrom, to) > MAX_RANGE_DAYS ? shiftDay(to, -29) : rawFrom;
  const subDivision = params.get("sd") ?? "";
  const thana = params.get("thana") ?? "";

  const { data, loading, error } = useStatsQuery(`${from}|${to}|${subDivision}|${thana}`, () =>
    getReportsDaily({ from, to, subDivision: subDivision || undefined, thana: thana || undefined }),
  );

  const days = data?.days ?? [];
  const dayCount = days.length;
  const sumUnique = days.reduce((s, d) => s + d.uniqueCadres, 0);

  const message = error
    ? "आंकड़े लोड नहीं हो सके।"
    : data === null
      ? "लोड हो रहा है..."
      : data.totals.reports === 0
        ? "इस अवधि में कोई रिपोर्ट नहीं"
        : null;

  const tableRows = (pick: (d: ReportsDailyStats["days"][number]) => number) =>
    days.map((d) => [formatDayLong(d.date), weekdayOf(d.date), pick(d)]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-6)" }}>
      <div className="filter-row">
        <DateRangeBar from={from} to={to} onChange={(f, t) => update({ from: f, to: t })} />
        <RegionFilters params={params} update={update} />
      </div>

      <ChartCard
        title="दैनिक रिपोर्टिंग"
        sub="हर दिन कुल कितनी रिपोर्ट दर्ज हुईं (जेल/जमानत को छोड़कर)"
        aside={
          <div style={{ display: "flex", gap: "var(--space-5)" }}>
            <Figure label="कुल रिपोर्ट" value={data ? formatCount(data.totals.reports) : "—"} />
            <Figure label="दैनिक औसत" value={data && dayCount > 0 ? formatAvg(data.totals.reports / dayCount) : "—"} />
          </div>
        }
        chart={
          <DailyBarChart
            label="दैनिक रिपोर्टों की संख्या"
            points={days.map((d) => ({ date: d.date, value: d.reports }))}
            color="var(--chart-cat-1)"
            unit="रिपोर्ट"
            loading={loading && data !== null}
            message={message}
          />
        }
        table={<ChartTable caption="दैनिक रिपोर्टों की संख्या" headers={["तारीख", "वार", "रिपोर्ट"]} rows={tableRows((d) => d.reports)} />}
      />

      <ChartCard
        title="अद्वितीय कैडर की रिपोर्टिंग"
        sub="हर दिन कितने अलग-अलग कैडरों की रिपोर्ट दर्ज हुई — एक कैडर की कई रिपोर्ट एक ही गिनी जाती है"
        aside={
          <div style={{ display: "flex", gap: "var(--space-5)" }}>
            <Figure label="अवधि में अलग कैडर" value={data ? formatCount(data.totals.uniqueCadres) : "—"} />
            <Figure label="प्रतिदिन औसत" value={data && dayCount > 0 ? formatAvg(sumUnique / dayCount) : "—"} />
          </div>
        }
        chart={
          <DailyBarChart
            label="प्रतिदिन अलग-अलग कैडरों की संख्या"
            points={days.map((d) => ({ date: d.date, value: d.uniqueCadres }))}
            color="var(--chart-cat-2)"
            unit="कैडर"
            loading={loading && data !== null}
            message={message}
          />
        }
        table={<ChartTable caption="प्रतिदिन अलग-अलग कैडरों की संख्या" headers={["तारीख", "वार", "अलग कैडर"]} rows={tableRows((d) => d.uniqueCadres)} />}
      />

      <p className="t-caption">
        &ldquo;अवधि में अलग कैडर&rdquo; पूरी अवधि की अलग गिनती है — रोज़ के आंकड़ों का जोड़ नहीं, क्योंकि अलग-अलग दिन रिपोर्ट हुआ कैडर एक ही कैडर है।
      </p>
    </div>
  );
}

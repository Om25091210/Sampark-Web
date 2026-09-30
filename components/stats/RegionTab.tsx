"use client";

import { useEffect, useState } from "react";
import {
  getHierarchyStats,
  getRecencyByThana,
  getThanaHierarchyStats,
  type HierarchyStats,
  type HierarchyThanaStats,
  type RecencyByThanaRow,
} from "@/lib/api";
import ChartCard from "./ChartCard";
import ChartTable from "./ChartTable";
import RankedBars, { type RankedRow } from "./RankedBars";
import RecencyRows from "./RecencyRows";
import ScatterChart from "./ScatterChart";
import ThanaTiles from "./ThanaTiles";
import type { ParamReader, UpdateParams } from "./chartUtils";

interface RegionTabProps {
  params: ParamReader;
  update: UpdateParams;
}

// Nothing to measure sorts last whichever way the rest is ordered.
function rank(rows: RankedRow[], order: "worst" | "best"): RankedRow[] {
  return [...rows].sort((a, b) => {
    if (a.pct === null && b.pct === null) return a.label.localeCompare(b.label, "hi");
    if (a.pct === null) return 1;
    if (b.pct === null) return -1;
    return order === "worst" ? a.pct - b.pct : b.pct - a.pct;
  });
}

export default function RegionTab({ params, update }: RegionTabProps) {
  const [thanas, setThanas] = useState<HierarchyThanaStats | null>(null);
  const [hierarchy, setHierarchy] = useState<HierarchyStats | null>(null);
  const [officers, setOfficers] = useState<HierarchyStats | null>(null);
  const [recency, setRecency] = useState<RecencyByThanaRow[] | null>(null);
  const [thanaError, setThanaError] = useState(false);
  const [hierarchyError, setHierarchyError] = useState(false);
  const [officerError, setOfficerError] = useState(false);
  const [recencyError, setRecencyError] = useState(false);

  useEffect(() => {
    getThanaHierarchyStats()
      .then(setThanas)
      .catch(() => setThanaError(true));
    getHierarchyStats()
      .then(setHierarchy)
      .catch(() => setHierarchyError(true));
    // Officer-level rows: HQ's default response is one row per SDOP, so ask for officers.
    getHierarchyStats("officer")
      .then(setOfficers)
      .catch(() => setOfficerError(true));
    getRecencyByThana()
      .then((r) => setRecency(r.rows))
      .catch(() => setRecencyError(true));
  }, []);

  const subDivision = params.get("sd") ?? "";
  const order = params.get("sort") === "best" ? "best" : "worst";
  const subDivisions = [...new Set((thanas?.rows ?? []).map((r) => r.subDivision).filter((s): s is string => s !== null))];
  const thanaRows = (thanas?.rows ?? []).filter((r) => !subDivision || r.subDivision === subDivision);

  const thanaRanked = rank(
    thanaRows.map((r) => ({
      key: r.thana,
      label: r.thana,
      caption: r.subDivision ?? undefined,
      pct: r.assignedCadres === 0 ? null : r.reportingCompletion,
      detail: `${r.currentCadres} / ${r.assignedCadres} कैडर`,
    })),
    order,
  );

  // An SDOP (admin) caller gets their own officers back; HQ gets one row per SDOP.
  const officerLevel = hierarchy?.level === "officers";
  const ownerRows = (hierarchy?.rows ?? []).filter((r) => officerLevel || !subDivision || r.subDivision === subDivision);
  const ownerRanked = rank(
    ownerRows.map((r) => ({
      key: String(r.id),
      label: r.name,
      caption: (r.thana ?? r.subDivision) ?? undefined,
      pct: r.assignedCadres === 0 ? null : r.reportingCompletion,
      detail: `${r.currentCadres} / ${r.assignedCadres} कैडर`,
    })),
    order,
  );
  const ownerHeading = officerLevel ? "अधिकारी" : "SDOP";

  // Officer scatter. An officer's row carries its own thana, not a sub-division, so the
  // sub-division filter goes through the thana list the tiles already use. An officer with
  // no assigned cadres has nothing to measure (0 assigned is not 0% or 100%) and is left off.
  const subDivisionOfThana = new Map((thanas?.rows ?? []).map((r) => [r.thana, r.subDivision] as const));
  const officerRows = (officers?.rows ?? []).filter((r) => !subDivision || (r.thana !== null && subDivisionOfThana.get(r.thana) === subDivision));
  const scatterRows = officerRows.filter((r) => r.assignedCadres > 0);
  const scatterAssigned = scatterRows.reduce((s, r) => s + r.assignedCadres, 0);
  const scatterCurrent = scatterRows.reduce((s, r) => s + r.currentCadres, 0);
  const scatterOverall = scatterAssigned === 0 ? 0 : Math.round((scatterCurrent / scatterAssigned) * 100);

  // Thana x recency: highest share in the two worst tiers first (or last). A thana with no
  // cadres has no share to rank and always goes to the bottom.
  const risk = (r: RecencyByThanaRow) => (r.total === 0 ? -1 : (r.overdue2m + r.overdue3m) / r.total);
  const recencyRows = (recency ?? [])
    .filter((r) => !subDivision || r.subDivision === subDivision)
    .sort((a, b) => {
      if (a.total === 0 || b.total === 0) return a.total === 0 ? (b.total === 0 ? 0 : 1) : -1;
      return order === "worst" ? risk(b) - risk(a) || b.total - a.total : risk(a) - risk(b) || b.total - a.total;
    });

  const loadingOrError = (error: boolean) => (
    <p className="t-caption" style={{ color: error ? "var(--rose)" : undefined }}>
      {error ? "आंकड़े लोड नहीं हो सके।" : "लोड हो रहा है..."}
    </p>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-6)" }}>
      <div className="filter-row">
        <select
          className="input"
          aria-label="सब-डिवीज़न"
          value={subDivision}
          onChange={(e) => update({ sd: e.target.value || undefined })}
          style={{ height: 38, width: 170 }}
        >
          <option value="">सभी सब-डिवीज़न</option>
          {subDivisions.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <div className="seg-tabs" role="group" aria-label="क्रम" style={{ flex: "0 0 auto" }}>
          <button type="button" className="seg-tab" data-active={order === "worst"} onClick={() => update({ sort: undefined })}>
            सबसे पीछे पहले
          </button>
          <button type="button" className="seg-tab" data-active={order === "best"} onClick={() => update({ sort: "best" })}>
            सबसे आगे पहले
          </button>
        </div>
        <span className="t-caption">वर्तमान स्थिति — तारीख फ़िल्टर लागू नहीं</span>
      </div>

      <div className="dash-card">
        <h3 className="t-h4">थाना-वार पूर्णता (सब-डिवीज़न के अनुसार)</h3>
        <p className="t-caption" style={{ marginTop: 2, marginBottom: "var(--space-5)" }}>
          हर थाना एक खाना है; गहरा रंग = अधिक पूर्णता
        </p>
        {thanas ? <ThanaTiles rows={thanaRows} /> : loadingOrError(thanaError)}
      </div>

      <ChartCard
        title="थाना पूर्णता दर"
        sub="थाने के वे कैडर जिन पर अब तक कम से कम एक रिपोर्ट दर्ज हुई — समय-सीमा नहीं (कवरेज)"
        chart={thanas ? <RankedBars rows={thanaRanked} ariaLabel="थाना-वार पूर्णता दर" /> : loadingOrError(thanaError)}
        table={<ChartTable caption="थाना-वार पूर्णता दर" headers={["थाना", "सब-डिवीज़न", "रिपोर्ट हो चुके", "कुल कैडर", "पूर्णता %"]} rows={thanaRows.map((r) => [r.thana, r.subDivision ?? "—", r.currentCadres, r.assignedCadres, r.reportingCompletion])} />}
      />

      <ChartCard
        title={`${ownerHeading} पूर्णता दर`}
        sub="नियत कैडरों में से जिनकी रिपोर्ट पिछले 30 दिन में दर्ज हुई (ताज़ा रिपोर्टिंग)"
        chart={hierarchy ? <RankedBars rows={ownerRanked} ariaLabel={`${ownerHeading}-वार पूर्णता दर`} /> : loadingOrError(hierarchyError)}
        table={<ChartTable caption={`${ownerHeading}-वार पूर्णता दर`} headers={[ownerHeading, "थाना / सब-डिवीज़न", "ताज़ा रिपोर्ट", "नियत कैडर", "पूर्णता %"]} rows={ownerRows.map((r) => [r.name, (r.thana ?? r.subDivision) ?? "—", r.currentCadres, r.assignedCadres, r.reportingCompletion])} />}
      />

      <ChartCard
        title="अधिकारी: नियत कैडर बनाम पूर्णता"
        sub="हर बिंदु एक अधिकारी — दाएं = अधिक कैडर, ऊपर = अधिक ताज़ा रिपोर्टिंग (पिछले 30 दिन)। रेखा के नीचे के बिंदु औसत से पीछे हैं।"
        chart={
          officers ? (
            <ScatterChart
              ariaLabel="अधिकारी: नियत कैडर बनाम पूर्णता"
              xTitle="नियत कैडर"
              yTitle="पूर्णता (%)"
              reference={{ value: scatterOverall, label: `समग्र ${scatterOverall}%` }}
              points={scatterRows.map((r) => ({ key: String(r.id), label: r.name, sub: r.thana ?? undefined, x: r.assignedCadres, y: r.reportingCompletion }))}
            />
          ) : (
            loadingOrError(officerError)
          )
        }
        table={<ChartTable caption="अधिकारी: नियत कैडर बनाम पूर्णता" headers={["अधिकारी", "थाना", "ताज़ा रिपोर्ट", "नियत कैडर", "पूर्णता %"]} rows={officerRows.map((r) => [r.name, r.thana ?? "—", r.currentCadres, r.assignedCadres, r.reportingCompletion])} />}
      />
      {officers && officerRows.length > scatterRows.length && (
        <p className="t-caption">{officerRows.length - scatterRows.length} अधिकारी जिनके पास कोई कैडर नियत नहीं है, चार्ट में शामिल नहीं — तालिका में दिख रहे हैं।</p>
      )}

      <ChartCard
        title="थाना-वार रिपोर्टिंग की स्थिति"
        sub="हर थाने के कैडर अंतिम रिपोर्ट के आधार पर चार स्तरों में — सामान्य से उच्च जोखिम तक"
        chart={recency ? <RecencyRows rows={recencyRows} ariaLabel="थाना-वार रिपोर्टिंग की स्थिति" /> : loadingOrError(recencyError)}
        table={<ChartTable caption="थाना-वार रिपोर्टिंग की स्थिति" headers={["थाना", "सब-डिवीज़न", "सामान्य", "सतर्क", "जोखिम", "उच्च जोखिम", "कुल"]} rows={recencyRows.map((r) => [r.thana, r.subDivision ?? "—", r.current, r.overdue1m, r.overdue2m, r.overdue3m, r.total])} />}
      />

      {hierarchy && (
        <p className="t-caption">
          समग्र पूर्णता {hierarchy.overallCompletion}% ({hierarchy.totalCurrent} / {hierarchy.totalAssigned} कैडर) · {hierarchy.unassignedCadres} कैडर किसी अधिकारी को नियत नहीं — इन्हें ऊपर के प्रतिशत में नहीं गिना गया।
        </p>
      )}
    </div>
  );
}

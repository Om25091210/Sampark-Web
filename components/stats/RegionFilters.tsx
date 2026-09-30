"use client";

import type { ParamReader, UpdateParams } from "./chartUtils";
import { useThanaOptions } from "./hooks";

interface RegionFiltersProps {
  params: ParamReader;
  update: UpdateParams;
}

// Sub-division + thana selects, state in the URL (?sd=&thana=). Rendered as bare controls
// so the caller keeps them in its single `.filter-row` above the charts they scope.
export default function RegionFilters({ params, update }: RegionFiltersProps) {
  const { rows, subDivisions } = useThanaOptions();
  const subDivision = params.get("sd") ?? "";
  const thana = params.get("thana") ?? "";
  const thanaOptions = rows.filter((r) => !subDivision || r.subDivision === subDivision);

  return (
    <>
      <select
        className="input"
        aria-label="सब-डिवीज़न"
        value={subDivision}
        onChange={(e) => update({ sd: e.target.value || undefined, thana: undefined })}
        style={{ height: 38, width: 170 }}
      >
        <option value="">सभी सब-डिवीज़न</option>
        {subDivisions.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>
      <select
        className="input"
        aria-label="थाना"
        value={thana}
        onChange={(e) => update({ thana: e.target.value || undefined })}
        style={{ height: 38, width: 170 }}
      >
        <option value="">सभी थाने</option>
        {thanaOptions.map((r) => (
          <option key={r.thana} value={r.thana}>
            {r.thana}
          </option>
        ))}
      </select>
    </>
  );
}

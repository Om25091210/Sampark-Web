"use client";

import { useMemo, useState } from "react";
import Topbar from "@/components/layout/Topbar";
import FilterPanel from "@/components/records/FilterPanel";
import ReportList from "@/components/records/ReportList";
import MiniCalendar from "@/components/records/MiniCalendar";
import {
  CADRES,
  EMPTY_FILTERS,
  applyFilter,
  type AlertLevel,
  type CadreCategory,
  type RecordFilters,
} from "@/lib/cadres";

export default function RecordsPage() {
  const [filters, setFilters] = useState<RecordFilters>(EMPTY_FILTERS);

  const filtered = useMemo(() => applyFilter(CADRES, filters), [filters]);

  const setSearch = (search: string) => setFilters((f) => ({ ...f, search }));
  const setAlertLevel = (alertLevel: AlertLevel | "all") =>
    setFilters((f) => ({ ...f, alertLevel }));

  const toggle = (group: "category" | "thana", value: string) =>
    setFilters((f) => {
      const list = f[group] as string[];
      const next = list.includes(value)
        ? list.filter((v) => v !== value)
        : [...list, value];
      return { ...f, [group]: next };
    });

  const clearRefinements = () =>
    setFilters((f) => ({ ...f, category: [], thana: [] }));

  return (
    <>
      <Topbar
        title="रिपोर्टिंग रिकॉर्ड"
        subtitle="सभी व्यक्तियों की रिपोर्टिंग जानकारी"
      />
      <div style={{ flex: 1, display: "flex", overflow: "hidden", minHeight: 0 }}>
        <FilterPanel
          filters={filters}
          onSearch={setSearch}
          onToggle={(group, value) => toggle(group, value as CadreCategory | string)}
          onClear={clearRefinements}
        />
        <ReportList
          cadres={filtered}
          total={CADRES.length}
          alertLevel={filters.alertLevel}
          onAlertLevel={setAlertLevel}
        />
        <MiniCalendar />
      </div>
    </>
  );
}

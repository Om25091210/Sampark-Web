"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import Topbar from "@/components/layout/Topbar";
import FilterPanel from "@/components/records/FilterPanel";
import ReportList from "@/components/records/ReportList";
import MiniCalendar from "@/components/records/MiniCalendar";
import { listCadres, getCadreFacets, type WireCadre } from "@/lib/api";
import {
  EMPTY_FILTERS,
  type AlertLevel,
  type CadreCategory,
  type RecordFilters,
} from "@/lib/cadres";

const PAGE_SIZE = 25;

export default function RecordsPage() {
  return (
    <Suspense fallback={null}>
      <RecordsPageInner />
    </Suspense>
  );
}

function RecordsPageInner() {
  // Dashboard tile drill-down (?alertLevel=critical / ?pendingReporting=true) --
  // read once on mount, never again, so the URL only seeds the initial view and
  // subsequent in-page filter changes don't fight over it.
  const searchParams = useSearchParams();
  const [filters, setFilters] = useState<RecordFilters>(() => {
    const alertLevel = searchParams.get("alertLevel");
    return {
      ...EMPTY_FILTERS,
      alertLevel: alertLevel === "critical" || alertLevel === "warning" || alertLevel === "normal" ? alertLevel : "all",
      pendingReporting: searchParams.get("pendingReporting") === "true",
    };
  });
  const [cadres, setCadres] = useState<WireCadre[]>([]);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [page, setPage] = useState(1);
  const [thanaOptions, setThanaOptions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Real distinct thana values (ADR-033) -- replaces the old hardcoded THANA_OPTIONS.
  useEffect(() => {
    getCadreFacets()
      .then((f) => setThanaOptions(f.thanas))
      .catch(() => setThanaOptions([]));
  }, []);

  // Refetch page 1 whenever a filter changes. Search is debounced; the
  // checkbox/select filters fire immediately.
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const delay = 300;
    debounceRef.current = setTimeout(() => {
      setLoading(true);
      listCadres({
        category: filters.category.length > 0 ? filters.category : undefined,
        alertLevel: filters.alertLevel !== "all" ? [filters.alertLevel] : undefined,
        thana: filters.thana.length > 0 ? filters.thana : undefined,
        pendingReporting: filters.pendingReporting || undefined,
        search: filters.search || undefined,
        page: 1,
        pageSize: PAGE_SIZE,
      })
        .then((res) => {
          setCadres(res.data);
          setTotal(res.total);
          setHasMore(res.hasMore);
          setPage(1);
        })
        .catch(() => {
          setCadres([]);
          setTotal(0);
          setHasMore(false);
        })
        .finally(() => setLoading(false));
    }, delay);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  function loadMore() {
    const nextPage = page + 1;
    setLoading(true);
    listCadres({
      category: filters.category.length > 0 ? filters.category : undefined,
      alertLevel: filters.alertLevel !== "all" ? [filters.alertLevel] : undefined,
      thana: filters.thana.length > 0 ? filters.thana : undefined,
      pendingReporting: filters.pendingReporting || undefined,
      search: filters.search || undefined,
      page: nextPage,
      pageSize: PAGE_SIZE,
    })
      .then((res) => {
        setCadres((prev) => [...prev, ...res.data]);
        setHasMore(res.hasMore);
        setPage(nextPage);
      })
      .finally(() => setLoading(false));
  }

  const setSearch = (search: string) => setFilters((f) => ({ ...f, search }));
  const setAlertLevel = (alertLevel: AlertLevel | "all") =>
    setFilters((f) => ({ ...f, alertLevel }));
  const setPendingReporting = (pendingReporting: boolean) =>
    setFilters((f) => ({ ...f, pendingReporting }));

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
          thanaOptions={thanaOptions}
          onSearch={setSearch}
          onToggle={(group, value) => toggle(group, value as CadreCategory | string)}
          onClear={clearRefinements}
        />
        <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
          <ReportList
            cadres={cadres}
            total={total}
            alertLevel={filters.alertLevel}
            onAlertLevel={setAlertLevel}
            pendingReporting={filters.pendingReporting}
            onPendingReporting={setPendingReporting}
          />
          {hasMore && (
            <div style={{ padding: "var(--space-4)", textAlign: "center" }}>
              <button className="btn btn--sm" onClick={loadMore} disabled={loading}>
                {loading ? "लोड हो रहा है..." : "और लोड करें"}
              </button>
            </div>
          )}
        </div>
        <MiniCalendar />
      </div>
    </>
  );
}

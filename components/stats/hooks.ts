"use client";

import { useEffect, useState } from "react";
import { getThanaHierarchyStats, type HierarchyThanaRow } from "@/lib/api";

interface QueryResult<T> {
  key: string;
  data: T | null;
  error: boolean;
}

export interface StatsQuery<T> {
  data: T | null;
  /** A request for the CURRENT key is in flight. Derived, never set in the effect. */
  loading: boolean;
  /** The request for the current key failed (the previous `data`, if any, is kept). */
  error: boolean;
}

/**
 * Fetch keyed on the whole filter slice. The previous result stays on screen while the next
 * one loads (the frame holds; callers just drop its opacity), and a stale response for an
 * older key is discarded. `key` MUST encode every input `fetcher` closes over -- it is the
 * effect's only dependency.
 */
export function useStatsQuery<T>(key: string, fetcher: () => Promise<T>): StatsQuery<T> {
  const [result, setResult] = useState<QueryResult<T> | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetcher()
      .then((data) => {
        if (!cancelled) setResult({ key, data, error: false });
      })
      .catch(() => {
        if (!cancelled) setResult((prev) => ({ key, data: prev?.data ?? null, error: true }));
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `key` encodes everything `fetcher` reads.
  }, [key]);

  const current = result !== null && result.key === key;
  return { data: result?.data ?? null, loading: !current, error: current && result.error };
}

/** Sub-division and thana options for the region filters, straight from the backend's own
 *  scoped thana list (so the web never carries a copy of the jurisdiction table). */
export function useThanaOptions(): { rows: HierarchyThanaRow[]; subDivisions: string[] } {
  const [rows, setRows] = useState<HierarchyThanaRow[]>([]);
  useEffect(() => {
    getThanaHierarchyStats()
      .then((r) => setRows(r.rows))
      // Options only: without them the selects just offer "all", and the charts still work.
      .catch(() => undefined);
  }, []);
  const subDivisions = [...new Set(rows.map((r) => r.subDivision).filter((s): s is string => s !== null))];
  return { rows, subDivisions };
}

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Topbar from "@/components/layout/Topbar";
import Container from "@/components/ui/Container";
import ApprovalItemCard, { type ApprovalItem } from "@/components/approvals/ApprovalItemCard";
import { listCadreChanges, listCadreCreateRequests, type WireCadreChange, type WireCadreCreateRequest } from "@/lib/api";

type TypeFilter = "all" | "change" | "create";
type StatusFilter = "pending" | "applied" | "rejected" | "cancelled" | "stale" | "all";

const TYPE_TABS: { value: TypeFilter; label: string }[] = [
  { value: "all", label: "सभी" },
  { value: "change", label: "परिवर्तन अनुरोध" },
  { value: "create", label: "नए कैडर अनुरोध" },
];

const STATUS_TABS: { value: StatusFilter; label: string }[] = [
  { value: "pending", label: "लंबित" },
  { value: "applied", label: "स्वीकृत" },
  { value: "rejected", label: "अस्वीकृत" },
  { value: "cancelled", label: "रद्द" },
  { value: "stale", label: "अप्रचलित" },
  { value: "all", label: "सभी स्थिति" },
];

const PAGE_SIZE = 20;

function FilterTabs<T extends string>({
  tabs,
  active,
  onChange,
}: {
  tabs: { value: T; label: string }[];
  active: T;
  onChange: (v: T) => void;
}) {
  return (
    <div style={{ display: "flex", gap: "var(--space-2)", flexWrap: "wrap" }}>
      {tabs.map((tab) => {
        const isActive = active === tab.value;
        return (
          <button
            key={tab.value}
            onClick={() => onChange(tab.value)}
            style={{
              display: "inline-flex",
              alignItems: "center",
              padding: "5px var(--space-3)",
              borderRadius: "var(--radius-full)",
              border: "1.5px solid",
              borderColor: isActive ? "var(--brand)" : "var(--border)",
              background: isActive ? "var(--brand-soft)" : "var(--surface)",
              color: isActive ? "var(--brand-strong)" : "var(--text-secondary)",
              fontSize: "0.8125rem",
              fontWeight: isActive ? 600 : 400,
              cursor: "pointer",
              transition: "var(--transition)",
            }}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}

export default function ApprovalsPage() {
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("pending");
  const [limit, setLimit] = useState(PAGE_SIZE);
  const [items, setItems] = useState<ApprovalItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // A monotonic id per fetch, not React state -- lets an in-flight request tell
  // whether it's still the latest one before writing its result. Without this,
  // clicking through several tabs quickly could let an earlier (slower) response
  // land AFTER a later one and clobber it back to stale data.
  const requestIdRef = useRef(0);

  // Takes the filter values explicitly rather than reading them off state, so
  // every caller (a tab click, "और लोड करें", or a card's approve/reject) always
  // fires a REAL fetch -- never gated on React noticing a value actually changed.
  // That equality-based gate was the bug: clicking a tab that was already active
  // left `loading` stuck true forever, because nothing re-ran to clear it.
  const runFetch = useCallback((type: TypeFilter, status: StatusFilter, lim: number) => {
    const id = ++requestIdRef.current;
    setLoading(true);
    const statusParam = status === "all" ? undefined : status;
    const wantChanges = type === "all" || type === "change";
    const wantCreates = type === "all" || type === "create";
    const empty = { data: [], total: 0, page: 1, pageSize: lim, hasMore: false };

    Promise.all([
      wantChanges
        ? listCadreChanges({ status: statusParam as WireCadreChange["status"] | undefined, page: 1, pageSize: lim })
        : Promise.resolve(empty),
      wantCreates
        ? listCadreCreateRequests({ status: statusParam as WireCadreCreateRequest["status"] | undefined, page: 1, pageSize: lim })
        : Promise.resolve(empty),
    ])
      .then(([changes, creates]) => {
        if (requestIdRef.current !== id) return; // superseded by a newer click
        const merged: ApprovalItem[] = [
          ...changes.data.map((data): ApprovalItem => ({ kind: "change", data })),
          ...creates.data.map((data): ApprovalItem => ({ kind: "create", data })),
        ].sort((a, b) => new Date(b.data.submittedAt).getTime() - new Date(a.data.submittedAt).getTime());
        setItems(merged);
        setTotal(changes.total + creates.total);
        setError(false);
      })
      .catch(() => {
        if (requestIdRef.current !== id) return;
        setError(true);
      })
      .finally(() => {
        if (requestIdRef.current !== id) return;
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    // Deferred a microtask so this initial fetch's setLoading(true) runs inside
    // a .then callback rather than synchronously in the effect body itself
    // (react-hooks/set-state-in-effect) -- `loading` already starts true, this
    // just kicks off the real network call.
    Promise.resolve().then(() => runFetch(typeFilter, statusFilter, limit));
    // Mount-only: every later refetch is triggered explicitly by a click handler
    // below, not by this effect reacting to filter state changing.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function selectType(v: TypeFilter) {
    setTypeFilter(v);
    setLimit(PAGE_SIZE);
    runFetch(v, statusFilter, PAGE_SIZE);
  }

  function selectStatus(v: StatusFilter) {
    setStatusFilter(v);
    setLimit(PAGE_SIZE);
    runFetch(typeFilter, v, PAGE_SIZE);
  }

  function loadMore() {
    const next = limit + PAGE_SIZE;
    setLimit(next);
    runFetch(typeFilter, statusFilter, next);
  }

  return (
    <>
      <Topbar title="स्वीकृति अनुरोध" subtitle="कैडर परिवर्तन एवं नए कैडर हेतु अनुमोदन श्रृंखला — पूर्ण विवरण" />
      <div style={{ paddingBlock: "var(--space-8)" }}>
        <Container>
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-6)" }}>
            <div className="dash-card" style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "var(--space-3)" }}>
                <FilterTabs tabs={TYPE_TABS} active={typeFilter} onChange={selectType} />
                <span className="badge badge--brand tabular-nums">{total} अनुरोध</span>
              </div>
              <FilterTabs tabs={STATUS_TABS} active={statusFilter} onChange={selectStatus} />
            </div>

            {error && (
              <div className="card" style={{ padding: "var(--space-4)", color: "var(--rose)" }}>
                अनुरोध लोड नहीं हो सके। कृपया पेज रीलोड करें।
              </div>
            )}
            {!error && loading && <p className="t-caption">लोड हो रहा है...</p>}
            {!error && !loading && items.length === 0 && (
              <div className="dash-card" style={{ textAlign: "center", color: "var(--text-tertiary)" }}>
                इस फ़िल्टर के लिए कोई अनुरोध नहीं मिला।
              </div>
            )}

            {!error && !loading && items.length > 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
                {items.map((item) => (
                  <ApprovalItemCard
                    key={`${item.kind}:${item.data.id}`}
                    item={item}
                    onChanged={() => runFetch(typeFilter, statusFilter, limit)}
                  />
                ))}
              </div>
            )}

            {!error && !loading && total > items.length && (
              <div style={{ textAlign: "center" }}>
                <button className="btn btn--sm" onClick={loadMore}>
                  और लोड करें
                </button>
              </div>
            )}
          </div>
        </Container>
      </div>
    </>
  );
}

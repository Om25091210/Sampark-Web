"use client";

import { useCallback, useEffect, useState } from "react";
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

  const load = useCallback(() => {
    const status = statusFilter === "all" ? undefined : statusFilter;
    const wantChanges = typeFilter === "all" || typeFilter === "change";
    const wantCreates = typeFilter === "all" || typeFilter === "create";

    Promise.all([
      wantChanges
        ? listCadreChanges({ status: status as WireCadreChange["status"] | undefined, page: 1, pageSize: limit })
        : Promise.resolve({ data: [], total: 0, page: 1, pageSize: limit, hasMore: false }),
      wantCreates
        ? listCadreCreateRequests({ status: status as WireCadreCreateRequest["status"] | undefined, page: 1, pageSize: limit })
        : Promise.resolve({ data: [], total: 0, page: 1, pageSize: limit, hasMore: false }),
    ])
      .then(([changes, creates]) => {
        const merged: ApprovalItem[] = [
          ...changes.data.map((data): ApprovalItem => ({ kind: "change", data })),
          ...creates.data.map((data): ApprovalItem => ({ kind: "create", data })),
        ].sort((a, b) => new Date(b.data.submittedAt).getTime() - new Date(a.data.submittedAt).getTime());
        setItems(merged);
        setTotal(changes.total + creates.total);
        setError(false);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [typeFilter, statusFilter, limit]);

  // No synchronous setLoading(true) here (react-hooks/set-state-in-effect) --
  // `loading` starts true for the initial fetch, and every subsequent trigger
  // (filter tab clicks, "और लोड करें") sets it from its own event handler below.
  useEffect(() => {
    load();
  }, [load]);

  return (
    <>
      <Topbar title="स्वीकृति अनुरोध" subtitle="कैडर परिवर्तन एवं नए कैडर हेतु अनुमोदन श्रृंखला — पूर्ण विवरण" />
      <div style={{ paddingBlock: "var(--space-8)" }}>
        <Container>
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-6)" }}>
            <div className="dash-card" style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "var(--space-3)" }}>
                <FilterTabs tabs={TYPE_TABS} active={typeFilter} onChange={(v) => { setLoading(true); setTypeFilter(v); setLimit(PAGE_SIZE); }} />
                <span className="badge badge--brand tabular-nums">{total} अनुरोध</span>
              </div>
              <FilterTabs tabs={STATUS_TABS} active={statusFilter} onChange={(v) => { setLoading(true); setStatusFilter(v); setLimit(PAGE_SIZE); }} />
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
                  <ApprovalItemCard key={`${item.kind}:${item.data.id}`} item={item} onChanged={load} />
                ))}
              </div>
            )}

            {!error && !loading && total > items.length && (
              <div style={{ textAlign: "center" }}>
                <button className="btn btn--sm" onClick={() => setLimit((l) => l + PAGE_SIZE)}>
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

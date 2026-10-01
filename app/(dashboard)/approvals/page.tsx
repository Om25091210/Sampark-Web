"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Check } from "lucide-react";
import Topbar from "@/components/layout/Topbar";
import Container from "@/components/ui/Container";
import Button from "@/components/ui/Button";
import ApprovalItemCard, { type ApprovalItem } from "@/components/approvals/ApprovalItemCard";
import { isActionable } from "@/lib/approvals";
import {
  listCadreChanges,
  listCadreCreateRequests,
  bulkApproveCadreChanges,
  bulkApproveCadreCreateRequests,
  getRole,
  type WireCadreChange,
  type WireCadreCreateRequest,
  type BulkApproveOutcome,
  type BulkApproveResult,
} from "@/lib/api";

function itemKey(item: ApprovalItem): string {
  return `${item.kind}:${item.data.id}`;
}

type TypeFilter = "all" | "change" | "create";
type StatusFilter = "pending" | "applied" | "rejected" | "cancelled" | "stale" | "all";
// "mine" = only the rung THIS caller can sign right now (backend's awaitingMe,
// ADR-028 -- same filter the dashboard's ApprovalQueue widget already uses).
// "all" = the full audit trail across every rung/status, this page's original
// behaviour. Without "mine", an admin-approved request now awaiting a
// super_admin can sit buried past page 1 of a large, newest-first list --
// it never disappeared, it just was never sorted to the top for THIS caller.
type QueueMode = "mine" | "all";

const TYPE_TABS: { value: TypeFilter; label: string }[] = [
  { value: "all", label: "सभी" },
  { value: "change", label: "परिवर्तन अनुरोध" },
  { value: "create", label: "नए कैडर अनुरोध" },
];

const QUEUE_TABS: { value: QueueMode; label: string }[] = [
  { value: "mine", label: "मेरी कार्रवाई हेतु" },
  { value: "all", label: "सभी अनुरोध (ऑडिट)" },
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

// Both /changes and /cadre-create-requests cap pageSize at 50 server-side
// (cadre-changes.schema.ts / cadre-create-requests.schema.ts). "load more" grows
// `limit` past that in PAGE_SIZE steps, so a single page:1/pageSize:limit request
// would 400 once limit > 50 -- fetchUpTo pages for real (fixed pageSize, growing
// page) instead, so "select all" keeps working past a 50-item queue.
const LIST_PAGE_SIZE = 50;

// approve-bulk accepts up to 100 ids per call (bulkApproveBody), but the server
// approves them one at a time -- each in its own transaction -- so a call's duration
// grows with its id count. Sending a whole selection as one 100-id request could run
// past the load balancer's 60s idle timeout: the browser saw a failure while the server
// kept approving. Small sequential calls keep every request short and give the
// progress counter something real to show.
const BULK_CHUNK = 10;

async function fetchUpTo<T>(
  fetchPage: (page: number, pageSize: number) => Promise<{ data: T[]; total: number; hasMore: boolean }>,
  limit: number,
): Promise<{ data: T[]; total: number }> {
  if (limit <= LIST_PAGE_SIZE) {
    const res = await fetchPage(1, limit);
    return { data: res.data, total: res.total };
  }
  const all: T[] = [];
  let total = 0;
  let page = 1;
  while (all.length < limit) {
    const res = await fetchPage(page, LIST_PAGE_SIZE);
    all.push(...res.data);
    total = res.total;
    if (!res.hasMore) break;
    page += 1;
  }
  return { data: all.slice(0, limit), total };
}

function chunkIds(ids: number[], size: number): number[][] {
  const out: number[][] = [];
  for (let i = 0; i < ids.length; i += size) out.push(ids.slice(i, i + size));
  return out;
}

async function runBulkApprove(
  ids: number[],
  approve: (ids: number[]) => Promise<BulkApproveResult>,
  onChunkDone: (count: number) => void,
): Promise<BulkApproveOutcome[]> {
  const outcomes: BulkApproveOutcome[] = [];
  // Sequential, not Promise.all, mirroring the backend's own approve-bulk loop --
  // avoids piling up concurrent transactions on the shared audit-chain lock.
  for (const group of chunkIds(ids, BULK_CHUNK)) {
    try {
      const res = await approve(group);
      outcomes.push(...res.results);
    } catch {
      // Connection dropped or the server errored: stop here rather than hammer it.
      // The ids from this chunk on get no outcome, so the caller counts them as not
      // approved and leaves them selected -- the refetch afterwards drops any the
      // server did finish before the failure.
      break;
    }
    onChunkDone(group.length);
  }
  return outcomes;
}

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
  // Defaults to "mine" -- opening this page should answer "what needs me right
  // now", same as the dashboard widget, not dump the full org-wide history.
  const [queueMode, setQueueMode] = useState<QueueMode>("mine");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("pending");
  const [limit, setLimit] = useState(PAGE_SIZE);
  const [items, setItems] = useState<ApprovalItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // Select-all / bulk-approve, scoped to items currently loaded on screen (the
  // super_admin's own outstanding rung only -- same isActionable rule the
  // per-card button uses, so a checkbox never appears next to something this
  // caller can't actually act on).
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkBusy, setBulkBusy] = useState(false);
  const [bulkProgress, setBulkProgress] = useState<{ done: number; total: number } | null>(null);
  const [bulkError, setBulkError] = useState<string | null>(null);
  const myRole = getRole();

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
  // Returns the merged, freshly-loaded items so a caller (toggleSelectAll) can act
  // on the real result instead of the stale `items` closure a plain state read
  // would give it right after calling this.
  const runFetch = useCallback((type: TypeFilter, status: StatusFilter, lim: number, mode: QueueMode): Promise<ApprovalItem[]> => {
    const id = ++requestIdRef.current;
    setLoading(true);
    const awaitingMe = mode === "mine";
    const statusParam = status === "all" ? undefined : status;
    const wantChanges = type === "all" || type === "change";
    const wantCreates = type === "all" || type === "create";
    const emptyPool = { data: [], total: 0 };

    return Promise.all([
      wantChanges
        ? fetchUpTo(
            (page, pageSize) =>
              listCadreChanges({ awaitingMe, status: statusParam as WireCadreChange["status"] | undefined, page, pageSize }),
            lim,
          )
        : Promise.resolve(emptyPool),
      wantCreates
        ? fetchUpTo(
            (page, pageSize) =>
              listCadreCreateRequests({ awaitingMe, status: statusParam as WireCadreCreateRequest["status"] | undefined, page, pageSize }),
            lim,
          )
        : Promise.resolve(emptyPool),
    ])
      .then(([changes, creates]) => {
        if (requestIdRef.current !== id) return [] as ApprovalItem[]; // superseded by a newer click
        const merged: ApprovalItem[] = [
          ...changes.data.map((data): ApprovalItem => ({ kind: "change", data })),
          ...creates.data.map((data): ApprovalItem => ({ kind: "create", data })),
        ].sort((a, b) => new Date(b.data.submittedAt).getTime() - new Date(a.data.submittedAt).getTime());
        setItems(merged);
        setTotal(changes.total + creates.total);
        setError(false);
        return merged;
      })
      .catch(() => {
        if (requestIdRef.current !== id) return [] as ApprovalItem[];
        setError(true);
        return [] as ApprovalItem[];
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
    Promise.resolve().then(() => runFetch(typeFilter, statusFilter, limit, queueMode));
    // Mount-only: every later refetch is triggered explicitly by a click handler
    // below, not by this effect reacting to filter state changing.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Drop any selected key that no longer matches a loaded item -- covers a
  // single card being approved/rejected on its own (its onChanged refetch),
  // a tab switch, and a bulk-approve's own refetch, all in one place. Deferred
  // to a microtask (same trick as the mount effect above) so the setState
  // doesn't run synchronously in the effect body itself.
  useEffect(() => {
    Promise.resolve().then(() => {
      setSelected((prev) => {
        const live = new Set(items.map(itemKey));
        const next = new Set([...prev].filter((k) => live.has(k)));
        return next.size === prev.size ? prev : next;
      });
    });
  }, [items]);

  function selectQueueMode(v: QueueMode) {
    setQueueMode(v);
    setLimit(PAGE_SIZE);
    setSelected(new Set());
    runFetch(typeFilter, statusFilter, PAGE_SIZE, v);
  }

  function selectType(v: TypeFilter) {
    setTypeFilter(v);
    setLimit(PAGE_SIZE);
    setSelected(new Set());
    runFetch(v, statusFilter, PAGE_SIZE, queueMode);
  }

  function selectStatus(v: StatusFilter) {
    setStatusFilter(v);
    setLimit(PAGE_SIZE);
    setSelected(new Set());
    runFetch(typeFilter, v, PAGE_SIZE, queueMode);
  }

  function loadMore() {
    const next = limit + PAGE_SIZE;
    setLimit(next);
    runFetch(typeFilter, statusFilter, next, queueMode);
  }

  const actionableItems = items.filter((item) => isActionable(item.data, myRole));
  const allActionableSelected = actionableItems.length > 0 && actionableItems.every((item) => selected.has(itemKey(item)));
  const allLoaded = items.length >= total;

  // "सभी चुनें" must mean the whole matching queue, not just whatever page happened
  // to be loaded on screen -- if more exists, load it first (real pagination via
  // fetchUpTo, so this works past the 50-item backend page cap too), then select
  // from that real result rather than the stale `items` closure.
  async function toggleSelectAll() {
    if (allActionableSelected) {
      setSelected(new Set());
      return;
    }
    let pool = items;
    if (!allLoaded) {
      setLimit(total);
      pool = await runFetch(typeFilter, statusFilter, total, queueMode);
    }
    const actionable = pool.filter((item) => isActionable(item.data, myRole));
    setSelected(new Set(actionable.map(itemKey)));
  }

  function toggleOne(item: ApprovalItem) {
    const key = itemKey(item);
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function bulkApprove() {
    const targets = items.filter((item) => selected.has(itemKey(item)));
    if (targets.length === 0 || bulkBusy) return;
    const changeIds = targets.filter((item) => item.kind === "change").map((item) => item.data.id);
    const createIds = targets.filter((item) => item.kind === "create").map((item) => item.data.id);
    setBulkBusy(true);
    setBulkError(null);
    let done = 0;
    setBulkProgress({ done, total: targets.length });
    const tick = (count: number) => {
      done += count;
      setBulkProgress({ done, total: targets.length });
    };

    // The real approve-bulk endpoints (not N concurrent single-approve calls) --
    // each id still runs the full single-approve path server-side (ladder rung,
    // drift/stale check, self-approval guard), so a mixed-rung selection or an id
    // approved by someone else moments ago just comes back as its own outcome
    // instead of silently vanishing. The two kinds run one after the other (not
    // Promise.all): they contend for the same audit-chain lock server-side anyway,
    // and one running count across both is what the progress label shows.
    (async () => {
      const changeOutcomes = await runBulkApprove(changeIds, bulkApproveCadreChanges, tick);
      const createOutcomes = await runBulkApprove(createIds, bulkApproveCadreCreateRequests, tick);
      return [changeOutcomes, createOutcomes] as const;
    })()
      .then(([changeOutcomes, createOutcomes]) => {
        const changeById = new Map(changeOutcomes.map((o) => [o.id, o]));
        const createById = new Map(createOutcomes.map((o) => [o.id, o]));
        const stillSelected = new Set<string>();
        let failCount = 0;
        targets.forEach((item) => {
          const outcome = item.kind === "change" ? changeById.get(item.data.id) : createById.get(item.data.id);
          const ok = outcome?.status === "applied" || outcome?.status === "approved";
          if (!ok) {
            failCount += 1;
            stillSelected.add(itemKey(item));
          }
        });
        // Only the failures/stale ones stay selected -- a retry click re-attempts just those.
        setSelected(stillSelected);
        setBulkError(failCount > 0 ? `${targets.length} में से ${failCount} स्वीकृति विफल रही। शेष के लिए पुनः प्रयास करें।` : null);
        runFetch(typeFilter, statusFilter, limit, queueMode);
      })
      .catch(() => {
        setBulkError("सामूहिक स्वीकृति विफल रही। कृपया पुनः प्रयास करें।");
      })
      .finally(() => {
        setBulkBusy(false);
        setBulkProgress(null);
      });
  }

  return (
    <>
      <Topbar title="स्वीकृति अनुरोध" subtitle="कैडर परिवर्तन एवं नए कैडर हेतु अनुमोदन श्रृंखला — पूर्ण विवरण" />
      <div style={{ paddingBlock: "var(--space-8)" }}>
        <Container>
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-6)" }}>
            <div className="dash-card" style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "var(--space-3)" }}>
                <FilterTabs tabs={QUEUE_TABS} active={queueMode} onChange={selectQueueMode} />
                <span className="badge badge--brand tabular-nums">{total} अनुरोध</span>
              </div>
              <FilterTabs tabs={TYPE_TABS} active={typeFilter} onChange={selectType} />
              {/* Status is meaningless in "mine" mode -- the backend always forces it
                  to pending (ADR-028: only an outstanding rung is ever "awaiting me"). */}
              {queueMode === "all" && <FilterTabs tabs={STATUS_TABS} active={statusFilter} onChange={selectStatus} />}
            </div>

            {!error && !loading && actionableItems.length > 0 && (
              <div
                className="dash-card"
                style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: "var(--space-3)", background: selected.size > 0 ? "var(--brand-soft)" : undefined }}
              >
                <label style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", cursor: "pointer", fontSize: "0.8125rem", fontWeight: 600, color: "var(--text-secondary)" }}>
                  <input
                    type="checkbox"
                    checked={allActionableSelected}
                    onChange={toggleSelectAll}
                    style={{ width: 18, height: 18, accentColor: "var(--brand)", cursor: "pointer" }}
                  />
                  {allLoaded ? `सभी चुनें (${actionableItems.length} कार्रवाई योग्य)` : "सभी चुनें (पहले शेष अनुरोध लोड होंगे)"}
                </label>
                {selected.size > 0 && (
                  <>
                    <span className="badge badge--brand tabular-nums">{selected.size} चयनित</span>
                    <Button variant="primary" size="sm" disabled={bulkBusy} onClick={bulkApprove}>
                      <Check size={14} strokeWidth={2} /> {bulkBusy ? `स्वीकृत हो रहा है... ${bulkProgress?.done ?? 0}/${bulkProgress?.total ?? selected.size}` : "चयनित सभी स्वीकृत करें"}
                    </Button>
                    <Button variant="ghost" size="sm" disabled={bulkBusy} onClick={() => setSelected(new Set())}>
                      चयन हटाएं
                    </Button>
                  </>
                )}
              </div>
            )}
            {bulkError && (
              <p style={{ fontSize: "0.8125rem", color: "var(--rose)" }}>{bulkError}</p>
            )}

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
                    key={itemKey(item)}
                    item={item}
                    onChanged={() => runFetch(typeFilter, statusFilter, limit, queueMode)}
                    selected={selected.has(itemKey(item))}
                    onToggleSelect={() => toggleOne(item)}
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

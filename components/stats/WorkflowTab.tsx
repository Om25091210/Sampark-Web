"use client";

import StatCard from "@/components/dashboard/StatCard";
import { countApprovalQueue, getRole, type ApprovalQueueKind } from "@/lib/api";
import ChartCard from "./ChartCard";
import ChartTable from "./ChartTable";
import Figure from "./Figure";
import StackedBar, { type StackedSegment } from "./StackedBar";
import { formatCount } from "./chartUtils";
import { useStatsQuery, type StatsQuery } from "./hooks";

interface QueueCounts {
  applied: number;
  pending: number;
  rejected: number;
  cancelled: number;
  stale: number;
  /** Pending requests the CALLER can sign right now; null when the caller is not HQ. */
  readyForHq: number | null;
}

interface QueueSpec {
  kind: ApprovalQueueKind;
  title: string;
  sub: string;
  /** Cadre-create requests have no `stale` state (nothing exists yet to drift from). */
  hasStale: boolean;
}

const QUEUES: QueueSpec[] = [
  { kind: "changes", title: "कैडर जानकारी में बदलाव", sub: "मौजूदा कैडर की जानकारी में प्रस्तावित संशोधन", hasStale: true },
  { kind: "create", title: "नए कैडर जोड़ने के अनुरोध", sub: "रजिस्टर में नया कैडर जोड़ने के प्रस्ताव", hasStale: false },
  { kind: "proforma-a", title: "AB प्रोफ़ार्मा", sub: "AB प्रोफ़ार्मा भरने / संशोधन के अनुरोध", hasStale: true },
  { kind: "proforma-b", title: "B प्रोफ़ार्मा", sub: "दो-मासिक B प्रोफ़ार्मा दाखिल करने के अनुरोध", hasStale: true },
];

const share = (n: number, total: number) => (total === 0 ? 0 : Math.round((n / total) * 100));

// Every figure is the exact `total` the server reports for a one-row page of the queue's own
// list endpoint. `readyForHq` uses the API's `awaitingMe`: for HQ that is only what HQ can
// sign RIGHT NOW (its own rung, once any SDOP rung is cleared) -- so pending minus that is
// what is still waiting on an SDOP. That split is only meaningful for an HQ caller.
async function loadQueue(spec: QueueSpec): Promise<QueueCounts> {
  const isHq = getRole() === "super_admin";
  const count = (status: "pending" | "applied" | "rejected" | "cancelled" | "stale") => countApprovalQueue(spec.kind, { status });
  const [applied, pending, rejected, cancelled, stale, readyForHq] = await Promise.all([
    count("applied"),
    count("pending"),
    count("rejected"),
    count("cancelled"),
    spec.hasStale ? count("stale") : Promise.resolve(0),
    isHq ? countApprovalQueue(spec.kind, { awaitingMe: true }) : Promise.resolve(null),
  ]);
  return { applied, pending, rejected, cancelled, stale, readyForHq };
}

function segments(c: QueueCounts): StackedSegment[] {
  return [
    { key: "applied", label: "लागू हुए", value: c.applied, color: "var(--emerald)", ink: "light" },
    { key: "pending", label: "लंबित", value: c.pending, color: "var(--amber)", ink: "dark" },
    { key: "rejected", label: "अस्वीकृत", value: c.rejected, color: "var(--rose)", ink: "light" },
    { key: "cancelled", label: "वापस लिए गए", value: c.cancelled, color: "var(--bar-muted)", ink: "dark" },
    { key: "stale", label: "बासी (मान बदल गया)", value: c.stale, color: "var(--violet)", ink: "light" },
  ];
}

function QueueCard({ spec, query }: { spec: QueueSpec; query: StatsQuery<QueueCounts> }) {
  const c = query.data;
  const total = c ? c.applied + c.pending + c.rejected + c.cancelled + c.stale : 0;
  // Of the requests that reached a decision, how many were approved -- withdrawn and stale
  // ones were never decided on merit, and pending ones have no outcome yet.
  const decided = c ? c.applied + c.rejected : 0;
  const split = c && c.readyForHq !== null ? { hq: c.readyForHq, sdop: Math.max(0, c.pending - c.readyForHq) } : null;

  return (
    <ChartCard
      title={spec.title}
      sub={spec.sub}
      aside={
        c && (
          <div style={{ display: "flex", gap: "var(--space-5)" }}>
            <Figure label="कुल अनुरोध" value={formatCount(total)} />
            <Figure label="स्वीकृति दर" value={decided === 0 ? "—" : `${share(c.applied, decided)}%`} />
          </div>
        )
      }
      chart={
        c ? (
          <div style={{ opacity: query.loading ? 0.55 : 1, transition: "opacity 0.2s var(--ease)" }}>
            <StackedBar segments={segments(c)} ariaLabel={`${spec.title}: अनुरोधों की स्थिति`} emptyLabel="अभी तक कोई अनुरोध नहीं।" />
            {split !== null && c.pending > 0 && (
              <p className="t-caption" style={{ marginTop: "var(--space-4)", paddingTop: "var(--space-3)", borderTop: "1px solid var(--border)" }}>
                लंबित {formatCount(c.pending)} में से{" "}
                <strong className="tabular-nums" style={{ color: "var(--text-primary)" }}>{formatCount(split.hq)}</strong> HQ के हस्ताक्षर के लिए तैयार,{" "}
                <strong className="tabular-nums" style={{ color: "var(--text-primary)" }}>{formatCount(split.sdop)}</strong> अभी SDOP की प्रतीक्षा में।
              </p>
            )}
          </div>
        ) : (
          <p className="t-caption" style={{ color: query.error ? "var(--rose)" : undefined }}>
            {query.error ? "आंकड़े लोड नहीं हो सके।" : "लोड हो रहा है..."}
          </p>
        )
      }
      table={
        c ? (
          <ChartTable
            caption={`${spec.title}: अनुरोधों की स्थिति`}
            headers={["स्थिति", "अनुरोध", "%"]}
            rows={segments(c)
              .filter((s) => s.key !== "stale" || spec.hasStale)
              .map((s) => [s.label, s.value, share(s.value, total)])}
          />
        ) : (
          <p className="t-caption">कोई डेटा उपलब्ध नहीं है।</p>
        )
      }
    />
  );
}

export default function WorkflowTab() {
  // Four independent reads: one queue failing leaves the other three (and their totals card)
  // intact. Fixed call order, so plain hooks -- no loop.
  const results = [
    useStatsQuery(QUEUES[0]!.kind, () => loadQueue(QUEUES[0]!)),
    useStatsQuery(QUEUES[1]!.kind, () => loadQueue(QUEUES[1]!)),
    useStatsQuery(QUEUES[2]!.kind, () => loadQueue(QUEUES[2]!)),
    useStatsQuery(QUEUES[3]!.kind, () => loadQueue(QUEUES[3]!)),
  ];

  // Headline totals only when every queue has answered: a sum over a partial set would read
  // as the whole and understate the backlog.
  const all = results.map((r) => r.data);
  const loaded = all.every((d): d is QueueCounts => d !== null);
  const pending = loaded ? all.reduce((s, d) => s + (d?.pending ?? 0), 0) : null;
  const hqKnown = loaded && all.every((d) => d?.readyForHq !== null);
  const ready = hqKnown ? all.reduce((s, d) => s + (d?.readyForHq ?? 0), 0) : null;
  const waiting = pending !== null && ready !== null ? Math.max(0, pending - ready) : null;
  const dash = (n: number | null) => (n === null ? "—" : formatCount(n));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-6)" }}>
      <p className="t-caption">
        वर्तमान स्थिति — चारों स्वीकृति कतारों की गिनती। हर अनुरोध पहले SDOP, फिर HQ के हस्ताक्षर से लागू होता है; &ldquo;HQ के लिए तैयार&rdquo; वे हैं जिन पर HQ अभी हस्ताक्षर कर सकता है।
      </p>

      <div className="stat-grid-3">
        <StatCard label="कुल लंबित अनुरोध" value={dash(pending)} color="orange" icon="waiting" href="/approvals" />
        <StatCard label="HQ के हस्ताक्षर के लिए तैयार" value={dash(ready)} color="accent" icon="tasks" href="/approvals" />
        <StatCard label="SDOP की प्रतीक्षा में" value={dash(waiting)} color="accent" icon="pending" />
      </div>

      <div className="profile-grid">
        {QUEUES.map((spec, i) => (
          <QueueCard key={spec.kind} spec={spec} query={results[i]!} />
        ))}
      </div>
    </div>
  );
}

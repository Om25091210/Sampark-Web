"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, X, ClipboardCheck, ArrowUpRight } from "lucide-react";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import {
  listCadreChanges,
  listCadreCreateRequests,
  approveCadreChange,
  rejectCadreChange,
  approveCadreCreateRequest,
  rejectCadreCreateRequest,
  type WireCadreChange,
  type WireCadreCreateRequest,
} from "@/lib/api";
import { fieldLabel, ROLE_LABELS } from "@/lib/approvals";
import { formatDate } from "@/lib/cadres";

type QueueItem =
  | { kind: "change"; data: WireCadreChange }
  | { kind: "create"; data: WireCadreCreateRequest };

const VISIBLE = 5;

function itemName(item: QueueItem): string {
  return item.kind === "change"
    ? (item.data.cadre?.name ?? `कैडर #${item.data.cadreId}`)
    : item.data.draft.name;
}

function fieldSummary(item: QueueItem): string {
  if (item.kind === "change") {
    return Object.keys(item.data.changes).map(fieldLabel).join(", ");
  }
  return "नया कैडर पंजीकरण — सभी विवरण नीचे देखें";
}

export default function ApprovalQueue() {
  const router = useRouter();
  const [items, setItems] = useState<QueueItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [rejectingKey, setRejectingKey] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [actionError, setActionError] = useState<string | null>(null);

  // No synchronous setLoading(true) here -- `loading` already starts true, and a
  // refetch after approve/reject shouldn't flash a loading state over a list the
  // user is actively looking at (each row's own busyKey disables its buttons
  // meanwhile). Calling setState synchronously from the mount effect below would
  // also trip react-hooks' set-state-in-effect rule.
  const load = useCallback(() => {
    Promise.all([
      listCadreChanges({ awaitingMe: true, status: "pending", pageSize: 15 }),
      listCadreCreateRequests({ awaitingMe: true, status: "pending", pageSize: 15 }),
    ])
      .then(([changes, creates]) => {
        const merged: QueueItem[] = [
          ...changes.data.map((data): QueueItem => ({ kind: "change", data })),
          ...creates.data.map((data): QueueItem => ({ kind: "create", data })),
        ].sort((a, b) => new Date(b.data.submittedAt).getTime() - new Date(a.data.submittedAt).getTime());
        setItems(merged.slice(0, VISIBLE));
        setTotal(changes.total + creates.total);
        setError(false);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function keyOf(item: QueueItem): string {
    return `${item.kind}:${item.data.id}`;
  }

  function approve(item: QueueItem) {
    const key = keyOf(item);
    setBusyKey(key);
    setActionError(null);
    const request = item.kind === "change" ? approveCadreChange(item.data.id) : approveCadreCreateRequest(item.data.id);
    request
      .then(() => load())
      .catch(() => setActionError("स्वीकृति विफल रही। पुनः प्रयास करें।"))
      .finally(() => setBusyKey(null));
  }

  function confirmReject(item: QueueItem) {
    if (!reason.trim()) return;
    const key = keyOf(item);
    setBusyKey(key);
    setActionError(null);
    const request =
      item.kind === "change"
        ? rejectCadreChange(item.data.id, reason.trim())
        : rejectCadreCreateRequest(item.data.id, reason.trim());
    request
      .then(() => {
        setRejectingKey(null);
        setReason("");
        load();
      })
      .catch(() => setActionError("अस्वीकृति विफल रही। पुनः प्रयास करें।"))
      .finally(() => setBusyKey(null));
  }

  return (
    <div className="dash-card">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "var(--space-5)" }}>
        <div>
          <h3 className="t-h4">स्वीकृति हेतु लंबित</h3>
          <p className="t-caption" style={{ marginTop: "2px" }}>
            परिवर्तन व नए कैडर अनुरोध — अनुमोदन श्रृंखला
          </p>
        </div>
        {total > 0 && <span className="badge badge--pending tabular-nums">{total}</span>}
      </div>

      {error && (
        <p className="t-body-sm" style={{ color: "var(--rose)" }}>
          अनुरोध लोड नहीं हो सके।
        </p>
      )}
      {!error && loading && <p className="t-caption">लोड हो रहा है...</p>}
      {!error && !loading && items.length === 0 && (
        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)", padding: "var(--space-2) 0" }}>
          <span
            style={{
              width: 32,
              height: 32,
              borderRadius: "var(--radius-full)",
              background: "var(--emerald-soft)",
              color: "var(--emerald)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <ClipboardCheck size={16} strokeWidth={1.75} />
          </span>
          <p className="t-body-sm" style={{ color: "var(--text-tertiary)" }}>
            कोई भी अनुरोध आपकी स्वीकृति हेतु लंबित नहीं है।
          </p>
        </div>
      )}

      {actionError && (
        <p className="t-body-sm" style={{ color: "var(--rose)", marginBottom: "var(--space-3)" }}>
          {actionError}
        </p>
      )}

      {!error && !loading && items.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
          {items.map((item) => {
            const key = keyOf(item);
            const awaitingRole = item.data.awaitingRole;
            return (
              <div
                key={key}
                style={{
                  border: "1px solid var(--border)",
                  borderRadius: "var(--radius-lg)",
                  padding: "var(--space-3) var(--space-4)",
                  display: "flex",
                  flexDirection: "column",
                  gap: "var(--space-2)",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "var(--space-2)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
                    <span style={{ fontSize: "0.8125rem", fontWeight: 700, color: "var(--text-primary)" }}>
                      {itemName(item)}
                    </span>
                    <Badge tone={item.kind === "create" ? "brand" : "neutral"}>
                      {item.kind === "create" ? "नया कैडर" : "परिवर्तन"}
                    </Badge>
                  </div>
                  <span className="t-caption tabular-nums" style={{ fontSize: "0.6875rem" }}>
                    {formatDate(item.data.submittedAt)}
                  </span>
                </div>

                <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>
                  <span style={{ fontWeight: 600 }}>{item.data.submittedBy.name}</span>
                  <span style={{ color: "var(--text-tertiary)" }}>
                    {" "}
                    ({ROLE_LABELS[item.data.submittedBy.role] ?? item.data.submittedBy.role}) ने प्रस्तावित किया
                  </span>
                </div>

                <div style={{ fontSize: "0.75rem", color: "var(--text-tertiary)" }}>
                  {item.kind === "change" ? "परिवर्तित फ़ील्ड: " : ""}
                  <span style={{ color: "var(--text-secondary)", fontWeight: 500 }}>{fieldSummary(item)}</span>
                </div>

                {item.kind === "create" && item.data.duplicateWarning && (
                  <p style={{ fontSize: "0.75rem", color: "var(--amber)", fontWeight: 600 }}>
                    ⚠ संभावित डुप्लिकेट — पूरा विवरण देखें
                  </p>
                )}

                {item.data.note && (
                  <p style={{ fontSize: "0.75rem", color: "var(--text-secondary)", fontStyle: "italic" }}>
                    “{item.data.note}”
                  </p>
                )}

                {awaitingRole && (
                  <Badge tone="pending" style={{ alignSelf: "flex-start" }}>
                    {awaitingRole === "admin" ? "प्रशासक की प्रतीक्षा" : "वरिष्ठ प्रशासक की प्रतीक्षा"}
                  </Badge>
                )}

                {rejectingKey === key ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)", marginTop: "var(--space-1)" }}>
                    <textarea
                      className="input"
                      placeholder="अस्वीकृति का कारण लिखें..."
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      rows={2}
                      style={{ resize: "vertical", fontFamily: "inherit" }}
                    />
                    <div style={{ display: "flex", gap: "var(--space-2)" }}>
                      <Button
                        variant="danger"
                        size="sm"
                        disabled={!reason.trim() || busyKey === key}
                        onClick={() => confirmReject(item)}
                      >
                        {busyKey === key ? "भेजा जा रहा है..." : "अस्वीकृति की पुष्टि करें"}
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => {
                          setRejectingKey(null);
                          setReason("");
                        }}
                      >
                        रद्द करें
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: "flex", gap: "var(--space-2)", marginTop: "var(--space-1)" }}>
                    <Button variant="primary" size="sm" disabled={busyKey === key} onClick={() => approve(item)}>
                      <Check size={14} strokeWidth={2} /> स्वीकृत करें
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      disabled={busyKey === key}
                      onClick={() => {
                        setRejectingKey(key);
                        setActionError(null);
                      }}
                    >
                      <X size={14} strokeWidth={2} /> अस्वीकार करें
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <div style={{ marginTop: "var(--space-4)" }}>
        <Button variant="secondary" size="sm" block onClick={() => router.push("/approvals")}>
          पूरा विवरण देखें <ArrowUpRight size={14} strokeWidth={2} />
        </Button>
      </div>
    </div>
  );
}

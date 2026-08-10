"use client";

import { useState } from "react";
import { Check, X } from "lucide-react";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import {
  approveCadreChange,
  rejectCadreChange,
  approveCadreCreateRequest,
  rejectCadreCreateRequest,
  getRole,
  type WireCadreChange,
  type WireCadreCreateRequest,
} from "@/lib/api";
import { fieldLabel, displayValue, ROLE_LABELS, STATUS_LABELS, STATUS_TONE } from "@/lib/approvals";
import { formatDate } from "@/lib/cadres";

export type ApprovalItem =
  | { kind: "change"; data: WireCadreChange }
  | { kind: "create"; data: WireCadreCreateRequest };

// Every draft field worth showing on the create-request card, in a fixed,
// readable order -- required core first, then the optional facts. Deliberately
// excludes avatarKey/2/3 (rendered as photo previews instead) and avatarUrl/2/3
// (the preview source, not a fact to list).
const DRAFT_FIELD_ORDER = [
  "name",
  "phone",
  "thana",
  "currentAddress",
  "designation",
  "category",
  "permanentAddress",
  "residingVillage",
  "subDivision",
  "district",
  "gender",
  "caste",
  "dateOfBirth",
  "fatherName",
  "motherName",
  "spouseName",
  "surrenderDate",
  "surrenderLocation",
  "surrenderOrigin",
  "surrenderYear",
  "verificationOffice",
  "supervisoryOffice",
  "incident",
  "familyGroupInfo",
  "priorityCategory",
  "hasAadhaar",
  "hasBankAccount",
  "hasAbProforma",
  "hasAgreementLetter",
] as const;

function metaRow(label: string, value: string) {
  return (
    <div key={label} style={{ display: "flex", gap: "var(--space-3)", padding: "6px 0", borderBottom: "1px solid var(--border)" }}>
      <span style={{ width: 180, flexShrink: 0, fontSize: "0.75rem", color: "var(--text-tertiary)" }}>{label}</span>
      <span style={{ fontSize: "0.8125rem", color: "var(--text-primary)", fontWeight: 500 }}>{value}</span>
    </div>
  );
}

function ApprovalChain({ item }: { item: ApprovalItem }) {
  const d = item.data;
  const rungs: { label: string; needed: boolean; by?: { id: number; name: string }; at?: string }[] = [
    { label: "प्रशासक", needed: d.needsAdmin, by: d.adminApprovedBy, at: d.adminApprovedAt },
    { label: "वरिष्ठ प्रशासक", needed: d.needsSuperAdmin, by: d.superAdminApprovedBy, at: d.superAdminApprovedAt },
  ].filter((r) => r.needed);

  if (rungs.length === 0) return null;

  return (
    <div style={{ display: "flex", gap: "var(--space-4)", flexWrap: "wrap" }}>
      {rungs.map((r) => (
        <div key={r.label} style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
          <span
            style={{
              width: 18,
              height: 18,
              borderRadius: "var(--radius-full)",
              background: r.at ? "var(--emerald-soft)" : "var(--surface-sunken)",
              color: r.at ? "var(--emerald)" : "var(--text-disabled)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            {r.at && <Check size={11} strokeWidth={2.5} />}
          </span>
          <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>
            {r.label}
            {r.by && r.at ? ` — ${r.by.name} (${formatDate(r.at)})` : " — लंबित"}
          </span>
        </div>
      ))}
    </div>
  );
}

interface Props {
  item: ApprovalItem;
  onChanged: () => void;
}

export default function ApprovalItemCard({ item, onChanged }: Props) {
  const [busy, setBusy] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState("");
  const [actionError, setActionError] = useState<string | null>(null);

  const d = item.data;
  const status = STATUS_LABELS[d.status] ?? d.status;
  const tone = STATUS_TONE[d.status] ?? "neutral";
  const myRole = getRole();
  // Actionable only when the caller's own role matches the specific rung this
  // request is waiting on -- mirrors the backend's awaitingMe filter (ADR-028):
  // a super_admin cannot jump ahead of an outstanding admin rung from here either.
  const canAct = d.awaitingRole !== undefined && d.awaitingRole !== null && d.awaitingRole === myRole;

  function approve() {
    setBusy(true);
    setActionError(null);
    const req = item.kind === "change" ? approveCadreChange(d.id) : approveCadreCreateRequest(d.id);
    req
      .then(onChanged)
      .catch(() => setActionError("स्वीकृति विफल रही। पुनः प्रयास करें।"))
      .finally(() => setBusy(false));
  }

  function confirmReject() {
    if (!reason.trim()) return;
    setBusy(true);
    setActionError(null);
    const req =
      item.kind === "change"
        ? rejectCadreChange(d.id, reason.trim())
        : rejectCadreCreateRequest(d.id, reason.trim());
    req
      .then(() => {
        setRejecting(false);
        setReason("");
        onChanged();
      })
      .catch(() => setActionError("अस्वीकृति विफल रही। पुनः प्रयास करें।"))
      .finally(() => setBusy(false));
  }

  return (
    <div className="dash-card" style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "var(--space-3)" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", flexWrap: "wrap" }}>
            <span className="t-h4">{item.kind === "change" ? (item.data.cadre?.name ?? `कैडर #${item.data.cadreId}`) : item.data.draft.name}</span>
            <Badge tone={item.kind === "create" ? "brand" : "neutral"}>{item.kind === "create" ? "नया कैडर अनुरोध" : "परिवर्तन अनुरोध"}</Badge>
            <Badge tone={tone}>{status}</Badge>
          </div>
          {item.kind === "change" && item.data.cadre?.serialNumber && (
            <p className="t-caption" style={{ marginTop: "2px" }}>क्रमांक: {item.data.cadre.serialNumber}</p>
          )}
        </div>
        <span className="t-caption tabular-nums" style={{ whiteSpace: "nowrap" }}>{formatDate(d.submittedAt)}</span>
      </div>

      {/* Submitter */}
      <div style={{ fontSize: "0.8125rem", color: "var(--text-secondary)" }}>
        <span style={{ fontWeight: 600 }}>{d.submittedBy.name}</span>
        <span style={{ color: "var(--text-tertiary)" }}> ({ROLE_LABELS[d.submittedBy.role] ?? d.submittedBy.role}) ने प्रस्तावित किया</span>
      </div>

      {d.note && (
        <p style={{ fontSize: "0.8125rem", color: "var(--text-secondary)", fontStyle: "italic" }}>“{d.note}”</p>
      )}

      {/* Approval chain */}
      <ApprovalChain item={item} />

      {d.status === "rejected" && d.decidedReason && (
        <p style={{ fontSize: "0.8125rem", color: "var(--rose)" }}>
          <strong>अस्वीकृति का कारण:</strong> {d.decidedReason}
        </p>
      )}
      {d.status === "stale" && (
        <p style={{ fontSize: "0.8125rem", color: "var(--rose)" }}>
          मूल कैडर का मान इस अनुरोध के बाद बदल चुका है — यह लागू नहीं किया गया।
        </p>
      )}

      {/* Duplicate warning (create requests only) */}
      {item.kind === "create" && item.data.duplicateWarning && (
        <div style={{ background: "var(--amber-soft)", borderRadius: "var(--radius-md)", padding: "var(--space-3)" }}>
          <p style={{ fontSize: "0.8125rem", fontWeight: 700, color: "var(--amber)", marginBottom: "var(--space-2)" }}>
            ⚠ संभावित डुप्लिकेट मिला
          </p>
          {item.data.duplicateWarning.cadres.map((c) => (
            <p key={`c${c.id}`} style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>
              मौजूदा कैडर: {c.name} {c.serialNumber ? `(${c.serialNumber})` : ""} — {c.thana}
            </p>
          ))}
          {item.data.duplicateWarning.createRequests.map((r) => (
            <p key={`r${r.id}`} style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>
              अन्य लंबित अनुरोध: {r.name} — {r.submittedBy} द्वारा
            </p>
          ))}
        </div>
      )}

      {/* Body: diff table for a change, full draft for a create */}
      {item.kind === "change" ? (
        <div>
          {Object.entries(item.data.changes).map(([field, entry]) => (
            <div key={field} style={{ padding: "8px 0", borderBottom: "1px solid var(--border)" }}>
              <div style={{ fontSize: "0.75rem", color: "var(--text-tertiary)", marginBottom: "4px" }}>{fieldLabel(field)}</div>
              {entry.oldUrl !== undefined || entry.newUrl !== undefined ? (
                <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  {entry.oldUrl ? <img src={entry.oldUrl} alt="पुरानी फ़ोटो" style={{ width: 56, height: 56, borderRadius: "var(--radius-md)", objectFit: "cover", opacity: 0.6 }} /> : <span className="t-caption">कोई फ़ोटो नहीं</span>}
                  <span style={{ color: "var(--text-tertiary)" }}>→</span>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  {entry.newUrl ? <img src={entry.newUrl} alt="नई फ़ोटो" style={{ width: 72, height: 72, borderRadius: "var(--radius-md)", objectFit: "cover" }} /> : <span className="t-caption">हटाई गई</span>}
                </div>
              ) : (
                <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
                  <span style={{ fontSize: "0.8125rem", color: "var(--text-tertiary)", textDecoration: "line-through" }}>
                    {displayValue(field, entry.old)}
                  </span>
                  <span style={{ color: "var(--text-tertiary)" }}>→</span>
                  <span style={{ fontSize: "0.8125rem", color: "var(--text-primary)", fontWeight: 600 }}>
                    {displayValue(field, entry.new)}
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div>
          {(item.data.draft.avatarUrl || item.data.draft.avatarUrl2 || item.data.draft.avatarUrl3) && (
            <div style={{ display: "flex", gap: "var(--space-3)", marginBottom: "var(--space-3)" }}>
              {[item.data.draft.avatarUrl, item.data.draft.avatarUrl2, item.data.draft.avatarUrl3]
                .filter((u): u is string => Boolean(u))
                // eslint-disable-next-line @next/next/no-img-element
                .map((u, i) => <img key={i} src={u} alt="कैडर फ़ोटो" style={{ width: 72, height: 72, borderRadius: "var(--radius-md)", objectFit: "cover" }} />)}
            </div>
          )}
          {DRAFT_FIELD_ORDER.filter((f) => {
            const v = item.data.draft[f];
            return v !== undefined && v !== null && v !== "";
          }).map((f) => metaRow(fieldLabel(f), displayValue(f, item.data.draft[f])))}
        </div>
      )}

      {actionError && <p style={{ fontSize: "0.8125rem", color: "var(--rose)" }}>{actionError}</p>}

      {/* Actions -- only when this caller's role matches the outstanding rung */}
      {canAct && (
        rejecting ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
            <textarea
              className="input"
              placeholder="अस्वीकृति का कारण लिखें..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={2}
              style={{ resize: "vertical", fontFamily: "inherit" }}
            />
            <div style={{ display: "flex", gap: "var(--space-2)" }}>
              <Button variant="danger" size="sm" disabled={!reason.trim() || busy} onClick={confirmReject}>
                {busy ? "भेजा जा रहा है..." : "अस्वीकृति की पुष्टि करें"}
              </Button>
              <Button variant="secondary" size="sm" onClick={() => { setRejecting(false); setReason(""); }}>
                रद्द करें
              </Button>
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", gap: "var(--space-2)" }}>
            <Button variant="primary" size="sm" disabled={busy} onClick={approve}>
              <Check size={14} strokeWidth={2} /> स्वीकृत करें
            </Button>
            <Button variant="secondary" size="sm" disabled={busy} onClick={() => { setRejecting(true); setActionError(null); }}>
              <X size={14} strokeWidth={2} /> अस्वीकार करें
            </Button>
          </div>
        )
      )}
    </div>
  );
}

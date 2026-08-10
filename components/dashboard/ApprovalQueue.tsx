"use client";

import { useCallback, useEffect, useState } from "react";
import { Check, X, ClipboardCheck } from "lucide-react";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import {
  listCadreChanges,
  approveCadreChange,
  rejectCadreChange,
  type WireCadreChange,
} from "@/lib/api";
import { formatDate } from "@/lib/cadres";

// Hindi labels for the cadre fields a change can touch — mirrors the mobile
// app's ChangeRequestCard.tsx FIELD_LABELS so the same field reads identically
// on both platforms.
const FIELD_LABELS: Record<string, string> = {
  name: "नाम",
  phone: "मोबाईल नंबर",
  thana: "थाना",
  currentAddress: "वर्तमान निवास",
  permanentAddress: "स्थायी निवास",
  residingVillage: "निवासरत गांव का नाम",
  designation: "पद / ज़िम्मेदारी",
  incident: "संगठन में विभिन्न पद पर कार्य करने का विवरण",
  verificationOffice: "वेरिफिकेशन स्थान",
  supervisoryOffice: "पर्यवेक्षक कार्यालय",
  surrenderDate: "समर्पण दिनांक",
  surrenderLocation: "समर्पण स्थान",
  surrenderOrigin: "समर्पण मूल",
  surrenderYear: "समर्पण वर्ष",
  familyGroupInfo: "परिचितों की जानकारी",
  subDivision: "सब डीवीजन",
  district: "जिला",
  hasAadhaar: "आधार कार्ड",
  hasBankAccount: "बैंक खाता",
  hasAbProforma: "AB प्रोफार्मा",
  hasAgreementLetter: "अनुबंध पत्र",
  avatarKey: "कैडर फ़ोटो",
  avatarKey2: "कैडर फ़ोटो 2",
  avatarKey3: "कैडर फ़ोटो 3",
  dateOfBirth: "जन्म तिथि",
  fatherName: "पिता का नाम",
  motherName: "माता का नाम",
  spouseName: "जीवनसाथी का नाम",
  gender: "लिंग",
  caste: "जाति",
  priorityCategory: "प्राथमिकता श्रेणी",
  permanentStatus: "स्थायी चिह्न",
};

const ROLE_LABELS: Record<string, string> = {
  super_admin: "वरिष्ठ प्रशासक",
  admin: "प्रशासक",
  officer: "अधिकारी",
  viewer: "दर्शक",
};

function fieldSummary(changes: WireCadreChange["changes"]): string {
  return Object.keys(changes)
    .map((f) => FIELD_LABELS[f] ?? f)
    .join(", ");
}

export default function ApprovalQueue() {
  const [items, setItems] = useState<WireCadreChange[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [rejectingId, setRejectingId] = useState<number | null>(null);
  const [reason, setReason] = useState("");
  const [actionError, setActionError] = useState<string | null>(null);

  // No synchronous setLoading(true) here -- `loading` already starts true, and a
  // refetch after approve/reject shouldn't flash a loading state over a list the
  // user is actively looking at (each row's own busyId disables its buttons
  // meanwhile). Calling setState synchronously from the mount effect below would
  // also trip react-hooks' set-state-in-effect rule.
  const load = useCallback(() => {
    listCadreChanges({ awaitingMe: true, status: "pending", pageSize: 5 })
      .then((res) => {
        setItems(res.data);
        setTotal(res.total);
        setError(false);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function approve(id: number) {
    setBusyId(id);
    setActionError(null);
    approveCadreChange(id)
      .then(() => load())
      .catch(() => setActionError("स्वीकृति विफल रही। पुनः प्रयास करें।"))
      .finally(() => setBusyId(null));
  }

  function confirmReject(id: number) {
    if (!reason.trim()) return;
    setBusyId(id);
    setActionError(null);
    rejectCadreChange(id, reason.trim())
      .then(() => {
        setRejectingId(null);
        setReason("");
        load();
      })
      .catch(() => setActionError("अस्वीकृति विफल रही। पुनः प्रयास करें।"))
      .finally(() => setBusyId(null));
  }

  return (
    <div className="dash-card">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "var(--space-5)" }}>
        <div>
          <h3 className="t-h4">स्वीकृति हेतु लंबित</h3>
          <p className="t-caption" style={{ marginTop: "2px" }}>
            परिवर्तन अनुरोध — कैडर संपादन अनुमोदन श्रृंखला
          </p>
        </div>
        {total > 0 && (
          <span className="badge badge--pending tabular-nums">{total}</span>
        )}
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
            कोई भी परिवर्तन आपकी स्वीकृति हेतु लंबित नहीं है।
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
          {items.map((item) => (
            <div
              key={item.id}
              style={{
                border: "1px solid var(--border)",
                borderRadius: "var(--radius-lg)",
                padding: "var(--space-3) var(--space-4)",
                display: "flex",
                flexDirection: "column",
                gap: "var(--space-2)",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: "var(--space-2)" }}>
                <span style={{ fontSize: "0.8125rem", fontWeight: 700, color: "var(--text-primary)" }}>
                  {item.cadre?.name ?? `कैडर #${item.cadreId}`}
                </span>
                <span className="t-caption tabular-nums" style={{ fontSize: "0.6875rem" }}>
                  {formatDate(item.submittedAt)}
                </span>
              </div>

              <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>
                <span style={{ fontWeight: 600 }}>{item.submittedBy.name}</span>
                <span style={{ color: "var(--text-tertiary)" }}> ({ROLE_LABELS[item.submittedBy.role] ?? item.submittedBy.role}) ने प्रस्तावित किया</span>
              </div>

              <div style={{ fontSize: "0.75rem", color: "var(--text-tertiary)" }}>
                परिवर्तित फ़ील्ड: <span style={{ color: "var(--text-secondary)", fontWeight: 500 }}>{fieldSummary(item.changes)}</span>
              </div>

              {item.note && (
                <p style={{ fontSize: "0.75rem", color: "var(--text-secondary)", fontStyle: "italic" }}>
                  “{item.note}”
                </p>
              )}

              {item.awaitingRole && (
                <Badge tone="pending" style={{ alignSelf: "flex-start" }}>
                  {item.awaitingRole === "admin" ? "प्रशासक की प्रतीक्षा" : "वरिष्ठ प्रशासक की प्रतीक्षा"}
                </Badge>
              )}

              {rejectingId === item.id ? (
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
                      disabled={!reason.trim() || busyId === item.id}
                      onClick={() => confirmReject(item.id)}
                    >
                      {busyId === item.id ? "भेजा जा रहा है..." : "अस्वीकृति की पुष्टि करें"}
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => {
                        setRejectingId(null);
                        setReason("");
                      }}
                    >
                      रद्द करें
                    </Button>
                  </div>
                </div>
              ) : (
                <div style={{ display: "flex", gap: "var(--space-2)", marginTop: "var(--space-1)" }}>
                  <Button
                    variant="primary"
                    size="sm"
                    disabled={busyId === item.id}
                    onClick={() => approve(item.id)}
                  >
                    <Check size={14} strokeWidth={2} /> स्वीकृत करें
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={busyId === item.id}
                    onClick={() => {
                      setRejectingId(item.id);
                      setActionError(null);
                    }}
                  >
                    <X size={14} strokeWidth={2} /> अस्वीकार करें
                  </Button>
                </div>
              )}
            </div>
          ))}

          {total > items.length && (
            <p className="t-caption" style={{ textAlign: "center" }}>
              +{total - items.length} अन्य अनुरोध लंबित
            </p>
          )}
        </div>
      )}
    </div>
  );
}

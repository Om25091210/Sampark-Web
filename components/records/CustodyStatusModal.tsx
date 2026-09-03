"use client";

import { useState } from "react";
import Modal from "@/components/ui/Modal";
import { submitCadreChange, type WireCadreChange } from "@/lib/api";
import { CUSTODY_STATUS_LABELS, type CustodyStatus } from "@/lib/cadres";

const OPTIONS: CustodyStatus[] = ["in_custody", "released"];

interface CustodyStatusModalProps {
  cadreId: number;
  currentStatus?: CustodyStatus;
  onClose: () => void;
  onSaved: (result: WireCadreChange) => void;
}

// हिरासत में/जेल में vs रिहा/जेल से बाहर -- a LIVE, reversible flag, separate
// from category='jail' (register) and priorityCategory='jail' (cadence grade).
// Mirrors PermanentStatusModal's mechanics exactly (proposed through the
// approval chain, or applied at once for a super_admin session).
export default function CustodyStatusModal({ cadreId, currentStatus, onClose, onSaved }: CustodyStatusModalProps) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function choose(opt: CustodyStatus) {
    const next = currentStatus === opt ? null : opt;
    setError(null);
    setSubmitting(true);
    try {
      const result = await submitCadreChange(cadreId, { changes: { custodyStatus: next } });
      onSaved(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : "अनुरोध भेजा नहीं जा सका। कृपया पुनः प्रयास करें।");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal title="हिरासत की स्थिति" onClose={onClose} width={440}>
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-1)" }}>
        {OPTIONS.map((opt) => {
          const active = currentStatus === opt;
          return (
            <button
              key={opt}
              onClick={() => choose(opt)}
              disabled={submitting}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "var(--space-3)",
                padding: "var(--space-3)",
                borderRadius: "var(--radius-md)",
                border: "1px solid var(--border)",
                background: active ? "var(--brand-soft)" : "var(--surface)",
                cursor: submitting ? "default" : "pointer",
                textAlign: "left",
                opacity: submitting ? 0.6 : 1,
              }}
            >
              <span style={{ display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
                <span
                  style={{
                    width: 16, height: 16, borderRadius: "50%",
                    border: `1.5px solid ${active ? "var(--brand)" : "var(--border)"}`,
                    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                  }}
                >
                  {active && <span style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--brand)" }} />}
                </span>
                <span style={{ fontSize: "0.8125rem", color: "var(--text-primary)" }}>{CUSTODY_STATUS_LABELS[opt]}</span>
              </span>
              {active && <span className="t-caption">टैप करें हटाने हेतु</span>}
            </button>
          );
        })}
      </div>

      {error && <p className="t-body-sm" style={{ color: "var(--rose)", marginTop: "var(--space-3)" }}>{error}</p>}

      <p className="t-caption" style={{ marginTop: "var(--space-4)" }}>
        यह स्थिति तब तक छिपी रहती है जब तक इसे यहाँ से स्पष्ट रूप से चिह्नित न किया जाए।
      </p>
    </Modal>
  );
}

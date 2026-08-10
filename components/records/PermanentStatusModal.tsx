"use client";

import { useState } from "react";
import Modal from "@/components/ui/Modal";
import { submitCadreChange, type WireCadreChange } from "@/lib/api";
import { PERMANENT_STATUS_LABELS, type PermanentStatus } from "@/lib/cadres";

const OPTIONS: PermanentStatus[] = ["deceased", "government_job", "gs", "living_elsewhere"];

interface PermanentStatusModalProps {
  cadreId: number;
  currentStatus?: PermanentStatus;
  onClose: () => void;
  onSaved: (result: WireCadreChange) => void;
}

// फौत / शासकीय नौकरी / GS / अन्य जिले में निवासरत -- a permanent mark, proposed
// through the approval chain like any other fact (or applied at once for a
// super_admin session -- the backend decides which; this reads `status` off
// the response rather than assuming from role).
export default function PermanentStatusModal({ cadreId, currentStatus, onClose, onSaved }: PermanentStatusModalProps) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function choose(opt: PermanentStatus) {
    const next = currentStatus === opt ? null : opt;
    setError(null);
    setSubmitting(true);
    try {
      const result = await submitCadreChange(cadreId, { changes: { permanentStatus: next } });
      onSaved(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : "अनुरोध भेजा नहीं जा सका। कृपया पुनः प्रयास करें।");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal title="प्रोफ़ाइल को चिह्नित करें" onClose={onClose} width={440}>
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
                <span style={{ fontSize: "0.8125rem", color: "var(--text-primary)" }}>{PERMANENT_STATUS_LABELS[opt]}</span>
              </span>
              {active && <span className="t-caption">टैप करें हटाने हेतु</span>}
            </button>
          );
        })}
      </div>

      {error && <p className="t-body-sm" style={{ color: "var(--rose)", marginTop: "var(--space-3)" }}>{error}</p>}

      <p className="t-caption" style={{ marginTop: "var(--space-4)" }}>
        यह एक स्थायी चिह्न है — इसके बाद इस प्रोफ़ाइल के लिए नियमित रिपोर्टिंग आवश्यक नहीं होगी।
      </p>
    </Modal>
  );
}

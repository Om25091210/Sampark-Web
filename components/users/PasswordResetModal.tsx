"use client";

import { useState } from "react";
import Modal from "./Modal";
import Button from "@/components/ui/Button";
import { setUserPassword, ApiError, type WireUser } from "@/lib/api";

interface PasswordResetModalProps {
  user: WireUser;
  onClose: () => void;
}

// Deliberately its own two-step flow, never bundled into the edit form — a
// security-sensitive action that also revokes every live session for the account
// (see POST /users/:id/password on the backend), mirroring the mobile app's
// discard-with-confirm pattern (ADR-037) for permanent/destructive actions.
export default function PasswordResetModal({ user, onClose }: PasswordResetModalProps) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [step, setStep] = useState<"form" | "confirm">("form");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function validate(): string | null {
    if (password.length < 8) return "पासवर्ड कम से कम 8 अक्षर का हो";
    if (password !== confirm) return "दोनों पासवर्ड मेल नहीं खाते";
    return null;
  }

  function handleNext() {
    const validationError = validate();
    if (validationError !== null) {
      setError(validationError);
      return;
    }
    setError(null);
    setStep("confirm");
  }

  async function handleConfirm() {
    setSaving(true);
    setError(null);
    try {
      await setUserPassword(user.id, password);
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "पासवर्ड सेट करने में त्रुटि हुई");
      setSaving(false);
    }
  }

  return (
    <Modal title={`पासवर्ड रीसेट — ${user.name}`} onClose={onClose} width={400}>
      {step === "form" ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
          <label style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
            <span className="t-caption">नया पासवर्ड</span>
            <input
              className="input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>
          <label style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
            <span className="t-caption">पासवर्ड की पुष्टि करें</span>
            <input
              className="input"
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
            />
          </label>
          {error && (
            <p className="t-body-sm" style={{ color: "var(--rose)" }}>
              {error}
            </p>
          )}
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "var(--space-3)" }}>
            <Button variant="secondary" onClick={onClose}>
              रद्द करें
            </Button>
            <Button variant="primary" onClick={handleNext}>
              आगे बढ़ें
            </Button>
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
          <p className="t-body-sm" style={{ color: "var(--text-secondary)" }}>
            यह {user.name} के सभी सक्रिय सत्र तुरंत समाप्त कर देगा — उपयोगकर्ता को नए पासवर्ड
            से फिर लॉगिन करना होगा। जारी रखें?
          </p>
          {error && (
            <p className="t-body-sm" style={{ color: "var(--rose)" }}>
              {error}
            </p>
          )}
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "var(--space-3)" }}>
            <Button variant="secondary" onClick={() => setStep("form")} disabled={saving}>
              वापस
            </Button>
            <Button variant="danger" onClick={handleConfirm} disabled={saving}>
              {saving ? "प्रतीक्षा करें..." : "पासवर्ड रीसेट करें"}
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}

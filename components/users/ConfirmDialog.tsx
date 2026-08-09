"use client";

import { useState } from "react";
import Modal from "./Modal";
import Button from "@/components/ui/Button";

interface ConfirmDialogProps {
  title: string;
  message: string;
  confirmLabel: string;
  onConfirm: () => Promise<void>;
  onClose: () => void;
}

export default function ConfirmDialog({ title, message, confirmLabel, onConfirm, onClose }: ConfirmDialogProps) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleConfirm() {
    setBusy(true);
    setError(null);
    try {
      await onConfirm();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "त्रुटि हुई");
      setBusy(false);
    }
  }

  return (
    <Modal title={title} onClose={onClose} width={380}>
      <p className="t-body-sm" style={{ color: "var(--text-secondary)", marginBottom: "var(--space-4)" }}>
        {message}
      </p>
      {error && (
        <p className="t-body-sm" style={{ color: "var(--rose)", marginBottom: "var(--space-3)" }}>
          {error}
        </p>
      )}
      <div style={{ display: "flex", justifyContent: "flex-end", gap: "var(--space-3)" }}>
        <Button variant="secondary" onClick={onClose} disabled={busy}>
          रद्द करें
        </Button>
        <Button variant="danger" onClick={handleConfirm} disabled={busy}>
          {busy ? "प्रतीक्षा करें..." : confirmLabel}
        </Button>
      </div>
    </Modal>
  );
}

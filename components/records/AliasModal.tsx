"use client";

import { useState } from "react";
import { X, Plus } from "lucide-react";
import Modal from "@/components/ui/Modal";
import { patchCadreDirect } from "@/lib/api";

interface AliasModalProps {
  cadreId: number;
  initialAliases: string[];
  onClose: () => void;
  onSaved: (aliases: string[]) => void;
}

// ADR-026 direct write (no approval) -- mirrors mobile's AKA-name bottom sheet.
export default function AliasModal({ cadreId, initialAliases, onClose, onSaved }: AliasModalProps) {
  const [draft, setDraft] = useState<string[]>(initialAliases);
  const [input, setInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const dirty =
    draft.length !== initialAliases.length || draft.some((a, i) => a !== initialAliases[i]);

  function addAlias() {
    const trimmed = input.trim();
    if (!trimmed || draft.includes(trimmed)) return;
    setDraft((prev) => [...prev, trimmed]);
    setInput("");
  }

  function removeAlias(index: number) {
    setDraft((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSave() {
    if (!dirty) { onClose(); return; }
    setError(null);
    setSaving(true);
    try {
      await patchCadreDirect(cadreId, { aliases: draft });
      onSaved(draft);
    } catch {
      setError("सहेजा नहीं जा सका। नेटवर्क जांचें और दोबारा प्रयास करें।");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal title="उपनाम / AKA नाम" onClose={onClose} width={440}>
      {draft.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-2)", marginBottom: "var(--space-4)" }}>
          {draft.map((alias, i) => (
            <span
              key={`${alias}-${i}`}
              className="badge badge--neutral"
              style={{ paddingRight: "var(--space-1)" }}
            >
              {alias}
              <button
                onClick={() => removeAlias(i)}
                aria-label={`${alias} हटाएं`}
                style={{ display: "flex", background: "none", border: "none", cursor: "pointer", color: "inherit", padding: "2px" }}
              >
                <X size={11} strokeWidth={2.5} />
              </button>
            </span>
          ))}
        </div>
      )}

      <div style={{ display: "flex", gap: "var(--space-2)" }}>
        <input
          type="text"
          className="input"
          placeholder="नया नाम टाइप करें..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addAlias(); } }}
          autoFocus
        />
        <button className="btn btn--secondary" onClick={addAlias} disabled={!input.trim()} aria-label="जोड़ें">
          <Plus size={16} strokeWidth={2} />
        </button>
      </div>

      {error && <p className="t-body-sm" style={{ color: "var(--rose)", marginTop: "var(--space-3)" }}>{error}</p>}

      <button
        className="btn btn--primary btn--block"
        style={{ marginTop: "var(--space-5)" }}
        onClick={handleSave}
        disabled={saving}
      >
        {saving ? "सहेजा जा रहा है..." : dirty ? "सहेजें" : "हो गया"}
      </button>
    </Modal>
  );
}

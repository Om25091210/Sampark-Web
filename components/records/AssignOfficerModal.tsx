"use client";

import { useEffect, useState } from "react";
import { Search, Check } from "lucide-react";
import Modal from "@/components/ui/Modal";
import { listOfficers, transferCadre, type WireOfficer } from "@/lib/api";
import { getInitials } from "@/lib/cadres";

interface AssignOfficerModalProps {
  cadreId: number;
  currentOfficerId?: number;
  onClose: () => void;
  /** Called once the transfer succeeds, with the newly assigned officer's name. */
  onAssigned: (officer: WireOfficer) => void;
}

// ADR-018. The web equivalent of mobile's OfficerPickerSheet -- reassign a
// cadre to another officer. Admin+ only, but every web session already is
// (ADR-042/056), so this needs no client-side role gate to reach it.
export default function AssignOfficerModal({ cadreId, currentOfficerId, onClose, onAssigned }: AssignOfficerModalProps) {
  const [officers, setOfficers] = useState<WireOfficer[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [submittingId, setSubmittingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listOfficers({ pageSize: 50 })
      .then((res) => setOfficers(res.data))
      .catch(() => setError("अधिकारी सूची लोड नहीं हो सकी।"))
      .finally(() => setLoading(false));
  }, []);

  const filtered = officers.filter((o) => o.name.toLowerCase().includes(search.trim().toLowerCase()));

  async function handleSelect(officer: WireOfficer) {
    setError(null);
    setSubmittingId(officer.id);
    try {
      await transferCadre(cadreId, officer.id);
      onAssigned(officer);
    } catch {
      setError("कैडर सौंपा नहीं जा सका। कृपया पुनः प्रयास करें।");
    } finally {
      setSubmittingId(null);
    }
  }

  return (
    <Modal title="अधिकारी को सौंपें" onClose={onClose} width={480}>
      <div style={{ position: "relative", marginBottom: "var(--space-4)" }}>
        <Search size={16} strokeWidth={1.75} color="var(--text-tertiary)" style={{ position: "absolute", left: "var(--space-3)", top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
        <input
          type="text"
          className="input"
          placeholder="अधिकारी खोजें..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ paddingLeft: "36px" }}
          autoFocus
        />
      </div>

      {error && <p className="t-body-sm" style={{ color: "var(--rose)", marginBottom: "var(--space-3)" }}>{error}</p>}
      {!error && loading && <p className="t-caption">लोड हो रहा है...</p>}
      {!error && !loading && filtered.length === 0 && <p className="t-body-sm" style={{ color: "var(--text-tertiary)" }}>कोई अधिकारी नहीं मिला।</p>}

      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-1)", maxHeight: 360, overflowY: "auto" }}>
        {filtered.map((officer) => {
          const active = officer.id === currentOfficerId;
          const submitting = submittingId === officer.id;
          return (
            <button
              key={officer.id}
              onClick={() => handleSelect(officer)}
              disabled={submittingId !== null}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "var(--space-3)",
                padding: "var(--space-3)",
                borderRadius: "var(--radius-md)",
                border: "1px solid transparent",
                background: active ? "var(--brand-soft)" : "transparent",
                cursor: submittingId !== null ? "default" : "pointer",
                textAlign: "left",
                opacity: submitting ? 0.6 : 1,
              }}
              onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = "var(--surface-hover)"; }}
              onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = "transparent"; }}
            >
              <div
                style={{
                  width: 32, height: 32, borderRadius: "var(--radius-full)",
                  background: "linear-gradient(135deg, var(--brand), var(--navy))",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: "#fff", fontSize: "0.6875rem", fontWeight: 700, flexShrink: 0,
                }}
              >
                {getInitials(officer.name)}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--text-primary)" }}>{officer.name}</div>
                <div className="t-caption">
                  {[officer.designation, officer.thana].filter(Boolean).join(" · ") || "—"} · {officer.assignedCadreCount} कैडर
                </div>
              </div>
              {active && <Check size={16} strokeWidth={2} color="var(--brand-strong)" />}
            </button>
          );
        })}
      </div>
    </Modal>
  );
}

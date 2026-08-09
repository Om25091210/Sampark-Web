"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import Modal from "./Modal";
import Button from "@/components/ui/Button";
import { createUser, updateUser, ApiError, type WireUser } from "@/lib/api";
import { ROLE_OPTIONS, scopeFieldFor, isValidEmail, type UserRole } from "@/lib/users";

interface UserFormModalProps {
  mode: "create" | "edit";
  user?: WireUser;
  onClose: () => void;
  onSaved: () => void;
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
      <span className="t-caption">{label}</span>
      {children}
    </label>
  );
}

export default function UserFormModal({ mode, user, onClose, onSaved }: UserFormModalProps) {
  const [name, setName] = useState(user?.name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>(user?.role ?? "officer");
  const [scopeValue, setScopeValue] = useState(user?.thana ?? user?.subDivision ?? "");
  const [designation, setDesignation] = useState(user?.designation ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const scopeField = scopeFieldFor(role);

  // Basic form completeness only (required fields, email shape) — the org-scope
  // invariant and duplicate-name/email checks are the server's job (users.schema.ts,
  // users.service.ts); their errors surface via the catch below, not re-derived here.
  function validate(): string | null {
    if (mode === "create") {
      if (name.trim() === "") return "संस्थागत आईडी आवश्यक है";
      if (!isValidEmail(email)) return "मान्य ईमेल दर्ज करें";
      if (password !== "" && password.length < 8) return "पासवर्ड कम से कम 8 अक्षर का हो";
    }
    if (scopeField !== null && scopeValue.trim() === "") {
      return scopeField === "thana" ? "थाना आवश्यक है" : "उप-मंडल आवश्यक है";
    }
    return null;
  }

  async function handleSubmit() {
    const validationError = validate();
    if (validationError !== null) {
      setError(validationError);
      return;
    }
    setError(null);
    setSaving(true);
    try {
      if (mode === "create") {
        await createUser({
          name: name.trim(),
          email: email.trim(),
          role,
          password: password !== "" ? password : undefined,
          thana: scopeField === "thana" ? scopeValue.trim() : undefined,
          subDivision: scopeField === "subDivision" ? scopeValue.trim() : undefined,
          designation: designation.trim() !== "" ? designation.trim() : undefined,
        });
      } else if (user) {
        // Always send thana + subDivision explicitly (never omitted) so a role
        // change in this same request correctly clears whichever field no longer
        // applies — the server validates the MERGED state, not just this patch.
        await updateUser(user.id, {
          role,
          thana: scopeField === "thana" ? scopeValue.trim() : null,
          subDivision: scopeField === "subDivision" ? scopeValue.trim() : null,
          designation: designation.trim() !== "" ? designation.trim() : null,
        });
      }
      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "सहेजने में त्रुटि हुई");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal title={mode === "create" ? "नया खाता बनाएं" : "खाता संपादित करें"} onClose={onClose}>
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
        {mode === "create" ? (
          <>
            <Field label="संस्थागत आईडी">
              <input
                className="input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="जैसे SHOGNGL01"
              />
            </Field>
            <Field label="ईमेल">
              <input
                className="input"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </Field>
            <Field label="पासवर्ड (वैकल्पिक)">
              <input
                className="input"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="न दें तो बाद में सेट करें"
              />
            </Field>
          </>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
            <span className="t-caption">संस्थागत आईडी</span>
            <span className="t-body" style={{ fontWeight: 600 }}>
              {user?.name}
            </span>
            <span className="t-caption" style={{ marginTop: "var(--space-2)" }}>
              ईमेल
            </span>
            <span className="t-body-sm">{user?.email}</span>
          </div>
        )}

        <Field label="भूमिका">
          <select className="input" value={role} onChange={(e) => setRole(e.target.value as UserRole)}>
            {ROLE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </Field>

        {scopeField !== null && (
          <Field label={scopeField === "thana" ? "थाना" : "उप-मंडल"}>
            <input className="input" value={scopeValue} onChange={(e) => setScopeValue(e.target.value)} />
          </Field>
        )}

        <Field label="पदनाम (वैकल्पिक)">
          <input className="input" value={designation} onChange={(e) => setDesignation(e.target.value)} />
        </Field>

        {error && (
          <div className="t-body-sm" style={{ color: "var(--rose)" }}>
            {error}
          </div>
        )}

        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: "var(--space-3)",
            marginTop: "var(--space-2)",
          }}
        >
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            रद्द करें
          </Button>
          <Button variant="primary" onClick={handleSubmit} disabled={saving}>
            {saving ? "सहेज रहे हैं..." : "सहेजें"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

// Account (User) label catalogues + basic form-completeness helpers for the web
// User Management page (Phase 5). Business-rule validation (the org-scope
// invariant) stays server-owned — see users.schema.ts's scopeInvariantErrors on
// the backend; this file only decides which scope field a role's form should show.

import type { WireUser } from "./api";

export type UserRole = WireUser["role"];
export type UserStatus = "active" | "deactivated";

export const ROLE_LABELS: Record<UserRole, string> = {
  super_admin: "सुपर एडमिन",
  admin: "एसडीओपी",
  officer: "थाना प्रभारी",
  viewer: "दर्शक",
};

export const ROLE_OPTIONS: { value: UserRole; label: string }[] = [
  { value: "super_admin", label: ROLE_LABELS.super_admin },
  { value: "admin", label: ROLE_LABELS.admin },
  { value: "officer", label: ROLE_LABELS.officer },
  { value: "viewer", label: ROLE_LABELS.viewer },
];

export const STATUS_LABELS: Record<UserStatus, string> = {
  active: "सक्रिय",
  deactivated: "निष्क्रिय",
};

export const STATUS_FILTER_OPTIONS: { value: "active" | "deactivated" | "all"; label: string }[] = [
  { value: "active", label: "सक्रिय" },
  { value: "deactivated", label: "निष्क्रिय" },
  { value: "all", label: "सभी" },
];

export function roleBadgeTone(role: UserRole): "brand" | "success" | "pending" | "neutral" {
  if (role === "super_admin") return "brand";
  if (role === "admin") return "success";
  if (role === "officer") return "pending";
  return "neutral";
}

// role -> which single scope field the form collects. Mirrors the shape of
// scopeInvariantErrors (admin=subDivision, officer=thana, neither for the rest) —
// the server re-validates the merged state regardless, this is only for a sane form.
export function scopeFieldFor(role: UserRole): "thana" | "subDivision" | null {
  if (role === "admin") return "subDivision";
  if (role === "officer") return "thana";
  return null;
}

export function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

// Cadre (surrendered-person) records + filter logic — mirrored from the mobile
// app (Sampark Mobile Application/app/(main)/cadres/[category].tsx) so the web
// Records page shows the same people, fields, and filter behaviour.

export type AlertLevel = "critical" | "warning" | "normal";
export type CadreCategory = "surrendered" | "thana" | "jail";

export interface Cadre {
  id: number;
  name: string;
  phone: string;
  thana: string;
  currentAddress: string;
  designation: string;
  category: CadreCategory;
  alertLevel: AlertLevel;
  alertDate?: string;
  alertTag?: string;
  aliases?: string[];
}

// ─── Filter option catalogues (labels from the mobile MasterFilterSheet) ──────

export const ALERT_LEVELS: { value: AlertLevel; label: string }[] = [
  { value: "critical", label: "उच्च जोखिम" },
  { value: "warning", label: "सतर्कता" },
  { value: "normal", label: "सामान्य" },
];

export const CATEGORY_OPTIONS: { value: CadreCategory; label: string }[] = [
  { value: "surrendered", label: "आत्मसमर्पित" },
  { value: "thana", label: "थाना कैडर" },
  { value: "jail", label: "जेल / बेल" },
];

export const CATEGORY_CHIP: Record<CadreCategory, string> = {
  surrendered: "समर्पित",
  thana: "थाना",
  jail: "जेल",
};

// Alert level → semantic token color + soft tint + Hindi label
export const ALERT_META: Record<AlertLevel, { label: string; color: string; soft: string }> = {
  critical: { label: "उच्च जोखिम", color: "var(--rose)", soft: "var(--rose-soft)" },
  warning: { label: "सतर्कता", color: "var(--amber)", soft: "var(--amber-soft)" },
  normal: { label: "सामान्य", color: "var(--emerald)", soft: "var(--emerald-soft)" },
};

// ─── Profile-only fields (mirrors mobile's src/constants/priority.ts,
// src/constants/permanentStatus.ts, src/types/index.ts's HARDCOPY_DOCS) ───────

export type PriorityCategory = "A" | "B" | "C" | "jail" | "death";
export type PermanentStatus = "deceased" | "government_job" | "gs" | "living_elsewhere";

// ADR-046. The register's कैटेगरी grade — a surrender risk tier, distinct from
// alertLevel. jail/death carry no reporting cadence and never alarm.
export const PRIORITY: Record<PriorityCategory, { label: string; color: string; soft: string }> = {
  A: { label: "A", color: "var(--rose)", soft: "var(--rose-soft)" },
  B: { label: "B", color: "var(--amber)", soft: "var(--amber-soft)" },
  C: { label: "C", color: "var(--emerald)", soft: "var(--emerald-soft)" },
  jail: { label: "जेल", color: "var(--text-tertiary)", soft: "var(--surface-hover)" },
  death: { label: "मृत", color: "var(--text-tertiary)", soft: "var(--surface-hover)" },
};

export const PERMANENT_STATUS_LABELS: Record<PermanentStatus, string> = {
  deceased: "फौत",
  government_job: "शासकीय नौकरी",
  gs: "GS",
  living_elsewhere: "अन्य जिले में निवासरत",
};

// ADR-029. The four hardcopy documents, in the fixed order the profile lists them.
export const HARDCOPY_DOCS: {
  key: "hasAadhaar" | "hasBankAccount" | "hasAbProforma" | "hasAgreementLetter";
  label: string;
}[] = [
  { key: "hasAadhaar", label: "आधार कार्ड" },
  { key: "hasBankAccount", label: "बैंक खाता" },
  { key: "hasAbProforma", label: "AB प्रोफार्मा" },
  { key: "hasAgreementLetter", label: "अनुबंध पत्र" },
];

// ─── Alert tag derivation (mirrors CadreCard.initialTag) ──────────────────────

const CRITICAL_TAGS = ["उल्लंघन", "तत्काल", "लापता", "सक्रिय अलर्ट"];
const WARNING_TAGS = ["निगरानी", "सतर्क", "संदिग्ध", "नज़र रखें"];

export function initialTag(cadre: Cadre): string | null {
  if (cadre.alertTag) return cadre.alertTag;
  if (cadre.alertLevel === "critical") return "सक्रिय अलर्ट";
  if (cadre.alertLevel === "warning") return "नज़र रखें";
  return null;
}

export function tagLevel(tag: string | null): AlertLevel {
  if (!tag) return "normal";
  return CRITICAL_TAGS.includes(tag) ? "critical" : WARNING_TAGS.includes(tag) ? "warning" : "normal";
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function formatDate(iso?: string): string {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? "";
  const second = parts[1]?.[0] ?? "";
  return (first + second) || first;
}

// ─── Filter state + logic (mirrors mobile applyFilter) ────────────────────────

export interface RecordFilters {
  search: string;
  alertLevel: AlertLevel | "all";
  category: CadreCategory[];
  thana: string[];
  /** Dashboard "लंबित रिपोर्टिंग" tile drill-down — web-only, not mirrored from mobile. */
  pendingReporting: boolean;
}

export const EMPTY_FILTERS: RecordFilters = {
  search: "",
  alertLevel: "all",
  category: [],
  thana: [],
  pendingReporting: false,
};

export function activeRefineCount(f: RecordFilters): number {
  return f.category.length + f.thana.length;
}

// Filtering is now server-side (GET /cadres query params) -- applyFilter's
// client-side re-implementation of the same logic is gone. The "@alias" search
// convention is handled server-side too (ADR-033/cadres.service.ts) -- pass
// `filters.search` straight through to the API's `search` param, "@" and all.

// Shared Hindi labels + display helpers for the cadre-change and cadre-create
// approval ladder (ADR-026/027/028) -- used by both the dashboard's quick-accept
// widget (ApprovalQueue) and the full detail page (/approvals). Mirrors the
// mobile app's ChangeRequestCard.tsx FIELD_LABELS so a field reads identically
// on both platforms.

import { CATEGORY_OPTIONS, type CadreCategory } from "@/lib/cadres";

export const FIELD_LABELS: Record<string, string> = {
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
  category: "श्रेणी",
};

export const ROLE_LABELS: Record<string, string> = {
  super_admin: "वरिष्ठ प्रशासक",
  admin: "प्रशासक",
  officer: "अधिकारी",
  viewer: "दर्शक",
};

export const STATUS_LABELS: Record<string, string> = {
  pending: "लंबित",
  applied: "स्वीकृत / लागू",
  rejected: "अस्वीकृत",
  cancelled: "वापस लिया गया",
  stale: "मान बदल चुका",
};

export const STATUS_TONE: Record<string, "pending" | "success" | "danger" | "neutral"> = {
  pending: "pending",
  applied: "success",
  rejected: "danger",
  cancelled: "neutral",
  stale: "danger",
};

const CATEGORY_LABELS: Record<CadreCategory, string> = Object.fromEntries(
  CATEGORY_OPTIONS.map((c) => [c.value, c.label]),
) as Record<CadreCategory, string>;

const GENDER_LABELS: Record<string, string> = { male: "पुरुष", female: "महिला" };

/** `true`/`false` → Hindi; empty → a dash, so "cleared" is visible rather than blank. */
export function displayValue(field: string, v: unknown): string {
  if (v === null || v === undefined || v === "") return "—";
  if (v === true) return "हाँ";
  if (v === false) return "नहीं";
  if (field === "category" && typeof v === "string") return CATEGORY_LABELS[v as CadreCategory] ?? v;
  if (field === "gender" && typeof v === "string") return GENDER_LABELS[v] ?? v;
  if ((field === "surrenderDate" || field === "dateOfBirth") && typeof v === "string") {
    const d = new Date(v);
    if (!Number.isNaN(d.getTime())) {
      return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
    }
  }
  return String(v);
}

export function fieldLabel(field: string): string {
  return FIELD_LABELS[field] ?? field;
}

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

export const CADRES: Cadre[] = [
  {
    id: 1,
    name: "बबलू माडवी",
    phone: "+91-9770784646",
    thana: "बीजापुर / गंगालूर",
    currentAddress: "मचीपाडा थाना गंगालूर जिला बीजापुर छ०ग०",
    designation: "पश्चिम बस्तर डिवीजन डीकेबीसीएम (प्लाटून न०12 कमांडर)",
    category: "surrendered",
    alertLevel: "critical",
    alertDate: "2026-05-16",
    aliases: ["बब्बू", "माडू", "B-12 कमांडर"],
  },
  {
    id: 5,
    name: "महेन्द्र कुमार मड़कम",
    phone: "+91-9753402185",
    thana: "नारायणपुर",
    currentAddress: "ग्राम धनोरा, थाना नारायणपुर, जिला नारायणपुर",
    designation: "दस्ते का सदस्य",
    category: "thana",
    alertLevel: "normal",
    alertDate: "2026-06-02",
  },
  {
    id: 6,
    name: "किरण बाई नेताम",
    phone: "+91-8319641027",
    thana: "दंतेवाड़ा",
    currentAddress: "ग्राम गोमपाड, थाना दंतेवाड़ा, जिला दंतेवाड़ा",
    designation: "महिला संगठन सदस्य",
    category: "surrendered",
    alertLevel: "warning",
    alertDate: "2026-05-28",
  },
  {
    id: 7,
    name: "राजेंद्र कश्यप",
    phone: "+91-7049528963",
    thana: "सुकमा",
    currentAddress: "ग्राम छिंदगढ़, थाना सुकमा, जिला सुकमा",
    designation: "सीनियर कैडर",
    category: "jail",
    alertLevel: "critical",
    alertDate: "2026-06-10",
  },
];

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

export const THANA_OPTIONS = [
  "बीजापुर / गंगालूर",
  "नारायणपुर",
  "दंतेवाड़ा",
  "सुकमा",
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
}

export const EMPTY_FILTERS: RecordFilters = {
  search: "",
  alertLevel: "all",
  category: [],
  thana: [],
};

export function activeRefineCount(f: RecordFilters): number {
  return f.category.length + f.thana.length;
}

export function applyFilter(cadres: Cadre[], f: RecordFilters): Cadre[] {
  const raw = f.search.toLowerCase().trim();
  const isAka = raw.startsWith("@");
  const term = isAka ? raw.slice(1).trim() : raw;

  let list = [...cadres];

  // Text search — "@" prefix searches aliases (matches mobile)
  if (term) {
    list = list.filter((c) => {
      if (isAka) return c.aliases?.some((a) => a.toLowerCase().includes(term)) ?? false;
      return (
        c.name.toLowerCase().includes(term) ||
        c.thana.toLowerCase().includes(term) ||
        c.designation.toLowerCase().includes(term)
      );
    });
  }

  if (f.alertLevel !== "all") list = list.filter((c) => c.alertLevel === f.alertLevel);
  if (f.category.length > 0) list = list.filter((c) => f.category.includes(c.category));
  if (f.thana.length > 0) list = list.filter((c) => f.thana.some((t) => c.thana.includes(t)));

  return list;
}

"use client";

import { use, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Topbar from "@/components/layout/Topbar";
import Container from "@/components/ui/Container";
import {
  getCadre,
  getCadreFacets,
  submitCadreChange,
  type WireCadre,
  type ChangeableCadreFields,
} from "@/lib/api";
import {
  DISTRICTS,
  SUB_DIVISIONS,
  GENDER_LABELS,
  SURRENDER_ORIGIN_LABELS,
  PRIORITY_CATEGORY_OPTION_LABELS,
  HARDCOPY_DOCS,
} from "@/lib/cadres";

interface SelectOption {
  value: string;
  label: string;
}

interface FieldDef {
  key: keyof ChangeableCadreFields;
  label: string;
  type?: "text" | "tel" | "textarea" | "select";
  options?: SelectOption[];
  /** Adds a "— चुनें —" option that clears the field to null. */
  nullable?: boolean;
}

const ALL_FIELD_KEYS: (keyof ChangeableCadreFields)[] = [
  "name", "phone", "priorityCategory", "district", "subDivision", "thana",
  "currentAddress", "permanentAddress", "residingVillage", "designation",
  "verificationOffice", "supervisoryOffice", "incident",
  "surrenderLocation", "surrenderYear", "surrenderOrigin", "familyGroupInfo",
  "gender", "caste", "fatherName", "motherName", "spouseName",
];

const SURRENDER_FIELDS: FieldDef[] = [
  { key: "surrenderLocation", label: "समर्पण स्थान" },
  { key: "surrenderYear", label: "समर्पण वर्ष" },
  {
    key: "surrenderOrigin", label: "समर्पण मूल", type: "select", nullable: true,
    options: (["district", "other"] as const).map((v) => ({ value: v, label: SURRENDER_ORIGIN_LABELS[v] })),
  },
  { key: "familyGroupInfo", label: "परिचितों की जानकारी", type: "textarea" },
];

const PERSONAL_FIELDS: FieldDef[] = [
  {
    key: "gender", label: "लिंग", type: "select", nullable: true,
    options: (["male", "female"] as const).map((v) => ({ value: v, label: GENDER_LABELS[v] })),
  },
  { key: "caste", label: "जाति" },
  { key: "fatherName", label: "पिता का नाम" },
  { key: "motherName", label: "माता का नाम" },
  { key: "spouseName", label: "जीवनसाथी का नाम" },
];

// ADR-036. dateOfBirth/surrenderDate are stored YYYY-MM-DD but proposed as a
// full ISO datetime — normalise both sides to that form so re-picking the
// same day does not read as a change and take a needless lock (ADR-027).
function dobToIso(dateOnlyOrIso?: string | null): string | null {
  if (!dateOnlyOrIso) return null;
  const d = new Date(dateOnlyOrIso);
  return isNaN(d.getTime()) ? null : d.toISOString();
}

function initialFor(cadre: WireCadre, key: keyof ChangeableCadreFields): string {
  const v = cadre[key as keyof WireCadre];
  return typeof v === "string" ? v : "";
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="dash-card">
      <span className="t-overline">{title}</span>
      <div style={{ marginTop: "var(--space-4)", display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
        {children}
      </div>
    </div>
  );
}

function Field({ def, value, onChange }: { def: FieldDef; value: string; onChange: (v: string) => void }) {
  if (def.type === "select") {
    return (
      <label style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
        <span className="t-caption">{def.label}</span>
        <select className="input" value={value} onChange={(e) => onChange(e.target.value)}>
          {def.nullable && <option value="">— चुनें —</option>}
          {def.options?.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </label>
    );
  }
  if (def.type === "textarea") {
    return (
      <label style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
        <span className="t-caption">{def.label}</span>
        <textarea
          className="input"
          rows={3}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          style={{ height: "auto", padding: "var(--space-3) var(--space-4)", resize: "vertical" }}
        />
      </label>
    );
  }
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
      <span className="t-caption">{def.label}</span>
      <input type={def.type === "tel" ? "tel" : "text"} className="input" value={value} onChange={(e) => onChange(e.target.value)} />
    </label>
  );
}

// ADR-026/027. Proposes an edit to the CADRE record. For an admin session the
// change queues for approval; for super_admin it applies at once (still
// recorded). Only the fields that actually changed are sent -- an untouched
// field takes no lock (ADR-027) -- mirroring mobile's edit.tsx exactly, minus
// the three avatarKey photo slots (web offers download, not upload/capture).
export default function CadreEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const cadreId = Number(id);

  const [cadre, setCadre] = useState<WireCadre | null>(null);
  const [thanaOptions, setThanaOptions] = useState<string[]>([]);
  const [values, setValues] = useState<Record<string, string>>({});
  const [dob, setDob] = useState("");
  const [surrenderDate, setSurrenderDate] = useState("");
  const [docs, setDocs] = useState<Partial<Record<(typeof HARDCOPY_DOCS)[number]["key"], boolean>>>({});
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<"applied" | "pending" | null>(null);

  useEffect(() => {
    getCadre(cadreId).then((c) => {
      setCadre(c);
      setDob(c.dateOfBirth ? c.dateOfBirth.slice(0, 10) : "");
      setSurrenderDate(c.surrenderDate ? c.surrenderDate.slice(0, 10) : "");
      const seed: Record<string, string> = {};
      for (const k of ALL_FIELD_KEYS) seed[k] = initialFor(c, k);
      setValues(seed);
    });
    getCadreFacets().then((f) => setThanaOptions(f.thanas)).catch(() => setThanaOptions([]));
  }, [cadreId]);

  const FIELDS: FieldDef[] = useMemo(() => {
    const thanaValues = cadre ? Array.from(new Set([...thanaOptions, cadre.thana])) : thanaOptions;
    return [
      { key: "name", label: "नाम" },
      { key: "phone", label: "मोबाईल नंबर", type: "tel" },
      {
        key: "priorityCategory", label: "प्राथमिकता श्रेणी", type: "select", nullable: true,
        options: (["A", "B", "C", "jail", "death"] as const).map((v) => ({ value: v, label: PRIORITY_CATEGORY_OPTION_LABELS[v] })),
      },
      { key: "district", label: "जिला", type: "select", nullable: true, options: DISTRICTS.map((d) => ({ value: d, label: d })) },
      { key: "subDivision", label: "सब डीवीजन", type: "select", nullable: true, options: SUB_DIVISIONS.map((d) => ({ value: d, label: d })) },
      { key: "thana", label: "थाना", type: "select", options: thanaValues.map((t) => ({ value: t, label: t })) },
      { key: "currentAddress", label: "वर्तमान निवास", type: "textarea" },
      { key: "permanentAddress", label: "स्थायी निवास", type: "textarea" },
      { key: "residingVillage", label: "निवासरत गांव का नाम", type: "textarea" },
      { key: "designation", label: "पद / ज़िम्मेदारी", type: "textarea" },
      { key: "verificationOffice", label: "वेरिफिकेशन स्थान" },
      { key: "supervisoryOffice", label: "पर्यवेक्षक कार्यालय" },
      { key: "incident", label: "संगठन में विभिन्न पद पर कार्य करने का विवरण", type: "textarea" },
    ];
  }, [cadre, thanaOptions]);

  const LABEL_OF: Record<string, string> = useMemo(
    () => Object.fromEntries([...FIELDS, ...SURRENDER_FIELDS, ...PERSONAL_FIELDS].map((f) => [f.key, f.label])),
    [FIELDS],
  );

  const changed: ChangeableCadreFields = useMemo(() => {
    if (!cadre) return {};
    const result: Record<string, unknown> = {};
    for (const k of ALL_FIELD_KEYS) {
      const next = values[k] ?? "";
      const before = initialFor(cadre, k);
      if (next !== before) result[k] = next === "" ? null : next;
    }
    const dobIso = dob ? new Date(dob).toISOString() : null;
    if (dobIso !== dobToIso(cadre.dateOfBirth)) result.dateOfBirth = dobIso;
    const surrIso = surrenderDate ? new Date(surrenderDate).toISOString() : null;
    if (surrIso !== dobToIso(cadre.surrenderDate)) result.surrenderDate = surrIso;
    for (const doc of HARDCOPY_DOCS) {
      const next = docs[doc.key] ?? cadre[doc.key] ?? false;
      if (next !== (cadre[doc.key] ?? false)) result[doc.key] = next;
    }
    return result as ChangeableCadreFields;
  }, [cadre, values, dob, surrenderDate, docs]);

  const changedKeys = Object.keys(changed);
  const isDirty = changedKeys.length > 0;
  const blocked = changedKeys.filter((k) => (cadre?.pendingFields ?? []).includes(k));

  function setField(key: string, v: string) {
    setValues((prev) => ({ ...prev, [key]: v }));
  }

  async function handleSubmit() {
    if (!isDirty || !cadre) return;
    setSubmitting(true);
    setError(null);
    try {
      const result = await submitCadreChange(cadreId, { changes: changed, note: note.trim() || undefined });
      setDone(result.status === "applied" ? "applied" : "pending");
    } catch (e) {
      setError(e instanceof Error ? e.message : "अनुरोध भेजा नहीं जा सका। कृपया पुनः प्रयास करें।");
    } finally {
      setSubmitting(false);
    }
  }

  if (!cadre) {
    return (
      <>
        <Topbar title="प्रोफ़ाइल एडिट" backHref={`/records/${cadreId}/profile`} />
        <div style={{ paddingBlock: "var(--space-8)" }}>
          <Container><p className="t-caption">लोड हो रहा है...</p></Container>
        </div>
      </>
    );
  }

  if (done) {
    return (
      <>
        <Topbar title="प्रोफ़ाइल एडिट" backHref={`/records/${cadreId}/profile`} />
        <div style={{ paddingBlock: "var(--space-8)" }}>
          <Container>
            <div className="dash-card" style={{ maxWidth: 480, textAlign: "center", padding: "var(--space-8)" }}>
              <p className="t-h4" style={{ marginBottom: "var(--space-2)" }}>
                {done === "applied" ? "सहेजा गया" : "अनुमोदन हेतु भेजा गया"}
              </p>
              <p className="t-body-sm" style={{ color: "var(--text-secondary)", marginBottom: "var(--space-5)" }}>
                {done === "applied"
                  ? "प्रोफ़ाइल अपडेट कर दी गई है।"
                  : "आपका अनुरोध अनुमोदन हेतु भेज दिया गया है। स्वीकृति के बाद ही यह लागू होगा।"}
              </p>
              <Link href={`/records/${cadreId}/profile`} className="btn btn--primary">प्रोफ़ाइल पर वापस जाएं</Link>
            </div>
          </Container>
        </div>
      </>
    );
  }

  return (
    <>
      <Topbar title="प्रोफ़ाइल एडिट" subtitle={cadre.name} backHref={`/records/${cadreId}/profile`} />
      <div style={{ paddingBlock: "var(--space-8)" }}>
        <Container>
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-5)", maxWidth: 640 }}>
            {blocked.length > 0 && (
              <div className="badge badge--pending" style={{ alignSelf: "flex-start", padding: "var(--space-2) var(--space-3)" }}>
                इन फ़ील्ड पर पहले से एक अनुरोध लंबित है: {blocked.map((k) => LABEL_OF[k] ?? k).join(", ")}
              </div>
            )}

            <Section title="मूल जानकारी">
              {FIELDS.map((f) => (
                <Field key={f.key} def={f} value={values[f.key] ?? ""} onChange={(v) => setField(f.key, v)} />
              ))}
            </Section>

            {cadre.category === "surrendered" && (
              <Section title="समर्पण विवरण">
                <label style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
                  <span className="t-caption">समर्पण दिनांक</span>
                  <input type="date" className="input" value={surrenderDate} max={new Date().toISOString().slice(0, 10)} onChange={(e) => setSurrenderDate(e.target.value)} />
                </label>
                {SURRENDER_FIELDS.map((f) => (
                  <Field key={f.key} def={f} value={values[f.key] ?? ""} onChange={(v) => setField(f.key, v)} />
                ))}
              </Section>
            )}

            <Section title="व्यक्तिगत विवरण">
              <label style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
                <span className="t-caption">जन्म तिथि</span>
                <input type="date" className="input" value={dob} max={new Date().toISOString().slice(0, 10)} onChange={(e) => setDob(e.target.value)} />
              </label>
              {PERSONAL_FIELDS.map((f) => (
                <Field key={f.key} def={f} value={values[f.key] ?? ""} onChange={(v) => setField(f.key, v)} />
              ))}
            </Section>

            <Section title="दस्तावेज़">
              {HARDCOPY_DOCS.map((d, i) => {
                const value = docs[d.key] ?? cadre[d.key] ?? false;
                return (
                  <label
                    key={d.key}
                    style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: i > 0 ? "var(--space-3)" : 0, borderTop: i > 0 ? "1px solid var(--border)" : undefined, cursor: "pointer" }}
                  >
                    <span style={{ fontSize: "0.8125rem", color: "var(--text-primary)" }}>{d.label}</span>
                    <input
                      type="checkbox"
                      checked={value}
                      onChange={(e) => setDocs((prev) => ({ ...prev, [d.key]: e.target.checked }))}
                      style={{ width: 18, height: 18, accentColor: "var(--brand)" }}
                    />
                  </label>
                );
              })}
            </Section>

            <Section title="टिप्पणी (वैकल्पिक)">
              <textarea
                className="input"
                rows={2}
                placeholder="इस बदलाव के बारे में एक टिप्पणी..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
                style={{ height: "auto", padding: "var(--space-3) var(--space-4)", resize: "vertical" }}
              />
            </Section>

            {error && <p className="t-body-sm" style={{ color: "var(--rose)" }}>{error}</p>}

            <div style={{ display: "flex", gap: "var(--space-3)", paddingBottom: "var(--space-8)" }}>
              <button className="btn btn--primary" onClick={handleSubmit} disabled={!isDirty || submitting}>
                {submitting ? "भेजा जा रहा है..." : "बदलाव सहेजें"}
              </button>
              <Link href={`/records/${cadreId}/profile`} className="btn btn--secondary">रद्द करें</Link>
            </div>
          </div>
        </Container>
      </div>
    </>
  );
}

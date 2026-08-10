"use client";

import { use, useEffect, useState } from "react";
import { Phone, CheckCircle2, Circle } from "lucide-react";
import Topbar from "@/components/layout/Topbar";
import Container from "@/components/ui/Container";
import { getCadre, type WireCadre } from "@/lib/api";
import {
  getInitials,
  initialTag,
  tagLevel,
  formatDate,
  ALERT_META,
  CATEGORY_CHIP,
  PRIORITY,
  PERMANENT_STATUS_LABELS,
  HARDCOPY_DOCS,
} from "@/lib/cadres";

function InfoRow({ label, value }: { label: string; value?: string }) {
  if (!value) return null;
  return (
    <div style={{ fontSize: "0.8125rem", lineHeight: 1.6, padding: "var(--space-2) 0" }}>
      <span style={{ color: "var(--text-tertiary)" }}>{label} : </span>
      <span style={{ color: "var(--text-secondary)" }}>{value}</span>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="dash-card">
      <h3 className="t-h4" style={{ marginBottom: "var(--space-2)" }}>{title}</h3>
      <div>{children}</div>
    </div>
  );
}

// The web equivalent of the mobile app's "प्रोफाइल विवरण" screen
// (app/(main)/cadre/[id]/index.tsx) -- same sections, in the same order, read
// straight off GET /cadres/:id (the same entity the mobile profile reads),
// so "प्रोफाइल देखें" opens the same record on both platforms. Read-only: the
// mobile screen's edit/assign/tag actions go through the ADR-026 approval
// ladder, which the web app already exposes separately on /approvals -- this
// page does not duplicate that write surface.
export default function CadreProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const cadreId = Number(id);

  const [cadre, setCadre] = useState<WireCadre | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    getCadre(cadreId)
      .then(setCadre)
      .catch(() => setNotFound(true));
  }, [cadreId]);

  if (notFound) {
    return (
      <>
        <Topbar title="प्रोफाइल विवरण" backHref={`/records/${cadreId}`} />
        <div style={{ paddingBlock: "var(--space-8)" }}>
          <Container>
            <p className="t-body-sm" style={{ color: "var(--rose)" }}>प्रोफाइल नहीं मिली।</p>
          </Container>
        </div>
      </>
    );
  }

  if (!cadre) {
    return (
      <>
        <Topbar title="प्रोफाइल विवरण" backHref={`/records/${cadreId}`} />
        <div style={{ paddingBlock: "var(--space-8)" }}>
          <Container>
            <p className="t-caption">लोड हो रहा है...</p>
          </Container>
        </div>
      </>
    );
  }

  const tag = initialTag(cadre);
  const accent = ALERT_META[tagLevel(tag)];
  const priority = cadre.priorityCategory ? PRIORITY[cadre.priorityCategory] : null;
  const photos = [cadre.avatarUrl2, cadre.avatarUrl3].filter((u): u is string => !!u);
  const docsHeld = HARDCOPY_DOCS.filter((d) => cadre[d.key] === true).length;

  const personalRows: { label: string; value?: string }[] = [
    { label: "आयु", value: cadre.age !== undefined ? `${cadre.age} वर्ष` : undefined },
    { label: "जन्म तिथि", value: formatDate(cadre.dateOfBirth) || undefined },
    { label: "पिता का नाम", value: cadre.fatherName },
    { label: "माता का नाम", value: cadre.motherName },
    { label: "जीवनसाथी का नाम", value: cadre.spouseName },
  ].filter((r) => r.value);

  const officialRows: { label: string; value?: string }[] = [
    { label: "थाना", value: cadre.thana },
    { label: "सब डीवीजन", value: cadre.subDivision },
    { label: "कैटेगरी", value: priority?.label },
    { label: "स्थायी चिह्न", value: cadre.permanentStatus ? PERMANENT_STATUS_LABELS[cadre.permanentStatus] : undefined },
    { label: "पद / ज़िम्मेदारी", value: cadre.designation },
    { label: "वेरिफिकेशन स्थान", value: cadre.verificationOffice },
    { label: "पर्यवेक्षक कार्यालय", value: cadre.supervisoryOffice },
  ].filter((r) => r.value);

  return (
    <>
      <Topbar title="प्रोफाइल विवरण" subtitle={cadre.name} backHref={`/records/${cadreId}`} />
      <div style={{ paddingBlock: "var(--space-8)" }}>
        <Container>
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-5)", maxWidth: 680 }}>
            {/* Hero */}
            <div className="dash-card">
              <div style={{ display: "flex", alignItems: "flex-start", gap: "var(--space-4)" }}>
                {cadre.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={cadre.avatarUrl}
                    alt={cadre.name}
                    style={{ width: 72, height: 72, borderRadius: "var(--radius-full)", objectFit: "cover", flexShrink: 0 }}
                  />
                ) : (
                  <div
                    style={{
                      width: 72,
                      height: 72,
                      borderRadius: "var(--radius-full)",
                      background: "linear-gradient(135deg, var(--brand), var(--navy))",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#fff",
                      fontSize: "1.125rem",
                      fontWeight: 700,
                      flexShrink: 0,
                    }}
                  >
                    {getInitials(cadre.name)}
                  </div>
                )}

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", flexWrap: "wrap" }}>
                    <h2 className="t-h3">{cadre.name}</h2>
                    {cadre.serialNumber && (
                      <span className="badge badge--neutral tabular-nums">क्र. सं. {cadre.serialNumber}</span>
                    )}
                  </div>

                  {cadre.aliases.length > 0 && (
                    <p className="t-caption" style={{ marginTop: "2px" }}>aka: {cadre.aliases.join(" • ")}</p>
                  )}
                  {cadre.designation && (
                    <p className="t-body-sm" style={{ marginTop: "4px", color: "var(--text-secondary)" }}>
                      {cadre.designation}
                    </p>
                  )}

                  <div style={{ display: "flex", gap: "var(--space-2)", flexWrap: "wrap", marginTop: "var(--space-3)" }}>
                    {priority && (
                      <span className="badge" style={{ background: priority.soft, color: priority.color }}>
                        कैटेगरी {priority.label}
                      </span>
                    )}
                    {tag && (
                      <span className="badge" style={{ background: accent.soft, color: accent.color }}>
                        <span style={{ width: 5, height: 5, borderRadius: "50%", background: accent.color }} />
                        {tag}
                      </span>
                    )}
                    <span className="badge badge--brand">{CATEGORY_CHIP[cadre.category]}</span>
                  </div>

                  {cadre.lastReportedAt && (
                    <p className="t-caption tabular-nums" style={{ marginTop: "var(--space-3)" }}>
                      अंतिम रिपोर्टिंग तिथि : {formatDate(cadre.lastReportedAt)}
                    </p>
                  )}

                  {cadre.phone && (
                    <a
                      href={`tel:${cadre.phone.replace(/\s/g, "")}`}
                      className="btn btn--secondary btn--sm"
                      style={{ marginTop: "var(--space-4)", display: "inline-flex", alignItems: "center", gap: "var(--space-2)", textDecoration: "none" }}
                    >
                      <Phone size={14} strokeWidth={1.75} />
                      कॉल करें
                    </a>
                  )}
                </div>
              </div>
            </div>

            {/* Documents (ADR-029) */}
            <Section title="दस्तावेज़">
              <div style={{ display: "flex", flexDirection: "column" }}>
                {HARDCOPY_DOCS.map((d, i) => {
                  const held = cadre[d.key] === true;
                  const pending = (cadre.pendingFields ?? []).includes(d.key);
                  return (
                    <div
                      key={d.key}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "var(--space-3) 0",
                        borderTop: i > 0 ? "1px solid var(--border)" : undefined,
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
                        {held ? (
                          <CheckCircle2 size={16} strokeWidth={1.75} color="var(--emerald)" />
                        ) : (
                          <Circle size={16} strokeWidth={1.75} color="var(--text-tertiary)" />
                        )}
                        <span style={{ fontSize: "0.8125rem", color: "var(--text-secondary)" }}>{d.label}</span>
                      </div>
                      {pending && <span className="badge badge--pending">लंबित</span>}
                    </div>
                  );
                })}
              </div>
              <p className="t-caption" style={{ marginTop: "var(--space-2)" }}>{docsHeld} / {HARDCOPY_DOCS.length} उपलब्ध</p>
            </Section>

            {/* Additional photos (ADR-054) */}
            {photos.length > 0 && (
              <Section title="अन्य फ़ोटो">
                <div style={{ display: "flex", gap: "var(--space-3)" }}>
                  {photos.map((url) => (
                    <a key={url} href={url} target="_blank" rel="noopener noreferrer">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={url}
                        alt="कैडर फ़ोटो"
                        style={{ width: 88, height: 88, borderRadius: "var(--radius-lg)", objectFit: "cover" }}
                      />
                    </a>
                  ))}
                </div>
              </Section>
            )}

            {/* Pending edits (ADR-027) */}
            {(cadre.pendingFields ?? []).length > 0 && (
              <div
                className="badge badge--pending"
                style={{ alignSelf: "flex-start", padding: "var(--space-2) var(--space-3)" }}
              >
                {(cadre.pendingFields ?? []).length} फ़ील्ड में बदलाव अनुमोदन हेतु लंबित है
              </div>
            )}

            {cadre.lastEditedAt && (
              <p className="t-caption">
                अंतिम बदलाव : {formatDate(cadre.lastEditedAt)}
                {cadre.lastEditedBy ? ` — ${cadre.lastEditedBy.name}` : ""}
              </p>
            )}

            {/* Incident */}
            {cadre.incident && (
              <Section title="संगठन में विभिन्न पद पर कार्य करने का विवरण">
                <p style={{ fontSize: "0.8125rem", lineHeight: 1.6, color: "var(--text-secondary)" }}>{cadre.incident}</p>
              </Section>
            )}

            {/* Contact & residence */}
            <Section title="संपर्क एवं निवास विवरण">
              <InfoRow label="वर्तमान निवास" value={cadre.currentAddress} />
              <InfoRow label="स्थायी निवास" value={cadre.permanentAddress} />
              <InfoRow label="मोबाईल नंबर" value={cadre.phone} />
            </Section>

            {/* Personal details (ADR-036) */}
            {personalRows.length > 0 && (
              <Section title="व्यक्तिगत विवरण">
                {personalRows.map((r) => (
                  <InfoRow key={r.label} label={r.label} value={r.value} />
                ))}
              </Section>
            )}

            {/* Official & administrative */}
            {officialRows.length > 0 && (
              <Section title="आधिकारिक एवं प्रशासनिक विवरण">
                {officialRows.map((r) => (
                  <InfoRow key={r.label} label={r.label} value={r.value} />
                ))}
              </Section>
            )}

            {/* Aliases */}
            {cadre.aliases.length > 0 && (
              <Section title="उपनाम / अन्य नाम">
                <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-2)" }}>
                  {cadre.aliases.map((alias, i) => (
                    <span key={i} className="badge badge--neutral">{alias}</span>
                  ))}
                </div>
              </Section>
            )}

            {/* Surrender details */}
            {cadre.category === "surrendered" && (
              <Section title="पद विवरण">
                <InfoRow label="दिनांक" value={formatDate(cadre.surrenderDate)} />
                <InfoRow label="स्थान" value={cadre.surrenderLocation} />
                <InfoRow label="वर्ष" value={cadre.surrenderYear} />
                <InfoRow label="परिचितों की जानकारी" value={cadre.familyGroupInfo} />
              </Section>
            )}
          </div>
        </Container>
      </div>
    </>
  );
}

"use client";

import { use, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  Phone,
  CheckCircle2,
  Circle,
  MoreVertical,
  Pencil,
  ArrowLeftRight,
  AtSign,
  Bookmark,
  Download,
} from "lucide-react";
import Topbar from "@/components/layout/Topbar";
import Container from "@/components/ui/Container";
import AssignOfficerModal from "@/components/records/AssignOfficerModal";
import AliasModal from "@/components/records/AliasModal";
import PermanentStatusModal from "@/components/records/PermanentStatusModal";
import { getCadre, type WireCadre, type WireOfficer } from "@/lib/api";
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
      <span className="t-overline">{title}</span>
      <div style={{ marginTop: "var(--space-3)" }}>{children}</div>
    </div>
  );
}

async function downloadImage(url: string, filename: string) {
  try {
    const res = await fetch(url);
    const blob = await res.blob();
    const objectUrl = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = objectUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(objectUrl);
  } catch {
    window.open(url, "_blank");
  }
}

function DownloadBtn({ onClick, size = 28 }: { onClick: () => void; size?: number }) {
  return (
    <button
      onClick={(e) => { e.preventDefault(); e.stopPropagation(); onClick(); }}
      aria-label="फ़ोटो डाउनलोड करें"
      style={{
        position: "absolute",
        bottom: 2,
        right: 2,
        width: size,
        height: size,
        borderRadius: "var(--radius-full)",
        background: "var(--text-primary)",
        color: "#fff",
        border: "2px solid var(--surface)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
      }}
    >
      <Download size={13} strokeWidth={2} />
    </button>
  );
}

// The web equivalent of the mobile app's "प्रोफाइल विवरण" screen
// (app/(main)/cadre/[id]/index.tsx) -- same sections + the same three-dot menu
// actions (edit / assign / AKA names / permanent mark), reading and writing the
// same GET /cadres/:id, POST /cadres/:id/changes, PATCH /cadres/:id, and
// POST /cadres/:id/transfer the mobile screen uses. Photo upload is the one
// mobile capability NOT mirrored here (web offers download, not capture).
export default function CadreProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const cadreId = Number(id);

  const [cadre, setCadre] = useState<WireCadre | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
  const [aliasOpen, setAliasOpen] = useState(false);
  const [statusOpen, setStatusOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const refetch = useCallback(() => {
    return getCadre(cadreId)
      .then(setCadre)
      .catch(() => setNotFound(true));
  }, [cadreId]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(t);
  }, [toast]);

  function handleAssigned(officer: WireOfficer) {
    setAssignOpen(false);
    setToast(`${officer.name} को सौंपा गया।`);
  }

  function handleAliasSaved(aliases: string[]) {
    setAliasOpen(false);
    setCadre((prev) => (prev ? { ...prev, aliases } : prev));
    setToast("उपनाम सहेजे गए।");
  }

  function handleStatusSaved(result: { status: string }) {
    setStatusOpen(false);
    refetch();
    setToast(result.status === "applied" ? "सहेजा गया।" : "अनुमोदन हेतु भेजा गया।");
  }

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
  const extraPhotos = [cadre.avatarUrl2, cadre.avatarUrl3].filter((u): u is string => !!u);
  const docsHeld = HARDCOPY_DOCS.filter((d) => cadre[d.key] === true).length;
  const fileBase = `sampark_${cadre.name.replace(/\s+/g, "_")}`;

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
          <div style={{ display: "flex", gap: "var(--space-6)", alignItems: "flex-start", flexWrap: "wrap" }}>
            {/* ── Left rail: identity ─────────────────────────────────────── */}
            <div style={{ width: 320, flexShrink: 0, display: "flex", flexDirection: "column", gap: "var(--space-5)" }}>
              <div className="dash-card" style={{ padding: 0, overflow: "hidden", position: "relative" }}>
                <div style={{ height: 64, background: "linear-gradient(135deg, var(--brand), var(--navy))" }} />

                {/* Actions menu */}
                <div style={{ position: "absolute", top: "var(--space-3)", right: "var(--space-3)" }}>
                  <button
                    onClick={() => setMenuOpen((v) => !v)}
                    aria-label="अधिक विकल्प"
                    style={{
                      width: 32, height: 32, borderRadius: "var(--radius-full)",
                      background: "rgba(255,255,255,0.22)", border: "none", cursor: "pointer",
                      display: "flex", alignItems: "center", justifyContent: "center", color: "#fff",
                    }}
                  >
                    <MoreVertical size={16} strokeWidth={2} />
                  </button>
                  {menuOpen && (
                    <>
                      <div onClick={() => setMenuOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 20 }} />
                      <div
                        className="card card--elevated"
                        style={{ position: "absolute", top: 38, right: 0, width: 220, padding: "var(--space-2)", zIndex: 21 }}
                      >
                        <Link
                          href={`/records/${cadreId}/edit`}
                          style={{ display: "flex", alignItems: "center", gap: "var(--space-3)", padding: "var(--space-3)", borderRadius: "var(--radius-md)", textDecoration: "none", color: "var(--text-primary)", fontSize: "0.8125rem" }}
                          onMouseEnter={(e) => (e.currentTarget.style.background = "var(--surface-hover)")}
                          onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                        >
                          <Pencil size={15} strokeWidth={1.75} color="var(--brand-strong)" />
                          प्रोफ़ाइल एडिट
                        </Link>
                        <button
                          onClick={() => { setMenuOpen(false); setAssignOpen(true); }}
                          style={{ display: "flex", alignItems: "center", gap: "var(--space-3)", padding: "var(--space-3)", borderRadius: "var(--radius-md)", background: "none", border: "none", cursor: "pointer", width: "100%", textAlign: "left", color: "var(--text-primary)", fontSize: "0.8125rem" }}
                          onMouseEnter={(e) => (e.currentTarget.style.background = "var(--surface-hover)")}
                          onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                        >
                          <ArrowLeftRight size={15} strokeWidth={1.75} color="var(--brand-strong)" />
                          अधिकारी को सौंपें
                        </button>
                        <button
                          onClick={() => { setMenuOpen(false); setAliasOpen(true); }}
                          style={{ display: "flex", alignItems: "center", gap: "var(--space-3)", padding: "var(--space-3)", borderRadius: "var(--radius-md)", background: "none", border: "none", cursor: "pointer", width: "100%", textAlign: "left", color: "var(--text-primary)", fontSize: "0.8125rem" }}
                          onMouseEnter={(e) => (e.currentTarget.style.background = "var(--surface-hover)")}
                          onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                        >
                          <AtSign size={15} strokeWidth={1.75} color="var(--brand-strong)" />
                          AKA नाम जोड़ें
                        </button>
                        <button
                          onClick={() => { setMenuOpen(false); setStatusOpen(true); }}
                          style={{ display: "flex", alignItems: "center", gap: "var(--space-3)", padding: "var(--space-3)", borderRadius: "var(--radius-md)", background: "none", border: "none", cursor: "pointer", width: "100%", textAlign: "left", color: "var(--text-primary)", fontSize: "0.8125rem" }}
                          onMouseEnter={(e) => (e.currentTarget.style.background = "var(--surface-hover)")}
                          onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                        >
                          <Bookmark size={15} strokeWidth={1.75} color="var(--brand-strong)" />
                          प्रोफ़ाइल को चिह्नित करें
                        </button>
                      </div>
                    </>
                  )}
                </div>

                <div style={{ padding: "0 var(--space-5) var(--space-5)", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
                  <div style={{ position: "relative", marginTop: -36 }}>
                    {cadre.avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={cadre.avatarUrl}
                        alt={cadre.name}
                        style={{ width: 72, height: 72, borderRadius: "var(--radius-full)", objectFit: "cover", border: "3px solid var(--surface)" }}
                      />
                    ) : (
                      <div
                        style={{
                          width: 72, height: 72, borderRadius: "var(--radius-full)",
                          background: "linear-gradient(135deg, var(--brand), var(--navy))",
                          border: "3px solid var(--surface)",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          color: "#fff", fontSize: "1.125rem", fontWeight: 700,
                        }}
                      >
                        {getInitials(cadre.name)}
                      </div>
                    )}
                    {cadre.avatarUrl && (
                      <DownloadBtn onClick={() => downloadImage(cadre.avatarUrl!, `${fileBase}.jpg`)} />
                    )}
                  </div>

                  <h2 className="t-h3" style={{ marginTop: "var(--space-3)" }}>{cadre.name}</h2>
                  {cadre.serialNumber && (
                    <span className="badge badge--neutral tabular-nums" style={{ marginTop: "var(--space-2)" }}>क्र. सं. {cadre.serialNumber}</span>
                  )}
                  {cadre.aliases.length > 0 && (
                    <p className="t-caption" style={{ marginTop: "var(--space-2)" }}>aka: {cadre.aliases.join(" • ")}</p>
                  )}
                  {cadre.designation && (
                    <p className="t-body-sm" style={{ marginTop: "4px", color: "var(--text-secondary)" }}>{cadre.designation}</p>
                  )}

                  <div style={{ display: "flex", gap: "var(--space-2)", flexWrap: "wrap", justifyContent: "center", marginTop: "var(--space-3)" }}>
                    {priority && (
                      <span className="badge" style={{ background: priority.soft, color: priority.color }}>कैटेगरी {priority.label}</span>
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
                      className="btn btn--secondary btn--sm btn--block"
                      style={{ marginTop: "var(--space-4)", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "var(--space-2)", textDecoration: "none" }}
                    >
                      <Phone size={14} strokeWidth={1.75} />
                      कॉल करें
                    </a>
                  )}
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
                          display: "flex", alignItems: "center", justifyContent: "space-between",
                          padding: "var(--space-3) 0", borderTop: i > 0 ? "1px solid var(--border)" : undefined,
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
              {extraPhotos.length > 0 && (
                <Section title="अन्य फ़ोटो">
                  <div style={{ display: "flex", gap: "var(--space-3)" }}>
                    {extraPhotos.map((url, i) => (
                      <div key={url} style={{ position: "relative" }}>
                        <a href={url} target="_blank" rel="noopener noreferrer">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={url} alt="कैडर फ़ोटो" style={{ width: 88, height: 88, borderRadius: "var(--radius-lg)", objectFit: "cover" }} />
                        </a>
                        <DownloadBtn onClick={() => downloadImage(url, `${fileBase}_${i + 2}.jpg`)} size={24} />
                      </div>
                    ))}
                  </div>
                </Section>
              )}

              {(cadre.pendingFields ?? []).length > 0 && (
                <div className="badge badge--pending" style={{ alignSelf: "flex-start", padding: "var(--space-2) var(--space-3)" }}>
                  {(cadre.pendingFields ?? []).length} फ़ील्ड में बदलाव अनुमोदन हेतु लंबित है
                </div>
              )}

              {cadre.lastEditedAt && (
                <p className="t-caption">
                  अंतिम बदलाव : {formatDate(cadre.lastEditedAt)}
                  {cadre.lastEditedBy ? ` — ${cadre.lastEditedBy.name}` : ""}
                </p>
              )}
            </div>

            {/* ── Right column: details ───────────────────────────────────── */}
            <div style={{ flex: 1, minWidth: 320, display: "flex", flexDirection: "column", gap: "var(--space-5)" }}>
              {cadre.incident && (
                <Section title="संगठन में विभिन्न पद पर कार्य करने का विवरण">
                  <p style={{ fontSize: "0.8125rem", lineHeight: 1.6, color: "var(--text-secondary)" }}>{cadre.incident}</p>
                </Section>
              )}

              <Section title="संपर्क एवं निवास विवरण">
                <InfoRow label="वर्तमान निवास" value={cadre.currentAddress} />
                <InfoRow label="स्थायी निवास" value={cadre.permanentAddress} />
                <InfoRow label="मोबाईल नंबर" value={cadre.phone} />
              </Section>

              {personalRows.length > 0 && (
                <Section title="व्यक्तिगत विवरण">
                  {personalRows.map((r) => <InfoRow key={r.label} label={r.label} value={r.value} />)}
                </Section>
              )}

              {officialRows.length > 0 && (
                <Section title="आधिकारिक एवं प्रशासनिक विवरण">
                  {officialRows.map((r) => <InfoRow key={r.label} label={r.label} value={r.value} />)}
                </Section>
              )}

              {cadre.aliases.length > 0 && (
                <Section title="उपनाम / अन्य नाम">
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-2)" }}>
                    {cadre.aliases.map((alias, i) => <span key={i} className="badge badge--neutral">{alias}</span>)}
                  </div>
                </Section>
              )}

              {cadre.category === "surrendered" && (
                <Section title="पद विवरण">
                  <InfoRow label="दिनांक" value={formatDate(cadre.surrenderDate)} />
                  <InfoRow label="स्थान" value={cadre.surrenderLocation} />
                  <InfoRow label="वर्ष" value={cadre.surrenderYear} />
                  <InfoRow label="परिचितों की जानकारी" value={cadre.familyGroupInfo} />
                </Section>
              )}
            </div>
          </div>
        </Container>
      </div>

      {assignOpen && (
        <AssignOfficerModal
          cadreId={cadreId}
          currentOfficerId={cadre.assignedOfficerId}
          onClose={() => setAssignOpen(false)}
          onAssigned={handleAssigned}
        />
      )}
      {aliasOpen && (
        <AliasModal
          cadreId={cadreId}
          initialAliases={cadre.aliases}
          onClose={() => setAliasOpen(false)}
          onSaved={handleAliasSaved}
        />
      )}
      {statusOpen && (
        <PermanentStatusModal
          cadreId={cadreId}
          currentStatus={cadre.permanentStatus}
          onClose={() => setStatusOpen(false)}
          onSaved={handleStatusSaved}
        />
      )}

      {toast && (
        <div
          style={{
            position: "fixed", bottom: "var(--space-6)", right: "var(--space-6)", zIndex: 200,
            background: "var(--text-primary)", color: "#fff", padding: "var(--space-3) var(--space-5)",
            borderRadius: "var(--radius-lg)", boxShadow: "var(--shadow-lg)", fontSize: "0.8125rem",
          }}
        >
          {toast}
        </div>
      )}
    </>
  );
}

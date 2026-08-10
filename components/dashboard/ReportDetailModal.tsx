"use client";

import { Phone, MapPin, ImageOff } from "lucide-react";
import Modal from "@/components/ui/Modal";
import Badge from "@/components/ui/Badge";
import type { WireReport } from "@/lib/api";
import { getInitials } from "@/lib/cadres";

const PLACE_LABEL: Record<WireReport["reportingPlace"], string> = {
  thana: "थाना",
  village: "गांव",
};

const STATUS_TONE: Record<WireReport["personStatus"], "success" | "danger"> = {
  alive: "success",
  dead: "danger",
};

const STATUS_LABEL: Record<WireReport["personStatus"], string> = {
  alive: "जीवित",
  dead: "मृत",
};

/** `9 जुलाई 2026, 14:30` — 24-hour clock, matching the mobile detail screen. */
function formatStamp(iso: string): string {
  const d = new Date(iso);
  const date = d.toLocaleDateString("hi-IN", { day: "numeric", month: "long", year: "numeric" });
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${date}, ${hh}:${mm}`;
}

function photosOf(report: WireReport): string[] {
  if (report.photoUrls?.length) return report.photoUrls;
  return report.photoUrl ? [report.photoUrl] : [];
}

function Section({ title, trailing, children }: { title: string; trailing?: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <span className="t-overline">{title}</span>
        {trailing && <span className="t-caption">{trailing}</span>}
      </div>
      {children}
    </div>
  );
}

function InfoRow({ label, value, action }: { label: string; value?: string; action?: React.ReactNode }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "var(--space-3)",
        padding: "var(--space-3) 0",
        borderBottom: "1px solid var(--border)",
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="t-caption" style={{ marginBottom: "2px" }}>{label}</div>
        <div style={{ fontSize: "0.875rem", color: "var(--text-primary)", fontWeight: 500 }}>
          {value?.trim() ? value : "—"}
        </div>
      </div>
      {action}
    </div>
  );
}

interface ReportDetailModalProps {
  report: WireReport;
  onClose: () => void;
}

// The web equivalent of the mobile app's "view reporting screen"
// (app/(main)/cadre/[id]/report/[rid].tsx) -- same field set, same section
// order, so the record reads identically on both platforms. No extra network
// call: GET /reports already returns every one of these fields per row
// (lib/serialize.ts's toWireReport, shared with the single-report endpoint),
// so the row already clicked carries everything this modal needs.
export default function ReportDetailModal({ report, onClose }: ReportDetailModalProps) {
  const photos = photosOf(report);
  const gps = report.gpsCoords;
  const mapsUrl = gps ? `https://www.google.com/maps/search/?api=1&query=${gps.latitude},${gps.longitude}` : null;

  return (
    <Modal title={`रिपोर्ट #${report.id}`} onClose={onClose} width={620}>
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-5)" }}>
        {/* Identity + status */}
        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: "var(--radius-full)",
              background: "linear-gradient(135deg, var(--brand), var(--navy))",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              fontSize: "0.8125rem",
              fontWeight: 700,
              flexShrink: 0,
            }}
          >
            {report.cadre ? getInitials(report.cadre.name) : "?"}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: "0.9375rem", fontWeight: 700, color: "var(--text-primary)" }}>
              {report.cadre?.name ?? `कैडर #${report.cadreId}`}
            </div>
            <div className="t-caption tabular-nums">{formatStamp(report.reportedAt)}</div>
          </div>
          <div style={{ display: "flex", gap: "var(--space-2)", flexShrink: 0 }}>
            <Badge tone={STATUS_TONE[report.personStatus]}>{STATUS_LABEL[report.personStatus]}</Badge>
            <Badge tone="neutral">{PLACE_LABEL[report.reportingPlace]}</Badge>
          </div>
        </div>

        {/* Photos */}
        <Section title="फोटो" trailing={photos.length ? String(photos.length) : undefined}>
          {photos.length > 0 ? (
            <div style={{ display: "flex", gap: "var(--space-3)", overflowX: "auto", paddingBottom: "2px" }}>
              {photos.map((url) => (
                <a key={url} href={url} target="_blank" rel="noopener noreferrer">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={url}
                    alt="रिपोर्ट फ़ोटो"
                    style={{ width: 88, height: 88, borderRadius: "var(--radius-lg)", objectFit: "cover", flexShrink: 0 }}
                  />
                </a>
              ))}
            </div>
          ) : (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "var(--space-2)",
                border: "1.5px dashed var(--border)",
                borderRadius: "var(--radius-lg)",
                padding: "var(--space-4)",
                color: "var(--text-tertiary)",
              }}
            >
              <ImageOff size={18} strokeWidth={1.75} />
              <span className="t-body-sm">कोई फोटो संलग्न नहीं</span>
            </div>
          )}
        </Section>

        {/* Reporting details */}
        <Section title="रिपोर्टिंग विवरण">
          <InfoRow label="रिपोर्टिंग स्थान" value={report.specificLocation} />
          <InfoRow
            label="वर्तमान फ़ोन नम्बर"
            value={report.currentPhone}
            action={
              <a
                href={`tel:${report.currentPhone.replace(/\s/g, "")}`}
                aria-label="कॉल करें"
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: "var(--radius-full)",
                  background: "var(--brand-soft)",
                  color: "var(--brand-strong)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <Phone size={16} strokeWidth={1.75} />
              </a>
            }
          />
        </Section>

        {/* ADR-050: split fields, same as mobile -- shown only when filled */}
        {report.surrenderNetworkDetails?.trim() && (
          <Section title="अन्य माओवादियों से समर्पण हुआ विवरण">
            <p style={{ fontSize: "0.875rem", color: "var(--text-primary)", lineHeight: 1.6 }}>
              {report.surrenderNetworkDetails.trim()}
            </p>
          </Section>
        )}

        <Section title="वर्तमान में क्या काम करता है?">
          <p style={{ fontSize: "0.875rem", color: "var(--text-primary)", lineHeight: 1.6 }}>
            {report.currentActivity?.trim() || "—"}
          </p>
        </Section>

        {report.otherInformation?.trim() && (
          <Section title="अन्य जानकारी">
            <p style={{ fontSize: "0.875rem", color: "var(--text-primary)", lineHeight: 1.6 }}>
              {report.otherInformation.trim()}
            </p>
          </Section>
        )}

        {/* GPS */}
        {gps && (
          <Section title="दर्ज लोकेशन">
            <div
              style={{
                border: "1px solid var(--border)",
                borderRadius: "var(--radius-lg)",
                padding: "var(--space-4)",
                display: "flex",
                flexDirection: "column",
                gap: "var(--space-3)",
              }}
            >
              <div style={{ display: "flex", alignItems: "flex-start", gap: "var(--space-2)" }}>
                <MapPin size={16} strokeWidth={1.75} color="var(--brand)" style={{ flexShrink: 0, marginTop: "2px" }} />
                <span style={{ fontSize: "0.875rem", color: "var(--text-primary)", flex: 1 }}>{gps.address || "—"}</span>
                {report.isHomeAddress && <Badge tone="brand">घर का पता</Badge>}
              </div>
              <div className="t-caption tabular-nums">
                {gps.latitude.toFixed(5)}° N, {gps.longitude.toFixed(5)}° E
              </div>
              {mapsUrl && (
                <a
                  href={mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn--secondary btn--sm"
                  style={{ alignSelf: "flex-start", textDecoration: "none" }}
                >
                  मानचित्र पर देखें
                </a>
              )}
            </div>
          </Section>
        )}
      </div>
    </Modal>
  );
}

"use client";

import { useEffect, useState } from "react";
import Button from "@/components/ui/Button";
import {
  ApiError,
  getSheetPreview,
  startCadreSheetExport,
  type CadreExportSummary,
  type SheetPreview,
  type WireSyncLogEntry,
} from "@/lib/api";

const POLL_MS = 5000;
const PREVIEW_LIMIT = 20;

// Mirrors the backend's MIRROR_TABS (cadre-export.tabs.ts) -- one tab per category.
const TAB_LABELS: Record<string, string> = {
  "Cadre-Surrendered": "आत्मसमर्पित (बीजापुर)",
  "Cadre-OtherDistrict": "आत्मसमर्पित (दीगर जिला)",
  "Cadre-OtherState": "आत्मसमर्पित (दीगर राज्य)",
  "Cadre-Thana": "थाना स्तर",
  "Cadre-Jail": "जेल / जमानत",
  "Cadre-Unclassified": "अवर्गीकृत",
};

// The sync log is shared history: rows written before the per-category export stored a flat
// list of per-cadre outcomes (or nothing) in `detail`. Trusting the shape crashed the page
// (Object.entries(undefined)), so the summary is shown only when every field it reads is real.
function asExportSummary(detail: unknown): CadreExportSummary | null {
  if (typeof detail !== "object" || detail === null || Array.isArray(detail)) return null;
  const d = detail as Record<string, unknown>;
  if (
    typeof d.total !== "number" ||
    typeof d.errors !== "number" ||
    typeof d.byTab !== "object" ||
    d.byTab === null ||
    !Array.isArray(d.errorSamples)
  ) {
    return null;
  }
  return {
    total: d.total,
    errors: d.errors,
    photoErrors: typeof d.photoErrors === "number" ? d.photoErrors : 0,
    skippedEdited: typeof d.skippedEdited === "number" ? d.skippedEdited : undefined,
    byTab: d.byTab as Record<string, number>,
    errorSamples: d.errorSamples as CadreExportSummary["errorSamples"],
    finishError: typeof d.finishError === "string" ? d.finishError : null,
  };
}

function tabLabel(tab: string): string {
  return TAB_LABELS[tab] ?? tab;
}

const AWS_STATUS_LABELS: Record<string, string> = {
  active: "सक्रिय",
  removed: "AWS में नहीं",
};

const PREVIEW_COLUMNS: { key: string; label: string }[] = [
  { key: "serialNumber", label: "क्रमांक" },
  { key: "name", label: "नाम" },
  { key: "thana", label: "थाना" },
  { key: "designation", label: "पद" },
  { key: "awsStatus", label: "AWS स्थिति" },
  { key: "pushStatus", label: "पुश स्थिति" },
];

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

interface CadreSheetSyncProps {
  /** False while no Apps Script URL is saved -- the sync cannot run, so it is disabled. */
  urlConfigured: boolean;
  /** Sync log, newest first (the page owns it so the status panel and this stay in step). */
  log: WireSyncLogEntry[];
  onRefreshLog: () => void;
}

export default function CadreSheetSync({ urlConfigured, log, onRefreshLog }: CadreSheetSyncProps) {
  const [confirming, setConfirming] = useState(false);
  const [starting, setStarting] = useState(false);
  const [startError, setStartError] = useState<string | null>(null);

  const [preview, setPreview] = useState<SheetPreview | null>(null);
  const [activeTab, setActiveTab] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);

  const latest = log.find((e) => e.eventType === "cadre.export");
  const running = latest?.status === "running";
  const summary = latest && latest.status !== "running" ? asExportSummary(latest.detail) : null;

  // While a run is in flight, follow it: the backend does the work in the background and
  // only reports through the sync log.
  useEffect(() => {
    if (!running) return;
    const id = setInterval(onRefreshLog, POLL_MS);
    return () => clearInterval(id);
  }, [running, onRefreshLog]);

  async function handleStart() {
    setStarting(true);
    setStartError(null);
    try {
      await startCadreSheetExport();
      setConfirming(false);
      onRefreshLog();
    } catch (err) {
      if (err instanceof ApiError && err.code === "EXPORT_RUNNING") {
        setStartError("पहले से एक सिंक चल रहा है। उसके पूरा होने तक प्रतीक्षा करें।");
        onRefreshLog();
      } else {
        setStartError(err instanceof Error ? err.message : "सिंक शुरू नहीं हो सका");
      }
    } finally {
      setStarting(false);
    }
  }

  async function loadPreview(tab?: string) {
    setPreviewLoading(true);
    setPreviewError(null);
    try {
      const res = await getSheetPreview({ tab, limit: PREVIEW_LIMIT });
      if (!res.ok) {
        setPreviewError(res.error ?? "पूर्वावलोकन नहीं मिल सका");
        return;
      }
      setPreview(res);
      setActiveTab(tab ?? null);
    } catch (err) {
      setPreviewError(err instanceof Error ? err.message : "पूर्वावलोकन नहीं मिल सका");
    } finally {
      setPreviewLoading(false);
    }
  }

  return (
    <>
      {/* Trigger + last run */}
      <div className="card" style={{ padding: "var(--space-5)" }}>
        <h2 className="t-h4" style={{ marginBottom: "var(--space-2)" }}>
          कैडर डेटा → शीट सिंक
        </h2>
        <p className="t-body-sm" style={{ color: "var(--text-secondary)", marginBottom: "var(--space-4)" }}>
          सभी कैडर की वर्तमान जानकारी श्रेणी के अनुसार अलग-अलग टैब में लिखी जाती है। यह एकतरफ़ा है (AWS → शीट):
          शीट में सीधे किया गया बदलाव यहां से नहीं बदलता। दोबारा चलाना हमेशा सुरक्षित है।
        </p>

        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)", flexWrap: "wrap" }}>
          {confirming ? (
            <>
              <span className="t-body-sm">पूरा सिंक अभी शुरू करें?</span>
              <Button variant="primary" size="sm" onClick={handleStart} disabled={starting}>
                {starting ? "शुरू हो रहा है..." : "हां, शुरू करें"}
              </Button>
              <Button variant="secondary" size="sm" onClick={() => setConfirming(false)} disabled={starting}>
                रद्द करें
              </Button>
            </>
          ) : (
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                setStartError(null);
                setConfirming(true);
              }}
              disabled={!urlConfigured}
            >
              शीट में सिंक करें
            </Button>
          )}
          {!urlConfigured && (
            <span className="t-caption" style={{ color: "var(--text-tertiary)" }}>
              पहले ऊपर Apps Script का URL सहेजें।
            </span>
          )}
        </div>
        {startError && (
          <p className="t-body-sm" style={{ color: "var(--rose)", marginTop: "var(--space-2)" }}>
            {startError}
          </p>
        )}

        <div style={{ marginTop: "var(--space-5)" }}>
          <p className="t-caption" style={{ marginBottom: "var(--space-2)" }}>
            पिछला सिंक
          </p>
          {!latest ? (
            <p className="t-body-sm" style={{ color: "var(--text-tertiary)" }}>
              अभी तक कोई सिंक नहीं हुआ।
            </p>
          ) : (
            <>
              <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
                <span
                  className={`badge badge--${
                    latest.status === "success" ? "success" : latest.status === "running" ? "pending" : "danger"
                  }`}
                >
                  {latest.status === "success" ? "सफल" : latest.status === "running" ? "चल रहा है" : "त्रुटि"}
                </span>
                <span className="t-caption">{formatDateTime(latest.createdAt)}</span>
              </div>
              {latest.status === "error" && latest.error && (
                <p className="t-caption" style={{ color: "var(--rose)", marginTop: "var(--space-2)" }}>
                  {latest.error}
                </p>
              )}
              {summary && (
                <div style={{ marginTop: "var(--space-3)" }}>
                  <p className="t-body-sm">
                    कुल {summary.total} कैडर · त्रुटियाँ {summary.errors} · फ़ोटो त्रुटियाँ {summary.photoErrors}
                  </p>
                  {(summary.skippedEdited ?? 0) > 0 && (
                    <p className="t-caption" style={{ color: "var(--amber)", marginTop: "var(--space-2)" }}>
                      {summary.skippedEdited} पंक्तियों में शीट में किए गए बदलाव अभी AWS में नहीं भेजे गए हैं — उन्हें
                      अधिलेखित नहीं किया गया। शीट के &quot;SAMPARK Sync&quot; मेनू से पुश करें या बदलाव त्याग दें।
                    </p>
                  )}
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-2) var(--space-4)", marginTop: "var(--space-2)" }}>
                    {Object.entries(summary.byTab).map(([tab, count]) => (
                      <span key={tab} className="t-caption">
                        {tabLabel(tab)}: {count}
                      </span>
                    ))}
                  </div>
                  {summary.errorSamples.slice(0, 5).map((s, i) => (
                    <p key={i} className="t-caption" style={{ color: "var(--rose)", marginTop: "2px" }}>
                      कैडर #{s.cadreId ?? "?"}
                      {s.serialNumber ? ` (${s.serialNumber})` : ""}: {s.error}
                    </p>
                  ))}
                  {summary.finishError && (
                    <p className="t-caption" style={{ color: "var(--rose)", marginTop: "2px" }}>
                      समापन चरण: {summary.finishError}
                    </p>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Preview */}
      <div className="card" style={{ padding: "var(--space-5)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--space-2)" }}>
          <h2 className="t-h4">शीट पूर्वावलोकन</h2>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => loadPreview(activeTab ?? undefined)}
            disabled={previewLoading || !urlConfigured}
          >
            {previewLoading ? "लोड हो रहा है..." : preview ? "ताज़ा करें" : "पूर्वावलोकन देखें"}
          </Button>
        </div>
        <p className="t-body-sm" style={{ color: "var(--text-secondary)", marginBottom: "var(--space-4)" }}>
          शीट की मौजूदा स्थिति सीधे पढ़ी जाती है (हर बार नया, सहेजा हुआ नहीं)। प्रति टैब केवल पहली {PREVIEW_LIMIT} पंक्तियाँ दिखती हैं।
        </p>

        {previewError && (
          <p className="t-body-sm" style={{ color: "var(--rose)", marginBottom: "var(--space-3)" }}>
            {previewError}
          </p>
        )}

        {preview?.tabs && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-2)", marginBottom: "var(--space-4)" }}>
            {preview.tabs.map((t) => (
              <Button
                key={t.tab}
                variant={activeTab === t.tab ? "primary" : "secondary"}
                size="sm"
                onClick={() => loadPreview(t.tab)}
                disabled={previewLoading}
              >
                {tabLabel(t.tab)} ({t.rowCount})
                {t.pendingPush > 0 ? ` · ${t.pendingPush} नई` : ""}
              </Button>
            ))}
          </div>
        )}

        {preview && activeTab && (
          (preview.rows ?? []).length === 0 ? (
            <p className="t-body-sm" style={{ color: "var(--text-tertiary)" }}>
              इस टैब में अभी कोई पंक्ति नहीं है।
            </p>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    {PREVIEW_COLUMNS.map((c) => (
                      <th
                        key={c.key}
                        className="t-caption"
                        style={{ textAlign: "left", padding: "var(--space-2) var(--space-3)", borderBottom: "1px solid var(--border)" }}
                      >
                        {c.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(preview.rows ?? []).map((row, i) => (
                    <tr key={i}>
                      {PREVIEW_COLUMNS.map((c) => {
                        const raw = row[c.key];
                        const text = raw === null || raw === undefined ? "" : String(raw);
                        return (
                          <td
                            key={c.key}
                            className="t-body-sm"
                            style={{ padding: "var(--space-2) var(--space-3)", borderBottom: "1px solid var(--border)" }}
                          >
                            {c.key === "awsStatus" ? (AWS_STATUS_LABELS[text] ?? text) : text}
                            {c.key === "pushStatus" && row.pushError ? (
                              <span className="t-caption" style={{ display: "block", color: "var(--rose)" }}>
                                {String(row.pushError)}
                              </span>
                            ) : null}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}
      </div>
    </>
  );
}

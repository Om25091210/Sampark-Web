"use client";

import { useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import Topbar from "@/components/layout/Topbar";
import Button from "@/components/ui/Button";
import {
  getConfig,
  updateConfig,
  listSyncLog,
  ApiError,
  type WireConfig,
  type WireSyncLogEntry,
} from "@/lib/api";

const SYNC_LOG_LIMIT = 20;

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const EVENT_TYPE_LABELS: Record<string, string> = {
  "cadre.export": "कैडर मिरर एक्सपोर्ट",
  "user.created": "उपयोगकर्ता सिंक (नया)",
  "user.updated": "उपयोगकर्ता सिंक (संपादित)",
  "user.deactivated": "उपयोगकर्ता सिंक (निष्क्रिय)",
};

function eventTypeLabel(eventType: string): string {
  return EVENT_TYPE_LABELS[eventType] ?? eventType;
}

export default function ConfigPage() {
  const [forbidden, setForbidden] = useState(false);
  const [loading, setLoading] = useState(true);
  const [config, setConfig] = useState<WireConfig | null>(null);
  const [urlInput, setUrlInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [log, setLog] = useState<WireSyncLogEntry[]>([]);
  const [logLoading, setLogLoading] = useState(true);

  function loadAll() {
    setLoading(true);
    setLogLoading(true);
    getConfig()
      .then((res) => {
        setConfig(res);
        setUrlInput(res.sheetsSyncUrl ?? "");
        setForbidden(false);
      })
      .catch((err) => {
        if (err instanceof ApiError && err.status === 403) setForbidden(true);
      })
      .finally(() => setLoading(false));

    listSyncLog(SYNC_LOG_LIMIT)
      .then((res) => setLog(res))
      .catch(() => setLog([]))
      .finally(() => setLogLoading(false));
  }

  useEffect(() => {
    loadAll();
  }, []);

  async function handleSave() {
    setSaving(true);
    setSaveError(null);
    try {
      const trimmed = urlInput.trim();
      const res = await updateConfig(trimmed === "" ? null : trimmed);
      setConfig(res);
      setUrlInput(res.sheetsSyncUrl ?? "");
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "सहेजने में त्रुटि हुई");
    } finally {
      setSaving(false);
    }
  }

  async function handlePause() {
    setSaving(true);
    setSaveError(null);
    try {
      const res = await updateConfig(null);
      setConfig(res);
      setUrlInput("");
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "रोकने में त्रुटि हुई");
    } finally {
      setSaving(false);
    }
  }

  const lastCadreSync = log.find((e) => e.eventType === "cadre.export" && e.status === "success");
  const lastUserSync = log.find((e) => e.eventType.startsWith("user.") && e.status === "success");

  if (forbidden) {
    return (
      <>
        <Topbar title="कॉन्फ़िगरेशन" />
        <div style={{ padding: "var(--space-10)", textAlign: "center" }}>
          <p className="t-body">आपके पास इस पृष्ठ तक पहुंच नहीं है।</p>
        </div>
      </>
    );
  }

  return (
    <>
      <Topbar title="कॉन्फ़िगरेशन" subtitle="Sheets सिंक कनेक्शन और स्थिति (सुपर एडमिन)" />
      <div
        style={{
          padding: "var(--space-6) var(--space-8)",
          display: "flex",
          flexDirection: "column",
          gap: "var(--space-6)",
          maxWidth: 720,
        }}
      >
        {/* Connection setting */}
        <div className="card" style={{ padding: "var(--space-5)" }}>
          <h2 className="t-h4" style={{ marginBottom: "var(--space-2)" }}>
            Apps Script कनेक्शन
          </h2>
          <p className="t-body-sm" style={{ color: "var(--text-secondary)", marginBottom: "var(--space-4)" }}>
            यहां केवल Apps Script Web App का deployment URL सेट होता है। सिंक को प्रमाणित करने वाला
            shared secret वेब से कभी सेट, दिखाया या बदला नहीं जा सकता — वह हाथ से Secrets Manager में
            डाला जाता है।
          </p>

          {loading ? (
            <p className="t-caption">लोड हो रहा है...</p>
          ) : (
            <>
              <label className="t-caption" style={{ display: "block", marginBottom: "var(--space-2)" }}>
                Deployment URL
              </label>
              <input
                className="input"
                style={{ width: "100%" }}
                placeholder="https://script.google.com/macros/s/.../exec"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                disabled={saving}
              />
              {saveError && (
                <p className="t-body-sm" style={{ color: "var(--rose)", marginTop: "var(--space-2)" }}>
                  {saveError}
                </p>
              )}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "var(--space-4)" }}>
                <span className="t-caption">
                  {config?.sheetsSyncUrl
                    ? `अंतिम अपडेट: ${formatDateTime(config.updatedAt)}`
                    : "सिंक अभी रोका हुआ है (कोई URL सेट नहीं)"}
                </span>
                <div style={{ display: "flex", gap: "var(--space-3)" }}>
                  {config?.sheetsSyncUrl && (
                    <Button variant="secondary" size="sm" onClick={handlePause} disabled={saving}>
                      सिंक रोकें
                    </Button>
                  )}
                  <Button variant="primary" size="sm" onClick={handleSave} disabled={saving || urlInput.trim() === (config?.sheetsSyncUrl ?? "")}>
                    {saving ? "सहेजा जा रहा है..." : "सहेजें"}
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Status summary */}
        <div className="card" style={{ padding: "var(--space-5)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--space-4)" }}>
            <h2 className="t-h4">सिंक स्थिति</h2>
            <button
              onClick={loadAll}
              aria-label="ताज़ा करें"
              style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", color: "var(--text-tertiary)", cursor: "pointer" }}
              className="t-caption"
            >
              <RefreshCw size={14} strokeWidth={1.75} />
              ताज़ा करें
            </button>
          </div>

          <div style={{ display: "flex", gap: "var(--space-4)", marginBottom: "var(--space-5)" }}>
            <div style={{ flex: 1 }}>
              <p className="t-caption">कैडर मिरर — अंतिम सफल सिंक</p>
              <p className="t-body" style={{ marginTop: "2px" }}>
                {lastCadreSync ? formatDateTime(lastCadreSync.createdAt) : "अभी तक नहीं हुआ"}
              </p>
            </div>
            <div style={{ flex: 1 }}>
              <p className="t-caption">उपयोगकर्ता सिंक — अंतिम सफल सिंक</p>
              <p className="t-body" style={{ marginTop: "2px" }}>
                {lastUserSync ? formatDateTime(lastUserSync.createdAt) : "अभी तक नहीं हुआ"}
              </p>
            </div>
          </div>

          <p className="t-caption" style={{ marginBottom: "var(--space-2)" }}>
            हाल की गतिविधि (अधिकतम {SYNC_LOG_LIMIT})
          </p>
          {logLoading ? (
            <p className="t-caption">लोड हो रहा है...</p>
          ) : log.length === 0 ? (
            <p className="t-body-sm" style={{ color: "var(--text-tertiary)" }}>
              अभी तक कोई सिंक गतिविधि दर्ज नहीं हुई।
            </p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "1px", maxHeight: 360, overflowY: "auto" }}>
              {log.map((entry) => (
                <div
                  key={entry.id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "var(--space-3) 0",
                    borderBottom: "1px solid var(--border)",
                  }}
                >
                  <div>
                    <p className="t-body-sm">{eventTypeLabel(entry.eventType)}</p>
                    {entry.status === "error" && entry.error && (
                      <p className="t-caption" style={{ color: "var(--rose)", marginTop: "2px" }}>
                        {entry.error}
                      </p>
                    )}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
                    <span className="t-caption">{formatDateTime(entry.createdAt)}</span>
                    <span className={`badge badge--${entry.status === "success" ? "success" : "danger"}`}>
                      {entry.status === "success" ? "सफल" : "त्रुटि"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

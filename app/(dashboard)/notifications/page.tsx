"use client";

import { useEffect, useState } from "react";
import Topbar from "@/components/layout/Topbar";
import Button from "@/components/ui/Button";
import {
  listNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  type WireNotification,
} from "@/lib/api";

// ADR-048's Notification.type is an open string set (cadre_change_outcome, etc.),
// not the mock's illustrative submit/approve/pending/contact/update taxonomy --
// unrecognised types fall through to a generic bell icon rather than guessing.
const TYPE_ICONS: Record<string, React.ReactNode> = {
  cadre_change_outcome: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ),
  cadre_create_outcome: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  ),
  broadcast: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  ),
};

const DEFAULT_ICON = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="12" />
    <line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
);

function relativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "अभी";
  if (mins < 60) return `${mins} मिनट पहले`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} घंटे पहले`;
  const days = Math.floor(hours / 24);
  return `${days} दिन पहले`;
}

const PAGE_SIZE = 30;

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<WireNotification[]>([]);
  const [tab, setTab] = useState<"all" | "unread">("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  function load() {
    setLoading(true);
    listNotifications({ unreadOnly: tab === "unread", page: 1, pageSize: PAGE_SIZE })
      .then((res) => {
        setNotifications(res.data);
        setError(false);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }

  useEffect(load, [tab]);

  const unreadCount = notifications.filter((n) => !n.readAt).length;

  async function handleMarkRead(id: number) {
    await markNotificationRead(id);
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, readAt: new Date().toISOString() } : n)));
  }

  async function handleMarkAllRead() {
    await markAllNotificationsRead();
    load();
  }

  return (
    <>
      <Topbar title="सूचनाएं" subtitle="सभी रिपोर्टिंग और सिस्टम अधिसूचनाएं" />

      <div style={{ padding: "24px 28px", display: "flex", flexDirection: "column", gap: "20px" }}>
        {/* Header Row */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", gap: "12px" }}>
            {([
              { key: "all" as const, label: "सभी" },
              { key: "unread" as const, label: "अपठित" },
            ]).map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                style={{
                  padding: "7px 16px",
                  borderRadius: "20px",
                  border: tab === t.key ? "none" : "1px solid var(--border)",
                  background: tab === t.key ? "var(--brand)" : "var(--surface)",
                  color: tab === t.key ? "#fff" : "var(--text-tertiary)",
                  fontSize: "13px",
                  fontWeight: 600,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                {t.label}
                {t.key === "unread" && unreadCount > 0 && (
                  <span
                    style={{
                      background: "var(--rose)",
                      color: "#fff",
                      borderRadius: "10px",
                      padding: "0 6px",
                      fontSize: "10px",
                      fontWeight: 700,
                    }}
                  >
                    {unreadCount}
                  </span>
                )}
              </button>
            ))}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "var(--space-4)" }}>
            <span className="t-caption">{unreadCount} अपठित · {notifications.length} कुल</span>
            {unreadCount > 0 && (
              <Button variant="secondary" size="sm" onClick={handleMarkAllRead}>
                सभी पढ़ी हुई चिह्नित करें
              </Button>
            )}
          </div>
        </div>

        {/* Notification List */}
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          {error && (
            <div style={{ padding: "var(--space-6)", textAlign: "center" }}>
              <p className="t-body-sm" style={{ color: "var(--rose)" }}>सूचनाएं लोड नहीं हो सकीं।</p>
            </div>
          )}
          {!error && !loading && notifications.length === 0 && (
            <div style={{ padding: "var(--space-10)", textAlign: "center" }}>
              <p className="t-body-sm" style={{ color: "var(--text-tertiary)" }}>
                {tab === "unread" ? "कोई अपठित सूचना नहीं" : "कोई सूचना नहीं"}
              </p>
            </div>
          )}
          {!error && loading && (
            <div style={{ padding: "var(--space-6)", textAlign: "center" }}>
              <p className="t-caption">लोड हो रहा है...</p>
            </div>
          )}
          {!error && !loading && notifications.map((notif, i) => (
            <button
              key={notif.id}
              onClick={() => !notif.readAt && handleMarkRead(notif.id)}
              style={{
                width: "100%",
                textAlign: "left",
                cursor: notif.readAt ? "default" : "pointer",
                border: "none",
                display: "flex",
                gap: "14px",
                padding: "16px 22px",
                borderBottom: i < notifications.length - 1 ? "1px solid var(--border)" : "none",
                background: notif.readAt ? "var(--surface)" : "var(--brand-soft)",
                alignItems: "flex-start",
                position: "relative",
              }}
            >
              {/* Unread dot */}
              {!notif.readAt && (
                <div
                  style={{
                    position: "absolute",
                    left: "8px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    width: "6px",
                    height: "6px",
                    borderRadius: "50%",
                    background: "var(--brand)",
                  }}
                />
              )}

              {/* Icon */}
              <div
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: "var(--radius-full)",
                  background: "var(--surface-sunken)",
                  color: "var(--text-secondary)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                {TYPE_ICONS[notif.type] ?? DEFAULT_ICON}
              </div>

              {/* Content */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "4px" }}>
                  <div
                    style={{
                      fontSize: "13.5px",
                      fontWeight: notif.readAt ? 500 : 700,
                      color: "var(--text-primary)",
                    }}
                  >
                    {notif.title}
                  </div>
                  <div style={{ fontSize: "11px", color: "var(--text-tertiary)", flexShrink: 0, marginLeft: "12px" }}>
                    {relativeTime(notif.createdAt)}
                  </div>
                </div>
                <div style={{ fontSize: "12.5px", color: "var(--text-secondary)", lineHeight: 1.5 }}>
                  {notif.body}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </>
  );
}

import Link from "next/link";
import { Search, Bell, ArrowLeft } from "lucide-react";

interface TopbarProps {
  title: string;
  subtitle?: string;
  showSearch?: boolean;
  /** Renders a back arrow before the title, linking here (e.g. a detail page → its list). */
  backHref?: string;
}

export default function Topbar({ title, subtitle, showSearch = true, backHref }: TopbarProps) {
  return (
    <header
      style={{
        height: "var(--topbar-h)",
        background: "var(--surface)",
        borderBottom: "1px solid var(--border)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 var(--space-8)",
        position: "sticky",
        top: 0,
        zIndex: 10,
        flexShrink: 0,
      }}
    >
      {/* Left: Title */}
      <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
        {backHref && (
          <Link
            href={backHref}
            aria-label="वापस जाएं"
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "var(--radius-lg)",
              background: "var(--surface-hover)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--text-secondary)",
              flexShrink: 0,
            }}
          >
            <ArrowLeft size={16} strokeWidth={1.75} />
          </Link>
        )}
        <div>
          <h1 className="t-h4" style={{ fontSize: "1.0625rem" }}>
            {title}
          </h1>
          {subtitle && (
            <p className="t-caption" style={{ marginTop: "2px" }}>
              {subtitle}
            </p>
          )}
        </div>
      </div>

      {/* Right: Search + Notif + Avatar */}
      <div style={{ display: "flex", alignItems: "center", gap: "var(--space-4)" }}>
        {/* Search */}
        {showSearch && (
          <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
            <Search
              size={16}
              strokeWidth={1.75}
              color="var(--text-tertiary)"
              style={{ position: "absolute", left: "var(--space-3)", pointerEvents: "none" }}
            />
            <input
              type="text"
              placeholder="खोजें..."
              className="input"
              style={{ height: "38px", paddingLeft: "36px", width: "220px" }}
            />
          </div>
        )}

        {/* Notification Bell → notifications */}
        <Link
          href="/notifications"
          aria-label="सूचनाएं"
          style={{
            position: "relative",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            padding: "var(--space-1)",
            color: "var(--text-tertiary)",
          }}
        >
          <Bell size={20} strokeWidth={1.75} />
          <span
            style={{
              position: "absolute",
              top: "2px",
              right: "2px",
              width: "8px",
              height: "8px",
              background: "var(--amber)",
              borderRadius: "50%",
              border: "1.5px solid var(--surface)",
            }}
          />
        </Link>

        {/* Avatar → profile */}
        <Link
          href="/profile"
          aria-label="प्रोफाइल"
          style={{
            width: "36px",
            height: "36px",
            borderRadius: "var(--radius-full)",
            background: "linear-gradient(135deg, var(--brand), var(--navy))",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#fff",
            fontWeight: 700,
            fontSize: "13px",
            cursor: "pointer",
            flexShrink: 0,
          }}
        >
          RK
        </Link>
      </div>
    </header>
  );
}

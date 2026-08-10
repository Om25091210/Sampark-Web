"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutGrid,
  FileText,
  BarChart3,
  User,
  Users,
  UserCog,
  Settings,
  Crosshair,
  Bell,
  LogOut,
  ClipboardCheck,
} from "lucide-react";
import { logout, getRole } from "@/lib/api";

const ICON_PROPS = { size: 18, strokeWidth: 1.75 } as const;

const BASE_NAV_ITEMS = [
  { href: "/dashboard", label: "डैशबोर्ड", badge: null, icon: <LayoutGrid {...ICON_PROPS} /> },
  { href: "/approvals", label: "स्वीकृति अनुरोध", badge: null, icon: <ClipboardCheck {...ICON_PROPS} /> },
  { href: "/records", label: "रिपोर्टिंग रिकॉर्ड", badge: "12", icon: <FileText {...ICON_PROPS} /> },
  { href: "/records/analytics", label: "रिपोर्ट विश्लेषण", badge: null, icon: <BarChart3 {...ICON_PROPS} /> },
  { href: "/profile", label: "प्रोफाइल", badge: null, icon: <User {...ICON_PROPS} /> },
  { href: "/officers", label: "अधिकारी सूची", badge: null, icon: <Users {...ICON_PROPS} /> },
];

// ADR-056: web login is super_admin-only, so this is UX only -- every route this
// links to is independently gated server-side (requireRole('super_admin')). Hiding
// it for a non-super_admin session is never the control, only the affordance.
const USERS_NAV_ITEM = {
  href: "/users",
  label: "उपयोगकर्ता प्रबंधन",
  badge: null,
  icon: <UserCog {...ICON_PROPS} />,
};

const CONFIG_NAV_ITEM = {
  href: "/config",
  label: "कॉन्फ़िगरेशन",
  badge: null,
  icon: <Settings {...ICON_PROPS} />,
};

const SYSTEM_ITEMS = [
  { href: "/tracker", label: "लोकेशन ट्रैकर", icon: <Crosshair {...ICON_PROPS} /> },
  { href: "/notifications", label: "सूचनाएं", icon: <Bell {...ICON_PROPS} /> },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  // Deferred to an effect (not computed inline from the cookie) so the server-rendered
  // markup and the client's first render match -- getRole() only exists client-side,
  // and reading it during render would desync SSR HTML from the hydrated DOM.
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  useEffect(() => {
    setIsSuperAdmin(getRole() === "super_admin");
  }, []);
  const NAV_ITEMS = isSuperAdmin ? [...BASE_NAV_ITEMS, USERS_NAV_ITEM, CONFIG_NAV_ITEM] : BASE_NAV_ITEMS;

  async function handleLogout() {
    await logout();
    router.replace("/login");
  }

  // Only the most specific route matches, so /records/analytics highlights
  // "रिपोर्ट विश्लेषण" alone — not its parent /records too.
  const activeHref = [...NAV_ITEMS, ...SYSTEM_ITEMS]
    .map((i) => i.href)
    .filter((h) => pathname === h || pathname.startsWith(h + "/"))
    .sort((a, b) => b.length - a.length)[0];

  return (
    <aside
      style={{
        width: "var(--sidebar-w)",
        minWidth: "var(--sidebar-w)",
        background: "var(--sidebar-bg)",
        borderRight: "1px solid var(--border)",
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        position: "sticky",
        top: 0,
        overflowY: "auto",
      }}
    >
      {/* Logo → landing page */}
      <div style={{ padding: "var(--space-6) var(--space-5) var(--space-5)", borderBottom: "1px solid var(--border)" }}>
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
          <div
            style={{
              width: "36px",
              height: "36px",
              background: "var(--brand)",
              borderRadius: "var(--radius-md)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "18px",
              fontWeight: 800,
              color: "#fff",
              flexShrink: 0,
            }}
          >
            S
          </div>
          <div>
            <div style={{ color: "var(--text-primary)", fontWeight: 700, fontSize: "15px", letterSpacing: "0.02em" }}>
              SAMPARK
            </div>
            <div style={{ color: "var(--text-tertiary)", fontSize: "11px", fontWeight: 400 }}>
              बीजापुर पुलिस · छ.ग.
            </div>
          </div>
        </Link>
      </div>

      {/* Main Nav */}
      <nav style={{ padding: "var(--space-3)", flex: 1, display: "flex", flexDirection: "column", gap: "2px" }}>
        {NAV_ITEMS.map((item) => {
          const isActive = item.href === activeHref;
          return (
            <Link key={item.href} href={item.href} className="nav-item" data-active={isActive}>
              <span style={{ flexShrink: 0 }}>{item.icon}</span>
              <span style={{ flex: 1 }}>{item.label}</span>
              {item.badge && (
                <span className="badge badge--brand" style={{ background: "var(--brand)", color: "#fff" }}>
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}

        {/* System Section */}
        <div style={{ marginTop: "var(--space-5)", paddingTop: "var(--space-4)", borderTop: "1px solid var(--border)", display: "flex", flexDirection: "column", gap: "2px" }}>
          <div className="t-overline" style={{ paddingLeft: "var(--space-3)", marginBottom: "var(--space-2)" }}>
            सिस्टम
          </div>
          {SYSTEM_ITEMS.map((item) => {
            const isActive = item.href === activeHref;
            return (
              <Link key={item.href} href={item.href} className="nav-item" data-active={isActive}>
                <span style={{ flexShrink: 0 }}>{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Logout */}
      <div style={{ padding: "var(--space-3) var(--space-3) var(--space-5)", borderTop: "1px solid var(--border)" }}>
        <button onClick={handleLogout} className="nav-logout">
          <LogOut {...ICON_PROPS} />
          लॉगआउट
        </button>
      </div>
    </aside>
  );
}

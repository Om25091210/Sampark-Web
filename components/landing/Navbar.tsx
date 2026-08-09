"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { hasSession } from "@/lib/api";

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const router = useRouter();

  const authNav = (dest: string) => {
    router.push(hasSession() ? dest : "/login");
  };

  const navLinkStyle: React.CSSProperties = {
    background: "none",
    border: "none",
    cursor: "pointer",
    color: "#8B90A7",
    fontSize: "14px",
    fontWeight: 500,
    padding: 0,
    fontFamily: "inherit",
  };

  return (
    <nav
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        background: "rgba(255,255,255,0.95)",
        backdropFilter: "blur(12px)",
        borderBottom: "1px solid #E8EAF0",
        height: "64px",
        display: "flex",
        alignItems: "center",
        padding: "0 40px",
        justifyContent: "space-between",
      }}
    >
      {/* Logo */}
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <div
          style={{
            width: "38px",
            height: "38px",
            background: "#1DA8E0",
            borderRadius: "10px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "20px",
            fontWeight: 800,
            color: "#fff",
          }}
        >
          S
        </div>
        <div>
          <div style={{ fontWeight: 800, fontSize: "16px", color: "#1A1D2E", letterSpacing: "0.04em" }}>
            SAMPARK
          </div>
          <div style={{ fontSize: "10.5px", color: "#8B90A7", fontWeight: 400, marginTop: "-1px" }}>
            Bijapur Police · CG
          </div>
        </div>
      </div>

      {/* Nav Links */}
      <div style={{ display: "flex", alignItems: "center", gap: "32px" }}>
        <button style={navLinkStyle} onClick={() => authNav("/records")}>
          रिपोर्टिंग रिकॉर्ड
        </button>
        <button style={navLinkStyle} onClick={() => authNav("/dashboard")}>
          रिपोर्ट विश्लेषण
        </button>
        <button style={navLinkStyle} onClick={() => authNav("/profile")}>
          प्रोफाइल
        </button>
        <button style={navLinkStyle} onClick={() => authNav("/officers")}>
          अधिकारी सूची
        </button>
      </div>

      {/* CTA */}
      <button
        onClick={() => authNav("/dashboard")}
        style={{
          background: "#1DA8E0",
          color: "#fff",
          padding: "10px 22px",
          borderRadius: "10px",
          fontSize: "14px",
          fontWeight: 600,
          border: "none",
          cursor: "pointer",
          display: "inline-flex",
          alignItems: "center",
          gap: "6px",
          boxShadow: "0 4px 12px rgba(29,168,224,0.3)",
          fontFamily: "inherit",
        }}
      >
        एडमिन लॉगिन
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M5 12h14M12 5l7 7-7 7" />
        </svg>
      </button>
    </nav>
  );
}

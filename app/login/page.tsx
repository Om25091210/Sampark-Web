"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { login, verifyTwoFactor, ApiError, type LoginResult } from "@/lib/api";

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Step 2 -- present only for admin/super_admin (ADR-042 TOTP track). `pending`
  // carries the challenge_token plus, on first-ever login, the enrolment secret/URI
  // to show once (the account isn't usable until a code confirms it).
  const [pending, setPending] = useState<
    | null
    | { kind: "totp_required"; challengeToken: string }
    | { kind: "totp_enrollment"; challengeToken: string; secret: string; uri: string }
  >(null);
  const [otp, setOtp] = useState("");

  useEffect(() => setMounted(true), []);

  function goToNext() {
    const next = searchParams.get("next");
    router.push(next && next.startsWith("/") ? next : "/dashboard");
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");

    if (!email.trim() || !password.trim()) {
      setError("कृपया ईमेल और पासवर्ड दोनों दर्ज करें।");
      return;
    }

    setLoading(true);
    try {
      const result: LoginResult = await login(email.trim(), password);
      if (result.status === "authenticated") {
        goToNext();
        return;
      }
      if (result.status === "totp_required") {
        setPending({ kind: "totp_required", challengeToken: result.challenge_token });
      } else {
        setPending({
          kind: "totp_enrollment",
          challengeToken: result.challenge_token,
          secret: result.totp_secret,
          uri: result.totp_uri,
        });
      }
    } catch (err) {
      setError(
        err instanceof ApiError && err.status === 423
          ? "बहुत बार गलत प्रयास — खाता अस्थायी रूप से लॉक है। कुछ देर बाद पुनः प्रयास करें।"
          : "ईमेल या पासवर्ड गलत है। कृपया दोबारा जांचें।",
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleVerify(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!pending) return;
    setError("");
    if (!/^[0-9]{6}$/.test(otp.trim())) {
      setError("कृपया 6 अंकों का कोड दर्ज करें।");
      return;
    }
    setLoading(true);
    try {
      await verifyTwoFactor(pending.challengeToken, otp.trim());
      goToNext();
    } catch {
      setError("कोड गलत है। कृपया दोबारा जांचें।");
    } finally {
      setLoading(false);
    }
  }

  // Fixed blip positions on the radar (percent coordinates) — each
  // represents a tracked-case marker sweeping across the grid.
  const blips = [
    { x: 62, y: 28, delay: "0s", size: 5 },
    { x: 38, y: 45, delay: "1.4s", size: 4 },
    { x: 71, y: 62, delay: "2.6s", size: 6 },
    { x: 25, y: 70, delay: "0.7s", size: 4 },
    { x: 50, y: 18, delay: "3.2s", size: 5 },
    { x: 80, y: 40, delay: "1.9s", size: 4 },
  ];

  return (
    <div
      style={{
        display: "flex",
        height: "100vh",
        fontFamily: "'Inter', system-ui, sans-serif",
        overflow: "hidden",
      }}
    >
      {/* Left — Navy Branding Panel (original palette preserved) */}
      <div
        style={{
          width: "42%",
          background: "linear-gradient(160deg, #0F1C3F 0%, #162848 60%, #1A3260 100%)",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "48px 52px",
          position: "relative",
          overflow: "hidden",
          flexShrink: 0,
        }}
      >
        {/* Coordinate grid backdrop — new signature texture, same cyan tone */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage:
              "linear-gradient(rgba(29,168,224,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(29,168,224,0.06) 1px, transparent 1px)",
            backgroundSize: "36px 36px",
            maskImage:
              "radial-gradient(ellipse 70% 70% at 65% 45%, black 30%, transparent 75%)",
            WebkitMaskImage:
              "radial-gradient(ellipse 70% 70% at 65% 45%, black 30%, transparent 75%)",
          }}
        />

        {/* Original decorative circles — kept */}
        <div
          style={{
            position: "absolute",
            bottom: "80px",
            left: "-60px",
            width: "260px",
            height: "260px",
            borderRadius: "50%",
            border: "1px solid rgba(255,255,255,0.05)",
          }}
        />

        {/* Radar sweep — signature element, built from the existing cyan #1DA8E0 */}
        <div
          style={{
            position: "absolute",
            top: "8%",
            right: "-8%",
            width: "440px",
            height: "440px",
            pointerEvents: "none",
          }}
        >
          {[440, 330, 220, 110].map((d, i) => (
            <div
              key={d}
              style={{
                position: "absolute",
                top: "50%",
                left: "50%",
                width: d,
                height: d,
                transform: "translate(-50%,-50%)",
                borderRadius: "50%",
                border: `1px solid rgba(29,168,224,${0.2 - i * 0.025})`,
              }}
            />
          ))}
          <div
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              width: "220px",
              height: "220px",
              transform: "translate(-50%,-50%)",
              borderRadius: "50%",
              background:
                "conic-gradient(from 0deg, rgba(29,168,224,0.4), transparent 28%)",
              animation: mounted ? "sweep 4.5s linear infinite" : "none",
              maskImage:
                "radial-gradient(circle, black 60%, transparent 100%)",
              WebkitMaskImage:
                "radial-gradient(circle, black 60%, transparent 100%)",
            }}
          />
          {blips.map((b, i) => (
            <div
              key={i}
              style={{
                position: "absolute",
                top: `${b.y}%`,
                left: `${b.x}%`,
                width: b.size,
                height: b.size,
                borderRadius: "50%",
                background: "#1DA8E0",
                boxShadow: "0 0 8px 2px rgba(29,168,224,0.7)",
                animation: mounted ? `blip 4.5s ease-in-out ${b.delay} infinite` : "none",
                opacity: 0,
              }}
            />
          ))}
        </div>

        {/* Logo — unchanged */}
        <div style={{ position: "relative", zIndex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "44px" }}>
            <div
              style={{
                width: "44px",
                height: "44px",
                background: "#1DA8E0",
                borderRadius: "12px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "22px",
                fontWeight: 900,
                color: "#fff",
                flexShrink: 0,
              }}
            >
              S
            </div>
            <div>
              <div style={{ color: "#fff", fontWeight: 800, fontSize: "18px", letterSpacing: "0.05em" }}>
                SAMPARK
              </div>
              <div style={{ color: "rgba(255,255,255,0.4)", fontSize: "11px", fontWeight: 400, marginTop: "1px" }}>
                Bijapur Police · Chhattisgarh
              </div>
            </div>
          </div>

          {/* New: live-status eyebrow, same cyan as the rest of the palette */}
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "5px 12px",
              borderRadius: "100px",
              border: "1px solid rgba(29,168,224,0.3)",
              background: "rgba(29,168,224,0.08)",
              marginBottom: "22px",
              fontSize: "11px",
              color: "#5FC4EE",
              letterSpacing: "0.03em",
            }}
          >
            <span
              style={{
                width: "6px",
                height: "6px",
                borderRadius: "50%",
                background: "#1DA8E0",
                boxShadow: "0 0 6px 1px rgba(29,168,224,0.8)",
              }}
            />
            लाइव ट्रैकिंग सक्रिय
          </div>

          <div>
            <h1
              style={{
                color: "#fff",
                fontSize: "36px",
                fontWeight: 800,
                lineHeight: 1.25,
                marginBottom: "18px",
              }}
            >
              पुलिस कार्यप्रवाह<br />
              <span style={{ color: "#1DA8E0" }}>प्रबंधन मंच</span>
            </h1>
            <p
              style={{
                color: "rgba(255,255,255,0.5)",
                fontSize: "14px",
                lineHeight: 1.7,
                maxWidth: "320px",
              }}
            >
              बीजापुर जिले में आत्मसमर्पित व्यक्तियों की रिपोर्टिंग, निगरानी
              और पुनर्वास के लिए एकीकृत डिजिटल प्रणाली।
            </p>
          </div>
        </div>

        {/* Bottom Stats — unchanged */}
        <div style={{ position: "relative", zIndex: 1, display: "flex", gap: "32px" }}>
          {[
            { value: "1,240+", label: "पंजीकृत व्यक्ति" },
            { value: "48", label: "अधिकारी" },
            { value: "12", label: "थाना क्षेत्र" },
          ].map((s) => (
            <div key={s.label}>
              <div style={{ color: "#1DA8E0", fontSize: "22px", fontWeight: 800 }}>{s.value}</div>
              <div style={{ color: "rgba(255,255,255,0.4)", fontSize: "11.5px", marginTop: "2px" }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Right — Login Form (original white/light theme preserved) */}
      <div
        style={{
          flex: 1,
          background: "#F5F6FA",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "48px",
        }}
      >
        <div style={{ width: "100%", maxWidth: "400px" }}>
          <div
            style={{
              background: "#fff",
              borderRadius: "20px",
              padding: "40px",
              border: "1px solid #E8EAF0",
              boxShadow: "0 4px 24px rgba(0,0,0,0.06)",
            }}
          >
            {!pending ? (
              <>
                <div style={{ marginBottom: "32px" }}>
                  <h2 style={{ fontSize: "22px", fontWeight: 800, color: "#1A1D2E", marginBottom: "6px" }}>
                    लॉगिन करें
                  </h2>
                  <p style={{ fontSize: "13.5px", color: "#8B90A7" }}>
                    अपना ईमेल और पासवर्ड दर्ज करें
                  </p>
                </div>

                <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
                  <div>
                    <label
                      style={{
                        display: "block",
                        fontSize: "12.5px",
                        fontWeight: 600,
                        color: "#1A1D2E",
                        marginBottom: "8px",
                      }}
                    >
                      ईमेल आईडी
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="admin@bijapur.cg.gov.in"
                      autoComplete="email"
                      style={{
                        width: "100%",
                        padding: "11px 14px",
                        borderRadius: "10px",
                        border: "1.5px solid #E8EAF0",
                        fontSize: "14px",
                        color: "#1A1D2E",
                        background: "#F5F6FA",
                        outline: "none",
                        boxSizing: "border-box",
                        fontFamily: "inherit",
                        transition: "border-color 0.15s",
                      }}
                      onFocus={(e) => (e.currentTarget.style.borderColor = "#1DA8E0")}
                      onBlur={(e) => (e.currentTarget.style.borderColor = "#E8EAF0")}
                    />
                  </div>

                  <div>
                    <label
                      style={{
                        display: "block",
                        fontSize: "12.5px",
                        fontWeight: 600,
                        color: "#1A1D2E",
                        marginBottom: "8px",
                      }}
                    >
                      पासवर्ड
                    </label>
                    <div style={{ position: "relative" }}>
                      <input
                        type={showPass ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        autoComplete="current-password"
                        style={{
                          width: "100%",
                          padding: "11px 44px 11px 14px",
                          borderRadius: "10px",
                          border: "1.5px solid #E8EAF0",
                          fontSize: "14px",
                          color: "#1A1D2E",
                          background: "#F5F6FA",
                          outline: "none",
                          boxSizing: "border-box",
                          fontFamily: "inherit",
                          transition: "border-color 0.15s",
                        }}
                        onFocus={(e) => (e.currentTarget.style.borderColor = "#1DA8E0")}
                        onBlur={(e) => (e.currentTarget.style.borderColor = "#E8EAF0")}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPass(!showPass)}
                        aria-label={showPass ? "पासवर्ड छुपाएं" : "पासवर्ड दिखाएं"}
                        style={{
                          position: "absolute",
                          right: "12px",
                          top: "50%",
                          transform: "translateY(-50%)",
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          color: "#B0B4C9",
                          padding: "4px",
                          display: "flex",
                          alignItems: "center",
                        }}
                      >
                        {showPass ? (
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                            <line x1="1" y1="1" x2="23" y2="23" />
                          </svg>
                        ) : (
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                            <circle cx="12" cy="12" r="3" />
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>

                  {error && (
                    <div
                      style={{
                        background: "#FDE8E8",
                        color: "#E74C3C",
                        borderRadius: "8px",
                        padding: "10px 14px",
                        fontSize: "13px",
                        fontWeight: 500,
                      }}
                    >
                      {error}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    style={{
                      width: "100%",
                      padding: "13px",
                      borderRadius: "10px",
                      border: "none",
                      background: loading ? "#B0B4C9" : "#1DA8E0",
                      color: "#fff",
                      fontSize: "15px",
                      fontWeight: 700,
                      cursor: loading ? "not-allowed" : "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "8px",
                      transition: "background 0.15s, transform 0.1s",
                      marginTop: "4px",
                    }}
                    onMouseDown={(e) => {
                      if (!loading) e.currentTarget.style.transform = "scale(0.98)";
                    }}
                    onMouseUp={(e) => {
                      e.currentTarget.style.transform = "scale(1)";
                    }}
                  >
                    {loading ? (
                      <>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ animation: "spin 1s linear infinite" }}>
                          <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                        </svg>
                        लॉगिन हो रहा है...
                      </>
                    ) : (
                      <>
                        लॉगिन करें
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <path d="M5 12h14M12 5l7 7-7 7" />
                        </svg>
                      </>
                    )}
                  </button>
                </form>
              </>
            ) : (
              <>
                <div style={{ marginBottom: "24px" }}>
                  <h2 style={{ fontSize: "22px", fontWeight: 800, color: "#1A1D2E", marginBottom: "6px" }}>
                    सत्यापन कोड दर्ज करें
                  </h2>
                  <p style={{ fontSize: "13.5px", color: "#8B90A7" }}>
                    {pending.kind === "totp_enrollment"
                      ? "पहली बार लॉगिन — अपने Authenticator ऐप में यह कोड जोड़ें, फिर 6 अंकों का कोड दर्ज करें।"
                      : "अपने Authenticator ऐप से 6 अंकों का कोड दर्ज करें।"}
                  </p>
                </div>

                {pending.kind === "totp_enrollment" && (
                  <div
                    style={{
                      background: "#F5F6FA",
                      borderRadius: "10px",
                      padding: "14px",
                      marginBottom: "18px",
                      fontSize: "12px",
                      color: "#4A4F63",
                      wordBreak: "break-all",
                    }}
                  >
                    <div style={{ fontWeight: 700, marginBottom: "4px" }}>Secret:</div>
                    <div style={{ marginBottom: "10px" }}>{pending.secret}</div>
                    <div style={{ fontWeight: 700, marginBottom: "4px" }}>URI:</div>
                    <div>{pending.uri}</div>
                  </div>
                )}

                <form onSubmit={handleVerify} style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
                  <div>
                    <label
                      style={{
                        display: "block",
                        fontSize: "12.5px",
                        fontWeight: 600,
                        color: "#1A1D2E",
                        marginBottom: "8px",
                      }}
                    >
                      6-अंकीय कोड
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, "").slice(0, 6))}
                      placeholder="000000"
                      autoComplete="one-time-code"
                      style={{
                        width: "100%",
                        padding: "11px 14px",
                        borderRadius: "10px",
                        border: "1.5px solid #E8EAF0",
                        fontSize: "18px",
                        letterSpacing: "0.3em",
                        textAlign: "center",
                        color: "#1A1D2E",
                        background: "#F5F6FA",
                        outline: "none",
                        boxSizing: "border-box",
                        fontFamily: "inherit",
                      }}
                    />
                  </div>

                  {error && (
                    <div
                      style={{
                        background: "#FDE8E8",
                        color: "#E74C3C",
                        borderRadius: "8px",
                        padding: "10px 14px",
                        fontSize: "13px",
                        fontWeight: 500,
                      }}
                    >
                      {error}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    style={{
                      width: "100%",
                      padding: "13px",
                      borderRadius: "10px",
                      border: "none",
                      background: loading ? "#B0B4C9" : "#1DA8E0",
                      color: "#fff",
                      fontSize: "15px",
                      fontWeight: 700,
                      cursor: loading ? "not-allowed" : "pointer",
                    }}
                  >
                    {loading ? "सत्यापित हो रहा है..." : "सत्यापित करें"}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setPending(null);
                      setOtp("");
                      setError("");
                    }}
                    style={{
                      background: "none",
                      border: "none",
                      color: "#8B90A7",
                      fontSize: "13px",
                      cursor: "pointer",
                      padding: "4px",
                    }}
                  >
                    वापस जाएं
                  </button>
                </form>
              </>
            )}
          </div>

          <div style={{ textAlign: "center", marginTop: "20px" }}>
            <p style={{ fontSize: "12px", color: "#B0B4C9" }}>
              © 2025 SP Bijapur, Chhattisgarh · SAMPARK Platform
            </p>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes sweep {
          from { transform: translate(-50%,-50%) rotate(0deg); }
          to { transform: translate(-50%,-50%) rotate(360deg); }
        }
        @keyframes blip {
          0%, 100% { opacity: 0; transform: scale(0.6); }
          8% { opacity: 1; transform: scale(1); }
          20% { opacity: 0.3; transform: scale(0.9); }
          28%, 100% { opacity: 0; }
        }
        @media (prefers-reduced-motion: reduce) {
          * { animation: none !important; }
        }
      `}</style>
    </div>
  );
}

"use client";

import { useRouter } from "next/navigation";

const HERO_PROFILES = [
  { name: "मनोज कुमार", badge: "BP-2045", avatar: "MK", status: "पूर्ण" },
  { name: "संगीता यादव", badge: "BP-1893", avatar: "SY", status: "लंबित" },
  { name: "दीपक वर्मा", badge: "BP-2201", avatar: "DV", status: "सक्रिय" },
];

const STATS = [
  { value: "1,240+", label: "व्यक्ति" },
  { value: "48", label: "अधिकारी" },
  { value: "12", label: "जिले" },
];

export default function HeroSection() {
  const router = useRouter();

  const authNav = (dest: string) => {
    const isAuthed = Boolean(sessionStorage.getItem("sampark_authed"));
    router.push(isAuthed ? dest : "/login");
  };

  return (
    <section
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #F5F6FA 0%, #EBF4FF 50%, #F0F9FF 100%)",
        display: "flex",
        alignItems: "center",
        padding: "100px 40px 60px",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Background decorations */}
      <div
        style={{
          position: "absolute",
          top: "10%",
          right: "5%",
          width: "500px",
          height: "500px",
          background: "radial-gradient(circle, rgba(29,168,224,0.08) 0%, transparent 70%)",
          borderRadius: "50%",
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: "10%",
          left: "5%",
          width: "300px",
          height: "300px",
          background: "radial-gradient(circle, rgba(224,123,42,0.06) 0%, transparent 70%)",
          borderRadius: "50%",
          pointerEvents: "none",
        }}
      />

      <div
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
          width: "100%",
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "80px",
          alignItems: "center",
        }}
      >
        {/* Left Column */}
        <div>
          {/* Eyebrow Badge */}
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              background: "#fff",
              border: "1px solid #E8EAF0",
              borderRadius: "20px",
              padding: "6px 14px",
              marginBottom: "28px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
            }}
          >
            <div
              style={{
                width: "8px",
                height: "8px",
                background: "#E07B2A",
                borderRadius: "50%",
              }}
            />
            <span style={{ fontSize: "13px", fontWeight: 600, color: "#1A1D2E" }}>
              नई शुरुआत
            </span>
          </div>

          {/* H1 */}
          <h1
            style={{
              fontSize: "60px",
              fontWeight: 900,
              color: "#1A1D2E",
              lineHeight: 1.1,
              marginBottom: "24px",
            }}
          >
            हम{" "}
            <span style={{ color: "#1DA8E0" }}>जीवन</span>
            <br />
            बदलते{" "}
            <span style={{ color: "#E07B2A" }}>हैं</span>
          </h1>

          {/* Description */}
          <p
            style={{
              fontSize: "17px",
              color: "#8B90A7",
              lineHeight: 1.7,
              maxWidth: "460px",
              marginBottom: "36px",
              fontWeight: 400,
            }}
          >
            संपर्क एक उन्नत पुलिस कार्यप्रवाह मंच है जो बीजापुर जिले में
            नक्सल प्रभावित क्षेत्रों से आत्मसमर्पित व्यक्तियों के
            पुनर्वास और निगरानी को सुव्यवस्थित करता है।
          </p>

          {/* Action Buttons */}
          <div style={{ display: "flex", gap: "14px", marginBottom: "52px" }}>
            <button
              onClick={() => authNav("/dashboard")}
              style={{
                background: "#1DA8E0",
                color: "#fff",
                padding: "14px 28px",
                borderRadius: "12px",
                fontSize: "15px",
                fontWeight: 600,
                border: "none",
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                boxShadow: "0 6px 20px rgba(29,168,224,0.35)",
                fontFamily: "inherit",
              }}
            >
              डैशबोर्ड देखें
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </button>
            <button
              onClick={() => authNav("/records")}
              style={{
                background: "#fff",
                color: "#1A1D2E",
                padding: "14px 28px",
                borderRadius: "12px",
                fontSize: "15px",
                fontWeight: 600,
                border: "1.5px solid #E8EAF0",
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                fontFamily: "inherit",
              }}
            >
              रिकॉर्ड देखें
            </button>
          </div>

          {/* Stats */}
          <div style={{ display: "flex", gap: "40px" }}>
            {STATS.map((stat, i) => (
              <div key={i}>
                <div style={{ fontSize: "28px", fontWeight: 800, color: "#1A1D2E" }}>
                  {stat.value}
                </div>
                <div style={{ fontSize: "13px", color: "#8B90A7", fontWeight: 500, marginTop: "2px" }}>
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column — Floating Card Stack */}
        <div style={{ position: "relative", height: "500px" }}>
          {/* Top-left: Mini map stat card */}
          <div
            style={{
              position: "absolute",
              top: "0",
              left: "-20px",
              background: "#fff",
              borderRadius: "16px",
              padding: "16px 20px",
              boxShadow: "0 8px 30px rgba(0,0,0,0.10)",
              zIndex: 2,
              minWidth: "160px",
              border: "1px solid #E8EAF0",
            }}
          >
            <div style={{ fontSize: "11px", color: "#8B90A7", fontWeight: 500, marginBottom: "6px" }}>
              सक्रिय क्षेत्र
            </div>
            {/* Mini map dots */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: "4px", width: "100px", marginBottom: "8px" }}>
              {Array.from({ length: 24 }).map((_, i) => (
                <div
                  key={i}
                  style={{
                    width: "8px",
                    height: "8px",
                    borderRadius: "50%",
                    background: [2, 5, 9, 14, 18, 22].includes(i) ? "#1DA8E0" :
                               [3, 7, 12, 17].includes(i) ? "#E07B2A" : "#E8EAF0",
                  }}
                />
              ))}
            </div>
            <div style={{ fontSize: "22px", fontWeight: 800, color: "#1A1D2E" }}>12</div>
            <div style={{ fontSize: "11px", color: "#8B90A7" }}>थाना क्षेत्र</div>
          </div>

          {/* Main card */}
          <div
            style={{
              position: "absolute",
              top: "60px",
              right: "0",
              left: "60px",
              background: "#fff",
              borderRadius: "20px",
              padding: "24px",
              boxShadow: "0 16px 48px rgba(0,0,0,0.12)",
              zIndex: 3,
              border: "1px solid #E8EAF0",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <div>
                <div style={{ fontSize: "15px", fontWeight: 700, color: "#1A1D2E" }}>
                  हाल की रिपोर्टिंग
                </div>
                <div style={{ fontSize: "12px", color: "#8B90A7", marginTop: "2px" }}>
                  आज की गतिविधि
                </div>
              </div>
              <div
                style={{
                  background: "#E8F4FD",
                  color: "#1DA8E0",
                  borderRadius: "20px",
                  padding: "4px 10px",
                  fontSize: "12px",
                  fontWeight: 600,
                }}
              >
                3 नए
              </div>
            </div>

            {HERO_PROFILES.map((p, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  padding: "10px 0",
                  borderBottom: i < HERO_PROFILES.length - 1 ? "1px solid #F5F6FA" : "none",
                }}
              >
                <div
                  style={{
                    width: "38px",
                    height: "38px",
                    borderRadius: "50%",
                    background: `linear-gradient(135deg, ${["#1DA8E0", "#E07B2A", "#27AE60"][i]}, ${["#0F1C3F", "#C0611A", "#1E8A4A"][i]})`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#fff",
                    fontSize: "13px",
                    fontWeight: 700,
                    flexShrink: 0,
                  }}
                >
                  {p.avatar}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: "13.5px", fontWeight: 600, color: "#1A1D2E" }}>{p.name}</div>
                  <div style={{ fontSize: "11.5px", color: "#8B90A7" }}>{p.badge}</div>
                </div>
                <div
                  style={{
                    fontSize: "11px",
                    fontWeight: 600,
                    padding: "3px 10px",
                    borderRadius: "20px",
                    background: p.status === "पूर्ण" ? "#E8F8EF" : p.status === "लंबित" ? "#FFF4E8" : "#E8F4FD",
                    color: p.status === "पूर्ण" ? "#27AE60" : p.status === "लंबित" ? "#E07B2A" : "#1DA8E0",
                  }}
                >
                  {p.status}
                </div>
              </div>
            ))}
          </div>

          {/* Notification strip */}
          <div
            style={{
              position: "absolute",
              bottom: "0",
              right: "0",
              left: "60px",
              background: "#1DA8E0",
              borderRadius: "12px",
              padding: "12px 16px",
              display: "flex",
              alignItems: "center",
              gap: "10px",
              zIndex: 2,
            }}
          >
            <div
              style={{
                width: "28px",
                height: "28px",
                background: "rgba(255,255,255,0.2)",
                borderRadius: "8px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: "12px", fontWeight: 600, color: "#fff" }}>
                नई रिपोर्ट प्राप्त
              </div>
              <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.7)" }}>
                मनोज कुमार · अभी
              </div>
            </div>
            <div
              style={{
                background: "rgba(255,255,255,0.2)",
                color: "#fff",
                fontSize: "10px",
                padding: "3px 8px",
                borderRadius: "20px",
                fontWeight: 600,
              }}
            >
              नया
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

import Navbar from "@/components/landing/Navbar";
import HeroSection from "@/components/landing/HeroSection";
import Link from "next/link";

const FEATURES = [
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#1DA8E0" strokeWidth="2">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
      </svg>
    ),
    title: "डिजिटल रिपोर्टिंग",
    desc: "कागज़-रहित रिपोर्टिंग प्रणाली जो सभी व्यक्तियों की जानकारी सुरक्षित रखती है।",
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#E07B2A" strokeWidth="2">
        <circle cx="12" cy="12" r="10" />
        <circle cx="12" cy="12" r="3" />
        <line x1="12" y1="2" x2="12" y2="5" />
        <line x1="12" y1="19" x2="12" y2="22" />
        <line x1="2" y1="12" x2="5" y2="12" />
        <line x1="19" y1="12" x2="22" y2="12" />
      </svg>
    ),
    title: "लोकेशन ट्रैकिंग",
    desc: "वास्तविक समय में सभी थाना क्षेत्रों की निगरानी और रिपोर्टिंग स्थान की पुष्टि।",
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#27AE60" strokeWidth="2">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
      </svg>
    ),
    title: "प्रदर्शन विश्लेषण",
    desc: "CSP और अधिकारियों के प्रदर्शन का विस्तृत विश्लेषण और रिपोर्ट।",
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#1DA8E0" strokeWidth="2">
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
      </svg>
    ),
    title: "सूचना प्रणाली",
    desc: "स्वचालित अनुस्मारक और अधिसूचनाएं सभी अधिकारियों और संबंधित व्यक्तियों को।",
  },
];

export default function LandingPage() {
  return (
    <main style={{ background: "#F5F6FA", minHeight: "100vh" }}>
      <Navbar />
      <HeroSection />

      {/* Features Section */}
      <section style={{ padding: "80px 40px", background: "#fff" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "56px" }}>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                background: "#E8F4FD",
                borderRadius: "20px",
                padding: "6px 14px",
                marginBottom: "16px",
              }}
            >
              <span style={{ fontSize: "12px", fontWeight: 600, color: "#1DA8E0" }}>
                मुख्य विशेषताएं
              </span>
            </div>
            <h2
              style={{
                fontSize: "40px",
                fontWeight: 800,
                color: "#1A1D2E",
                lineHeight: 1.2,
                marginBottom: "16px",
              }}
            >
              एक मंच, सम्पूर्ण समाधान
            </h2>
            <p style={{ fontSize: "16px", color: "#8B90A7", maxWidth: "500px", margin: "0 auto" }}>
              बीजापुर पुलिस के लिए विशेष रूप से तैयार किया गया डिजिटल प्रबंधन मंच।
            </p>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: "24px",
            }}
          >
            {FEATURES.map((f, i) => (
              <div
                key={i}
                style={{
                  background: "#F5F6FA",
                  borderRadius: "16px",
                  padding: "28px",
                  border: "1px solid #E8EAF0",
                }}
              >
                <div
                  style={{
                    width: "48px",
                    height: "48px",
                    background: "#fff",
                    borderRadius: "12px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: "18px",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                  }}
                >
                  {f.icon}
                </div>
                <h3
                  style={{
                    fontSize: "15px",
                    fontWeight: 700,
                    color: "#1A1D2E",
                    marginBottom: "8px",
                  }}
                >
                  {f.title}
                </h3>
                <p style={{ fontSize: "13.5px", color: "#8B90A7", lineHeight: 1.6 }}>
                  {f.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section
        style={{
          background: "#0F1C3F",
          padding: "80px 40px",
          textAlign: "center",
        }}
      >
        <div style={{ maxWidth: "600px", margin: "0 auto" }}>
          <h2
            style={{
              fontSize: "40px",
              fontWeight: 800,
              color: "#fff",
              lineHeight: 1.2,
              marginBottom: "16px",
            }}
          >
            आज ही शुरू करें
          </h2>
          <p
            style={{
              fontSize: "16px",
              color: "rgba(255,255,255,0.55)",
              marginBottom: "36px",
              lineHeight: 1.7,
            }}
          >
            बीजापुर पुलिस के डिजिटल कार्यप्रवाह मंच पर जुड़ें और
            प्रशासनिक प्रक्रियाओं को सरल बनाएं।
          </p>
          <Link
            href="/login"
            style={{
              background: "#1DA8E0",
              color: "#fff",
              padding: "16px 36px",
              borderRadius: "12px",
              fontSize: "16px",
              fontWeight: 600,
              textDecoration: "none",
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              boxShadow: "0 8px 24px rgba(29,168,224,0.35)",
            }}
          >
            लॉगिन करें
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer
        style={{
          background: "#0F1C3F",
          borderTop: "1px solid rgba(255,255,255,0.08)",
          padding: "24px 40px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div
            style={{
              width: "28px",
              height: "28px",
              background: "#1DA8E0",
              borderRadius: "7px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "14px",
              fontWeight: 800,
              color: "#fff",
            }}
          >
            S
          </div>
          <span style={{ color: "rgba(255,255,255,0.5)", fontSize: "13px" }}>
            SAMPARK · Bijapur Police · CG
          </span>
        </div>
        <div style={{ color: "rgba(255,255,255,0.3)", fontSize: "12px" }}>
          © 2025 SP Bijapur, Chhattisgarh. सर्वाधिकार सुरक्षित।
        </div>
      </footer>
    </main>
  );
}

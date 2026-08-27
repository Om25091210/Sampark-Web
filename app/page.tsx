import Navbar from "@/components/landing/Navbar";
import HeroSection from "@/components/landing/HeroSection";
import Link from "next/link";

const PROCESS = [
  { step: "01", title: "दर्ज", desc: "व्यक्ति का रिकॉर्ड बनता है।", color: "#1DA8E0" },
  { step: "02", title: "रिपोर्टिंग", desc: "अधिकारी क्षेत्र से स्थिति भेजते हैं।", color: "#E07B2A" },
  { step: "03", title: "अनुमोदन", desc: "श्रेणीबद्ध रूप से स्वीकृत होती है।", color: "#27AE60" },
  { step: "04", title: "निगरानी", desc: "डैशबोर्ड पर सम्पूर्ण स्थिति दिखती है।", color: "#1DA8E0" },
];

export default function LandingPage() {
  return (
    <main style={{ background: "#F5F6FA", minHeight: "100vh" }}>
      <Navbar />
      <HeroSection />

      {/* Process Section */}
      <section style={{ padding: "80px 40px", background: "#fff" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          <h2
            style={{
              fontSize: "32px",
              fontWeight: 800,
              color: "#1A1D2E",
              textAlign: "center",
              marginBottom: "56px",
            }}
          >
            कार्यप्रवाह
          </h2>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: "24px",
            }}
          >
            {PROCESS.map((p, i) => (
              <div key={i} style={{ position: "relative" }}>
                <div
                  style={{
                    fontSize: "34px",
                    fontWeight: 800,
                    color: p.color,
                    opacity: 0.35,
                    marginBottom: "8px",
                  }}
                >
                  {p.step}
                </div>
                <h3
                  style={{
                    fontSize: "17px",
                    fontWeight: 700,
                    color: "#1A1D2E",
                    marginBottom: "6px",
                  }}
                >
                  {p.title}
                </h3>
                <p style={{ fontSize: "13.5px", color: "#8B90A7", lineHeight: 1.6 }}>
                  {p.desc}
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
            B-Smart पर लॉगिन करें।
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
            B
          </div>
          <span style={{ color: "rgba(255,255,255,0.5)", fontSize: "13px" }}>
            B-Smart · Bijapur Police · CG
          </span>
        </div>
        <div style={{ color: "rgba(255,255,255,0.3)", fontSize: "12px" }}>
          © 2025 SP Bijapur, Chhattisgarh. सर्वाधिकार सुरक्षित।
        </div>
      </footer>
    </main>
  );
}

import Topbar from "@/components/layout/Topbar";
import { OFFICERS, STATUS_COLORS } from "@/lib/constants";

const EXTENDED_OFFICERS = [
  { id: 1, name: "राजेश कुमार सिंह", badge: "BP-1042", thana: "बीजापुर सदर", avatar: "RK", status: "active", reports: 48, compliance: 94 },
  { id: 2, name: "प्रिया वर्मा", badge: "BP-1056", thana: "भैरमगढ़", avatar: "PV", status: "active", reports: 42, compliance: 88 },
  { id: 3, name: "अमित पटेल", badge: "BP-1078", thana: "उसूर", avatar: "AP", status: "pending", reports: 29, compliance: 72 },
  { id: 4, name: "सुनीता देशमुख", badge: "BP-1091", thana: "भोपालपट्टनम", avatar: "SD", status: "completed", reports: 38, compliance: 95 },
  { id: 5, name: "विकास गुप्ता", badge: "BP-1103", thana: "कुटरू", avatar: "VG", status: "waiting", reports: 22, compliance: 65 },
  { id: 6, name: "मीना राव", badge: "BP-1115", thana: "बासागुड़ा", avatar: "MR", status: "active", reports: 35, compliance: 91 },
  { id: 7, name: "दीपक वर्मा", badge: "BP-1129", thana: "बीजापुर सदर", avatar: "DV", status: "active", reports: 31, compliance: 85 },
  { id: 8, name: "कविता सिंह", badge: "BP-1134", thana: "भोपालपट्टनम", avatar: "KS", status: "completed", reports: 44, compliance: 97 },
];

const AVATAR_COLORS = [
  ["#1DA8E0", "#0F1C3F"],
  ["#E07B2A", "#C0611A"],
  ["#27AE60", "#1E8A4A"],
  ["#E74C3C", "#C0392B"],
  ["#8E44AD", "#6C3483"],
  ["#16A085", "#1ABC9C"],
  ["#2980B9", "#1A5276"],
  ["#D35400", "#A04000"],
];

export default function OfficersPage() {
  return (
    <>
      <Topbar
        title="अधिकारी सूची"
        subtitle="बीजापुर जिले के सभी नियुक्त अधिकारी"
      />

      <div style={{ padding: "24px 28px", display: "flex", flexDirection: "column", gap: "20px" }}>

        {/* Stats Row */}
        <div style={{ display: "flex", gap: "16px" }}>
          {[
            { label: "कुल अधिकारी", value: "8", color: "#1DA8E0" },
            { label: "सक्रिय", value: "4", color: "#27AE60" },
            { label: "लंबित", value: "1", color: "#E07B2A" },
            { label: "प्रतीक्षा", value: "1", color: "#E74C3C" },
          ].map((s) => (
            <div
              key={s.label}
              style={{
                flex: 1,
                background: "#fff",
                borderRadius: "12px",
                padding: "16px 20px",
                border: "1px solid #E8EAF0",
              }}
            >
              <div style={{ fontSize: "11px", color: "#8B90A7", fontWeight: 500, marginBottom: "6px" }}>
                {s.label}
              </div>
              <div style={{ fontSize: "28px", fontWeight: 800, color: s.color }}>
                {s.value}
              </div>
            </div>
          ))}
        </div>

        {/* Officers Table */}
        <div
          style={{
            background: "#fff",
            borderRadius: "14px",
            border: "1px solid #E8EAF0",
            overflow: "hidden",
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: "18px 22px",
              borderBottom: "1px solid #E8EAF0",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div>
              <div style={{ fontSize: "15px", fontWeight: 700, color: "#1A1D2E" }}>
                अधिकारी विवरण
              </div>
              <div style={{ fontSize: "12px", color: "#8B90A7", marginTop: "2px" }}>
                {EXTENDED_OFFICERS.length} अधिकारी पंजीकृत
              </div>
            </div>
          </div>

          {/* Table Head */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "2fr 1fr 1.5fr 80px 80px 90px",
              padding: "10px 22px",
              background: "#F5F6FA",
              borderBottom: "1px solid #E8EAF0",
            }}
          >
            {["अधिकारी", "बैज", "थाना", "रिपोर्ट", "अनुपालन", "स्थिति"].map((h) => (
              <div key={h} style={{ fontSize: "11px", fontWeight: 700, color: "#8B90A7", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                {h}
              </div>
            ))}
          </div>

          {/* Rows */}
          {EXTENDED_OFFICERS.map((officer, i) => {
            const statusMeta = STATUS_COLORS[officer.status];
            const [c1, c2] = AVATAR_COLORS[i % AVATAR_COLORS.length];
            return (
              <div
                key={officer.id}
                style={{
                  display: "grid",
                  gridTemplateColumns: "2fr 1fr 1.5fr 80px 80px 90px",
                  padding: "14px 22px",
                  borderBottom: i < EXTENDED_OFFICERS.length - 1 ? "1px solid #F5F6FA" : "none",
                  alignItems: "center",
                  transition: "background 0.1s",
                }}
              >
                {/* Name + Avatar */}
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <div
                    style={{
                      width: "36px",
                      height: "36px",
                      borderRadius: "50%",
                      background: `linear-gradient(135deg, ${c1}, ${c2})`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#fff",
                      fontSize: "12px",
                      fontWeight: 700,
                      flexShrink: 0,
                    }}
                  >
                    {officer.avatar}
                  </div>
                  <div>
                    <div style={{ fontSize: "13.5px", fontWeight: 600, color: "#1A1D2E" }}>
                      {officer.name}
                    </div>
                    <div style={{ fontSize: "11px", color: "#B0B4C9", marginTop: "1px" }}>
                      ID · {officer.id.toString().padStart(3, "0")}
                    </div>
                  </div>
                </div>

                {/* Badge */}
                <div style={{ fontSize: "13px", color: "#8B90A7", fontWeight: 500 }}>
                  {officer.badge}
                </div>

                {/* Thana */}
                <div style={{ fontSize: "13px", color: "#1A1D2E", fontWeight: 500 }}>
                  {officer.thana}
                </div>

                {/* Reports */}
                <div style={{ fontSize: "14px", fontWeight: 700, color: "#1DA8E0" }}>
                  {officer.reports}
                </div>

                {/* Compliance */}
                <div>
                  <div style={{ fontSize: "13px", fontWeight: 700, color: officer.compliance >= 90 ? "#27AE60" : officer.compliance >= 75 ? "#E07B2A" : "#E74C3C" }}>
                    {officer.compliance}%
                  </div>
                </div>

                {/* Status */}
                <div>
                  <span
                    style={{
                      display: "inline-block",
                      background: statusMeta.bg,
                      color: statusMeta.text,
                      border: `1px solid ${statusMeta.border}30`,
                      borderRadius: "20px",
                      padding: "3px 10px",
                      fontSize: "11px",
                      fontWeight: 600,
                    }}
                  >
                    {statusMeta.label}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </>
  );
}

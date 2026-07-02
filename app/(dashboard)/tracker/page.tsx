import Topbar from "@/components/layout/Topbar";

const LOCATION_DATA = [
  { id: 1, name: "राजेश कुमार सिंह", avatar: "RK", badge: "BP-1042", thana: "बीजापुर सदर", lat: "18.8397°N", lng: "80.8046°E", lastSeen: "5 मिनट पहले", status: "active" },
  { id: 2, name: "प्रिया वर्मा", avatar: "PV", badge: "BP-1056", thana: "भैरमगढ़", lat: "18.4500°N", lng: "80.5800°E", lastSeen: "12 मिनट पहले", status: "active" },
  { id: 3, name: "अमित पटेल", avatar: "AP", badge: "BP-1078", thana: "उसूर", lat: "18.3200°N", lng: "80.2500°E", lastSeen: "1 घंटे पहले", status: "pending" },
  { id: 4, name: "सुनीता देशमुख", avatar: "SD", badge: "BP-1091", thana: "भोपालपट्टनम", lat: "17.8500°N", lng: "80.4600°E", lastSeen: "2 घंटे पहले", status: "completed" },
  { id: 5, name: "विकास गुप्ता", avatar: "VG", badge: "BP-1103", thana: "कुटरू", lat: "18.5100°N", lng: "80.1600°E", lastSeen: "4 घंटे पहले", status: "waiting" },
  { id: 6, name: "मीना राव", avatar: "MR", badge: "BP-1115", thana: "बासागुड़ा", lat: "18.6800°N", lng: "80.9000°E", lastSeen: "20 मिनट पहले", status: "active" },
];

const STATUS_DOT: Record<string, string> = {
  active: "#27AE60",
  pending: "#E07B2A",
  completed: "#1DA8E0",
  waiting: "#E74C3C",
};

const GRID_DOTS = Array.from({ length: 40 }, (_, i) => {
  const highlight = [3, 7, 12, 18, 24, 28, 33, 38].includes(i);
  const secondary = [1, 5, 15, 20, 30, 35].includes(i);
  return { highlight, secondary };
});

export default function TrackerPage() {
  const activeCount = LOCATION_DATA.filter((l) => l.status === "active").length;

  return (
    <>
      <Topbar
        title="लोकेशन ट्रैकर"
        subtitle="अधिकारियों की अंतिम ज्ञात स्थिति और रिपोर्टिंग स्थान"
      />

      <div style={{ padding: "24px 28px", display: "flex", flexDirection: "column", gap: "20px" }}>

        {/* Status Row */}
        <div style={{ display: "flex", gap: "16px" }}>
          {[
            { label: "सक्रिय", value: activeCount, color: "#27AE60", bg: "#E8F8EF" },
            { label: "कुल ट्रैक", value: LOCATION_DATA.length, color: "#1DA8E0", bg: "#E8F4FD" },
            { label: "लंबित", value: 1, color: "#E07B2A", bg: "#FFF4E8" },
            { label: "प्रतीक्षा", value: 1, color: "#E74C3C", bg: "#FDE8E8" },
          ].map((s) => (
            <div
              key={s.label}
              style={{
                flex: 1,
                background: "#fff",
                borderRadius: "12px",
                padding: "16px 20px",
                border: "1px solid #E8EAF0",
                display: "flex",
                alignItems: "center",
                gap: "14px",
              }}
            >
              <div
                style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "10px",
                  background: s.bg,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <div
                  style={{
                    width: "12px",
                    height: "12px",
                    borderRadius: "50%",
                    background: s.color,
                  }}
                />
              </div>
              <div>
                <div style={{ fontSize: "24px", fontWeight: 800, color: s.color }}>{s.value}</div>
                <div style={{ fontSize: "11px", color: "#8B90A7", fontWeight: 500 }}>{s.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Map + List Layout */}
        <div style={{ display: "flex", gap: "16px", alignItems: "flex-start" }}>

          {/* Map Placeholder */}
          <div
            style={{
              flex: 1,
              background: "#fff",
              borderRadius: "14px",
              border: "1px solid #E8EAF0",
              overflow: "hidden",
              minHeight: "440px",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div style={{ padding: "18px 22px", borderBottom: "1px solid #E8EAF0" }}>
              <div style={{ fontSize: "15px", fontWeight: 700, color: "#1A1D2E" }}>बीजापुर जिला मानचित्र</div>
              <div style={{ fontSize: "12px", color: "#8B90A7", marginTop: "2px" }}>थाना क्षेत्र और अधिकारी स्थिति</div>
            </div>

            {/* Stylized grid map */}
            <div
              style={{
                flex: 1,
                background: "linear-gradient(135deg, #F0F4FF 0%, #EBF8F5 100%)",
                position: "relative",
                padding: "24px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {/* Grid dots background */}
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  display: "flex",
                  flexWrap: "wrap",
                  padding: "16px",
                  gap: "16px",
                  alignContent: "flex-start",
                  opacity: 0.5,
                }}
              >
                {GRID_DOTS.map((dot, i) => (
                  <div
                    key={i}
                    style={{
                      width: "6px",
                      height: "6px",
                      borderRadius: "50%",
                      background: dot.highlight ? "#1DA8E0" : dot.secondary ? "#E07B2A" : "#C8D4E8",
                    }}
                  />
                ))}
              </div>

              {/* Location pins */}
              {LOCATION_DATA.map((loc, i) => {
                const positions = [
                  { top: "25%", left: "55%" },
                  { top: "40%", left: "30%" },
                  { top: "55%", left: "25%" },
                  { top: "70%", left: "48%" },
                  { top: "35%", left: "15%" },
                  { top: "20%", left: "70%" },
                ];
                const pos = positions[i % positions.length];
                return (
                  <div
                    key={loc.id}
                    style={{
                      position: "absolute",
                      ...pos,
                      zIndex: 2,
                      transform: "translate(-50%, -50%)",
                    }}
                  >
                    <div
                      style={{
                        width: "36px",
                        height: "36px",
                        borderRadius: "50%",
                        background: "#fff",
                        border: `3px solid ${STATUS_DOT[loc.status]}`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        boxShadow: `0 4px 14px ${STATUS_DOT[loc.status]}40`,
                        fontSize: "10px",
                        fontWeight: 700,
                        color: "#1A1D2E",
                        cursor: "pointer",
                      }}
                      title={`${loc.name} · ${loc.thana}`}
                    >
                      {loc.avatar}
                    </div>
                    <div
                      style={{
                        position: "absolute",
                        bottom: "-4px",
                        left: "50%",
                        transform: "translateX(-50%)",
                        width: "8px",
                        height: "8px",
                        background: STATUS_DOT[loc.status],
                        borderRadius: "50%",
                        border: "2px solid #fff",
                      }}
                    />
                  </div>
                );
              })}

              {/* Center label */}
              <div
                style={{
                  background: "rgba(255,255,255,0.85)",
                  borderRadius: "10px",
                  padding: "10px 16px",
                  fontSize: "13px",
                  fontWeight: 600,
                  color: "#1A1D2E",
                  border: "1px solid #E8EAF0",
                  backdropFilter: "blur(4px)",
                  zIndex: 1,
                }}
              >
                बीजापुर जिला, छत्तीसगढ़
              </div>
            </div>

            {/* Legend */}
            <div style={{ padding: "12px 22px", borderTop: "1px solid #E8EAF0", display: "flex", gap: "20px" }}>
              {[
                { label: "सक्रिय", color: "#27AE60" },
                { label: "लंबित", color: "#E07B2A" },
                { label: "पूर्ण", color: "#1DA8E0" },
                { label: "प्रतीक्षा", color: "#E74C3C" },
              ].map((leg) => (
                <div key={leg.label} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: leg.color }} />
                  <span style={{ fontSize: "11.5px", color: "#8B90A7" }}>{leg.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Location List */}
          <div
            style={{
              width: "300px",
              flexShrink: 0,
              background: "#fff",
              borderRadius: "14px",
              border: "1px solid #E8EAF0",
              overflow: "hidden",
            }}
          >
            <div style={{ padding: "18px 20px", borderBottom: "1px solid #E8EAF0" }}>
              <div style={{ fontSize: "14px", fontWeight: 700, color: "#1A1D2E" }}>अंतिम स्थिति</div>
              <div style={{ fontSize: "11.5px", color: "#8B90A7", marginTop: "2px" }}>अधिकारी-वार लोकेशन</div>
            </div>
            <div style={{ overflow: "auto", maxHeight: "380px" }}>
              {LOCATION_DATA.map((loc, i) => (
                <div
                  key={loc.id}
                  style={{
                    padding: "14px 20px",
                    borderBottom: i < LOCATION_DATA.length - 1 ? "1px solid #F5F6FA" : "none",
                    display: "flex",
                    gap: "12px",
                    alignItems: "flex-start",
                  }}
                >
                  <div
                    style={{
                      width: "34px",
                      height: "34px",
                      borderRadius: "50%",
                      background: `linear-gradient(135deg, #1DA8E0, #0F1C3F)`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#fff",
                      fontSize: "11px",
                      fontWeight: 700,
                      flexShrink: 0,
                      position: "relative",
                    }}
                  >
                    {loc.avatar}
                    <div
                      style={{
                        position: "absolute",
                        bottom: "0",
                        right: "0",
                        width: "9px",
                        height: "9px",
                        borderRadius: "50%",
                        background: STATUS_DOT[loc.status],
                        border: "2px solid #fff",
                      }}
                    />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: "13px", fontWeight: 600, color: "#1A1D2E", marginBottom: "2px" }}>
                      {loc.name}
                    </div>
                    <div style={{ fontSize: "11px", color: "#8B90A7", marginBottom: "4px" }}>
                      {loc.thana}
                    </div>
                    <div style={{ fontSize: "10.5px", color: "#B0B4C9", fontFamily: "monospace" }}>
                      {loc.lat}, {loc.lng}
                    </div>
                    <div style={{ fontSize: "10.5px", color: "#B0B4C9", marginTop: "2px" }}>
                      {loc.lastSeen}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </>
  );
}

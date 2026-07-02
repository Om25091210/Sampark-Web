import Topbar from "@/components/layout/Topbar";

const NOTIFICATIONS = [
  {
    id: 1,
    type: "submit",
    title: "रिपोर्ट सबमिट",
    desc: "राजेश कुमार सिंह ने जून 2026 की मासिक रिपोर्ट जमा की",
    time: "अभी",
    read: false,
    avatar: "RK",
    color: "#1DA8E0",
    bg: "#E8F4FD",
  },
  {
    id: 2,
    type: "approve",
    title: "रिपोर्ट अनुमोदित",
    desc: "प्रिया वर्मा की मई रिपोर्ट थाना प्रभारी द्वारा अनुमोदित की गई",
    time: "15 मिनट पहले",
    read: false,
    avatar: "PV",
    color: "#27AE60",
    bg: "#E8F8EF",
  },
  {
    id: 3,
    type: "pending",
    title: "रिपोर्ट लंबित",
    desc: "अमित पटेल की रिपोर्ट अभी तक जमा नहीं हुई — अनुस्मारक भेजा गया",
    time: "30 मिनट पहले",
    read: false,
    avatar: "AP",
    color: "#E07B2A",
    bg: "#FFF4E8",
  },
  {
    id: 4,
    type: "contact",
    title: "संपर्क अपडेट",
    desc: "सुनीता देशमुख ने नया संपर्क विवरण दर्ज किया",
    time: "1 घंटे पहले",
    read: true,
    avatar: "SD",
    color: "#8B90A7",
    bg: "#F5F6FA",
  },
  {
    id: 5,
    type: "update",
    title: "जानकारी अपडेट",
    desc: "विकास गुप्ता ने अपना पता बदलने की जानकारी दी",
    time: "2 घंटे पहले",
    read: true,
    avatar: "VG",
    color: "#8B90A7",
    bg: "#F5F6FA",
  },
  {
    id: 6,
    type: "warning",
    title: "समय सीमा चेतावनी",
    desc: "कुटरू CSP की 3 रिपोर्टें आज की समय सीमा से पहले जमा करनी हैं",
    time: "3 घंटे पहले",
    read: true,
    avatar: "SY",
    color: "#E74C3C",
    bg: "#FDE8E8",
  },
  {
    id: 7,
    type: "approve",
    title: "त्रैमासिक रिपोर्ट अनुमोदित",
    desc: "भोपालपट्टनम CSP की Q2 रिपोर्ट SP कार्यालय द्वारा अनुमोदित",
    time: "1 दिन पहले",
    read: true,
    avatar: "SD",
    color: "#27AE60",
    bg: "#E8F8EF",
  },
  {
    id: 8,
    type: "submit",
    title: "बल्क रिपोर्ट",
    desc: "भैरमगढ़ थाने की 6 रिपोर्टें एक साथ प्राप्त हुईं",
    time: "2 दिन पहले",
    read: true,
    avatar: "PV",
    color: "#1DA8E0",
    bg: "#E8F4FD",
  },
];

const TYPE_ICONS: Record<string, React.ReactNode> = {
  submit: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  ),
  approve: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ),
  pending: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  ),
  contact: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13 19.79 19.79 0 0 1 1.61 4.4 2 2 0 0 1 3.58 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 9.91a16 16 0 0 0 6.07 6.07l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  ),
  update: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="1 4 1 10 7 10" />
      <path d="M3.51 15a9 9 0 1 0 .49-3" />
    </svg>
  ),
  warning: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  ),
};

const unread = NOTIFICATIONS.filter((n) => !n.read).length;

export default function NotificationsPage() {
  return (
    <>
      <Topbar
        title="सूचनाएं"
        subtitle="सभी रिपोर्टिंग और सिस्टम अधिसूचनाएं"
      />

      <div style={{ padding: "24px 28px", display: "flex", flexDirection: "column", gap: "20px" }}>

        {/* Header Row */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", gap: "12px" }}>
            {["सभी", "अपठित", "अनुमोदित", "लंबित"].map((tab, i) => (
              <button
                key={tab}
                style={{
                  padding: "7px 16px",
                  borderRadius: "20px",
                  border: i === 0 ? "none" : "1px solid #E8EAF0",
                  background: i === 0 ? "#1DA8E0" : "#fff",
                  color: i === 0 ? "#fff" : "#8B90A7",
                  fontSize: "13px",
                  fontWeight: 600,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                {tab}
                {i === 1 && unread > 0 && (
                  <span
                    style={{
                      background: "#E74C3C",
                      color: "#fff",
                      borderRadius: "10px",
                      padding: "0 6px",
                      fontSize: "10px",
                      fontWeight: 700,
                    }}
                  >
                    {unread}
                  </span>
                )}
              </button>
            ))}
          </div>
          <div style={{ fontSize: "12px", color: "#8B90A7" }}>
            {unread} अपठित · {NOTIFICATIONS.length} कुल
          </div>
        </div>

        {/* Notification List */}
        <div
          style={{
            background: "#fff",
            borderRadius: "14px",
            border: "1px solid #E8EAF0",
            overflow: "hidden",
          }}
        >
          {NOTIFICATIONS.map((notif, i) => (
            <div
              key={notif.id}
              style={{
                display: "flex",
                gap: "14px",
                padding: "16px 22px",
                borderBottom: i < NOTIFICATIONS.length - 1 ? "1px solid #F5F6FA" : "none",
                background: notif.read ? "#fff" : "#FAFCFF",
                alignItems: "flex-start",
                position: "relative",
              }}
            >
              {/* Unread dot */}
              {!notif.read && (
                <div
                  style={{
                    position: "absolute",
                    left: "8px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    width: "6px",
                    height: "6px",
                    borderRadius: "50%",
                    background: "#1DA8E0",
                  }}
                />
              )}

              {/* Icon */}
              <div
                style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "10px",
                  background: notif.bg,
                  color: notif.color,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                {TYPE_ICONS[notif.type]}
              </div>

              {/* Content */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "4px" }}>
                  <div
                    style={{
                      fontSize: "13.5px",
                      fontWeight: notif.read ? 500 : 700,
                      color: "#1A1D2E",
                    }}
                  >
                    {notif.title}
                  </div>
                  <div style={{ fontSize: "11px", color: "#B0B4C9", flexShrink: 0, marginLeft: "12px" }}>
                    {notif.time}
                  </div>
                </div>
                <div style={{ fontSize: "12.5px", color: "#8B90A7", lineHeight: 1.5 }}>
                  {notif.desc}
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>
    </>
  );
}

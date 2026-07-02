// Mock data for Sampark — Bijapur Police Platform

export const OFFICERS = [
  { id: 1, name: "राजेश कुमार सिंह", badge: "BP-1042", thana: "बीजापुर सदर", avatar: "RK", status: "active" },
  { id: 2, name: "प्रिया वर्मा", badge: "BP-1056", thana: "भैरमगढ़", avatar: "PV", status: "active" },
  { id: 3, name: "अमित पटेल", badge: "BP-1078", thana: "उसूर", avatar: "AP", status: "pending" },
  { id: 4, name: "सुनीता देशमुख", badge: "BP-1091", thana: "भोपालपट्टनम", avatar: "SD", status: "completed" },
  { id: 5, name: "विकास गुप्ता", badge: "BP-1103", thana: "कुटरू", avatar: "VG", status: "waiting" },
  { id: 6, name: "मीना राव", badge: "BP-1115", thana: "बासागुड़ा", avatar: "MR", status: "active" },
];

export const RECENT_REPORTS = [
  {
    id: 1,
    person: "मनोज कुमार",
    thana: "बीजापुर सदर",
    status: "completed",
    time: "2 घंटे पहले",
    avatar: "MK",
    preview: "मासिक रिपोर्टिंग - सभी दस्तावेज़ सत्यापित किए गए",
    location: "बीजापुर",
  },
  {
    id: 2,
    person: "संगीता यादव",
    thana: "भैरमगढ़",
    status: "pending",
    time: "4 घंटे पहले",
    avatar: "SY",
    preview: "साप्ताहिक रिपोर्टिंग लंबित - दस्तावेज़ जमा नहीं हुए",
    location: "भैरमगढ़",
  },
  {
    id: 3,
    person: "दीपक वर्मा",
    thana: "उसूर",
    status: "waiting",
    time: "1 दिन पहले",
    avatar: "DV",
    preview: "अनुमोदन की प्रतीक्षा - थाना प्रभारी से सत्यापन बाकी",
    location: "उसूर",
  },
  {
    id: 4,
    person: "कविता सिंह",
    thana: "भोपालपट्टनम",
    status: "completed",
    time: "1 दिन पहले",
    avatar: "KS",
    preview: "त्रैमासिक रिपोर्ट सफलतापूर्वक जमा की गई",
    location: "भोपालपट्टनम",
  },
  {
    id: 5,
    person: "अर्जुन राठौड़",
    thana: "कुटरू",
    status: "pending",
    time: "2 दिन पहले",
    avatar: "AR",
    preview: "मासिक रिपोर्टिंग - जमा करने की अंतिम तिथि नजदीक",
    location: "कुटरू",
  },
];

export const ACTIVITY_FEED = [
  { id: 1, text: "राजेश कुमार ने रिपोर्ट जमा की", time: "अभी", type: "submit", officer: "RK" },
  { id: 2, text: "प्रिया वर्मा की रिपोर्ट अनुमोदित", time: "15 मिनट पहले", type: "approve", officer: "PV" },
  { id: 3, text: "अमित पटेल की रिपोर्ट लंबित", time: "30 मिनट पहले", type: "pending", officer: "AP" },
  { id: 4, text: "सुनीता देशमुख ने संपर्क किया", time: "1 घंटे पहले", type: "contact", officer: "SD" },
  { id: 5, text: "विकास गुप्ता की जानकारी अपडेट", time: "2 घंटे पहले", type: "update", officer: "VG" },
];

export const STAT_CARDS = [
  { label: "कुल कार्य", value: "156", delta: "+12 इस सप्ताह", color: "accent", icon: "tasks" },
  { label: "लंबित", value: "54", delta: "-3 कल से", color: "orange", icon: "pending" },
  { label: "पूर्ण", value: "58", delta: "+8 इस सप्ताह", color: "success", icon: "done" },
  { label: "अनुमोदन प्रतीक्षा", value: "44", delta: "+5 कल से", color: "danger", icon: "waiting" },
];

export const BAR_CHART_DATA = [
  { month: "जन", tasks: 65, reports: 48 },
  { month: "फर", tasks: 80, reports: 62 },
  { month: "मार", tasks: 72, reports: 55 },
  { month: "अप्र", tasks: 90, reports: 78 },
  { month: "मई", tasks: 85, reports: 70 },
  { month: "जून", tasks: 95, reports: 88 },
];

export const CSP_PERFORMANCE = [
  { name: "भैरमगढ़ CSP", progress: 88, color: "#1DA8E0" },
  { name: "उसूर CSP", progress: 72, color: "#E07B2A" },
  { name: "भोपालपट्टनम CSP", progress: 95, color: "#27AE60" },
  { name: "कुटरू CSP", progress: 65, color: "#E74C3C" },
];

export const LEADERBOARD = [
  { rank: 1, name: "राजेश कुमार", thana: "बीजापुर सदर", count: 48, avatar: "RK" },
  { rank: 2, name: "प्रिया वर्मा", thana: "भैरमगढ़", count: 42, avatar: "PV" },
  { rank: 3, name: "सुनीता देशमुख", thana: "भोपालपट्टनम", count: 38, avatar: "SD" },
  { rank: 4, name: "मीना राव", thana: "बासागुड़ा", count: 35, avatar: "MR" },
  { rank: 5, name: "अमित पटेल", thana: "उसूर", count: 29, avatar: "AP" },
];

export const PROFILE_DATA = {
  name: "राजेश कुमार सिंह",
  badge: "BP-1042",
  thana: "बीजापुर सदर",
  rank: "सहायक उपनिरीक्षक",
  phone: "+91 94250 12345",
  address: "मकान नं. 42, पुलिस कॉलोनी, बीजापुर, छत्तीसगढ़ 494444",
  dob: "15 August 1985",
  joiningDate: "01 January 2010",
  caseNo: "CR-2019-0042",
  surrenderDate: "15 March 2019",
  district: "बीजापुर",
  state: "छत्तीसगढ़",
  avatar: "RK",
  totalReports: 48,
  lastReport: "2 घंटे पहले",
  complianceRate: 94,
};

export const CALENDAR_DATES_WITH_REPORTS = [2, 5, 8, 12, 15, 19, 22, 26, 28];

export const STATUS_COLORS: Record<string, { bg: string; text: string; border: string; label: string }> = {
  completed: { bg: "#E8F8EF", text: "#27AE60", border: "#27AE60", label: "पूर्ण" },
  pending: { bg: "#FFF4E8", text: "#E07B2A", border: "#E07B2A", label: "लंबित" },
  waiting: { bg: "#FDE8E8", text: "#E74C3C", border: "#E74C3C", label: "प्रतीक्षा" },
  active: { bg: "#E8F4FD", text: "#1DA8E0", border: "#1DA8E0", label: "सक्रिय" },
};

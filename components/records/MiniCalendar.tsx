"use client";

import { useEffect, useState } from "react";
import ReportDetailModal from "@/components/dashboard/ReportDetailModal";
import { listReports, type WireReport } from "@/lib/api";
import { getInitials } from "@/lib/cadres";

const DAYS_OF_WEEK = ["र", "सो", "मं", "बु", "गु", "शु", "श"];
const MONTHS = ["जनवरी", "फरवरी", "मार्च", "अप्रैल", "मई", "जून", "जुलाई", "अगस्त", "सितंबर", "अक्टूबर", "नवंबर", "दिसंबर"];

const PLACE_LABEL: Record<WireReport["reportingPlace"], string> = {
  thana: "थाना",
  village: "गांव",
};

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

// Real calendar, real "today" (previously hardcoded to a fixed May-2026/day-28
// snapshot, non-clickable). The leaderboard this sidebar used to end in
// ("प्रमुख रिपोर्ट") was unrelated mock data with no meaning on a reporting-record
// page -- clicking a date now shows the reports actually filed that day (GET
// /reports, reportedAfter-scoped, same endpoint + detail modal the dashboard
// uses), which is what belongs next to a reporting record.
export default function MiniCalendar() {
  const today = new Date();
  const [viewedMonth, setViewedMonth] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [selectedDate, setSelectedDate] = useState(today);
  const [daysWithReports, setDaysWithReports] = useState<Set<number>>(new Set());
  const [dayReports, setDayReports] = useState<WireReport[]>([]);
  const [loadingDay, setLoadingDay] = useState(true);
  const [selectedReport, setSelectedReport] = useState<WireReport | null>(null);

  const year = viewedMonth.getFullYear();
  const month = viewedMonth.getMonth();
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);

  const days: (number | null)[] = Array(firstDay).fill(null);
  for (let i = 1; i <= daysInMonth; i++) days.push(i);

  const prevMonth = () => setViewedMonth(new Date(year, month - 1, 1));
  const nextMonth = () => setViewedMonth(new Date(year, month + 1, 1));

  // Marker dots for the visible month. Best-effort: GET /reports has no upper
  // bound on `reportedAfter`, so this reliably covers the current month and
  // degrades to fewer/no dots further back — never a wrong dot, since every
  // candidate is re-checked against the exact month range below.
  useEffect(() => {
    const monthStart = new Date(year, month, 1);
    const monthEnd = new Date(year, month + 1, 1);
    listReports({ reportedAfter: monthStart.toISOString(), pageSize: 50 })
      .then((res) => {
        const set = new Set<number>();
        for (const r of res.data) {
          const d = new Date(r.reportedAt);
          if (d >= monthStart && d < monthEnd) set.add(d.getDate());
        }
        setDaysWithReports(set);
      })
      .catch(() => setDaysWithReports(new Set()));
  }, [year, month]);

  // Reports filed on the selected date.
  useEffect(() => {
    const dayStart = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());
    const dayEnd = new Date(dayStart.getFullYear(), dayStart.getMonth(), dayStart.getDate() + 1);
    listReports({ reportedAfter: dayStart.toISOString(), pageSize: 50 })
      .then((res) => {
        setDayReports(
          res.data.filter((r) => new Date(r.reportedAt) < dayEnd),
        );
      })
      .catch(() => setDayReports([]))
      .finally(() => setLoadingDay(false));
  }, [selectedDate]);

  return (
    <div
      style={{
        width: "300px",
        flexShrink: 0,
        background: "#fff",
        borderLeft: "1px solid #E8EAF0",
        display: "flex",
        flexDirection: "column",
        overflowY: "auto",
      }}
    >
      {/* Calendar */}
      <div style={{ padding: "18px 16px" }}>
        {/* Month nav */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
          <button
            onClick={prevMonth}
            aria-label="पिछला महीना"
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "#8B90A7",
              padding: "4px 6px",
              borderRadius: "6px",
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <div style={{ fontSize: "13.5px", fontWeight: 700, color: "#1A1D2E" }}>
            {MONTHS[month]} {year}
          </div>
          <button
            onClick={nextMonth}
            aria-label="अगला महीना"
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "#8B90A7",
              padding: "4px 6px",
              borderRadius: "6px",
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        </div>

        {/* Day labels */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "2px", marginBottom: "6px" }}>
          {DAYS_OF_WEEK.map((d, i) => (
            <div
              key={`${d}-${i}`}
              style={{
                textAlign: "center",
                fontSize: "10px",
                fontWeight: 600,
                color: "#B0B4C9",
                padding: "4px 0",
              }}
            >
              {d}
            </div>
          ))}
        </div>

        {/* Date grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "2px" }}>
          {days.map((day, i) => {
            if (!day) return <div key={`empty-${i}`} />;
            const cellDate = new Date(year, month, day);
            const isToday = isSameDay(cellDate, today);
            const isSelected = isSameDay(cellDate, selectedDate);
            const hasReport = daysWithReports.has(day);
            return (
              <button
                key={day}
                onClick={() => {
                  setSelectedDate(cellDate);
                  setLoadingDay(true);
                }}
                style={{
                  textAlign: "center",
                  padding: "6px 2px",
                  borderRadius: "6px",
                  cursor: "pointer",
                  border: isSelected && !isToday ? "1.5px solid #1DA8E0" : "1.5px solid transparent",
                  background: isToday ? "#1DA8E0" : "transparent",
                  position: "relative",
                }}
              >
                <span
                  style={{
                    fontSize: "12px",
                    fontWeight: isToday || isSelected ? 700 : hasReport ? 600 : 400,
                    color: isToday ? "#fff" : hasReport ? "#1A1D2E" : "#B0B4C9",
                  }}
                >
                  {day}
                </span>
                {hasReport && !isToday && (
                  <div
                    style={{
                      position: "absolute",
                      bottom: "1px",
                      left: "50%",
                      transform: "translateX(-50%)",
                      width: "4px",
                      height: "4px",
                      borderRadius: "50%",
                      background: "#E07B2A",
                    }}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Divider */}
      <div style={{ height: "1px", background: "#E8EAF0", margin: "0 16px" }} />

      {/* Selected date's reports — replaces the unrelated "प्रमुख रिपोर्ट" leaderboard */}
      <div style={{ padding: "16px" }}>
        <div style={{ fontSize: "13.5px", fontWeight: 700, color: "#1A1D2E", marginBottom: "14px" }}>
          {isSameDay(selectedDate, today)
            ? "आज की रिपोर्ट"
            : `${selectedDate.getDate()} ${MONTHS[selectedDate.getMonth()]} की रिपोर्ट`}
        </div>

        {loadingDay && <div style={{ fontSize: "12px", color: "#8B90A7" }}>लोड हो रहा है...</div>}

        {!loadingDay && dayReports.length === 0 && (
          <div style={{ fontSize: "12px", color: "#8B90A7" }}>इस तारीख को कोई रिपोर्ट नहीं</div>
        )}

        {!loadingDay && dayReports.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {dayReports.map((r) => (
              <div
                key={r.id}
                onClick={() => setSelectedReport(r)}
                style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer" }}
              >
                {/* Avatar */}
                <div
                  style={{
                    width: "30px",
                    height: "30px",
                    borderRadius: "50%",
                    background: "linear-gradient(135deg, #1DA8E0, #0F1C3F)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#fff",
                    fontSize: "10px",
                    fontWeight: 700,
                    flexShrink: 0,
                  }}
                >
                  {r.cadre ? getInitials(r.cadre.name) : "?"}
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: "12.5px",
                      fontWeight: 600,
                      color: "#1A1D2E",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {r.cadre?.name ?? `कैडर #${r.cadreId}`}
                  </div>
                  <div style={{ fontSize: "11px", color: "#8B90A7" }}>{PLACE_LABEL[r.reportingPlace]}</div>
                </div>

                {/* Time */}
                <div className="tabular-nums" style={{ fontSize: "12px", fontWeight: 700, color: "#1DA8E0", flexShrink: 0 }}>
                  {formatTime(r.reportedAt)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedReport && (
        <ReportDetailModal report={selectedReport} onClose={() => setSelectedReport(null)} />
      )}
    </div>
  );
}

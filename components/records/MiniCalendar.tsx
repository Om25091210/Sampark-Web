"use client";

import { useState } from "react";
import { CALENDAR_DATES_WITH_REPORTS, LEADERBOARD } from "@/lib/constants";

const DAYS_OF_WEEK = ["र", "सो", "मं", "बु", "गु", "शु", "श"];
const MONTHS = ["जनवरी", "फरवरी", "मार्च", "अप्रैल", "मई", "जून", "जुलाई", "अगस्त", "सितंबर", "अक्टूबर", "नवंबर", "दिसंबर"];

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

export default function MiniCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date(2026, 4, 1)); // May 2026
  const today = 28; // Highlighted "today"

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);

  const days: (number | null)[] = Array(firstDay).fill(null);
  for (let i = 1; i <= daysInMonth; i++) days.push(i);

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

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
          {DAYS_OF_WEEK.map((d) => (
            <div
              key={d}
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
            const isToday = day === today;
            const hasReport = CALENDAR_DATES_WITH_REPORTS.includes(day);
            return (
              <div
                key={day}
                style={{
                  textAlign: "center",
                  padding: "6px 2px",
                  borderRadius: "6px",
                  cursor: "pointer",
                  background: isToday ? "#1DA8E0" : "transparent",
                  position: "relative",
                }}
              >
                <span
                  style={{
                    fontSize: "12px",
                    fontWeight: isToday ? 700 : hasReport ? 600 : 400,
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
              </div>
            );
          })}
        </div>
      </div>

      {/* Divider */}
      <div style={{ height: "1px", background: "#E8EAF0", margin: "0 16px" }} />

      {/* Leaderboard */}
      <div style={{ padding: "16px" }}>
        <div style={{ fontSize: "13.5px", fontWeight: 700, color: "#1A1D2E", marginBottom: "14px" }}>
          प्रमुख रिपोर्ट
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {LEADERBOARD.map((entry) => (
            <div
              key={entry.rank}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
              }}
            >
              {/* Rank */}
              <div
                style={{
                  width: "22px",
                  height: "22px",
                  borderRadius: "50%",
                  background: entry.rank <= 3
                    ? entry.rank === 1 ? "#E07B2A" : entry.rank === 2 ? "#8B90A7" : "#1DA8E0"
                    : "#F5F6FA",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "10px",
                  fontWeight: 700,
                  color: entry.rank <= 3 ? "#fff" : "#B0B4C9",
                  flexShrink: 0,
                }}
              >
                {entry.rank}
              </div>

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
                {entry.avatar}
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
                  {entry.name}
                </div>
                <div style={{ fontSize: "11px", color: "#8B90A7" }}>{entry.thana}</div>
              </div>

              {/* Count */}
              <div
                style={{
                  fontSize: "13px",
                  fontWeight: 700,
                  color: "#1DA8E0",
                  flexShrink: 0,
                }}
              >
                {entry.count}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

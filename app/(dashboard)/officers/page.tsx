"use client";

import { useEffect, useRef, useState } from "react";
import { Search } from "lucide-react";
import Topbar from "@/components/layout/Topbar";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { listOfficers, type WireOfficer } from "@/lib/api";

const PAGE_SIZE = 15;

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase() || "?";
}

// Deterministic avatar tint from the officer's id -- no random color per render.
const AVATAR_PAIRS = [
  ["var(--brand)", "var(--navy)"],
  ["var(--amber)", "#C0611A"],
  ["var(--emerald)", "#1E8A4A"],
  ["var(--rose)", "#C0392B"],
];

export default function OfficersPage() {
  const [officers, setOfficers] = useState<WireOfficer[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function fetchPage(targetPage: number) {
    setLoading(true);
    listOfficers({ search: search || undefined, page: targetPage, pageSize: PAGE_SIZE })
      .then((res) => {
        setOfficers(res.data);
        setTotal(res.total);
        setHasMore(res.hasMore);
        setPage(targetPage);
        setError(false);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchPage(1), 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  return (
    <>
      <Topbar title="अधिकारी सूची" subtitle="बीजापुर जिले के सभी नियुक्त अधिकारी" />

      <div style={{ padding: "var(--space-6) var(--space-8)", display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
        <div style={{ display: "flex", gap: "var(--space-3)", alignItems: "center" }}>
          <div style={{ position: "relative", flex: 1, maxWidth: 320 }}>
            <Search
              size={15}
              strokeWidth={1.75}
              color="var(--text-tertiary)"
              style={{ position: "absolute", left: "var(--space-3)", top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}
            />
            <input
              className="input"
              style={{ paddingLeft: 34 }}
              placeholder="नाम से खोजें..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <span className="t-caption">कुल {total} अधिकारी</span>
        </div>

        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          {error && (
            <div style={{ padding: "var(--space-6)", textAlign: "center" }}>
              <p className="t-body-sm" style={{ color: "var(--rose)" }}>अधिकारी सूची लोड नहीं हो सकी।</p>
            </div>
          )}
          {!error && !loading && officers.length === 0 && (
            <div style={{ padding: "var(--space-10)", textAlign: "center" }}>
              <p className="t-body-sm" style={{ color: "var(--text-tertiary)" }}>कोई अधिकारी नहीं मिला</p>
            </div>
          )}
          {!error && (loading || officers.length > 0) && (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  {["अधिकारी", "पदनाम", "थाना", "नियुक्त कैडर", "स्थिति"].map((h) => (
                    <th
                      key={h}
                      className="t-overline"
                      style={{ textAlign: "left", padding: "var(--space-3) var(--space-4)", borderBottom: "1px solid var(--border)" }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {officers.map((o, i) => {
                  const [c1, c2] = AVATAR_PAIRS[i % AVATAR_PAIRS.length]!;
                  return (
                    <tr key={o.id} style={{ borderBottom: "1px solid var(--border)" }}>
                      <td style={{ padding: "var(--space-3) var(--space-4)" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
                          <div
                            style={{
                              width: 32,
                              height: 32,
                              borderRadius: "var(--radius-full)",
                              background: `linear-gradient(135deg, ${c1}, ${c2})`,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              color: "#fff",
                              fontSize: "0.6875rem",
                              fontWeight: 700,
                              flexShrink: 0,
                            }}
                          >
                            {initialsOf(o.name)}
                          </div>
                          <div>
                            <div className="t-body-sm" style={{ fontWeight: 600 }}>{o.name}</div>
                            {o.phone && <div className="t-caption">{o.phone}</div>}
                          </div>
                        </div>
                      </td>
                      <td className="t-body-sm" style={{ padding: "var(--space-3) var(--space-4)" }}>
                        {o.designation ?? "—"}
                      </td>
                      <td className="t-body-sm" style={{ padding: "var(--space-3) var(--space-4)" }}>
                        {o.thana ?? "—"}
                      </td>
                      <td style={{ padding: "var(--space-3) var(--space-4)" }}>
                        <span className="tabular-nums t-body-sm" style={{ fontWeight: 700, color: "var(--brand-strong)" }}>
                          {o.assignedCadreCount}
                        </span>
                      </td>
                      <td style={{ padding: "var(--space-3) var(--space-4)" }}>
                        <Badge tone={o.status === "deactivated" ? "danger" : "success"}>
                          {o.status === "deactivated" ? "निष्क्रिय" : "सक्रिय"}
                        </Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: "var(--space-2)" }}>
          <Button variant="secondary" size="sm" disabled={page <= 1 || loading} onClick={() => fetchPage(page - 1)}>
            पिछला
          </Button>
          <Button variant="secondary" size="sm" disabled={!hasMore || loading} onClick={() => fetchPage(page + 1)}>
            अगला
          </Button>
        </div>
      </div>
    </>
  );
}

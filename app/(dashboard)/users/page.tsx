"use client";

import { useEffect, useRef, useState } from "react";
import { Plus, Search } from "lucide-react";
import Topbar from "@/components/layout/Topbar";
import Button from "@/components/ui/Button";
import UsersTable from "@/components/users/UsersTable";
import UserFormModal from "@/components/users/UserFormModal";
import ConfirmDialog from "@/components/users/ConfirmDialog";
import PasswordResetModal from "@/components/users/PasswordResetModal";
import { listUsers, deactivateUser, ApiError, type WireUser } from "@/lib/api";
import { STATUS_FILTER_OPTIONS, ROLE_OPTIONS, type UserRole } from "@/lib/users";

const PAGE_SIZE = 15;

type Dialog =
  | { kind: "create" }
  | { kind: "edit"; user: WireUser }
  | { kind: "password"; user: WireUser }
  | { kind: "deactivate"; user: WireUser }
  | null;

export default function UsersPage() {
  const [users, setUsers] = useState<WireUser[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [search, setSearch] = useState("");
  const [role, setRole] = useState<UserRole | "">("");
  const [status, setStatus] = useState<"active" | "deactivated" | "all">("active");
  const [loading, setLoading] = useState(false);
  const [forbidden, setForbidden] = useState(false);
  const [dialog, setDialog] = useState<Dialog>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function fetchPage(targetPage: number) {
    setLoading(true);
    listUsers({
      search: search || undefined,
      role: role || undefined,
      status,
      page: targetPage,
      pageSize: PAGE_SIZE,
    })
      .then((res) => {
        setUsers(res.data);
        setTotal(res.total);
        setHasMore(res.hasMore);
        setPage(targetPage);
        setForbidden(false);
      })
      .catch((err) => {
        setUsers([]);
        setTotal(0);
        setHasMore(false);
        // ADR-056: /users is super_admin-only. A non-super_admin session gets a
        // real 403 from the API here -- this is that gate, not a hidden nav link.
        if (err instanceof ApiError && err.status === 403) setForbidden(true);
      })
      .finally(() => setLoading(false));
  }

  // Refetch page 1 whenever a filter changes. Search is debounced.
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchPage(1), 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, role, status]);

  // Refetch the current page after any mutation -- never assume success optimistically.
  function refetch() {
    fetchPage(page);
  }

  if (forbidden) {
    return (
      <>
        <Topbar title="उपयोगकर्ता प्रबंधन" />
        <div style={{ padding: "var(--space-10)", textAlign: "center" }}>
          <p className="t-body">आपके पास इस पृष्ठ तक पहुंच नहीं है।</p>
        </div>
      </>
    );
  }

  return (
    <>
      <Topbar title="उपयोगकर्ता प्रबंधन" subtitle="खाते बनाएं, संपादित करें और निष्क्रिय करें" />
      <div
        style={{
          padding: "var(--space-6) var(--space-8)",
          display: "flex",
          flexDirection: "column",
          gap: "var(--space-4)",
        }}
      >
        <div style={{ display: "flex", gap: "var(--space-3)", alignItems: "center", flexWrap: "wrap" }}>
          <div style={{ position: "relative", flex: 1, minWidth: 220 }}>
            <Search
              size={15}
              strokeWidth={1.75}
              color="var(--text-tertiary)"
              style={{
                position: "absolute",
                left: "var(--space-3)",
                top: "50%",
                transform: "translateY(-50%)",
                pointerEvents: "none",
              }}
            />
            <input
              className="input"
              style={{ paddingLeft: 34 }}
              placeholder="संस्थागत आईडी से खोजें..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select
            className="input"
            style={{ width: 160 }}
            value={role}
            onChange={(e) => setRole(e.target.value as UserRole | "")}
          >
            <option value="">सभी भूमिकाएं</option>
            {ROLE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <select
            className="input"
            style={{ width: 140 }}
            value={status}
            onChange={(e) => setStatus(e.target.value as "active" | "deactivated" | "all")}
          >
            {STATUS_FILTER_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <Button variant="primary" onClick={() => setDialog({ kind: "create" })}>
            <Plus size={16} strokeWidth={2} />
            नया खाता
          </Button>
        </div>

        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          <UsersTable
            users={users}
            loading={loading}
            onEdit={(u) => setDialog({ kind: "edit", user: u })}
            onResetPassword={(u) => setDialog({ kind: "password", user: u })}
            onDeactivate={(u) => setDialog({ kind: "deactivate", user: u })}
          />
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span className="t-caption">कुल {total} खाते</span>
          <div style={{ display: "flex", gap: "var(--space-2)" }}>
            <Button variant="secondary" size="sm" disabled={page <= 1 || loading} onClick={() => fetchPage(page - 1)}>
              पिछला
            </Button>
            <Button variant="secondary" size="sm" disabled={!hasMore || loading} onClick={() => fetchPage(page + 1)}>
              अगला
            </Button>
          </div>
        </div>
      </div>

      {dialog?.kind === "create" && <UserFormModal mode="create" onClose={() => setDialog(null)} onSaved={refetch} />}
      {dialog?.kind === "edit" && (
        <UserFormModal mode="edit" user={dialog.user} onClose={() => setDialog(null)} onSaved={refetch} />
      )}
      {dialog?.kind === "password" && <PasswordResetModal user={dialog.user} onClose={() => setDialog(null)} />}
      {dialog?.kind === "deactivate" && (
        <ConfirmDialog
          title="खाता निष्क्रिय करें"
          message={`${dialog.user.name} तुरंत लॉग आउट हो जाएगा और दोबारा लॉगिन नहीं कर पाएगा। जारी रखें?`}
          confirmLabel="निष्क्रिय करें"
          onConfirm={async () => {
            await deactivateUser(dialog.user.id);
            refetch();
          }}
          onClose={() => setDialog(null)}
        />
      )}
    </>
  );
}

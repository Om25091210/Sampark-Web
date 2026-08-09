"use client";

import type { ReactNode } from "react";
import { KeyRound, Pencil, UserX } from "lucide-react";
import Badge from "@/components/ui/Badge";
import type { WireUser } from "@/lib/api";
import { ROLE_LABELS, STATUS_LABELS, roleBadgeTone } from "@/lib/users";

interface UsersTableProps {
  users: WireUser[];
  loading: boolean;
  onEdit: (user: WireUser) => void;
  onResetPassword: (user: WireUser) => void;
  onDeactivate: (user: WireUser) => void;
}

const COLS = ["संस्थागत आईडी", "भूमिका", "थाना / उप-मंडल", "पदनाम", "स्थिति", ""];

function IconAction({
  label,
  danger,
  onClick,
  children,
}: {
  label: string;
  danger?: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      title={label}
      style={{
        width: 30,
        height: 30,
        borderRadius: "var(--radius-md)",
        border: "1px solid var(--border)",
        background: "var(--surface)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        color: danger ? "var(--rose)" : "var(--text-secondary)",
      }}
    >
      {children}
    </button>
  );
}

export default function UsersTable({ users, loading, onEdit, onResetPassword, onDeactivate }: UsersTableProps) {
  if (!loading && users.length === 0) {
    return (
      <div style={{ padding: "var(--space-10)", textAlign: "center" }}>
        <p className="t-body-sm" style={{ color: "var(--text-tertiary)" }}>
          कोई खाता नहीं मिला
        </p>
      </div>
    );
  }

  return (
    <table style={{ width: "100%", borderCollapse: "collapse" }}>
      <thead>
        <tr>
          {COLS.map((c) => (
            <th
              key={c}
              className="t-overline"
              style={{ textAlign: "left", padding: "var(--space-3) var(--space-4)", borderBottom: "1px solid var(--border)" }}
            >
              {c}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {users.map((u) => (
          <tr key={u.id} style={{ borderBottom: "1px solid var(--border)" }}>
            <td style={{ padding: "var(--space-3) var(--space-4)" }}>
              <div className="t-body-sm" style={{ fontWeight: 600 }}>
                {u.name}
              </div>
              {u.email && <div className="t-caption">{u.email}</div>}
            </td>
            <td style={{ padding: "var(--space-3) var(--space-4)" }}>
              <Badge tone={roleBadgeTone(u.role)}>{ROLE_LABELS[u.role]}</Badge>
            </td>
            <td className="t-body-sm" style={{ padding: "var(--space-3) var(--space-4)" }}>
              {u.thana ?? u.subDivision ?? "—"}
            </td>
            <td className="t-body-sm" style={{ padding: "var(--space-3) var(--space-4)" }}>
              {u.designation ?? "—"}
            </td>
            <td style={{ padding: "var(--space-3) var(--space-4)" }}>
              <Badge tone={u.status === "deactivated" ? "danger" : "success"}>
                {STATUS_LABELS[u.status ?? "active"]}
              </Badge>
            </td>
            <td style={{ padding: "var(--space-3) var(--space-4)" }}>
              <div style={{ display: "flex", gap: "var(--space-2)", justifyContent: "flex-end" }}>
                <IconAction label="संपादित करें" onClick={() => onEdit(u)}>
                  <Pencil size={15} strokeWidth={1.75} />
                </IconAction>
                <IconAction label="पासवर्ड रीसेट" onClick={() => onResetPassword(u)}>
                  <KeyRound size={15} strokeWidth={1.75} />
                </IconAction>
                {u.status !== "deactivated" && (
                  <IconAction label="निष्क्रिय करें" danger onClick={() => onDeactivate(u)}>
                    <UserX size={15} strokeWidth={1.75} />
                  </IconAction>
                )}
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

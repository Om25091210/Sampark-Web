import Link from "next/link";
import {
  ClipboardList,
  Clock,
  CheckCircle2,
  Hourglass,
  TrendingUp,
  TrendingDown,
  Users,
  AlertTriangle,
  FileText,
  type LucideIcon,
} from "lucide-react";
import Card from "@/components/ui/Card";

type ColorKey = "accent" | "orange" | "success" | "danger";

interface StatCardProps {
  label: string;
  value: string;
  /** Absent for real (non-comparative) stats -- the backend has no "vs last week"
   *  figure, and this component must not invent a trend arrow for one. */
  delta?: string;
  color: ColorKey;
  icon: string;
  /** When set, the whole card links to the filtered view this number represents. */
  href?: string;
}

/** Soft pastel bg + darker foreground icon per status. */
const TONES: Record<ColorKey, { bg: string; fg: string }> = {
  accent: { bg: "var(--brand-soft)", fg: "var(--brand-strong)" },
  orange: { bg: "var(--amber-soft)", fg: "var(--amber)" },
  success: { bg: "var(--emerald-soft)", fg: "var(--emerald)" },
  danger: { bg: "var(--violet-soft)", fg: "var(--violet)" },
};

const ICONS: Record<string, LucideIcon> = {
  tasks: ClipboardList,
  pending: Clock,
  done: CheckCircle2,
  waiting: Hourglass,
  cadres: Users,
  alerts: AlertTriangle,
  reports: FileText,
};

export default function StatCard({ label, value, delta, color, icon, href }: StatCardProps) {
  const tone = TONES[color];
  const Icon = ICONS[icon] ?? ClipboardList;
  const isPositive = delta?.startsWith("+") ?? false;
  const isNegative = delta?.startsWith("-") ?? false;
  const deltaColor = isPositive
    ? "var(--emerald)"
    : isNegative
      ? "var(--rose)"
      : "var(--text-tertiary)";

  const card = (
    <Card
      padding="lg"
      elevated
      interactive={Boolean(href)}
      style={{ borderRadius: "var(--radius-xl)", display: "flex", flexDirection: "column", gap: "var(--space-4)" }}
    >
      {/* Label + icon */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "var(--space-3)" }}>
        <span className="t-caption" style={{ fontWeight: 500 }}>{label}</span>
        <span
          style={{
            width: "40px",
            height: "40px",
            background: tone.bg,
            borderRadius: "var(--radius-lg)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: tone.fg,
            flexShrink: 0,
          }}
        >
          <Icon size={20} strokeWidth={1.75} />
        </span>
      </div>

      {/* Metric */}
      <div
        className="tabular-nums"
        style={{
          fontSize: "2.25rem",
          fontWeight: 800,
          lineHeight: 1,
          letterSpacing: "-0.03em",
          color: "var(--text-primary)",
        }}
      >
        {value}
      </div>

      {/* Delta — omitted entirely when the caller has no comparative figure */}
      {delta && (
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "var(--space-1)",
            fontSize: "0.8125rem",
            fontWeight: 600,
            color: deltaColor,
          }}
        >
          {isPositive && <TrendingUp size={14} strokeWidth={2} />}
          {isNegative && <TrendingDown size={14} strokeWidth={2} />}
          <span>{delta}</span>
        </div>
      )}
    </Card>
  );

  if (!href) return card;

  return (
    <Link href={href} style={{ textDecoration: "none", display: "block" }}>
      {card}
    </Link>
  );
}

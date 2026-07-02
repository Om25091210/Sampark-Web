import type { CSSProperties, ReactNode } from "react";

const PADDING: Record<string, string> = {
  none: "0",
  sm: "var(--space-4)",
  md: "var(--space-5)",
  lg: "var(--space-6)",
};

interface CardProps {
  children: ReactNode;
  /** Inner padding on the 8pt scale. Default "md" (20px). */
  padding?: keyof typeof PADDING;
  /** Adds a subtle ambient shadow. Off by default (flat list cards). */
  elevated?: boolean;
  /** Adds hover affordance (border + shadow lift). */
  interactive?: boolean;
  className?: string;
  style?: CSSProperties;
  onClick?: () => void;
}

/**
 * Surface card. Flat by default (border only) — pass `elevated` for standalone
 * panels, keep flat for items inside lists/grids.
 */
export default function Card({
  children,
  padding = "md",
  elevated = false,
  interactive = false,
  className = "",
  style,
  onClick,
}: CardProps) {
  const classes = [
    "card",
    elevated && "card--elevated",
    interactive && "card--interactive",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      className={classes}
      onClick={onClick}
      style={{ padding: PADDING[padding], ...style }}
    >
      {children}
    </div>
  );
}

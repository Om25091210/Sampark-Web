import type { CSSProperties, ReactNode } from "react";

type Tone = "brand" | "success" | "pending" | "danger" | "neutral";

interface BadgeProps {
  children: ReactNode;
  tone?: Tone;
  /** Optional leading dot in the badge's text color. */
  dot?: boolean;
  className?: string;
  style?: CSSProperties;
}

/** Compact status pill. Tones map to the semantic color tints. */
export default function Badge({
  children,
  tone = "neutral",
  dot = false,
  className = "",
  style,
}: BadgeProps) {
  return (
    <span className={`badge badge--${tone} ${className}`.trim()} style={style}>
      {dot && (
        <span
          style={{
            width: 6,
            height: 6,
            borderRadius: "50%",
            background: "currentColor",
          }}
        />
      )}
      {children}
    </span>
  );
}

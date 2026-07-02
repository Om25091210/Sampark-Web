import type { CSSProperties, ElementType, ReactNode } from "react";

/* ---- Heading -------------------------------------------------------------- */

type HeadingLevel = 1 | 2 | 3 | 4;
type Display = "display";

const HEADING_CLASS: Record<string, string> = {
  display: "t-display",
  1: "t-h1",
  2: "t-h2",
  3: "t-h3",
  4: "t-h4",
};

// Which HTML tag to render for a given visual level.
const HEADING_TAG: Record<string, ElementType> = {
  display: "h1",
  1: "h1",
  2: "h2",
  3: "h3",
  4: "h4",
};

interface HeadingProps {
  children: ReactNode;
  /** Visual level — also drives the semantic tag unless `as` overrides it. */
  level?: HeadingLevel | Display;
  as?: ElementType;
  className?: string;
  style?: CSSProperties;
}

export function Heading({
  children,
  level = 2,
  as,
  className = "",
  style,
}: HeadingProps) {
  const key = String(level);
  const Tag = as ?? HEADING_TAG[key];
  return (
    <Tag className={`${HEADING_CLASS[key]} ${className}`.trim()} style={style}>
      {children}
    </Tag>
  );
}

/* ---- Text ----------------------------------------------------------------- */

type TextVariant = "body-lg" | "body" | "body-sm" | "caption" | "overline";
type TextColor = "primary" | "secondary" | "tertiary" | "disabled";

const TEXT_CLASS: Record<TextVariant, string> = {
  "body-lg": "t-body-lg",
  body: "t-body",
  "body-sm": "t-body-sm",
  caption: "t-caption",
  overline: "t-overline",
};

const TEXT_COLOR: Record<TextColor, string> = {
  primary: "var(--text-primary)",
  secondary: "var(--text-secondary)",
  tertiary: "var(--text-tertiary)",
  disabled: "var(--text-disabled)",
};

interface TextProps {
  children: ReactNode;
  variant?: TextVariant;
  /** Overrides the variant's default color from the text hierarchy. */
  color?: TextColor;
  weight?: 400 | 500 | 600 | 700;
  as?: ElementType;
  className?: string;
  style?: CSSProperties;
}

export function Text({
  children,
  variant = "body",
  color,
  weight,
  as: Tag = "p",
  className = "",
  style,
}: TextProps) {
  return (
    <Tag
      className={`${TEXT_CLASS[variant]} ${className}`.trim()}
      style={{
        ...(color ? { color: TEXT_COLOR[color] } : null),
        ...(weight ? { fontWeight: weight } : null),
        ...style,
      }}
    >
      {children}
    </Tag>
  );
}

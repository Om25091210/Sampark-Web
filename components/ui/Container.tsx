import type { CSSProperties, ElementType, ReactNode } from "react";

interface ContainerProps {
  children: ReactNode;
  /** Render element — defaults to a <div>. Use "section"/"main" for semantics. */
  as?: ElementType;
  className?: string;
  style?: CSSProperties;
}

/**
 * Centered, max-width (1200px) content wrapper with responsive side padding.
 * Ensures content never hits the viewport edge.
 */
export default function Container({
  children,
  as: Tag = "div",
  className = "",
  style,
}: ContainerProps) {
  return (
    <Tag className={`container-app ${className}`.trim()} style={style}>
      {children}
    </Tag>
  );
}

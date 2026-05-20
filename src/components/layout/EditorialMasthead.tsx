import { ReactNode } from "react";

interface EditorialMastheadProps {
  /** Issue/volume label e.g. "Vol. 02" */
  volume?: string;
  /** Section name e.g. "The Scene" */
  section: string;
  /** Optional trailing meta after section, e.g. "· 12 on deck" */
  meta?: string;
  /** Italic side eyebrow above the title, e.g. "selectively assembled" */
  eyebrow?: string;
  /** Main display title */
  title: string;
  /** Optional right-aligned action (button / toggle / etc.) */
  rightSlot?: ReactNode;
  /** Display scale — "lg" for hero pages, "md" for sub-pages */
  size?: "lg" | "md";
}

/**
 * Shared editorial masthead used across Feed, Scene, Club, Messages,
 * and member screens. Mirrors the Profile-page source-of-truth design:
 * Space Mono labels + Playfair italic eyebrow + Anton display title +
 * hairline rule below.
 */
const EditorialMasthead = ({
  volume = "Vol. 01",
  section,
  meta,
  eyebrow,
  title,
  rightSlot,
  size = "lg",
}: EditorialMastheadProps) => {
  const titleSize =
    size === "lg"
      ? "clamp(48px, 14vw, 92px)"
      : "clamp(32px, 9vw, 56px)";

  return (
    <header className="mb-6">
      {/* Volume + section */}
      <div className="flex items-center gap-2 mb-3">
        <span
          style={{
            fontFamily: "'Space Mono', ui-monospace, monospace",
            fontSize: 10,
            letterSpacing: "0.22em",
            color: "hsl(var(--primary))",
            textTransform: "uppercase",
          }}
        >
          {volume}
        </span>
        <span
          style={{
            fontFamily: "'Space Mono', ui-monospace, monospace",
            fontSize: 10,
            letterSpacing: "0.22em",
            color: "hsl(var(--foreground) / 0.5)",
            textTransform: "uppercase",
          }}
        >
          · {section}
          {meta ? ` · ${meta}` : ""}
        </span>
      </div>

      {/* Title row */}
      <div className="flex items-end justify-between gap-4">
        <div className="min-w-0">
          {eyebrow && (
            <span
              style={{
                fontFamily: "'Playfair Display', serif",
                fontStyle: "italic",
                fontWeight: 600,
                fontSize: size === "lg" ? 16 : 13,
                color: "hsl(var(--foreground) / 0.6)",
                display: "block",
                marginBottom: 2,
              }}
            >
              {eyebrow}
            </span>
          )}
          <h1
            style={{
              fontFamily: "'Playfair Display', serif",
              fontStyle: "italic",
              fontWeight: 500,
              fontSize: titleSize,
              lineHeight: 0.92,
              color: "hsl(var(--foreground))",
              margin: 0,
              letterSpacing: "-0.02em",
            }}
          >
            {title}
          </h1>
        </div>
        {rightSlot && <div className="flex-shrink-0">{rightSlot}</div>}
      </div>

      {/* Hairline rule */}
      <div
        className="mt-5 h-px w-full"
        style={{ background: "hsl(var(--foreground) / 0.08)" }}
      />
    </header>
  );
};

export default EditorialMasthead;

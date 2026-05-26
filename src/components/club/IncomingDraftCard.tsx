import React from "react";
import { Sparkles } from "lucide-react";

const C = {
  card: "#1A1A1A",
  cardElev: "#2A2A2A",
  text: "#FAF5E9",
  muted: "#B8B8B8",
  faint: "#6B6B70",
  raspberry: "#F04E23",
  copper: "#E6F25A",
  border: "rgba(250, 245, 233, 0.08)",
};

export interface IncomingDraftCardProps {
  firstName: string;
  context: string; // e.g. "Angel City FC · LA · You're 94% aligned. She thinks Sunday at The Cock & Bull."
  timeLabel?: string; // "NOW"
  pending?: boolean;
  onDraftBack: () => void;
  onViewProfile: () => void;
}

const IncomingDraftCard: React.FC<IncomingDraftCardProps> = ({
  firstName,
  context,
  timeLabel = "Now",
  pending,
  onDraftBack,
  onViewProfile,
}) => {
  return (
    <article
      className="rounded-2xl p-4"
      style={{
        background: C.cardElev,
        border: `1px solid ${C.border}`,
        boxShadow: "0 16px 40px -22px rgba(232,39,111,0.35)",
      }}
    >
      {/* Top row: L badge + meta */}
      <div className="flex items-center gap-2.5 mb-3">
        <div
          className="rounded-md flex items-center justify-center"
          style={{
            width: 28,
            height: 28,
            background: C.raspberry,
          }}
        >
          <span
            style={{
              fontFamily: "'Oswald', system-ui, sans-serif",
              fontStyle: "italic",
              fontWeight: 700,
              fontSize: 17,
              color: "#0A0A0B",
              lineHeight: 1,
            }}
          >
            L
          </span>
        </div>
        <span
          className="text-[9.5px] uppercase font-bold"
          style={{
            fontFamily: "'Poppins', system-ui, sans-serif",
            letterSpacing: "0.22em",
            color: C.copper,
          }}
        >
          Loverball · {timeLabel}
        </span>
        <Sparkles size={11} color={C.raspberry} className="ml-auto" />
      </div>

      {/* Headline */}
      <h3
        style={{
          fontFamily: "'Anton', Impact, sans-serif",
          fontSize: 24,
          color: C.text,
          lineHeight: 1.05,
          letterSpacing: "-0.01em",
        }}
      >
        {firstName} drafted you.
      </h3>

      {/* Context */}
      <p
        className="mt-2 mb-4"
        style={{
          fontSize: 13,
          lineHeight: 1.5,
          color: C.muted,
        }}
      >
        {context}
      </p>

      {/* Buttons */}
      <div className="flex gap-2">
        <button
          onClick={onDraftBack}
          disabled={pending}
          className="flex-1 rounded-full uppercase font-bold transition-opacity active:opacity-80"
          style={{
            fontFamily: "Poppins, system-ui, sans-serif",
            fontSize: 11,
            letterSpacing: "0.16em",
            padding: "12px 14px",
            background: C.raspberry,
            color: "#0A0A0B",
            opacity: pending ? 0.6 : 1,
            boxShadow: "0 12px 28px -12px rgba(232,39,111,0.55)",
          }}
        >
          {pending ? "…" : "Draft Back"}
        </button>
        <button
          onClick={onViewProfile}
          className="rounded-full uppercase font-bold transition-opacity active:opacity-80"
          style={{
            fontFamily: "Poppins, system-ui, sans-serif",
            fontSize: 11,
            letterSpacing: "0.16em",
            padding: "12px 16px",
            background: "transparent",
            color: C.text,
            border: `1px solid ${C.border}`,
          }}
        >
          View Profile
        </button>
      </div>
    </article>
  );
};

export default IncomingDraftCard;

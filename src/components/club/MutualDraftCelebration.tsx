import React from "react";
import { MessageCircle } from "lucide-react";

const C = {
  bg: "#0a0a0a",
  card: "#1A1A1A",
  cardElev: "#2A2A2A",
  text: "#FAF5E9",
  muted: "#B8B8B8",
  faint: "#6B6B70",
  raspberry: "#F04E23",
  copper: "#E6F25A",
  border: "rgba(250, 245, 233, 0.08)",
};

export interface MutualDraftCelebrationProps {
  open: boolean;
  myPhotoUrl?: string | null;
  themPhotoUrl?: string | null;
  themFirstName: string;
  myInitial?: string;
  themInitial?: string;
  upcomingHint?: string; // e.g. "Arsenal vs Chelsea, Sun 7am"
  onClose: () => void;
  onSayHi: () => void;
}

const Circle: React.FC<{ src?: string | null; letter: string; ring: string }> = ({ src, letter, ring }) => (
  <div
    className="rounded-full overflow-hidden flex items-center justify-center"
    style={{
      width: 92,
      height: 92,
      background: "#0F0F10",
      border: `2px solid ${ring}`,
      boxShadow: "0 20px 50px -16px rgba(232,39,111,0.45)",
    }}
  >
    {src ? (
      <img src={src} alt="" className="w-full h-full object-cover" />
    ) : (
      <span
        style={{
          fontFamily: "'Oswald', system-ui, sans-serif",
          fontSize: 44,
          color: "rgba(250,245,233,0.45)",
        }}
      >
        {letter}
      </span>
    )}
  </div>
);

const MutualDraftCelebration: React.FC<MutualDraftCelebrationProps> = ({
  open,
  myPhotoUrl,
  themPhotoUrl,
  themFirstName,
  myInitial = "·",
  themInitial = "·",
  upcomingHint,
  onClose,
  onSayHi,
}) => {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center"
      style={{ background: "rgba(5,5,7,0.86)", backdropFilter: "blur(18px)" }}
      onClick={onClose}
    >
      {/* Ambient pink radial */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-1/2"
        style={{
          background:
            "radial-gradient(ellipse at 50% 0%, rgba(232,39,111,0.28) 0%, rgba(232,39,111,0.08) 35%, transparent 70%)",
        }}
      />

      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full md:max-w-[440px] mx-4 rounded-3xl p-8 pt-10 pb-9 animate-in fade-in zoom-in-95 duration-500"
        style={{
          background: C.cardElev,
          border: `1px solid ${C.border}`,
        }}
      >
        {/* Overlapping avatars */}
        <div className="flex justify-center items-center mb-6 -space-x-5">
          <div className="relative z-10">
            <Circle src={myPhotoUrl} letter={myInitial} ring="#0A0A0B" />
          </div>
          <div className="relative z-20">
            <Circle src={themPhotoUrl} letter={themInitial} ring={C.raspberry} />
          </div>
        </div>

        {/* Starting XI label */}
        <p
          className="text-center mb-3 text-[10.5px] uppercase font-bold"
          style={{
            fontFamily: "'Poppins', system-ui, sans-serif",
            letterSpacing: "0.32em",
            color: C.raspberry,
          }}
        >
          ★ Starting XI ★
        </p>

        {/* Headline */}
        <h2
          className="text-center mb-3"
          style={{
            fontFamily: "'Anton', Impact, sans-serif",
            fontSize: 34,
            color: C.text,
            lineHeight: 1.02,
            letterSpacing: "-0.015em",
          }}
        >
          You're on the<br />same team.
        </h2>

        <p
          className="text-center mb-7 px-2"
          style={{
            fontSize: 13.5,
            lineHeight: 1.55,
            color: C.muted,
          }}
        >
          {themFirstName} drafted you back. The DM is open.
        </p>

        {/* CTA */}
        <button
          onClick={onSayHi}
          className="w-full rounded-full uppercase font-bold flex items-center justify-center gap-2 transition-transform active:scale-[0.98]"
          style={{
            fontFamily: "Poppins, system-ui, sans-serif",
            fontSize: 12.5,
            letterSpacing: "0.18em",
            padding: "16px 18px",
            background: C.raspberry,
            color: "#0A0A0B",
            boxShadow: "0 18px 44px -10px rgba(232,39,111,0.65)",
          }}
        >
          <MessageCircle size={16} strokeWidth={2.4} />
          Say Hi
        </button>

        {/* Upcoming hint */}
        {upcomingHint && (
          <div
            className="mt-5 pt-4"
            style={{ borderTop: `1px solid ${C.border}` }}
          >
            <p
              className="text-center text-[10.5px] uppercase"
              style={{
                fontFamily: "'Poppins', system-ui, sans-serif",
                letterSpacing: "0.22em",
                color: C.muted,
              }}
            >
              Coming up
            </p>
            <p
              className="text-center mt-1.5"
              style={{
                fontFamily: "'Oswald', system-ui, sans-serif",
                fontStyle: "italic",
                fontSize: 15,
                color: C.text,
              }}
            >
              {upcomingHint}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MutualDraftCelebration;

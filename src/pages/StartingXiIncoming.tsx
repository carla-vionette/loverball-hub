import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import Seo from "@/components/Seo";
import IncomingDraftCard from "@/components/club/IncomingDraftCard";
import MutualDraftCelebration from "@/components/club/MutualDraftCelebration";
import { MOCK_MEMBERS } from "@/lib/startingXiData";

const C = {
  bg: "#0a0a0a",
  text: "#FAF5E9",
  muted: "#B8B8B8",
  pink: "#E86BB0",
};

const mono = { fontFamily: "'Poppins', system-ui, sans-serif" } as const;
const serif = { fontFamily: "'Poppins', system-ui, sans-serif" } as const;

// State B: "What Chloe sees" — a preview of an incoming draft from the user (Carla).
// Demo-only standalone screen. In production this lives in the recipient's notifications tray.
const StartingXiIncoming: React.FC = () => {
  const navigate = useNavigate();
  const m = MOCK_MEMBERS[2]; // Jess R. as the "Carla" stand-in for the demo
  const [celebrate, setCelebrate] = useState(false);

  return (
    <div style={{ background: C.bg, color: C.text, fontFamily: "Poppins, system-ui, sans-serif" }} className="min-h-screen">
      <Seo
        title="Incoming draft — Starting XI | Loverball"
        description="Preview of what a member sees when someone drafts them."
        path="/club/xi/incoming"
      />

      <main className="max-w-[440px] mx-auto px-5 pt-5 pb-24">
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate("/club/xi")}
            aria-label="Back"
            className="p-1.5 -ml-1.5"
            style={{ color: C.text }}
          >
            <ChevronLeft size={22} strokeWidth={1.5} />
          </button>
          <span
            className="uppercase"
            style={{ ...mono, fontSize: 10, letterSpacing: "0.22em", color: C.muted, fontWeight: 500 }}
          >
            Notifications
          </span>
          <span style={{ width: 22 }} />
        </div>

        <header className="mt-6">
          <p
            className="uppercase"
            style={{ ...mono, fontSize: 10, letterSpacing: "0.22em", color: C.pink, fontWeight: 500 }}
          >
            Just in
          </p>
          <h1
            className="mt-2"
            style={{ ...serif, fontSize: 38, lineHeight: 0.95, color: C.text, letterSpacing: "-0.01em" }}
          >
            On the wire.
          </h1>
          <p className="mt-3" style={{ fontSize: 13, lineHeight: 1.55, color: C.muted }}>
            What members see when you draft them. No "decline" button — passing is implicit.
          </p>
        </header>

        <div className="mt-6">
          <IncomingDraftCard
            firstName="Carla"
            context="Angel City FC · LA · You're 94% aligned. She thinks Sunday at The Cock & Bull."
            timeLabel="Now"
            onDraftBack={() => setCelebrate(true)}
            onViewProfile={() => navigate(`/club/xi/${m.id}`)}
          />
        </div>
      </main>

      <MutualDraftCelebration
        open={celebrate}
        themFirstName="Carla"
        themInitial="C"
        upcomingHint="Arsenal vs Chelsea, Sun 7am"
        onClose={() => setCelebrate(false)}
        onSayHi={() => {
          setCelebrate(false);
          navigate("/inbox");
        }}
      />
    </div>
  );
};

export default StartingXiIncoming;

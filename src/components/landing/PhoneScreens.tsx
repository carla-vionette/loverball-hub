import { Heart, MessageCircle, Share2, Calendar, MapPin, Users, Flame } from "lucide-react";

/* ------------------- Derby Day watch party ------------------- */
export function DerbyDayScreen() {
  return (
    <div className="h-full w-full bg-[#0a0a0a] text-white">
      <div className="px-4 pt-2 pb-3 border-b border-white/5">
        <p className="text-[10px] uppercase tracking-[0.22em] text-pink font-condensed">
          Watch Party · RSVP
        </p>
        <h4 className="font-display uppercase text-[22px] leading-[0.95] mt-1">Derby Day</h4>
        <p className="text-[11px] text-lb-muted mt-0.5">Thorns vs Reign</p>
      </div>

      <div className="px-4 py-3 space-y-3">
        <div className="rounded-2xl bg-[#1c1c1c] p-3">
          <div className="flex items-center gap-2 text-[11px] text-lb-muted">
            <Calendar size={12} className="text-lime" /> Sat · 5:30 PM
          </div>
          <div className="mt-1.5 flex items-center gap-2 text-[11px] text-lb-muted">
            <MapPin size={12} className="text-pink" /> Mishi's Bar, Portland
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex -space-x-2">
            {["#E86BB0", "#F04E23", "#E6F25A"].map((c, i) => (
              <span
                key={i}
                className="h-7 w-7 rounded-full border-2 border-[#0a0a0a]"
                style={{ background: c }}
              />
            ))}
          </div>
          <p className="text-[11px] text-lb-muted">
            <span className="text-white font-semibold">12 squad</span> going
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 p-3">
          <p className="text-[11px] text-lb-muted">"Need a Thorns crew. Bringing the scarf."</p>
          <p className="mt-1 text-[10px] uppercase tracking-[0.18em] text-lime font-condensed">
            Maya J. · Host
          </p>
        </div>

        <button className="w-full rounded-full bg-lb-orange py-2.5 text-[12px] font-condensed uppercase tracking-[0.18em] text-white">
          I'm in
        </button>
      </div>
    </div>
  );
}

/* ------------------- Matching screen ------------------- */
export function MatchingScreen() {
  return (
    <div className="h-full w-full bg-[#0a0a0a] text-white">
      <div className="px-4 pt-2 pb-2 flex items-center justify-between border-b border-white/5">
        <p className="text-[10px] uppercase tracking-[0.22em] text-lime font-condensed">Match</p>
        <p className="text-[10px] text-lb-muted">2 of 14</p>
      </div>

      <div className="relative mx-4 mt-3 rounded-3xl overflow-hidden border border-white/10"
        style={{
          background:
            "linear-gradient(160deg, rgba(232,107,176,0.25), rgba(240,78,35,0.12) 60%, rgba(0,0,0,0.4))",
        }}
      >
        <div className="aspect-[3/4] flex items-end p-3">
          <div className="absolute top-3 right-3 bg-lime text-black text-[11px] font-condensed uppercase tracking-[0.18em] px-2 py-1 rounded-full">
            94% match
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-[0.22em] text-lime font-condensed">
              Chicago · Loud
            </p>
            <h4 className="font-display uppercase text-[26px] leading-[0.95] mt-1">Maya, 26</h4>
            <div className="mt-2 flex flex-wrap gap-1.5">
              <Tag>Sky</Tag>
              <Tag>Liberty</Tag>
              <Tag>Thorns</Tag>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 pt-3">
        <p className="text-[11px] leading-snug text-lb-muted">
          "Diana over Sue. End of debate. Candace is the GOAT. Aces fans don't talk to me."
        </p>
      </div>

      <div className="flex items-center justify-center gap-4 mt-4">
        <CircleBtn color="#2a2a2a">✕</CircleBtn>
        <CircleBtn color="#E6F25A" dark>♥</CircleBtn>
      </div>
    </div>
  );
}

function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] uppercase tracking-[0.18em] font-condensed">
      {children}
    </span>
  );
}

function CircleBtn({
  children,
  color,
  dark = false,
}: {
  children: React.ReactNode;
  color: string;
  dark?: boolean;
}) {
  return (
    <span
      className="inline-flex h-12 w-12 items-center justify-center rounded-full text-lg"
      style={{ background: color, color: dark ? "#0a0a0a" : "white" }}
    >
      {children}
    </span>
  );
}

/* ------------------- Feed screen (QueenOfCourt) ------------------- */
export function FeedScreen() {
  return (
    <div className="h-full w-full bg-[#0a0a0a] text-white overflow-hidden">
      <div className="px-4 pt-2 pb-2 flex items-center justify-between border-b border-white/5">
        <p className="text-[10px] uppercase tracking-[0.22em] text-lb-orange font-condensed">
          Feed · Live
        </p>
        <span className="inline-flex items-center gap-1 text-[10px] text-lime font-condensed uppercase tracking-[0.18em]">
          <Flame size={10} /> Hot
        </span>
      </div>

      <div className="px-4 pt-3">
        <div className="flex items-center gap-2">
          <span
            className="h-8 w-8 rounded-full"
            style={{
              background:
                "linear-gradient(135deg, #E86BB0 0%, #F04E23 70%, #E6F25A 100%)",
            }}
          />
          <div>
            <p className="text-[12px] font-semibold leading-tight">QueenOfCourt</p>
            <p className="text-[10px] text-lb-muted leading-tight">@queenofcourt · 2m</p>
          </div>
        </div>

        <p className="mt-3 text-[12px] leading-snug">
          A'ja can hoop but the Sky run Chicago. Don't @ me.
        </p>

        <div
          className="mt-3 aspect-video rounded-xl border border-white/10"
          style={{
            background:
              "linear-gradient(135deg, rgba(230,242,90,0.28), rgba(232,107,176,0.18) 50%, rgba(10,10,10,0.6))",
          }}
        />

        <div className="mt-3 flex items-center gap-4 text-lb-muted text-[11px]">
          <span className="inline-flex items-center gap-1">
            <Heart size={12} className="text-pink" /> 482
          </span>
          <span className="inline-flex items-center gap-1">
            <MessageCircle size={12} /> 76
          </span>
          <span className="inline-flex items-center gap-1">
            <Share2 size={12} /> Share
          </span>
        </div>

        <div className="mt-4 rounded-2xl border border-white/10 p-3">
          <p className="text-[10px] uppercase tracking-[0.22em] text-lime font-condensed">
            Squad chat
          </p>
          <p className="text-[11px] mt-1 leading-snug text-lb-muted">
            <span className="text-white">Tay:</span> Reece dropped 28. We up.
          </p>
        </div>
      </div>
    </div>
  );
}

/* ------------------- Squads / Profile screen ------------------- */
export function SquadsScreen() {
  return (
    <div className="h-full w-full bg-[#0a0a0a] text-white">
      <div className="px-4 pt-2 pb-2 border-b border-white/5">
        <p className="text-[10px] uppercase tracking-[0.22em] text-pink font-condensed">Squad</p>
        <h4 className="font-display uppercase text-[22px] leading-[0.95] mt-1">Maya's Crew</h4>
      </div>

      <div className="px-4 py-3 space-y-3">
        <div className="rounded-2xl bg-[#1c1c1c] p-3 flex items-center gap-3">
          <Users size={14} className="text-lime" />
          <p className="text-[11px] text-lb-muted">
            <span className="text-white font-semibold">7 members</span> · Sky / Liberty / Thorns
          </p>
        </div>

        {[
          { name: "Tay", tag: "Sky", color: "#E86BB0" },
          { name: "Jordan", tag: "Liberty", color: "#F04E23" },
          { name: "Sam", tag: "Thorns", color: "#E6F25A" },
        ].map((m, i) => (
          <div key={i} className="flex items-center gap-3">
            <span
              className="h-9 w-9 rounded-full"
              style={{ background: m.color }}
            />
            <div className="flex-1">
              <p className="text-[12px] font-semibold leading-tight">{m.name}</p>
              <p className="text-[10px] text-lb-muted">{m.tag} · die-hard</p>
            </div>
            <span className="text-[10px] uppercase tracking-[0.18em] text-lime font-condensed">
              Going
            </span>
          </div>
        ))}

        <button className="mt-2 w-full rounded-full bg-lime py-2.5 text-[12px] font-condensed uppercase tracking-[0.18em] text-black">
          Roll the squad
        </button>
      </div>
    </div>
  );
}

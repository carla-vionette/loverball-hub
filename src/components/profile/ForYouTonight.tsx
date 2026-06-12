import { format } from "date-fns";
import { Radio, Newspaper, Ticket, ChevronRight, Calendar, Tv } from "lucide-react";
import type { SuggestedEvent } from "@/hooks/useProfileData";

interface ForYouTonightProps {
  favoriteTeams: string[];
  favoriteSports: string[];
  featuredEvent: SuggestedEvent | null;
  userName: string;
  onOpenEvent: (id: string) => void;
  onOpenWatch: () => void;
  onOpenStories: () => void;
}

const PINK = "#E85D2F";
const PANEL = "#161616";
const BORDER = "1px solid rgba(250, 245, 233, 0.08)";

const Pill = ({ children, color = PINK }: { children: React.ReactNode; color?: string }) => (
  <span
    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9.5px] uppercase tracking-widest"
    style={{
      background: `${color}1a`,
      color,
      border: `1px solid ${color}55`,
      fontFamily: "'Inter', sans-serif",
      fontWeight: 700,
    }}
  >
    {children}
  </span>
);

const ForYouTonight = ({
  favoriteTeams,
  favoriteSports,
  featuredEvent,
  userName,
  onOpenEvent,
  onOpenWatch,
  onOpenStories,
}: ForYouTonightProps) => {
  const topTeam = favoriteTeams[0];
  const topSport = favoriteSports[0];

  return (
    <div>
      <div className="mb-3">
        <p
          className="text-[10px] uppercase"
          style={{ fontFamily: "'Space Mono', monospace", letterSpacing: "0.26em", color: PINK }}
        >
          For you tonight
        </p>
        <h2
          className="leading-[0.95] mt-1.5 uppercase"
          style={{
            fontFamily: "'Anton', Impact, sans-serif",
            fontSize: "clamp(28px, 3.4vw, 38px)",
            color: "#FAF5E9",
          }}
        >
          Picked for <span style={{ color: PINK }}>{userName}</span>.
        </h2>
        <p className="mt-1.5 text-[12.5px]" style={{ color: "rgba(250,245,233,0.55)" }}>
          One game, one story, one event — tuned to your fandom.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Game / Where to Watch */}
        <button
          onClick={onOpenWatch}
          className="text-left rounded-2xl p-4 transition-all hover:bg-white/[0.03]"
          style={{ background: PANEL, border: BORDER, minHeight: 168 }}
        >
          <div className="flex items-center justify-between">
            <Pill color="#2DD4BF"><Radio className="w-2.5 h-2.5" /> Live tonight</Pill>
            <Tv className="w-4 h-4" style={{ color: "rgba(250,245,233,0.35)" }} />
          </div>
          <h3
            className="mt-3 uppercase"
            style={{ fontFamily: "'Anton', Impact, sans-serif", fontSize: 20, color: "#FAF5E9", lineHeight: 1.05 }}
          >
            {topTeam ? `${topTeam} — where to watch` : "Tune in to a game tonight"}
          </h3>
          <p className="mt-2 text-[12px]" style={{ color: "rgba(250,245,233,0.6)" }}>
            {topTeam ? "Channel, bar and watch-party intel for your team's next game." : "Add a favorite team to unlock personalized matchups."}
          </p>
          <span className="mt-3 inline-flex items-center gap-1 text-[10.5px] uppercase tracking-widest" style={{ color: PINK, fontFamily: "'Inter', sans-serif", fontWeight: 700 }}>
            Where to watch <ChevronRight className="w-3.5 h-3.5" />
          </span>
        </button>

        {/* Story */}
        <button
          onClick={onOpenStories}
          className="text-left rounded-2xl p-4 transition-all hover:bg-white/[0.03]"
          style={{ background: PANEL, border: BORDER, minHeight: 168 }}
        >
          <div className="flex items-center justify-between">
            <Pill color="#F0C24C"><Newspaper className="w-2.5 h-2.5" /> Today's read</Pill>
            <Newspaper className="w-4 h-4" style={{ color: "rgba(250,245,233,0.35)" }} />
          </div>
          <h3
            className="mt-3 uppercase"
            style={{ fontFamily: "'Anton', Impact, sans-serif", fontSize: 20, color: "#FAF5E9", lineHeight: 1.05 }}
          >
            {topSport ? `Inside ${topSport} this week` : "Stories from women in sports"}
          </h3>
          <p className="mt-2 text-[12px]" style={{ color: "rgba(250,245,233,0.6)" }}>
            Fresh reporting from women-led creators on the leagues you love.
          </p>
          <span className="mt-3 inline-flex items-center gap-1 text-[10.5px] uppercase tracking-widest" style={{ color: PINK, fontFamily: "'Inter', sans-serif", fontWeight: 700 }}>
            Open feed <ChevronRight className="w-3.5 h-3.5" />
          </span>
        </button>

        {/* Event */}
        <button
          onClick={() => featuredEvent ? onOpenEvent(featuredEvent.id) : onOpenStories()}
          className="text-left rounded-2xl p-4 transition-all hover:bg-white/[0.03]"
          style={{ background: PANEL, border: BORDER, minHeight: 168 }}
        >
          <div className="flex items-center justify-between">
            <Pill><Ticket className="w-2.5 h-2.5" /> Event pick</Pill>
            <Calendar className="w-4 h-4" style={{ color: "rgba(250,245,233,0.35)" }} />
          </div>
          {featuredEvent ? (
            <>
              <h3
                className="mt-3 uppercase line-clamp-2"
                style={{ fontFamily: "'Anton', Impact, sans-serif", fontSize: 20, color: "#FAF5E9", lineHeight: 1.05 }}
              >
                {featuredEvent.title}
              </h3>
              <p className="mt-2 text-[12px]" style={{ color: "rgba(250,245,233,0.6)" }}>
                {format(new Date(featuredEvent.event_date), "EEE, MMM d")}
                {featuredEvent.venue_name ? ` · ${featuredEvent.venue_name}` : featuredEvent.city ? ` · ${featuredEvent.city}` : ""}
              </p>
            </>
          ) : (
            <>
              <h3
                className="mt-3 uppercase"
                style={{ fontFamily: "'Anton', Impact, sans-serif", fontSize: 20, color: "#FAF5E9", lineHeight: 1.05 }}
              >
                Find your next watch party
              </h3>
              <p className="mt-2 text-[12px]" style={{ color: "rgba(250,245,233,0.6)" }}>
                Real Loverball events near you — solo-fan friendly.
              </p>
            </>
          )}
          <span className="mt-3 inline-flex items-center gap-1 text-[10.5px] uppercase tracking-widest" style={{ color: PINK, fontFamily: "'Inter', sans-serif", fontWeight: 700 }}>
            {featuredEvent ? "See event" : "Browse events"} <ChevronRight className="w-3.5 h-3.5" />
          </span>
        </button>
      </div>
    </div>
  );
};

export default ForYouTonight;

import { format } from "date-fns";
import { Calendar, Clock, MapPin, ChevronRight, Heart, Users, Zap, Sparkles } from "lucide-react";
import type { RSVPEvent, SuggestedEvent } from "@/hooks/useProfileData";

const PINK = "#E85D2F";
const PANEL = "#161616";
const BORDER = "1px solid rgba(250, 245, 233, 0.08)";

interface SmartEventsProps {
  upcomingRsvps: RSVPEvent[];
  suggestions: SuggestedEvent[];
  userCity: string | null;
  onOpenEvent: (id: string) => void;
  onBrowseAll: () => void;
}

const LABEL_COLORS: Record<string, string> = {
  popular: "#F0C24C",
  women: PINK,
  solo: "#2DD4BF",
  big: "#A78BFA",
  local: "#7DD3FC",
};

const labelFor = (
  ev: SuggestedEvent,
  idx: number,
  userCity: string | null
): { text: string; tone: keyof typeof LABEL_COLORS; icon: any } => {
  const cityMatch = userCity && ev.city && ev.city.toLowerCase().includes(userCity.toLowerCase().split(",")[0]);
  if (cityMatch) return { text: `Popular in ${ev.city}`, tone: "local", icon: MapPin };
  const title = (ev.title || "").toLowerCase();
  if (/wnba|nwsl|women|ncaa w/.test(title)) return { text: "Women's sports crowd", tone: "women", icon: Heart };
  if (idx === 0) return { text: "Big game energy", tone: "big", icon: Zap };
  if (idx === 1) return { text: "Good for solo fans", tone: "solo", icon: Users };
  return { text: "Loverball pick", tone: "popular", icon: Sparkles };
};

const DateChip = ({ d }: { d: Date }) => (
  <div
    className="flex-shrink-0 w-14 h-14 rounded-xl flex flex-col items-center justify-center"
    style={{ background: "rgba(232,93,47,0.12)", border: "1px solid rgba(232,93,47,0.25)" }}
  >
    <span
      style={{
        fontFamily: "'Space Mono', monospace",
        fontSize: 9, letterSpacing: "0.18em", color: PINK, textTransform: "uppercase",
      }}
    >
      {format(d, "MMM")}
    </span>
    <span style={{ fontFamily: "'Anton', Impact, sans-serif", fontSize: 22, lineHeight: 1, color: "#FAF5E9" }}>
      {format(d, "dd")}
    </span>
  </div>
);

const SmartEvents = ({ upcomingRsvps, suggestions, userCity, onOpenEvent, onBrowseAll }: SmartEventsProps) => {
  const hasRsvps = upcomingRsvps.length > 0;
  const sectionLabel = hasRsvps ? "On your calendar" : "Suggested for you";
  const heading = hasRsvps ? "Your events" : "Find your next";
  const headingAccent = hasRsvps ? "lined up" : "watch night";

  return (
    <div>
      <div className="mb-3 flex items-end justify-between gap-3">
        <div className="min-w-0">
          <p
            className="text-[10px] uppercase"
            style={{ fontFamily: "'Space Mono', monospace", letterSpacing: "0.26em", color: PINK }}
          >
            {sectionLabel}
          </p>
          <h2
            className="leading-[0.95] mt-1.5 uppercase"
            style={{ fontFamily: "'Anton', Impact, sans-serif", fontSize: "clamp(28px, 3.4vw, 38px)", color: "#FAF5E9" }}
          >
            {heading} <span style={{ color: PINK }}>{headingAccent}</span>.
          </h2>
        </div>
        <button
          onClick={onBrowseAll}
          className="flex items-center gap-1 text-[11px] uppercase tracking-widest"
          style={{ fontFamily: "'Inter', sans-serif", fontWeight: 700, color: PINK }}
        >
          {hasRsvps ? "All events" : "Browse more"} <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {hasRsvps ? (
        <div className="space-y-2.5">
          {upcomingRsvps.slice(0, 6).map((r) => {
            const d = new Date(r.event.event_date);
            const kindLabel =
              r.rsvp_kind === "stadium" ? "Going 🏟️"
              : r.rsvp_kind === "bar" ? `Watching${r.bar_name ? ` @ ${r.bar_name}` : ""} 🍺`
              : (r.status === "attending" ? "Going" : r.status);
            const kindColor = r.rsvp_kind === "bar" ? "#2DD4BF" : PINK;
            return (
              <button
                key={r.id}
                onClick={() => onOpenEvent(r.event.id)}
                className="w-full flex items-center gap-3 p-3 rounded-2xl text-left transition-colors hover:bg-white/5"
                style={{ background: PANEL, border: BORDER }}
              >
                <DateChip d={d} />
                <div className="flex-1 min-w-0">
                  <h3
                    className="line-clamp-1"
                    style={{
                      fontFamily: "'Anton', Impact, sans-serif", fontSize: 16, color: "#FAF5E9",
                      textTransform: "uppercase", letterSpacing: "0.01em", margin: 0,
                    }}
                  >
                    {r.event.title}
                  </h3>
                  <div
                    className="flex items-center gap-2 mt-1 text-[10.5px]"
                    style={{ fontFamily: "'Space Mono', monospace", color: "rgba(250,245,233,0.55)", letterSpacing: "0.04em" }}
                  >
                    {r.event.event_time && (
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{r.event.event_time.slice(0, 5)}</span>
                    )}
                    {(r.event.venue_name || r.event.city) && (
                      <span className="flex items-center gap-1 truncate"><MapPin className="w-3 h-3" />{r.event.venue_name || r.event.city}</span>
                    )}
                  </div>
                  <span
                    className="inline-block mt-1.5 px-2 py-0.5 rounded-full text-[9.5px] uppercase tracking-widest"
                    style={{
                      background: `${kindColor}22`, color: kindColor, border: `1px solid ${kindColor}55`,
                      fontFamily: "'Inter', sans-serif", fontWeight: 700,
                    }}
                  >
                    {kindLabel}
                  </span>
                </div>
                <ChevronRight className="w-4 h-4 flex-shrink-0" style={{ color: "rgba(250,245,233,0.35)" }} />
              </button>
            );
          })}
        </div>
      ) : suggestions.length === 0 ? (
        <div
          className="rounded-3xl p-8 text-center"
          style={{ background: PANEL, border: BORDER }}
        >
          <Calendar className="w-9 h-9 mx-auto mb-3" style={{ color: "rgba(232,93,47,0.7)" }} />
          <p style={{ fontFamily: "'Playfair Display', serif", fontStyle: "italic", fontSize: 16, color: "rgba(250,245,233,0.75)", margin: 0 }}>
            Your calendar's open — let's fill it.
          </p>
          <p className="mt-2 text-[12px]" style={{ color: "rgba(250,245,233,0.5)" }}>
            We'll surface watch parties, viewing nights and meetups as they go live.
          </p>
          <button
            onClick={onBrowseAll}
            className="mt-4 px-5 py-2 rounded-full text-[11px] uppercase tracking-widest"
            style={{ background: PINK, color: "#fff", fontFamily: "'Inter', sans-serif", fontWeight: 700 }}
          >
            Browse events
          </button>
        </div>
      ) : (
        <div className="space-y-2.5">
          {suggestions.slice(0, 3).map((ev, i) => {
            const d = new Date(ev.event_date);
            const lbl = labelFor(ev, i, userCity);
            const color = LABEL_COLORS[lbl.tone];
            const Icon = lbl.icon;
            return (
              <div
                key={ev.id}
                className="w-full flex items-center gap-3 p-3 rounded-2xl"
                style={{ background: PANEL, border: BORDER }}
              >
                <DateChip d={d} />
                <div className="flex-1 min-w-0">
                  <h3
                    className="line-clamp-1"
                    style={{ fontFamily: "'Anton', Impact, sans-serif", fontSize: 16, color: "#FAF5E9", textTransform: "uppercase", margin: 0 }}
                  >
                    {ev.title}
                  </h3>
                  <div
                    className="flex items-center gap-2 mt-1 text-[10.5px]"
                    style={{ fontFamily: "'Space Mono', monospace", color: "rgba(250,245,233,0.55)", letterSpacing: "0.04em" }}
                  >
                    {ev.event_time && (
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{ev.event_time.slice(0, 5)}</span>
                    )}
                    {(ev.venue_name || ev.city) && (
                      <span className="flex items-center gap-1 truncate"><MapPin className="w-3 h-3" />{ev.venue_name || ev.city}</span>
                    )}
                  </div>
                  <span
                    className="inline-flex items-center gap-1 mt-1.5 px-2 py-0.5 rounded-full text-[9.5px] uppercase tracking-widest"
                    style={{
                      background: `${color}1a`, color, border: `1px solid ${color}55`,
                      fontFamily: "'Inter', sans-serif", fontWeight: 700,
                    }}
                  >
                    <Icon className="w-2.5 h-2.5" /> {lbl.text}
                  </span>
                </div>
                <button
                  onClick={() => onOpenEvent(ev.id)}
                  className="flex-shrink-0 px-3 py-2 rounded-full text-[10px] uppercase tracking-widest"
                  style={{ background: PINK, color: "#fff", fontFamily: "'Inter', sans-serif", fontWeight: 700 }}
                >
                  RSVP
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default SmartEvents;

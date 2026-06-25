import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useActiveArea } from "@/hooks/useActiveArea";
import AppLayout from "@/components/layout/AppLayout";
import Seo from "@/components/Seo";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Calendar, MapPin, Loader2, Share2, Sparkles } from "lucide-react";
import { format } from "date-fns";
import { parseEventDate } from "@/lib/eventDate";
import RsvpControl from "@/components/events/RsvpControl";
import GoingGraph from "@/components/events/GoingGraph";
import EventChatPanel from "@/components/events/EventChatPanel";
import { useEventRsvp } from "@/hooks/useEventRsvp";
import { getEventDistanceMiles, formatMiles, type ViewerLike } from "@/lib/distance";
import { useToast } from "@/hooks/use-toast";
import { resolveEventImage, handleEventImageError, FALLBACK_EVENT_IMAGE } from "@/lib/eventImage";
import { shareEvent, trackShareClicked } from "@/lib/eventShareAction";

interface DbEvent {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  banner_image: string | null;
  event_date: string;
  event_time: string | null;
  venue_name: string | null;
  city: string | null;
  event_type: string | null;
  location_lat: number | null;
  location_lng: number | null;
  host_user_id: string | null;
  sport_tags: string[] | null;
  event_tags?: string[] | null;
}

function categoryLabel(t: string | null | undefined) {
  if (t === "game") return { label: "Game", color: "#0A0A0A" };
  if (t === "watch_party") return { label: "Watch Party", color: "#00B8A9" };
  if (t === "panel" || t === "salon") return { label: "Culture", color: "#00B8A9" };
  return { label: "Loverball", color: "#E8185A" };
}

function fmtTime(t?: string | null) {
  if (!t) return "";
  const [h, m] = t.split(":");
  const d = new Date();
  d.setHours(parseInt(h, 10), parseInt(m, 10));
  return format(d, "h:mm a");
}

const SLUG_STYLE: React.CSSProperties = {
  fontFamily: "'Space Mono', ui-monospace, monospace",
  fontSize: 11,
  letterSpacing: "0.22em",
  textTransform: "uppercase",
  color: "#E85D2F",
};

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <Sparkles size={16} color="#E85D2F" />
      <span style={SLUG_STYLE}>{children}</span>
    </div>
  );
}

export default function EventDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { active: activeArea } = useActiveArea();
  const { toast } = useToast();
  const [event, setEvent] = useState<DbEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const rsvpRef = useRef<HTMLDivElement>(null);

  const viewer: ViewerLike | null = activeArea
    ? { lat: activeArea.lat ?? null, lng: activeArea.lng ?? null, city: activeArea.city ?? null }
    : null;

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from("events")
        .select(
          "id, title, description, image_url, banner_image, event_date, event_time, venue_name, city, event_type, location_lat, location_lng, host_user_id, sport_tags, event_tags",
        )
        .eq("id", id)
        .maybeSingle();
      if (cancelled) return;
      setEvent((data as DbEvent) ?? null);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  // Drive Going-chat tab unread visual based on RSVP, used by tab bar
  const { rsvp } = useEventRsvp(id);

  const goBack = () => {
    if (window.history.length > 1) navigate(-1);
    else navigate("/events");
  };

  const handleShare = async () => {
    if (!event || !id) return;
    trackShareClicked(id, event.title, "event_detail");
    await shareEvent({
      id,
      event,
      surface: "event_detail",
      onCopied: () => toast({ title: "Link copied", description: "Event details copied to clipboard." }),
      onFailed: () => toast({ title: "Couldn't share", description: "Try again in a moment.", variant: "destructive" }),
    });
  };

  const scrollToRsvp = () => {
    rsvpRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="min-h-screen bg-[#FAF5E9] flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-[#E8185A]" />
        </div>
      </AppLayout>
    );
  }

  if (!event) {
    return (
      <AppLayout>
        <div className="min-h-screen bg-[#FAF5E9] flex flex-col items-center justify-center px-5 text-center gap-4">
          <p className="font-['Playfair_Display'] italic text-2xl text-[#1A1A1A]/70">
            Event not found.
          </p>
          <Button onClick={() => navigate("/events")} className="bg-[#E8185A] hover:bg-[#E8185A]/90 text-white rounded-full">
            Back to events
          </Button>
        </div>
      </AppLayout>
    );
  }

  const cat = categoryLabel(event.event_type);
  const distance = getEventDistanceMiles(event, viewer);
  const banner = resolveEventImage(event as any);
  const hasBanner = banner && banner !== FALLBACK_EVENT_IMAGE;
  const dateLabel = format(parseEventDate(event.event_date), "EEEE, MMMM d");

  return (
    <AppLayout>
      <Seo
        title={`${event.title} | Loverball`}
        description={event.description?.slice(0, 150) || `Join us ${dateLabel}.`}
        path={`/event/${event.id}`}
      />
      <div className="min-h-screen bg-[#FAF5E9] text-[#1A1A1A]">
        {/* Banner */}
        <div className="relative h-56 sm:h-80 w-full overflow-hidden" style={{ background: cat.color }}>
          {hasBanner && (
            <img
              src={banner}
              alt=""
              onError={handleEventImageError}
              className="absolute inset-0 w-full h-full object-cover opacity-90"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[#1A1A1A]/80 via-transparent to-transparent" />


          <div className="absolute top-3 left-3 right-3 flex justify-between items-start">
            <button
              onClick={goBack}
              className="w-10 h-10 rounded-full bg-[#FAF5E9]/90 backdrop-blur flex items-center justify-center hover:bg-[#FAF5E9] transition-colors"
              aria-label="Back"
            >
              <ArrowLeft className="w-4 h-4 text-[#1A1A1A]" />
            </button>
            <button
              onClick={handleShare}
              className="w-10 h-10 rounded-full bg-[#FAF5E9]/90 backdrop-blur flex items-center justify-center hover:bg-[#FAF5E9] transition-colors"
              aria-label="Share"
            >
              <Share2 className="w-4 h-4 text-[#1A1A1A]" />
            </button>
          </div>

          <div className="absolute bottom-4 left-5 right-5">
            <span
              className="inline-block px-2.5 py-1 rounded-full"
              style={{
                fontFamily: "'Space Mono', ui-monospace, monospace",
                fontSize: 10,
                letterSpacing: "0.22em",
                textTransform: "uppercase",
                background: "#E85D2F",
                color: "#fff",
              }}
            >
              {cat.label}
            </span>
            <h1
              className="mt-2 text-[#FAF5E9] drop-shadow-md"
              style={{
                fontFamily: "'Anton', Impact, sans-serif",
                fontWeight: 400,
                fontSize: "clamp(32px, 6vw, 56px)",
                lineHeight: 0.92,
                letterSpacing: "-0.02em",
                textTransform: "uppercase",
              }}
            >
              {event.title}
            </h1>
          </div>
        </div>

        <main className="max-w-2xl mx-auto px-5 py-6 space-y-8">
          {/* Meta */}
          <section className="flex flex-wrap gap-x-5 gap-y-2 text-sm font-['Inter'] text-[#1A1A1A]/70">
            <span className="inline-flex items-center gap-1.5">
              <Calendar className="w-4 h-4" /> {dateLabel}
              {event.event_time ? ` · ${fmtTime(event.event_time)}` : ""}
            </span>
            {event.venue_name && (
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="w-4 h-4" /> {event.venue_name}
                {event.city ? `, ${event.city}` : ""}
              </span>
            )}
            {distance != null ? (
              <span className="font-mono text-xs text-[#1A1A1A]/50">{formatMiles(distance)}</span>
            ) : (
              (event.event_type === "game" || event.event_type === "watch_party") && (
                <span className="font-mono text-xs text-[#1A1A1A]/50">Watch only</span>
              )
            )}
          </section>

          {/* RSVP */}
          <section ref={rsvpRef} className="space-y-3 p-5 rounded-2xl bg-white border border-black/5">
            <SectionLabel>Your RSVP</SectionLabel>
            {!user && (
              <p className="text-sm font-['Inter'] text-[#1A1A1A]/60">
                <button
                  onClick={() => navigate(`/auth?redirect=/event/${event.id}`)}
                  className="underline underline-offset-2 font-semibold text-[#E8185A]"
                >
                  Sign in
                </button>{" "}
                to RSVP and chat with everyone going.
              </p>
            )}
            <RsvpControl
              eventId={event.id}
              event={event}
              viewer={viewer}
              variant="detail"
              onChanged={() => setRefreshKey((k) => k + 1)}
            />
            {!activeArea?.city && !activeArea?.lat && user && (
              <p className="text-[11px] font-['Inter'] text-[#1A1A1A]/50">
                <button
                  onClick={() => navigate("/profile/edit")}
                  className="underline underline-offset-2 hover:text-[#1A1A1A]"
                >
                  Set your location
                </button>{" "}
                so we know which venues and bars are near you.
              </p>
            )}
          </section>

          {/* Description */}
          {event.description && (
            <section className="prose prose-sm max-w-none font-['Inter'] text-[#1A1A1A]/80 whitespace-pre-line">
              {event.description === "Join us to watch Mexico in the knockout round at Six Heights bar. Time TBD — check back closer to the date for kickoff. Going only (it's a watch party, after all)."
                ? "Mexico knockout match, Boyle Heights, and community care all in one night. 🇲🇽❤️ On June 30, join us at Six Heights, a women- and Latina-owned sports bar in Boyle Heights, as we pack the house to cheer on Mexico and show up for our neighbors impacted by the warehouse fire. We’re inviting fans to bring air filters or make a donation so we can support local relief efforts and help keep our comunidad breathing easier. This is more than a watch party — it’s a space for us to gather, take care of each other, and prove that when Boyle Heights shows up, we show up together."
                : event.description}
            </section>
          )}

          {/* Going graph */}
          <section className="space-y-2">
            <SectionLabel>Who's Going</SectionLabel>
            {user ? (
              <GoingGraph eventId={event.id} viewer={{ lat: viewer?.lat ?? null, lng: viewer?.lng ?? null }} refreshKey={refreshKey} />
            ) : (
              <p className="text-sm font-['Inter'] text-[#1A1A1A]/60">
                Sign in to see who's at the venue and which bars have watch parties.
              </p>
            )}
          </section>

          {/* Chat */}
          <section className="space-y-2">
            <SectionLabel>Going Chat</SectionLabel>
            {user ? (
              <EventChatPanel eventId={event.id} onScrollToRsvp={scrollToRsvp} />
            ) : (
              <p className="text-sm font-['Inter'] text-[#1A1A1A]/60">
                Sign in and RSVP to chat with the group.
              </p>
            )}
          </section>
        </main>
      </div>
    </AppLayout>
  );
}

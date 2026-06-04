import { useEffect, useState } from "react";
import { useParams, useNavigate, useSearchParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, MapPin, Check, Share2 } from "lucide-react";
import { format } from "date-fns";
import { C, fonts } from "@/lib/editorialTheme";
import Seo from "@/components/Seo";
import { resolveEventImage } from "@/lib/eventImage";

interface Ev {
  id: string;
  title: string;
  event_date: string;
  event_time: string | null;
  venue_name: string | null;
  city: string | null;
  image_url: string | null;
  banner_image?: string | null;
  event_type?: string | null;
  sport_tags?: string[] | null;
}

const formatTime = (t: string) => {
  const [h, m] = t.split(":");
  const d = new Date(); d.setHours(parseInt(h), parseInt(m));
  return format(d, "h:mm a");
};

const RsvpConfirmed = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const returning = params.get("returning") === "1";
  const [event, setEvent] = useState<Ev | null>(null);
  const [attendeeCount, setAttendeeCount] = useState<number>(0);
  const [status, setStatus] = useState<string>("attending");

  useEffect(() => {
    if (!eventId) return;
    (async () => {
      const [{ data: ev }, { count }, { data: { user } }] = await Promise.all([
        supabase.from("events").select("id, title, event_date, event_time, venue_name, city, image_url, banner_image, event_type, sport_tags").eq("id", eventId).maybeSingle(),
        supabase.from("event_rsvps").select("*", { count: "exact", head: true }).eq("event_id", eventId).eq("status", "attending"),
        supabase.auth.getUser(),
      ]);
      setEvent(ev as Ev | null);
      setAttendeeCount(count || 0);
      if (user) {
        const { data: r } = await supabase.from("event_rsvps").select("status").eq("event_id", eventId).eq("user_id", user.id).maybeSingle();
        if (r?.status) setStatus(r.status);
      }
    })();
  }, [eventId]);

  const dateStr = event ? format(new Date(event.event_date + "T00:00:00"), "EEE, MMM d") : "";
  const timeStr = event?.event_time ? formatTime(event.event_time) : "";
  const loc = [event?.venue_name, event?.city].filter(Boolean).join(", ");
  const eventImage = event ? resolveEventImage(event) : null;

  const heading =
    status === "waitlisted" ? "You're on the list." :
    status === "canceled" ? "Got it." :
    "You're in.";

  const subhead =
    status === "waitlisted" ? "We'll text you the moment a spot opens up."
    : status === "canceled" ? "Thanks for letting us know — next time."
    : attendeeCount > 1
      ? `${attendeeCount - 1} ${attendeeCount - 1 === 1 ? "other woman" : "other women"} are coming too.`
      : "Save the date. We'll send a reminder.";

  const continueLabel = returning ? "Back to community" : "Create your fan identity";
  const continueTo = returning ? "/welcome/circles" : "/welcome/identity";

  return (
    <div className="min-h-[100dvh] flex flex-col" style={{ background: C.bg, color: C.text, fontFamily: fonts.sans }}>
      <Seo title="RSVP confirmed · Loverball" description="You're in." path={`/rsvp/confirmed/${eventId}`} />

      <main className="flex-1 max-w-md w-full mx-auto px-5 pt-12 pb-32">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center mb-6 mx-auto"
            style={{ background: C.raspberry }}
          >
            <Check className="w-8 h-8" style={{ color: "#fff" }} strokeWidth={3} />
          </div>

          <h1
            className="text-center mb-3"
            style={{ fontFamily: fonts.serif, fontStyle: "italic", fontSize: "clamp(40px, 11vw, 56px)", lineHeight: 1 }}
          >
            {heading}
          </h1>
          <p className="text-center mb-8" style={{ color: C.muted, fontSize: 15 }}>
            {subhead}
          </p>
        </motion.div>

        {event && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="rounded-3xl overflow-hidden mb-8 border"
            style={{ background: C.surface, borderColor: C.border }}
          >
            <div
              className="aspect-[1.91/1] w-full"
              style={{
                background: eventImage
                  ? `url(${eventImage}) center/cover`
                  : `linear-gradient(135deg, ${C.raspberry}, ${C.surfaceHi})`,
              }}
            />
            <div className="p-5">
              <h2 style={{ fontFamily: fonts.serif, fontStyle: "italic", fontSize: 22, lineHeight: 1.15 }}>
                {event.title}
              </h2>
              <div className="mt-3 flex flex-col gap-2 text-sm" style={{ color: C.muted }}>
                <div className="flex items-center gap-2"><Calendar className="w-4 h-4" style={{ color: C.raspberry }} />{dateStr}</div>
                {timeStr && <div className="flex items-center gap-2"><Clock className="w-4 h-4" style={{ color: C.raspberry }} />{timeStr}</div>}
                {loc && <div className="flex items-center gap-2"><MapPin className="w-4 h-4" style={{ color: C.raspberry }} />{loc}</div>}
              </div>

              <div className="flex gap-2 mt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    const url = `${window.location.origin}/e/${event.id}`;
                    navigator.clipboard.writeText(url);
                  }}
                >
                  <Share2 className="w-4 h-4 mr-2" /> Share
                </Button>
                <Button onClick={() => navigate(continueTo)}>{continueLabel}</Button>
              </div>
            </div>
          </motion.div>
        )}

        <div className="text-center">
          <Link to="/events" className="text-sm underline underline-offset-4" style={{ color: C.muted }}>
            Browse more events
          </Link>
        </div>
      </main>
    </div>
  );
};

export default RsvpConfirmed;

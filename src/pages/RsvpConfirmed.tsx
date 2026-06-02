import { useEffect, useState } from "react";
import { useParams, useNavigate, useSearchParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, MapPin, Check, Share2 } from "lucide-react";
import { format } from "date-fns";
import { C, fonts } from "@/lib/editorialTheme";
import Seo from "@/components/Seo";

interface Ev {
  id: string;
  title: string;
  event_date: string;
  event_time: string | null;
  venue_name: string | null;
  city: string | null;
  image_url: string | null;
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
        supabase.from("events").select("id, title, event_date, event_time, venue_name, city, image_url").eq("id", eventId).maybeSingle(),
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
                background: event.image_url
                  ? `url(${event.image_url}) center/cover`
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
                    if (typeof navigator.share === "function") {
                      navigator.share({ title: event.title, url }).catch(() => { /* cancelled */ });
                    } else {
                      navigator.clipboard.writeText(url);
                    }
                  }}
                  className="flex-1 h-11 rounded-full text-xs uppercase tracking-[0.18em] bg-transparent"
                  style={{ borderColor: C.borderStrong, color: C.text, fontFamily: fonts.mono }}
                >
                  <Share2 className="w-3.5 h-3.5 mr-2" /> Bring a friend
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </main>

      {/* Sticky CTA */}
      <div
        className="fixed bottom-0 left-0 right-0 border-t px-5 pt-3 pb-[calc(env(safe-area-inset-bottom)+12px)]"
        style={{ background: C.surface, borderColor: C.border }}
      >
        <div className="max-w-md mx-auto flex flex-col gap-2">
          <Button
            onClick={() => navigate(continueTo)}
            className="w-full h-14 rounded-full text-xs uppercase tracking-[0.22em] border-0"
            style={{ background: C.raspberry, color: "#fff", fontFamily: fonts.mono }}
          >
            {continueLabel}
          </Button>
          {!returning && (
            <Link
              to="/feed"
              className="text-center text-[11px] uppercase tracking-[0.18em] py-2 opacity-60 hover:opacity-100"
              style={{ color: C.muted, fontFamily: fonts.mono }}
            >
              Skip for now
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};

export default RsvpConfirmed;

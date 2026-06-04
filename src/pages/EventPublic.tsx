import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import Seo from "@/components/Seo";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar, Clock, MapPin, Share2, Copy, Mail, Loader2, ArrowLeft, Check, HelpCircle, X, Link2 } from "lucide-react";
import { format } from "date-fns";
import loverballLogo from "@/assets/loverball-script-logo.png";
import { C, fonts } from "@/lib/editorialTheme";
import { buildShareSummary, buildSharePreviewDescription } from "@/lib/eventShare";
import SharePreview from "@/components/SharePreview";
import SocialShareButtons from "@/components/SocialShareButtons";
import type { RsvpIntent } from "@/components/EventRSVPDialog";
import RsvpPhoneSheet from "@/components/rsvp/RsvpPhoneSheet";
import EventPasswordGate, { isEventUnlocked } from "@/components/EventPasswordGate";

const SITE = "https://www.loverball.com";
const SUPABASE_PROJECT_ID = import.meta.env.VITE_SUPABASE_PROJECT_ID;
// Share URLs go through an edge function that renders Open Graph meta tags
// for link-preview crawlers (iMessage, WhatsApp, Slack, Twitter, FB) — the
// SPA shell at /e/:id can't serve OG tags itself. Humans get a 0s meta-refresh
// redirect back to the canonical /e/:id page.
const buildShareUrl = (eventId: string) =>
  `https://${SUPABASE_PROJECT_ID}.supabase.co/functions/v1/event-og-meta?id=${eventId}`;

interface PublicEvent {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  event_date: string;
  event_time: string | null;
  venue_name: string | null;
  city: string | null;
  visibility: string;
  host_user_id: string | null;
  capacity: number | null;
  guest_visibility: boolean | null;
  rsvp_approval_required: boolean | null;
  password_required: boolean | null;
  show_guest_count: boolean | null;
  anonymize_guest_list: boolean | null;
  waitlist_enabled: boolean | null;
}

interface HostInfo {
  name: string | null;
  profile_photo_url: string | null;
}

interface AttendeePreview {
  user_id: string;
  name: string | null;
  profile_photo_url: string | null;
  city: string | null;
}

const formatTime = (t: string) => {
  const [h, m] = t.split(":");
  const d = new Date();
  d.setHours(parseInt(h), parseInt(m));
  return format(d, "h:mm a");
};

const EventPublic = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isMember } = useAuth();
  const { toast } = useToast();
  const [event, setEvent] = useState<PublicEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmails, setInviteEmails] = useState("");
  const [inviteMsg, setInviteMsg] = useState("");
  const [sending, setSending] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [authIntent, setAuthIntent] = useState<RsvpIntent>("attending");
  const [rsvpStatus, setRsvpStatus] = useState<RsvpIntent | null>(null);
  const [rsvping, setRsvping] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const pendingAppliedRef = useRef(false);

  const [host, setHost] = useState<HostInfo | null>(null);
  const [attendees, setAttendees] = useState<AttendeePreview[]>([]);
  const [attendeeCount, setAttendeeCount] = useState<number>(0);
  const [unlocked, setUnlocked] = useState<boolean>(() => (id ? isEventUnlocked(id) : false));

  useEffect(() => {
    if (!id) return;
    (async () => {
      const { data } = await supabase
        .from("events")
        .select("id, title, description, image_url, event_date, event_time, venue_name, city, visibility, host_user_id, capacity, guest_visibility, rsvp_approval_required, password_required, show_guest_count, anonymize_guest_list, waitlist_enabled")
        .eq("id", id)
        .maybeSingle();
      const ev = data as PublicEvent | null;
      setEvent(ev);
      setLoading(false);

      if (ev?.host_user_id) {
        const { data: h } = await supabase
          .from("profiles")
          .select("name, profile_photo_url")
          .eq("id", ev.host_user_id)
          .maybeSingle();
        setHost(h as HostInfo | null);
      }

      // Attendee count (always — used for capacity/social proof)
      const { count } = await supabase
        .from("event_rsvps")
        .select("user_id", { count: "exact", head: true })
        .eq("event_id", id)
        .eq("status", "attending");
      setAttendeeCount(count ?? 0);

      // Verified attendee preview — only RSVPs that have completed identity,
      // and only if the host hasn't hidden the guest list entirely.
      if (ev?.guest_visibility !== false) {
        const { data: rsvps } = await supabase
          .from("event_rsvps")
          .select("user_id, identity_completed_at")
          .eq("event_id", id)
          .eq("status", "attending")
          .not("identity_completed_at", "is", null)
          .limit(8);
        const ids = (rsvps ?? []).map((r) => r.user_id).filter(Boolean);
        if (ids.length) {
          const { data: profs } = await supabase
            .from("profiles")
            .select("id, name, profile_photo_url, city")
            .in("id", ids);
          setAttendees(
            (profs ?? []).map((p) => ({
              user_id: p.id,
              name: p.name,
              profile_photo_url: p.profile_photo_url,
              city: p.city,
            }))
          );
        } else {
          setAttendees([]);
        }
      }
    })();
  }, [id]);

  const canonicalUrl = `${SITE}/e/${id}`;
  const publicUrl = id ? buildShareUrl(id) : canonicalUrl;
  const isHost = !!user && !!event && event.host_user_id === user.id;
  const capacityReached = !!event?.capacity && attendeeCount >= (event.capacity ?? 0);
  const guestVisible = event?.guest_visibility !== false;
  const anonymizeGuests = event?.anonymize_guest_list === true;
  const showGuestCount = event?.show_guest_count !== false;
  const needsPassword = event?.password_required === true && !isHost && !unlocked;

  const dateStr = event ? format(new Date(event.event_date + "T00:00:00"), "EEE, MMM d, yyyy") : "";
  const timeStr = event?.event_time ? formatTime(event.event_time) : "";
  const locStr = [event?.venue_name, event?.city].filter(Boolean).join(", ");
  const shortDesc = event ? buildSharePreviewDescription(event) : "";
  const ogImage = event?.image_url || `${SITE}/og-image.png`;
  const ogTitle = event ? `${event.title} · Loverball` : "Loverball Event";

  const handleShare = useCallback(() => {
    setShowShareDialog(true);
  }, []);

  const handleNativeShare = useCallback(async () => {
    if (!event) return;
    const summary = buildShareSummary(event);
    if (typeof navigator.share === "function") {
      try {
        await navigator.share({ title: event.title, text: `${summary}\n\n${publicUrl}`, url: publicUrl });
        return;
      } catch { /* user cancelled */ }
    }
    handleCopyLink();
  }, [event, publicUrl]);

  const handleCopyLink = useCallback(() => {
    if (!event) return;
    const summary = buildShareSummary(event);
    navigator.clipboard.writeText(`${summary}\n\n${publicUrl}`);
    toast({ title: "Copied!", description: "Event summary and link copied to clipboard." });
  }, [event, publicUrl, toast]);

  const applyRsvp = useCallback(
    async (status: RsvpIntent) => {
      if (!id) return;
      const { data: { user: u } } = await supabase.auth.getUser();
      if (!u) return;
      setRsvping(true);
      try {
        const { error } = await supabase
          .from("event_rsvps")
          .upsert(
            { event_id: id, user_id: u.id, status },
            { onConflict: "event_id,user_id" }
          );
        if (error) throw error;
        if (status === "attending") {
          await supabase
            .from("event_guests")
            .upsert({ event_id: id, user_id: u.id, status: "going" }, { onConflict: "event_id,user_id" });
        } else {
          await supabase.from("event_guests").delete().eq("event_id", id).eq("user_id", u.id);
        }
        setRsvpStatus(status);
        try { localStorage.removeItem(`pending_rsvp_${id}`); } catch { /* ignore */ }
        const label = status === "attending" ? "You're in" : status === "waitlisted" ? "Marked as Maybe" : "Marked as Can't go";
        toast({ title: label, description: status === "attending" ? "We'll send you reminders." : undefined });
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Try again in a moment.";
        toast({ title: "Couldn't save RSVP", description: msg, variant: "destructive" });
      } finally {
        setRsvping(false);
      }
    },
    [id, toast]
  );

  // Load existing RSVP & apply any pending intent that was stored before auth
  useEffect(() => {
    if (!id || !user) return;
    (async () => {
      const { data } = await supabase
        .from("event_rsvps")
        .select("status")
        .eq("event_id", id)
        .eq("user_id", user.id)
        .maybeSingle();
      const existing = (data?.status as RsvpIntent | undefined) ?? null;
      if (existing) setRsvpStatus(existing);

      if (pendingAppliedRef.current) return;
      try {
        const pending = localStorage.getItem(`pending_rsvp_${id}`) as RsvpIntent | null;
        if (pending && pending !== existing) {
          pendingAppliedRef.current = true;
          await applyRsvp(pending);
        } else if (pending) {
          localStorage.removeItem(`pending_rsvp_${id}`);
        }
      } catch { /* ignore */ }
    })();
  }, [id, user, applyRsvp]);

  const handleRSVPIntent = async (status: RsvpIntent) => {
    if (!user) {
      setAuthIntent(status);
      setAuthOpen(true);
      return;
    }
    await applyRsvp(status);
    if (status === "attending" || status === "waitlisted") {
      navigate(`/rsvp/confirmed/${id}?returning=1`);
    }
  };

  const handleSendInvites = async () => {
    if (!event) return;
    const emails = inviteEmails
      .split(/[,\s\n;]+/)
      .map((e) => e.trim().toLowerCase())
      .filter((e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e));
    if (emails.length === 0) {
      toast({ title: "No valid emails", description: "Add at least one email address.", variant: "destructive" });
      return;
    }
    setSending(true);
    try {
      const { data, error } = await supabase.functions.invoke("send-event-invite", {
        body: { eventId: event.id, emails, message: inviteMsg.trim() || null },
      });
      if (error) throw error;
      toast({ title: "Invites sent", description: `${data?.sent ?? emails.length} email${emails.length === 1 ? "" : "s"} delivered.` });
      setInviteOpen(false);
      setInviteEmails("");
      setInviteMsg("");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Try again in a moment.";
      toast({ title: "Couldn't send invites", description: msg, variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: C.bg }}>
        <Loader2 className="w-6 h-6 animate-spin" style={{ color: C.raspberry }} />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center gap-4" style={{ background: C.bg, color: C.text }}>
        <h1 style={{ fontFamily: fonts.serif, fontStyle: "italic", fontSize: 32 }}>Event not found</h1>
        <Link to="/events" className="underline" style={{ color: C.raspberry }}>Browse upcoming events</Link>
      </div>
    );
  }

  if (needsPassword) {
    return (
      <>
        <Seo title={`${event.title} · Loverball`} description="Private event — password required" path={`/e/${id}`} />
        <EventPasswordGate
          eventId={event.id}
          eventTitle={event.title}
          coverImage={event.image_url}
          onUnlock={() => setUnlocked(true)}
        />
      </>
    );
  }


  return (
    <>
      <Seo
        title={ogTitle}
        description={shortDesc}
        path={`/e/${id}`}
        image={event.image_url || undefined}
        imageAlt={`${event.title} — Loverball event cover`}
        type="event"
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "Event",
          name: event.title,
          startDate: `${event.event_date}T${event.event_time || "00:00"}`,
          eventStatus: "https://schema.org/EventScheduled",
          location: { "@type": "Place", name: event.venue_name || "TBA", address: event.city || "" },
          image: event.image_url ? [event.image_url] : undefined,
          description: shortDesc,
          organizer: { "@type": "Organization", name: "Loverball", url: "https://www.loverball.com/" },
        }}
      />

      <div className="min-h-[100dvh]" style={{ background: C.bg, color: C.text, fontFamily: fonts.sans }}>
        {/* Top bar */}
        <header className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: C.border }}>
          <Link to="/" aria-label="Loverball home" className="flex items-center gap-2">
            <img src={loverballLogo} alt="Loverball" className="h-9 w-auto" loading="lazy" decoding="async" />
          </Link>
          <button
            onClick={() => {
              if (window.history.state && window.history.state.idx > 0) {
                navigate(-1);
              } else {
                navigate('/');
              }
            }}
            className="text-xs uppercase tracking-[0.2em] flex items-center gap-1.5 opacity-70 hover:opacity-100"
            style={{ fontFamily: fonts.mono }}
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back
          </button>
        </header>

        <main className="max-w-2xl mx-auto px-5 pb-24 pt-6">
          {/* Hero image */}
          <div
            className="w-full aspect-[1.91/1] rounded-2xl overflow-hidden mb-6"
            style={{ background: `linear-gradient(135deg, ${C.surface}, ${C.surfaceHi})` }}
          >
            {event.image_url ? (
              <img src={event.image_url} alt={event.title} className="w-full h-full object-cover" loading="lazy" decoding="async" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <span style={{ fontFamily: fonts.serif, fontStyle: "italic", color: C.raspberry, fontSize: 64 }}>L</span>
              </div>
            )}
          </div>

          {/* Host / community line */}
          {(host?.name || isHost) && (
            <div
              className="flex items-center gap-2 mb-3 text-xs uppercase tracking-[0.22em]"
              style={{ fontFamily: fonts.mono, color: C.muted }}
            >
              {host?.profile_photo_url ? (
                <img
                  src={host.profile_photo_url}
                  alt={host.name ?? "Host"}
                  className="w-6 h-6 rounded-full object-cover" loading="lazy" decoding="async" />
              ) : (
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold"
                  style={{ background: C.raspberry, color: "#fff" }}
                >
                  {(host?.name ?? "L").slice(0, 1).toUpperCase()}
                </div>
              )}
              <span>Hosted by {host?.name ?? "Loverball"}</span>
            </div>
          )}

          {/* Title */}
          <h1
            className="mb-5"
            style={{ fontFamily: fonts.serif, fontStyle: "italic", fontSize: "clamp(32px, 6vw, 48px)", lineHeight: 1.05 }}
          >
            {event.title}
          </h1>

          {/* Social proof — verified attendee avatar stack */}
          {(guestVisible && attendeeCount > 0) && (
            <div className="flex items-center gap-3 mb-6">
              {attendees.length > 0 && (
                <div className="flex -space-x-2">
                  {attendees.slice(0, 5).map((a) => {
                    if (anonymizeGuests) {
                      return (
                        <div
                          key={a.user_id}
                          className="w-8 h-8 rounded-full border-2 flex items-center justify-center text-[10px] font-bold"
                          style={{ borderColor: C.bg, background: C.surfaceHi, color: C.muted }}
                          aria-label="Anonymous guest"
                        >
                          ?
                        </div>
                      );
                    }
                    return a.profile_photo_url ? (
                      <img
                        key={a.user_id}
                        src={a.profile_photo_url}
                        alt={a.name ?? "Attendee"}
                        className="w-8 h-8 rounded-full object-cover border-2"
                        style={{ borderColor: C.bg }} loading="lazy" decoding="async" />
                    ) : (
                      <div
                        key={a.user_id}
                        className="w-8 h-8 rounded-full border-2 flex items-center justify-center text-[10px] font-bold"
                        style={{ borderColor: C.bg, background: C.raspberry, color: "#fff" }}
                      >
                        {(a.name ?? "L").slice(0, 1).toUpperCase()}
                      </div>
                    );
                  })}
                </div>
              )}
              <span className="text-sm" style={{ color: C.text }}>
                {showGuestCount ? (
                  <>
                    <span style={{ fontWeight: 600 }}>{attendeeCount}</span>{" "}
                    <span style={{ color: C.muted }}>
                      {attendeeCount === 1 ? "woman" : "women"}
                      {event.city ? ` from ${event.city}` : ""} going
                    </span>
                  </>
                ) : (
                  <span style={{ color: C.muted }}>
                    {anonymizeGuests ? "Verified guests confirmed" : "A few women are going"}
                  </span>
                )}
              </span>
            </div>
          )}


          {/* Capacity badge when full */}
          {capacityReached && (
            <div
              className="inline-flex items-center gap-2 mb-5 px-3 py-1.5 rounded-full text-[11px] uppercase tracking-[0.2em]"
              style={{
                background: "rgba(232,93,47,0.1)",
                color: C.raspberry,
                fontFamily: fonts.mono,
              }}
            >
              Full · waitlist open
            </div>
          )}


          {/* Meta */}
          <div className="flex flex-col gap-3 mb-7" style={{ color: C.muted }}>
            <div className="flex items-center gap-3">
              <Calendar className="w-4 h-4" style={{ color: C.raspberry }} />
              <span>{dateStr}</span>
            </div>
            {timeStr && (
              <div className="flex items-center gap-3">
                <Clock className="w-4 h-4" style={{ color: C.raspberry }} />
                <span>{timeStr}</span>
              </div>
            )}
            {locStr && (
              <div className="flex items-center gap-3">
                <MapPin className="w-4 h-4" style={{ color: C.raspberry }} />
                <span>{locStr}</span>
              </div>
            )}
          </div>

          {/* Description */}
          {event.description && (
            <p className="mb-8 whitespace-pre-line" style={{ color: C.text, lineHeight: 1.7, opacity: 0.92 }}>
              {event.description}
            </p>
          )}

          {/* RSVP — Partiful-style intent buttons */}
          <div className="mb-4">
            {rsvpStatus && (
              <div
                className="flex items-center gap-2 mb-3 px-4 py-3 rounded-xl"
                style={{
                  background: "rgba(232,93,47,0.08)",
                  border: `1px solid ${C.raspberry}44`,
                }}
              >
                <Check className="w-4 h-4" style={{ color: C.raspberry }} />
                <span style={{ color: C.text, fontSize: 14 }}>
                  {rsvpStatus === "attending"
                    ? "You're in. We'll send reminders."
                    : rsvpStatus === "waitlisted"
                    ? "You're down as Maybe."
                    : "You said Can't go. Thanks for letting us know."}
                </span>
              </div>
            )}

            <div
              className="text-[10px] uppercase tracking-[0.25em] mb-2"
              style={{ fontFamily: fonts.mono, color: C.muted }}
            >
              {rsvpStatus ? "Change your RSVP" : "Are you in?"}
            </div>
            <div className="grid grid-cols-3 gap-2">
              {([
                { key: "attending", label: capacityReached ? "Waitlist" : "Going", Icon: Check },
                { key: "waitlisted", label: "Maybe", Icon: HelpCircle },
                { key: "canceled", label: "Can't go", Icon: X },
              ] as const).map(({ key, label, Icon }) => {
                const active = rsvpStatus === key;
                return (
                  <Button
                    key={key}
                    onClick={() => handleRSVPIntent(key)}
                    disabled={rsvping}
                    className="h-14 rounded-2xl text-xs uppercase tracking-[0.18em] font-semibold border flex flex-col gap-1"
                    style={{
                      background: active ? C.raspberry : "transparent",
                      color: active ? "#fff" : C.text,
                      borderColor: active ? C.raspberry : C.borderStrong,
                      fontFamily: fonts.mono,
                    }}
                  >
                    <Icon className="w-4 h-4" />
                    {label}
                  </Button>
                );
              })}
            </div>

            <div className="flex gap-2 mt-4">
              <Button
                onClick={handleShare}
                variant="outline"
                className="flex-1 h-11 rounded-full text-xs uppercase tracking-[0.2em] bg-transparent"
                style={{ borderColor: C.borderStrong, color: C.text, fontFamily: fonts.mono }}
              >
                <Share2 className="w-3.5 h-3.5 mr-2" /> Share event
              </Button>
              <Button
                onClick={() => { navigator.clipboard.writeText(publicUrl); toast({ title: "Link copied" }); }}
                variant="outline"
                className="h-11 px-4 rounded-full bg-transparent"
                style={{ borderColor: C.borderStrong, color: C.text }}
                aria-label="Copy event link"
              >
                <Copy className="w-3.5 h-3.5" />
              </Button>
            </div>

            {(isHost || isMember) && (
              <Button
                onClick={() => setInviteOpen(true)}
                variant="outline"
                className="w-full h-11 rounded-full text-xs uppercase tracking-[0.2em] bg-transparent mt-2"
                style={{ borderColor: C.borderStrong, color: C.text, fontFamily: fonts.mono }}
              >
                <Mail className="w-3.5 h-3.5 mr-2" /> Send invite by email
              </Button>
            )}
          </div>

          <p className="text-xs mt-8 text-center" style={{ color: C.muted, fontFamily: fonts.mono, letterSpacing: "0.15em" }}>
            POWERED BY LOVERBALL · HER GAME. HER COMMUNITY.
          </p>
        </main>

        {/* Mobile sticky RSVP bar — only when no RSVP yet */}
        {!rsvpStatus && (
          <div
            className="md:hidden fixed bottom-0 left-0 right-0 z-40 border-t px-4 pt-3 pb-[calc(env(safe-area-inset-bottom)+10px)]"
            style={{ background: C.surface, borderColor: C.border }}
          >
            <div className="grid grid-cols-3 gap-2 max-w-md mx-auto">
              <Button
                onClick={() => handleRSVPIntent("attending")}
                disabled={rsvping}
                className="h-12 rounded-full text-[11px] uppercase tracking-[0.18em] border-0"
                style={{ background: C.raspberry, color: "#fff", fontFamily: fonts.mono }}
              >
                {capacityReached ? "Join waitlist" : "I'm in"}
              </Button>
              <Button
                onClick={() => handleRSVPIntent("waitlisted")}
                disabled={rsvping}
                variant="outline"
                className="h-12 rounded-full text-[11px] uppercase tracking-[0.18em] bg-transparent"
                style={{ borderColor: C.borderStrong, color: C.text, fontFamily: fonts.mono }}
              >
                Maybe
              </Button>
              <Button
                onClick={() => handleRSVPIntent("canceled")}
                disabled={rsvping}
                variant="ghost"
                className="h-12 rounded-full text-[11px] uppercase tracking-[0.18em]"
                style={{ color: C.muted, fontFamily: fonts.mono }}
              >
                Can't go
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Invite dialog */}
      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent className="border-0" style={{ background: C.surface, color: C.text }}>
          <DialogHeader>
            <DialogTitle style={{ fontFamily: fonts.serif, fontStyle: "italic", fontSize: 24 }}>
              Invite by email
            </DialogTitle>
            <DialogDescription style={{ color: C.muted }}>
              They'll get a branded invite with the event details and an RSVP button.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-xs uppercase tracking-[0.2em] block mb-2" style={{ fontFamily: fonts.mono, color: C.muted }}>
                Email addresses
              </label>
              <Textarea
                value={inviteEmails}
                onChange={(e) => setInviteEmails(e.target.value)}
                placeholder="friend@email.com, another@email.com"
                rows={3}
                style={{ background: C.bg, borderColor: C.borderStrong, color: C.text }}
              />
            </div>
            <div>
              <label className="text-xs uppercase tracking-[0.2em] block mb-2" style={{ fontFamily: fonts.mono, color: C.muted }}>
                Personal note (optional)
              </label>
              <Input
                value={inviteMsg}
                onChange={(e) => setInviteMsg(e.target.value)}
                placeholder="Hope you can make it!"
                style={{ background: C.bg, borderColor: C.borderStrong, color: C.text }}
              />
            </div>
            <Button
              onClick={handleSendInvites}
              disabled={sending}
              className="w-full h-11 rounded-full text-xs uppercase tracking-[0.2em] border-0"
              style={{ background: C.raspberry, color: "#fff", fontFamily: fonts.mono }}
            >
              {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Send invites"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Share dialog */}
      <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
        <DialogContent className="border-0" style={{ background: C.surface, color: C.text }}>
          <DialogHeader>
            <DialogTitle style={{ fontFamily: fonts.serif, fontStyle: "italic", fontSize: 24 }}>
              Share event
            </DialogTitle>
            <DialogDescription style={{ color: C.muted }}>
              {event ? `${event.title} · ${dateStr}${timeStr ? ` @ ${timeStr}` : ""}` : ""}
            </DialogDescription>
          </DialogHeader>
          {event && (
            <div className="space-y-4">
              <SharePreview
                title={`${event.title} · Loverball`}
                description={shortDesc}
                imageUrl={event.image_url}
                siteName="loverball.com"
                eventDate={dateStr}
                eventTime={timeStr || null}
                venue={event.venue_name}
                city={event.city}
              />

              {/* Social Share Buttons */}
              <SocialShareButtons
                url={publicUrl}
                text={buildShareSummary(event)}
              />

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1 h-11 rounded-full text-xs uppercase tracking-[0.2em] bg-transparent"
                  style={{ borderColor: C.borderStrong, color: C.text, fontFamily: fonts.mono }}
                  onClick={handleCopyLink}
                >
                  <Copy className="w-3.5 h-3.5 mr-2" /> Copy Link
                </Button>
                {typeof navigator.share === "function" && (
                  <Button
                    className="flex-1 h-11 rounded-full text-xs uppercase tracking-[0.2em] border-0"
                    style={{ background: C.raspberry, color: "#fff", fontFamily: fonts.mono }}
                    onClick={handleNativeShare}
                  >
                    <Share2 className="w-3.5 h-3.5 mr-2" /> Share
                  </Button>
                )}
              </div>
              <div className="rounded-xl p-3" style={{ background: C.bg, border: `1px solid ${C.borderStrong}` }}>
                <p className="text-xs mb-1 flex items-center gap-1" style={{ color: C.muted, fontFamily: fonts.mono, letterSpacing: "0.04em" }}>
                  <Link2 className="w-3 h-3" />
                  Share URL
                </p>
                <p className="text-xs font-mono break-all" style={{ color: C.text }}>
                  {publicUrl}
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Phone-OTP RSVP sheet (replaces legacy email dialog on the public invite path) */}
      <RsvpPhoneSheet
        open={authOpen}
        onOpenChange={setAuthOpen}
        eventId={event.id}
        eventTitle={event.title}
        intent={authIntent}
        onVerified={applyRsvp}
      />
    </>
  );
};

export default EventPublic;

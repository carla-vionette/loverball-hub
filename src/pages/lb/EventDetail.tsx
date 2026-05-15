import { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import {
  fetchEventBySlug, fetchEventRsvps, fetchUsersByIds, rsvpToEvent,
  type LBEvent, type LBUser,
} from '@/lib/lb';
import Wordmark from '@/components/lb/Wordmark';
import PillarBadge from '@/components/lb/PillarBadge';
import AttendeePreview from '@/components/lb/AttendeePreview';
import AuthModal from '@/components/lb/AuthModal';
import BringFriendCard from '@/components/lb/BringFriendCard';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

function fmtDate(dt: string) {
  const d = new Date(dt);
  return d.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });
}
function fmtTime(dt: string) {
  return new Date(dt).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
}

export default function EventDetail() {
  const { slug = '' } = useParams();
  const [params] = useSearchParams();
  const referralUserId = params.get('ref');
  const navigate = useNavigate();
  const { user } = useAuth();

  const [event, setEvent] = useState<LBEvent | null>(null);
  const [attendees, setAttendees] = useState<LBUser[]>([]);
  const [total, setTotal] = useState(0);
  const [host, setHost] = useState<LBUser | null>(null);
  const [iAmGoing, setIAmGoing] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);

  const refresh = async (e: LBEvent | null) => {
    if (!e) return;
    const rsvps = await fetchEventRsvps(e.id);
    setTotal(rsvps.length);
    const userIds = rsvps.map(r => r.user_id);
    const profiles = await fetchUsersByIds([...userIds, ...(e.host_user_id ? [e.host_user_id] : [])]);
    setAttendees(profiles.filter(p => userIds.includes(p.id)));
    setHost(e.host_user_id ? profiles.find(p => p.id === e.host_user_id) || null : null);
    if (user) setIAmGoing(rsvps.some(r => r.user_id === user.id));
  };

  useEffect(() => {
    fetchEventBySlug(slug).then(async (e) => {
      setEvent(e);
      await refresh(e);
    }).catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug, user?.id]);

  // Set per-event meta tags for link unfurling
  useEffect(() => {
    if (!event) return;
    document.title = `${event.title} — Loverball`;
    const setMeta = (sel: string, attr: string, val: string) => {
      let el = document.head.querySelector<HTMLMetaElement>(sel);
      if (!el) { el = document.createElement('meta'); document.head.appendChild(el); }
      const [a, v] = attr.split('=');
      el.setAttribute(a, v);
      el.setAttribute('content', val);
    };
    const url = `${window.location.origin}/e/${event.slug}`;
    setMeta(`meta[property="og:title"]`, 'property=og:title', event.title);
    setMeta(`meta[property="og:description"]`, 'property=og:description', event.description?.slice(0, 200) || 'A Loverball event in LA.');
    setMeta(`meta[property="og:image"]`, 'property=og:image', event.hero_image_url || '');
    setMeta(`meta[property="og:url"]`, 'property=og:url', url);
    setMeta(`meta[name="twitter:title"]`, 'name=twitter:title', event.title);
    setMeta(`meta[name="twitter:description"]`, 'name=twitter:description', event.description?.slice(0, 200) || '');
    setMeta(`meta[name="twitter:image"]`, 'name=twitter:image', event.hero_image_url || '');
  }, [event]);

  const handleRsvp = async () => {
    if (!user) { setAuthOpen(true); return; }
    if (!event) return;
    try {
      await rsvpToEvent({ eventId: event.id, userId: user.id, referralUserId });
      setIAmGoing(true);
      navigate(`/e/${event.slug}/welcome`);
    } catch (e: any) {
      toast.error(e.message || 'Could not save RSVP');
    }
  };

  // After OAuth/OTP flow, retry RSVP automatically
  useEffect(() => {
    if (!authOpen && user && event && !iAmGoing) {
      // user just authed; auto-RSVP
      rsvpToEvent({ eventId: event.id, userId: user.id, referralUserId })
        .then(() => navigate(`/e/${event.slug}/welcome`))
        .catch(() => {});
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  if (!event) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center text-muted-foreground">Loading…</div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-32">
      <header className="absolute top-0 left-0 right-0 z-10 px-6 pt-5 flex items-center justify-between">
        <Wordmark />
        <Link to="/home" className="text-xs text-background/90 bg-foreground/30 backdrop-blur px-3 py-1.5 rounded-full">
          Sign in
        </Link>
      </header>

      <div
        className="w-full aspect-[16/9] bg-muted bg-center bg-cover"
        style={{ backgroundImage: event.hero_image_url ? `url(${event.hero_image_url})` : undefined }}
      />

      <article className="px-6 max-w-2xl mx-auto pt-6">
        <PillarBadge pillar={event.pillar} />
        <h1 className="font-serif text-[28px] sm:text-[40px] leading-[1.1] mt-2 text-foreground">
          {event.title}
        </h1>

        <div className="mt-4 text-foreground">
          <div className="text-base">{fmtDate(event.starts_at)}</div>
          <div className="text-sm text-muted-foreground">
            {fmtTime(event.starts_at)}
            {event.ends_at ? ` – ${fmtTime(event.ends_at)}` : ''}
          </div>
        </div>

        <div className="mt-3 text-foreground">
          {event.is_private ? (
            <span className="text-sm">{event.neighborhood} (address shared after RSVP)</span>
          ) : (
            <>
              <div className="text-base">{event.venue_name}</div>
              <div className="text-sm text-muted-foreground">
                {event.venue_address}{event.neighborhood ? ` · ${event.neighborhood}` : ''}
              </div>
            </>
          )}
        </div>

        {host && (
          <div className="mt-6 flex items-center gap-3 p-3 border border-border rounded-md bg-card">
            <div className="w-10 h-10 rounded-full bg-muted overflow-hidden flex-shrink-0">
              {host.photo_url && <img src={host.photo_url} alt="" className="w-full h-full object-cover" />}
            </div>
            <div className="text-sm">
              <div className="text-muted-foreground text-xs">hosted by</div>
              <div className="font-medium">{host.display_name || 'Loverball'}</div>
            </div>
          </div>
        )}

        {event.description && (
          <div className="mt-8 text-foreground leading-relaxed whitespace-pre-line">
            {event.description}
          </div>
        )}

        <div className="mt-10">
          <p className="eyebrow text-muted-foreground mb-3">Who's going</p>
          <AttendeePreview users={attendees} total={total} />
        </div>

        {iAmGoing && user && (
          <div className="mt-8">
            <BringFriendCard slug={event.slug} userId={user.id} />
          </div>
        )}
      </article>

      {/* Sticky CTA */}
      <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-border px-6 py-3 z-20">
        <div className="max-w-2xl mx-auto">
          {iAmGoing ? (
            <Button
              onClick={() => navigate(`/e/${event.slug}/welcome`)}
              className="w-full h-12 bg-foreground text-background hover:bg-foreground/90 rounded-md text-base"
            >
              You're in. See who else is going →
            </Button>
          ) : (
            <Button
              onClick={handleRsvp}
              className="w-full h-12 bg-primary text-primary-foreground hover:bg-primary/90 rounded-md text-base"
            >
              RSVP
            </Button>
          )}
        </div>
      </div>

      <AuthModal
        open={authOpen}
        onOpenChange={setAuthOpen}
        eventTitle={event.title}
      />
    </div>
  );
}

import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import {
  fetchEvents, fetchMyRsvps, fetchEventRsvps, fetchMyProfile,
  type LBEvent, type LBUser,
} from '@/lib/lb';
import EventCard from '@/components/lb/EventCard';
import Wordmark from '@/components/lb/Wordmark';
import ProfileBuildCards from '@/components/lb/ProfileBuildCards';

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

export default function Home() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [events, setEvents] = useState<LBEvent[]>([]);
  const [myEvents, setMyEvents] = useState<LBEvent[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [me, setMe] = useState<LBUser | null>(null);

  useEffect(() => {
    if (!loading && !user) navigate('/');
  }, [loading, user, navigate]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const all = await fetchEvents({ upcomingOnly: true });
      const myRsvps = await fetchMyRsvps(user.id);
      const myIds = new Set(myRsvps.map(r => r.event_id));
      setMyEvents(all.filter(e => myIds.has(e.id)));
      setEvents(all.filter(e => !myIds.has(e.id)));
      const cs = await Promise.all(all.map(e => fetchEventRsvps(e.id).then(r => [e.id, r.length] as const)));
      setCounts(Object.fromEntries(cs));
      setMe(await fetchMyProfile(user.id));
    })();
  }, [user]);

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background">
      <header className="px-6 py-4 flex justify-between items-center border-b border-border">
        <Wordmark />
        <Link to="/profile" className="text-sm text-foreground underline-offset-4 hover:underline">Profile</Link>
      </header>

      <main className="px-6 py-8 max-w-2xl mx-auto">
        <h1 className="font-serif text-3xl text-foreground">
          {greeting()}{me?.display_name ? `, ${me.display_name.split(' ')[0]}` : ''}.
        </h1>

        {me && me.profile_completion < 80 && (
          <div className="mt-8">
            <ProfileBuildCards me={me} onUpdated={setMe} />
          </div>
        )}

        {myEvents.length > 0 && (
          <section className="mt-10">
            <p className="eyebrow text-primary mb-3">Upcoming for you</p>
            <div className="space-y-3">
              {myEvents.map(e => <EventCard key={e.id} event={e} attendeeCount={counts[e.id]} />)}
            </div>
          </section>
        )}

        <section className="mt-10">
          <p className="eyebrow text-muted-foreground mb-3">Happening this week</p>
          <div className="space-y-3">
            {events.map(e => <EventCard key={e.id} event={e} attendeeCount={counts[e.id]} />)}
            {events.length === 0 && (
              <p className="text-muted-foreground text-sm">You're caught up. New events post Mondays.</p>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}

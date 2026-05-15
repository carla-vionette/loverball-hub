import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Wordmark from '@/components/lb/Wordmark';
import EventCard from '@/components/lb/EventCard';
import { fetchEvents, fetchEventRsvps, type LBEvent } from '@/lib/lb';
import { Button } from '@/components/ui/button';

export default function Index() {
  const [events, setEvents] = useState<LBEvent[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    fetchEvents({ upcomingOnly: true }).then(async (evs) => {
      setEvents(evs.slice(0, 3));
      const all = await Promise.all(evs.slice(0, 3).map(e => fetchEventRsvps(e.id).then(r => [e.id, r.length] as const)));
      setCounts(Object.fromEntries(all));
    }).catch(() => {});
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="relative h-[88vh] min-h-[560px] w-full overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=1800&q=85"
          alt="Women cheering at a sports event"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-foreground/30 via-foreground/10 to-foreground/60" />

        <div className="relative z-10 px-6 pt-6 flex justify-between items-center">
          <Wordmark />
          <Link to="/home" className="text-sm text-background/90 underline-offset-4 hover:underline">
            Sign in
          </Link>
        </div>

        <div className="relative z-10 absolute bottom-0 left-0 right-0 px-6 pb-12 md:pb-20">
          <h1 className="font-serif text-background text-[40px] leading-[1.05] sm:text-6xl md:text-7xl max-w-3xl">
            Where women who love sports actually meet.
          </h1>
          <p className="mt-4 text-background/90 text-base sm:text-lg max-w-xl">
            Curated events in LA. Local, cultural, sports.
          </p>
          <a href="#events" className="inline-block mt-6">
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90 h-12 px-6 rounded-md text-base">
              See what's happening
            </Button>
          </a>
        </div>
      </section>

      {/* Upcoming */}
      <section id="events" className="px-6 py-16 md:py-24 max-w-3xl mx-auto">
        <div className="mb-8">
          <p className="eyebrow text-primary mb-2">Upcoming in LA</p>
          <h2 className="font-serif text-3xl md:text-4xl text-foreground">This week and next.</h2>
        </div>
        <div className="space-y-3">
          {events.map(e => (
            <EventCard key={e.id} event={e} attendeeCount={counts[e.id]} />
          ))}
          {events.length === 0 && (
            <p className="text-muted-foreground">New events drop every week. Check back soon.</p>
          )}
        </div>
      </section>

      <footer className="px-6 py-10 border-t border-border text-xs text-muted-foreground flex flex-wrap gap-4 justify-between">
        <span>© Loverball, made in LA.</span>
        <span className="flex gap-4">
          <Link to="/terms">Terms</Link>
          <Link to="/privacy">Privacy</Link>
        </span>
      </footer>
    </div>
  );
}

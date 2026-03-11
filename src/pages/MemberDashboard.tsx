import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import AppLayout from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Play, Calendar, User, ArrowRight } from 'lucide-react';
import { fetchPublicVideos, fetchPublicEvents } from '@/services/memberService';
import { format } from 'date-fns';
import type { VideoItem, EventItem } from '@/types';

const MemberDashboard = () => {
  const { user } = useAuth();
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [vids, evts] = await Promise.all([
          fetchPublicVideos(),
          fetchPublicEvents(),
        ]);
        setVideos(vids.slice(0, 6));
        setEvents(evts.filter(e => new Date(e.event_date) >= new Date()).slice(0, 4));
      } catch (error) {
        console.error('Error loading dashboard:', error);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="mb-8">
          <h1 className="font-display text-3xl font-black uppercase tracking-tight">
            Welcome back{user?.user_metadata?.name ? `, ${user.user_metadata.name}` : ''}
          </h1>
          <p className="text-muted-foreground mt-1">Your Loverball dashboard</p>
        </div>

        {/* Quick actions */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <Link to="/watch">
            <Card className="hover:bg-secondary/50 transition-colors cursor-pointer">
              <CardContent className="flex items-center gap-3 p-4">
                <Play className="w-5 h-5 text-primary" />
                <span className="font-semibold text-sm">Watch Videos</span>
              </CardContent>
            </Card>
          </Link>
          <Link to="/events">
            <Card className="hover:bg-secondary/50 transition-colors cursor-pointer">
              <CardContent className="flex items-center gap-3 p-4">
                <Calendar className="w-5 h-5 text-primary" />
                <span className="font-semibold text-sm">Upcoming Events</span>
              </CardContent>
            </Card>
          </Link>
          <Link to="/profile/edit">
            <Card className="hover:bg-secondary/50 transition-colors cursor-pointer">
              <CardContent className="flex items-center gap-3 p-4">
                <User className="w-5 h-5 text-primary" />
                <span className="font-semibold text-sm">Edit Profile</span>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Latest Videos */}
        {videos.length > 0 && (
          <section className="mb-10">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-xl font-bold uppercase">Latest Videos</h2>
              <Link to="/watch" className="text-primary text-sm font-medium flex items-center gap-1 hover:underline">
                View all <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {videos.map((video) => (
                <Card key={video.id} className="overflow-hidden">
                  {video.thumbnail && (
                    <div className="aspect-video bg-secondary">
                      <img src={video.thumbnail} alt={video.title} className="w-full h-full object-cover" loading="lazy" />
                    </div>
                  )}
                  <CardContent className="p-4">
                    <h3 className="font-semibold text-sm line-clamp-2">{video.title}</h3>
                    {video.category && (
                      <Badge variant="secondary" className="mt-2 text-xs">{video.category}</Badge>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* Upcoming Events */}
        {events.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-xl font-bold uppercase">Upcoming Events</h2>
              <Link to="/events" className="text-primary text-sm font-medium flex items-center gap-1 hover:underline">
                View all <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {events.map((event) => (
                <Link key={event.id} to={`/event/${event.id}`}>
                  <Card className="hover:bg-secondary/50 transition-colors cursor-pointer overflow-hidden">
                    {event.image && (
                      <div className="aspect-[2/1] bg-secondary">
                        <img src={event.image} alt={event.title} className="w-full h-full object-cover" loading="lazy" />
                      </div>
                    )}
                    <CardContent className="p-4">
                      <h3 className="font-semibold">{event.title}</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        {format(new Date(event.event_date), 'EEEE, MMMM d, yyyy')}
                      </p>
                      {event.location && (
                        <p className="text-sm text-muted-foreground">{event.location}</p>
                      )}
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </AppLayout>
  );
};

export default MemberDashboard;

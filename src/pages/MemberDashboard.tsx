import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import AppLayout from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Loader2, Play, Calendar, User, ArrowRight, CreditCard, Share2, Crown } from 'lucide-react';
import { fetchPublicVideos, fetchPublicEvents } from '@/services/memberService';
import { getUserSubscription } from '@/services/subscriptionService';
import { getUserInvite } from '@/services/inviteService';
import { format } from 'date-fns';
import type { VideoItem, EventItem, Subscription, Invite } from '@/types';

const MemberDashboard = () => {
  const { user } = useAuth();
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [invite, setInvite] = useState<Invite | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const promises: Promise<unknown>[] = [
          fetchPublicVideos(),
          fetchPublicEvents(),
        ];
        if (user) {
          promises.push(getUserSubscription(user.id));
          promises.push(getUserInvite(user.id));
        }
        const results = await Promise.all(promises);
        setVideos((results[0] as VideoItem[]).slice(0, 6));
        setEvents((results[1] as EventItem[]).filter((e: EventItem) => new Date(e.event_date) >= new Date()).slice(0, 4));
        if (user) {
          setSubscription(results[2] as Subscription | null);
          setInvite(results[3] as Invite | null);
        }
      } catch (error) {
        console.error('Error loading dashboard:', error);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user]);

  if (loading) {
    return (
      <AppLayout>
        <div className="container mx-auto px-4 py-8 max-w-6xl">
          <Skeleton className="h-10 w-64 mb-2" />
          <Skeleton className="h-4 w-48 mb-8" />
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-8">
            {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-24 rounded-xl" />)}
          </div>
        </div>
      </AppLayout>
    );
  }

  const plan = subscription?.plan || 'free';

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Welcome header */}
        <div className="mb-8">
          <h1 className="font-display text-3xl font-black uppercase tracking-tight">
            Welcome back{user?.user_metadata?.name ? `, ${user.user_metadata.name}` : ''}
          </h1>
          <p className="text-muted-foreground mt-1">Your Loverball dashboard</p>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="w-full justify-start overflow-x-auto">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="videos">Videos</TabsTrigger>
            <TabsTrigger value="events">Events</TabsTrigger>
            <TabsTrigger value="invites">Invites</TabsTrigger>
            <TabsTrigger value="billing">Billing</TabsTrigger>
          </TabsList>

          {/* ── Overview Tab ── */}
          <TabsContent value="overview" className="space-y-8">
            {/* Quick stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4 text-center">
                  <Crown className="w-5 h-5 text-primary mx-auto mb-1" />
                  <p className="text-lg font-bold capitalize">{plan}</p>
                  <p className="text-xs text-muted-foreground">Current Plan</p>
                </CardContent>
              </Card>
              <Link to="/videos">
                <Card className="hover:bg-secondary/50 transition-colors cursor-pointer h-full">
                  <CardContent className="p-4 text-center">
                    <Play className="w-5 h-5 text-primary mx-auto mb-1" />
                    <p className="text-lg font-bold">{videos.length}</p>
                    <p className="text-xs text-muted-foreground">Videos</p>
                  </CardContent>
                </Card>
              </Link>
              <Link to="/events">
                <Card className="hover:bg-secondary/50 transition-colors cursor-pointer h-full">
                  <CardContent className="p-4 text-center">
                    <Calendar className="w-5 h-5 text-primary mx-auto mb-1" />
                    <p className="text-lg font-bold">{events.length}</p>
                    <p className="text-xs text-muted-foreground">Upcoming Events</p>
                  </CardContent>
                </Card>
              </Link>
              <Link to="/invites">
                <Card className="hover:bg-secondary/50 transition-colors cursor-pointer h-full">
                  <CardContent className="p-4 text-center">
                    <Share2 className="w-5 h-5 text-primary mx-auto mb-1" />
                    <p className="text-lg font-bold">{invite?.signup_count || 0}</p>
                    <p className="text-xs text-muted-foreground">Referrals</p>
                  </CardContent>
                </Card>
              </Link>
            </div>

            {/* Subscription Status */}
            {plan === 'free' && (
              <Card className="border-primary/20 bg-primary/5">
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <p className="font-semibold">Upgrade to Pro or Premium</p>
                    <p className="text-sm text-muted-foreground">Unlock the full video library, all events, and more.</p>
                  </div>
                  <Link to="/pricing">
                    <Button size="sm">View Plans</Button>
                  </Link>
                </CardContent>
              </Card>
            )}

            {/* Recent Videos */}
            {videos.length > 0 && (
              <section>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-display text-xl font-bold uppercase">Latest Videos</h2>
                  <Link to="/videos" className="text-primary text-sm font-medium flex items-center gap-1 hover:underline">
                    View all <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {videos.slice(0, 3).map((video) => (
                    <Link key={video.id} to={`/watch/video/${video.id}`}>
                      <Card className="overflow-hidden hover:shadow-md transition-all duration-200 hover:-translate-y-0.5">
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
                    </Link>
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
                  {events.slice(0, 3).map((event) => (
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
          </TabsContent>

          {/* ── Videos Tab ── */}
          <TabsContent value="videos">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-xl font-bold uppercase">Your Videos</h2>
              <Link to="/videos">
                <Button variant="outline" size="sm">Browse All <ArrowRight className="w-4 h-4 ml-1" /></Button>
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {videos.map((video) => (
                <Link key={video.id} to={`/watch/video/${video.id}`}>
                  <Card className="overflow-hidden hover:shadow-md transition-all duration-200">
                    {video.thumbnail && (
                      <div className="aspect-video bg-secondary">
                        <img src={video.thumbnail} alt={video.title} className="w-full h-full object-cover" loading="lazy" />
                      </div>
                    )}
                    <CardContent className="p-4">
                      <h3 className="font-semibold text-sm line-clamp-2">{video.title}</h3>
                      <div className="flex gap-2 mt-2">
                        {video.category && <Badge variant="secondary" className="text-xs">{video.category}</Badge>}
                        {video.tier && <Badge variant="outline" className="text-xs capitalize">{video.tier}</Badge>}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </TabsContent>

          {/* ── Events Tab ── */}
          <TabsContent value="events">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-xl font-bold uppercase">Upcoming Events</h2>
              <Link to="/events">
                <Button variant="outline" size="sm">View All <ArrowRight className="w-4 h-4 ml-1" /></Button>
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
                    </CardContent>
                  </Card>
                </Link>
              ))}
              {events.length === 0 && (
                <p className="text-muted-foreground text-center py-12 col-span-2">No upcoming events.</p>
              )}
            </div>
          </TabsContent>

          {/* ── Invites Tab ── */}
          <TabsContent value="invites">
            <div className="text-center py-8">
              <Share2 className="w-12 h-12 text-primary mx-auto mb-4" />
              <h2 className="font-display text-xl font-bold uppercase mb-2">Invite Friends</h2>
              <p className="text-muted-foreground mb-4">
                You have {invite?.signup_count || 0} successful referrals.
              </p>
              <Link to="/invites">
                <Button>Go to Invite Page <ArrowRight className="w-4 h-4 ml-1" /></Button>
              </Link>
            </div>
          </TabsContent>

          {/* ── Billing Tab ── */}
          <TabsContent value="billing">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Current Plan</p>
                    <p className="text-2xl font-bold capitalize">{plan}</p>
                  </div>
                  <CreditCard className="w-8 h-8 text-primary" />
                </div>
                <div className="flex gap-3">
                  <Link to="/billing">
                    <Button variant="outline" size="sm">Manage Subscription</Button>
                  </Link>
                  {plan === 'free' && (
                    <Link to="/pricing">
                      <Button size="sm">Upgrade</Button>
                    </Link>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
};

export default MemberDashboard;

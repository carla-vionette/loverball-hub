import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import AppLayout from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Loader2, Play, Calendar, User, ArrowRight, CreditCard,
  Share2, Crown, Star, Clock
} from 'lucide-react';
import { fetchPublicVideos, fetchPublicEvents } from '@/services/memberService';
import { fetchUserSubscription } from '@/services/subscriptionService';
import { fetchUserInvite } from '@/services/inviteService';
import { format } from 'date-fns';
import type { VideoItem, EventItem, Subscription, Invite } from '@/types';

type DashTab = 'overview' | 'videos' | 'events' | 'invites' | 'billing' | 'profile';

const MemberDashboard = () => {
  const { user } = useAuth();
  const [tab, setTab] = useState<DashTab>('overview');
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
          promises.push(fetchUserSubscription(user.id));
          promises.push(fetchUserInvite(user.id));
        }
        const [vids, evts, sub, inv] = await Promise.all(promises);
        setVideos(vids as VideoItem[]);
        setEvents(evts as EventItem[]);
        setSubscription((sub as Subscription) || null);
        setInvite((inv as Invite) || null);
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
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  const upcomingEvents = events.filter(e => new Date(e.event_date) >= new Date());
  const pastEvents = events.filter(e => new Date(e.event_date) < new Date());
  const recentVideos = videos.slice(0, 3);
  const upcomingEventsPreview = upcomingEvents.slice(0, 3);

  const planLabel = subscription?.plan
    ? subscription.plan.charAt(0).toUpperCase() + subscription.plan.slice(1)
    : 'Free';

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="mb-6">
          <h1 className="font-display text-3xl font-black uppercase tracking-tight">
            Welcome back{user?.user_metadata?.name ? `, ${user.user_metadata.name}` : ''}
          </h1>
          <p className="text-muted-foreground mt-1">Your Loverball dashboard</p>
        </div>

        <Tabs value={tab} onValueChange={(v) => setTab(v as DashTab)}>
          <TabsList className="mb-6 flex flex-wrap h-auto gap-1">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="videos">Videos</TabsTrigger>
            <TabsTrigger value="events">Events</TabsTrigger>
            <TabsTrigger value="invites">Invites</TabsTrigger>
            <TabsTrigger value="billing">Billing</TabsTrigger>
            <TabsTrigger value="profile">Profile</TabsTrigger>
          </TabsList>

          {/* Overview */}
          <TabsContent value="overview">
            {/* Subscription Status */}
            <Card className="mb-6">
              <CardContent className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <Crown className="w-5 h-5 text-primary" />
                  <div>
                    <p className="font-semibold text-sm">Current Plan: {planLabel}</p>
                    {subscription?.current_period_end && (
                      <p className="text-xs text-muted-foreground">
                        Renews {format(new Date(subscription.current_period_end), 'MMM d, yyyy')}
                      </p>
                    )}
                  </div>
                </div>
                {subscription?.plan === 'free' && (
                  <Link to="/pricing">
                    <Button size="sm" variant="outline">Upgrade</Button>
                  </Link>
                )}
              </CardContent>
            </Card>

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

            {/* Recent Videos */}
            {recentVideos.length > 0 && (
              <section className="mb-10">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-display text-xl font-bold uppercase">Latest Videos</h2>
                  <Link to="/watch" className="text-primary text-sm font-medium flex items-center gap-1 hover:underline">
                    View all <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {recentVideos.map((video) => (
                    <Link key={video.id} to={`/watch/${video.id}`}>
                      <Card className="overflow-hidden hover:bg-secondary/50 transition-colors">
                        {video.thumbnail && (
                          <div className="aspect-video bg-secondary relative">
                            <img src={video.thumbnail} alt={video.title} className="w-full h-full object-cover" loading="lazy" />
                            {video.tier !== 'free' && (
                              <Badge className="absolute top-2 right-2 text-xs" variant="secondary">
                                {video.tier === 'premium' ? <Star className="w-3 h-3 mr-1" /> : <Crown className="w-3 h-3 mr-1" />}
                                {video.tier}
                              </Badge>
                            )}
                            {video.duration && (
                              <span className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-1.5 py-0.5 rounded">
                                {video.duration}
                              </span>
                            )}
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

            {/* Upcoming Events Preview */}
            {upcomingEventsPreview.length > 0 && (
              <section className="mb-10">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-display text-xl font-bold uppercase">Upcoming Events</h2>
                  <Link to="/events" className="text-primary text-sm font-medium flex items-center gap-1 hover:underline">
                    View all <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {upcomingEventsPreview.map((event) => (
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

            {/* Invite Stats Summary */}
            <Card>
              <CardContent className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <Share2 className="w-5 h-5 text-primary" />
                  <div>
                    <p className="font-semibold text-sm">
                      {invite?.signup_count || 0} friend{(invite?.signup_count || 0) !== 1 ? 's' : ''} invited
                    </p>
                    <p className="text-xs text-muted-foreground">Share your invite link to earn badges</p>
                  </div>
                </div>
                <Link to="/invites">
                  <Button size="sm" variant="outline">Invite Friends</Button>
                </Link>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Videos Tab */}
          <TabsContent value="videos">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-display text-xl font-bold uppercase">Video Library</h2>
              <Link to="/watch">
                <Button variant="outline" size="sm">Browse All <ArrowRight className="w-4 h-4 ml-1" /></Button>
              </Link>
            </div>
            {videos.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Play className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
                  <p className="text-muted-foreground">No videos available yet.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {videos.map((video) => (
                  <Link key={video.id} to={`/watch/${video.id}`}>
                    <Card className="overflow-hidden hover:bg-secondary/50 transition-colors">
                      <div className="aspect-video bg-secondary relative">
                        {video.thumbnail ? (
                          <img src={video.thumbnail} alt={video.title} className="w-full h-full object-cover" loading="lazy" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Play className="w-8 h-8 text-muted-foreground" />
                          </div>
                        )}
                        {video.tier !== 'free' && (
                          <Badge className="absolute top-2 right-2 text-xs" variant="secondary">
                            {video.tier}
                          </Badge>
                        )}
                        {video.duration && (
                          <span className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-1.5 py-0.5 rounded flex items-center gap-1">
                            <Clock className="w-3 h-3" />{video.duration}
                          </span>
                        )}
                      </div>
                      <CardContent className="p-4">
                        <h3 className="font-semibold text-sm line-clamp-2">{video.title}</h3>
                        <div className="flex items-center gap-2 mt-2">
                          {video.category && <Badge variant="secondary" className="text-xs">{video.category}</Badge>}
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Events Tab */}
          <TabsContent value="events">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-display text-xl font-bold uppercase">Events</h2>
              <Link to="/events">
                <Button variant="outline" size="sm">Browse All <ArrowRight className="w-4 h-4 ml-1" /></Button>
              </Link>
            </div>

            {upcomingEvents.length > 0 && (
              <div className="mb-8">
                <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide mb-3">Upcoming</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {upcomingEvents.map((event) => (
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
                          {event.tier !== 'free' && (
                            <Badge variant="secondary" className="mt-2 text-xs">{event.tier}</Badge>
                          )}
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {pastEvents.length > 0 && (
              <div>
                <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide mb-3">Past Events</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {pastEvents.slice(0, 6).map((event) => (
                    <Link key={event.id} to={`/event/${event.id}`}>
                      <Card className="hover:bg-secondary/50 transition-colors cursor-pointer overflow-hidden opacity-75">
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
                </div>
              </div>
            )}

            {upcomingEvents.length === 0 && pastEvents.length === 0 && (
              <Card>
                <CardContent className="py-12 text-center">
                  <Calendar className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
                  <p className="text-muted-foreground">No events available yet.</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Invites Tab */}
          <TabsContent value="invites">
            <div className="text-center py-12">
              <Share2 className="w-12 h-12 mx-auto text-primary mb-4" />
              <h2 className="font-display text-xl font-bold uppercase mb-2">Invite Friends</h2>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                Share Loverball with friends and earn badges. You've invited{' '}
                <span className="font-bold text-foreground">{invite?.signup_count || 0}</span> friends so far.
              </p>
              <Link to="/invites">
                <Button size="lg">
                  <Share2 className="w-4 h-4 mr-2" /> Go to Invites Page
                </Button>
              </Link>
            </div>
          </TabsContent>

          {/* Billing Tab */}
          <TabsContent value="billing">
            <div className="text-center py-12">
              <CreditCard className="w-12 h-12 mx-auto text-primary mb-4" />
              <h2 className="font-display text-xl font-bold uppercase mb-2">Billing & Subscription</h2>
              <p className="text-muted-foreground mb-2">
                Current plan: <span className="font-bold text-foreground">{planLabel}</span>
              </p>
              {subscription?.status && (
                <p className="text-muted-foreground mb-6">
                  Status: <Badge variant="secondary">{subscription.status}</Badge>
                </p>
              )}
              <div className="flex justify-center gap-3">
                <Link to="/billing">
                  <Button size="lg">
                    <CreditCard className="w-4 h-4 mr-2" /> Manage Billing
                  </Button>
                </Link>
                {subscription?.plan === 'free' && (
                  <Link to="/pricing">
                    <Button size="lg" variant="outline">View Plans</Button>
                  </Link>
                )}
              </div>
            </div>
          </TabsContent>

          {/* Profile Tab */}
          <TabsContent value="profile">
            <div className="text-center py-12">
              <User className="w-12 h-12 mx-auto text-primary mb-4" />
              <h2 className="font-display text-xl font-bold uppercase mb-2">Your Profile</h2>
              <p className="text-muted-foreground mb-6">Update your bio, photo, favorite teams, and social links.</p>
              <Link to="/profile/edit">
                <Button size="lg">
                  <User className="w-4 h-4 mr-2" /> Edit Profile
                </Button>
              </Link>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
};

export default MemberDashboard;

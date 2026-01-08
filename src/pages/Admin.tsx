import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import BottomNav from '@/components/BottomNav';
import DesktopNav from '@/components/DesktopNav';
import MobileHeader from '@/components/MobileHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Plus, Check, X, Copy, Users, Calendar, Ticket, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';

interface Invite {
  id: string;
  code: string;
  max_uses: number;
  used_count: number;
  expires_at?: string | null;
  created_at: string;
}

interface Application {
  id: string;
  email?: string | null;
  name: string;
  role_title?: string | null;
  instagram_or_linkedin_url?: string | null;
  why_join?: string | null;
  status: string;
  created_at: string;
  user_id?: string | null;
}

interface Event {
  id: string;
  title: string;
  event_date: string;
  event_type?: string | null;
  visibility: string;
}

const Admin = () => {
  const [invites, setInvites] = useState<Invite[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [newInviteCode, setNewInviteCode] = useState('');
  const [newInviteMaxUses, setNewInviteMaxUses] = useState('10');
  const [creatingInvite, setCreatingInvite] = useState(false);
  
  // Event form state
  const [eventTitle, setEventTitle] = useState('');
  const [eventDescription, setEventDescription] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [eventTime, setEventTime] = useState('');
  const [eventVenue, setEventVenue] = useState('');
  const [eventType, setEventType] = useState('');
  const [eventVisibility, setEventVisibility] = useState('public');
  const [creatingEvent, setCreatingEvent] = useState(false);
  
  const { user, isAdmin } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAdmin) {
      navigate('/following');
      return;
    }
    fetchData();
  }, [isAdmin, navigate]);

  const fetchData = async () => {
    try {
      const [invitesRes, applicationsRes, eventsRes] = await Promise.all([
        supabase.from('invites').select('*').order('created_at', { ascending: false }),
        supabase.from('member_applications').select('*').order('created_at', { ascending: false }),
        supabase.from('events').select('id, title, event_date, event_type, visibility').order('event_date', { ascending: false }).limit(20),
      ]);

      if (invitesRes.error) throw invitesRes.error;
      if (applicationsRes.error) throw applicationsRes.error;
      if (eventsRes.error) throw eventsRes.error;

      setInvites(invitesRes.data || []);
      setApplications(applicationsRes.data || []);
      setEvents(eventsRes.data || []);
    } catch (error) {
      console.error('Error fetching admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateInviteCode = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setNewInviteCode(code);
  };

  const createInvite = async () => {
    if (!newInviteCode.trim()) {
      toast({ title: 'Enter a code', variant: 'destructive' });
      return;
    }

    setCreatingInvite(true);
    try {
      const { error } = await supabase
        .from('invites')
        .insert({
          code: newInviteCode.toUpperCase(),
          max_uses: parseInt(newInviteMaxUses) || 10,
          created_by_user_id: user?.id,
        });

      if (error) throw error;

      toast({ title: 'Invite created!' });
      setNewInviteCode('');
      fetchData();
    } catch (error: any) {
      toast({ 
        title: 'Error', 
        description: error.message.includes('duplicate') ? 'Code already exists' : error.message,
        variant: 'destructive' 
      });
    } finally {
      setCreatingInvite(false);
    }
  };

  const handleApplicationAction = async (applicationId: string, action: 'approved' | 'rejected', userId?: string | null) => {
    try {
      // Update application status
      const { error: updateError } = await supabase
        .from('member_applications')
        .update({ 
          status: action,
          reviewed_by_user_id: user?.id 
        })
        .eq('id', applicationId);

      if (updateError) throw updateError;

      // If approved and has user_id, add member role
      if (action === 'approved' && userId) {
        const { error: roleError } = await supabase
          .from('user_roles')
          .insert({ user_id: userId, role: 'member' });

        if (roleError && !roleError.message.includes('duplicate')) {
          throw roleError;
        }
      }

      toast({ title: `Application ${action}` });
      fetchData();
    } catch (error: any) {
      console.error('Error updating application:', error);
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const createEvent = async () => {
    if (!eventTitle || !eventDate) {
      toast({ title: 'Title and date required', variant: 'destructive' });
      return;
    }

    setCreatingEvent(true);
    try {
      const { error } = await supabase
        .from('events')
        .insert({
          title: eventTitle,
          description: eventDescription || null,
          event_date: eventDate,
          event_time: eventTime || null,
          venue_name: eventVenue || null,
          event_type: eventType || null,
          visibility: eventVisibility,
          host_user_id: user?.id,
        });

      if (error) throw error;

      toast({ title: 'Event created!' });
      setEventTitle('');
      setEventDescription('');
      setEventDate('');
      setEventTime('');
      setEventVenue('');
      setEventType('');
      setEventVisibility('public');
      fetchData();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setCreatingEvent(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: 'Copied!' });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const pendingApplications = applications.filter(a => a.status === 'pending');

  return (
    <div className="min-h-screen bg-background">
      <MobileHeader />
      <DesktopNav />
      <BottomNav />
      
      <main className="md:ml-64 pt-16 md:pt-0 pb-20 md:pb-0">
        <div className="container mx-auto px-4 py-6 max-w-6xl">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold">Admin Dashboard</h1>
            <Button variant="outline" size="sm" onClick={fetchData}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <Users className="w-8 h-8 text-primary" />
                  <div>
                    <p className="text-2xl font-bold">{pendingApplications.length}</p>
                    <p className="text-muted-foreground">Pending Applications</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <Ticket className="w-8 h-8 text-primary" />
                  <div>
                    <p className="text-2xl font-bold">{invites.length}</p>
                    <p className="text-muted-foreground">Active Invites</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <Calendar className="w-8 h-8 text-primary" />
                  <div>
                    <p className="text-2xl font-bold">{events.length}</p>
                    <p className="text-muted-foreground">Events</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="applications" className="w-full">
            <TabsList className="mb-6">
              <TabsTrigger value="applications">
                Applications
                {pendingApplications.length > 0 && (
                  <Badge className="ml-2" variant="destructive">{pendingApplications.length}</Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="invites">Invite Codes</TabsTrigger>
              <TabsTrigger value="events">Events</TabsTrigger>
            </TabsList>

            {/* Applications Tab */}
            <TabsContent value="applications">
              <Card>
                <CardHeader>
                  <CardTitle>Member Applications</CardTitle>
                </CardHeader>
                <CardContent>
                  {applications.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Role</TableHead>
                          <TableHead>Social</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {applications.map((app) => (
                          <TableRow key={app.id}>
                            <TableCell className="font-medium">{app.name}</TableCell>
                            <TableCell>{app.role_title || '-'}</TableCell>
                            <TableCell>
                              {app.instagram_or_linkedin_url ? (
                                <a 
                                  href={app.instagram_or_linkedin_url} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-primary hover:underline"
                                >
                                  View
                                </a>
                              ) : '-'}
                            </TableCell>
                            <TableCell>
                              <Badge variant={app.status === 'approved' ? 'default' : app.status === 'rejected' ? 'destructive' : 'secondary'}>
                                {app.status}
                              </Badge>
                            </TableCell>
                            <TableCell>{format(new Date(app.created_at), 'MMM d, yyyy')}</TableCell>
                            <TableCell>
                              {app.status === 'pending' && (
                                <div className="flex gap-2">
                                  <Button 
                                    size="sm" 
                                    variant="outline"
                                    onClick={() => handleApplicationAction(app.id, 'approved', app.user_id)}
                                  >
                                    <Check className="w-4 h-4" />
                                  </Button>
                                  <Button 
                                    size="sm" 
                                    variant="outline"
                                    onClick={() => handleApplicationAction(app.id, 'rejected', app.user_id)}
                                  >
                                    <X className="w-4 h-4" />
                                  </Button>
                                </div>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <p className="text-muted-foreground text-center py-8">No applications yet</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Invites Tab */}
            <TabsContent value="invites">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Invite Codes</CardTitle>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button>
                        <Plus className="w-4 h-4 mr-2" />
                        Create Invite
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Create Invite Code</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label>Code</Label>
                          <div className="flex gap-2">
                            <Input 
                              value={newInviteCode}
                              onChange={(e) => setNewInviteCode(e.target.value.toUpperCase())}
                              placeholder="LOVERBALL24"
                            />
                            <Button variant="outline" onClick={generateInviteCode}>
                              Generate
                            </Button>
                          </div>
                        </div>
                        <div>
                          <Label>Max Uses</Label>
                          <Input 
                            type="number"
                            value={newInviteMaxUses}
                            onChange={(e) => setNewInviteMaxUses(e.target.value)}
                          />
                        </div>
                        <Button 
                          onClick={createInvite} 
                          disabled={creatingInvite}
                          className="w-full"
                        >
                          {creatingInvite ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create'}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </CardHeader>
                <CardContent>
                  {invites.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Code</TableHead>
                          <TableHead>Uses</TableHead>
                          <TableHead>Created</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {invites.map((invite) => (
                          <TableRow key={invite.id}>
                            <TableCell className="font-mono font-bold">{invite.code}</TableCell>
                            <TableCell>{invite.used_count} / {invite.max_uses}</TableCell>
                            <TableCell>{format(new Date(invite.created_at), 'MMM d, yyyy')}</TableCell>
                            <TableCell>
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => copyToClipboard(invite.code)}
                              >
                                <Copy className="w-4 h-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <p className="text-muted-foreground text-center py-8">No invites created yet</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Events Tab */}
            <TabsContent value="events">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Events</CardTitle>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button>
                        <Plus className="w-4 h-4 mr-2" />
                        Create Event
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-lg">
                      <DialogHeader>
                        <DialogTitle>Create Event</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 max-h-[60vh] overflow-y-auto">
                        <div>
                          <Label>Title *</Label>
                          <Input 
                            value={eventTitle}
                            onChange={(e) => setEventTitle(e.target.value)}
                            placeholder="WNBA Watch Party"
                          />
                        </div>
                        <div>
                          <Label>Description</Label>
                          <Textarea 
                            value={eventDescription}
                            onChange={(e) => setEventDescription(e.target.value)}
                            placeholder="Join us for..."
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label>Date *</Label>
                            <Input 
                              type="date"
                              value={eventDate}
                              onChange={(e) => setEventDate(e.target.value)}
                            />
                          </div>
                          <div>
                            <Label>Time</Label>
                            <Input 
                              type="time"
                              value={eventTime}
                              onChange={(e) => setEventTime(e.target.value)}
                            />
                          </div>
                        </div>
                        <div>
                          <Label>Venue</Label>
                          <Input 
                            value={eventVenue}
                            onChange={(e) => setEventVenue(e.target.value)}
                            placeholder="The Parlor, West Hollywood"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label>Type</Label>
                            <Select value={eventType} onValueChange={setEventType}>
                              <SelectTrigger>
                                <SelectValue placeholder="Select type" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="watch_party">Watch Party</SelectItem>
                                <SelectItem value="brunch">Brunch</SelectItem>
                                <SelectItem value="panel">Panel</SelectItem>
                                <SelectItem value="networking">Networking</SelectItem>
                                <SelectItem value="party">Party</SelectItem>
                                <SelectItem value="game">Game Day</SelectItem>
                                <SelectItem value="other">Other</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label>Visibility</Label>
                            <Select value={eventVisibility} onValueChange={setEventVisibility}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="public">Public</SelectItem>
                                <SelectItem value="members_only">Members Only</SelectItem>
                                <SelectItem value="invite_only">Invite Only</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <Button 
                          onClick={createEvent} 
                          disabled={creatingEvent}
                          className="w-full"
                        >
                          {creatingEvent ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create Event'}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </CardHeader>
                <CardContent>
                  {events.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Title</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Visibility</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {events.map((event) => (
                          <TableRow key={event.id}>
                            <TableCell className="font-medium">{event.title}</TableCell>
                            <TableCell>{format(new Date(event.event_date), 'MMM d, yyyy')}</TableCell>
                            <TableCell className="capitalize">{event.event_type?.replace('_', ' ') || '-'}</TableCell>
                            <TableCell>
                              <Badge variant={event.visibility === 'public' ? 'default' : 'secondary'}>
                                {event.visibility.replace('_', ' ')}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <p className="text-muted-foreground text-center py-8">No events created yet</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
};

export default Admin;

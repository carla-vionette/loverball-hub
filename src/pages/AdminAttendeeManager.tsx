import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  ArrowLeft, Loader2, Download, UserPlus, Phone, Mail, Users, 
  CheckCircle, Clock, XCircle, HelpCircle, Search, RefreshCw,
  ArrowUpFromLine, Pencil
} from 'lucide-react';
import { format } from 'date-fns';

interface Event {
  id: string;
  title: string;
  event_date: string;
  capacity: number | null;
  allow_plus_ones: boolean | null;
}

interface Attendee {
  id: string;
  status: string;
  user_id: string;
  plus_ones: number | null;
  name: string | null;
  phone: string | null;
  created_at: string;
  profile: {
    name: string;
    phone_number: string | null;
    city: string | null;
    profile_photo_url: string | null;
    instagram_url: string | null;
  } | null;
}

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  attending: { label: 'Attending', color: 'bg-green-500', icon: CheckCircle },
  yes: { label: 'Attending', color: 'bg-green-500', icon: CheckCircle },
  confirmed: { label: 'Confirmed', color: 'bg-green-500', icon: CheckCircle },
  maybe: { label: 'Maybe', color: 'bg-yellow-500', icon: HelpCircle },
  no: { label: 'Not Going', color: 'bg-red-500', icon: XCircle },
  declined: { label: 'Declined', color: 'bg-red-500', icon: XCircle },
  waitlist: { label: 'Waitlist', color: 'bg-orange-500', icon: Clock },
  requested: { label: 'Requested', color: 'bg-blue-500', icon: Clock },
};

const AdminAttendeeManager = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const { toast } = useToast();

  const [event, setEvent] = useState<Event | null>(null);
  const [attendees, setAttendees] = useState<Attendee[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [addingAttendee, setAddingAttendee] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  
  // New attendee form
  const [newAttendeeName, setNewAttendeeName] = useState('');
  const [newAttendeePhone, setNewAttendeePhone] = useState('');
  const [newAttendeePlusOnes, setNewAttendeePlusOnes] = useState('0');
  const [newAttendeeStatus, setNewAttendeeStatus] = useState('attending');

  useEffect(() => {
    if (!isAdmin) {
      navigate('/');
      return;
    }
    if (id) {
      fetchData();
    }
  }, [isAdmin, id, navigate]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch event
      const { data: eventData, error: eventError } = await supabase
        .from('events')
        .select('id, title, event_date, capacity, allow_plus_ones')
        .eq('id', id)
        .single();

      if (eventError) throw eventError;
      setEvent(eventData);

      // Fetch attendees with profiles
      await fetchAttendees();
    } catch (error) {
      toast({ title: 'Error loading event', variant: 'destructive' });
      navigate('/admin');
    } finally {
      setLoading(false);
    }
  };

  const fetchAttendees = async () => {
    try {
      const { data, error } = await supabase
        .from('event_rsvps')
        .select(`
          id,
          status,
          user_id,
          plus_ones,
          name,
          phone,
          created_at,
          profile:profiles (
            name,
            phone_number,
            city,
            profile_photo_url,
            instagram_url
          )
        `)
        .eq('event_id', id)
        .order('created_at', { ascending: true });

      if (error) throw error;

      const transformedData = (data || []).map(item => ({
        id: item.id,
        status: item.status,
        user_id: item.user_id,
        plus_ones: item.plus_ones,
        name: item.name,
        phone: item.phone,
        created_at: item.created_at,
        profile: item.profile ? {
          name: (item.profile as any).name,
          phone_number: (item.profile as any).phone_number,
          city: (item.profile as any).city,
          profile_photo_url: (item.profile as any).profile_photo_url,
          instagram_url: (item.profile as any).instagram_url,
        } : null
      }));

      setAttendees(transformedData);
    } catch (error) {
      // Silently handle attendee fetch errors
    }
  };

  const sendStatusNotification = async (userId: string, eventId: string, newStatus: string, previousStatus?: string, isPromotion?: boolean) => {
    try {
      const { error } = await supabase.functions.invoke('notify-attendee-status', {
        body: { userId, eventId, newStatus, previousStatus, isPromotion }
      });
      
      if (error) {
        // Notification error - non-critical
      }
    } catch (err) {
      // Failed to send notification - non-critical
    }
  };

  const updateAttendeeStatus = async (attendeeId: string, newStatus: string, sendNotification = true) => {
    const attendee = attendees.find(a => a.id === attendeeId);
    const previousStatus = attendee?.status;
    
    try {
      const { error } = await supabase
        .from('event_rsvps')
        .update({ status: newStatus })
        .eq('id', attendeeId);

      if (error) throw error;

      setAttendees(prev => prev.map(a => 
        a.id === attendeeId ? { ...a, status: newStatus } : a
      ));

      // Send notification if user_id is a real user (not a manual attendee placeholder)
      if (sendNotification && attendee && attendee.profile) {
        sendStatusNotification(attendee.user_id, id!, newStatus, previousStatus);
        toast({ title: 'Status updated & notification sent' });
      } else {
        toast({ title: 'Status updated' });
      }
    } catch (error: any) {
      toast({ title: 'Error updating status', variant: 'destructive' });
    }
  };

  const addManualAttendee = async () => {
    if (!newAttendeeName.trim()) {
      toast({ title: 'Name is required', variant: 'destructive' });
      return;
    }

    setAddingAttendee(true);
    try {
      // Create a placeholder user_id for manual attendees
      const placeholderUserId = crypto.randomUUID();

      const { error } = await supabase
        .from('event_rsvps')
        .insert({
          event_id: id,
          user_id: placeholderUserId,
          status: newAttendeeStatus,
          name: newAttendeeName.trim(),
          phone: newAttendeePhone.trim() || null,
          plus_ones: parseInt(newAttendeePlusOnes) || 0,
        });

      if (error) throw error;

      toast({ title: 'Attendee added!' });
      setAddDialogOpen(false);
      setNewAttendeeName('');
      setNewAttendeePhone('');
      setNewAttendeePlusOnes('0');
      setNewAttendeeStatus('attending');
      fetchAttendees();
    } catch (error: any) {
      console.error('Error adding attendee:', error);
      toast({ title: 'Error adding attendee', description: error.message, variant: 'destructive' });
    } finally {
      setAddingAttendee(false);
    }
  };

  const promoteFromWaitlist = async (attendeeId: string) => {
    const attendee = attendees.find(a => a.id === attendeeId);
    
    try {
      const { error } = await supabase
        .from('event_rsvps')
        .update({ status: 'attending' })
        .eq('id', attendeeId);

      if (error) throw error;

      setAttendees(prev => prev.map(a => 
        a.id === attendeeId ? { ...a, status: 'attending' } : a
      ));

      // Send promotion notification for real users
      if (attendee && attendee.profile) {
        sendStatusNotification(attendee.user_id, id!, 'attending', 'waitlist', true);
        toast({ title: 'Promoted from waitlist!', description: 'Notification sent to attendee.' });
      } else {
        toast({ title: 'Promoted from waitlist!' });
      }
    } catch (error: any) {
      console.error('Error promoting attendee:', error);
      toast({ title: 'Error promoting attendee', variant: 'destructive' });
    }
  };

  const exportCSV = () => {
    if (attendees.length === 0) return;

    const headers = ['Name', 'Status', 'Plus Ones', 'Phone', 'City', 'Instagram', 'RSVP Date'];
    const rows = attendees.map(a => [
      a.name || a.profile?.name || 'Unknown',
      statusConfig[a.status]?.label || a.status,
      a.plus_ones || 0,
      a.phone || a.profile?.phone_number || '',
      a.profile?.city || '',
      a.profile?.instagram_url || '',
      format(new Date(a.created_at), 'yyyy-MM-dd HH:mm')
    ]);

    const csvContent = [headers, ...rows].map(row => 
      row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')
    ).join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${event?.title.replace(/[^a-z0-9]/gi, '_')}_attendees_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
    URL.revokeObjectURL(url);

    toast({ title: 'CSV exported!' });
  };

  // Filter attendees
  const filteredAttendees = attendees.filter(a => {
    const name = a.name || a.profile?.name || '';
    const matchesSearch = name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (a.phone || a.profile?.phone_number || '').includes(searchQuery);
    const matchesStatus = statusFilter === 'all' || a.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Calculate stats
  const stats = {
    total: attendees.length,
    attending: attendees.filter(a => ['attending', 'yes', 'confirmed'].includes(a.status)).length,
    maybe: attendees.filter(a => a.status === 'maybe').length,
    waitlist: attendees.filter(a => a.status === 'waitlist').length,
    declined: attendees.filter(a => ['no', 'declined'].includes(a.status)).length,
    totalPlusOnes: attendees.reduce((sum, a) => sum + (a.plus_ones || 0), 0),
  };

  const totalHeadcount = stats.attending + stats.totalPlusOnes;

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => navigate('/admin')}
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-lg font-semibold">Attendee Manager</h1>
              <p className="text-xs text-muted-foreground">{event?.title}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={fetchAttendees}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
            <Button variant="outline" size="sm" onClick={exportCSV} disabled={attendees.length === 0}>
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
            <Button 
              size="sm" 
              onClick={() => navigate(`/admin/events/${id}/edit`)}
            >
              <Pencil className="w-4 h-4 mr-2" />
              Edit Event
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 md:p-6 space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
          <Card>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-primary/10">
                  <Users className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.total}</p>
                  <p className="text-xs text-muted-foreground">Total RSVPs</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-green-500/10">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.attending}</p>
                  <p className="text-xs text-muted-foreground">Attending</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-yellow-500/10">
                  <HelpCircle className="w-5 h-5 text-yellow-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.maybe}</p>
                  <p className="text-xs text-muted-foreground">Maybe</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-orange-500/10">
                  <Clock className="w-5 h-5 text-orange-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.waitlist}</p>
                  <p className="text-xs text-muted-foreground">Waitlist</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-blue-500/10">
                  <UserPlus className="w-5 h-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.totalPlusOnes}</p>
                  <p className="text-xs text-muted-foreground">Plus Ones</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-primary/20">
                  <Users className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{totalHeadcount}</p>
                  <p className="text-xs text-muted-foreground">
                    Total Headcount
                    {event?.capacity && (
                      <span className="text-primary ml-1">/ {event.capacity}</span>
                    )}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Capacity Warning */}
        {event?.capacity && totalHeadcount >= event.capacity && (
          <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-4 flex items-center gap-3">
            <Clock className="w-5 h-5 text-orange-500" />
            <p className="text-sm text-orange-700 dark:text-orange-300">
              <strong>At capacity!</strong> New RSVPs will be added to the waitlist.
            </p>
          </div>
        )}

        {/* Filters & Actions */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
              <div className="flex flex-1 gap-3 w-full md:w-auto">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by name or phone..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Filter status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="attending">Attending</SelectItem>
                    <SelectItem value="maybe">Maybe</SelectItem>
                    <SelectItem value="waitlist">Waitlist</SelectItem>
                    <SelectItem value="no">Declined</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <UserPlus className="w-4 h-4 mr-2" />
                    Add Attendee
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add Attendee Manually</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="name">Name *</Label>
                      <Input
                        id="name"
                        value={newAttendeeName}
                        onChange={(e) => setNewAttendeeName(e.target.value)}
                        placeholder="John Doe"
                        className="mt-1.5"
                      />
                    </div>
                    <div>
                      <Label htmlFor="phone">Phone</Label>
                      <Input
                        id="phone"
                        value={newAttendeePhone}
                        onChange={(e) => setNewAttendeePhone(e.target.value)}
                        placeholder="+1 (555) 123-4567"
                        className="mt-1.5"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="status">Status</Label>
                        <Select value={newAttendeeStatus} onValueChange={setNewAttendeeStatus}>
                          <SelectTrigger className="mt-1.5">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="attending">Attending</SelectItem>
                            <SelectItem value="maybe">Maybe</SelectItem>
                            <SelectItem value="waitlist">Waitlist</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="plus_ones">Plus Ones</Label>
                        <Input
                          id="plus_ones"
                          type="number"
                          min="0"
                          max="10"
                          value={newAttendeePlusOnes}
                          onChange={(e) => setNewAttendeePlusOnes(e.target.value)}
                          className="mt-1.5"
                        />
                      </div>
                    </div>
                    <Button 
                      onClick={addManualAttendee} 
                      disabled={addingAttendee}
                      className="w-full"
                    >
                      {addingAttendee ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <UserPlus className="w-4 h-4 mr-2" />
                      )}
                      Add Attendee
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CardContent>
        </Card>

        {/* Attendees Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Attendees ({filteredAttendees.length})</span>
              {stats.waitlist > 0 && (
                <Badge variant="outline" className="bg-orange-500/10 text-orange-600 border-orange-500/20">
                  {stats.waitlist} on waitlist
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {filteredAttendees.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Plus Ones</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>City</TableHead>
                      <TableHead>RSVP Date</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAttendees.map((attendee) => {
                      const config = statusConfig[attendee.status] || { 
                        label: attendee.status, 
                        color: 'bg-gray-500', 
                        icon: HelpCircle 
                      };
                      const StatusIcon = config.icon;
                      const displayName = attendee.name || attendee.profile?.name || 'Unknown';
                      const displayPhone = attendee.phone || attendee.profile?.phone_number;

                      return (
                        <TableRow key={attendee.id}>
                          <TableCell>
                            <div className="font-medium">{displayName}</div>
                            {attendee.profile?.instagram_url && (
                              <a 
                                href={attendee.profile.instagram_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-primary hover:underline"
                              >
                                Instagram
                              </a>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <StatusIcon className={`w-4 h-4 ${
                                config.color === 'bg-green-500' ? 'text-green-500' :
                                config.color === 'bg-yellow-500' ? 'text-yellow-500' :
                                config.color === 'bg-orange-500' ? 'text-orange-500' :
                                config.color === 'bg-red-500' ? 'text-red-500' :
                                config.color === 'bg-blue-500' ? 'text-blue-500' :
                                'text-gray-500'
                              }`} />
                              <span className="text-sm">{config.label}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            {attendee.plus_ones || 0}
                          </TableCell>
                          <TableCell>
                            {displayPhone ? (
                              <a 
                                href={`tel:${displayPhone}`}
                                className="flex items-center gap-1 text-primary hover:underline"
                              >
                                <Phone className="w-3 h-3" />
                                {displayPhone}
                              </a>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {attendee.profile?.city || '-'}
                          </TableCell>
                          <TableCell>
                            <span className="text-sm text-muted-foreground">
                              {format(new Date(attendee.created_at), 'MMM d, h:mm a')}
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {attendee.status === 'waitlist' && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => promoteFromWaitlist(attendee.id)}
                                  className="text-green-600 border-green-500/30 hover:bg-green-500/10"
                                >
                                  <ArrowUpFromLine className="w-4 h-4 mr-1" />
                                  Promote
                                </Button>
                              )}
                              <Select 
                                value={attendee.status} 
                                onValueChange={(value) => updateAttendeeStatus(attendee.id, value)}
                              >
                                <SelectTrigger className="w-32 h-8 text-xs">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="attending">Attending</SelectItem>
                                  <SelectItem value="maybe">Maybe</SelectItem>
                                  <SelectItem value="waitlist">Waitlist</SelectItem>
                                  <SelectItem value="no">Declined</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium">No attendees yet</p>
                <p className="text-sm">RSVPs will appear here as guests respond</p>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default AdminAttendeeManager;

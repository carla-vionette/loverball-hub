import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminSidebar from '@/components/admin/AdminSidebar';
import KpiCard from '@/components/admin/KpiCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Plus, Check, X, Copy, Users, Calendar, RefreshCw, Phone, Instagram, Linkedin, Globe, Download, Pencil } from 'lucide-react';
import { format } from 'date-fns';


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

interface MemberProfile {
  id: string;
  name: string;
  bio: string | null;
  city: string | null;
  neighborhood: string | null;
  phone_number: string | null;
  instagram_url: string | null;
  linkedin_url: string | null;
  website_url: string | null;
  tiktok_url: string | null;
  primary_role: string | null;
  industries: string[] | null;
  favorite_la_teams: string[] | null;
  looking_for_tags: string[] | null;
  favorite_sports: string[] | null;
  age_range: string | null;
  pronouns: string | null;
  profile_photo_url: string | null;
  created_at: string;
}

const Admin = () => {
  const [applications, setApplications] = useState<Application[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [members, setMembers] = useState<MemberProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [newInviteCode, setNewInviteCode] = useState('');
  const [newInviteMaxUses, setNewInviteMaxUses] = useState('10');
  const [creatingInvite, setCreatingInvite] = useState(false);
  const [activeTab, setActiveTab] = useState('members');

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
      fetchMembers();
    } catch (error) {
      console.error('Error fetching admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMembers = async () => {
    setLoadingMembers(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setMembers(data || []);
    } catch (error) {
      console.error('Error fetching members:', error);
    } finally {
      setLoadingMembers(false);
    }
  };

  const exportMembersCSV = () => {
    if (members.length === 0) return;
    const headers = ['Name', 'Pronouns', 'Age Range', 'City', 'Neighborhood', 'Phone', 'Instagram', 'LinkedIn', 'Website', 'Role', 'Industries', 'Looking For', 'Favorite Teams', 'Favorite Sports', 'Joined'];
    const rows = members.map(m => [
      m.name, m.pronouns || '', m.age_range || '', m.city || '', m.neighborhood || '',
      m.phone_number || '', m.instagram_url || '', m.linkedin_url || '', m.website_url || '',
      m.primary_role || '', (m.industries || []).join('; '), (m.looking_for_tags || []).join('; '),
      (m.favorite_la_teams || []).join('; '), (m.favorite_sports || []).join('; '),
      format(new Date(m.created_at), 'yyyy-MM-dd')
    ]);
    const csvContent = [headers, ...rows].map(row =>
      row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')
    ).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `loverball_members_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast({ title: 'Members CSV downloaded!' });
  };

  const generateInviteCode = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 8; i++) code += chars.charAt(Math.floor(Math.random() * chars.length));
    setNewInviteCode(code);
  };

  const createInvite = async () => {
    if (!newInviteCode.trim()) { toast({ title: 'Enter a code', variant: 'destructive' }); return; }
    setCreatingInvite(true);
    try {
      const { error } = await supabase.from('invites').insert({
        code: newInviteCode.toUpperCase(),
        max_uses: parseInt(newInviteMaxUses) || 10,
        created_by_user_id: user?.id,
      });
      if (error) throw error;
      toast({ title: 'Invite created!' });
      setNewInviteCode('');
      fetchData();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message.includes('duplicate') ? 'Code already exists' : error.message, variant: 'destructive' });
    } finally { setCreatingInvite(false); }
  };

  const handleApplicationAction = async (applicationId: string, action: 'approved' | 'rejected', userId?: string | null) => {
    try {
      const { error: updateError } = await supabase.from('member_applications')
        .update({ status: action, reviewed_by_user_id: user?.id }).eq('id', applicationId);
      if (updateError) throw updateError;
      if (action === 'approved' && userId) {
        const { error: roleError } = await supabase.from('user_roles').insert({ user_id: userId, role: 'member' });
        if (roleError && !roleError.message.includes('duplicate')) throw roleError;
      }
      toast({ title: `Application ${action}` });
      fetchData();
    } catch (error: any) {
      console.error('Error updating application:', error);
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: 'Copied!' });
  };

  const pendingApplications = applications.filter(a => a.status === 'pending');

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar — hidden on mobile */}
      <div className="hidden md:flex">
        <AdminSidebar activeTab={activeTab} onTabChange={setActiveTab} />
      </div>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto p-6 md:p-8">
        {/* Mobile tab bar */}
        <div className="flex md:hidden gap-2 overflow-x-auto pb-4 mb-4 scrollbar-hide">
          {['members', 'applications', 'invites', 'events'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-full text-sm font-semibold capitalize whitespace-nowrap transition-colors
                ${activeTab === tab ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'}`}
            >
              {tab}
              {tab === 'applications' && pendingApplications.length > 0 && (
                <span className="ml-1.5 bg-destructive text-destructive-foreground text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                  {pendingApplications.length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Header row */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="font-display text-3xl md:text-4xl font-black uppercase tracking-tight">
            {activeTab === 'members' && 'Members'}
            {activeTab === 'applications' && 'Applications'}
            {activeTab === 'invites' && 'Invite Codes'}
            {activeTab === 'events' && 'Events'}
          </h1>
          <Button variant="outline" size="sm" onClick={fetchData}>
            <RefreshCw className="w-4 h-4 mr-2" /> Refresh
          </Button>
        </div>

        {/* KPI row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <KpiCard label="Members" value={members.length} icon={Users} />
          <KpiCard label="Pending" value={pendingApplications.length} icon={Users} />
          <KpiCard label="Invites" value={invites.length} icon={Ticket} />
          <KpiCard label="Events" value={events.length} icon={Calendar} />
        </div>

        {/* ── MEMBERS TAB ── */}
        {activeTab === 'members' && (
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-xl font-bold uppercase">All Members ({members.length})</h2>
              <Button variant="outline" onClick={exportMembersCSV} disabled={members.length === 0}>
                <Download className="w-4 h-4 mr-2" /> Export CSV
              </Button>
            </div>
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              {loadingMembers ? (
                <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin" /></div>
              ) : members.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-secondary">
                        <TableHead className="text-xs uppercase tracking-widest text-muted-foreground">Photo</TableHead>
                        <TableHead className="text-xs uppercase tracking-widest text-muted-foreground">Name</TableHead>
                        <TableHead className="text-xs uppercase tracking-widest text-muted-foreground">Location</TableHead>
                        <TableHead className="text-xs uppercase tracking-widest text-muted-foreground">Phone</TableHead>
                        <TableHead className="text-xs uppercase tracking-widest text-muted-foreground">Social</TableHead>
                        <TableHead className="text-xs uppercase tracking-widest text-muted-foreground">Role</TableHead>
                        <TableHead className="text-xs uppercase tracking-widest text-muted-foreground">Industries</TableHead>
                        <TableHead className="text-xs uppercase tracking-widest text-muted-foreground">Favorite Teams</TableHead>
                        <TableHead className="text-xs uppercase tracking-widest text-muted-foreground">Joined</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {members.map((member) => (
                        <TableRow key={member.id} className="hover:bg-secondary/50 transition-colors">
                          <TableCell>
                            {member.profile_photo_url ? (
                              <img src={member.profile_photo_url} alt={member.name} className="w-10 h-10 rounded-full object-cover" />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium text-sm">
                                {member.name.charAt(0).toUpperCase()}
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            <p className="font-semibold text-sm">{member.name}</p>
                            {member.pronouns && <p className="text-xs text-muted-foreground">{member.pronouns}</p>}
                            {member.age_range && <p className="text-xs text-muted-foreground">{member.age_range}</p>}
                          </TableCell>
                          <TableCell className="text-sm">
                            {member.city && <p>{member.city}</p>}
                            {member.neighborhood && <p className="text-muted-foreground">{member.neighborhood}</p>}
                          </TableCell>
                          <TableCell>
                            {member.phone_number ? (
                              <a href={`tel:${member.phone_number}`} className="flex items-center gap-1 text-primary hover:underline text-sm">
                                <Phone className="w-3 h-3" /> {member.phone_number}
                              </a>
                            ) : <span className="text-muted-foreground">-</span>}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              {member.instagram_url && <a href={member.instagram_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:text-primary/80"><Instagram className="w-4 h-4" /></a>}
                              {member.linkedin_url && <a href={member.linkedin_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:text-primary/80"><Linkedin className="w-4 h-4" /></a>}
                              {member.website_url && <a href={member.website_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:text-primary/80"><Globe className="w-4 h-4" /></a>}
                              {!member.instagram_url && !member.linkedin_url && !member.website_url && <span className="text-muted-foreground">-</span>}
                            </div>
                          </TableCell>
                          <TableCell className="text-sm">{member.primary_role || '-'}</TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1 max-w-[200px]">
                              {member.industries?.slice(0, 2).map((ind, i) => (
                                <Badge key={i} variant="secondary" className="text-xs">{ind}</Badge>
                              ))}
                              {(member.industries?.length || 0) > 2 && <Badge variant="outline" className="text-xs">+{member.industries!.length - 2}</Badge>}
                              {!member.industries?.length && <span className="text-muted-foreground">-</span>}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1 max-w-[200px]">
                              {member.favorite_la_teams?.slice(0, 2).map((team, i) => (
                                <Badge key={i} variant="secondary" className="text-xs">{team}</Badge>
                              ))}
                              {(member.favorite_la_teams?.length || 0) > 2 && <Badge variant="outline" className="text-xs">+{member.favorite_la_teams!.length - 2}</Badge>}
                              {!member.favorite_la_teams?.length && <span className="text-muted-foreground">-</span>}
                            </div>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">{format(new Date(member.created_at), 'MMM d, yyyy')}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-12">No members yet</p>
              )}
            </div>
          </section>
        )}

        {/* ── APPLICATIONS TAB ── */}
        {activeTab === 'applications' && (
          <section>
            <h2 className="font-display text-xl font-bold uppercase mb-4">Member Applications</h2>
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              {applications.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow className="bg-secondary">
                      <TableHead className="text-xs uppercase tracking-widest text-muted-foreground">Name</TableHead>
                      <TableHead className="text-xs uppercase tracking-widest text-muted-foreground">Role</TableHead>
                      <TableHead className="text-xs uppercase tracking-widest text-muted-foreground">Social</TableHead>
                      <TableHead className="text-xs uppercase tracking-widest text-muted-foreground">Status</TableHead>
                      <TableHead className="text-xs uppercase tracking-widest text-muted-foreground">Date</TableHead>
                      <TableHead className="text-xs uppercase tracking-widest text-muted-foreground">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {applications.map((app) => (
                      <TableRow key={app.id} className="hover:bg-secondary/50 transition-colors">
                        <TableCell className="font-semibold">{app.name}</TableCell>
                        <TableCell>{app.role_title || '-'}</TableCell>
                        <TableCell>
                          {app.instagram_or_linkedin_url ? (
                            <a href={app.instagram_or_linkedin_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline text-sm">View</a>
                          ) : '-'}
                        </TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold uppercase
                            ${app.status === 'approved' ? 'bg-success/10 text-success' : ''}
                            ${app.status === 'rejected' ? 'bg-destructive/10 text-destructive' : ''}
                            ${app.status === 'pending' ? 'bg-secondary text-muted-foreground' : ''}
                          `}>
                            {app.status}
                          </span>
                        </TableCell>
                        <TableCell className="text-sm">{format(new Date(app.created_at), 'MMM d, yyyy')}</TableCell>
                        <TableCell>
                          {app.status === 'pending' && (
                            <div className="flex gap-2">
                              <Button size="sm" variant="outline" onClick={() => handleApplicationAction(app.id, 'approved', app.user_id)}>
                                <Check className="w-4 h-4" />
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => handleApplicationAction(app.id, 'rejected', app.user_id)}>
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
                <p className="text-muted-foreground text-center py-12">No applications yet</p>
              )}
            </div>
          </section>
        )}

        {/* ── INVITES TAB ── */}
        {activeTab === 'invites' && (
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-xl font-bold uppercase">Invite Codes</h2>
              <Dialog>
                <DialogTrigger asChild>
                  <Button><Plus className="w-4 h-4 mr-2" /> Create Invite</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>Create Invite Code</DialogTitle></DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label>Code</Label>
                      <div className="flex gap-2">
                        <Input value={newInviteCode} onChange={(e) => setNewInviteCode(e.target.value.toUpperCase())} placeholder="LOVERBALL24" />
                        <Button variant="outline" onClick={generateInviteCode}>Generate</Button>
                      </div>
                    </div>
                    <div>
                      <Label>Max Uses</Label>
                      <Input type="number" value={newInviteMaxUses} onChange={(e) => setNewInviteMaxUses(e.target.value)} />
                    </div>
                    <Button onClick={createInvite} disabled={creatingInvite} className="w-full">
                      {creatingInvite ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create'}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              {invites.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow className="bg-secondary">
                      <TableHead className="text-xs uppercase tracking-widest text-muted-foreground">Code</TableHead>
                      <TableHead className="text-xs uppercase tracking-widest text-muted-foreground">Uses</TableHead>
                      <TableHead className="text-xs uppercase tracking-widest text-muted-foreground">Created</TableHead>
                      <TableHead className="text-xs uppercase tracking-widest text-muted-foreground">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invites.map((invite) => (
                      <TableRow key={invite.id} className="hover:bg-secondary/50 transition-colors">
                        <TableCell className="font-mono font-bold">{invite.code}</TableCell>
                        <TableCell>{invite.used_count} / {invite.max_uses}</TableCell>
                        <TableCell className="text-sm">{format(new Date(invite.created_at), 'MMM d, yyyy')}</TableCell>
                        <TableCell>
                          <Button size="sm" variant="outline" onClick={() => copyToClipboard(invite.code)}>
                            <Copy className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-muted-foreground text-center py-12">No invites created yet</p>
              )}
            </div>
          </section>
        )}

        {/* ── EVENTS TAB ── */}
        {activeTab === 'events' && (
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-xl font-bold uppercase">Events</h2>
              <Button onClick={() => navigate('/admin/events/new/edit')}>
                <Plus className="w-4 h-4 mr-2" /> Create Event
              </Button>
            </div>
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              {events.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow className="bg-secondary">
                      <TableHead className="text-xs uppercase tracking-widest text-muted-foreground">Title</TableHead>
                      <TableHead className="text-xs uppercase tracking-widest text-muted-foreground">Date</TableHead>
                      <TableHead className="text-xs uppercase tracking-widest text-muted-foreground">Type</TableHead>
                      <TableHead className="text-xs uppercase tracking-widest text-muted-foreground">Visibility</TableHead>
                      <TableHead className="text-xs uppercase tracking-widest text-muted-foreground">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {events.map((event) => (
                      <TableRow key={event.id} className="hover:bg-secondary/50 transition-colors">
                        <TableCell className="font-semibold">{event.title}</TableCell>
                        <TableCell className="text-sm">{format(new Date(event.event_date), 'MMM d, yyyy')}</TableCell>
                        <TableCell className="capitalize text-sm">{event.event_type?.replace('_', ' ') || '-'}</TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold uppercase
                            ${event.visibility === 'public' ? 'bg-success/10 text-success' : 'bg-secondary text-muted-foreground'}
                          `}>
                            {event.visibility.replace('_', ' ')}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button size="sm" variant="outline" onClick={() => navigate(`/admin/events/${event.id}/edit`)}>
                              <Pencil className="w-4 h-4 mr-1" /> Edit
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => navigate(`/admin/events/${event.id}/attendees`)}>
                              <Users className="w-4 h-4 mr-1" /> RSVPs
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-muted-foreground text-center py-12">No events created yet</p>
              )}
            </div>
          </section>
        )}
      </main>
    </div>
  );
};

export default Admin;

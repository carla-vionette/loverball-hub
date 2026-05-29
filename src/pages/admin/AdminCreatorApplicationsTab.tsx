import { useState, useMemo, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { useToast } from '@/hooks/use-toast';
import { Check, X, Search, ExternalLink, Instagram } from 'lucide-react';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { logAdminAction } from '@/services/adminActivityService';

interface CreatorApp {
  id: string;
  applicant_user_id: string;
  account_type: string | null;
  name: string | null;
  bio: string | null;
  sport: string | null;
  league: string | null;
  city: string | null;
  desired_channel_name: string;
  content_focus: string;
  instagram_url: string | null;
  instagram_followers: number | null;
  tiktok_url: string | null;
  tiktok_followers: number | null;
  youtube_url: string | null;
  youtube_followers: number | null;
  twitter_url: string | null;
  twitter_followers: number | null;
  logo_url: string | null;
  banner_url: string | null;
  status: string;
  submitted_at: string | null;
  created_at: string;
  example_content_links: string | null;
}

interface Props {
  onRefresh: () => void;
}

const statusColors: Record<string, string> = {
  submitted: 'bg-white/15 text-white',
  pending: 'bg-white/15 text-white',
  approved: 'bg-green-500/15 text-green-600',
  rejected: 'bg-destructive/15 text-destructive',
};

const AdminCreatorApplicationsTab = ({ onRefresh }: Props) => {
  const { toast } = useToast();
  const [apps, setApps] = useState<CreatorApp[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'submitted' | 'approved' | 'rejected'>('all');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [drawerApp, setDrawerApp] = useState<CreatorApp | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { loadApps(); }, []);

  async function loadApps() {
    setLoading(true);
    const { data } = await supabase
      .from('creator_applications')
      .select('*')
      .order('created_at', { ascending: false });
    setApps((data || []) as CreatorApp[]);
    setLoading(false);
  }

  const filtered = useMemo(() => {
    let result = apps;
    if (filter !== 'all') {
      result = result.filter(a => a.status === filter || (filter === 'submitted' && a.status === 'pending'));
    }
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(a =>
        (a.name || '').toLowerCase().includes(q) ||
        a.desired_channel_name.toLowerCase().includes(q)
      );
    }
    return result;
  }, [apps, filter, search]);

  const toggleSelect = (id: string) => {
    const next = new Set(selected);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelected(next);
  };

  const toggleAll = () => {
    if (selected.size === filtered.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filtered.map(a => a.id)));
    }
  };

  async function handleAction(appId: string, action: 'approved' | 'rejected') {
    setActionLoading(true);
    try {
      await supabase.from('creator_applications').update({ status: action, reviewed_at: new Date().toISOString() }).eq('id', appId);
      await logAdminAction(`creator_application_${action}`, 'creator_application', appId);
      toast({ title: `Application ${action}` });
      await loadApps();
      if (drawerApp?.id === appId) setDrawerApp(prev => prev ? { ...prev, status: action } : null);
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    } finally {
      setActionLoading(false);
    }
  }

  async function bulkAction(action: 'approved' | 'rejected') {
    setActionLoading(true);
    try {
      for (const id of selected) {
        await supabase.from('creator_applications').update({ status: action, reviewed_at: new Date().toISOString() }).eq('id', id);
        await logAdminAction(`creator_application_${action}`, 'creator_application', id);
      }
      toast({ title: `${selected.size} applications ${action}` });
      setSelected(new Set());
      await loadApps();
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    } finally {
      setActionLoading(false);
    }
  }

  const pendingCount = apps.filter(a => a.status === 'submitted' || a.status === 'pending').length;

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display text-xl font-bold uppercase">
          Creator Applications
          {pendingCount > 0 && (
            <span className="ml-2 text-sm bg-white/15 text-white px-2 py-0.5 rounded-full font-semibold">
              {pendingCount} pending
            </span>
          )}
        </h2>
      </div>

      {/* Filter tabs + search */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="flex gap-1">
          {(['all', 'submitted', 'approved', 'rejected'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-colors
                ${filter === f ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground hover:text-foreground'}`}
            >
              {f === 'submitted' ? 'Pending' : f}
            </button>
          ))}
        </div>
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name..."
            className="pl-9 h-9"
          />
        </div>
      </div>

      {/* Bulk action bar */}
      {selected.size > 0 && (
        <div className="flex items-center gap-3 bg-primary/5 border border-primary/20 rounded-xl px-4 py-3 mb-4">
          <span className="text-sm font-semibold">{selected.size} selected</span>
          <Button size="sm" onClick={() => bulkAction('approved')} disabled={actionLoading}>
            <Check className="w-4 h-4 mr-1" /> Approve All
          </Button>
          <Button size="sm" variant="outline" onClick={() => bulkAction('rejected')} disabled={actionLoading}>
            <X className="w-4 h-4 mr-1" /> Reject Selected
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setSelected(new Set())}>Clear</Button>
        </div>
      )}

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        {loading ? (
          <p className="text-center text-muted-foreground py-12">Loading...</p>
        ) : filtered.length > 0 ? (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-secondary">
                  <TableHead className="w-10">
                    <Checkbox
                      checked={selected.size === filtered.length && filtered.length > 0}
                      onCheckedChange={toggleAll}
                    />
                  </TableHead>
                  <TableHead className="text-xs uppercase tracking-widest text-muted-foreground">Applicant</TableHead>
                  <TableHead className="text-xs uppercase tracking-widest text-muted-foreground">Type</TableHead>
                  <TableHead className="text-xs uppercase tracking-widest text-muted-foreground">Sport</TableHead>
                  <TableHead className="text-xs uppercase tracking-widest text-muted-foreground">Applied</TableHead>
                  <TableHead className="text-xs uppercase tracking-widest text-muted-foreground">Status</TableHead>
                  <TableHead className="text-xs uppercase tracking-widest text-muted-foreground">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(app => (
                  <TableRow
                    key={app.id}
                    className="hover:bg-secondary/50 cursor-pointer transition-colors"
                    onClick={() => setDrawerApp(app)}
                  >
                    <TableCell onClick={e => e.stopPropagation()}>
                      <Checkbox checked={selected.has(app.id)} onCheckedChange={() => toggleSelect(app.id)} />
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-semibold text-sm">{app.name || app.desired_channel_name}</p>
                        <p className="text-xs text-muted-foreground">{app.desired_channel_name}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="capitalize text-sm">{app.account_type || 'creator'}</span>
                    </TableCell>
                    <TableCell className="text-sm">{app.sport || '-'}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {format(new Date(app.submitted_at || app.created_at), 'MMM d, yyyy')}
                    </TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold uppercase ${statusColors[app.status] || 'bg-secondary text-muted-foreground'}`}>
                        {app.status === 'submitted' ? 'pending' : app.status}
                      </span>
                    </TableCell>
                    <TableCell onClick={e => e.stopPropagation()}>
                      {(app.status === 'submitted' || app.status === 'pending') && (
                        <div className="flex gap-1">
                          <Button size="sm" variant="outline" className="h-8" onClick={() => handleAction(app.id, 'approved')} disabled={actionLoading}>
                            <Check className="w-3.5 h-3.5" />
                          </Button>
                          <Button size="sm" variant="outline" className="h-8" onClick={() => handleAction(app.id, 'rejected')} disabled={actionLoading}>
                            <X className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <p className="text-muted-foreground text-center py-12">No applications match your filters.</p>
        )}
      </div>

      {/* Detail Drawer */}
      <Sheet open={!!drawerApp} onOpenChange={open => !open && setDrawerApp(null)}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          {drawerApp && (
            <>
              <SheetHeader>
                <SheetTitle className="font-display text-xl">
                  {drawerApp.name || drawerApp.desired_channel_name}
                </SheetTitle>
              </SheetHeader>

              <div className="mt-6 space-y-6">
                {/* Status */}
                <div>
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold uppercase ${statusColors[drawerApp.status] || 'bg-secondary text-muted-foreground'}`}>
                    {drawerApp.status === 'submitted' ? 'pending' : drawerApp.status}
                  </span>
                </div>

                {/* Images */}
                {(drawerApp.banner_url || drawerApp.logo_url) && (
                  <div className="space-y-3">
                    {drawerApp.banner_url && (
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Banner</p>
                        <img src={drawerApp.banner_url} alt="Banner" className="w-full h-32 object-cover rounded-lg" />
                      </div>
                    )}
                    {drawerApp.logo_url && (
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Logo</p>
                        <img src={drawerApp.logo_url} alt="Logo" className="w-20 h-20 object-cover rounded-lg" />
                      </div>
                    )}
                  </div>
                )}

                {/* Details grid */}
                <div className="grid grid-cols-2 gap-4">
                  {[
                    ['Account Type', drawerApp.account_type || 'creator'],
                    ['Channel Name', drawerApp.desired_channel_name],
                    ['Sport', drawerApp.sport],
                    ['League', drawerApp.league],
                    ['City', drawerApp.city],
                    ['Content Focus', drawerApp.content_focus],
                    ['Applied', format(new Date(drawerApp.submitted_at || drawerApp.created_at), 'MMM d, yyyy')],
                  ].map(([label, value]) => (
                    <div key={label as string}>
                      <p className="text-xs font-semibold text-muted-foreground uppercase">{label}</p>
                      <p className="text-sm font-medium capitalize">{value || '-'}</p>
                    </div>
                  ))}
                </div>

                {/* Bio */}
                {drawerApp.bio && (
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Bio</p>
                    <p className="text-sm text-foreground">{drawerApp.bio}</p>
                  </div>
                )}

                {/* Social links */}
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">Social Media</p>
                  <div className="space-y-2">
                    {[
                      { label: 'Instagram', url: drawerApp.instagram_url, count: drawerApp.instagram_followers },
                      { label: 'TikTok', url: drawerApp.tiktok_url, count: drawerApp.tiktok_followers },
                      { label: 'YouTube', url: drawerApp.youtube_url, count: drawerApp.youtube_followers },
                      { label: 'Twitter/X', url: drawerApp.twitter_url, count: drawerApp.twitter_followers },
                    ].filter(s => s.url).map(s => (
                      <div key={s.label} className="flex items-center justify-between bg-secondary/50 rounded-lg px-3 py-2">
                        <a href={s.url!} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline flex items-center gap-1.5">
                          <ExternalLink className="w-3.5 h-3.5" />
                          {s.label}
                        </a>
                        {s.count != null && s.count > 0 && (
                          <span className="text-xs font-semibold text-muted-foreground">{s.count.toLocaleString()} followers</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Example links */}
                {drawerApp.example_content_links && (
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Example Content</p>
                    <p className="text-sm text-foreground whitespace-pre-wrap">{drawerApp.example_content_links}</p>
                  </div>
                )}

                {/* Actions */}
                {(drawerApp.status === 'submitted' || drawerApp.status === 'pending') && (
                  <div className="flex gap-3 pt-4 border-t border-border">
                    <Button className="flex-1" onClick={() => handleAction(drawerApp.id, 'approved')} disabled={actionLoading}>
                      <Check className="w-4 h-4 mr-2" /> Approve
                    </Button>
                    <Button variant="outline" className="flex-1" onClick={() => handleAction(drawerApp.id, 'rejected')} disabled={actionLoading}>
                      <X className="w-4 h-4 mr-2" /> Reject
                    </Button>
                  </div>
                )}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </section>
  );
};

export default AdminCreatorApplicationsTab;

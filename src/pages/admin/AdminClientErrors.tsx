import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, RefreshCw, Download, ArrowLeft } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface ClientErrorRow {
  id: string;
  user_id: string | null;
  message: string | null;
  stack: string | null;
  component_stack: string | null;
  url: string | null;
  route: string | null;
  user_agent: string | null;
  source: string | null;
  created_at: string;
}

const PAGE_SIZE = 200;

const toCsv = (rows: ClientErrorRow[]) => {
  const headers = ['created_at', 'source', 'route', 'user_id', 'message', 'url', 'user_agent', 'stack', 'component_stack'];
  const escape = (val: unknown) => {
    if (val == null) return '';
    const s = String(val).replace(/"/g, '""');
    return `"${s}"`;
  };
  const lines = [headers.join(',')];
  for (const r of rows) {
    lines.push(headers.map((h) => escape((r as any)[h])).join(','));
  }
  return lines.join('\n');
};

const AdminClientErrors = () => {
  const { isAdmin, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [rows, setRows] = useState<ClientErrorRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [route, setRoute] = useState('');
  const [userId, setUserId] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !isAdmin) navigate('/');
  }, [authLoading, isAdmin, navigate]);

  const load = async () => {
    setLoading(true);
    let q = supabase
      .from('client_errors')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(PAGE_SIZE);

    if (route.trim()) q = q.ilike('route', `%${route.trim()}%`);
    if (userId.trim()) q = q.eq('user_id', userId.trim());
    if (from) q = q.gte('created_at', new Date(from).toISOString());
    if (to) {
      const end = new Date(to);
      end.setHours(23, 59, 59, 999);
      q = q.lte('created_at', end.toISOString());
    }
    if (search.trim()) q = q.ilike('message', `%${search.trim()}%`);

    const { data, error } = await q;
    if (!error && data) setRows(data as ClientErrorRow[]);
    setLoading(false);
  };

  useEffect(() => {
    if (isAdmin) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin]);

  const handleExport = () => {
    const csv = toCsv(rows);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `client_errors_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const sources = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const r of rows) {
      const key = r.source || 'unknown';
      counts[key] = (counts[key] || 0) + 1;
    }
    return counts;
  }, [rows]);

  if (authLoading || !isAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-6">
        <div className="flex items-center justify-between mb-6 gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate('/admin')}>
              <ArrowLeft className="w-4 h-4 mr-1" /> Admin
            </Button>
            <h1 className="font-display text-2xl md:text-3xl font-black uppercase tracking-tight">
              Client Errors
            </h1>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={load} disabled={loading}>
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} /> Refresh
            </Button>
            <Button size="sm" onClick={handleExport} disabled={rows.length === 0}>
              <Download className="w-4 h-4 mr-2" /> Export CSV
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-card border border-border rounded-xl p-4 mb-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
          <div>
            <Label htmlFor="f-route" className="text-xs">Route contains</Label>
            <Input id="f-route" value={route} onChange={(e) => setRoute(e.target.value)} placeholder="/event" />
          </div>
          <div>
            <Label htmlFor="f-user" className="text-xs">User ID (exact)</Label>
            <Input id="f-user" value={userId} onChange={(e) => setUserId(e.target.value)} placeholder="uuid" />
          </div>
          <div>
            <Label htmlFor="f-from" className="text-xs">From</Label>
            <Input id="f-from" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="f-to" className="text-xs">To</Label>
            <Input id="f-to" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="f-search" className="text-xs">Message contains</Label>
            <Input id="f-search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="TypeError" />
          </div>
          <div className="md:col-span-2 lg:col-span-5 flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => { setRoute(''); setUserId(''); setFrom(''); setTo(''); setSearch(''); }}>
              Clear
            </Button>
            <Button size="sm" onClick={load} disabled={loading}>Apply filters</Button>
          </div>
        </div>

        {/* Summary */}
        <div className="flex flex-wrap gap-2 mb-4 text-xs">
          <span className="bg-secondary text-secondary-foreground px-2.5 py-1 rounded-full font-medium">
            {rows.length} result{rows.length === 1 ? '' : 's'} (max {PAGE_SIZE})
          </span>
          {Object.entries(sources).map(([s, c]) => (
            <span key={s} className="bg-muted text-muted-foreground px-2.5 py-1 rounded-full">
              {s}: {c}
            </span>
          ))}
        </div>

        {/* Table */}
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : rows.length === 0 ? (
            <div className="py-16 text-center text-muted-foreground text-sm">
              No client errors found.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="text-left px-4 py-3 font-semibold">When</th>
                    <th className="text-left px-4 py-3 font-semibold">Source</th>
                    <th className="text-left px-4 py-3 font-semibold">Route</th>
                    <th className="text-left px-4 py-3 font-semibold">Message</th>
                    <th className="text-left px-4 py-3 font-semibold">User</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => {
                    const isOpen = expanded === r.id;
                    return (
                      <>
                        <tr
                          key={r.id}
                          className="border-t border-border hover:bg-muted/30 cursor-pointer"
                          onClick={() => setExpanded(isOpen ? null : r.id)}
                        >
                          <td className="px-4 py-3 whitespace-nowrap text-xs text-muted-foreground">
                            {new Date(r.created_at).toLocaleString()}
                          </td>
                          <td className="px-4 py-3 text-xs">
                            <span className="bg-secondary text-secondary-foreground px-2 py-0.5 rounded">
                              {r.source || 'unknown'}
                            </span>
                          </td>
                          <td className="px-4 py-3 font-mono text-xs max-w-[200px] truncate">
                            {r.route || '—'}
                          </td>
                          <td className="px-4 py-3 max-w-[400px] truncate">
                            {r.message || '—'}
                          </td>
                          <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                            {r.user_id ? r.user_id.slice(0, 8) : '—'}
                          </td>
                        </tr>
                        {isOpen && (
                          <tr key={r.id + '-d'} className="bg-muted/20 border-t border-border">
                            <td colSpan={5} className="px-4 py-4 space-y-3 text-xs">
                              <div>
                                <div className="font-semibold mb-1">URL</div>
                                <div className="font-mono break-all">{r.url || '—'}</div>
                              </div>
                              <div>
                                <div className="font-semibold mb-1">User Agent</div>
                                <div className="font-mono break-all">{r.user_agent || '—'}</div>
                              </div>
                              {r.stack && (
                                <div>
                                  <div className="font-semibold mb-1">Stack</div>
                                  <pre className="bg-background border border-border rounded p-3 overflow-x-auto whitespace-pre-wrap font-mono text-[11px]">
                                    {r.stack}
                                  </pre>
                                </div>
                              )}
                              {r.component_stack && (
                                <div>
                                  <div className="font-semibold mb-1">Component Stack</div>
                                  <pre className="bg-background border border-border rounded p-3 overflow-x-auto whitespace-pre-wrap font-mono text-[11px]">
                                    {r.component_stack}
                                  </pre>
                                </div>
                              )}
                            </td>
                          </tr>
                        )}
                      </>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminClientErrors;

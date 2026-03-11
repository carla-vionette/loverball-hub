import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Search, Play, Calendar, X } from 'lucide-react';
import { fetchVideos } from '@/services/videoService';
import { fetchEvents } from '@/services/eventService';
import type { VideoItem, EventItem } from '@/types';

const GlobalSearch = () => {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const ref = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!query.trim()) {
      setVideos([]);
      setEvents([]);
      return;
    }

    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const [vids, evts] = await Promise.all([
          fetchVideos({ search: query }),
          fetchEvents({ search: query }),
        ]);
        setVideos(vids.slice(0, 5));
        setEvents(evts.slice(0, 5));
        setOpen(true);
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timerRef.current);
  }, [query]);

  const hasResults = videos.length > 0 || events.length > 0;

  return (
    <div ref={ref} className="relative w-full max-w-md">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search videos, events..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query && setOpen(true)}
          className="pl-9 pr-8 h-9 text-sm"
        />
        {query && (
          <button
            onClick={() => { setQuery(''); setOpen(false); }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {open && query && (
        <Card className="absolute top-full left-0 right-0 mt-1 z-50 max-h-[400px] overflow-y-auto shadow-lg">
          {loading ? (
            <div className="p-4 text-center text-sm text-muted-foreground">Searching...</div>
          ) : !hasResults ? (
            <div className="p-4 text-center text-sm text-muted-foreground">No results found</div>
          ) : (
            <div className="p-2">
              {videos.length > 0 && (
                <div className="mb-2">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest px-2 py-1">Videos</p>
                  {videos.map((v) => (
                    <button
                      key={v.id}
                      onClick={() => { navigate(`/watch/${v.id}`); setOpen(false); setQuery(''); }}
                      className="flex items-center gap-3 w-full px-2 py-2 rounded-lg hover:bg-secondary/50 text-left transition-colors"
                    >
                      <Play className="w-4 h-4 text-primary flex-shrink-0" />
                      <span className="text-sm truncate flex-1">{v.title}</span>
                      {v.category && <Badge variant="secondary" className="text-[10px]">{v.category}</Badge>}
                    </button>
                  ))}
                </div>
              )}
              {events.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest px-2 py-1">Events</p>
                  {events.map((e) => (
                    <button
                      key={e.id}
                      onClick={() => { navigate(`/event/${e.id}`); setOpen(false); setQuery(''); }}
                      className="flex items-center gap-3 w-full px-2 py-2 rounded-lg hover:bg-secondary/50 text-left transition-colors"
                    >
                      <Calendar className="w-4 h-4 text-primary flex-shrink-0" />
                      <span className="text-sm truncate flex-1">{e.title}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </Card>
      )}
    </div>
  );
};

export default GlobalSearch;

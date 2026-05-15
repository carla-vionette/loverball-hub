import { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import {
  fetchEventBySlug, fetchEventRsvps, fetchUsersByIds, fetchMyProfile, updateMyProfile,
  type LBEvent, type LBUser,
} from '@/lib/lb';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export default function EventWelcome() {
  const { slug = '' } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [event, setEvent] = useState<LBEvent | null>(null);
  const [attendees, setAttendees] = useState<LBUser[]>([]);
  const [me, setMe] = useState<LBUser | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    confetti({
      particleCount: 120, spread: 70, origin: { y: 0.4 },
      colors: ['#C2185B', '#0B6F73', '#FBF7F0'],
    });
    setTimeout(() => confetti.reset(), 1500);
  }, []);

  useEffect(() => {
    fetchEventBySlug(slug).then(async (e) => {
      setEvent(e);
      if (!e) return;
      const rs = await fetchEventRsvps(e.id);
      const profiles = await fetchUsersByIds(rs.map(r => r.user_id));
      setAttendees(profiles);
    });
    if (user) fetchMyProfile(user.id).then(setMe);
  }, [slug, user?.id]);

  const handlePhoto = async (file: File) => {
    if (!user) return;
    setUploading(true);
    try {
      const path = `${user.id}/${Date.now()}-${file.name}`;
      const { error } = await supabase.storage.from('profile-photos').upload(path, file, { upsert: true });
      if (error) throw error;
      const { data: { publicUrl } } = supabase.storage.from('profile-photos').getPublicUrl(path);
      await updateMyProfile(user.id, { photo_url: publicUrl });
      toast.success('Photo saved');
      navigate('/home');
    } catch (e: any) {
      toast.error(e.message || 'Upload failed');
    } finally { setUploading(false); }
  };

  if (!event) return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Loading…</div>;

  return (
    <div className="min-h-screen bg-background px-6 pt-16 pb-12 max-w-xl mx-auto">
      <h1 className="font-serif text-5xl text-foreground">You're in.</h1>
      <p className="mt-2 text-muted-foreground">We'll text you a reminder 24 hours before.</p>

      <Link to={`/e/${event.slug}`} className="mt-8 flex gap-4 bg-card border border-border rounded-md overflow-hidden">
        <div
          className="w-24 aspect-square bg-muted bg-center bg-cover flex-shrink-0"
          style={{ backgroundImage: event.hero_image_url ? `url(${event.hero_image_url})` : undefined }}
        />
        <div className="flex-1 py-3 pr-4 min-w-0">
          <div className="eyebrow text-primary">{event.pillar}</div>
          <div className="font-serif text-lg leading-tight truncate">{event.title}</div>
          <div className="text-xs text-muted-foreground mt-1">
            {new Date(event.starts_at).toLocaleString(undefined, { weekday:'short', month:'short', day:'numeric', hour:'numeric', minute:'2-digit' })}
          </div>
        </div>
      </Link>

      <div className="mt-10">
        <p className="eyebrow text-muted-foreground mb-3">Who else is going</p>
        <div className="flex gap-3 overflow-x-auto pb-2">
          {attendees.map(a => (
            <div key={a.id} className="flex flex-col items-center w-16 flex-shrink-0">
              <div className="w-14 h-14 rounded-full bg-muted overflow-hidden">
                {a.photo_url && <img src={a.photo_url} alt="" className="w-full h-full object-cover" />}
              </div>
              <span className="mt-1 text-xs text-foreground truncate w-full text-center">
                {a.display_name?.split(' ')[0] || '—'}
              </span>
            </div>
          ))}
        </div>
      </div>

      {me && !me.photo_url && (
        <div className="mt-10 border-l-4 border-primary bg-card p-5 rounded-r-md">
          <h3 className="font-serif text-xl">Add a photo so people know who to look for</h3>
          <div className="mt-4 flex items-center gap-4">
            <label className="cursor-pointer">
              <input
                type="file" accept="image/*" className="hidden"
                onChange={e => e.target.files?.[0] && handlePhoto(e.target.files[0])}
              />
              <span className={`inline-flex items-center justify-center h-11 px-5 rounded-md bg-primary text-primary-foreground text-sm ${uploading ? 'opacity-60' : ''}`}>
                {uploading ? 'Uploading…' : 'Add Photo'}
              </span>
            </label>
            <button onClick={() => navigate('/home')} className="text-sm text-muted-foreground underline-offset-4 hover:underline">
              Skip for now
            </button>
          </div>
        </div>
      )}

      {me?.photo_url && (
        <Button onClick={() => navigate('/home')} className="mt-10 w-full h-12 bg-primary text-primary-foreground hover:bg-primary/90 rounded-md">
          Go to my home
        </Button>
      )}
    </div>
  );
}

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { fetchMyProfile, updateMyProfile, fetchMyRsvps, fetchReferralCount, type LBUser } from '@/lib/lb';
import Wordmark from '@/components/lb/Wordmark';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export default function Profile() {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const [me, setMe] = useState<LBUser | null>(null);
  const [name, setName] = useState('');
  const [referrals, setReferrals] = useState(0);
  const [upcoming, setUpcoming] = useState(0);
  const [busy, setBusy] = useState(false);

  useEffect(() => { if (!loading && !user) navigate('/'); }, [loading, user, navigate]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const p = await fetchMyProfile(user.id);
      setMe(p);
      setName(p?.display_name || '');
      setReferrals(await fetchReferralCount(user.id));
      const r = await fetchMyRsvps(user.id);
      setUpcoming(r.length);
    })();
  }, [user]);

  if (!me) return null;

  const save = async () => {
    setBusy(true);
    try {
      const updated = await updateMyProfile(me.id, { display_name: name });
      setMe(updated);
      toast.success('Saved');
    } finally { setBusy(false); }
  };

  const handlePhoto = async (file: File) => {
    setBusy(true);
    try {
      const path = `${me.id}/${Date.now()}-${file.name}`;
      const { error } = await supabase.storage.from('profile-photos').upload(path, file, { upsert: true });
      if (error) throw error;
      const { data: { publicUrl } } = supabase.storage.from('profile-photos').getPublicUrl(path);
      const updated = await updateMyProfile(me.id, { photo_url: publicUrl });
      setMe(updated);
      toast.success('Photo updated');
    } catch (e: any) { toast.error(e.message); }
    finally { setBusy(false); }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="px-6 py-4 flex justify-between items-center border-b border-border">
        <Wordmark />
        <button onClick={() => signOut().then(() => navigate('/'))} className="text-sm text-muted-foreground underline-offset-4 hover:underline">
          Sign out
        </button>
      </header>

      <main className="px-6 py-10 max-w-xl mx-auto">
        <h1 className="font-serif text-3xl mb-8">Your profile</h1>

        <div className="flex items-center gap-4 mb-8">
          <div className="w-20 h-20 rounded-full bg-muted overflow-hidden">
            {me.photo_url && <img src={me.photo_url} alt="" className="w-full h-full object-cover" />}
          </div>
          <label className="cursor-pointer">
            <input type="file" accept="image/*" className="hidden" onChange={e => e.target.files?.[0] && handlePhoto(e.target.files[0])} />
            <span className="inline-flex items-center justify-center h-10 px-4 rounded-md bg-card border border-border text-sm">
              {me.photo_url ? 'Change photo' : 'Add photo'}
            </span>
          </label>
        </div>

        <div className="space-y-1 mb-6">
          <label className="eyebrow text-muted-foreground">Display name</label>
          <Input value={name} onChange={e => setName(e.target.value)} className="h-11 bg-card" />
        </div>

        <Button onClick={save} disabled={busy} className="bg-primary text-primary-foreground hover:bg-primary/90 h-11 px-5 rounded-md">
          {busy ? 'Saving…' : 'Save'}
        </Button>

        <div className="mt-12 border-t border-border pt-8">
          <p className="eyebrow text-primary mb-3">Your Loverball impact</p>
          <p className="text-foreground">
            You've brought <span className="font-serif text-2xl text-primary">{referrals}</span> friend{referrals === 1 ? '' : 's'} to Loverball.
          </p>
          <p className="text-foreground mt-2">
            You're going to <span className="font-serif text-2xl text-primary">{upcoming}</span> upcoming event{upcoming === 1 ? '' : 's'}.
          </p>
        </div>

        <div className="mt-12 border-t border-border pt-6 text-xs text-muted-foreground">
          Profile {me.profile_completion}% complete
        </div>
      </main>
    </div>
  );
}

import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { fetchTeams, updateMyProfile, type LBUser, type LBTeam } from '@/lib/lb';
import { supabase } from '@/integrations/supabase/client';

const SPORTS = ['Basketball','Soccer','Football','Tennis','Baseball','Volleyball','Golf','Track'];
const VIBES = ['Latina sports fan','Run club','Watch party regular','Brings the crew','New to LA','Industry','Coach / player','Just here for the snacks'];

type CardKey = 'photo' | 'sports' | 'teams' | 'vibes';

const dismissKey = (k: CardKey) => `lb_dismiss_${k}`;

function isDismissed(k: CardKey) {
  const v = localStorage.getItem(dismissKey(k));
  if (!v) return false;
  return Date.now() - parseInt(v, 10) < 7 * 24 * 60 * 60 * 1000;
}

function dismiss(k: CardKey) {
  localStorage.setItem(dismissKey(k), String(Date.now()));
}

function CardShell({ eyebrow, title, sub, children, onSave, onDismiss, busy }: any) {
  return (
    <div className="border border-border bg-card rounded-md p-5">
      <p className="eyebrow text-primary">{eyebrow}</p>
      <h3 className="font-serif text-xl mt-1">{title}</h3>
      <p className="text-sm text-muted-foreground mt-1">{sub}</p>
      <div className="mt-4">{children}</div>
      <div className="mt-5 flex items-center gap-3">
        <Button onClick={onSave} disabled={busy} className="bg-primary text-primary-foreground hover:bg-primary/90 h-10 rounded-md">
          {busy ? 'Saving…' : 'Save'}
        </Button>
        <button onClick={onDismiss} className="text-sm text-muted-foreground underline-offset-4 hover:underline">
          Maybe later
        </button>
      </div>
    </div>
  );
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 h-9 rounded-full border text-sm transition-colors ${
        active
          ? 'bg-primary text-primary-foreground border-primary'
          : 'bg-background text-foreground border-border hover:border-primary'
      }`}
    >{children}</button>
  );
}

export default function ProfileBuildCards({ me, onUpdated }: { me: LBUser; onUpdated: (u: LBUser) => void }) {
  const [teams, setTeams] = useState<LBTeam[]>([]);
  const [bumpKey, setBumpKey] = useState(0);

  useEffect(() => { fetchTeams().then(setTeams); }, []);

  const cards: CardKey[] = useMemo(() => {
    const list: CardKey[] = [];
    if (!me.photo_url) list.push('photo');
    if ((me.favorite_sports || []).length === 0) list.push('sports');
    if ((me.favorite_team_ids || []).length === 0) list.push('teams');
    if ((me.vibe_tags || []).length === 0) list.push('vibes');
    return list.filter(k => !isDismissed(k));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [me, bumpKey]);

  const next = cards[0];
  if (!next) return null;

  const finishSave = (u: LBUser, delta = 20) => {
    onUpdated(u);
    toast.success(`+${delta}% complete`);
  };

  if (next === 'photo') return <PhotoCard me={me} onSaved={(u) => finishSave(u)} onDismiss={() => { dismiss('photo'); setBumpKey(k => k+1); }} />;
  if (next === 'sports') return <SportsCard me={me} onSaved={(u) => finishSave(u)} onDismiss={() => { dismiss('sports'); setBumpKey(k => k+1); }} />;
  if (next === 'teams') return <TeamsCard me={me} teams={teams} onSaved={(u) => finishSave(u)} onDismiss={() => { dismiss('teams'); setBumpKey(k => k+1); }} />;
  if (next === 'vibes') return <VibesCard me={me} onSaved={(u) => finishSave(u)} onDismiss={() => { dismiss('vibes'); setBumpKey(k => k+1); }} />;
  return null;
}

function PhotoCard({ me, onSaved, onDismiss }: any) {
  const [busy, setBusy] = useState(false);
  const upload = async (file: File) => {
    setBusy(true);
    try {
      const path = `${me.id}/${Date.now()}-${file.name}`;
      const { error } = await supabase.storage.from('profile-photos').upload(path, file, { upsert: true });
      if (error) throw error;
      const { data: { publicUrl } } = supabase.storage.from('profile-photos').getPublicUrl(path);
      const u = await updateMyProfile(me.id, { photo_url: publicUrl });
      onSaved(u);
    } catch (e: any) { toast.error(e.message); } finally { setBusy(false); }
  };
  return (
    <div className="border border-border bg-card rounded-md p-5">
      <p className="eyebrow text-primary">Add a photo</p>
      <h3 className="font-serif text-xl mt-1">So people know who to look for</h3>
      <p className="text-sm text-muted-foreground mt-1">Helps the room recognize you when you walk in.</p>
      <div className="mt-4 flex items-center gap-3">
        <label className="cursor-pointer">
          <input type="file" accept="image/*" className="hidden" onChange={e => e.target.files?.[0] && upload(e.target.files[0])} />
          <span className={`inline-flex items-center justify-center h-10 px-4 rounded-md bg-primary text-primary-foreground text-sm ${busy ? 'opacity-60' : ''}`}>
            {busy ? 'Uploading…' : 'Add Photo'}
          </span>
        </label>
        <button onClick={onDismiss} className="text-sm text-muted-foreground underline-offset-4 hover:underline">Maybe later</button>
      </div>
    </div>
  );
}

function SportsCard({ me, onSaved, onDismiss }: any) {
  const [sel, setSel] = useState<string[]>(me.favorite_sports || []);
  const [busy, setBusy] = useState(false);
  const toggle = (s: string) => setSel(p => p.includes(s) ? p.filter(x => x!==s) : [...p, s]);
  const save = async () => {
    if (sel.length === 0) { toast.error('Pick at least one'); return; }
    setBusy(true);
    try { onSaved(await updateMyProfile(me.id, { favorite_sports: sel })); }
    finally { setBusy(false); }
  };
  return (
    <CardShell eyebrow="The basics" title="What sports do you watch?" sub="We'll tailor your feed to your teams." onSave={save} onDismiss={onDismiss} busy={busy}>
      <div className="flex flex-wrap gap-2">
        {SPORTS.map(s => <Chip key={s} active={sel.includes(s)} onClick={() => toggle(s)}>{s}</Chip>)}
      </div>
    </CardShell>
  );
}

function TeamsCard({ me, teams, onSaved, onDismiss }: any) {
  const [sel, setSel] = useState<string[]>(me.favorite_team_ids || []);
  const [busy, setBusy] = useState(false);
  const filtered = (me.favorite_sports?.length
    ? teams.filter((t: LBTeam) => me.favorite_sports.includes(t.sport))
    : teams);
  const toggle = (id: string) => setSel(p => p.includes(id) ? p.filter(x => x!==id) : [...p, id]);
  const save = async () => {
    if (sel.length === 0) { toast.error('Pick at least one'); return; }
    setBusy(true);
    try { onSaved(await updateMyProfile(me.id, { favorite_team_ids: sel })); }
    finally { setBusy(false); }
  };
  return (
    <CardShell eyebrow="Your teams" title="Who do you root for?" sub="We'll prioritize their watch parties." onSave={save} onDismiss={onDismiss} busy={busy}>
      <div className="flex flex-wrap gap-2">
        {filtered.map((t: LBTeam) => (
          <Chip key={t.id} active={sel.includes(t.id)} onClick={() => toggle(t.id)}>
            {t.name} <span className="text-[10px] opacity-60 ml-1">{t.league}</span>
          </Chip>
        ))}
      </div>
    </CardShell>
  );
}

function VibesCard({ me, onSaved, onDismiss }: any) {
  const [sel, setSel] = useState<string[]>(me.vibe_tags || []);
  const [busy, setBusy] = useState(false);
  const toggle = (s: string) => setSel(p => p.includes(s) ? p.filter(x => x!==s) : [...p, s]);
  const save = async () => {
    if (sel.length === 0) { toast.error('Pick at least one'); return; }
    setBusy(true);
    try { onSaved(await updateMyProfile(me.id, { vibe_tags: sel })); }
    finally { setBusy(false); }
  };
  return (
    <CardShell eyebrow="Your vibe" title="How do you Loverball?" sub="Helps us seat you with the right people." onSave={save} onDismiss={onDismiss} busy={busy}>
      <div className="flex flex-wrap gap-2">
        {VIBES.map(v => <Chip key={v} active={sel.includes(v)} onClick={() => toggle(v)}>{v}</Chip>)}
      </div>
    </CardShell>
  );
}

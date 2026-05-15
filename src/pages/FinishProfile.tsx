import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, AtSign, MapPin, Trophy, FileText, ArrowRight, Check, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";

const TEAM_OPTIONS = [
  "Angel City FC", "LA Sparks", "USWNT", "WNBA", "NWSL", "WTA",
  "March Madness", "UCLA", "USC", "LSU", "South Carolina", "Iowa",
];

type Field = {
  key: "profile_photo_url" | "username" | "favorite_la_teams" | "city" | "bio";
  label: string;
  icon: typeof Camera;
};

const FIELDS: Field[] = [
  { key: "profile_photo_url", label: "Profile photo", icon: Camera },
  { key: "username", label: "Username", icon: AtSign },
  { key: "favorite_la_teams", label: "Favorite teams", icon: Trophy },
  { key: "city", label: "Your city", icon: MapPin },
  { key: "bio", label: "Short bio", icon: FileText },
];

export default function FinishProfile() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [userId, setUserId] = useState<string | null>(null);
  const [profile, setProfile] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeField, setActiveField] = useState<Field["key"] | null>(null);
  const [draft, setDraft] = useState<string | string[]>("");

  useEffect(() => {
    let cancelled = false;
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (cancelled) return;
      if (!session) { navigate("/signup", { replace: true }); return; }
      setUserId(session.user.id);
      let { data } = await supabase
        .from("profiles")
        .select("name, profile_photo_url, username, favorite_la_teams, city, bio")
        .eq("id", session.user.id)
        .maybeSingle();
      if (!data) {
        const fallbackName = (session.user.user_metadata as any)?.name?.trim() || "Friend";
        await supabase.from("profiles").insert({ id: session.user.id, name: fallbackName });
        data = { name: fallbackName, profile_photo_url: null, username: null, favorite_la_teams: null, city: null, bio: null } as any;
      }
      setProfile(data || {});
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, [navigate]);

  const completed = FIELDS.filter((f) => {
    const v = profile[f.key];
    return Array.isArray(v) ? v.length > 0 : !!v;
  }).length;
  const progress = Math.round((completed / FIELDS.length) * 100);

  const openField = (f: Field) => {
    setActiveField(f.key);
    setDraft(profile[f.key] ?? (f.key === "favorite_la_teams" ? [] : ""));
  };

  const saveField = async () => {
    if (!userId || !activeField) return;
    setSaving(true);
    try {
      const value = draft;
      const { error } = await supabase
        .from("profiles")
        .update({ [activeField]: Array.isArray(value) ? value : (value as string).trim() || null })
        .eq("id", userId);
      if (error) throw error;
      setProfile((p) => ({ ...p, [activeField]: value }));
      setActiveField(null);
    } catch (err: any) {
      toast({ title: "Couldn't save", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const uploadPhoto = async (file: File) => {
    if (!userId) return;
    setSaving(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `${userId}/avatar-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("profile-photos").upload(path, file, { upsert: true });
      if (upErr) throw upErr;
      const { data: { publicUrl } } = supabase.storage.from("profile-photos").getPublicUrl(path);
      await supabase.from("profiles").update({ profile_photo_url: publicUrl }).eq("id", userId);
      setProfile((p) => ({ ...p, profile_photo_url: publicUrl }));
      setActiveField(null);
    } catch (err: any) {
      toast({ title: "Upload failed", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="min-h-[100dvh] bg-background flex items-center justify-center text-foreground/50">Loading…</div>;
  }

  return (
    <div className="min-h-[100dvh] bg-background flex flex-col">
      <header className="px-6 pt-8 pb-4 max-w-md w-full mx-auto">
        <p className="text-xs uppercase tracking-widest text-foreground/50 mb-2">
          Hi {(profile.name || "friend").split(" ")[0]} 👋
        </p>
        <h1 className="text-3xl font-serif tracking-tight text-foreground">Finish your profile</h1>
        <p className="text-foreground/60 mt-2 text-sm">Add a few details so your community can find you.</p>

        <div className="mt-6 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-foreground/60">{completed} of {FIELDS.length} complete</span>
            <span className="text-primary font-medium">{progress}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      </header>

      <main className="flex-1 px-6 pb-32 max-w-md w-full mx-auto">
        <ul className="space-y-3 mt-4">
          {FIELDS.map((f) => {
            const v = profile[f.key];
            const done = Array.isArray(v) ? v.length > 0 : !!v;
            const Icon = f.icon;
            return (
              <li key={f.key}>
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={() => openField(f)}
                  className="w-full flex items-center gap-4 rounded-2xl border border-border bg-card p-4 text-left min-h-[64px]"
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${done ? "bg-primary/15 text-primary" : "bg-muted text-foreground/60"}`}>
                    {done ? <Check className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">{f.label}</p>
                    {done && (
                      <p className="text-xs text-foreground/60 truncate">
                        {Array.isArray(v) ? v.join(", ") : (f.key === "profile_photo_url" ? "Added" : v)}
                      </p>
                    )}
                  </div>
                  <ArrowRight className="w-4 h-4 text-foreground/40" />
                </motion.button>
              </li>
            );
          })}
        </ul>
      </main>

      <footer className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur border-t border-border px-6 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <div className="max-w-md mx-auto flex gap-3">
          <Button
            variant="ghost"
            onClick={() => navigate("/watch")}
            className="flex-1 h-12 rounded-2xl text-foreground/60"
          >
            Skip for now
          </Button>
          <Button
            onClick={() => navigate("/watch")}
            className="flex-1 h-12 rounded-2xl font-semibold"
          >
            {progress === 100 ? "Let's go" : "Done"}
          </Button>
        </div>
      </footer>

      {/* Field editor sheet */}
      {activeField && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-end sm:items-center justify-center" onClick={() => setActiveField(null)}>
          <motion.div
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full sm:max-w-md bg-background rounded-t-3xl sm:rounded-3xl p-6 pb-[max(1.5rem,env(safe-area-inset-bottom))]"
          >
            <h2 className="text-xl font-serif text-foreground mb-4">
              {FIELDS.find((f) => f.key === activeField)?.label}
            </h2>

            {activeField === "profile_photo_url" && (
              <label className="block w-full">
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && uploadPhoto(e.target.files[0])}
                />
                <div className="border-2 border-dashed border-border rounded-2xl p-8 text-center cursor-pointer hover:border-primary transition-colors">
                  <Camera className="w-8 h-8 mx-auto text-foreground/50" />
                  <p className="mt-2 text-sm text-foreground/70">Tap to upload a photo</p>
                </div>
              </label>
            )}

            {activeField === "username" && (
              <Input
                autoFocus
                value={draft as string}
                onChange={(e) => setDraft(e.target.value.replace(/\s+/g, "").toLowerCase())}
                placeholder="@yourname"
                maxLength={30}
                className="h-14 rounded-2xl text-base"
              />
            )}

            {activeField === "city" && (
              <Input
                autoFocus
                value={draft as string}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="Los Angeles"
                maxLength={80}
                className="h-14 rounded-2xl text-base"
              />
            )}

            {activeField === "bio" && (
              <Textarea
                autoFocus
                value={draft as string}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="A little about you, your fandom, your vibe…"
                maxLength={200}
                rows={4}
                className="rounded-2xl text-base"
              />
            )}

            {activeField === "favorite_la_teams" && (
              <div className="flex flex-wrap gap-2">
                {TEAM_OPTIONS.map((t) => {
                  const selected = (draft as string[]).includes(t);
                  return (
                    <button
                      key={t}
                      type="button"
                      onClick={() => {
                        const arr = draft as string[];
                        setDraft(selected ? arr.filter((x) => x !== t) : [...arr, t]);
                      }}
                      className={`px-4 py-2 rounded-full text-sm border transition-colors ${selected ? "bg-primary text-primary-foreground border-primary" : "bg-background border-border text-foreground/70"}`}
                    >
                      {t}
                    </button>
                  );
                })}
              </div>
            )}

            {activeField !== "profile_photo_url" && (
              <div className="mt-6 flex gap-3">
                <Button variant="ghost" onClick={() => setActiveField(null)} className="flex-1 h-12 rounded-2xl">Cancel</Button>
                <Button onClick={saveField} disabled={saving} className="flex-1 h-12 rounded-2xl font-semibold">
                  {saving ? "Saving…" : "Save"}
                </Button>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </div>
  );
}

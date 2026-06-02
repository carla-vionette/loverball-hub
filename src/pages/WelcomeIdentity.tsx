import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, ArrowLeft, Camera } from "lucide-react";
import { C, fonts } from "@/lib/editorialTheme";
import { useToast } from "@/hooks/use-toast";
import Seo from "@/components/Seo";
import { CITY_OPTIONS } from "@/lib/onboardingOptions";

const LOOKING_FOR = [
  "Friends",
  "Watch crew",
  "Events IRL",
  "Networking",
  "Group chat",
  "Dating",
] as const;

const VIBES = [
  { key: "Diehard", emoji: "🔥" },
  { key: "Casual", emoji: "🌿" },
  { key: "Culture", emoji: "🎨" },
  { key: "Stats nerd", emoji: "📊" },
  { key: "Tailgater", emoji: "🍔" },
  { key: "New to it", emoji: "🌱" },
] as const;

const POPULAR_TEAMS = [
  "WNBA", "NWSL", "NCAA Basketball", "NCAA Soccer", "Tennis (WTA)",
  "Gymnastics", "Volleyball", "Sparks", "Angel City FC", "Lakers",
  "Dodgers", "Rams",
];

const labelStyle: React.CSSProperties = {
  fontFamily: fonts.mono, color: C.muted, fontSize: 11,
  letterSpacing: "0.2em", textTransform: "uppercase", display: "block", marginBottom: 8,
};

const inputStyle: React.CSSProperties = {
  background: C.bg, borderColor: C.borderStrong, color: C.text,
  height: 52, fontSize: 17, borderRadius: 16,
};

type Step = 0 | 1 | 2;

const Chip = ({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) => (
  <button
    type="button"
    onClick={onClick}
    className="px-4 py-2.5 rounded-full text-sm transition-all"
    style={{
      background: active ? C.raspberry : "transparent",
      color: active ? "#fff" : C.text,
      border: `1px solid ${active ? C.raspberry : C.borderStrong}`,
      fontFamily: fonts.sans,
      fontWeight: active ? 600 : 400,
    }}
  >
    {children}
  </button>
);

const WelcomeIdentity = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [step, setStep] = useState<Step>(0);
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  // Step A
  const [displayName, setDisplayName] = useState("");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  // Step B
  const [city, setCity] = useState("");
  const [teams, setTeams] = useState<string[]>([]);

  // Step C
  const [lookingFor, setLookingFor] = useState<string[]>([]);
  const [vibe, setVibe] = useState<string>("");

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate("/", { replace: true }); return; }
      setUserId(user.id);
      try {
        const pending = localStorage.getItem("pending_first_name");
        if (pending) setDisplayName(pending);
      } catch { /* ignore */ }
      const { data: p } = await supabase
        .from("profiles")
        .select("name, profile_photo_url, city, favorite_la_teams, favorite_sports, looking_for_tags, fan_vibe")
        .eq("id", user.id)
        .maybeSingle();
      if (p) {
        if (p.name) setDisplayName(p.name);
        if (p.profile_photo_url) setPhotoPreview(p.profile_photo_url);
        if (p.city) setCity(p.city);
        if (Array.isArray(p.favorite_la_teams) && p.favorite_la_teams.length) setTeams(p.favorite_la_teams);
        else if (Array.isArray(p.favorite_sports) && p.favorite_sports.length) setTeams(p.favorite_sports);
        if (Array.isArray(p.looking_for_tags)) setLookingFor(p.looking_for_tags);
        if (p.fan_vibe) setVibe(p.fan_vibe);
      }
    })();
  }, [navigate]);

  const toggle = (arr: string[], setArr: (v: string[]) => void, value: string, max = 12) => {
    if (arr.includes(value)) setArr(arr.filter((v) => v !== value));
    else if (arr.length < max) setArr([...arr, value]);
  };

  const onPhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setPhotoFile(f);
    setPhotoPreview(URL.createObjectURL(f));
  };

  const finish = async () => {
    if (!userId) return;
    setLoading(true);
    try {
      let photoUrl: string | null = photoPreview && photoPreview.startsWith("http") ? photoPreview : null;
      if (photoFile) {
        const ext = photoFile.name.split(".").pop() || "jpg";
        const path = `${userId}/${Date.now()}.${ext}`;
        const { error: upErr } = await supabase.storage.from("profile-photos").upload(path, photoFile, { upsert: true });
        if (!upErr) {
          const { data } = supabase.storage.from("profile-photos").getPublicUrl(path);
          photoUrl = data.publicUrl;
        }
      }
      const payload: Record<string, unknown> = {
        name: displayName.trim() || "Friend",
        city: city || null,
        favorite_la_teams: teams,
        looking_for_tags: lookingFor,
        fan_vibe: vibe || null,
        has_completed_onboarding: true,
      };
      if (photoUrl) payload.profile_photo_url = photoUrl;
      const { error } = await supabase.from("profiles").update(payload).eq("id", userId);
      if (error) throw error;
      try { localStorage.removeItem("pending_first_name"); } catch { /* ignore */ }
      navigate("/welcome/circles", { replace: true });
    } catch (e: unknown) {
      toast({ title: "Hmm — couldn't save", description: e instanceof Error ? e.message : "Try again.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const canContinue =
    step === 0 ? displayName.trim().length > 0 :
    step === 1 ? !!city :
    true;

  const next = () => {
    if (step < 2) setStep((step + 1) as Step);
    else finish();
  };

  return (
    <div className="min-h-[100dvh] flex flex-col" style={{ background: C.bg, color: C.text, fontFamily: fonts.sans }}>
      <Seo title="Build your fan identity · Loverball" description="Find your people." path="/welcome/identity" />

      {/* Top bar w/ progress */}
      <header className="px-5 pt-5 pb-3">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => step === 0 ? navigate(-1) : setStep((step - 1) as Step)}
            className="text-xs uppercase tracking-[0.2em] flex items-center gap-1.5 opacity-70 hover:opacity-100"
            style={{ fontFamily: fonts.mono, color: C.muted }}
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back
          </button>
          <span className="text-[10px] uppercase tracking-[0.25em]" style={{ fontFamily: fonts.mono, color: C.muted }}>
            Step {step + 1} of 3
          </span>
        </div>
        <div className="flex gap-1.5">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-1 flex-1 rounded-full" style={{ background: i <= step ? C.raspberry : C.border }} />
          ))}
        </div>
      </header>

      <main className="flex-1 max-w-md w-full mx-auto px-5 pt-4 pb-32">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
            transition={{ duration: 0.25 }}
          >
            {step === 0 && (
              <>
                <h1 className="mb-1" style={{ fontFamily: fonts.serif, fontStyle: "italic", fontSize: 36, lineHeight: 1.05 }}>
                  Make this yours.
                </h1>
                <p className="mb-7" style={{ color: C.muted, fontSize: 14 }}>
                  Your name and a photo if you feel like it. Skippable.
                </p>

                <div className="flex flex-col items-center mb-6">
                  <label className="relative cursor-pointer">
                    <div
                      className="w-28 h-28 rounded-full flex items-center justify-center overflow-hidden"
                      style={{
                        background: photoPreview ? `url(${photoPreview}) center/cover` : C.surface,
                        border: `2px dashed ${C.borderStrong}`,
                      }}
                    >
                      {!photoPreview && <Camera className="w-7 h-7" style={{ color: C.muted }} />}
                    </div>
                    <input type="file" accept="image/*" className="hidden" onChange={onPhoto} />
                  </label>
                  <span className="text-[10px] uppercase tracking-[0.22em] mt-3"
                        style={{ fontFamily: fonts.mono, color: C.muted }}>
                    {photoPreview ? "Tap to change" : "Add a photo (optional)"}
                  </span>
                </div>

                <div>
                  <label style={labelStyle}>Display name</label>
                  <Input
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="What should we call you?"
                    style={inputStyle}
                    autoFocus
                  />
                </div>
              </>
            )}

            {step === 1 && (
              <>
                <h1 className="mb-1" style={{ fontFamily: fonts.serif, fontStyle: "italic", fontSize: 36, lineHeight: 1.05 }}>
                  Where & who.
                </h1>
                <p className="mb-7" style={{ color: C.muted, fontSize: 14 }}>
                  Your city and the teams/leagues you love.
                </p>

                <div className="mb-6">
                  <label style={labelStyle}>City</label>
                  <div className="flex flex-wrap gap-2">
                    {CITY_OPTIONS.filter((c) => c !== "Other").slice(0, 8).map((c) => (
                      <Chip key={c} active={city === c} onClick={() => setCity(c)}>{c}</Chip>
                    ))}
                  </div>
                </div>

                <div>
                  <label style={labelStyle}>Teams & leagues</label>
                  <div className="flex flex-wrap gap-2">
                    {POPULAR_TEAMS.map((t) => (
                      <Chip key={t} active={teams.includes(t)} onClick={() => toggle(teams, setTeams, t, 12)}>{t}</Chip>
                    ))}
                  </div>
                  <p className="mt-3 text-[11px]" style={{ color: C.muted, fontFamily: fonts.mono, letterSpacing: "0.1em" }}>
                    Pick up to 12 · more options later in your profile
                  </p>
                </div>
              </>
            )}

            {step === 2 && (
              <>
                <h1 className="mb-1" style={{ fontFamily: fonts.serif, fontStyle: "italic", fontSize: 36, lineHeight: 1.05 }}>
                  Find your people.
                </h1>
                <p className="mb-7" style={{ color: C.muted, fontSize: 14 }}>
                  What are you here for? Pick all that apply.
                </p>

                <div className="mb-7">
                  <label style={labelStyle}>I'm looking for…</label>
                  <div className="flex flex-wrap gap-2">
                    {LOOKING_FOR.map((t) => (
                      <Chip key={t} active={lookingFor.includes(t)} onClick={() => toggle(lookingFor, setLookingFor, t, 6)}>{t}</Chip>
                    ))}
                  </div>
                </div>

                <div>
                  <label style={labelStyle}>What kind of fan are you?</label>
                  <div className="grid grid-cols-2 gap-2">
                    {VIBES.map((v) => {
                      const active = vibe === v.key;
                      return (
                        <button
                          key={v.key}
                          type="button"
                          onClick={() => setVibe(active ? "" : v.key)}
                          className="p-4 rounded-2xl text-left transition-all"
                          style={{
                            background: active ? C.raspberry : C.surface,
                            color: active ? "#fff" : C.text,
                            border: `1px solid ${active ? C.raspberry : C.border}`,
                          }}
                        >
                          <div className="text-2xl mb-1">{v.emoji}</div>
                          <div className="text-sm font-medium">{v.key}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </>
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Sticky CTA */}
      <div
        className="fixed bottom-0 left-0 right-0 border-t px-5 pt-3 pb-[calc(env(safe-area-inset-bottom)+12px)]"
        style={{ background: C.surface, borderColor: C.border }}
      >
        <div className="max-w-md mx-auto">
          <Button
            onClick={next}
            disabled={!canContinue || loading}
            className="w-full h-14 rounded-full text-xs uppercase tracking-[0.22em] border-0"
            style={{ background: C.raspberry, color: "#fff", fontFamily: fonts.mono }}
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : step === 2 ? "Enter the community" : "Continue"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default WelcomeIdentity;

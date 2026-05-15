import { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, ArrowRight, Check, Loader2 } from "lucide-react";
import loverballLogo from "@/assets/loverball-script-logo.png";

const LA_TEAMS = [
  "LA Sparks", "Angel City FC", "USC Women's Basketball", "UCLA Gymnastics",
  "LA Galaxy", "Lakers", "Dodgers", "Rams", "Chargers", "Kings", "Clippers",
];

const STEPS = ["Photo", "Username", "Teams", "City", "Bio"] as const;
type Step = number;

const FinishProfile = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);

  const [userId, setUserId] = useState<string | null>(null);
  const [defaultName, setDefaultName] = useState("");
  const [step, setStep] = useState<Step>(0);
  const [saving, setSaving] = useState(false);

  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [username, setUsername] = useState("");
  const [teams, setTeams] = useState<string[]>([]);
  const [city, setCity] = useState("");
  const [bio, setBio] = useState("");

  // Auth gate + load existing profile
  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) {
        navigate("/auth");
        return;
      }
      setUserId(data.user.id);
      const metaName =
        (data.user.user_metadata as any)?.name ||
        data.user.email?.split("@")[0] ||
        "Friend";
      setDefaultName(metaName);

      // Ensure profile row exists
      const { data: existing } = await supabase
        .from("profiles")
        .select("name, profile_photo_url, username, city, bio, favorite_la_teams")
        .eq("id", data.user.id)
        .maybeSingle();

      if (!existing) {
        await supabase.from("profiles").insert({
          id: data.user.id,
          name: metaName,
          account_type: "fan",
        } as any);
      } else {
        setPhotoUrl(existing.profile_photo_url || null);
        setUsername(existing.username || "");
        setCity(existing.city || "");
        setBio(existing.bio || "");
        setTeams((existing.favorite_la_teams as string[]) || []);
      }
    })();
  }, [navigate]);

  const completion = useMemo(() => {
    let pts = 20; // signed up
    if (photoUrl) pts += 16;
    if (username.trim()) pts += 16;
    if (teams.length) pts += 16;
    if (city.trim()) pts += 16;
    if (bio.trim()) pts += 16;
    return pts;
  }, [photoUrl, username, teams, city, bio]);

  const savePartial = async (patch: Record<string, any>) => {
    if (!userId) return;
    await supabase.from("profiles").update(patch).eq("id", userId);
  };

  const handlePhoto = async (file: File) => {
    if (!userId) return;
    setUploadingPhoto(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `${userId}/avatar-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("profile-photos")
        .upload(path, file, { upsert: true });
      if (upErr) throw upErr;
      const { data } = supabase.storage.from("profile-photos").getPublicUrl(path);
      setPhotoUrl(data.publicUrl);
      await savePartial({ profile_photo_url: data.publicUrl });
    } catch (err: any) {
      toast({ title: "Upload failed", description: err.message, variant: "destructive" });
    } finally {
      setUploadingPhoto(false);
    }
  };

  const next = async () => {
    setSaving(true);
    try {
      if (step === 1 && username.trim()) await savePartial({ username: username.trim().toLowerCase() });
      if (step === 2) await savePartial({ favorite_la_teams: teams });
      if (step === 3 && city.trim()) await savePartial({ city: city.trim() });
      if (step === 4 && bio.trim()) await savePartial({ bio: bio.trim() });
    } catch (err: any) {
      toast({ title: "Couldn't save", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }

    if (step >= STEPS.length - 1) {
      await savePartial({ has_completed_onboarding: true });
      toast({ title: "You're all set 🎉", description: "Welcome to the community." });
      navigate("/home");
    } else {
      setStep((s) => s + 1);
    }
  };

  const skipAll = async () => {
    await savePartial({ has_completed_onboarding: true });
    navigate("/home");
  };

  const toggleTeam = (t: string) => {
    setTeams((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]));
  };

  return (
    <div className="min-h-[100dvh] bg-background flex flex-col">
      <div className="px-5 pt-6 pb-3 flex items-center justify-between">
        <img src={loverballLogo} alt="Loverball" className="h-8 w-auto" />
        <button
          onClick={skipAll}
          className="text-sm text-foreground/60 hover:text-foreground"
        >
          Skip for now
        </button>
      </div>

      {/* Progress */}
      <div className="px-5 pb-4 max-w-md w-full mx-auto">
        <div className="flex justify-between text-xs text-foreground/60 mb-2">
          <span>Step {step + 1} of {STEPS.length} · {STEPS[step]}</span>
          <span>{completion}% complete</span>
        </div>
        <Progress value={completion} className="h-2" />
      </div>

      <div className="flex-1 flex flex-col justify-start px-6 pt-2 pb-10 max-w-md w-full mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-semibold text-foreground">
            {step === 0 && `Hey ${defaultName.split(" ")[0]} 👋`}
            {step === 1 && "Pick a username"}
            {step === 2 && "Who do you root for?"}
            {step === 3 && "Where you at?"}
            {step === 4 && "Say hi to the community"}
          </h1>
          <p className="text-foreground/60 mt-1">
            {step === 0 && "Add a profile photo so your community can find you."}
            {step === 1 && "This is how friends will tag and DM you."}
            {step === 2 && "Pick a few — we'll personalize your feed."}
            {step === 3 && "We'll show you events near you."}
            {step === 4 && "A short bio helps you make new friends."}
          </p>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.2 }}
            className="flex-1"
          >
            {step === 0 && (
              <div className="flex flex-col items-center gap-4 py-4">
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="relative w-36 h-36 rounded-full bg-secondary border-2 border-dashed border-border flex items-center justify-center overflow-hidden hover:border-primary transition-colors"
                >
                  {uploadingPhoto ? (
                    <Loader2 className="w-8 h-8 text-foreground/50 animate-spin" />
                  ) : photoUrl ? (
                    <img src={photoUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <Camera className="w-10 h-10 text-foreground/40" />
                  )}
                </button>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && handlePhoto(e.target.files[0])}
                />
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="text-sm text-primary font-medium"
                >
                  {photoUrl ? "Change photo" : "Upload photo"}
                </button>
              </div>
            )}

            {step === 1 && (
              <div className="space-y-3">
                <div className="flex items-center bg-secondary rounded-2xl px-4 h-14">
                  <span className="text-foreground/50 text-base">@</span>
                  <input
                    value={username}
                    onChange={(e) =>
                      setUsername(e.target.value.replace(/[^a-zA-Z0-9_]/g, "").toLowerCase())
                    }
                    placeholder="yourname"
                    autoFocus
                    className="flex-1 bg-transparent border-0 outline-none text-base ml-1"
                    maxLength={20}
                  />
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="flex flex-wrap gap-2">
                {LA_TEAMS.map((t) => {
                  const active = teams.includes(t);
                  return (
                    <button
                      key={t}
                      type="button"
                      onClick={() => toggleTeam(t)}
                      className={`px-4 h-11 rounded-full border text-sm font-medium transition-all ${
                        active
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-secondary border-border text-foreground/80 hover:border-primary/50"
                      }`}
                    >
                      {active && <Check className="w-3.5 h-3.5 inline mr-1.5" />}
                      {t}
                    </button>
                  );
                })}
              </div>
            )}

            {step === 3 && (
              <Input
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Los Angeles, CA"
                autoFocus
                className="h-14 rounded-2xl text-base"
              />
            )}

            {step === 4 && (
              <Textarea
                value={bio}
                onChange={(e) => setBio(e.target.value.slice(0, 160))}
                placeholder="Sparks szn. Always down for sushi after the game."
                rows={4}
                autoFocus
                className="rounded-2xl text-base resize-none"
              />
            )}
          </motion.div>
        </AnimatePresence>

        <div className="space-y-3 pt-6">
          <Button
            onClick={next}
            disabled={saving}
            className="w-full h-14 rounded-2xl text-base"
          >
            {step === STEPS.length - 1 ? "Finish" : "Continue"}
            <ArrowRight className="ml-2 w-4 h-4" />
          </Button>
          <button
            onClick={() => (step === STEPS.length - 1 ? skipAll() : setStep((s) => s + 1))}
            className="w-full text-sm text-foreground/60 hover:text-foreground"
          >
            Skip for now
          </button>
        </div>
      </div>
    </div>
  );
};

export default FinishProfile;

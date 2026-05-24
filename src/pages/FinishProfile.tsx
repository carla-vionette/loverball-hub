import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, ChevronRight, Check, Loader2, ArrowRight } from "lucide-react";
import loverballLogo from "@/assets/loverball-script-logo.png";
import { SPORTS_OPTIONS, CITY_OPTIONS } from "@/lib/onboardingOptions";
import { useAuth } from "@/hooks/useAuth";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// ── Steps ────────────────────────────────────────────────────────────────────
// 0: You're in! screen  1: Photo  2: Username  3: Teams  4: City + Bio  5: Done
const TOTAL_STEPS = 5; // steps 1–5 (step 0 is the welcome splash)

const slideVariants = {
  enter: (dir: number) => ({ x: dir > 0 ? 60 : -60, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir > 0 ? -60 : 60, opacity: 0 }),
};

const consumeRedirect = () => {
  const r = sessionStorage.getItem("postAuthRedirect");
  if (r) sessionStorage.removeItem("postAuthRedirect");
  return r || "/feed";
};

const FinishProfile = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user, loading: authLoading } = useAuth();

  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string>("");
  const [existingName, setExistingName] = useState<string>("");

  const [step, setStep] = useState(0); // 0 = "You're in" landing
  const [direction, setDirection] = useState(1);
  const [saving, setSaving] = useState(false);

  // Field state
  const [profilePhoto, setProfilePhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [username, setUsername] = useState("");
  const [usernameError, setUsernameError] = useState("");
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [favoriteSports, setFavoriteSports] = useState<string[]>([]);
  const [favoriteTeams, setFavoriteTeams] = useState<string[]>([]);
  const [teamInput, setTeamInput] = useState("");
  const [city, setCity] = useState("");
  const [bio, setBio] = useState("");
  const [phone, setPhone] = useState("");
  const [countryCode, setCountryCode] = useState("+1");
  const [existingPhone, setExistingPhone] = useState<string | null>(null);

  // Auth guard
  useEffect(() => {
    if (authLoading) return;
    if (!user) {
        navigate("/auth");
        return;
    }

    setUserId(user.id);
    setUserEmail(user.email || "");

    // Pull existing name from metadata or profiles
    const metaName = user.user_metadata?.name || "";
    if (metaName) setExistingName(metaName);

    supabase
      .from("profiles")
      .select("name, username, city, bio, favorite_sports, favorite_teams_players, profile_photo_url")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data: profile }) => {
        if (profile) {
          if (profile.name && !metaName) setExistingName(profile.name);
          if (profile.username) setUsername(profile.username);
          if (profile.city) setCity(profile.city);
          if (profile.bio) setBio(profile.bio);
          if (profile.favorite_sports?.length) setFavoriteSports(profile.favorite_sports);
          if (profile.favorite_teams_players?.length) setFavoriteTeams(profile.favorite_teams_players);
          if (profile.profile_photo_url) setPhotoPreview(profile.profile_photo_url);
        }
        const metaPhone = user.user_metadata?.phone as string | undefined;
        if (metaPhone) setExistingPhone(metaPhone);
      });
  }, [authLoading, navigate, user]);

  const go = (newStep: number, dir: number) => {
    setDirection(dir);
    setStep(newStep);
  };

  const skip = () => {
    // Save whatever we have so far and go to the app
    saveAndContinue(true);
  };

  // ── Username check ───────────────────────────────────────────────────
  const checkUsername = async (val: string) => {
    setUsername(val);
    setUsernameError("");
    if (val.length < 3) return;
    setCheckingUsername(true);
    const { data } = await supabase
      .from("profiles")
      .select("id")
      .eq("username", val.toLowerCase())
      .maybeSingle();
    setCheckingUsername(false);
    if (data && data.id !== userId) {
      setUsernameError("That username is taken — try another!");
    }
  };

  // ── Photo upload ─────────────────────────────────────────────────────
  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "Photo must be under 5MB", variant: "destructive" });
      return;
    }
    setProfilePhoto(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const uploadPhoto = async (): Promise<string | null> => {
    if (!profilePhoto || !userId) return photoPreview;
    const ext = profilePhoto.name.split('.').pop();
    const path = `${userId}/profile.${ext}`;
    const { error } = await supabase.storage
      .from('profile-photos')
      .upload(path, profilePhoto, { upsert: true });
    if (error) return null;
    return supabase.storage.from('profile-photos').getPublicUrl(path).data.publicUrl;
  };

  // ── Toggle helpers ───────────────────────────────────────────────────
  const toggleSport = (sport: string) => {
    setFavoriteSports((prev) =>
      prev.includes(sport) ? prev.filter((s) => s !== sport) : [...prev, sport]
    );
  };

  const addTeam = () => {
    const t = teamInput.trim();
    if (t && !favoriteTeams.includes(t)) {
      setFavoriteTeams([...favoriteTeams, t]);
    }
    setTeamInput("");
  };

  const removeTeam = (t: string) => setFavoriteTeams(favoriteTeams.filter((x) => x !== t));

  // ── Save profile upsert ──────────────────────────────────────────────
  const saveAndContinue = async (skipAll = false) => {
    if (!userId) return;
    setSaving(true);
    try {
      let photoUrl: string | null = photoPreview;
      if (profilePhoto) {
        photoUrl = await uploadPhoto();
      }

      const normalizedPhone = phone.trim()
        ? `${countryCode}${phone.replace(/\D+/g, "")}`
        : existingPhone || null;

      await supabase.from("profiles").upsert({
        id: userId,
        name: existingName || userEmail.split("@")[0],
        username: username.toLowerCase() || null,
        city: city || null,
        bio: bio || null,
        favorite_sports: favoriteSports.length ? favoriteSports : [],
        favorite_teams_players: favoriteTeams.length ? favoriteTeams : [],
        profile_photo_url: photoUrl,
        email: userEmail || null,
        phone: normalizedPhone,
        membership_tier: "free",
      }, { onConflict: "id" });

      // Welcome email fire-and-forget
      if (existingName) {
        supabase.functions.invoke("send-welcome-email", {
          body: { email: userEmail, name: existingName },
        }).catch(() => {});
      }

      if (!skipAll) {
        go(TOTAL_STEPS + 1, 1); // done screen
      } else {
        navigate(consumeRedirect());
      }
    } catch (err: any) {
      toast({ title: "Couldn't save", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  // Progress (steps 1–5, step 0 is splash)
  const progressPct = step === 0 ? 0 : ((step) / TOTAL_STEPS) * 100;
  const displayName = existingName || userEmail.split("@")[0] || "you";

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-md px-5 pt-5 pb-3">
        <img src={loverballLogo} alt="Loverball" className="w-[120px] h-auto mx-auto mb-4" />
        {step > 0 && step <= TOTAL_STEPS && (
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs text-foreground/40">
              <span>Finish your profile</span>
              <span>{step} / {TOTAL_STEPS}</span>
            </div>
            <div className="w-full h-1.5 bg-border/30 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-primary rounded-full"
                animate={{ width: `${progressPct}%` }}
                transition={{ duration: 0.4, ease: "easeOut" }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col px-5 pb-10 max-w-sm mx-auto w-full pt-6">
        <AnimatePresence mode="wait" custom={direction}>

          {/* ── Step 0: You're in! ── */}
          {step === 0 && (
            <motion.div
              key="step-0"
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3 }}
              className="flex-1 flex flex-col items-center justify-center text-center space-y-8"
            >
              <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 220, damping: 16, delay: 0.1 }}
                className="text-6xl"
              >
                🎉
              </motion.div>
              <div className="space-y-3">
                <h1 className="text-3xl font-sans font-bold text-foreground">
                  You're in{existingName ? `, ${existingName.split(" ")[0]}` : ""}!
                </h1>
                <p className="text-muted-foreground text-base leading-relaxed">
                  Welcome to the community. Now let's make your profile so your people can find you.
                </p>
              </div>
              {!existingPhone && (
                <div className="w-full space-y-2 pt-2 text-left">
                  <label className="text-xs uppercase tracking-wider text-muted-foreground">Phone number (for event SMS)</label>
                  <div className="flex gap-2">
                    <select
                      value={countryCode}
                      onChange={(e) => setCountryCode(e.target.value)}
                      className="h-12 px-3 rounded-xl bg-background border border-border text-sm"
                    >
                      <option value="+1">🇺🇸 +1</option>
                      <option value="+44">🇬🇧 +44</option>
                      <option value="+61">🇦🇺 +61</option>
                      <option value="+52">🇲🇽 +52</option>
                      <option value="+33">🇫🇷 +33</option>
                    </select>
                    <input
                      type="tel"
                      inputMode="tel"
                      placeholder="Phone number"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="flex-1 h-12 px-4 rounded-xl bg-background border border-border text-sm"
                    />
                  </div>
                </div>
              )}
              <div className="w-full space-y-3 pt-2">
                <Button
                  onClick={() => go(1, 1)}
                  className="w-full h-14 text-base rounded-2xl font-semibold gap-2 group"
                >
                  Finish your profile
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Button>
                <button
                  type="button"
                  onClick={() => navigate(consumeRedirect())}
                  className="w-full text-sm text-foreground/40 hover:text-foreground/70 transition-colors py-2"
                >
                  Skip for now
                </button>
              </div>
            </motion.div>
          )}

          {/* ── Step 1: Profile Photo ── */}
          {step === 1 && (
            <motion.div
              key="step-1"
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.28 }}
              className="space-y-7"
            >
              <div className="space-y-1">
                <h2 className="text-2xl font-sans font-bold text-foreground">Add a photo</h2>
                <p className="text-muted-foreground text-sm">Let your community know who you are.</p>
              </div>

              <div className="flex flex-col items-center gap-4">
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="relative cursor-pointer group"
                >
                  <Avatar className="w-28 h-28 border-2 border-dashed border-primary/40 group-hover:border-primary transition-colors">
                    {photoPreview ? (
                      <AvatarImage src={photoPreview} className="object-cover" />
                    ) : (
                      <AvatarFallback className="bg-muted text-3xl font-sans">
                        {displayName.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <div className="absolute bottom-0 right-0 w-8 h-8 bg-primary rounded-full flex items-center justify-center shadow">
                    <Camera className="w-4 h-4 text-primary-foreground" />
                  </div>
                </div>
                <p className="text-xs text-foreground/40">Tap to upload · JPG or PNG · max 5MB</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoSelect}
                  className="hidden"
                />
              </div>

              <StepNav
                onNext={() => go(2, 1)}
                onSkip={() => go(2, 1)}
                nextLabel={photoPreview ? "Looks good →" : "Skip"}
                primaryActive={!!photoPreview}
              />
            </motion.div>
          )}

          {/* ── Step 2: Username ── */}
          {step === 2 && (
            <motion.div
              key="step-2"
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.28 }}
              className="space-y-7"
            >
              <div className="space-y-1">
                <h2 className="text-2xl font-sans font-bold text-foreground">Pick a username</h2>
                <p className="text-muted-foreground text-sm">This is how the community will find you.</p>
              </div>

              <div className="space-y-2">
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-foreground/40 text-base select-none">@</span>
                  <Input
                    value={username}
                    onChange={(e) => checkUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_.]/g, ""))}
                    placeholder="yourname"
                    autoFocus
                    className="h-14 pl-8 text-base rounded-2xl border-border/60 bg-background placeholder:text-foreground/30"
                  />
                  {checkingUsername && (
                    <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-foreground/40" />
                  )}
                  {!checkingUsername && username.length >= 3 && !usernameError && (
                    <Check className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-green-500" />
                  )}
                </div>
                {usernameError && (
                  <p className="text-sm text-destructive pl-1">{usernameError}</p>
                )}
                {!usernameError && username.length > 0 && username.length < 3 && (
                  <p className="text-sm text-foreground/40 pl-1">At least 3 characters</p>
                )}
              </div>

              <StepNav
                onNext={() => go(3, 1)}
                onSkip={() => go(3, 1)}
                nextLabel="Continue →"
                primaryActive={username.length >= 3 && !usernameError}
                onBack={() => go(1, -1)}
              />
            </motion.div>
          )}

          {/* ── Step 3: Favorite teams & sports ── */}
          {step === 3 && (
            <motion.div
              key="step-3"
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.28 }}
              className="space-y-7"
            >
              <div className="space-y-1">
                <h2 className="text-2xl font-sans font-bold text-foreground">Your teams</h2>
                <p className="text-muted-foreground text-sm">Pick the sports you follow and the teams you love.</p>
              </div>

              {/* Sports pill grid */}
              <div className="space-y-3">
                <p className="text-xs uppercase tracking-wider text-foreground/50 font-medium">Sports</p>
                <div className="flex flex-wrap gap-2">
                  {SPORTS_OPTIONS.map((sport) => {
                    const on = favoriteSports.includes(sport);
                    return (
                      <button
                        key={sport}
                        type="button"
                        onClick={() => toggleSport(sport)}
                        className={`px-4 py-2 rounded-full text-sm font-medium border transition-all duration-200 ${
                          on
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-background text-foreground border-border/60 hover:border-primary/50"
                        }`}
                      >
                        {on && <Check className="inline w-3.5 h-3.5 mr-1.5 -mt-0.5" />}
                        {sport}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Teams input */}
              <div className="space-y-3">
                <p className="text-xs uppercase tracking-wider text-foreground/50 font-medium">Favorite teams</p>
                <div className="flex gap-2">
                  <Input
                    value={teamInput}
                    onChange={(e) => setTeamInput(e.target.value)}
                    placeholder="e.g. Lakers, USWNT, Angel City…"
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTeam())}
                    className="h-12 rounded-xl border-border/60 bg-background placeholder:text-foreground/30 text-sm"
                  />
                  <Button
                    type="button"
                    onClick={addTeam}
                    disabled={!teamInput.trim()}
                    className="h-12 px-5 rounded-xl shrink-0"
                  >
                    Add
                  </Button>
                </div>
                {favoriteTeams.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {favoriteTeams.map((t) => (
                      <span
                        key={t}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted text-sm font-medium"
                      >
                        {t}
                        <button
                          type="button"
                          onClick={() => removeTeam(t)}
                          className="text-foreground/40 hover:text-foreground/80 transition-colors"
                        >
                          ✕
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <StepNav
                onNext={() => go(4, 1)}
                onSkip={() => go(4, 1)}
                nextLabel="Continue →"
                primaryActive={favoriteSports.length > 0 || favoriteTeams.length > 0}
                onBack={() => go(2, -1)}
              />
            </motion.div>
          )}

          {/* ── Step 4: City + Bio ── */}
          {step === 4 && (
            <motion.div
              key="step-4"
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.28 }}
              className="space-y-7"
            >
              <div className="space-y-1">
                <h2 className="text-2xl font-sans font-bold text-foreground">Where are you?</h2>
                <p className="text-muted-foreground text-sm">Help us connect you with local fans and events.</p>
              </div>

              <div className="space-y-4">
                <Select value={city} onValueChange={setCity}>
                  <SelectTrigger className="h-14 rounded-2xl border-border/60 bg-background text-base">
                    <SelectValue placeholder="Select your city" />
                  </SelectTrigger>
                  <SelectContent className="bg-background z-50 max-h-64 overflow-y-auto">
                    {CITY_OPTIONS.map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Tell the community a little about you — sports obsessions, fave moments, vibes ✨"
                  rows={4}
                  maxLength={200}
                  className="rounded-2xl border-border/60 bg-background resize-none text-sm placeholder:text-foreground/30"
                />
                <p className="text-xs text-foreground/30 text-right -mt-2">{bio.length}/200</p>
              </div>

              <StepNav
                onNext={() => saveAndContinue()}
                onSkip={() => saveAndContinue(true)}
                nextLabel={saving ? "Saving…" : "Finish profile"}
                primaryActive={true}
                loading={saving}
                onBack={() => go(3, -1)}
                isLast
              />
            </motion.div>
          )}

          {/* ── Step 5: Done! ── */}
          {step > TOTAL_STEPS && (
            <motion.div
              key="done"
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, type: "spring", stiffness: 200 }}
              className="flex-1 flex flex-col items-center justify-center text-center space-y-8"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 260, damping: 16, delay: 0.1 }}
                className="text-7xl"
              >
                🏆
              </motion.div>
              <div className="space-y-3">
                <h2 className="text-3xl font-sans font-bold text-foreground">Profile complete!</h2>
                <p className="text-muted-foreground text-base leading-relaxed">
                  Add a few details so your community can find you.
                  <br />Your vibe is set. Let's go.
                </p>
              </div>
              <Button
                onClick={() => navigate(consumeRedirect())}
                className="w-full h-14 text-base rounded-2xl font-semibold gap-2 group"
              >
                Enter Loverball
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
};

// ── Reusable step nav ────────────────────────────────────────────────────────
interface StepNavProps {
  onNext: () => void;
  onSkip: () => void;
  onBack?: () => void;
  nextLabel: string;
  primaryActive: boolean;
  loading?: boolean;
  isLast?: boolean;
}

const StepNav = ({ onNext, onSkip, onBack, nextLabel, primaryActive, loading, isLast }: StepNavProps) => (
  <div className="space-y-3 pt-2">
    <Button
      type="button"
      onClick={onNext}
      disabled={loading || (!primaryActive && !isLast)}
      className="w-full h-14 text-base rounded-2xl font-semibold gap-2 group"
    >
      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
      {nextLabel}
    </Button>
    <div className="flex items-center justify-between">
      {onBack ? (
        <button
          type="button"
          onClick={onBack}
          className="text-sm text-foreground/40 hover:text-foreground/70 transition-colors"
        >
          ← Back
        </button>
      ) : <span />}
      {!isLast && (
        <button
          type="button"
          onClick={onSkip}
          className="text-sm text-foreground/40 hover:text-foreground/70 transition-colors"
        >
          Skip for now
        </button>
      )}
    </div>
  </div>
);

export default FinishProfile;

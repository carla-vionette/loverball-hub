import { useState, useEffect, useRef, useMemo, useCallback, ReactNode } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, ArrowLeft, Camera, Check, Loader2, X, Phone, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { C, fonts } from "@/lib/editorialTheme";
import { normalizeUSPhone, formatUSPhone, friendlyPhoneAuthError } from "@/lib/phone";
import loverballLogo from "@/assets/loverball-script-logo.png";
import collage1 from "@/assets/community-women.jpg";
import collage2 from "@/assets/brunch-basketball.jpg";
import collage3 from "@/assets/community-event.jpg";

/* =========================================================
   LOVERBALL · Unified 14-screen onboarding (Partiful-style)
   ========================================================= */

const TOTAL_CORE_SCREENS = 14;

const COUNTRIES = [
  { code: "+1", flag: "🇺🇸", label: "US" },
  { code: "+1", flag: "🇨🇦", label: "CA" },
  { code: "+44", flag: "🇬🇧", label: "UK" },
  { code: "+52", flag: "🇲🇽", label: "MX" },
  { code: "+61", flag: "🇦🇺", label: "AU" },
];

const LEAGUES = ["WNBA", "NWSL", "NCAA", "NFL", "FIFA", "F1", "Flag Football", "MLB", "NBA", "MLS"];
const TEAMS_BY_LEAGUE: Record<string, string[]> = {
  WNBA: ["LA Sparks", "NY Liberty", "Las Vegas Aces", "Indiana Fever", "Seattle Storm", "Chicago Sky"],
  NWSL: ["Angel City FC", "Gotham FC", "Portland Thorns", "San Diego Wave", "Bay FC"],
  NCAA: ["UConn", "LSU", "South Carolina", "Iowa", "Stanford", "USC"],
  NFL: ["49ers", "Eagles", "Chiefs", "Cowboys", "Rams"],
  FIFA: ["USWNT", "England", "Spain", "Brazil", "Germany"],
  F1: ["Ferrari", "Mercedes", "Red Bull", "McLaren"],
  "Flag Football": ["Team USA", "LA Wildcats"],
  MLB: ["Dodgers", "Yankees", "Red Sox"],
  NBA: ["Lakers", "Celtics", "Warriors"],
  MLS: ["LAFC", "LA Galaxy", "Inter Miami"],
};
const VIBES = ["Casual fan", "Die-hard", "Host", "Just here for the fits"] as const;

/* ---------- atoms ---------- */
const Page = ({ children }: { children: ReactNode }) => (
  <motion.div
    initial={{ opacity: 0, y: 12 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -8 }}
    transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
    className="flex flex-col min-h-[100dvh] px-6 pt-14 pb-8"
    style={{ background: C.bg, color: C.text }}
  >
    {children}
  </motion.div>
);

const H = ({ children }: { children: ReactNode }) => (
  <h1 style={{ fontFamily: "'Anton', Impact, sans-serif", fontSize: "clamp(34px, 8vw, 48px)", lineHeight: 1, letterSpacing: "-0.01em", textTransform: "uppercase" }}>
    {children}
  </h1>
);

const Sub = ({ children }: { children: ReactNode }) => (
  <p className="mt-3" style={{ fontFamily: fonts.sans, color: C.muted, fontSize: 16, lineHeight: 1.5 }}>
    {children}
  </p>
);

const Trust = ({ children }: { children: ReactNode }) => (
  <p className="mt-2 text-xs" style={{ fontFamily: fonts.mono, color: C.muted, opacity: 0.75 }}>
    {children}
  </p>
);

const PrimaryBtn = ({
  children, onClick, disabled, loading, type = "button",
}: { children: ReactNode; onClick?: () => void; disabled?: boolean; loading?: boolean; type?: "button" | "submit"; }) => (
  <button
    type={type}
    onClick={onClick}
    disabled={disabled || loading}
    className="w-full flex items-center justify-center gap-2 transition-all active:scale-[0.98] hover:opacity-95 disabled:opacity-40 disabled:cursor-not-allowed"
    style={{
      height: 56, borderRadius: 999, border: "none",
      background: `linear-gradient(95deg, ${C.raspberry} 0%, ${C.pink} 100%)`,
      color: "#fff", fontFamily: fonts.mono, fontSize: 13,
      letterSpacing: "0.18em", textTransform: "uppercase", fontWeight: 600,
      boxShadow: "0 10px 30px -10px rgba(232,93,47,0.55)",
    }}
  >
    {loading ? <Loader2 className="animate-spin" size={18} /> : children}
    {!loading && <ArrowRight size={16} />}
  </button>
);

const GhostBtn = ({ children, onClick }: { children: ReactNode; onClick?: () => void }) => (
  <button onClick={onClick} className="text-xs hover:opacity-100 opacity-70 transition" style={{ fontFamily: fonts.mono, color: C.text, letterSpacing: "0.18em", textTransform: "uppercase" }}>
    {children}
  </button>
);

const TextField = (props: React.InputHTMLAttributes<HTMLInputElement>) => (
  <input
    {...props}
    className={`w-full focus:outline-none placeholder:opacity-40 ${props.className ?? ""}`}
    style={{
      height: 60, borderRadius: 16, padding: "0 20px",
      background: C.surface, color: C.text,
      border: `1.5px solid ${C.borderStrong}`,
      fontFamily: fonts.sans, fontSize: 18,
      ...props.style,
    }}
  />
);

const TopBar = ({ step, onBack, onSkip }: { step: number; onBack?: () => void; onSkip?: () => void }) => (
  <div className="flex items-center justify-between mb-8 -mt-4">
    {onBack ? (
      <button onClick={onBack} aria-label="Back" className="p-2 -ml-2 opacity-70 hover:opacity-100"><ArrowLeft size={20} /></button>
    ) : <span className="w-8" />}
    <div className="flex-1 mx-4 h-[3px] rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.08)" }}>
      <motion.div
        initial={false}
        animate={{ width: `${(step / TOTAL_CORE_SCREENS) * 100}%` }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="h-full"
        style={{ background: `linear-gradient(90deg, ${C.raspberry}, ${C.pink}, ${C.neon})` }}
      />
    </div>
    {onSkip ? <GhostBtn onClick={onSkip}>Skip</GhostBtn> : <span className="w-8" />}
  </div>
);

const Chip = ({ active, children, onClick }: { active?: boolean; children: ReactNode; onClick?: () => void }) => (
  <button
    onClick={onClick}
    className="transition-all active:scale-95"
    style={{
      padding: "10px 16px", borderRadius: 999, fontFamily: fonts.mono, fontSize: 12, letterSpacing: "0.12em", textTransform: "uppercase",
      border: `1.5px solid ${active ? C.pink : C.borderStrong}`,
      background: active ? `linear-gradient(95deg, ${C.raspberry}, ${C.pink})` : "transparent",
      color: active ? "#fff" : C.text,
    }}
  >
    {children}
  </button>
);

/* ====================================================== */

const Onboarding = () => {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { toast } = useToast();
  const { user } = useAuth();

  const eventId = params.get("event") || params.get("eventId");
  const finishOnly = params.get("step") === "finish";

  // step 0 = splash (auto), 1..14 = core screens; 15..18 = finish-profile substeps
  const [step, setStep] = useState<number>(finishOnly ? 15 : 0);
  const [loading, setLoading] = useState(false);

  // form state
  const [channel, setChannel] = useState<"phone" | "email">("phone");
  const [country, setCountry] = useState(COUNTRIES[0]);
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [otpVerified, setOtpVerified] = useState(false);
  const [resendSec, setResendSec] = useState(25);
  const [name, setName] = useState("");
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [birthday, setBirthday] = useState(""); // YYYY-MM-DD

  // finish profile
  const [leagues, setLeagues] = useState<string[]>([]);
  const [teams, setTeams] = useState<string[]>([]);
  const [city, setCity] = useState("");
  const [zipCode, setZipCode] = useState("");
  const [vibe, setVibe] = useState<string>("");

  const fileRef = useRef<HTMLInputElement>(null);

  /* splash → auto advance */
  useEffect(() => {
    if (step !== 0) return;
    const t = setTimeout(() => setStep(1), 1400);
    return () => clearTimeout(t);
  }, [step]);

  /* resend timer */
  useEffect(() => {
    if (step !== 6 || resendSec <= 0) return;
    const t = setTimeout(() => setResendSec((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [step, resendSec]);

  /* If user already signed in & lands on / onboarding (homepage path) - resume at name step */
  useEffect(() => {
    if (user && step >= 1 && step <= 7) {
      setOtpVerified(true);
      if (step < 8) setStep(8);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const fullPhone = useMemo(() => `${country.code}${phone.replace(/\D/g, "")}`, [country, phone]);
  const firstName = name.trim().split(/\s+/)[0] || "friend";

  const next = useCallback(() => setStep((s) => s + 1), []);
  const back = useCallback(() => setStep((s) => Math.max(1, s - 1)), []);

  /* ---------- routing on finish ---------- */
  const finishCoreFlow = useCallback(() => {
    // After screen 14 welcome → show finish-profile prompt (step 15)
    setStep(15);
  }, []);

  const exitToDestination = useCallback((completedFinish: boolean) => {
    if (eventId) {
      navigate(`/event/${eventId}${completedFinish ? "?welcome=1" : "?welcome=1&finish=1"}`, { replace: true });
    } else {
      navigate(`/feed${completedFinish ? "?welcome=1" : "?welcome=1&finish=1"}`, { replace: true });
    }
  }, [eventId, navigate]);

  /* ---------- supabase actions ---------- */
  const isPhoneProviderError = (msg: string) => {
    const m = (msg || "").toLowerCase();
    return (
      m.includes("phone") || m.includes("sms") || m.includes("twilio") ||
      m.includes("provider") || m.includes("not enabled") ||
      m.includes("unsupported") || m.includes("disabled")
    );
  };

  const switchToEmail = () => {
    setChannel("email");
    setOtp("");
    setStep(3);
  };

  const sendOtp = async () => {
    setLoading(true);
    try {
      if (channel === "phone") {
        if (phone.replace(/\D/g, "").length < 7) {
          toast({ title: "Add a valid number", variant: "destructive" });
          setLoading(false);
          return;
        }
        const { error } = await supabase.auth.signInWithOtp({ phone: fullPhone });
        if (error) {
          if (isPhoneProviderError(error.message)) {
            toast({
              title: "Texts aren't working right now — try email?",
              description: "We'll switch you over with your info intact.",
              variant: "destructive",
            });
            switchToEmail();
            setLoading(false);
            return;
          }
          throw error;
        }
      } else {
        if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
          toast({ title: "Add a valid email", variant: "destructive" });
          setLoading(false);
          return;
        }
        const { error } = await supabase.auth.signInWithOtp({
          email: email.trim(),
          options: { shouldCreateUser: true },
        });
        if (error) throw error;
      }
      setResendSec(25);
      setStep(6);
    } catch (e: any) {
      toast({ title: "Couldn't send code", description: e?.message ?? "Try again", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async () => {
    if (otp.length !== 6) return;
    setLoading(true);
    try {
      const { error } = channel === "phone"
        ? await supabase.auth.verifyOtp({ phone: fullPhone, token: otp, type: "sms" })
        : await supabase.auth.verifyOtp({ email: email.trim(), token: otp, type: "email" });
      if (error) throw error;
      setOtpVerified(true);
      // identifier (phone or email) is already stored on auth.users by Supabase
      setStep(7);
    } catch (e: any) {
      toast({ title: "Code didn't work", description: e?.message ?? "Double-check & try again", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const saveProfilePartial = async (patch: Record<string, any>) => {
    const { data: { user: u } } = await supabase.auth.getUser();
    if (!u) return;
    await supabase.from("profiles").upsert({ id: u.id, name: name || "Member", ...patch, updated_at: new Date().toISOString() });
  };

  const uploadPhoto = async (file: File) => {
    const { data: { user: u } } = await supabase.auth.getUser();
    if (!u) return null;
    const ext = file.name.split(".").pop() || "jpg";
    const path = `${u.id}/avatar-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("profile-photos").upload(path, file, { upsert: true });
    if (error) { toast({ title: "Upload failed", description: error.message, variant: "destructive" }); return null; }
    const { data } = supabase.storage.from("profile-photos").getPublicUrl(path);
    return data.publicUrl;
  };

  const handlePhotoPick = async (file: File) => {
    setPhotoFile(file);
    setPhotoUrl(URL.createObjectURL(file));
    const url = await uploadPhoto(file);
    if (url) {
      setPhotoUrl(url);
      await saveProfilePartial({ profile_photo_url: url });
    }
  };

  const completeCore = async () => {
    await saveProfilePartial({
      name: name || "Member",
      profile_photo_url: photoUrl ?? undefined,
      // store birthday into bio via dedicated col? schema has no birthday — keep month/day only in bio for now
      bio: birthday ? `🎂 ${birthday.slice(5)}` : undefined,
    });
    finishCoreFlow();
  };

  const completeFinish = async () => {
    setLoading(true);
    try {
      let resolved: { city?: string; state?: string; latitude?: number | null; longitude?: number | null } = {};
      if (zipCode && /^\d{5}$/.test(zipCode)) {
        const { resolveZip } = await import("@/lib/geocoding");
        const loc = await resolveZip(zipCode);
        if (loc) resolved = { city: loc.city, state: loc.state, latitude: loc.latitude, longitude: loc.longitude };
      }
      await saveProfilePartial({
        favorite_sports: leagues,
        favorite_teams_players: teams,
        city: resolved.city || city || undefined,
        state: resolved.state,
        latitude: resolved.latitude,
        longitude: resolved.longitude,
        zip_code: zipCode || undefined,
        bio: vibe?.trim() || undefined,
        other_interests: vibe ? [vibe] : [],
        has_completed_onboarding: true,
      } as any);
      toast({ title: "You're in 💅🏾", description: "Badge unlocked + event recs are live." });
      exitToDestination(true);
    } finally {
      setLoading(false);
    }
  };

  /* ====================================================== */
  /* RENDER                                                  */
  /* ====================================================== */

  const renderStep = () => {
    switch (step) {
      /* 1. Splash */
      case 0:
        return (
          <Page key="splash">
            <div className="flex-1 flex items-center justify-center">
              <motion.img
                src={loverballLogo} alt="Loverball" className="h-32"
                initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.7, ease: "easeOut" }}
              />
            </div>
            <div aria-hidden className="pointer-events-none absolute inset-0 -z-10"
              style={{ background: `radial-gradient(circle at 30% 20%, ${C.raspberry}22, transparent 60%), radial-gradient(circle at 70% 80%, ${C.pink}22, transparent 60%)` }} />
          </Page>
        );

      /* 2. Social proof collage */
      case 1:
        return (
          <Page key="collage">
            <div className="flex justify-end">
              <GhostBtn onClick={() => setStep(2)}>Skip</GhostBtn>
            </div>
            <div className="flex-1 flex flex-col items-center justify-center relative my-6">
              <div className="grid grid-cols-2 gap-3 w-full max-w-sm">
                <img src={collage1} alt="" className="rounded-2xl aspect-[3/4] object-cover" loading="lazy" decoding="async" />
                <div className="space-y-3">
                  <img src={collage2} alt="" className="rounded-2xl aspect-square object-cover" loading="lazy" decoding="async" />
                  <img src={collage3} alt="" className="rounded-2xl aspect-square object-cover" loading="lazy" decoding="async" />
                </div>
              </div>
              <motion.div
                initial={{ rotate: -6, opacity: 0, y: 10 }} animate={{ rotate: -6, opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.5 }}
                className="absolute -bottom-2 left-3 max-w-[240px] p-4 rounded-2xl"
                style={{ background: C.neon, color: "#1a1a1a", boxShadow: "0 10px 30px -10px rgba(0,0,0,0.5)" }}
              >
                <p style={{ fontFamily: fonts.sans, fontSize: 14, lineHeight: 1.3, fontWeight: 600 }}>
                  "Best watch party I've ever been to 😭🔥"
                </p>
                <p className="mt-1 text-[10px] opacity-70" style={{ fontFamily: fonts.mono, letterSpacing: "0.14em", textTransform: "uppercase" }}>
                  — Mel, NWSL fan
                </p>
              </motion.div>
            </div>
            <PrimaryBtn onClick={() => setStep(2)}>Keep going</PrimaryBtn>
          </Page>
        );

      /* 3. Hero / Get Started */
      case 2:
        return (
          <Page key="hero">
            <TopBar step={2} />
            <div className="flex-1 flex flex-col justify-center">
              <H>Where women fans ball out together.</H>
              <Sub>Watch parties, group chats, ticket drops, and the realest sports community on the internet.</Sub>
            </div>
            <div className="space-y-3">
              <PrimaryBtn onClick={() => setStep(3)}>Get started</PrimaryBtn>
              <p className="text-[11px] text-center" style={{ color: C.muted, fontFamily: fonts.mono }}>
                By continuing you agree to our <a href="/terms" className="underline">Terms</a> & <a href="/privacy" className="underline">Privacy</a>.
              </p>
            </div>
          </Page>
        );

      /* 4 & 5. Phone / Email entry */
      case 3:
      case 4: {
        const canSendPhone = phone.replace(/\D/g, "").length >= 7;
        const canSendEmail = /^\S+@\S+\.\S+$/.test(email.trim());
        return (
          <Page key="phone">
            <TopBar step={3} onBack={back} />
            <div className="flex-1 flex flex-col justify-start">
              <H>Join the league</H>
              <Sub>Just for event drops. No spam 💌</Sub>

              {channel === "phone" ? (
                <div className="mt-8 flex gap-2">
                  <select
                    value={`${country.flag}${country.code}`}
                    onChange={(e) => {
                      const c = COUNTRIES.find((x) => `${x.flag}${x.code}` === e.target.value);
                      if (c) setCountry(c);
                    }}
                    className="focus:outline-none"
                    style={{ height: 60, borderRadius: 16, padding: "0 14px", background: C.surface, color: C.text, border: `1.5px solid ${C.borderStrong}`, fontFamily: fonts.sans, fontSize: 16 }}
                  >
                    {COUNTRIES.map((c) => (
                      <option key={`${c.flag}${c.label}`} value={`${c.flag}${c.code}`}>{c.flag} {c.code}</option>
                    ))}
                  </select>
                  <TextField
                    type="tel" inputMode="tel" autoComplete="tel"
                    placeholder="(310) 555-0123"
                    value={phone}
                    onChange={(e) => { setPhone(e.target.value); if (step === 3) setStep(4); }}
                  />
                </div>
              ) : (
                <TextField
                  className="mt-8"
                  type="email" inputMode="email" autoComplete="email"
                  placeholder="you@loverball.com"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); if (step === 3) setStep(4); }}
                />
              )}
              <Trust>
                {channel === "phone"
                  ? "Message & data rates may apply. We use this to verify you & send event drops."
                  : "We'll only email codes & event drops. Unsubscribe anytime."}
              </Trust>

              <div className="mt-5">
                <button
                  type="button"
                  onClick={() => {
                    setOtp("");
                    setChannel(channel === "phone" ? "email" : "phone");
                  }}
                  className="text-xs underline opacity-80 hover:opacity-100"
                  style={{ fontFamily: fonts.mono, color: C.pink, letterSpacing: "0.08em" }}
                >
                  {channel === "phone" ? "Use email instead" : "Use phone instead"}
                </button>
              </div>
            </div>
            <PrimaryBtn
              onClick={sendOtp}
              loading={loading}
              disabled={channel === "phone" ? !canSendPhone : !canSendEmail}
            >
              {channel === "phone" ? "Send code" : "Send code (email)"}
            </PrimaryBtn>
          </Page>
        );
      }

      /* 6 & 7. Verify OTP */
      case 5:
      case 6:
        return (
          <Page key="otp">
            <TopBar step={5} onBack={back} />
            <div className="flex-1 flex flex-col justify-start">
              <H>{channel === "phone" ? "Verify your number" : "Verify your email"}</H>
              <Sub>
                We sent a 6-digit code to{" "}
                {channel === "phone" ? `${country.code} ${phone}` : email}.
              </Sub>

              <input
                value={otp}
                onChange={(e) => { const v = e.target.value.replace(/\D/g, "").slice(0, 6); setOtp(v); }}
                inputMode="numeric" autoComplete="one-time-code" maxLength={6}
                placeholder="• • • • • •"
                className="mt-8 w-full text-center focus:outline-none placeholder:opacity-30"
                style={{ height: 76, borderRadius: 20, background: C.surface, color: C.text, border: `1.5px solid ${C.borderStrong}`, fontFamily: fonts.mono, fontSize: 36, letterSpacing: "0.5em" }}
              />

              <div className="mt-5 flex items-center justify-between text-xs" style={{ fontFamily: fonts.mono, color: C.muted }}>
                <span>Didn't receive it?</span>
                {resendSec > 0 ? (
                  <span>Resend in {resendSec}s</span>
                ) : (
                  <button onClick={sendOtp} className="underline" style={{ color: C.pink }}>Resend code</button>
                )}
              </div>

              {channel === "phone" && (
                <div className="mt-4">
                  <button
                    type="button"
                    onClick={switchToEmail}
                    className="text-xs underline opacity-80 hover:opacity-100"
                    style={{ fontFamily: fonts.mono, color: C.pink }}
                  >
                    Use email instead
                  </button>
                </div>
              )}
            </div>
            <PrimaryBtn onClick={verifyOtp} loading={loading} disabled={otp.length !== 6}>Next</PrimaryBtn>
          </Page>
        );


      /* 8. OTP verified state — instant transition to name */
      case 7:
        return (
          <Page key="verified">
            <div className="flex-1 flex flex-col items-center justify-center">
              <motion.div
                initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 220, damping: 18 }}
                className="w-20 h-20 rounded-full flex items-center justify-center mb-6"
                style={{ background: `linear-gradient(135deg, ${C.raspberry}, ${C.pink})` }}
              >
                <Check size={36} color="#fff" />
              </motion.div>
              <H>You're in</H>
              <Sub>Let's get your roster set up.</Sub>
            </div>
            <PrimaryBtn onClick={() => setStep(8)}>Continue</PrimaryBtn>
          </Page>
        );

      /* 9. Name */
      case 8:
      case 9:
        return (
          <Page key="name">
            <TopBar step={8} onBack={back} />
            <div className="flex-1 flex flex-col">
              <H>What should we call you?</H>
              <Sub>So your section knows who's pulling up 💁🏽‍♀️</Sub>
              <TextField
                className="mt-8"
                placeholder="A'ja Wilson"
                value={name}
                onChange={(e) => { setName(e.target.value); if (step === 8 && e.target.value.length > 0) setStep(9); }}
              />
            </div>
            <PrimaryBtn onClick={async () => { await saveProfilePartial({ name }); setStep(10); }} disabled={name.trim().length < 1}>Next</PrimaryBtn>
          </Page>
        );

      /* 10. Profile pic */
      case 10:
        return (
          <Page key="pic">
            <TopBar step={10} onBack={back} onSkip={() => setStep(11)} />
            <div className="flex-1 flex flex-col items-center">
              <H>Drop a pic</H>
              <Sub>So your crew spots you in the guest list.</Sub>

              <button
                onClick={() => fileRef.current?.click()}
                className="mt-10 w-40 h-40 rounded-full flex items-center justify-center overflow-hidden relative active:scale-95 transition"
                style={{ background: C.surface, border: `2px dashed ${C.borderStrong}` }}
              >
                {photoUrl ? (
                  <img src={photoUrl} alt="You" className="w-full h-full object-cover" loading="lazy" decoding="async" />
                ) : (
                  <Camera size={36} color={C.muted} />
                )}
              </button>
              <input
                ref={fileRef} type="file" accept="image/*" className="hidden"
                onChange={(e) => e.target.files?.[0] && handlePhotoPick(e.target.files[0])}
              />

              <div className="mt-8 p-4 rounded-2xl max-w-sm" style={{ background: C.surface, border: `1px solid ${C.border}` }}>
                <p className="text-sm" style={{ color: C.text, fontFamily: fonts.sans }}>
                  💡 <b>Pro tip:</b> Members with pics get <span style={{ color: C.neon }}>8x more event invites</span> 👀
                </p>
              </div>
            </div>
            <PrimaryBtn onClick={() => setStep(11)}>{photoUrl ? "Looks good" : "Continue"}</PrimaryBtn>
          </Page>
        );

      /* 11 & 12. Birthday */
      case 11:
      case 12:
        return (
          <Page key="bday">
            <TopBar step={11} onBack={back} />
            <div className="flex-1 flex flex-col">
              <H>When's your birthday?</H>
              <Sub>We'll plan something 🎂</Sub>
              <TextField
                type="date" className="mt-8"
                value={birthday}
                onChange={(e) => { setBirthday(e.target.value); if (step === 11) setStep(12); }}
              />
              <Trust>Your birth year is kept private.</Trust>
            </div>
            <PrimaryBtn onClick={async () => { await completeCoreBirthday(); }} disabled={!birthday}>Done</PrimaryBtn>
          </Page>
        );

      /* 13. Contact sync */
      case 13:
        return (
          <Page key="contacts">
            <TopBar step={13} onBack={back} onSkip={() => setStep(14)} />
            <div className="flex-1 flex flex-col items-center justify-center">
              <div className="w-24 h-24 rounded-full flex items-center justify-center mb-8"
                style={{ background: `linear-gradient(135deg, ${C.raspberry}33, ${C.pink}33)`, border: `1px solid ${C.borderStrong}` }}>
                <Phone size={36} color={C.pink} />
              </div>
              <H>See who's already in</H>
              <Sub>Sync contacts to find your fan fam.</Sub>
              <Trust>We never store your contacts.</Trust>
            </div>
            <PrimaryBtn onClick={() => {
              toast({ title: "Contact sync coming to the app soon ✨" });
              setStep(14);
            }}>Continue</PrimaryBtn>
          </Page>
        );

      /* 14. Welcome */
      case 14:
        return (
          <Page key="welcome">
            <div className="flex-1 flex flex-col justify-center">
              <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.6 }}>
                <p style={{ fontFamily: fonts.mono, fontSize: 11, letterSpacing: "0.3em", textTransform: "uppercase", color: C.neon }}>You're official</p>
                <h1 className="mt-3" style={{ fontFamily: "'Anton', Impact, sans-serif", fontSize: "clamp(40px, 10vw, 60px)", lineHeight: 1, textTransform: "uppercase" }}>
                  Welcome to <span style={{ background: `linear-gradient(95deg, ${C.raspberry}, ${C.pink}, ${C.neon})`, WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" }}>{firstName}</span>
                </h1>
                <Sub>Your next watch party is closer than you think.</Sub>
              </motion.div>

              <div className="mt-8 p-5 rounded-2xl" style={{ background: C.surface, border: `1px solid ${C.borderStrong}` }}>
                <p style={{ fontFamily: fonts.mono, fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase", color: C.muted }}>Hero card</p>
                <p className="mt-2 text-lg" style={{ fontFamily: fonts.sans }}>
                  {eventId ? "Your RSVP is one tap away 🎟️" : "Pick from this week's drops 🏀"}
                </p>
                <p className="mt-1 text-xs flex items-center gap-1" style={{ color: C.pink, fontFamily: fonts.mono, letterSpacing: "0.14em", textTransform: "uppercase" }}>
                  <Sparkles size={12} /> Ask the Commissioner
                </p>
              </div>
            </div>
            <PrimaryBtn onClick={completeCore}>Let's go</PrimaryBtn>
          </Page>
        );

      /* ============ POST-ONBOARDING: Finish Profile ============ */
      /* 15. Leagues */
      case 15:
        return (
          <Page key="leagues">
            <div className="flex items-center justify-between mb-8 -mt-4">
              <span className="text-xs" style={{ color: C.neon, fontFamily: fonts.mono, letterSpacing: "0.2em", textTransform: "uppercase" }}>Bonus · Unlock recs</span>
              <GhostBtn onClick={() => exitToDestination(false)}>Skip</GhostBtn>
            </div>
            <div className="flex-1 flex flex-col">
              <H>Pick your leagues 🔥</H>
              <Sub>We'll tune your feed + event drops.</Sub>
              <div className="mt-8 flex flex-wrap gap-2">
                {LEAGUES.map((l) => (
                  <Chip key={l} active={leagues.includes(l)} onClick={() => setLeagues((p) => p.includes(l) ? p.filter((x) => x !== l) : [...p, l])}>{l}</Chip>
                ))}
              </div>
            </div>
            <PrimaryBtn onClick={() => setStep(16)} disabled={leagues.length === 0}>Next</PrimaryBtn>
          </Page>
        );

      /* 16. Teams */
      case 16: {
        const teamOptions = Array.from(new Set(leagues.flatMap((l) => TEAMS_BY_LEAGUE[l] ?? [])));
        return (
          <Page key="teams">
            <div className="flex items-center justify-between mb-8 -mt-4">
              <button onClick={() => setStep(15)} aria-label="Back" className="p-2 -ml-2 opacity-70"><ArrowLeft size={20} /></button>
              <GhostBtn onClick={() => exitToDestination(false)}>Skip</GhostBtn>
            </div>
            <div className="flex-1 flex flex-col">
              <H>Pick your teams 💛</H>
              <Sub>Filtered by your leagues — pick as many as you want.</Sub>
              <div className="mt-8 flex flex-wrap gap-2">
                {teamOptions.length === 0 ? (
                  <p style={{ color: C.muted, fontFamily: fonts.sans }}>Pick a league first.</p>
                ) : teamOptions.map((t) => (
                  <Chip key={t} active={teams.includes(t)} onClick={() => setTeams((p) => p.includes(t) ? p.filter((x) => x !== t) : [...p, t])}>{t}</Chip>
                ))}
              </div>
            </div>
            <PrimaryBtn onClick={() => setStep(17)}>Next</PrimaryBtn>
          </Page>
        );
      }

      /* 17. City */
      case 17:
        return (
          <Page key="city">
            <div className="flex items-center justify-between mb-8 -mt-4">
              <button onClick={() => setStep(16)} aria-label="Back" className="p-2 -ml-2 opacity-70"><ArrowLeft size={20} /></button>
              <GhostBtn onClick={() => exitToDestination(false)}>Skip</GhostBtn>
            </div>
            <div className="flex-1 flex flex-col">
              <H>Your City</H>
              <Sub>We'll show you games, watch parties, and events near you.</Sub>
              <TextField
                className="mt-8"
                placeholder="ZIP code (e.g. 90001)"
                value={zipCode}
                onChange={(e) => setZipCode(e.target.value.replace(/[^0-9]/g, "").slice(0, 5))}
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={5}
              />
            </div>
            <PrimaryBtn onClick={() => setStep(18)} disabled={!/^\d{5}$/.test(zipCode)}>Next</PrimaryBtn>
          </Page>
        );

      /* 18. Vibe */
      case 18:
        return (
          <Page key="vibe">
            <div className="flex items-center justify-between mb-8 -mt-4">
              <button onClick={() => setStep(17)} aria-label="Back" className="p-2 -ml-2 opacity-70"><ArrowLeft size={20} /></button>
              <GhostBtn onClick={() => exitToDestination(false)}>Skip</GhostBtn>
            </div>
            <div className="flex-1 flex flex-col">
              <H>Your vibe?</H>
              <Sub>Describe yourself in a sentence — fans will see this on your profile.</Sub>
              <textarea
                value={vibe}
                onChange={(e) => setVibe(e.target.value.slice(0, 140))}
                placeholder="e.g. Die-hard Sparks fan who shows up for every home game in full kit"
                rows={4}
                className="mt-8 w-full px-5 py-4 rounded-2xl resize-none outline-none focus:ring-2"
                style={{
                  background: C.surface,
                  border: `1.5px solid ${vibe ? C.pink : C.borderStrong}`,
                  fontFamily: fonts.sans,
                  fontSize: 17,
                  color: C.text,
                }}
              />
              <p className="mt-2 text-xs" style={{ color: C.muted, fontFamily: fonts.mono }}>
                {vibe.length}/140
              </p>
            </div>
            <PrimaryBtn onClick={completeFinish} loading={loading} disabled={!vibe.trim()}>Unlock my feed</PrimaryBtn>
          </Page>
        );

      default:
        return null;
    }
  };

  // wrapper for case 12 "Done" button
  async function completeCoreBirthday() {
    setStep(13);
  }

  return (
    <div className="min-h-[100dvh]" style={{ background: C.bg }}>
      <AnimatePresence mode="wait">
        {renderStep()}
      </AnimatePresence>
    </div>
  );
};

export default Onboarding;

import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, ArrowLeft, Mail, CheckCircle2 } from "lucide-react";
import loverballLogo from "@/assets/loverball-script-logo.png";
import WelcomeSplash from "@/components/WelcomeSplash";
import { C, fonts } from "@/lib/editorialTheme";
import { isAuthEmailRateLimitError } from "@/lib/authErrors";

type AuthMode = "join" | "signin" | "confirm" | "reset_sent" | "reset_password";

/* ─── Editorial styled input ─── */
const EditorialInput = (props: React.ComponentProps<"input">) => (
  <input
    {...props}
    style={{
      fontFamily: fonts.sans,
      fontSize: 16,
      height: 56,
      width: "100%",
      padding: "0 20px",
      borderRadius: 16,
      border: `1.5px solid rgba(250, 245, 233, 0.35)`,
      background: C.surface,
      color: C.text,
      outline: "none",
      transition: "border-color 180ms ease, box-shadow 180ms ease",
      ...props.style,
    }}
    className={`placeholder:text-[#B8B8B8]/40 focus-visible:border-[#E85D2F] focus-visible:ring-1 focus-visible:ring-[#E85D2F]/30 ${props.className ?? ""}`}
  />
);

/* ─── Editorial primary pill button ─── */
const EditorialBtn = ({
  children,
  type = "button",
  disabled,
  onClick,
  loading,
}: {
  children: React.ReactNode;
  type?: "button" | "submit";
  disabled?: boolean;
  onClick?: () => void;
  loading?: boolean;
}) => (
  <button
    type={type}
    disabled={disabled || loading}
    onClick={onClick}
    style={{
      fontFamily: fonts.mono,
      fontSize: 12,
      letterSpacing: "0.16em",
      textTransform: "uppercase",
      fontWeight: 500,
      borderRadius: 999,
      height: 56,
      width: "100%",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      background: C.raspberry,
      color: "#fff",
      border: "none",
      boxShadow: "0 8px 24px -10px rgba(232,93,47,0.55)",
      cursor: disabled || loading ? "not-allowed" : "pointer",
      opacity: disabled || loading ? 0.6 : 1,
      transition: "all 180ms ease",
    }}
    className="hover:opacity-95 active:scale-[0.98]"
  >
    {loading ? "One sec…" : children}
    {!loading && <ArrowRight size={14} />}
  </button>
);

/* ─── Editorial outline pill button (Google) ─── */
const EditorialOutlineBtn = ({
  children,
  onClick,
}: {
  children: React.ReactNode;
  onClick?: () => void;
}) => (
  <button
    type="button"
    onClick={onClick}
    style={{
      fontFamily: fonts.mono,
      fontSize: 12,
      letterSpacing: "0.14em",
      textTransform: "uppercase",
      fontWeight: 500,
      borderRadius: 999,
      height: 56,
      width: "100%",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: 12,
      background: "transparent",
      color: C.text,
      border: `1px solid ${C.borderStrong}`,
      cursor: "pointer",
      transition: "all 180ms ease",
    }}
    className="hover:bg-white/5 active:scale-[0.98]"
  >
    {children}
  </button>
);

/* ─── Serif display heading ─── */
const AuthH1 = ({ children }: { children: React.ReactNode }) => (
  <h1
    style={{
      fontFamily: fonts.serif,
      fontStyle: "italic",
      fontWeight: 500,
      fontSize: "clamp(32px, 6vw, 48px)",
      lineHeight: 1.0,
      letterSpacing: "-0.02em",
      color: C.text,
      textAlign: "center",
    }}
  >
    {children}
  </h1>
);

/* ─── Body text ─── */
const AuthBody = ({
  children,
  muted = false,
  center = false,
}: {
  children: React.ReactNode;
  muted?: boolean;
  center?: boolean;
}) => (
  <p
    style={{
      fontFamily: fonts.sans,
      fontSize: 16,
      lineHeight: 1.6,
      color: muted ? C.muted : C.text,
      textAlign: center ? "center" : "left",
    }}
  >
    {children}
  </p>
);

/* ─── Mono label ─── */
const Mono = ({ children, color = C.muted }: { children: React.ReactNode; color?: string }) => (
  <span style={{ fontFamily: fonts.mono, fontSize: 11, letterSpacing: "0.22em", textTransform: "uppercase", color }}>
    {children}
  </span>
);

const Auth = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const initialMode = ((): AuthMode => {
    if (searchParams.get('reset') === 'true') return 'reset_password';
    const m = searchParams.get('mode');
    if (m === 'signin' || m === 'login') return 'signin';
    if (m === 'signup' || m === 'join') return 'join';
    if (searchParams.get('signup') === 'true') return 'join';
    return 'join';
  })();

  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [countryCode, setCountryCode] = useState("+1");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [splashName, setSplashName] = useState<string | null>(null);
  const [pendingRedirect, setPendingRedirect] = useState<string | null>(null);

  const redirectTo = searchParams.get('redirect') || '/feed';
  const authOrigin = window.location.origin;

  useEffect(() => {
    if (searchParams.get('reset') === 'true') { setMode('reset_password'); return; }
    const m = searchParams.get('mode');
    if (m === 'signin' || m === 'login') setMode('signin');
    else if (m === 'signup' || m === 'join') setMode('join');
    else if (searchParams.get('signup') === 'true') setMode('join');
  }, [searchParams]);

  // E.164 helpers
  const normalizePhone = (cc: string, raw: string) => {
    const digits = raw.replace(/\D+/g, "");
    if (!digits) return "";
    return `${cc}${digits}`;
  };
  const isValidE164 = (p: string) => /^\+[1-9]\d{6,14}$/.test(p);

  // ── Sign up ──────────────────────────────────────────────────────────
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast({ title: "What's your name?", variant: "destructive" });
      return;
    }
    if (!email.trim() || !email.includes("@")) {
      toast({ title: "Enter a valid email", variant: "destructive" });
      return;
    }
    const fullPhone = normalizePhone(countryCode, phone);
    if (!isValidE164(fullPhone)) {
      toast({ title: "Enter a valid phone number", description: "Include area code, digits only.", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const tempPassword = crypto.randomUUID();
      const { error, data } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password: tempPassword,
        options: {
          data: { name: name.trim(), phone: fullPhone },
          emailRedirectTo: `${authOrigin}/finish-profile`,
        },
      });

      if (error) throw error;

      // Persist phone, email, and free membership immediately on the profile (if session present).
      if (data.user) {
        await supabase.from("profiles").upsert(
          {
            id: data.user.id,
            name: name.trim(),
            email: email.trim().toLowerCase(),
            phone: fullPhone,
            membership_tier: "free",
            in_app_notifications_enabled: true,
            email_notifications_enabled: true,
            sms_notifications_enabled: true,
          },
          { onConflict: "id" },
        );
      }

      if (data.user && !data.session) setMode("confirm");
      else if (data.user && data.session) navigate("/finish-profile");
    } catch (err: any) {
      const message = err?.message ?? "";
      toast({
        title: isAuthEmailRateLimitError(message) ? "Email confirmations are temporarily delayed" : "Hmm, something went wrong",
        description: isAuthEmailRateLimitError(message)
          ? "Email signups are being throttled right now. Use Google for immediate access, or try email again in a little bit."
          : message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // ── Sign in ──────────────────────────────────────────────────────────
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error, data } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });
      if (error) throw error;

      const { data: profile } = await supabase
        .from('profiles')
        .select('name')
        .eq('id', data.user.id)
        .maybeSingle();

      if (profile?.name) {
        setSplashName(profile.name);
        setPendingRedirect(redirectTo);
      } else {
        navigate(redirectTo);
      }
    } catch (err: any) {
      toast({ title: "Couldn't sign in", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  // ── Forgot password ──────────────────────────────────────────────────
  const handleForgotPassword = async () => {
    if (!email.trim()) {
      toast({ title: "Enter your email first", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${authOrigin}/auth?reset=true`,
      });
      if (error) throw error;
      setMode("reset_sent");
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  // ── Reset password ───────────────────────────────────────────────────
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      toast({ title: "Password updated!" });
      navigate("/feed");
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  // ── Resend confirmation ──────────────────────────────────────────────
  const handleResend = async () => {
    if (!email) return;
    setResendLoading(true);
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email,
        options: { emailRedirectTo: `${authOrigin}/finish-profile` },
      });
      if (error) throw error;
      toast({ title: "Sent! Check your inbox." });
    } catch (err: any) {
      toast({
        title: isAuthEmailRateLimitError(err?.message) ? "Resend is temporarily delayed" : "Couldn't resend",
        description: isAuthEmailRateLimitError(err?.message)
          ? "Confirmation emails are being throttled right now. Use Google for immediate access, or try again shortly."
          : undefined,
        variant: "destructive",
      });
    } finally {
      setResendLoading(false);
    }
  };

  // ── Google OAuth (Lovable Cloud managed) ─────────────────────────────
  const handleGoogleAuth = async () => {
    const { lovable } = await import('@/integrations/lovable/index');
    const result = await lovable.auth.signInWithOAuth('google', {
      redirect_uri: `${authOrigin}/finish-profile`,
    });
    if (result.error) {
      toast({ title: 'Google sign-in failed', description: result.error.message, variant: 'destructive' });
    }
  };

  const pageBg: React.CSSProperties = {
    background: C.bg,
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "48px 20px",
  };

  const dividerStyle: React.CSSProperties = {
    flex: 1,
    height: 1,
    background: C.border,
  };

  return (
    <>
      {splashName && pendingRedirect && (
        <WelcomeSplash name={splashName} onDismiss={() => navigate(pendingRedirect)} />
      )}

      <div style={pageBg}>
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-10"
        >
          <img src={loverballLogo} alt="Loverball" className="w-[160px] h-auto mx-auto" style={{ filter: "brightness(0) invert(1)" }} loading="lazy" decoding="async" />
        </motion.div>

        <div className="w-full max-w-sm">
          <AnimatePresence mode="wait">

            {/* ── Join screen ── */}
            {mode === "join" && (
              <motion.div
                key="join"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }}
                transition={{ duration: 0.3 }}
                className="space-y-8"
              >
                <div className="text-center space-y-2">
                  <AuthH1>JOIN US!</AuthH1>
                  <AuthBody muted center>Sign up in seconds.</AuthBody>
                </div>

                <form onSubmit={handleSignUp} className="space-y-4">
                  <EditorialInput
                    type="text"
                    placeholder="Your name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    autoFocus
                  />
                  <EditorialInput
                    type="email"
                    placeholder="Email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                  <div className="flex gap-2">
                    <select
                      value={countryCode}
                      onChange={(e) => setCountryCode(e.target.value)}
                      style={{
                        fontFamily: fonts.sans,
                        fontSize: 16,
                        height: 56,
                        padding: "0 12px",
                        borderRadius: 16,
                        border: `1px solid ${C.borderStrong}`,
                        background: C.surface,
                        color: C.text,
                        outline: "none",
                        minWidth: 100,
                      }}
                      aria-label="Country code"
                    >
                      <option value="+1">🇺🇸 +1</option>
                      <option value="+44">🇬🇧 +44</option>
                      <option value="+61">🇦🇺 +61</option>
                      <option value="+33">🇫🇷 +33</option>
                      <option value="+49">🇩🇪 +49</option>
                      <option value="+52">🇲🇽 +52</option>
                      <option value="+34">🇪🇸 +34</option>
                      <option value="+39">🇮🇹 +39</option>
                      <option value="+81">🇯🇵 +81</option>
                      <option value="+91">🇮🇳 +91</option>
                      <option value="+55">🇧🇷 +55</option>
                    </select>
                    <EditorialInput
                      type="tel"
                      placeholder="Phone number"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      required
                      inputMode="tel"
                    />
                  </div>
                  <p style={{ fontFamily: fonts.mono, fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase", color: C.muted, textAlign: "center" }}>
                    Free forever · No card required
                  </p>
                  <EditorialBtn type="submit" loading={loading}>
                    Continue free
                  </EditorialBtn>
                </form>

                <div className="relative flex items-center gap-4">
                  <div style={dividerStyle} />
                  <Mono>or</Mono>
                  <div style={dividerStyle} />
                </div>

                <EditorialOutlineBtn onClick={handleGoogleAuth}>
                  <svg className="h-5 w-5" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
                    <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                  Continue with Google
                </EditorialOutlineBtn>

                <p style={{ fontFamily: fonts.sans, fontSize: 14, textAlign: "center", color: C.muted }}>
                  Already a member?{" "}
                  <button
                    type="button"
                    onClick={() => setMode("signin")}
                    style={{ color: C.raspberry, fontWeight: 600, borderBottom: `1px solid ${C.raspberry}`, paddingBottom: 1 }}
                    className="hover:opacity-80 transition-opacity"
                  >
                    Sign in
                  </button>
                </p>
              </motion.div>
            )}

            {/* ── Confirmation screen ── */}
            {mode === "confirm" && (
              <motion.div
                key="confirm"
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.35 }}
                className="text-center space-y-7"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", delay: 0.15, stiffness: 220, damping: 18 }}
                  className="w-20 h-20 rounded-full flex items-center justify-center mx-auto"
                  style={{ background: `${C.raspberry}18` }}
                >
                  <Mail className="w-9 h-9" style={{ color: C.raspberry }} />
                </motion.div>

                <div className="space-y-3">
                  <h2
                    style={{
                      fontFamily: fonts.serif,
                      fontStyle: "italic",
                      fontWeight: 500,
                      fontSize: 28,
                      lineHeight: 1.1,
                      color: C.text,
                    }}
                  >
                    You're almost in.
                  </h2>
                  <AuthBody muted center>
                    Check your email at{" "}
                    <span style={{ fontWeight: 600, color: C.text }}>{email}</span>{" "}
                    to confirm and finish setting up.
                  </AuthBody>
                </div>

                <div
                  className="rounded-2xl px-5 py-4 text-sm leading-relaxed"
                  style={{ background: C.surface, color: C.muted }}
                >
                  Didn't get it? Check spam, or{" "}
                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={resendLoading}
                    style={{ color: C.raspberry, fontWeight: 600, borderBottom: `1px solid ${C.raspberry}` }}
                    className="hover:opacity-80 transition-opacity"
                  >
                    {resendLoading ? "Sending…" : "resend the email"}
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setMode("join")}
                  style={{ fontFamily: fonts.sans, fontSize: 14, color: C.muted, display: "flex", alignItems: "center", gap: 6, margin: "0 auto" }}
                  className="hover:text-[#FAF5E9] transition-colors"
                >
                  <ArrowLeft size={14} />
                  Use a different email
                </button>
              </motion.div>
            )}

            {/* ── Sign in screen ── */}
            {mode === "signin" && (
              <motion.div
                key="signin"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }}
                transition={{ duration: 0.3 }}
                className="space-y-8"
              >
                <div className="text-center space-y-2">
                  <AuthH1>Welcome back</AuthH1>
                  <AuthBody muted center>Sign in to your account.</AuthBody>
                </div>

                <form onSubmit={handleSignIn} className="space-y-4">
                  <EditorialInput
                    type="email"
                    placeholder="Email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoFocus
                  />
                  <EditorialInput
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />

                  <div className="text-right">
                    <button
                      type="button"
                      onClick={handleForgotPassword}
                      disabled={loading}
                      style={{ fontFamily: fonts.sans, fontSize: 14, color: C.raspberry }}
                      className="hover:opacity-80 transition-opacity"
                    >
                      Forgot password?
                    </button>
                  </div>

                  <EditorialBtn type="submit" loading={loading}>
                    Sign in
                  </EditorialBtn>
                </form>

                <div className="relative flex items-center gap-4">
                  <div style={dividerStyle} />
                  <Mono>or</Mono>
                  <div style={dividerStyle} />
                </div>

                <EditorialOutlineBtn onClick={handleGoogleAuth}>
                  <svg className="h-5 w-5" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
                    <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                  Continue with Google
                </EditorialOutlineBtn>

                <p style={{ fontFamily: fonts.sans, fontSize: 14, textAlign: "center", color: C.muted }}>
                  New here?{" "}
                  <button
                    type="button"
                    onClick={() => { setMode("join"); setPassword(""); }}
                    style={{ color: C.raspberry, fontWeight: 600, borderBottom: `1px solid ${C.raspberry}`, paddingBottom: 1 }}
                    className="hover:opacity-80 transition-opacity"
                  >
                    JOIN US!
                  </button>
                </p>
              </motion.div>
            )}

            {/* ── Reset password sent ── */}
            {mode === "reset_sent" && (
              <motion.div
                key="reset_sent"
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
                className="text-center space-y-6"
              >
                <div
                  className="w-20 h-20 rounded-full flex items-center justify-center mx-auto"
                  style={{ background: `${C.raspberry}18` }}
                >
                  <CheckCircle2 className="w-9 h-9" style={{ color: C.raspberry }} />
                </div>
                <div className="space-y-2">
                  <h2
                    style={{
                      fontFamily: fonts.serif,
                      fontStyle: "italic",
                      fontWeight: 500,
                      fontSize: 28,
                      lineHeight: 1.1,
                      color: C.text,
                    }}
                  >
                    Check your inbox
                  </h2>
                  <AuthBody muted center>
                    We sent a reset link to <span style={{ fontWeight: 600, color: C.text }}>{email}</span>.
                  </AuthBody>
                </div>
                <button
                  type="button"
                  onClick={() => setMode("signin")}
                  style={{ fontFamily: fonts.sans, fontSize: 14, color: C.muted, display: "flex", alignItems: "center", gap: 6, margin: "0 auto" }}
                  className="hover:text-[#FAF5E9] transition-colors"
                >
                  <ArrowLeft size={14} />
                  Back to sign in
                </button>
              </motion.div>
            )}

            {/* ── Reset password form ── */}
            {mode === "reset_password" && (
              <motion.div
                key="reset_password"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="space-y-8"
              >
                <div className="text-center space-y-2">
                  <AuthH1>Set a new password</AuthH1>
                  <AuthBody muted center>Make it something you'll remember.</AuthBody>
                </div>

                <form onSubmit={handleResetPassword} className="space-y-4">
                  <EditorialInput
                    type="password"
                    placeholder="New password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    autoFocus
                  />
                  <EditorialBtn type="submit" loading={loading}>
                    Update password
                  </EditorialBtn>
                </form>
              </motion.div>
            )}

          </AnimatePresence>
        </div>

        {/* Footer */}
        <p
          style={{
            fontFamily: fonts.sans,
            fontSize: 12,
            color: C.muted,
            textAlign: "center",
            maxWidth: 320,
            marginTop: 48,
            lineHeight: 1.5,
          }}
          className="opacity-50"
        >
          By joining, you agree to our{" "}
          <button onClick={() => navigate("/terms")} style={{ color: C.text }} className="hover:opacity-80 transition-opacity">Terms</button>
          {" "}and{" "}
          <button onClick={() => navigate("/privacy")} style={{ color: C.text }} className="hover:opacity-80 transition-opacity">Privacy Policy</button>.
        </p>
      </div>
    </>
  );
};

export default Auth;

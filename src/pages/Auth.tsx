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

type AuthMode = "email" | "sent" | "password" | "reset_sent" | "reset_password";

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

/* ─── Editorial outline pill button ─── */
const EditorialOutlineBtn = ({
  children,
  onClick,
  type = "button",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  type?: "button" | "submit";
}) => (
  <button
    type={type}
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

const Auth = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const initialMode = ((): AuthMode => {
    if (searchParams.get('reset') === 'true') return 'reset_password';
    return 'email';
  })();

  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [splashName, setSplashName] = useState<string | null>(null);
  const [pendingRedirect, setPendingRedirect] = useState<string | null>(null);

  const redirectTo = searchParams.get('redirect') || '/feed';
  const authOrigin = window.location.origin;
  const emailRedirectTo = `${authOrigin}${redirectTo}`;

  useEffect(() => {
    if (searchParams.get('reset') === 'true') setMode('reset_password');
  }, [searchParams]);

  // ── Send magic link (creates user if needed) ─────────────────────────
  const handleSendMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = email.trim().toLowerCase();
    if (!trimmed || !trimmed.includes("@")) {
      toast({ title: "Enter a valid email", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: trimmed,
        options: {
          shouldCreateUser: true,
          emailRedirectTo,
        },
      });
      if (error) throw error;
      setMode("sent");
    } catch (err: any) {
      const message = err?.message ?? "";
      toast({
        title: isAuthEmailRateLimitError(message)
          ? "Email sign-in is temporarily delayed"
          : "Couldn't send sign-in link",
        description: isAuthEmailRateLimitError(message)
          ? "Sign-in emails are being throttled. Try again in a moment."
          : message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email) return;
    setResendLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim().toLowerCase(),
        options: { shouldCreateUser: true, emailRedirectTo },
      });
      if (error) throw error;
      toast({ title: "Sent! Check your inbox." });
    } catch (err: any) {
      toast({
        title: isAuthEmailRateLimitError(err?.message) ? "Resend is temporarily delayed" : "Couldn't resend",
        description: err?.message,
        variant: "destructive",
      });
    } finally {
      setResendLoading(false);
    }
  };

  // ── Password sign-in (secondary) ──────────────────────────────────────
  const handlePasswordSignIn = async (e: React.FormEvent) => {
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

  const handleForgotPassword = async () => {
    if (!email.trim()) {
      toast({ title: "Enter your email first", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${authOrigin}/reset-password`,
      });
      if (error) throw error;
      setMode("reset_sent");
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

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

  const gradientBg = `radial-gradient(circle at 30% 20%, ${C.raspberry}22, transparent 60%), radial-gradient(circle at 70% 80%, ${C.pink}22, transparent 60%)`;

  const pageBg: React.CSSProperties = {
    background: C.bg,
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "48px 20px",
    position: "relative",
  };

  return (
    <>
      {splashName && pendingRedirect && (
        <WelcomeSplash name={splashName} onDismiss={() => navigate(pendingRedirect)} />
      )}

      <div style={pageBg}>
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-10" style={{ background: gradientBg }} />
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

            {/* ── Email magic-link entry ── */}
            {mode === "email" && (
              <motion.div
                key="email"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }}
                transition={{ duration: 0.3 }}
                className="space-y-8"
              >
                <div className="text-center space-y-2">
                  <AuthH1>JOIN US!</AuthH1>
                  <AuthBody muted center>Sign up or sign in with your email.</AuthBody>
                </div>

                <form onSubmit={handleSendMagicLink} className="space-y-4">
                  <EditorialInput
                    type="email"
                    placeholder="Email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoFocus
                    autoComplete="email"
                  />
                  <EditorialBtn type="submit" loading={loading}>
                    Continue with Email
                  </EditorialBtn>
                </form>

                <button
                  type="button"
                  onClick={() => setMode("password")}
                  style={{
                    fontFamily: fonts.sans,
                    fontSize: 14,
                    color: C.muted,
                    width: "100%",
                    textAlign: "center",
                  }}
                  className="hover:text-[#FAF5E9] transition-colors"
                >
                  Sign in with password
                </button>

                <p
                  style={{
                    fontFamily: fonts.sans,
                    fontSize: 12,
                    color: C.muted,
                    textAlign: "center",
                  }}
                  className="opacity-70"
                >
                  Phone sign-in coming soon.
                </p>
              </motion.div>
            )}

            {/* ── Magic link sent ── */}
            {mode === "sent" && (
              <motion.div
                key="sent"
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
                    Check your email for your sign-in link.
                  </h2>
                  <AuthBody muted center>
                    We sent a link to{" "}
                    <span style={{ fontWeight: 600, color: C.text }}>{email}</span>.
                    Tap it to finish signing in.
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
                    {resendLoading ? "Sending…" : "resend the link"}
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setMode("email")}
                  style={{ fontFamily: fonts.sans, fontSize: 14, color: C.muted, display: "flex", alignItems: "center", gap: 6, margin: "0 auto" }}
                  className="hover:text-[#FAF5E9] transition-colors"
                >
                  <ArrowLeft size={14} />
                  Use a different email
                </button>
              </motion.div>
            )}

            {/* ── Password sign in (secondary) ── */}
            {mode === "password" && (
              <motion.div
                key="password"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }}
                transition={{ duration: 0.3 }}
                className="space-y-8"
              >
                <div className="text-center space-y-2">
                  <AuthH1>Welcome back</AuthH1>
                  <AuthBody muted center>Sign in with your password.</AuthBody>
                </div>

                <form onSubmit={handlePasswordSignIn} className="space-y-4">
                  <EditorialInput
                    type="email"
                    placeholder="Email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoFocus
                    autoComplete="email"
                  />
                  <EditorialInput
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
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

                <button
                  type="button"
                  onClick={() => { setMode("email"); setPassword(""); }}
                  style={{ fontFamily: fonts.sans, fontSize: 14, color: C.muted, display: "flex", alignItems: "center", gap: 6, margin: "0 auto" }}
                  className="hover:text-[#FAF5E9] transition-colors"
                >
                  <ArrowLeft size={14} />
                  Back to email sign-in
                </button>
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
                  onClick={() => setMode("password")}
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
                    autoComplete="new-password"
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

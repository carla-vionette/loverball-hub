import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, ArrowLeft, CheckCircle2 } from "lucide-react";
import loverballLogo from "@/assets/loverball-logo-black.png";
import WelcomeSplash from "@/components/WelcomeSplash";
import { C, fonts } from "@/lib/editorialTheme";
import { lovable } from "@/integrations/lovable";

type AuthMode = "password" | "reset_sent" | "reset_password";

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
      fontFamily: "'Anton', Impact, sans-serif",
      fontWeight: 400,
      fontSize: "clamp(32px, 6vw, 48px)",
      lineHeight: 0.95,
      letterSpacing: "-0.01em",
      textTransform: "uppercase",
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

  const modeParam = searchParams.get('mode');
  const isSignup = modeParam === 'signup';

  const initialMode = ((): AuthMode => {
    if (searchParams.get('reset') === 'true') return 'reset_password';
    return 'password';
  })();

  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [splashName, setSplashName] = useState<string | null>(null);
  const [pendingRedirect, setPendingRedirect] = useState<string | null>(null);

  const redirectTo = searchParams.get('redirect') || '/feed';
  const authOrigin = window.location.origin;
  const postAuthPath = isSignup ? '/onboarding?step=finish&welcome=1' : redirectTo;
  const emailRedirectTo = `${authOrigin}${postAuthPath}`;

  useEffect(() => {
    if (searchParams.get('reset') === 'true') setMode('reset_password');
  }, [searchParams]);

  // ── Password sign in / sign up ─────────────────────────────────────
  const friendlyAuthError = (err: any): string => {
    const msg = String(err?.message || err || "");
    const status = err?.status ?? err?.statusCode;
    if (status === 429 || /rate limit|too many requests|over_email_send_rate_limit/i.test(msg)) {
      return "Give us a sec and try again — we're catching up.";
    }
    return msg || "Something went wrong. Please try again.";
  };

  const signInWithRetry = async (email: string, password: string) => {
    let lastErr: any = null;
    for (let attempt = 0; attempt < 3; attempt++) {
      const result = await supabase.auth.signInWithPassword({ email, password });
      const status = (result.error as any)?.status;
      if (!result.error) return result;
      lastErr = result.error;
      if (status !== 429 && !/rate limit|too many requests/i.test(result.error.message || "")) {
        throw result.error;
      }
      // exponential backoff: 600ms, 1500ms
      await new Promise((r) => setTimeout(r, 600 * Math.pow(2, attempt)));
    }
    throw lastErr;
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return; // guard against rapid re-submit / double-click
    setLoading(true);
    try {
      if (isSignup) {
        const { error } = await supabase.auth.signUp({
          email: email.trim().toLowerCase(),
          password,
          options: { emailRedirectTo },
        });
        if (error) throw error;
        navigate('/onboarding?step=finish&welcome=1');
        return;
      }

      const { data, error } = await signInWithRetry(email.trim().toLowerCase(), password);
      if (error) throw error;

      const { data: profile } = await supabase
        .from('profiles')
        .select('name')
        .eq('id', data.user.id)
        .maybeSingle();

      const dest = profile?.name ? redirectTo : '/onboarding?step=finish&welcome=1';
      if (profile?.name) {
        setSplashName(profile.name);
        setPendingRedirect(dest);
      } else {
        navigate(dest);
      }
    } catch (err: any) {
      toast({ title: isSignup ? "Couldn't sign up" : "Couldn't sign in", description: friendlyAuthError(err), variant: "destructive" });
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

  const handleOAuth = async (provider: "google" | "apple") => {
    setLoading(true);
    try {
      const result = await lovable.auth.signInWithOAuth(provider, {
        redirect_uri: emailRedirectTo,
      });
      if (result.error) {
        toast({ title: `Couldn't sign in with ${provider}`, description: result.error.message ?? String(result.error), variant: "destructive" });
        setLoading(false);
        return;
      }
      if (result.redirected) return;
      navigate(postAuthPath);
    } catch (err: any) {
      toast({ title: `Couldn't sign in with ${provider}`, description: err?.message ?? String(err), variant: "destructive" });
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
          <img src={loverballLogo} alt="Loverball" className="h-9 md:h-10 w-auto mx-auto" loading="lazy" decoding="async" />
        </motion.div>

        <div className="w-full max-w-sm">
          <AnimatePresence mode="wait">

            {/* ── Password sign in / sign up ── */}
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
                  <AuthH1>{isSignup ? "JOIN US!" : "WELCOME BACK"}</AuthH1>
                  <AuthBody muted center>
                    {isSignup ? "Create your account with email and password." : "Sign in with your email and password."}
                  </AuthBody>
                </div>

                <form onSubmit={handlePasswordSubmit} className="space-y-4">
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
                    minLength={6}
                    autoComplete={isSignup ? "new-password" : "current-password"}
                  />

                  {!isSignup && (
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
                  )}

                  <EditorialBtn type="submit" loading={loading}>
                    {isSignup ? "Create account" : "Sign in"}
                  </EditorialBtn>
                </form>

                <div className="flex items-center gap-3 my-2">
                  <div className="h-px flex-1" style={{ background: C.borderStrong, opacity: 0.4 }} />
                  <span style={{ fontFamily: fonts.mono, fontSize: 11, letterSpacing: "0.18em", color: C.muted, textTransform: "uppercase" }}>or</span>
                  <div className="h-px flex-1" style={{ background: C.borderStrong, opacity: 0.4 }} />
                </div>

                <div className="space-y-3">
                  <EditorialOutlineBtn onClick={() => handleOAuth("google")}>
                    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden>
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.76h3.56c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.56-2.76c-.99.66-2.25 1.06-3.72 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.11A6.6 6.6 0 0 1 5.5 12c0-.73.13-1.44.34-2.11V7.05H2.18A11 11 0 0 0 1 12c0 1.77.42 3.45 1.18 4.95l3.66-2.84z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.05l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z"/>
                    </svg>
                    Continue with Google
                  </EditorialOutlineBtn>
                  <EditorialOutlineBtn onClick={() => handleOAuth("apple")}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                      <path d="M16.365 1.43c0 1.14-.42 2.22-1.18 3.04-.84.92-2.2 1.62-3.32 1.54-.14-1.1.42-2.26 1.16-3.02.84-.88 2.28-1.54 3.34-1.56zM20.5 17.4c-.56 1.28-.82 1.84-1.54 2.96-1 1.58-2.4 3.54-4.14 3.56-1.54.02-1.94-1-4.04-.98-2.1.02-2.54 1-4.08.98-1.74-.02-3.06-1.78-4.06-3.36C-.16 16.5-.46 11.34 1.6 8.6c1.46-1.96 3.76-3.1 5.92-3.1 2.2 0 3.58 1.2 5.4 1.2 1.76 0 2.84-1.2 5.38-1.2 1.92 0 3.94 1.04 5.4 2.84-4.74 2.6-3.96 9.36-3.2 9.06z"/>
                    </svg>
                    Continue with Apple
                  </EditorialOutlineBtn>
                </div>

                <button
                  type="button"
                  onClick={() => navigate(isSignup ? '/auth?mode=signin' : '/auth?mode=signup')}
                  style={{
                    fontFamily: fonts.sans,
                    fontSize: 14,
                    color: C.muted,
                    width: "100%",
                    textAlign: "center",
                  }}
                  className="hover:text-[#FAF5E9] transition-colors"
                >
                  {isSignup ? "Already have an account? Sign in" : "New here? Create an account"}
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

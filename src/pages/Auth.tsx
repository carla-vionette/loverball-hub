import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, ArrowLeft, Mail, CheckCircle2 } from "lucide-react";
import loverballLogo from "@/assets/loverball-script-logo.png";
import WelcomeSplash from "@/components/WelcomeSplash";

const LIVE_SITE_URL = 'https://loverball-hub.lovable.app';

type AuthMode = "join" | "signin" | "confirm" | "reset_sent" | "reset_password";

const Auth = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [mode, setMode] = useState<AuthMode>("join");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [splashName, setSplashName] = useState<string | null>(null);
  const [pendingRedirect, setPendingRedirect] = useState<string | null>(null);

  const redirectTo = searchParams.get('redirect') || '/watch';

  useEffect(() => {
    if (searchParams.get('reset') === 'true') setMode("reset_password");
    if (searchParams.get('signup') === 'true') setMode("join");
  }, [searchParams]);

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

    setLoading(true);
    try {
      // Generate a secure random password — user sets one only if they want via reset flow
      const tempPassword = crypto.randomUUID();

      const { error, data } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password: tempPassword,
        options: {
          data: { name: name.trim() },
          emailRedirectTo: `${LIVE_SITE_URL}/finish-profile`,
        },
      });

      if (error) throw error;

      if (data.user && !data.session) {
        // Email confirmation required
        setMode("confirm");
      } else if (data.user && data.session) {
        // Auto-confirmed (dev/magic link configs)
        navigate("/finish-profile");
      }
    } catch (err: any) {
      toast({ title: "Hmm, something went wrong", description: err.message, variant: "destructive" });
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
        .select('name, membership_tier')
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
        redirectTo: `${LIVE_SITE_URL}/auth?reset=true`,
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
      navigate("/watch");
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
      await supabase.auth.resend({
        type: 'signup',
        email,
        options: { emailRedirectTo: `${LIVE_SITE_URL}/finish-profile` },
      });
      toast({ title: "Sent! Check your inbox." });
    } catch {
      toast({ title: "Couldn't resend", variant: "destructive" });
    } finally {
      setResendLoading(false);
    }
  };

  // ── Google OAuth ─────────────────────────────────────────────────────
  const handleGoogleAuth = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${LIVE_SITE_URL}/finish-profile` },
    });
  };

  return (
    <>
      {splashName && pendingRedirect && (
        <WelcomeSplash name={splashName} onDismiss={() => navigate(pendingRedirect)} />
      )}

      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-5 py-12">
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-10"
        >
          <img src={loverballLogo} alt="Loverball" className="w-[160px] h-auto mx-auto" />
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
                  <h1 className="text-3xl font-sans font-semibold text-foreground leading-tight">
                    Join Loverball
                  </h1>
                  <p className="text-muted-foreground text-base">
                    Sign up in seconds.
                  </p>
                </div>

                <form onSubmit={handleSignUp} className="space-y-4">
                  <Input
                    type="text"
                    placeholder="Your name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    autoFocus
                    className="h-14 text-base rounded-2xl border-border/60 bg-background placeholder:text-foreground/30 focus:border-primary"
                  />
                  <Input
                    type="email"
                    placeholder="Email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="h-14 text-base rounded-2xl border-border/60 bg-background placeholder:text-foreground/30 focus:border-primary"
                  />

                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full h-14 text-base rounded-2xl font-semibold gap-2 group"
                  >
                    {loading ? "One sec..." : "Continue"}
                    {!loading && <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />}
                  </Button>
                </form>

                <div className="relative flex items-center gap-4">
                  <div className="flex-1 h-px bg-border/40" />
                  <span className="text-xs text-foreground/40 uppercase tracking-wider">or</span>
                  <div className="flex-1 h-px bg-border/40" />
                </div>

                <Button
                  type="button"
                  variant="outline"
                  onClick={handleGoogleAuth}
                  className="w-full h-14 rounded-2xl border-border/60 text-sm font-medium gap-3"
                >
                  <svg className="h-5 w-5" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                  Continue with Google
                </Button>

                <p className="text-center text-sm text-foreground/50">
                  Already a member?{" "}
                  <button
                    type="button"
                    onClick={() => setMode("signin")}
                    className="text-primary font-semibold hover:underline"
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
                  className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto"
                >
                  <Mail className="w-9 h-9 text-primary" />
                </motion.div>

                <div className="space-y-3">
                  <h2 className="text-2xl font-sans font-semibold text-foreground">You're almost in.</h2>
                  <p className="text-muted-foreground text-base leading-relaxed">
                    Check your email at{" "}
                    <span className="font-semibold text-foreground">{email}</span>{" "}
                    to confirm and finish setting up.
                  </p>
                </div>

                <div className="bg-muted/40 rounded-2xl px-5 py-4 text-sm text-foreground/60 leading-relaxed">
                  Didn't get it? Check spam, or{" "}
                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={resendLoading}
                    className="text-primary font-semibold hover:underline"
                  >
                    {resendLoading ? "Sending…" : "resend the email"}
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setMode("join")}
                  className="text-sm text-foreground/40 hover:text-foreground/70 transition-colors flex items-center gap-1.5 mx-auto"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
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
                  <h1 className="text-3xl font-sans font-semibold text-foreground">Welcome back</h1>
                  <p className="text-muted-foreground text-base">Sign in to your account.</p>
                </div>

                <form onSubmit={handleSignIn} className="space-y-4">
                  <Input
                    type="email"
                    placeholder="Email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoFocus
                    className="h-14 text-base rounded-2xl border-border/60 bg-background placeholder:text-foreground/30"
                  />
                  <Input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="h-14 text-base rounded-2xl border-border/60 bg-background placeholder:text-foreground/30"
                  />

                  <div className="text-right">
                    <button
                      type="button"
                      onClick={handleForgotPassword}
                      disabled={loading}
                      className="text-sm text-primary hover:underline"
                    >
                      Forgot password?
                    </button>
                  </div>

                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full h-14 text-base rounded-2xl font-semibold gap-2 group"
                  >
                    {loading ? "Signing in…" : "Sign in"}
                    {!loading && <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />}
                  </Button>
                </form>

                <div className="relative flex items-center gap-4">
                  <div className="flex-1 h-px bg-border/40" />
                  <span className="text-xs text-foreground/40 uppercase tracking-wider">or</span>
                  <div className="flex-1 h-px bg-border/40" />
                </div>

                <Button
                  type="button"
                  variant="outline"
                  onClick={handleGoogleAuth}
                  className="w-full h-14 rounded-2xl border-border/60 text-sm font-medium gap-3"
                >
                  <svg className="h-5 w-5" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                  Continue with Google
                </Button>

                <p className="text-center text-sm text-foreground/50">
                  New here?{" "}
                  <button
                    type="button"
                    onClick={() => { setMode("join"); setPassword(""); }}
                    className="text-primary font-semibold hover:underline"
                  >
                    Join Loverball
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
                <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-9 h-9 text-primary" />
                </div>
                <div className="space-y-2">
                  <h2 className="text-2xl font-sans font-semibold">Check your inbox</h2>
                  <p className="text-muted-foreground">
                    We sent a reset link to <span className="font-semibold text-foreground">{email}</span>.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setMode("signin")}
                  className="text-sm text-foreground/40 hover:text-foreground/70 transition-colors flex items-center gap-1.5 mx-auto"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
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
                  <h1 className="text-3xl font-sans font-semibold">Set a new password</h1>
                  <p className="text-muted-foreground">Make it something you'll remember.</p>
                </div>

                <form onSubmit={handleResetPassword} className="space-y-4">
                  <Input
                    type="password"
                    placeholder="New password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    autoFocus
                    className="h-14 text-base rounded-2xl border-border/60 bg-background placeholder:text-foreground/30"
                  />
                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full h-14 text-base rounded-2xl font-semibold"
                  >
                    {loading ? "Updating…" : "Update password"}
                  </Button>
                </form>
              </motion.div>
            )}

          </AnimatePresence>
        </div>

        {/* Footer */}
        <p className="mt-12 text-xs text-foreground/30 text-center max-w-xs">
          By joining, you agree to our{" "}
          <button onClick={() => navigate("/terms")} className="hover:underline">Terms</button>
          {" "}and{" "}
          <button onClick={() => navigate("/privacy")} className="hover:underline">Privacy Policy</button>.
        </p>
      </div>
    </>
  );
};

export default Auth;

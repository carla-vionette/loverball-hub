import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { lovable } from "@/integrations/lovable";
import loverballLogo from "@/assets/loverball-logo-black.png";
import { C, fonts } from "@/lib/editorialTheme";
import WelcomeSplash from "@/components/WelcomeSplash";

const OAuthBtn = ({
  children,
  onClick,
  disabled,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
}) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
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
      gap: 12,
      background: "transparent",
      color: C.text,
      border: `1px solid ${C.borderStrong}`,
      cursor: disabled ? "not-allowed" : "pointer",
      opacity: disabled ? 0.6 : 1,
      transition: "all 180ms ease",
    }}
    className="hover:bg-white/5 active:scale-[0.98]"
  >
    {children}
  </button>
);

const Auth = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState<"google" | "apple" | null>(null);
  const [splashName, setSplashName] = useState<string | null>(null);
  const [pendingRedirect, setPendingRedirect] = useState<string | null>(null);

  const isSignup = searchParams.get("mode") === "signup";
  const redirectTo = searchParams.get("redirect") || "/feed";
  const postAuthPath = isSignup ? "/onboarding?step=finish&welcome=1" : redirectTo;
  const redirectUri = `${window.location.origin}${postAuthPath}`;

  // If already signed in, show splash then forward
  useEffect(() => {
    let cancelled = false;
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (cancelled || !session) return;
      const { data: profile } = await supabase
        .from("profiles")
        .select("name")
        .eq("id", session.user.id)
        .maybeSingle();
      const dest = profile?.name ? redirectTo : "/onboarding?step=finish&welcome=1";
      if (profile?.name) {
        setSplashName(profile.name);
        setPendingRedirect(dest);
      } else {
        navigate(dest, { replace: true });
      }
    });
    return () => {
      cancelled = true;
    };
  }, [navigate, redirectTo]);

  const handleOAuth = async (provider: "google" | "apple") => {
    setLoading(provider);
    try {
      const result = await lovable.auth.signInWithOAuth(provider, { redirect_uri: redirectUri });
      if (result.error) {
        toast({
          title: `Couldn't continue with ${provider === "google" ? "Google" : "Apple"}`,
          description: result.error.message ?? String(result.error),
          variant: "destructive",
        });
        setLoading(null);
        return;
      }
      if (result.redirected) return;
      navigate(postAuthPath);
    } catch (err: any) {
      toast({
        title: `Couldn't continue with ${provider === "google" ? "Google" : "Apple"}`,
        description: err?.message ?? String(err),
        variant: "destructive",
      });
      setLoading(null);
    }
  };

  const gradientBg = `radial-gradient(circle at 30% 20%, ${C.raspberry}22, transparent 60%), radial-gradient(circle at 70% 80%, ${C.pink}22, transparent 60%)`;

  return (
    <>
      {splashName && pendingRedirect && (
        <WelcomeSplash name={splashName} onDismiss={() => navigate(pendingRedirect)} />
      )}

      <div
        className="min-h-[100dvh] flex flex-col items-center justify-center px-6 py-12 relative"
        style={{ background: C.bg }}
      >
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-10" style={{ background: gradientBg }} />

        <motion.img
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          src={loverballLogo}
          alt="Loverball"
          className="h-9 md:h-10 w-auto mb-10"
          loading="lazy"
          decoding="async"
        />

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="w-full max-w-sm space-y-8"
        >
          <div className="text-center space-y-3">
            <h1
              style={{
                fontFamily: "'Anton', Impact, sans-serif",
                fontWeight: 400,
                fontSize: "clamp(32px, 6vw, 48px)",
                lineHeight: 0.95,
                letterSpacing: "-0.01em",
                textTransform: "uppercase",
                color: C.text,
              }}
            >
              {isSignup ? "JOIN US!" : "WELCOME BACK"}
            </h1>
            <p style={{ fontFamily: fonts.sans, fontSize: 16, lineHeight: 1.55, color: C.muted }}>
              {isSignup
                ? "Sign up in one tap with Google or Apple."
                : "Sign in with Google or Apple to continue."}
            </p>
          </div>

          <div className="space-y-3">
            <OAuthBtn onClick={() => handleOAuth("google")} disabled={loading !== null}>
              <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden>
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.76h3.56c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.56-2.76c-.99.66-2.25 1.06-3.72 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.11A6.6 6.6 0 0 1 5.5 12c0-.73.13-1.44.34-2.11V7.05H2.18A11 11 0 0 0 1 12c0 1.77.42 3.45 1.18 4.95l3.66-2.84z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.05l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z"/>
              </svg>
              {loading === "google" ? "Opening Google…" : "Continue with Google"}
            </OAuthBtn>

            <OAuthBtn onClick={() => handleOAuth("apple")} disabled={loading !== null}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                <path d="M16.365 1.43c0 1.14-.42 2.22-1.18 3.04-.84.92-2.2 1.62-3.32 1.54-.14-1.1.42-2.26 1.16-3.02.84-.88 2.28-1.54 3.34-1.56zM20.5 17.4c-.56 1.28-.82 1.84-1.54 2.96-1 1.58-2.4 3.54-4.14 3.56-1.54.02-1.94-1-4.04-.98-2.1.02-2.54 1-4.08.98-1.74-.02-3.06-1.78-4.06-3.36C-.16 16.5-.46 11.34 1.6 8.6c1.46-1.96 3.76-3.1 5.92-3.1 2.2 0 3.58 1.2 5.4 1.2 1.76 0 2.84-1.2 5.38-1.2 1.92 0 3.94 1.04 5.4 2.84-4.74 2.6-3.96 9.36-3.2 9.06z"/>
              </svg>
              {loading === "apple" ? "Opening Apple…" : "Continue with Apple"}
            </OAuthBtn>
          </div>

          <button
            type="button"
            onClick={() => {
              const next = isSignup ? "signin" : "signup";
              const r = searchParams.get("redirect");
              navigate(`/auth?mode=${next}${r ? `&redirect=${encodeURIComponent(r)}` : ""}`);
            }}
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
      </div>
    </>
  );
};

export default Auth;

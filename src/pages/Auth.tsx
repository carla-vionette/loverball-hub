import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Sparkles, Mail, Phone } from "lucide-react";
import loverballLogo from "@/assets/loverball-script-logo.png";
import { z } from "zod";

const ACCESS_CODE = "7688";
const LIVE_SITE_URL = "https://loverball-hub.lovable.app";

const emailSchema = z.string().trim().email("Enter a valid email");
const phoneSchema = z
  .string()
  .trim()
  .regex(/^\+?[1-9]\d{7,14}$/, "Enter a valid phone (e.g. +13105551234)");
const nameSchema = z.string().trim().min(1, "Add your name").max(60);

type Method = "email" | "phone";
type Stage = "invite" | "form" | "sent" | "code" | "signin";

const Auth = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get("redirect") || "/finish-profile";

  // Skip invite if already verified earlier in this browser
  const [stage, setStage] = useState<Stage>(
    localStorage.getItem("loverball_invite_ok") === "1" ? "form" : "invite"
  );
  const [method, setMethod] = useState<Method>("phone");
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [code, setCode] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // If they land here already signed in, send them onward
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate(redirectTo);
    });
  }, [navigate, redirectTo]);

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (inviteCode.trim() === ACCESS_CODE) {
      localStorage.setItem("loverball_invite_ok", "1");
      setStage("form");
      setError("");
    } else {
      setError("Hmm, that code isn't right.");
      setInviteCode("");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const nameCheck = nameSchema.safeParse(name);
    if (!nameCheck.success) {
      setError(nameCheck.error.errors[0].message);
      return;
    }

    if (method === "email") {
      const c = emailSchema.safeParse(contact);
      if (!c.success) return setError(c.error.errors[0].message);
    } else {
      const normalized = contact.startsWith("+") ? contact : `+1${contact.replace(/\D/g, "")}`;
      const c = phoneSchema.safeParse(normalized);
      if (!c.success) return setError(c.error.errors[0].message);
      setContact(normalized);
    }

    setLoading(true);
    try {
      if (method === "email") {
        const { error } = await supabase.auth.signInWithOtp({
          email: contact.trim(),
          options: {
            emailRedirectTo: `${LIVE_SITE_URL}/finish-profile`,
            data: { name: name.trim() },
            shouldCreateUser: true,
          },
        });
        if (error) throw error;
        setStage("sent");
      } else {
        const phone = contact.startsWith("+") ? contact : `+1${contact.replace(/\D/g, "")}`;
        const { error } = await supabase.auth.signInWithOtp({
          phone,
          options: {
            data: { name: name.trim() },
            shouldCreateUser: true,
          },
        });
        if (error) throw error;
        setContact(phone);
        setStage("code");
      }
    } catch (err: any) {
      setError(err.message || "Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (code.length < 6) return setError("Enter the 6-digit code");
    setLoading(true);
    try {
      const { error } = await supabase.auth.verifyOtp({
        phone: contact,
        token: code,
        type: "sms",
      });
      if (error) throw error;
      toast({ title: "You're in 🎉", description: "Let's finish your profile." });
      navigate("/finish-profile");
    } catch (err: any) {
      setError(err.message || "Invalid code");
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (contact.includes("@")) {
        const c = emailSchema.safeParse(contact);
        if (!c.success) throw new Error(c.error.errors[0].message);
        const { error } = await supabase.auth.signInWithOtp({
          email: contact.trim(),
          options: {
            emailRedirectTo: `${LIVE_SITE_URL}${redirectTo}`,
            shouldCreateUser: false,
          },
        });
        if (error) throw error;
        setMethod("email");
        setStage("sent");
      } else {
        const phone = contact.startsWith("+") ? contact : `+1${contact.replace(/\D/g, "")}`;
        const c = phoneSchema.safeParse(phone);
        if (!c.success) throw new Error(c.error.errors[0].message);
        const { error } = await supabase.auth.signInWithOtp({
          phone,
          options: { shouldCreateUser: false },
        });
        if (error) throw error;
        setMethod("phone");
        setContact(phone);
        setStage("code");
      }
    } catch (err: any) {
      setError(err.message || "Couldn't reach you. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] bg-background flex flex-col">
      {/* Top */}
      <div className="flex items-center justify-between px-5 pt-6 pb-2">
        {stage !== "invite" && stage !== "form" ? (
          <button
            onClick={() => {
              setError("");
              setCode("");
              setStage(stage === "signin" ? "form" : "form");
            }}
            className="p-2 -ml-2 text-foreground/70 hover:text-foreground"
            aria-label="Back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        ) : (
          <span className="w-9" />
        )}
        <img src={loverballLogo} alt="Loverball" className="h-9 w-auto" />
        <span className="w-9" />
      </div>

      <div className="flex-1 flex flex-col justify-center px-6 pb-10 max-w-md w-full mx-auto">
        <AnimatePresence mode="wait">
          {/* INVITE GATE */}
          {stage === "invite" && (
            <motion.form
              key="invite"
              onSubmit={handleInvite}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <div className="space-y-2 text-center">
                <Sparkles className="w-8 h-8 text-primary mx-auto" />
                <h1 className="text-3xl font-semibold text-foreground">You're invited.</h1>
                <p className="text-foreground/60">Drop your invite code to join the party.</p>
              </div>
              <Input
                inputMode="numeric"
                maxLength={4}
                autoFocus
                placeholder="• • • •"
                value={inviteCode}
                onChange={(e) => {
                  setInviteCode(e.target.value);
                  setError("");
                }}
                className="h-14 text-center text-2xl tracking-[0.5em]"
              />
              {error && <p className="text-destructive text-sm text-center">{error}</p>}
              <Button type="submit" className="w-full h-14 text-base rounded-2xl">
                Continue
              </Button>
            </motion.form>
          )}

          {/* SIGNUP FORM */}
          {stage === "form" && (
            <motion.form
              key="form"
              onSubmit={handleSubmit}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <div className="space-y-2">
                <h1 className="text-4xl font-semibold tracking-tight text-foreground">
                  Join Loverball
                </h1>
                <p className="text-foreground/60 text-base">Sign up in seconds.</p>
              </div>

              {/* method toggle */}
              <div className="grid grid-cols-2 gap-2 p-1 bg-secondary rounded-2xl">
                <button
                  type="button"
                  onClick={() => {
                    setMethod("phone");
                    setContact("");
                    setError("");
                  }}
                  className={`flex items-center justify-center gap-2 h-11 rounded-xl text-sm font-medium transition-colors ${
                    method === "phone"
                      ? "bg-background text-foreground shadow-sm"
                      : "text-foreground/60"
                  }`}
                >
                  <Phone className="w-4 h-4" /> Text
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMethod("email");
                    setContact("");
                    setError("");
                  }}
                  className={`flex items-center justify-center gap-2 h-11 rounded-xl text-sm font-medium transition-colors ${
                    method === "email"
                      ? "bg-background text-foreground shadow-sm"
                      : "text-foreground/60"
                  }`}
                >
                  <Mail className="w-4 h-4" /> Email
                </button>
              </div>

              <div className="space-y-3">
                <Input
                  type="text"
                  placeholder="Your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoComplete="given-name"
                  className="h-14 rounded-2xl text-base"
                />
                <Input
                  type={method === "email" ? "email" : "tel"}
                  inputMode={method === "email" ? "email" : "tel"}
                  placeholder={method === "email" ? "you@email.com" : "(555) 123-4567"}
                  value={contact}
                  onChange={(e) => setContact(e.target.value)}
                  autoComplete={method === "email" ? "email" : "tel"}
                  className="h-14 rounded-2xl text-base"
                />
              </div>

              {error && <p className="text-destructive text-sm">{error}</p>}

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-14 text-base rounded-2xl"
              >
                {loading ? "Sending..." : "Continue"}
              </Button>

              <p className="text-xs text-foreground/50 text-center leading-relaxed">
                We'll {method === "email" ? "email" : "text"} you a confirmation
                {method === "phone" ? " code" : " link"}. By continuing you agree to our{" "}
                <a href="/terms" className="underline">Terms</a> &{" "}
                <a href="/privacy" className="underline">Privacy</a>.
              </p>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setStage("signin");
                    setError("");
                  }}
                  className="text-sm text-foreground/60 hover:text-foreground"
                >
                  Already have an account? <span className="text-primary font-medium">Sign in</span>
                </button>
              </div>
            </motion.form>
          )}

          {/* SIGN IN (existing accounts) */}
          {stage === "signin" && (
            <motion.form
              key="signin"
              onSubmit={handleSignIn}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <div className="space-y-2">
                <h1 className="text-4xl font-semibold tracking-tight text-foreground">
                  Welcome back
                </h1>
                <p className="text-foreground/60">Enter your phone or email to sign in.</p>
              </div>
              <Input
                type="text"
                placeholder="Phone or email"
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                autoFocus
                className="h-14 rounded-2xl text-base"
              />
              {error && <p className="text-destructive text-sm">{error}</p>}
              <Button type="submit" disabled={loading} className="w-full h-14 text-base rounded-2xl">
                {loading ? "Sending..." : "Send code"}
              </Button>
              <div className="text-center">
                <button
                  type="button"
                  onClick={() => {
                    setStage("form");
                    setError("");
                  }}
                  className="text-sm text-foreground/60"
                >
                  New here? <span className="text-primary font-medium">Create an account</span>
                </button>
              </div>
            </motion.form>
          )}

          {/* SENT (email magic link) */}
          {stage === "sent" && (
            <motion.div
              key="sent"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6 text-center"
            >
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                <Mail className="w-7 h-7 text-primary" />
              </div>
              <div className="space-y-2">
                <h1 className="text-3xl font-semibold text-foreground">You're in.</h1>
                <p className="text-foreground/60">
                  Check your email at <span className="font-semibold text-foreground">{contact}</span> to confirm and finish your profile.
                </p>
              </div>
              <div className="bg-secondary rounded-2xl p-4 text-sm text-foreground/60">
                Don't see it? Peek in your spam folder — it can take a minute.
              </div>
              <Button
                variant="outline"
                onClick={() => setStage("form")}
                className="w-full h-12 rounded-2xl"
              >
                Use a different {method === "email" ? "email" : "number"}
              </Button>
            </motion.div>
          )}

          {/* CODE (phone OTP) */}
          {stage === "code" && (
            <motion.form
              key="code"
              onSubmit={handleVerifyCode}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <div className="space-y-2 text-center">
                <h1 className="text-3xl font-semibold text-foreground">Check your texts</h1>
                <p className="text-foreground/60">
                  We sent a 6-digit code to <span className="font-semibold text-foreground">{contact}</span>.
                </p>
              </div>
              <Input
                inputMode="numeric"
                maxLength={6}
                autoFocus
                placeholder="• • • • • •"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                className="h-16 text-center text-3xl tracking-[0.4em]"
              />
              {error && <p className="text-destructive text-sm text-center">{error}</p>}
              <Button type="submit" disabled={loading} className="w-full h-14 text-base rounded-2xl">
                {loading ? "Verifying..." : "Verify & continue"}
              </Button>
              <div className="text-center">
                <button
                  type="button"
                  onClick={() => setStage("form")}
                  className="text-sm text-foreground/60"
                >
                  Wrong number? <span className="text-primary font-medium">Edit</span>
                </button>
              </div>
            </motion.form>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Auth;

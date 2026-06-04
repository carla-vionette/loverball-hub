import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, ArrowLeft, Mail, Phone, Check } from "lucide-react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import loverballLogo from "@/assets/loverball-script-logo.png";
import { isAuthEmailRateLimitError } from "@/lib/authErrors";

type Method = "email" | "phone";
type Step = "details" | "verify" | "done";

const emailSchema = z.string().trim().email("Please enter a valid email");
// Loose phone validation — Supabase requires E.164. We'll normalize US numbers.
const phoneSchema = z.string().trim().min(7, "Enter a valid phone number");

const normalizePhone = (raw: string) => {
  const digits = raw.replace(/[^\d+]/g, "");
  if (digits.startsWith("+")) return digits;
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  return digits.startsWith("+") ? digits : `+${digits}`;
};

export default function Signup() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [step, setStep] = useState<Step>("details");
  const [method, setMethod] = useState<Method>("email");
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);

  // If already signed in, push them forward
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) navigate("/finish-profile", { replace: true });
    });
  }, [navigate]);

  const sentTo = method === "email" ? contact : normalizePhone(contact);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast({ title: "What's your name?", description: "We need that to get you in.", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      if (method === "email") {
        const parsed = emailSchema.safeParse(contact);
        if (!parsed.success) throw new Error(parsed.error.errors[0].message);
        const { error } = await supabase.auth.signInWithOtp({
          email: parsed.data,
          options: {
            shouldCreateUser: true,
            data: { name: name.trim() },
          },
        });
        if (error) throw error;
      } else {
        const parsed = phoneSchema.safeParse(contact);
        if (!parsed.success) throw new Error(parsed.error.errors[0].message);
        const phone = normalizePhone(parsed.data);
        const { error } = await supabase.auth.signInWithOtp({
          phone,
          options: {
            shouldCreateUser: true,
            data: { name: name.trim() },
          },
        });
        if (error) throw error;
      }
      setStep("verify");
    } catch (err: any) {
      const msg = String(err?.message || "");
      const isCarrier = /unsupported carrier|not a mobile number|invalid.*phone|sms.*not.*supported|landline/i.test(msg);
      if (method === "phone" && isCarrier) {
        toast({
          title: "That number can't receive our code",
          description: "Your carrier isn't supported yet. Switching you to email — way more reliable.",
          variant: "destructive",
        });
        setMethod("email");
        setContact("");
      } else if (method === "email" && isAuthEmailRateLimitError(msg)) {
        toast({
          title: "Email confirmations are temporarily delayed",
          description: "Try the phone option instead, or retry email in a little bit.",
          variant: "destructive",
        });
      } else {
        toast({ title: "Couldn't send code", description: msg || "Try again in a moment.", variant: "destructive" });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.trim().length < 6) return;
    setLoading(true);
    try {
      const { data, error } = method === "email"
        ? await supabase.auth.verifyOtp({ email: contact.trim(), token: otp.trim(), type: "email" })
        : await supabase.auth.verifyOtp({ phone: normalizePhone(contact), token: otp.trim(), type: "sms" });
      if (error) throw error;
      if (!data.user) throw new Error("Verification failed");

      // Ensure a profile row exists with their name
      const { data: existing } = await supabase
        .from("profiles")
        .select("id")
        .eq("id", data.user.id)
        .maybeSingle();
      if (!existing) {
        await supabase.from("profiles").insert({ id: data.user.id, name: name.trim() });
      }
      setStep("done");
    } catch (err: any) {
      toast({ title: "Invalid code", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] bg-background flex flex-col">
      <header className="px-6 pt-8 pb-4 flex items-center justify-center">
        <img src={loverballLogo} alt="Loverball" className="h-10 w-auto" loading="lazy" decoding="async" />
      </header>

      <main className="flex-1 flex flex-col px-6 py-6 max-w-md mx-auto w-full">
        <AnimatePresence mode="wait">
          {step === "details" && (
            <motion.div
              key="details"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.25 }}
              className="flex-1 flex flex-col"
            >
              <div className="mb-8">
                <h1 className="text-4xl font-serif tracking-tight text-foreground uppercase">JOIN US!</h1>
                <p className="text-foreground/60 mt-2 text-base">Sign up in seconds.</p>
              </div>

              <form onSubmit={handleSend} className="space-y-5 flex-1">
                <div className="space-y-2">
                  <label htmlFor="name" className="text-sm font-medium text-foreground">Your name</label>
                  <Input
                    id="name"
                    autoFocus
                    autoComplete="given-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="What should we call you?"
                    className="h-14 text-base rounded-2xl"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label htmlFor="contact" className="text-sm font-medium text-foreground">
                      {method === "email" ? "Email" : "Phone"}
                    </label>
                    <button
                      type="button"
                      onClick={() => { setMethod(method === "email" ? "phone" : "email"); setContact(""); }}
                      className="text-xs font-medium text-primary inline-flex items-center gap-1"
                    >
                      {method === "email" ? <><Phone className="w-3 h-3" /> Use phone</> : <><Mail className="w-3 h-3" /> Use email</>}
                    </button>
                  </div>
                  <Input
                    id="contact"
                    type={method === "email" ? "email" : "tel"}
                    inputMode={method === "email" ? "email" : "tel"}
                    autoComplete={method === "email" ? "email" : "tel"}
                    value={contact}
                    onChange={(e) => setContact(e.target.value)}
                    placeholder={method === "email" ? "you@example.com" : "(555) 123-4567"}
                    className="h-14 text-base rounded-2xl"
                  />
                  <p className="text-xs text-foreground/50 pt-1">
                    We'll {method === "email" ? "email" : "text"} you a confirmation code.
                    {method === "phone" && " US mobile numbers only — if it fails, switch to email."}
                  </p>
                </div>

                <div className="pt-4">
                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full h-14 rounded-2xl text-base font-semibold"
                  >
                    {loading ? "Sending…" : "Continue"}
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </div>
              </form>

              <p className="text-center text-sm text-foreground/60 mt-6">
                Already have an account?{" "}
                <button onClick={() => navigate("/auth")} className="text-primary font-medium">Sign in</button>
              </p>
            </motion.div>
          )}

          {step === "verify" && (
            <motion.div
              key="verify"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.25 }}
              className="flex-1 flex flex-col"
            >
              <button
                type="button"
                onClick={() => setStep("details")}
                className="self-start mb-6 text-sm text-foreground/60 inline-flex items-center gap-1"
              >
                <ArrowLeft className="w-4 h-4" /> Back
              </button>

              <div className="mb-8">
                <h1 className="text-3xl font-serif tracking-tight text-foreground">Enter your code</h1>
                <p className="text-foreground/60 mt-2 text-base">
                  Sent to <span className="text-foreground font-medium">{sentTo}</span>
                </p>
              </div>

              <form onSubmit={handleVerify} className="space-y-5 flex-1">
                <Input
                  autoFocus
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                  placeholder="••••••"
                  className="h-16 text-center text-2xl tracking-[0.5em] rounded-2xl"
                />

                <Button
                  type="submit"
                  disabled={loading || otp.length < 6}
                  className="w-full h-14 rounded-2xl text-base font-semibold"
                >
                  {loading ? "Verifying…" : "Verify"}
                </Button>

                <button
                  type="button"
                  onClick={(e) => { e.preventDefault(); handleSend(e as any); }}
                  disabled={loading}
                  className="w-full text-center text-sm text-foreground/60"
                >
                  Didn't get it? <span className="text-primary font-medium">Resend</span>
                </button>
              </form>
            </motion.div>
          )}

          {step === "done" && (
            <motion.div
              key="done"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
              className="flex-1 flex flex-col items-center justify-center text-center"
            >
              <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-6">
                <Check className="w-10 h-10 text-primary" strokeWidth={3} />
              </div>
              <h1 className="text-4xl font-serif tracking-tight text-foreground">You're in.</h1>
              <p className="text-foreground/60 mt-3 text-base max-w-xs">
                Welcome to Loverball, {name.split(" ")[0]}. Now let's finish your profile.
              </p>
              <div className="mt-10 w-full space-y-3">
                <Button
                  onClick={() => navigate("/finish-profile")}
                  className="w-full h-14 rounded-2xl text-base font-semibold"
                >
                  Finish profile
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => {
                    const r = sessionStorage.getItem("postAuthRedirect");
                    if (r) sessionStorage.removeItem("postAuthRedirect");
                    navigate(r || "/watch");
                  }}
                  className="w-full h-12 rounded-2xl text-foreground/60"
                >
                  Skip for now
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

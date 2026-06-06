import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Drawer, DrawerContent } from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft } from "lucide-react";
import { C, fonts } from "@/lib/editorialTheme";
import { useToast } from "@/hooks/use-toast";
import type { RsvpIntent } from "@/components/EventRSVPDialog";
import { normalizeUSPhone, formatUSPhone, friendlyPhoneAuthError } from "@/lib/phone";
import loverballLogo from "@/assets/loverball-script-logo.png";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  eventId: string;
  eventTitle: string;
  intent: RsvpIntent;
  onVerified: (intent: RsvpIntent) => Promise<void> | void;
}

const labelStyle: React.CSSProperties = {
  fontFamily: fonts.mono,
  color: "#374151",
  fontSize: 12,
  letterSpacing: "0.18em",
  textTransform: "uppercase",
  display: "block",
  width: "100%",
  marginBottom: 8,
  fontWeight: 600,
};

const inputBaseClass =
  "block w-full rounded-2xl border-2 border-[#D4CFC5] bg-white shadow-sm text-[#1A1A1A] placeholder:text-[#9CA3AF] focus-visible:border-[#E85D2F] focus-visible:ring-0 focus-visible:ring-offset-0 transition-colors";

const inputHeightStyle: React.CSSProperties = {
  height: 52,
  minHeight: 44,
  fontSize: 17,
  display: "block",
  width: "100%",
};

const intentLabel = (i: RsvpIntent) =>
  i === "attending" ? "going" : i === "waitlisted" ? "maybe" : "can't go";

/** Normalize to strict E.164 US (+1XXXXXXXXXX). Returns null when invalid. */
function normalizePhone(raw: string): string | null {
  return normalizeUSPhone(raw);
}

const RESEND_SECONDS = 30;
const gradientBg = `radial-gradient(circle at 30% 20%, ${C.raspberry}22, transparent 60%), radial-gradient(circle at 70% 80%, ${C.pink}22, transparent 60%)`;

const RsvpPhoneSheet = ({ open, onOpenChange, eventId, eventTitle, intent, onVerified }: Props) => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [method, setMethod] = useState<"phone" | "email">("email");
  const [step, setStep] = useState<"capture" | "otp">("capture");
  const [firstName, setFirstName] = useState("");
  const [phoneRaw, setPhoneRaw] = useState("");
  const [phoneE164, setPhoneE164] = useState("");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [resendIn, setResendIn] = useState(0);
  const [fieldErrors, setFieldErrors] = useState<{
    firstName?: string;
    email?: string;
    phone?: string;
    code?: string;
  }>({});
  const codeInputRef = useRef<HTMLInputElement>(null);

  const clearFieldError = (k: "firstName" | "email" | "phone" | "code") =>
    setFieldErrors((p) => (p[k] ? { ...p, [k]: undefined } : p));

  // Reset when reopened
  useEffect(() => {
    if (!open) return;
    setMethod("email");
    setStep("capture");
    setCode("");
    setErr(null);
    setInfo(null);
    setLoading(false);
    setResendIn(0);
    setFieldErrors({});
  }, [open]);

  // Resend timer
  useEffect(() => {
    if (resendIn <= 0) return;
    const t = setTimeout(() => setResendIn((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [resendIn]);

  useEffect(() => {
    if (step === "otp") {
      setTimeout(() => codeInputRef.current?.focus(), 50);
    }
  }, [step]);

  const persistIntent = () => {
    try { localStorage.setItem(`pending_rsvp_${eventId}`, intent); } catch { /* ignore */ }
    try { if (firstName.trim()) localStorage.setItem("pending_first_name", firstName.trim()); } catch { /* ignore */ }
  };

  const isValidEmail = (s: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s.trim());

  const switchToEmail = (reason?: string) => {
    setMethod("email");
    setStep("capture");
    setCode("");
    setErr(null);
    setInfo(
      reason ||
        "Text messages aren't available right now — we'll send your code by email instead."
    );
  };

  const sendPhoneCode = async (phoneToSend: string) => {
    setLoading(true);
    setErr(null);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        phone: phoneToSend,
        options: { channel: "sms" },
      });
      if (error) throw error;
      setResendIn(RESEND_SECONDS);
      setStep("otp");
    } catch {
      switchToEmail("Text isn't going through — enter your email and we'll send the code there.");
      return;
    } finally {
      setLoading(false);
    }
  };

  const sendEmailCode = async (emailToSend: string) => {
    setLoading(true);
    setErr(null);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: emailToSend,
        options: {
          shouldCreateUser: true,
          emailRedirectTo: `${window.location.origin}/e/${eventId}`,
        },
      });
      if (error) throw error;
      setResendIn(RESEND_SECONDS);
      setStep("otp");
      setInfo(null);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Couldn't send code. Try again.";
      setErr(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleCaptureSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);

    const errors: typeof fieldErrors = {};
    const name = firstName.trim();
    if (!name) {
      errors.firstName = "Please enter your first name.";
    } else if (name.length < 2) {
      errors.firstName = "First name must be at least 2 characters.";
    } else if (name.length > 50) {
      errors.firstName = "First name must be 50 characters or fewer.";
    }

    if (method === "email") {
      const trimmed = email.trim();
      if (!trimmed) {
        errors.email = "Please enter your email address.";
      } else if (!isValidEmail(trimmed)) {
        errors.email = "That doesn't look like a valid email — try name@example.com.";
      }
    } else {
      const normalized = normalizePhone(phoneRaw);
      if (!phoneRaw.trim()) {
        errors.phone = "Please enter your mobile number.";
      } else if (!normalized) {
        errors.phone = "Enter a valid 10-digit US mobile number, e.g. (555) 123-4567.";
      }
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }
    setFieldErrors({});
    persistIntent();

    if (method === "email") {
      await sendEmailCode(email.trim());
      return;
    }
    const normalized = normalizePhone(phoneRaw)!;
    setPhoneE164(normalized);
    await sendPhoneCode(normalized);
  };

  const handleVerify = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!/^\d{6}$/.test(code)) {
      setFieldErrors((p) => ({ ...p, code: "Enter the 6-digit code we sent you." }));
      return;
    }
    setFieldErrors((p) => ({ ...p, code: undefined }));
    setLoading(true);
    setErr(null);
    try {
      const { data, error } =
        method === "email"
          ? await supabase.auth.verifyOtp({
              email: email.trim(),
              token: code.trim(),
              type: "email",
            })
          : await supabase.auth.verifyOtp({
              phone: phoneE164,
              token: code.trim(),
              type: "sms",
            });
      if (error) throw error;
      const uid = data.user?.id;
      if (uid) {
        const { data: existing } = await supabase
          .from("profiles")
          .select("id, name, has_completed_onboarding")
          .eq("id", uid)
          .maybeSingle();
        if (!existing) {
          await supabase.from("profiles").insert({ id: uid, name: firstName.trim() });
        } else if (!existing.name || existing.name.trim() === "") {
          await supabase.from("profiles").update({ name: firstName.trim() }).eq("id", uid);
        }
        await onVerified(intent);
        onOpenChange(false);
        const isReturning = !!existing?.has_completed_onboarding;
        navigate(`/rsvp/confirmed/${eventId}?returning=${isReturning ? "1" : "0"}`, { replace: false });
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "That code didn't match. Try again.";
      const friendly = friendlyPhoneAuthError(msg);
      const message = friendly ? `${friendly.title}. ${friendly.description}` : msg;
      setFieldErrors((p) => ({ ...p, code: message }));
      setCode("");
      setTimeout(() => codeInputRef.current?.focus(), 30);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendIn > 0) return;
    if (method === "email") {
      if (!email) return;
      await sendEmailCode(email.trim());
      toast({ title: "Code sent", description: "Check your inbox (and spam)." });
    } else {
      if (!phoneE164) return;
      await sendPhoneCode(phoneE164);
      toast({ title: "Code sent", description: "Check your texts." });
    }
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent
        className="border-0 px-0 pb-[env(safe-area-inset-bottom)] relative max-h-[100dvh] h-[100dvh] overflow-y-auto"
        style={{ background: `${gradientBg}, ${C.bg}`, color: C.text }}
      >
        <div className="min-h-[100dvh] w-full flex items-center justify-center px-4 py-6">
          <div className="w-full max-w-[420px] mx-auto flex flex-col gap-4">
          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-5 flex justify-center"
          >
            <img
              src={loverballLogo}
              alt="Loverball"
              className="w-[120px] h-auto"
              style={{ filter: "brightness(0) invert(1)" }}
              loading="lazy"
              decoding="async"
            />
          </motion.div>

          {/* Event chip */}
          <div className="text-center mb-4">
            <div
              className="text-[10px] uppercase tracking-[0.3em]"
              style={{ fontFamily: fonts.mono, color: C.raspberry }}
            >
              RSVP · {intentLabel(intent)}
            </div>
            <div
              className="line-clamp-1 mt-1"
              style={{ fontFamily: fonts.serif, fontStyle: "italic", fontSize: 20, color: C.text }}
            >
              {eventTitle}
            </div>
          </div>

          {step === "capture" && (
            <div className="bg-white rounded-2xl shadow-lg p-6 sm:p-8">
              <h2
                className="text-center mb-1"
                style={{ fontFamily: fonts.serif, fontStyle: "italic", fontSize: 30, lineHeight: 1.05 }}
              >
                Reserve your spot.
              </h2>
              <p className="text-center mb-6" style={{ color: C.muted, fontSize: 13 }}>
                {method === "email"
                  ? "We'll email you a 6-digit code. No password, no spam."
                  : "We'll text a 6-digit code. No password, no spam."}
              </p>

              {info && (
                <div
                  className="text-sm rounded-xl px-3 py-2 mb-4"
                  style={{
                    background: `${C.raspberry}14`,
                    color: C.text,
                    border: `1px solid ${C.raspberry}33`,
                  }}
                  role="status"
                >
                  {info}
                </div>
              )}

              <form onSubmit={handleCaptureSubmit} className="flex flex-col gap-4 w-full" noValidate>
                <div className="flex flex-col w-full">
                  <label style={labelStyle} htmlFor="rsvp-first-name">First name</label>
                  <Input
                    id="rsvp-first-name"
                    value={firstName}
                    onChange={(e) => { setFirstName(e.target.value); clearFieldError("firstName"); }}
                    autoComplete="given-name"
                    className={inputBaseClass}
                    style={{
                      ...inputHeightStyle,
                      borderColor: fieldErrors.firstName ? C.raspberry : undefined,
                    }}
                    aria-invalid={!!fieldErrors.firstName}
                    aria-describedby={fieldErrors.firstName ? "rsvp-first-name-err" : undefined}
                    required
                    autoFocus
                  />
                  {fieldErrors.firstName && (
                    <p id="rsvp-first-name-err" className="mt-2 text-[12px]" style={{ color: C.raspberry }} role="alert">
                      {fieldErrors.firstName}
                    </p>
                  )}
                </div>

                {method === "phone" ? (
                  <div className="flex flex-col w-full">
                    <label style={labelStyle} htmlFor="rsvp-phone">Mobile number</label>
                    <div className="flex gap-2 items-stretch">
                      <div
                        className="flex items-center justify-center select-none rounded-2xl border-2 border-[#D4CFC5] bg-white shadow-sm"
                        aria-hidden="true"
                        style={{
                          width: 78,
                          padding: "0 12px",
                          fontFamily: fonts.sans,
                          fontWeight: 600,
                          whiteSpace: "nowrap",
                          height: 52,
                          fontSize: 17,
                          color: "#1A1A1A",
                        }}
                      >
                        🇺🇸 +1
                      </div>
                      <Input
                        id="rsvp-phone"
                        type="tel"
                        inputMode="tel"
                        placeholder="(555) 123-4567"
                        value={phoneRaw}
                        onChange={(e) => { setPhoneRaw(formatUSPhone(e.target.value)); clearFieldError("phone"); }}
                        maxLength={14}
                        autoComplete="tel"
                        className={`${inputBaseClass} flex-1`}
                        style={{
                          ...inputHeightStyle,
                          borderColor: fieldErrors.phone ? C.raspberry : undefined,
                        }}
                        aria-invalid={!!fieldErrors.phone}
                        aria-describedby={fieldErrors.phone ? "rsvp-phone-err" : undefined}
                        required
                      />
                    </div>
                    {fieldErrors.phone ? (
                      <p id="rsvp-phone-err" className="mt-2 text-[12px]" style={{ color: C.raspberry }} role="alert">
                        {fieldErrors.phone}
                      </p>
                    ) : (
                      <p className="mt-2 text-[11px]" style={{ color: C.muted, fontFamily: fonts.mono, letterSpacing: "0.1em" }}>
                        US mobile numbers only · standard message rates apply
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col w-full">
                    <label style={labelStyle} htmlFor="rsvp-email">Email</label>
                    <Input
                      id="rsvp-email"
                      type="email"
                      inputMode="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => { setEmail(e.target.value); clearFieldError("email"); }}
                      autoComplete="email"
                      className={inputBaseClass}
                      style={{
                        ...inputHeightStyle,
                        borderColor: fieldErrors.email ? C.raspberry : undefined,
                      }}
                      aria-invalid={!!fieldErrors.email}
                      aria-describedby={fieldErrors.email ? "rsvp-email-err" : undefined}
                      required
                    />
                    {fieldErrors.email ? (
                      <p id="rsvp-email-err" className="mt-2 text-[12px]" style={{ color: C.raspberry }} role="alert">
                        {fieldErrors.email}
                      </p>
                    ) : (
                      <p className="mt-2 text-[11px]" style={{ color: C.muted, fontFamily: fonts.mono, letterSpacing: "0.1em" }}>
                        We'll send a 6-digit code to your inbox
                      </p>
                    )}
                  </div>
                )}

                {err && (
                  <div
                    className="text-sm rounded-xl px-3 py-2"
                    style={{
                      background: "rgba(232,93,47,0.08)",
                      color: C.raspberry,
                      border: `1px solid ${C.raspberry}33`,
                    }}
                    role="alert"
                  >
                    {err}
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-full py-3 text-white font-bold tracking-[0.22em] border-0 uppercase"
                  style={{ background: C.raspberry, fontFamily: fonts.mono, fontSize: 12 }}
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Send code"}
                </Button>

                <div className="border-t border-[#E5E7EB] pt-4 mt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setErr(null);
                      setInfo(null);
                      setMethod((m) => (m === "phone" ? "email" : "phone"));
                    }}
                    className="w-full text-center text-xs font-medium underline hover:opacity-100 opacity-90"
                    style={{ color: C.raspberry, fontFamily: fonts.mono, letterSpacing: "0.12em", textTransform: "uppercase" }}
                  >
                    {method === "phone" ? "Use email instead" : "Use phone instead"}
                  </button>
                </div>

                <p className="text-center text-[11px]" style={{ color: C.muted }}>
                  By continuing you agree to our <a href="/terms" className="underline">Terms</a> and{" "}
                  <a href="/privacy" className="underline">Privacy</a>.
                </p>
              </form>
            </div>
          )}

          {step === "otp" && (
            <div className="bg-white rounded-2xl shadow-lg p-6 sm:p-8">
              <h2
                className="text-center mb-1"
                style={{ fontFamily: fonts.serif, fontStyle: "italic", fontSize: 30, lineHeight: 1.05 }}
              >
                {method === "email" ? "Check your email." : "Check your texts."}
              </h2>
              <p className="text-center mb-5" style={{ color: C.muted, fontSize: 13 }}>
                Code sent to <span style={{ color: C.text }}>{method === "email" ? email : phoneE164}</span>
              </p>

              <form onSubmit={handleVerify} className="space-y-4" noValidate>
                <Input
                  ref={codeInputRef}
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  autoComplete="one-time-code"
                  maxLength={6}
                  value={code}
                  onChange={(e) => {
                    const v = e.target.value.replace(/\D/g, "").slice(0, 6);
                    setCode(v);
                    if (fieldErrors.code) clearFieldError("code");
                    if (v.length === 6) {
                      setTimeout(() => handleVerify(), 0);
                    }
                  }}
                  className={`${inputBaseClass} text-center`}
                  style={{
                    ...inputHeightStyle,
                    fontSize: 26,
                    letterSpacing: "0.5em",
                    paddingLeft: 20,
                    borderColor: fieldErrors.code ? C.raspberry : undefined,
                  }}
                  aria-invalid={!!fieldErrors.code}
                  aria-describedby={fieldErrors.code ? "rsvp-code-err" : undefined}
                  required
                />

                {fieldErrors.code && (
                  <div
                    id="rsvp-code-err"
                    className="text-sm rounded-xl px-3 py-2 text-center"
                    style={{
                      background: "rgba(232,93,47,0.08)",
                      color: C.raspberry,
                      border: `1px solid ${C.raspberry}33`,
                    }}
                    role="alert"
                  >
                    {fieldErrors.code}
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={loading || code.length !== 6}
                  className="w-full rounded-full py-3 text-white font-bold tracking-[0.22em] border-0 uppercase"
                  style={{ background: C.raspberry, fontFamily: fonts.mono, fontSize: 12 }}
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : `Verify & RSVP ${intentLabel(intent)}`}
                </Button>

                <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.18em]"
                     style={{ color: C.muted, fontFamily: fonts.mono }}>
                  <button
                    type="button"
                    onClick={() => { setStep("capture"); setCode(""); setErr(null); }}
                    className="flex items-center gap-1 hover:opacity-100 opacity-80"
                  >
                    <ArrowLeft className="w-3 h-3" /> {method === "email" ? "Edit email" : "Edit number"}
                  </button>
                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={resendIn > 0 || loading}
                    className="hover:opacity-100"
                    style={{ color: resendIn > 0 ? C.muted : C.raspberry, opacity: resendIn > 0 ? 0.6 : 1 }}
                  >
                    {resendIn > 0 ? `Resend in ${resendIn}s` : "Resend code"}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
};

export default RsvpPhoneSheet;

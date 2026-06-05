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
  color: C.muted,
  fontSize: 11,
  letterSpacing: "0.2em",
  textTransform: "uppercase",
  display: "block",
  marginBottom: 8,
};

const inputStyle: React.CSSProperties = {
  background: C.bg,
  borderColor: C.borderStrong,
  color: C.text,
  height: 52,
  fontSize: 17,
  borderRadius: 16,
};

const intentLabel = (i: RsvpIntent) =>
  i === "attending" ? "you're in" : i === "waitlisted" ? "maybe" : "can't go";

/** Normalize to strict E.164 US (+1XXXXXXXXXX). Returns null when invalid. */
function normalizePhone(raw: string): string | null {
  return normalizeUSPhone(raw);
}

const RESEND_SECONDS = 30;
const gradientBg = `radial-gradient(circle at 30% 20%, ${C.raspberry}22, transparent 60%), radial-gradient(circle at 70% 80%, ${C.pink}22, transparent 60%)`;

const RsvpPhoneSheet = ({ open, onOpenChange, eventId, eventTitle, intent, onVerified }: Props) => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [step, setStep] = useState<"capture" | "otp">("capture");
  const [firstName, setFirstName] = useState("");
  const [phoneRaw, setPhoneRaw] = useState("");
  const [phoneE164, setPhoneE164] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [resendIn, setResendIn] = useState(0);
  const codeInputRef = useRef<HTMLInputElement>(null);

  // Reset when reopened
  useEffect(() => {
    if (!open) return;
    setStep("capture");
    setCode("");
    setErr(null);
    setLoading(false);
    setResendIn(0);
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

  const sendCode = async (phoneToSend: string) => {
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
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Couldn't send code. Try again.";
      const friendly = friendlyPhoneAuthError(msg);
      setErr(friendly ? `${friendly.title}. ${friendly.description}` : msg);
    } finally {
      setLoading(false);
    }
  };

  const handleCaptureSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    if (!firstName.trim()) { setErr("Add your first name."); return; }
    const normalized = normalizePhone(phoneRaw);
    if (!normalized) {
      setErr("Enter a valid 10-digit US mobile number, e.g. (555) 123-4567.");
      return;
    }
    setPhoneE164(normalized);
    persistIntent();
    await sendCode(normalized);
  };

  const handleVerify = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (code.length !== 6) return;
    setLoading(true);
    setErr(null);
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        phone: phoneE164,
        token: code.trim(),
        type: "sms",
      });
      if (error) throw error;
      const uid = data.user?.id;
      if (uid) {
        // Upsert profile with first name (don't overwrite existing name).
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
        // Returning users with a complete profile skip identity; everyone else lands on confirmation
        const isReturning = !!existing?.has_completed_onboarding;
        navigate(`/rsvp/confirmed/${eventId}?returning=${isReturning ? "1" : "0"}`, { replace: false });
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "That code didn't match. Try again.";
      const friendly = friendlyPhoneAuthError(msg);
      setErr(friendly ? `${friendly.title}. ${friendly.description}` : msg);
      // shake-like: clear after a beat to encourage retry
      setCode("");
      setTimeout(() => codeInputRef.current?.focus(), 30);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendIn > 0 || !phoneE164) return;
    await sendCode(phoneE164);
    toast({ title: "Code sent", description: "Check your texts." });
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent
        className="border-0 px-0 pb-[env(safe-area-inset-bottom)]"
        style={{ background: C.surface, color: C.text }}
      >
        <div className="mx-auto w-full max-w-md px-5 pt-2 pb-6">
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
            <>
              <h2
                className="text-center mb-1"
                style={{ fontFamily: fonts.serif, fontStyle: "italic", fontSize: 30, lineHeight: 1.05 }}
              >
                Lock in your spot.
              </h2>
              <p className="text-center mb-6" style={{ color: C.muted, fontSize: 13 }}>
                We'll text a 6-digit code. No password, no spam.
              </p>

              <form onSubmit={handleCaptureSubmit} className="space-y-4" noValidate>
                <div>
                  <label style={labelStyle}>First name</label>
                  <Input
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    autoComplete="given-name"
                    style={inputStyle}
                    required
                    autoFocus
                  />
                </div>
                <div>
                  <label style={labelStyle}>Mobile number</label>
                  <div className="flex gap-2 items-stretch">
                    <div
                      className="flex items-center justify-center select-none"
                      aria-hidden="true"
                      style={{
                        ...inputStyle,
                        width: 78,
                        padding: "0 12px",
                        fontFamily: fonts.sans,
                        fontWeight: 600,
                        whiteSpace: "nowrap",
                      }}
                    >
                      🇺🇸 +1
                    </div>
                    <Input
                      type="tel"
                      inputMode="tel"
                      placeholder="(555) 123-4567"
                      value={phoneRaw}
                      onChange={(e) => setPhoneRaw(formatUSPhone(e.target.value))}
                      maxLength={14}
                      autoComplete="tel"
                      style={{ ...inputStyle, flex: 1 }}
                      required
                    />
                  </div>
                  <p className="mt-2 text-[11px]" style={{ color: C.muted, fontFamily: fonts.mono, letterSpacing: "0.1em" }}>
                    US mobile numbers only · standard message rates apply
                  </p>
                </div>

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
                  className="w-full h-14 rounded-full text-xs uppercase tracking-[0.22em] border-0"
                  style={{ background: C.raspberry, color: "#fff", fontFamily: fonts.mono }}
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Send code"}
                </Button>

                <p className="text-center text-[11px]" style={{ color: C.muted }}>
                  By continuing you agree to our <a href="/terms" className="underline">Terms</a> and{" "}
                  <a href="/privacy" className="underline">Privacy</a>.
                </p>
              </form>
            </>
          )}

          {step === "otp" && (
            <>
              <h2
                className="text-center mb-1"
                style={{ fontFamily: fonts.serif, fontStyle: "italic", fontSize: 30, lineHeight: 1.05 }}
              >
                Check your texts.
              </h2>
              <p className="text-center mb-5" style={{ color: C.muted, fontSize: 13 }}>
                Code sent to <span style={{ color: C.text }}>{phoneE164}</span>
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
                    if (v.length === 6) {
                      // auto-submit
                      setTimeout(() => handleVerify(), 0);
                    }
                  }}
                  className="text-center"
                  style={{ ...inputStyle, fontSize: 26, letterSpacing: "0.5em", paddingLeft: 20 }}
                  required
                />

                {err && (
                  <div
                    className="text-sm rounded-xl px-3 py-2 text-center"
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
                  disabled={loading || code.length !== 6}
                  className="w-full h-14 rounded-full text-xs uppercase tracking-[0.22em] border-0"
                  style={{ background: C.raspberry, color: "#fff", fontFamily: fonts.mono }}
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
                    <ArrowLeft className="w-3 h-3" /> Edit number
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
            </>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
};

export default RsvpPhoneSheet;

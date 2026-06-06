import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft } from "lucide-react";
import { C, fonts } from "@/lib/editorialTheme";
import { lovable } from "@/integrations/lovable";
import { isAuthEmailRateLimitError } from "@/lib/authErrors";

export type RsvpIntent = "attending" | "waitlisted" | "canceled";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  eventId: string;
  eventTitle: string;
  eventImage: string | null;
  intent: RsvpIntent;
  /** Called after the user has an active session and the RSVP intent should be applied. */
  onAuthed: (intent: RsvpIntent) => Promise<void> | void;
}

const intentLabel = (i: RsvpIntent) =>
  i === "attending" ? "Going" : i === "waitlisted" ? "Maybe" : "Can't go";

const inputBaseClass =
  "block w-full rounded-2xl border-2 border-[#D4CFC5] bg-white shadow-sm text-[#1A1A1A] placeholder:text-[#9CA3AF] focus-visible:border-[#E85D2F] focus-visible:ring-0 focus-visible:ring-offset-0 transition-colors";

const inputHeightStyle: React.CSSProperties = {
  height: 52,
  minHeight: 44,
  fontSize: 17,
  display: "block",
  width: "100%",
};

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

const gradientBg = `radial-gradient(circle at 30% 20%, ${C.raspberry}22, transparent 60%), radial-gradient(circle at 70% 80%, ${C.pink}22, transparent 60%)`;

const EventRSVPDialog = ({
  open,
  onOpenChange,
  eventId,
  eventTitle,
  eventImage,
  intent,
  onAuthed,
}: Props) => {
  const { toast } = useToast();
  const [mode, setMode] = useState<"signup" | "signin">("signup");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const handleGoogleAuth = async () => {
    setLoading(true);
    setError(null);
    persistIntent();
    try {
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: `${window.location.origin}/e/${eventId}`,
      });
      if (result.error) throw result.error;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Couldn't start Google sign-in.";
      setError(msg);
      setLoading(false);
    }
  };

  const persistIntent = () => {
    try {
      localStorage.setItem(`pending_rsvp_${eventId}`, intent);
    } catch {
      /* ignore */
    }
  };

  const validate = (): string | null => {
    if (mode === "signup") {
      if (!firstName.trim()) return "Please enter your first name.";
      if (!lastName.trim()) return "Please enter your last name.";
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))
      return "Enter a valid email address.";
    if (password.length < 6) return "Password must be at least 6 characters.";
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const v = validate();
    if (v) {
      setError(v);
      return;
    }
    setLoading(true);
    persistIntent();
    const redirectUrl = `${window.location.origin}/e/${eventId}`;

    try {
      if (mode === "signup") {
        const { data, error: err } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            emailRedirectTo: redirectUrl,
            data: {
              first_name: firstName.trim(),
              last_name: lastName.trim(),
              full_name: `${firstName.trim()} ${lastName.trim()}`.trim(),
            },
          },
        });
        if (err) {
          const msg = err.message.toLowerCase();
          if (msg.includes("registered") || msg.includes("exists")) {
            setMode("signin");
            setError("You already have an account. Sign in to RSVP.");
          } else if (isAuthEmailRateLimitError(err.message)) {
            setError("Email confirmation is temporarily delayed. Continue with Google to RSVP right away, or try email again a little later.");
          } else {
            setError(err.message);
          }
          return;
        }
        if (data.session) {
          await onAuthed(intent);
          onOpenChange(false);
        } else {
          setSent(true);
        }
      } else {
        const { error: err } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (err) {
          setError(err.message);
          return;
        }
        await onAuthed(intent);
        onOpenChange(false);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Something went wrong.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleForgot = async () => {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError("Enter your email above first, then tap reset.");
      return;
    }
    persistIntent();
    const { error: err } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/e/${eventId}`,
    });
    if (err) {
      toast({ title: "Couldn't send reset", description: err.message, variant: "destructive" });
    } else {
      toast({ title: "Reset link sent", description: "Check your inbox." });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="border-0 p-0 overflow-hidden max-w-md gap-0 mx-auto"
        style={{ background: `${gradientBg}, ${C.bg}`, color: C.text }}
      >
        {/* Event header band keeps invitation context */}
        <div
          className="relative h-32 w-full"
          style={{
            background: eventImage
              ? `linear-gradient(180deg, rgba(0,0,0,0.15), rgba(0,0,0,0.85)), url(${eventImage}) center/cover`
              : `linear-gradient(135deg, ${C.surface}, ${C.surfaceHi})`,
          }}
        >
          <div className="absolute inset-x-0 bottom-0 px-5 pb-3">
            <div
              className="text-[10px] uppercase tracking-[0.25em] mb-1"
              style={{ fontFamily: fonts.mono, color: C.raspberry }}
            >
              RSVP · {intentLabel(intent)}
            </div>
            <div
              className="line-clamp-2"
              style={{
                fontFamily: fonts.serif,
                fontStyle: "italic",
                fontSize: 22,
                lineHeight: 1.15,
              }}
            >
              {eventTitle}
            </div>
          </div>
        </div>

        <div className="px-5 pt-10 pb-6 flex flex-col items-center justify-center min-h-[50vh]">
          {sent ? (
            <div className="bg-white rounded-2xl shadow-lg p-6 sm:p-8 w-full text-center">
              <h3
                style={{
                  fontFamily: fonts.serif,
                  fontStyle: "italic",
                  fontSize: 24,
                  marginBottom: 10,
                }}
              >
                Check your email
              </h3>
              <p style={{ color: C.muted, lineHeight: 1.6, fontSize: 14 }}>
                We sent a confirmation link to <strong style={{ color: C.text }}>{email}</strong>.
                Tap it to finish signing up — you'll land right back on this event with your RSVP
                saved.
              </p>
              <Button
                onClick={() => onOpenChange(false)}
                className="mt-5 w-full rounded-full py-3 text-white font-bold tracking-[0.22em] border-0 uppercase"
                style={{ background: C.raspberry, fontFamily: fonts.mono, fontSize: 12 }}
              >
                Got it
              </Button>
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-lg p-6 sm:p-8 w-full">
              <p
                className="mb-4"
                style={{ color: C.muted, fontSize: 13, lineHeight: 1.55 }}
              >
                {mode === "signup"
                  ? "Create your account to RSVP and get event updates."
                  : "Sign in to save your RSVP."}
              </p>

              {mode === "signup" && (
                <Button
                  type="button"
                  onClick={handleGoogleAuth}
                  disabled={loading}
                  className="w-full h-12 rounded-full text-xs uppercase tracking-[0.2em] border mb-3"
                  style={{ background: "transparent", color: C.text, borderColor: C.borderStrong, fontFamily: fonts.mono }}
                >
                  Continue with Google
                </Button>
              )}

              <form onSubmit={handleSubmit} className="space-y-3" noValidate>
                {mode === "signup" && (
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label style={labelStyle}>First name</label>
                      <Input
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        autoComplete="given-name"
                        className={inputBaseClass}
                        style={inputHeightStyle}
                        required
                      />
                    </div>
                    <div>
                      <label style={labelStyle}>Last name</label>
                      <Input
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        autoComplete="family-name"
                        className={inputBaseClass}
                        style={inputHeightStyle}
                        required
                      />
                    </div>
                  </div>
                )}
                <div>
                  <label style={labelStyle}>Email</label>
                  <Input
                    type="email"
                    inputMode="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                    className={inputBaseClass}
                    style={inputHeightStyle}
                    required
                  />
                </div>
                <div>
                  <label style={labelStyle}>Password</label>
                  <Input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete={mode === "signup" ? "new-password" : "current-password"}
                    minLength={6}
                    className={inputBaseClass}
                    style={inputHeightStyle}
                    required
                  />
                </div>

                {error && (
                  <div
                    className="text-sm rounded-xl px-3 py-2"
                    style={{
                      background: "rgba(232,93,47,0.08)",
                      color: C.raspberry,
                      border: `1px solid ${C.raspberry}33`,
                    }}
                    role="alert"
                  >
                    {error}
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-full py-3 text-white font-bold tracking-[0.22em] border-0 uppercase mt-1"
                  style={{ background: C.raspberry, fontFamily: fonts.mono, fontSize: 12 }}
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : mode === "signup" ? (
                    `RSVP ${intentLabel(intent)}`
                  ) : (
                    `Sign in & RSVP ${intentLabel(intent)}`
                  )}
                </Button>
              </form>

              <div className="mt-4 flex items-center justify-between text-xs">
                {mode === "signup" ? (
                  <button
                    type="button"
                    onClick={() => {
                      setMode("signin");
                      setError(null);
                    }}
                    style={{ color: C.muted, fontFamily: fonts.mono, letterSpacing: "0.12em" }}
                    className="uppercase hover:opacity-100 opacity-80"
                  >
                    Already a member? <span style={{ color: C.raspberry }}>Sign in</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setMode("signup");
                      setError(null);
                    }}
                    className="uppercase flex items-center gap-1 hover:opacity-100 opacity-80"
                    style={{ color: C.muted, fontFamily: fonts.mono, letterSpacing: "0.12em" }}
                  >
                    <ArrowLeft className="w-3 h-3" /> Create account
                  </button>
                )}
                {mode === "signin" && (
                  <button
                    type="button"
                    onClick={handleForgot}
                    className="uppercase hover:opacity-100 opacity-80"
                    style={{ color: C.muted, fontFamily: fonts.mono, letterSpacing: "0.12em" }}
                  >
                    Reset password
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EventRSVPDialog;

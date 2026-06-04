import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, CheckCircle2, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import loverballLogo from "@/assets/loverball-script-logo.png";
import { C, fonts } from "@/lib/editorialTheme";

type Status = "checking" | "ready" | "invalid" | "updating" | "success";

const ResetPassword = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [status, setStatus] = useState<Status>("checking");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Detect the recovery session. Supabase parses the URL hash on load and
  // fires PASSWORD_RECOVERY, but we also check for an existing session in
  // case the user already has one.
  useEffect(() => {
    let resolved = false;

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || (event === "SIGNED_IN" && session)) {
        resolved = true;
        setStatus("ready");
      }
    });

    // Fallback: if hash didn't produce an event within a beat, check session.
    const timer = setTimeout(async () => {
      if (resolved) return;
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        setStatus("ready");
      } else {
        setStatus("invalid");
      }
    }, 800);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timer);
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords don't match.");
      return;
    }

    setStatus("updating");
    const { error: updateErr } = await supabase.auth.updateUser({ password });
    if (updateErr) {
      setError(updateErr.message);
      setStatus("ready");
      return;
    }
    setStatus("success");
    toast({ title: "Password updated", description: "Sign in with your new password." });
    // Sign out the recovery session so the user logs in fresh with the new password.
    await supabase.auth.signOut();
    setTimeout(() => navigate("/auth?mode=signin&reset=success"), 1500);
  };

  return (
    <div
      style={{
        background: C.bg,
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "48px 20px",
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-10"
      >
        <img
          src={loverballLogo}
          alt="Loverball"
          className="w-[160px] h-auto mx-auto"
          style={{ filter: "brightness(0) invert(1)" }}
        />
      </motion.div>

      <div className="w-full max-w-sm space-y-8">
        {status === "checking" && (
          <p style={{ fontFamily: fonts.sans, color: C.muted, textAlign: "center" }}>
            Verifying your reset link…
          </p>
        )}

        {status === "invalid" && (
          <div className="text-center space-y-6">
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center mx-auto"
              style={{ background: `${C.raspberry}18` }}
            >
              <AlertTriangle className="w-9 h-9" style={{ color: C.raspberry }} />
            </div>
            <div className="space-y-2">
              <h1
                style={{
                  fontFamily: fonts.serif,
                  fontStyle: "italic",
                  fontWeight: 500,
                  fontSize: 28,
                  color: C.text,
                }}
              >
                Link expired
              </h1>
              <p style={{ fontFamily: fonts.sans, color: C.muted }}>
                This reset link is invalid or has expired. Request a new one to continue.
              </p>
            </div>
            <button
              type="button"
              onClick={() => navigate("/auth?mode=signin")}
              style={{
                fontFamily: fonts.mono,
                fontSize: 12,
                letterSpacing: "0.16em",
                textTransform: "uppercase",
                background: C.raspberry,
                color: "#fff",
                borderRadius: 999,
                height: 56,
                width: "100%",
                border: "none",
                cursor: "pointer",
              }}
            >
              Back to sign in
            </button>
          </div>
        )}

        {status === "success" && (
          <div className="text-center space-y-6">
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center mx-auto"
              style={{ background: `${C.raspberry}18` }}
            >
              <CheckCircle2 className="w-9 h-9" style={{ color: C.raspberry }} />
            </div>
            <h1
              style={{
                fontFamily: fonts.serif,
                fontStyle: "italic",
                fontWeight: 500,
                fontSize: 28,
                color: C.text,
              }}
            >
              Password updated
            </h1>
            <p style={{ fontFamily: fonts.sans, color: C.muted }}>
              Signing you in…
            </p>
          </div>
        )}

        {(status === "ready" || status === "updating") && (
          <>
            <div className="text-center space-y-2">
              <h1
                style={{
                  fontFamily: fonts.serif,
                  fontStyle: "italic",
                  fontWeight: 500,
                  fontSize: "clamp(32px, 6vw, 48px)",
                  lineHeight: 1,
                  letterSpacing: "-0.02em",
                  color: C.text,
                }}
              >
                Set a new password
              </h1>
              <p style={{ fontFamily: fonts.sans, color: C.muted }}>
                Pick something you'll remember.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                type="password"
                placeholder="New password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                autoFocus
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
                }}
                className="placeholder:text-[#B8B8B8]/40 focus-visible:border-[#E85D2F]"
              />
              <input
                type="password"
                placeholder="Confirm new password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
                minLength={6}
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
                }}
                className="placeholder:text-[#B8B8B8]/40 focus-visible:border-[#E85D2F]"
              />

              {error && (
                <p style={{ fontFamily: fonts.sans, fontSize: 14, color: C.raspberry }}>
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={status === "updating"}
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
                  cursor: status === "updating" ? "not-allowed" : "pointer",
                  opacity: status === "updating" ? 0.6 : 1,
                }}
              >
                {status === "updating" ? "Updating…" : "Update password"}
                {status !== "updating" && <ArrowRight size={14} />}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

export default ResetPassword;

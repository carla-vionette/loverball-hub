import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { useTrialStatus, TRIAL_DAYS } from "@/hooks/useTrialStatus";
import { useAuth } from "@/hooks/useAuth";

const STORAGE_KEY = "lb-beta-banner-dismissed";

/**
 * Persistent sitewide beta banner. Shows on every public page.
 * For signed-in users in trial, surfaces the days remaining instead.
 * Hidden for grandfathered or paid users to reduce noise.
 */
const BetaBanner = () => {
  const { user } = useAuth();
  const { isPaid, isGrandfathered, inTrial, daysRemaining } = useTrialStatus();
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setDismissed(window.sessionStorage.getItem(STORAGE_KEY) === "1");
  }, []);

  if (dismissed) return null;
  if (user && (isPaid || isGrandfathered)) return null;

  const message =
    user && inTrial
      ? `Beta · ${daysRemaining} day${daysRemaining === 1 ? "" : "s"} of free access remaining`
      : `Loverball is in Beta — your first ${TRIAL_DAYS} days are free.`;

  return (
    <div
      className="w-full text-center text-xs font-semibold tracking-wide uppercase relative"
      style={{
        background: "#E85D2F",
        color: "#FFFFFF",
        padding: "8px 36px",
        fontFamily: "'Inter', system-ui, sans-serif",
        letterSpacing: "0.08em",
      }}
      role="status"
    >
      {message}
      <button
        type="button"
        aria-label="Dismiss banner"
        onClick={() => {
          setDismissed(true);
          if (typeof window !== "undefined") {
            window.sessionStorage.setItem(STORAGE_KEY, "1");
          }
        }}
        className="absolute right-2 top-1/2 -translate-y-1/2 p-1 opacity-80 hover:opacity-100"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};

export default BetaBanner;

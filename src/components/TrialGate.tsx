import { ReactNode, useState, useEffect } from "react";
import { Lock, Loader2 } from "lucide-react";
import { useTrialStatus, TRIAL_DAYS } from "@/hooks/useTrialStatus";
import UpgradeModal from "@/components/UpgradeModal";
import { Button } from "@/components/ui/button";

interface TrialGateProps {
  children: ReactNode;
  /** Human-readable name of the gated area, e.g. "Events". */
  feature?: string;
}

/**
 * Blocks rendering of children when the user's 30-day free trial has expired
 * and they haven't upgraded. Grandfathered users (existing before beta launch)
 * and paid users pass through unaffected.
 */
const TrialGate = ({ children, feature = "this section" }: TrialGateProps) => {
  const { loading, isExpired } = useTrialStatus();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (isExpired) setOpen(true);
  }, [isExpired]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!isExpired) return <>{children}</>;

  return (
    <>
      <div className="min-h-[80vh] flex items-center justify-center px-6 py-16 bg-background">
        <div className="max-w-md w-full text-center space-y-5">
          <div className="mx-auto w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
            <Lock className="w-6 h-6 text-primary" />
          </div>
          <h1 className="font-display text-2xl uppercase tracking-tight">
            Your free trial has ended
          </h1>
          <p className="text-muted-foreground text-sm">
            Your {TRIAL_DAYS}-day Loverball beta trial is over. Upgrade to a membership to keep
            access to {feature} and the full community.
          </p>
          <Button size="lg" className="w-full" onClick={() => setOpen(true)}>
            See plans
          </Button>
        </div>
      </div>
      <UpgradeModal open={open} onOpenChange={setOpen} requiredTier="digital" />
    </>
  );
};

export default TrialGate;

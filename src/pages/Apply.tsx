import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Check, ChevronLeft, ChevronRight } from "lucide-react";
import ApplyStep1AccountType from "@/components/apply/ApplyStep1AccountType";
import ApplyStep2BasicInfo from "@/components/apply/ApplyStep2BasicInfo";
import ApplyStep3Social from "@/components/apply/ApplyStep3Social";
import ApplyStep4Upload from "@/components/apply/ApplyStep4Upload";
import ApplyStep5Review from "@/components/apply/ApplyStep5Review";

export interface ApplyFormData {
  accountType: "creator" | "team" | "organization" | "";
  name: string;
  bio: string;
  sport: string;
  league: string;
  city: string;
  instagramUrl: string;
  instagramFollowers: number;
  tiktokUrl: string;
  tiktokFollowers: number;
  youtubeUrl: string;
  youtubeFollowers: number;
  twitterUrl: string;
  twitterFollowers: number;
  logoUrl: string;
  bannerUrl: string;
}

const initialData: ApplyFormData = {
  accountType: "",
  name: "",
  bio: "",
  sport: "",
  league: "",
  city: "",
  instagramUrl: "",
  instagramFollowers: 0,
  tiktokUrl: "",
  tiktokFollowers: 0,
  youtubeUrl: "",
  youtubeFollowers: 0,
  twitterUrl: "",
  twitterFollowers: 0,
  logoUrl: "",
  bannerUrl: "",
};

const TOTAL_STEPS = 5;

const stepTitles = [
  "Account Type",
  "Basic Info",
  "Social Media",
  "Uploads",
  "Review & Submit",
];

const Apply = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState(1);
  const [formData, setFormData] = useState<ApplyFormData>(initialData);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const updateField = useCallback(
    <K extends keyof ApplyFormData>(key: K, value: ApplyFormData[K]) => {
      setFormData((prev) => ({ ...prev, [key]: value }));
      setErrors((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    },
    []
  );

  const validateStep = (s: number): boolean => {
    const errs: Record<string, string> = {};
    if (s === 1 && !formData.accountType) errs.accountType = "Select an account type";
    if (s === 2) {
      if (!formData.name.trim()) errs.name = "Name is required";
      if (!formData.sport) errs.sport = "Select a sport";
      if (!formData.city.trim()) errs.city = "City is required";
    }
    // Steps 3, 4 are optional
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const goNext = () => {
    if (!validateStep(step)) return;
    setDirection(1);
    setStep((s) => Math.min(s + 1, TOTAL_STEPS));
  };

  const goBack = () => {
    setDirection(-1);
    setStep((s) => Math.max(s - 1, 1));
  };

  const goToStep = (s: number) => {
    if (s < step) {
      setDirection(-1);
      setStep(s);
    }
  };

  const handleSubmit = async () => {
    if (!user) {
      toast.error("Please sign in to submit your application");
      navigate("/auth");
      return;
    }
    setSubmitting(true);
    try {
      const { error } = await supabase.from("creator_applications").insert({
        applicant_user_id: user.id,
        desired_channel_name: formData.name,
        content_focus: formData.sport,
        social_handles: [formData.instagramUrl, formData.tiktokUrl, formData.youtubeUrl, formData.twitterUrl].filter(Boolean).join(", "),
        account_type: formData.accountType,
        name: formData.name,
        bio: formData.bio,
        sport: formData.sport,
        league: formData.league,
        city: formData.city,
        instagram_url: formData.instagramUrl,
        instagram_followers: formData.instagramFollowers || 0,
        tiktok_url: formData.tiktokUrl,
        tiktok_followers: formData.tiktokFollowers || 0,
        youtube_url: formData.youtubeUrl,
        youtube_followers: formData.youtubeFollowers || 0,
        twitter_url: formData.twitterUrl,
        twitter_followers: formData.twitterFollowers || 0,
        logo_url: formData.logoUrl,
        banner_url: formData.bannerUrl,
        status: "submitted",
      } as any);

      if (error) throw error;
      toast.success("Application submitted!");
      navigate("/application-pending");
    } catch (err: any) {
      toast.error(err.message || "Failed to submit application");
    } finally {
      setSubmitting(false);
    }
  };

  const slideVariants = {
    enter: (dir: number) => ({ x: dir > 0 ? 300 : -300, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir: number) => ({ x: dir > 0 ? -300 : 300, opacity: 0 }),
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-background/95 backdrop-blur-md border-b border-border">
        <div className="max-w-xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => (step > 1 ? goBack() : navigate(-1))}
              className="w-9 h-9 rounded-full bg-muted flex items-center justify-center"
            >
              <ChevronLeft className="w-5 h-5 text-foreground" />
            </button>
            <span className="text-sm font-medium text-muted-foreground">
              Step {step} of {TOTAL_STEPS}
            </span>
            <div className="w-9" />
          </div>

          {/* Progress stepper */}
          <div className="flex items-center gap-1.5">
            {Array.from({ length: TOTAL_STEPS }, (_, i) => {
              const s = i + 1;
              const completed = s < step;
              const active = s === step;
              return (
                <button
                  key={s}
                  onClick={() => goToStep(s)}
                  disabled={s > step}
                  className="flex-1 flex flex-col items-center gap-1 group"
                >
                  <div
                    className={`h-1.5 w-full rounded-full transition-all duration-300 ${
                      completed
                        ? "bg-primary"
                        : active
                        ? "bg-primary/60"
                        : "bg-muted"
                    }`}
                  />
                  <span
                    className={`text-[10px] font-medium hidden sm:block transition-colors ${
                      completed || active ? "text-primary" : "text-muted-foreground"
                    }`}
                  >
                    {stepTitles[i]}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Step content */}
      <div className="max-w-xl mx-auto px-4 py-8 overflow-hidden">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={step}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          >
            {step === 1 && (
              <ApplyStep1AccountType
                value={formData.accountType}
                onChange={(v) => updateField("accountType", v)}
                error={errors.accountType}
              />
            )}
            {step === 2 && (
              <ApplyStep2BasicInfo
                data={formData}
                updateField={updateField}
                errors={errors}
              />
            )}
            {step === 3 && (
              <ApplyStep3Social
                data={formData}
                updateField={updateField}
              />
            )}
            {step === 4 && (
              <ApplyStep4Upload
                data={formData}
                updateField={updateField}
                userId={user?.id}
              />
            )}
            {step === 5 && (
              <ApplyStep5Review
                data={formData}
                onEdit={goToStep}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom action bar */}
      <div className="fixed bottom-0 inset-x-0 z-30 bg-background/95 backdrop-blur-md border-t border-border">
        <div className="max-w-xl mx-auto px-4 py-4 flex items-center gap-3">
          {step > 1 && (
            <button
              onClick={goBack}
              className="px-5 py-2.5 rounded-full border border-border text-sm font-semibold text-foreground hover:bg-muted transition-colors"
            >
              Back
            </button>
          )}
          <div className="flex-1" />
          {step < TOTAL_STEPS ? (
            <button
              onClick={goNext}
              className="px-6 py-2.5 rounded-full bg-primary text-primary-foreground text-sm font-semibold flex items-center gap-2 hover:opacity-90 transition-opacity"
            >
              Continue
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="px-6 py-2.5 rounded-full bg-primary text-primary-foreground text-sm font-semibold flex items-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {submitting ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Check className="w-4 h-4" />
              )}
              {submitting ? "Submitting..." : "Submit Application"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Apply;

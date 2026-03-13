import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Crown, Sparkles, Star, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import loverballLogo from "@/assets/loverball-script-logo.png";

type BillingPeriod = "monthly" | "annual";
type PlanTier = "free" | "digital" | "local";

const plans = {
  free: {
    name: "Fan",
    tagline: "Explore the world of women's sports",
    monthly: 0,
    annual: 0,
    icon: Star,
    cta: "Start Free",
    features: [
      "Ad-supported content",
      "AI sports news feed",
      "Limited social features",
      "Browse events (can't RSVP)",
      "Watch highlights & clips",
    ],
  },
  digital: {
    name: "All Access",
    tagline: "The full digital experience",
    monthly: 15,
    annual: 13, // ~2 months free
    icon: Zap,
    cta: "Start 7-Day Free Trial",
    features: [
      "Everything in Fan, plus:",
      "No ads",
      "Full content library (shows, originals, live)",
      "Full digital community access",
      "Unlimited DMs & group chats",
      "Create & join watch parties",
      "Profile customization",
    ],
  },
  local: {
    name: "The Club",
    tagline: "Your city. Your crew. Your game.",
    monthly: 35,
    annual: 29, // ~2 months free
    icon: Crown,
    cta: "Join The Club",
    features: [
      "Everything in All Access, plus:",
      "IRL events & watch parties",
      "Networking & matchmaking",
      "Exclusive member perks & discounts",
      "Priority RSVP to all events",
      "City-specific community",
      "Partner deals & merch drops",
    ],
  },
};

const faqs = [
  {
    q: "What's included in each plan?",
    a: "The Fan plan gives you free, ad-supported access to highlights, news, and browsing events. All Access removes ads and unlocks the full content library plus community features. The Club adds IRL events, priority RSVPs, networking, and exclusive perks.",
  },
  {
    q: "Can I switch plans later?",
    a: "Absolutely! You can upgrade, downgrade, or cancel your plan at any time from your account settings. Changes take effect at the start of your next billing cycle.",
  },
  {
    q: "Is there a free trial?",
    a: "Yes! The All Access plan includes a 7-day free trial. You won't be charged until the trial ends, and you can cancel anytime before that.",
  },
];

const PlanCard = ({
  tier,
  billing,
  selected,
  onSelect,
  recommended,
}: {
  tier: PlanTier;
  billing: BillingPeriod;
  selected: boolean;
  onSelect: () => void;
  recommended?: boolean;
}) => {
  const plan = plans[tier];
  const Icon = plan.icon;
  const price = billing === "monthly" ? plan.monthly : plan.annual;
  const isHighlighted = recommended;

  return (
    <motion.div
      layout
      whileHover={{ y: -6, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
      onClick={onSelect}
      className={`relative rounded-2xl cursor-pointer transition-all duration-300 flex flex-col ${
        isHighlighted
          ? "bg-primary text-primary-foreground shadow-[0_20px_60px_-15px_hsl(var(--primary)/0.5)] lg:scale-105 z-10 ring-2 ring-primary"
          : selected
          ? "bg-card text-card-foreground shadow-xl ring-2 ring-primary/50"
          : "bg-card text-card-foreground shadow-md ring-1 ring-border/40 hover:ring-primary/30"
      } ${isHighlighted ? "p-8 lg:p-10" : "p-6 lg:p-8"}`}
    >
      {/* Most Popular Badge */}
      {recommended && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute -top-3.5 left-1/2 -translate-x-1/2"
        >
          <div className="bg-foreground text-background text-[10px] font-bold uppercase tracking-[0.2em] px-4 py-1.5 rounded-full flex items-center gap-1.5">
            <Sparkles className="w-3 h-3" />
            Most Popular
          </div>
        </motion.div>
      )}

      {/* Icon & Name */}
      <div className="mb-6">
        <div className={`inline-flex items-center justify-center w-10 h-10 rounded-xl mb-4 ${
          isHighlighted ? "bg-primary-foreground/20" : "bg-primary/10"
        }`}>
          <Icon className={`w-5 h-5 ${isHighlighted ? "text-primary-foreground" : "text-primary"}`} />
        </div>
        <h3 className="font-display text-lg uppercase tracking-wider">{plan.name}</h3>
        <p className={`text-xs mt-1 ${isHighlighted ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
          {plan.tagline}
        </p>
      </div>

      {/* Price */}
      <div className="mb-6">
        <div className="flex items-baseline gap-1">
          <span className="font-display text-4xl lg:text-5xl">
            {price === 0 ? "Free" : `$${price}`}
          </span>
          {price > 0 && (
            <span className={`text-sm ${isHighlighted ? "text-primary-foreground/60" : "text-muted-foreground"}`}>
              /mo
            </span>
          )}
        </div>
        {billing === "annual" && price > 0 && (
          <p className={`text-xs mt-1 ${isHighlighted ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
            Billed annually (${price * 12}/yr)
          </p>
        )}
      </div>

      {/* Features */}
      <ul className="space-y-3 mb-8 flex-1">
        {plan.features.map((feature, i) => (
          <li key={i} className="flex items-start gap-2.5 text-sm">
            <Check className={`w-4 h-4 mt-0.5 shrink-0 ${
              isHighlighted ? "text-primary-foreground" : "text-primary"
            }`} />
            <span className={isHighlighted ? "text-primary-foreground/90" : "text-foreground/80"}>
              {feature}
            </span>
          </li>
        ))}
      </ul>

      {/* CTA */}
      <Button
        variant={isHighlighted ? "outline" : tier === "local" ? "accent" : "default"}
        className={`w-full rounded-xl h-12 text-sm tracking-wider ${
          isHighlighted
            ? "border-2 border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary"
            : tier === "local"
            ? "bg-foreground text-background hover:bg-foreground/90"
            : ""
        }`}
      >
        {plan.cta}
      </Button>
    </motion.div>
  );
};

const PlanSelection = () => {
  const [billing, setBilling] = useState<BillingPeriod>("monthly");
  const [selectedPlan, setSelectedPlan] = useState<PlanTier>("digital");
  const [saving, setSaving] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSelectPlan = async (tier: PlanTier) => {
    setSelectedPlan(tier);
    setSaving(true);

    try {
      if (user) {
        const { error } = await supabase
          .from("profiles")
          .update({
            membership_tier: tier,
            billing_period: billing,
          } as any)
          .eq("id", user.id);

        if (error) throw error;
      }

      toast({
        title: tier === "free" ? "Welcome aboard!" : `${plans[tier].name} plan selected!`,
        description: tier === "free"
          ? "You're all set with the free Fan plan."
          : "You can manage your subscription anytime in Settings.",
      });

      navigate("/onboarding");
    } catch (error: any) {
      // Still navigate even if save fails — we can retry later
      navigate("/onboarding");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-background overflow-y-auto">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-center h-16">
          <img src={loverballLogo} alt="Loverball" className="h-20 w-auto" />
        </div>
      </div>

      {/* Hero */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-12 pb-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl uppercase tracking-tight text-foreground">
            Choose Your Membership
          </h1>
          <p className="mt-4 text-muted-foreground text-base sm:text-lg max-w-lg mx-auto font-serif italic">
            Join 24K+ women who live and breathe sports
          </p>
        </motion.div>

        {/* Billing Toggle */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="mt-8 inline-flex items-center bg-secondary rounded-full p-1"
        >
          <button
            onClick={() => setBilling("monthly")}
            className={`px-5 py-2 rounded-full text-sm font-bold uppercase tracking-wider transition-all ${
              billing === "monthly"
                ? "bg-foreground text-background shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setBilling("annual")}
            className={`px-5 py-2 rounded-full text-sm font-bold uppercase tracking-wider transition-all flex items-center gap-2 ${
              billing === "annual"
                ? "bg-foreground text-background shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Annual
            <span className="bg-primary text-primary-foreground text-[10px] px-2 py-0.5 rounded-full font-bold">
              2 MO FREE
            </span>
          </button>
        </motion.div>
      </div>

      {/* Plan Cards */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 pb-16">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-4 items-start lg:items-stretch"
        >
          <PlanCard
            tier="free"
            billing={billing}
            selected={selectedPlan === "free"}
            onSelect={() => handleSelectPlan("free")}
          />
          <PlanCard
            tier="digital"
            billing={billing}
            selected={selectedPlan === "digital"}
            onSelect={() => handleSelectPlan("digital")}
            recommended
          />
          <PlanCard
            tier="local"
            billing={billing}
            selected={selectedPlan === "local"}
            onSelect={() => handleSelectPlan("local")}
          />
        </motion.div>

        {/* Cancel anytime text */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center text-muted-foreground text-sm mt-8"
        >
          Cancel anytime. No commitments.
        </motion.p>

        {/* FAQ */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.5 }}
          className="max-w-2xl mx-auto mt-16"
        >
          <h2 className="font-display text-2xl uppercase tracking-wider text-center mb-6">
            Frequently Asked Questions
          </h2>
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, i) => (
              <AccordionItem key={i} value={`faq-${i}`} className="border-border/40">
                <AccordionTrigger className="text-left text-sm font-semibold hover:no-underline">
                  {faq.q}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground text-sm leading-relaxed">
                  {faq.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </motion.div>
      </div>

      {/* Loading overlay */}
      <AnimatePresence>
        {saving && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center"
          >
            <div className="text-center">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-sm text-muted-foreground uppercase tracking-wider">Setting up your plan…</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PlanSelection;

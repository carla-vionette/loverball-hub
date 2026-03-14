import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Check, Zap, Crown, Star, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { createCheckoutSession } from '@/services/subscriptionService';
import { useToast } from '@/hooks/use-toast';
import type { SubscriptionPlan } from '@/types';
import loverballLogo from '@/assets/loverball-script-logo.png';
import MobileHeader from '@/components/MobileHeader';
import DesktopNav from '@/components/DesktopNav';
import BottomNav from '@/components/BottomNav';

const tiers = [
  {
    id: 'free' as SubscriptionPlan,
    name: 'Free',
    emoji: '🏟️',
    price: 0,
    tagline: 'Always free',
    icon: Star,
    highlight: false,
    badge: null,
    features: [
      'Browse all events',
      'RSVP to public events',
      'Join event chats',
      'View event highlights',
      'Basic profile',
    ],
    cta: 'Current Plan',
  },
  {
    id: 'community' as SubscriptionPlan,
    name: 'Community',
    emoji: '⚡',
    price: 15,
    tagline: 'Most Popular',
    icon: Zap,
    highlight: true,
    badge: '⚡',
    features: [
      'Everything in Free, plus:',
      'Full attendee lists',
      'Direct messages',
      'Early RSVPs (24hr before public)',
      'Priority waitlist promotion',
      '⚡ Member badge on profile',
    ],
    cta: 'Go Community',
  },
  {
    id: 'allaccess' as SubscriptionPlan,
    name: 'All Access',
    emoji: '💎',
    price: 35,
    tagline: 'Best Value',
    icon: Crown,
    highlight: false,
    badge: '💎',
    features: [
      'Everything in Community, plus:',
      'Exclusive member-only events',
      'Ticket discounts with partner venues',
      'Reserved group seating sections',
      'VIP perks & early access',
      '💎 Premium badge on profile',
    ],
    cta: 'Go All Access',
  },
];

const Membership = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  const handleSelect = async (plan: SubscriptionPlan) => {
    if (!user) {
      navigate('/auth?redirect=/membership');
      return;
    }
    if (plan === 'free') return;

    setLoadingPlan(plan);
    try {
      const url = await createCheckoutSession(plan);
      window.location.href = url;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to start checkout';
      toast({ title: 'Checkout unavailable', description: 'We couldn\'t start the payment process. Please try again later or contact support.', variant: 'destructive' });
    } finally {
      setLoadingPlan(null);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <MobileHeader />
      <DesktopNav />
      <BottomNav />

      <main className="md:ml-64 pt-16 md:pt-0 pb-24 md:pb-0">
        <div className="max-w-5xl mx-auto px-4 py-10">
          {/* Hero */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            
            <h1 className="font-display text-3xl md:text-5xl uppercase tracking-tight text-foreground mb-3">
              Go Member
            </h1>
            <p className="text-muted-foreground text-base md:text-lg max-w-md mx-auto">
              Unlock the full Loverball experience. Connect deeper, access more.
            </p>
          </motion.div>

          {/* Tier Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-start">
            {tiers.map((tier, i) => {
              const Icon = tier.icon;
              return (
                <motion.div
                  key={tier.id}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className={`relative rounded-2xl p-6 flex flex-col ${
                    tier.highlight
                      ? 'bg-primary text-primary-foreground ring-2 ring-primary shadow-xl md:scale-105 z-10'
                      : 'bg-card text-card-foreground ring-1 ring-border/40 shadow-md'
                  }`}
                >
                  {/* Badge */}
                  {tier.tagline && tier.id !== 'free' && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <Badge
                        className={`text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full ${
                          tier.highlight
                            ? 'bg-foreground text-background'
                            : 'bg-accent text-accent-foreground'
                        }`}
                      >
                        {tier.tagline}
                      </Badge>
                    </div>
                  )}

                  <div className="mb-5 mt-2">
                    <div className={`inline-flex items-center justify-center w-10 h-10 rounded-xl mb-3 ${
                      tier.highlight ? 'bg-primary-foreground/20' : 'bg-primary/10'
                    }`}>
                      <Icon className={`w-5 h-5 ${tier.highlight ? 'text-primary-foreground' : 'text-primary'}`} />
                    </div>
                    <h3 className="font-display text-lg uppercase tracking-wider">
                      {tier.emoji} {tier.name}
                    </h3>
                  </div>

                  <div className="mb-5">
                    <span className="font-display text-4xl">
                      {tier.price === 0 ? 'Free' : `$${tier.price}`}
                    </span>
                    {tier.price > 0 && (
                      <span className={`text-sm ml-1 ${tier.highlight ? 'text-primary-foreground/60' : 'text-muted-foreground'}`}>
                        /mo
                      </span>
                    )}
                  </div>

                  <ul className="space-y-2.5 mb-6 flex-1">
                    {tier.features.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-sm">
                        <Check className={`w-4 h-4 mt-0.5 shrink-0 ${
                          tier.highlight ? 'text-primary-foreground' : 'text-primary'
                        }`} />
                        <span className={tier.highlight ? 'text-primary-foreground/90' : 'text-foreground/80'}>
                          {f}
                        </span>
                      </li>
                    ))}
                  </ul>

                  <Button
                    className={`w-full rounded-xl h-12 ${
                      tier.highlight
                        ? 'bg-primary-foreground text-primary hover:bg-primary-foreground/90'
                        : tier.id === 'allaccess'
                        ? 'bg-foreground text-background hover:bg-foreground/90'
                        : ''
                    }`}
                    variant={tier.id === 'free' ? 'outline' : 'default'}
                    disabled={tier.id === 'free' || !!loadingPlan}
                    onClick={() => handleSelect(tier.id)}
                  >
                    {loadingPlan === tier.id ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : null}
                    {tier.cta}
                  </Button>
                </motion.div>
              );
            })}
          </div>

          <p className="text-center text-muted-foreground text-sm mt-8">
            Cancel anytime. No commitments. All plans include a 7-day money-back guarantee.
          </p>
        </div>
      </main>
    </div>
  );
};

export default Membership;

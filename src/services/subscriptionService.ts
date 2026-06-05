import { supabase } from '@/integrations/supabase/client';
import type { Subscription, SubscriptionPlan, SubscriptionWithUser } from '@/types';

export async function getUserSubscription(userId: string): Promise<Subscription | null> {
  const { data, error } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) throw error;
  return data as Subscription | null;
}

// Beta trial: every signed-up user gets full ('local' tier) access
// for BETA_TRIAL_DAYS days from their profile creation date.
export const BETA_TRIAL_DAYS = 30;

export interface BetaTrialStatus {
  inTrial: boolean;
  daysRemaining: number;
  trialEndsAt: Date | null;
}

export async function getBetaTrialStatus(userId: string): Promise<BetaTrialStatus> {
  const { data } = await supabase
    .from('profiles')
    .select('created_at')
    .eq('id', userId)
    .maybeSingle();

  if (!data?.created_at) {
    return { inTrial: false, daysRemaining: 0, trialEndsAt: null };
  }

  const createdAt = new Date(data.created_at);
  const trialEndsAt = new Date(createdAt.getTime() + BETA_TRIAL_DAYS * 24 * 60 * 60 * 1000);
  const msRemaining = trialEndsAt.getTime() - Date.now();
  const daysRemaining = Math.max(0, Math.ceil(msRemaining / (24 * 60 * 60 * 1000)));

  return {
    inTrial: msRemaining > 0,
    daysRemaining,
    trialEndsAt,
  };
}

// Permanent full-access allowlist (founders / staff).
// Emails are compared case-insensitively.
export const PERMANENT_ACCESS_EMAILS = [
  'carla@stori.digital',
  'carla@loverball.com',
];

export async function hasPermanentAccess(): Promise<boolean> {
  const { data } = await supabase.auth.getUser();
  const email = data?.user?.email?.toLowerCase();
  if (!email) return false;
  return PERMANENT_ACCESS_EMAILS.includes(email);
}

export async function getUserTier(userId: string): Promise<SubscriptionPlan> {
  // Permanent allowlist always wins
  if (await hasPermanentAccess()) return 'local';

  // Active paid subscription
  const sub = await getUserSubscription(userId);
  if (sub && sub.status === 'active' && sub.plan !== 'free') return sub.plan;

  // Beta trial grants top-tier access for the first 30 days post-signup
  const trial = await getBetaTrialStatus(userId);
  if (trial.inTrial) return 'local';

  if (!sub || sub.status !== 'active') return 'free';
  return sub.plan;
}



export async function fetchAllSubscriptions(): Promise<SubscriptionWithUser[]> {
  const { data, error } = await supabase
    .from('subscriptions')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;

  const subs = (data || []) as Subscription[];
  const userIds = subs.map(s => s.user_id);
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, name')
    .in('id', userIds);

  const profileMap = new Map((profiles || []).map(p => [p.id, p.name]));

  return subs.map(s => ({
    ...s,
    user_name: profileMap.get(s.user_id) || 'Unknown',
  }));
}

export async function updateSubscriptionPlan(
  subscriptionId: string,
  plan: SubscriptionPlan
): Promise<void> {
  const { error } = await supabase
    .from('subscriptions')
    .update({ plan })
    .eq('id', subscriptionId);
  if (error) throw error;
}

export async function cancelSubscription(subscriptionId: string): Promise<void> {
  const { error } = await supabase
    .from('subscriptions')
    .update({ status: 'canceled' })
    .eq('id', subscriptionId);
  if (error) throw error;
}

export async function createCheckoutSession(plan: SubscriptionPlan): Promise<string> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('Not authenticated');

  const { data, error } = await supabase.functions.invoke('create-checkout', {
    body: {
      planId: plan,
      success_url: `${window.location.origin}/billing?success=true`,
      cancel_url: `${window.location.origin}/membership`,
    },
  });

  if (error) throw new Error('Checkout is temporarily unavailable. Please try again later.');
  if (!data?.url) throw new Error('Checkout is temporarily unavailable. Please try again later.');
  return data.url;
}

export function canAccessTier(userTier: SubscriptionPlan, contentTier: string | null): boolean {
  if (!contentTier || contentTier === 'free') return true;
  const tierRank: Record<string, number> = { free: 0, digital: 1, local: 2 };
  return (tierRank[userTier] || 0) >= (tierRank[contentTier] || 0);
}

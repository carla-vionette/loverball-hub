import { supabase } from '@/integrations/supabase/client';
import type { Subscription, SubscriptionPlan } from '@/types';

export async function fetchUserSubscription(userId: string): Promise<Subscription | null> {
  const { data, error } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) throw error;
  return data as Subscription | null;
}

export async function getUserTier(userId: string): Promise<SubscriptionPlan> {
  const sub = await fetchUserSubscription(userId);
  if (!sub || sub.status !== 'active') return 'free';
  return sub.plan;
}

export function canAccessTier(userTier: SubscriptionPlan, requiredTier: SubscriptionPlan): boolean {
  const tierOrder: Record<SubscriptionPlan, number> = { free: 0, pro: 1, premium: 2 };
  return tierOrder[userTier] >= tierOrder[requiredTier];
}

export async function fetchAllSubscriptions(): Promise<Subscription[]> {
  const { data, error } = await supabase
    .from('subscriptions')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []) as Subscription[];
}

export async function createCheckoutSession(plan: SubscriptionPlan): Promise<string> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('Not authenticated');

  const priceMap: Record<string, number> = {
    pro: 9.99,
    premium: 19.99,
  };

  const price = priceMap[plan];
  if (!price) throw new Error('Invalid plan');

  const { data, error } = await supabase.functions.invoke('create-checkout', {
    body: {
      items: [{ name: `Loverball ${plan.charAt(0).toUpperCase() + plan.slice(1)} Plan`, price, quantity: 1 }],
      success_url: `${window.location.origin}/billing?success=true`,
      cancel_url: `${window.location.origin}/pricing`,
    },
  });

  if (error) throw error;
  return data.url;
}

export async function getActiveSubscriptionCount(): Promise<number> {
  const { count, error } = await supabase
    .from('subscriptions')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'active')
    .neq('plan', 'free');
  if (error) throw error;
  return count || 0;
}

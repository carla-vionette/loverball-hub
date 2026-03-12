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

export async function getUserTier(userId: string): Promise<SubscriptionPlan> {
  const sub = await getUserSubscription(userId);
  if (!sub || sub.status !== 'active') return 'free';
  return sub.plan;
}

export async function fetchAllSubscriptions(): Promise<SubscriptionWithUser[]> {
  const { data, error } = await supabase
    .from('subscriptions')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;

  // Fetch profile names for each subscription
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

  const priceMap: Record<string, number> = {
    digital: 15,
    local: 35,
  };

  const price = priceMap[plan];
  if (!price) throw new Error('Invalid plan');

  const { data, error } = await supabase.functions.invoke('create-checkout', {
    body: {
      items: [{ name: `Loverball ${plan === 'digital' ? 'All Access' : 'The Club'} Plan`, price, quantity: 1 }],
      success_url: `${window.location.origin}/billing?success=true`,
      cancel_url: `${window.location.origin}/pricing`,
    },
  });

  if (error) throw error;
  return data.url;
}

export function canAccessTier(userTier: SubscriptionPlan, contentTier: string | null): boolean {
  if (!contentTier || contentTier === 'free') return true;
  const tierRank: Record<string, number> = { free: 0, digital: 1, local: 2 };
  return (tierRank[userTier] || 0) >= (tierRank[contentTier] || 0);
}

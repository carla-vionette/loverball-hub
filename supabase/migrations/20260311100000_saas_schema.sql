-- =====================================================
-- Loverball SaaS Schema Migration
-- Subscriptions, Invites, Video/Event tier columns
-- =====================================================

-- 1. Subscriptions table
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_customer_id text,
  stripe_subscription_id text,
  plan text DEFAULT 'free' CHECK (plan IN ('free', 'pro', 'premium')),
  status text DEFAULT 'active' CHECK (status IN ('active', 'canceled', 'past_due', 'trialing')),
  current_period_end timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Unique constraint: one subscription per user
ALTER TABLE public.subscriptions
  ADD CONSTRAINT subscriptions_user_id_unique UNIQUE (user_id);

-- Index for lookups
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_customer ON public.subscriptions(stripe_customer_id);

-- 2. Invites table
CREATE TABLE IF NOT EXISTS public.invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  inviter_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  invite_code text UNIQUE NOT NULL,
  signup_count int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_invites_inviter_id ON public.invites(inviter_id);
CREATE INDEX IF NOT EXISTS idx_invites_code ON public.invites(invite_code);

-- 3. Add tier, category, duration columns to videos table
ALTER TABLE public.videos ADD COLUMN IF NOT EXISTS tier text DEFAULT 'free' CHECK (tier IN ('free', 'pro', 'premium'));
ALTER TABLE public.videos ADD COLUMN IF NOT EXISTS category text;
ALTER TABLE public.videos ADD COLUMN IF NOT EXISTS duration text;

-- 4. Add tier, layout_json, banner_image columns to events table
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS tier text DEFAULT 'free' CHECK (tier IN ('free', 'pro', 'premium'));
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS layout_json jsonb;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS banner_image text;

-- =====================================================
-- RLS Policies
-- =====================================================

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invites ENABLE ROW LEVEL SECURITY;

-- Subscriptions: users can read their own, admins can read all
CREATE POLICY "Users can view own subscription"
  ON public.subscriptions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own subscription"
  ON public.subscriptions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own subscription"
  ON public.subscriptions FOR UPDATE
  USING (auth.uid() = user_id);

-- Admin read all subscriptions
CREATE POLICY "Admins can view all subscriptions"
  ON public.subscriptions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'
    )
  );

-- Admin update any subscription
CREATE POLICY "Admins can update all subscriptions"
  ON public.subscriptions FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'
    )
  );

-- Invites: users can read their own, anyone can read by code (for signup flow)
CREATE POLICY "Users can view own invites"
  ON public.invites FOR SELECT
  USING (auth.uid() = inviter_id);

CREATE POLICY "Anyone can look up invite by code"
  ON public.invites FOR SELECT
  USING (true);

CREATE POLICY "Users can insert own invite"
  ON public.invites FOR INSERT
  WITH CHECK (auth.uid() = inviter_id);

CREATE POLICY "Users can update own invite"
  ON public.invites FOR UPDATE
  USING (auth.uid() = inviter_id);

-- Service role can update invite signup_count (for webhook)
CREATE POLICY "Service role can update invites"
  ON public.invites FOR UPDATE
  USING (true);

-- =====================================================
-- Triggers
-- =====================================================

-- Auto-create invite code when a profile is created
CREATE OR REPLACE FUNCTION public.auto_create_invite_code()
RETURNS trigger AS $$
DECLARE
  code text;
BEGIN
  -- Generate a short random code
  code := lower(substr(md5(random()::text || NEW.id::text), 1, 8));
  INSERT INTO public.invites (inviter_id, invite_code)
  VALUES (NEW.id, code)
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_auto_create_invite ON public.profiles;
CREATE TRIGGER trg_auto_create_invite
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_create_invite_code();

-- Auto-assign admin role when email matches Carla@stori.digital (case-insensitive)
CREATE OR REPLACE FUNCTION public.auto_assign_admin_role()
RETURNS trigger AS $$
DECLARE
  user_email text;
BEGIN
  SELECT email INTO user_email FROM auth.users WHERE id = NEW.id;
  IF lower(user_email) = lower('Carla@stori.digital') THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin')
    ON CONFLICT (user_id) DO UPDATE SET role = 'admin';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_auto_assign_admin ON public.profiles;
CREATE TRIGGER trg_auto_assign_admin
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_assign_admin_role();

-- Auto-create free subscription for new users
CREATE OR REPLACE FUNCTION public.auto_create_subscription()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.subscriptions (user_id, plan, status)
  VALUES (NEW.id, 'free', 'active')
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_auto_create_subscription ON public.profiles;
CREATE TRIGGER trg_auto_create_subscription
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_create_subscription();

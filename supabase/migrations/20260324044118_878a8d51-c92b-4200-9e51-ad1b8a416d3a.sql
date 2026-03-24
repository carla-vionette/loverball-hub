
-- Event submissions table for non-approved users
CREATE TABLE public.event_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  submitter_id uuid NOT NULL,
  title text NOT NULL,
  description text,
  event_date date NOT NULL,
  event_time time,
  venue_name text,
  city text,
  event_type text,
  image_url text,
  email text NOT NULL,
  phone text NOT NULL,
  social_links jsonb DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'pending',
  admin_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.event_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can create submissions" ON public.event_submissions
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = submitter_id);

CREATE POLICY "Users can view own submissions" ON public.event_submissions
  FOR SELECT TO authenticated USING (auth.uid() = submitter_id);

CREATE POLICY "Admins can manage submissions" ON public.event_submissions
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Channel subscriptions table
CREATE TABLE public.channel_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  channel_id uuid NOT NULL REFERENCES public.creator_channels(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, channel_id)
);

ALTER TABLE public.channel_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can subscribe" ON public.channel_subscriptions
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unsubscribe" ON public.channel_subscriptions
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can view own subscriptions" ON public.channel_subscriptions
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Anyone can see subscription counts" ON public.channel_subscriptions
  FOR SELECT TO authenticated USING (true);

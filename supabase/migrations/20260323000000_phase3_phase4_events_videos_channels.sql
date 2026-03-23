-- =============================================================
-- PHASE 3 & 4: Events overhaul + Video/Channel overhaul
-- =============================================================

-- ─── 1. friend_requests table ────────────────────────────
CREATE TABLE IF NOT EXISTS public.friend_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  receiver_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (sender_id, receiver_id)
);

ALTER TABLE public.friend_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own friend requests"
  ON public.friend_requests FOR SELECT
  TO authenticated
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Users can send friend requests"
  ON public.friend_requests FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Receiver can update friend request status"
  ON public.friend_requests FOR UPDATE
  TO authenticated
  USING (auth.uid() = receiver_id)
  WITH CHECK (auth.uid() = receiver_id);

CREATE POLICY "Users can delete own friend requests"
  ON public.friend_requests FOR DELETE
  TO authenticated
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

-- ─── 2. Add approval_status to events ───────────────────
ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS approval_status text NOT NULL DEFAULT 'approved'
  CHECK (approval_status IN ('pending', 'approved', 'rejected'));

ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS submitted_by uuid REFERENCES public.profiles(id);

ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS contact_email text;

ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS contact_phone text;

ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS social_links jsonb DEFAULT '{}';

-- ─── 3. channels table ──────────────────────────────────
CREATE TABLE IF NOT EXISTS public.channels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  handle text NOT NULL UNIQUE,
  description text,
  channel_type text NOT NULL DEFAULT 'team' CHECK (channel_type IN ('team', 'creator', 'loverball_official')),
  league text,
  avatar_url text,
  is_verified boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.channels ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view channels"
  ON public.channels FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Admins can manage channels"
  ON public.channels FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'
    )
  );

-- ─── 4. Add approval_status + channel_id to videos ─────
ALTER TABLE public.videos
  ADD COLUMN IF NOT EXISTS approval_status text NOT NULL DEFAULT 'approved'
  CHECK (approval_status IN ('pending', 'approved', 'rejected'));

ALTER TABLE public.videos
  ADD COLUMN IF NOT EXISTS channel_id uuid REFERENCES public.channels(id);

ALTER TABLE public.videos
  ADD COLUMN IF NOT EXISTS creator_name text;

ALTER TABLE public.videos
  ADD COLUMN IF NOT EXISTS likes_count integer NOT NULL DEFAULT 0;

ALTER TABLE public.videos
  ADD COLUMN IF NOT EXISTS comments_count integer NOT NULL DEFAULT 0;

-- ─── 5. channel_subscriptions table ─────────────────────
CREATE TABLE IF NOT EXISTS public.channel_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  channel_id uuid NOT NULL REFERENCES public.channels(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, channel_id)
);

ALTER TABLE public.channel_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own subscriptions"
  ON public.channel_subscriptions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can subscribe"
  ON public.channel_subscriptions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unsubscribe"
  ON public.channel_subscriptions FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- ─── 6. event_submissions table (for non-approved users to apply) ─
CREATE TABLE IF NOT EXISTS public.event_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  email text NOT NULL,
  phone text NOT NULL,
  social_links jsonb DEFAULT '{}',
  event_title text NOT NULL,
  event_date date NOT NULL,
  event_location text,
  event_description text,
  event_image_url text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.event_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own submissions"
  ON public.event_submissions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can submit events"
  ON public.event_submissions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage submissions"
  ON public.event_submissions FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'
    )
  );

-- ─── 7. Seed: Team Channels ─────────────────────────────

-- NCAA / College
INSERT INTO public.channels (name, handle, description, channel_type, league, is_verified) VALUES
  ('UCLA Bruins', 'ucla-bruins', 'University of California, Los Angeles — Big Ten Conference', 'team', 'Big Ten', true),
  ('USC Trojans', 'usc-trojans', 'University of Southern California — Big Ten Conference', 'team', 'Big Ten', true),
  ('Loyola Marymount Lions', 'lmu-lions', 'Loyola Marymount University — West Coast Conference', 'team', 'WCC', true),
  ('CSUN Matadors', 'csun-matadors', 'California State University, Northridge — Big West Conference', 'team', 'Big West', true),
  ('Long Beach State Beach', 'lbsu-beach', 'Cal State Long Beach — Big West Conference', 'team', 'Big West', true),
  ('Cal State Fullerton Titans', 'csuf-titans', 'Cal State Fullerton — Big West Conference', 'team', 'Big West', true),
  ('UC Irvine Anteaters', 'uci-anteaters', 'University of California, Irvine — Big West Conference', 'team', 'Big West', true)
ON CONFLICT (handle) DO NOTHING;

-- Professional Teams
INSERT INTO public.channels (name, handle, description, channel_type, league, is_verified) VALUES
  ('Los Angeles Dodgers', 'la-dodgers', 'Official Los Angeles Dodgers channel', 'team', 'MLB', true),
  ('Los Angeles Angels', 'la-angels', 'Official Los Angeles Angels channel', 'team', 'MLB', true),
  ('Los Angeles Lakers', 'la-lakers', 'Official Los Angeles Lakers channel', 'team', 'NBA', true),
  ('Los Angeles Clippers', 'la-clippers', 'Official Los Angeles Clippers channel', 'team', 'NBA', true),
  ('Los Angeles Rams', 'la-rams', 'Official Los Angeles Rams channel', 'team', 'NFL', true),
  ('Los Angeles Chargers', 'la-chargers', 'Official Los Angeles Chargers channel', 'team', 'NFL', true),
  ('Los Angeles Kings', 'la-kings', 'Official Los Angeles Kings channel', 'team', 'NHL', true),
  ('Anaheim Ducks', 'anaheim-ducks', 'Official Anaheim Ducks channel', 'team', 'NHL', true),
  ('LA Galaxy', 'la-galaxy', 'Official LA Galaxy channel', 'team', 'MLS', true),
  ('Los Angeles FC', 'lafc', 'Official Los Angeles FC channel', 'team', 'MLS', true),
  ('Los Angeles Sparks', 'la-sparks', 'Official Los Angeles Sparks channel', 'team', 'WNBA', true),
  ('Angel City FC', 'angel-city-fc', 'Official Angel City FC channel', 'team', 'NWSL', true),
  ('LA Rugby Club Women / LARC', 'larc-rugby', 'LA Rugby Club Women', 'team', 'Rugby', true)
ON CONFLICT (handle) DO NOTHING;

-- ─── 8. Seed: Creator Channels ──────────────────────────
INSERT INTO public.channels (name, handle, description, channel_type, league, is_verified) VALUES
  ('Coach Jackie J', 'jcubedhax', 'Women''s sports explainer and culture voice, TikTok/IG, lesbian creator centering women''s sports fandom.', 'creator', NULL, true),
  ('Ari Chambers', 'ariivory', '"It''s about damn time" women''s sports hype leader; WNBA and women''s hoops coverage, interviews, courtside content.', 'creator', NULL, true),
  ('Mariah Rose', 'mariahrose', 'Sports explainers "for the girls, gays and theys"; rules, storylines and culture around major events.', 'creator', NULL, true),
  ('Aliyah Funschelle', 'aliyahfunschelle', 'Host/reporter for pro and college hoops; behind-the-scenes, interviews, arena content.', 'creator', NULL, true),
  ('Logan Hackett', 'logan.hackett', 'Educational women''s sports explainer (NWSL, LPGA, etc.), approachable breakdowns and storylines.', 'creator', NULL, true),
  ('Aliya Kae', 'aliyakae', 'WNBA-focused creator with "Back to Basics" teaching series and league explainers.', 'creator', NULL, true),
  ('Em Woods', 'emwoods', 'Women''s soccer/NWSL and World Cup content; reactions, narrative-driven posts, and fandom skits.', 'creator', NULL, true),
  ('Auntie Nae / Janae Sims', 'auntienae', 'Hoops + family and queer-friendly sports lifestyle content, often WNBA-oriented.', 'creator', NULL, true),
  ('Katie Feeney', 'katiefeeneyy', 'ESPN digital host, NFL and college football coverage with gameday, sideline and campus content.', 'creator', NULL, true),
  ('Tara Davis-Woodhall', 'tarathedart', 'Olympic long jumper; track & field performance, training and lifestyle content.', 'creator', NULL, true),
  ('Jenna Bandy', 'jennabandy21', 'Basketball influencer and former college player; trick shots, challenges, and GameChangeHer girls-in-sport work.', 'creator', NULL, true),
  ('Bria Janelle', 'iambriajanelle', 'In-arena host and announcer; NBA/WNBA/college, golf and hoops lifestyle, game-day BTS.', 'creator', NULL, true),
  ('Toni Cowan-Brown', 'tonicowanbrown', 'F1 and motorsport-focused creator; tech, culture and women''s POV on racing fandom.', 'creator', NULL, true),
  ('Ilona Maher', 'ilonamaher', 'USA Rugby Olympian; rugby, body positivity, tournament storytelling, and comedic content.', 'creator', NULL, true)
ON CONFLICT (handle) DO NOTHING;

-- Loverball Official channel
INSERT INTO public.channels (name, handle, description, channel_type, league, is_verified) VALUES
  ('Loverball Official', 'loverball', 'Official Loverball platform channel — originals, highlights, and community content.', 'loverball_official', NULL, true)
ON CONFLICT (handle) DO NOTHING;

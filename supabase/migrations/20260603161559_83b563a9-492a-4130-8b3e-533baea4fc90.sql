
-- ============================================================
-- Part A: Extend existing events table with host control fields
-- ============================================================
ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS waitlist_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS plus_one_limit integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS open_invite_enabled boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS allow_mutual_invites boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS password_required boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS event_password_hash text,
  ADD COLUMN IF NOT EXISTS show_guest_count boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS anonymize_guest_list boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS hide_activity_timestamps boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS allow_photo_uploads boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS matchmaking_enabled boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS crew_mode_enabled boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS one_to_one_mode_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS matchmaking_requires_approval boolean NOT NULL DEFAULT false;

-- ============================================================
-- Part B: Extend event_rsvps (acts as event_attendees)
-- ============================================================
ALTER TABLE public.event_rsvps
  ADD COLUMN IF NOT EXISTS approval_status text NOT NULL DEFAULT 'not_required',
  ADD COLUMN IF NOT EXISTS attendance_status text NOT NULL DEFAULT 'not_checked_in',
  ADD COLUMN IF NOT EXISTS identity_completed_at timestamptz,
  ADD COLUMN IF NOT EXISTS checked_in_at timestamptz,
  ADD COLUMN IF NOT EXISTS joined_event_chat_at timestamptz,
  ADD COLUMN IF NOT EXISTS invited_by_user_id uuid,
  ADD COLUMN IF NOT EXISTS invite_id uuid;

DO $$ BEGIN
  ALTER TABLE public.event_rsvps
    ADD CONSTRAINT event_rsvps_approval_status_check
    CHECK (approval_status IN ('not_required','pending','approved','waitlisted','removed','blocked'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.event_rsvps
    ADD CONSTRAINT event_rsvps_attendance_status_check
    CHECK (attendance_status IN ('not_checked_in','checked_in','no_show'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE INDEX IF NOT EXISTS event_rsvps_event_status_idx
  ON public.event_rsvps (event_id, approval_status);

-- ============================================================
-- Part C: event_invites
-- ============================================================
CREATE TABLE IF NOT EXISTS public.event_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL,
  invite_type text NOT NULL DEFAULT 'link'
    CHECK (invite_type IN ('link','phone','email','mutual')),
  recipient_phone text,
  recipient_email text,
  invite_link_token text NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex'),
  sent_by_user_id uuid,
  source text,
  status text NOT NULL DEFAULT 'active'
    CHECK (status IN ('active','used','revoked','expired')),
  used_by_user_id uuid,
  used_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS event_invites_event_idx ON public.event_invites (event_id);
CREATE INDEX IF NOT EXISTS event_invites_token_idx ON public.event_invites (invite_link_token);

GRANT SELECT ON public.event_invites TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.event_invites TO authenticated;
GRANT ALL ON public.event_invites TO service_role;

ALTER TABLE public.event_invites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can look up invite by token"
  ON public.event_invites FOR SELECT
  USING (true);

CREATE POLICY "Hosts and admins manage invites"
  ON public.event_invites FOR ALL
  USING (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR EXISTS (SELECT 1 FROM public.events e
               WHERE e.id = event_invites.event_id
                 AND (e.host_user_id = auth.uid() OR auth.uid() = ANY(e.co_host_ids)))
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR EXISTS (SELECT 1 FROM public.events e
               WHERE e.id = event_invites.event_id
                 AND (e.host_user_id = auth.uid() OR auth.uid() = ANY(e.co_host_ids)))
  );

CREATE POLICY "Members create invites for open-invite events"
  ON public.event_invites FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = sent_by_user_id
    AND EXISTS (SELECT 1 FROM public.events e
                WHERE e.id = event_invites.event_id
                  AND (e.open_invite_enabled = true OR e.allow_mutual_invites = true))
  );

-- ============================================================
-- Part D: event_matchmaking_preferences
-- ============================================================
CREATE TABLE IF NOT EXISTS public.event_matchmaking_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL,
  user_id uuid NOT NULL,
  intent_tags text[] NOT NULL DEFAULT '{}',
  team_affinity_tags text[] NOT NULL DEFAULT '{}',
  coming_solo boolean NOT NULL DEFAULT true,
  social_energy text CHECK (social_energy IN ('low_key','open','very_social')),
  match_mode_preference text NOT NULL DEFAULT 'crew'
    CHECK (match_mode_preference IN ('crew','one_to_one','chat_only')),
  meeting_window_preference text CHECK (meeting_window_preference IN ('before','during','after','any')),
  location_preference text,
  age_range_optional text,
  open_to_cross_team_match boolean NOT NULL DEFAULT true,
  notes_optional text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (event_id, user_id)
);

CREATE INDEX IF NOT EXISTS emp_event_idx ON public.event_matchmaking_preferences (event_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.event_matchmaking_preferences TO authenticated;
GRANT ALL ON public.event_matchmaking_preferences TO service_role;

ALTER TABLE public.event_matchmaking_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own matchmaking preferences"
  ON public.event_matchmaking_preferences FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Hosts and admins read event matchmaking preferences"
  ON public.event_matchmaking_preferences FOR SELECT
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR EXISTS (SELECT 1 FROM public.events e
               WHERE e.id = event_matchmaking_preferences.event_id
                 AND (e.host_user_id = auth.uid() OR auth.uid() = ANY(e.co_host_ids)))
  );

CREATE TRIGGER trg_emp_updated_at
  BEFORE UPDATE ON public.event_matchmaking_preferences
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================
-- Part E: event_matches + event_match_members
-- ============================================================
CREATE TABLE IF NOT EXISTS public.event_matches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL,
  match_type text NOT NULL DEFAULT 'crew'
    CHECK (match_type IN ('crew','one_to_one')),
  status text NOT NULL DEFAULT 'proposed'
    CHECK (status IN ('proposed','accepted','declined','expired','completed')),
  label text,
  meeting_time timestamptz,
  meeting_location_label text,
  conversation_id uuid,
  created_by_user_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS event_matches_event_idx ON public.event_matches (event_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.event_matches TO authenticated;
GRANT ALL ON public.event_matches TO service_role;

ALTER TABLE public.event_matches ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.event_match_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_match_id uuid NOT NULL REFERENCES public.event_matches(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  role text NOT NULL DEFAULT 'member'
    CHECK (role IN ('member','organizer')),
  response_status text NOT NULL DEFAULT 'proposed'
    CHECK (response_status IN ('proposed','accepted','declined','removed')),
  checked_in_with_match boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (event_match_id, user_id)
);

CREATE INDEX IF NOT EXISTS emm_match_idx ON public.event_match_members (event_match_id);
CREATE INDEX IF NOT EXISTS emm_user_idx ON public.event_match_members (user_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.event_match_members TO authenticated;
GRANT ALL ON public.event_match_members TO service_role;

ALTER TABLE public.event_match_members ENABLE ROW LEVEL SECURITY;

-- Policies for event_matches (need event_match_members to exist for the membership check)
CREATE POLICY "Members read their matches; hosts read event matches"
  ON public.event_matches FOR SELECT
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR EXISTS (SELECT 1 FROM public.event_match_members m
               WHERE m.event_match_id = event_matches.id AND m.user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.events e
               WHERE e.id = event_matches.event_id
                 AND (e.host_user_id = auth.uid() OR auth.uid() = ANY(e.co_host_ids)))
  );

CREATE POLICY "Hosts and admins manage matches"
  ON public.event_matches FOR ALL
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR EXISTS (SELECT 1 FROM public.events e
               WHERE e.id = event_matches.event_id
                 AND (e.host_user_id = auth.uid() OR auth.uid() = ANY(e.co_host_ids)))
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR EXISTS (SELECT 1 FROM public.events e
               WHERE e.id = event_matches.event_id
                 AND (e.host_user_id = auth.uid() OR auth.uid() = ANY(e.co_host_ids)))
  );

-- Policies for event_match_members
CREATE POLICY "Members read own match memberships; hosts read all"
  ON public.event_match_members FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id
    OR public.has_role(auth.uid(), 'admin'::app_role)
    OR EXISTS (
      SELECT 1 FROM public.event_matches em
      JOIN public.events e ON e.id = em.event_id
      WHERE em.id = event_match_members.event_match_id
        AND (e.host_user_id = auth.uid() OR auth.uid() = ANY(e.co_host_ids))
    )
    OR EXISTS (
      SELECT 1 FROM public.event_match_members peer
      WHERE peer.event_match_id = event_match_members.event_match_id
        AND peer.user_id = auth.uid()
    )
  );

CREATE POLICY "Users update own match membership response"
  ON public.event_match_members FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Hosts and admins manage match members"
  ON public.event_match_members FOR ALL
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR EXISTS (
      SELECT 1 FROM public.event_matches em
      JOIN public.events e ON e.id = em.event_id
      WHERE em.id = event_match_members.event_match_id
        AND (e.host_user_id = auth.uid() OR auth.uid() = ANY(e.co_host_ids))
    )
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR EXISTS (
      SELECT 1 FROM public.event_matches em
      JOIN public.events e ON e.id = em.event_id
      WHERE em.id = event_match_members.event_match_id
        AND (e.host_user_id = auth.uid() OR auth.uid() = ANY(e.co_host_ids))
    )
  );

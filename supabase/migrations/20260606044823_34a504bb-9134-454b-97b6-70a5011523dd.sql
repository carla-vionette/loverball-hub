
-- GAMES
CREATE TABLE public.games (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  external_source text,
  external_game_id text UNIQUE,
  sport text NOT NULL,
  league text NOT NULL,
  division_level text,
  home_team text NOT NULL,
  away_team text NOT NULL,
  home_team_slug text,
  away_team_slug text,
  game_start_at timestamptz NOT NULL,
  venue_name text,
  venue_city text,
  venue_state text,
  venue_lat numeric,
  venue_lng numeric,
  zip_code text,
  market_region text,
  is_local boolean NOT NULL DEFAULT true,
  status text NOT NULL DEFAULT 'scheduled',
  raw_payload jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX games_start_idx ON public.games (game_start_at);
CREATE INDEX games_city_idx ON public.games (venue_city);

GRANT SELECT ON public.games TO anon;
GRANT SELECT ON public.games TO authenticated;
GRANT ALL ON public.games TO service_role;
ALTER TABLE public.games ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Games are viewable by everyone"
  ON public.games FOR SELECT
  USING (true);
CREATE POLICY "Admins manage games"
  ON public.games FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- GAME RSVPS
CREATE TABLE public.game_rsvps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id uuid NOT NULL REFERENCES public.games(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rsvp_type text NOT NULL CHECK (rsvp_type IN ('going_game','going_watch_party','maybe','cant_go')),
  going_solo boolean NOT NULL DEFAULT false,
  plus_one_count integer NOT NULL DEFAULT 0,
  watch_party_venue text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (game_id, user_id)
);
CREATE INDEX game_rsvps_game_idx ON public.game_rsvps (game_id);
CREATE INDEX game_rsvps_user_idx ON public.game_rsvps (user_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.game_rsvps TO authenticated;
GRANT ALL ON public.game_rsvps TO service_role;
ALTER TABLE public.game_rsvps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view RSVPs"
  ON public.game_rsvps FOR SELECT
  TO authenticated
  USING (true);
CREATE POLICY "Users insert own RSVP"
  ON public.game_rsvps FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own RSVP"
  ON public.game_rsvps FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own RSVP"
  ON public.game_rsvps FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- GAME CHATS
CREATE TABLE public.game_chats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id uuid NOT NULL REFERENCES public.games(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message text NOT NULL CHECK (length(message) BETWEEN 1 AND 2000),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX game_chats_game_idx ON public.game_chats (game_id, created_at);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.game_chats TO authenticated;
GRANT ALL ON public.game_chats TO service_role;
ALTER TABLE public.game_chats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated read game chats"
  ON public.game_chats FOR SELECT
  TO authenticated
  USING (true);
CREATE POLICY "Users post own messages"
  ON public.game_chats FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own messages"
  ON public.game_chats FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'::app_role));

-- Triggers for updated_at
CREATE TRIGGER games_updated_at BEFORE UPDATE ON public.games
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER game_rsvps_updated_at BEFORE UPDATE ON public.game_rsvps
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.game_rsvps;
ALTER PUBLICATION supabase_realtime ADD TABLE public.game_chats;

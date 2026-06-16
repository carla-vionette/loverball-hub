
-- 1) Dismissals table
CREATE TABLE IF NOT EXISTS public.fan_dismissals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  dismissed_user_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, dismissed_user_id)
);

GRANT SELECT, INSERT, DELETE ON public.fan_dismissals TO authenticated;
GRANT ALL ON public.fan_dismissals TO service_role;

ALTER TABLE public.fan_dismissals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own dismissals" ON public.fan_dismissals
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users insert own dismissals" ON public.fan_dismissals
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own dismissals" ON public.fan_dismissals
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS fan_dismissals_user_idx ON public.fan_dismissals(user_id);

-- 2) Matching RPC
CREATE OR REPLACE FUNCTION public.get_fan_matches(_user_id uuid, _limit int DEFAULT 12)
RETURNS TABLE (
  id uuid,
  name text,
  city text,
  bio text,
  profile_photo_url text,
  favorite_la_teams text[],
  favorite_sports text[],
  match_score int,
  reasons text[]
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  me record;
BEGIN
  IF _user_id IS NULL THEN RETURN; END IF;

  SELECT
    p.id, p.city, p.neighborhood,
    COALESCE(p.favorite_la_teams, ARRAY[]::text[])      AS teams_la,
    COALESCE(p.favorite_teams, ARRAY[]::text[])         AS teams,
    COALESCE(p.favorite_teams_players, ARRAY[]::text[]) AS teams_players,
    COALESCE(p.favorite_sports, ARRAY[]::text[])        AS sports,
    COALESCE(p.pro_leagues, ARRAY[]::text[])            AS pro_leagues,
    COALESCE(p.college_leagues, ARRAY[]::text[])        AS college_leagues,
    COALESCE(p.other_interests, ARRAY[]::text[])        AS interests,
    COALESCE(p.looking_for_tags, ARRAY[]::text[])       AS looking_for,
    COALESCE(p.vibe_tags, ARRAY[]::text[])              AS vibes
  INTO me
  FROM public.profiles p
  WHERE p.id = _user_id;

  IF me.id IS NULL THEN RETURN; END IF;

  RETURN QUERY
  WITH
  my_teams_all AS (
    SELECT DISTINCT lower(t) AS t
    FROM unnest(me.teams_la || me.teams || me.teams_players) AS t
    WHERE t IS NOT NULL AND t <> ''
  ),
  my_sports_all AS (
    SELECT DISTINCT lower(s) AS s
    FROM unnest(me.sports || me.pro_leagues || me.college_leagues) AS s
    WHERE s IS NOT NULL AND s <> ''
  ),
  my_interests_all AS (
    SELECT DISTINCT lower(i) AS i
    FROM unnest(me.interests || me.looking_for || me.vibes) AS i
    WHERE i IS NOT NULL AND i <> ''
  ),
  excluded AS (
    SELECT _user_id AS uid
    UNION
    SELECT CASE WHEN f.requester_id = _user_id THEN f.addressee_id ELSE f.requester_id END
      FROM public.friendships f
      WHERE (f.requester_id = _user_id OR f.addressee_id = _user_id)
        AND f.status IN ('accepted','pending','blocked')
    UNION
    SELECT d.dismissed_user_id FROM public.fan_dismissals d WHERE d.user_id = _user_id
  ),
  my_events AS (
    SELECT event_id FROM public.event_rsvps WHERE user_id = _user_id AND status IN ('going','interested')
    UNION
    SELECT event_id FROM public.event_guests WHERE user_id = _user_id AND status IN ('going','interested')
  ),
  my_checkins AS (
    SELECT DISTINCT COALESCE(watch_location_id::text, place_external_id) AS spot
    FROM public.game_watch_checkins
    WHERE user_id = _user_id
      AND COALESCE(watch_location_id::text, place_external_id) IS NOT NULL
  ),
  my_following AS (
    SELECT following_id AS uid FROM public.follows WHERE follower_id = _user_id
  ),
  candidates AS (
    SELECT p.*
    FROM public.profiles p
    WHERE p.id <> _user_id
      AND p.id NOT IN (SELECT uid FROM excluded WHERE uid IS NOT NULL)
      AND p.name IS NOT NULL
  ),
  scored AS (
    SELECT
      c.id, c.name, c.city, c.bio, c.profile_photo_url,
      c.favorite_la_teams, c.favorite_sports,
      -- counts
      (
        SELECT count(*) FROM (
          SELECT DISTINCT lower(t) AS t
          FROM unnest(COALESCE(c.favorite_la_teams, ARRAY[]::text[])
                    || COALESCE(c.favorite_teams, ARRAY[]::text[])
                    || COALESCE(c.favorite_teams_players, ARRAY[]::text[])) AS t
          WHERE t IS NOT NULL AND t <> ''
        ) x WHERE x.t IN (SELECT t FROM my_teams_all)
      ) AS shared_teams,
      (
        SELECT count(*) FROM (
          SELECT DISTINCT lower(s) AS s
          FROM unnest(COALESCE(c.favorite_sports, ARRAY[]::text[])
                    || COALESCE(c.pro_leagues, ARRAY[]::text[])
                    || COALESCE(c.college_leagues, ARRAY[]::text[])) AS s
          WHERE s IS NOT NULL AND s <> ''
        ) x WHERE x.s IN (SELECT s FROM my_sports_all)
      ) AS shared_sports,
      (
        SELECT count(*) FROM (
          SELECT DISTINCT lower(i) AS i
          FROM unnest(COALESCE(c.other_interests, ARRAY[]::text[])
                    || COALESCE(c.looking_for_tags, ARRAY[]::text[])
                    || COALESCE(c.vibe_tags, ARRAY[]::text[])) AS i
          WHERE i IS NOT NULL AND i <> ''
        ) x WHERE x.i IN (SELECT i FROM my_interests_all)
      ) AS shared_interests,
      (CASE WHEN me.city IS NOT NULL AND c.city IS NOT NULL
              AND lower(c.city) = lower(me.city) THEN 1 ELSE 0 END) AS same_city,
      (CASE WHEN me.neighborhood IS NOT NULL AND c.neighborhood IS NOT NULL
              AND lower(c.neighborhood) = lower(me.neighborhood) THEN 1 ELSE 0 END) AS same_hood,
      (
        SELECT count(DISTINCT er.event_id)
        FROM public.event_rsvps er
        WHERE er.user_id = c.id
          AND er.status IN ('going','interested')
          AND er.event_id IN (SELECT event_id FROM my_events)
      ) + (
        SELECT count(DISTINCT eg.event_id)
        FROM public.event_guests eg
        WHERE eg.user_id = c.id
          AND eg.status IN ('going','interested')
          AND eg.event_id IN (SELECT event_id FROM my_events)
      ) AS mutual_events,
      (
        SELECT count(DISTINCT COALESCE(wc.watch_location_id::text, wc.place_external_id))
        FROM public.game_watch_checkins wc
        WHERE wc.user_id = c.id
          AND COALESCE(wc.watch_location_id::text, wc.place_external_id) IN (SELECT spot FROM my_checkins)
      ) AS shared_spots,
      (
        SELECT count(*) FROM public.follows f
        WHERE f.follower_id = c.id
          AND f.following_id IN (SELECT uid FROM my_following)
      ) AS mutual_follows,
      -- top labels for reason building
      (
        SELECT (array_agg(initcap(x.t)))[1] FROM (
          SELECT DISTINCT lower(t) AS t
          FROM unnest(COALESCE(c.favorite_la_teams, ARRAY[]::text[])
                    || COALESCE(c.favorite_teams, ARRAY[]::text[])
                    || COALESCE(c.favorite_teams_players, ARRAY[]::text[])) AS t
        ) x WHERE x.t IN (SELECT t FROM my_teams_all)
      ) AS first_team,
      (
        SELECT (array_agg(upper(x.s)))[1] FROM (
          SELECT DISTINCT lower(s) AS s
          FROM unnest(COALESCE(c.favorite_sports, ARRAY[]::text[])
                    || COALESCE(c.pro_leagues, ARRAY[]::text[])
                    || COALESCE(c.college_leagues, ARRAY[]::text[])) AS s
        ) x WHERE x.s IN (SELECT s FROM my_sports_all)
      ) AS first_sport,
      (
        SELECT (array_agg(initcap(x.i)))[1] FROM (
          SELECT DISTINCT lower(i) AS i
          FROM unnest(COALESCE(c.other_interests, ARRAY[]::text[])
                    || COALESCE(c.looking_for_tags, ARRAY[]::text[])
                    || COALESCE(c.vibe_tags, ARRAY[]::text[])) AS i
        ) x WHERE x.i IN (SELECT i FROM my_interests_all)
      ) AS first_interest
    FROM candidates c
  ),
  reasoned AS (
    SELECT
      s.id, s.name, s.city, s.bio, s.profile_photo_url,
      s.favorite_la_teams, s.favorite_sports,
      (s.shared_teams * 5
       + s.shared_sports * 3
       + s.shared_interests * 2
       + s.same_city * 2
       + s.same_hood * 1
       + s.mutual_events * 2
       + s.shared_spots * 1
       + s.mutual_follows * 1)::int AS match_score,
      -- ordered reasons: take top 3 by weight present
      (
        SELECT array_agg(label ORDER BY weight DESC)
        FROM (
          SELECT label, weight FROM (VALUES
            (CASE WHEN s.shared_teams > 0 THEN
              CASE WHEN s.shared_teams = 1 THEN 'Both ' || COALESCE(s.first_team,'team') || ' fans'
                   ELSE 'Share ' || s.shared_teams || ' teams' END
            END, s.shared_teams * 5),
            (CASE WHEN s.shared_sports > 0 THEN
              CASE WHEN s.shared_sports = 1 THEN 'Both into ' || COALESCE(s.first_sport,'sport')
                   ELSE 'Share ' || s.shared_sports || ' sports' END
            END, s.shared_sports * 3),
            (CASE WHEN s.mutual_events > 0 THEN
              s.mutual_events::text || ' mutual event' || CASE WHEN s.mutual_events > 1 THEN 's' ELSE '' END
            END, s.mutual_events * 2),
            (CASE WHEN s.shared_interests > 0 THEN
              CASE WHEN s.shared_interests = 1 THEN 'Both like ' || COALESCE(s.first_interest,'this')
                   ELSE 'Share ' || s.shared_interests || ' interests' END
            END, s.shared_interests * 2),
            (CASE WHEN s.same_city = 1 THEN 'Both in ' || s.city END, 2),
            (CASE WHEN s.same_hood = 1 THEN 'Same neighborhood' END, 1),
            (CASE WHEN s.shared_spots > 0 THEN
              s.shared_spots::text || ' shared watch spot' || CASE WHEN s.shared_spots > 1 THEN 's' ELSE '' END
            END, s.shared_spots * 1),
            (CASE WHEN s.mutual_follows > 0 THEN
              s.mutual_follows::text || ' mutual follow' || CASE WHEN s.mutual_follows > 1 THEN 's' ELSE '' END
            END, s.mutual_follows * 1)
          ) AS v(label, weight)
          WHERE label IS NOT NULL
          ORDER BY weight DESC
          LIMIT 3
        ) t
      ) AS reasons
    FROM scored s
  )
  SELECT r.id, r.name, r.city, r.bio, r.profile_photo_url,
         r.favorite_la_teams, r.favorite_sports,
         r.match_score, COALESCE(r.reasons, ARRAY[]::text[]) AS reasons
  FROM reasoned r
  WHERE r.match_score > 0
  ORDER BY r.match_score DESC, r.name ASC
  LIMIT GREATEST(_limit, 1);
END;
$$;

REVOKE ALL ON FUNCTION public.get_fan_matches(uuid, int) FROM public;
GRANT EXECUTE ON FUNCTION public.get_fan_matches(uuid, int) TO authenticated, service_role;

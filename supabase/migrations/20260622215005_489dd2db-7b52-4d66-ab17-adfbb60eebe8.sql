-- drops table
CREATE TABLE public.drops (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  reward_type text,
  image_url text,
  available_from timestamptz,
  available_until timestamptz,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.drops TO authenticated;
GRANT ALL ON public.drops TO service_role;

ALTER TABLE public.drops ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Signed-in users read active drops"
  ON public.drops FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE POLICY "Admins manage drops"
  ON public.drops FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER drops_set_updated_at
  BEFORE UPDATE ON public.drops
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- watch_parties table
CREATE TABLE public.watch_parties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  host_user_id uuid NOT NULL,
  title text NOT NULL,
  game_label text,
  venue_name text,
  city text,
  starts_at timestamptz NOT NULL,
  cover_image_url text,
  is_published boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.watch_parties TO authenticated;
GRANT ALL ON public.watch_parties TO service_role;

ALTER TABLE public.watch_parties ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Signed-in users read published watch parties"
  ON public.watch_parties FOR SELECT
  TO authenticated
  USING (is_published = true);

CREATE POLICY "Hosts manage their own watch parties"
  ON public.watch_parties FOR ALL
  TO authenticated
  USING (auth.uid() = host_user_id)
  WITH CHECK (auth.uid() = host_user_id);

CREATE TRIGGER watch_parties_set_updated_at
  BEFORE UPDATE ON public.watch_parties
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
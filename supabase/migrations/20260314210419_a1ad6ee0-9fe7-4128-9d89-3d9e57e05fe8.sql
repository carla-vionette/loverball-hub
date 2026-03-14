
-- 1. Create a separate table for creator channel contact emails (owner/admin only)
CREATE TABLE IF NOT EXISTS public.creator_channel_emails (
  channel_id uuid PRIMARY KEY REFERENCES public.creator_channels(id) ON DELETE CASCADE,
  contact_email text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.creator_channel_emails ENABLE ROW LEVEL SECURITY;

-- Only channel owners can see/manage their own contact email
CREATE POLICY "Channel owners can view own email"
  ON public.creator_channel_emails FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.creator_channels
      WHERE creator_channels.id = creator_channel_emails.channel_id
        AND creator_channels.owner_user_id = auth.uid()
    )
    OR has_role(auth.uid(), 'admin'::app_role)
  );

CREATE POLICY "Channel owners can insert own email"
  ON public.creator_channel_emails FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.creator_channels
      WHERE creator_channels.id = creator_channel_emails.channel_id
        AND creator_channels.owner_user_id = auth.uid()
    )
  );

CREATE POLICY "Channel owners can update own email"
  ON public.creator_channel_emails FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.creator_channels
      WHERE creator_channels.id = creator_channel_emails.channel_id
        AND creator_channels.owner_user_id = auth.uid()
    )
    OR has_role(auth.uid(), 'admin'::app_role)
  );

CREATE POLICY "Admins can manage all emails"
  ON public.creator_channel_emails FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- 2. Migrate existing contact_email data
INSERT INTO public.creator_channel_emails (channel_id, contact_email)
SELECT id, contact_email FROM public.creator_channels
WHERE contact_email IS NOT NULL
ON CONFLICT (channel_id) DO NOTHING;

-- 3. Drop the contact_email column from creator_channels
ALTER TABLE public.creator_channels DROP COLUMN IF EXISTS contact_email;

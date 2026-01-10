-- Drop the problematic policies
DROP POLICY IF EXISTS "Users can increment invite used count" ON public.invites;
DROP POLICY IF EXISTS "Anyone can validate invite codes" ON public.invites;

-- Create a secure function to validate and consume invite codes
CREATE OR REPLACE FUNCTION public.validate_and_use_invite(invite_code TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_invite RECORD;
  v_user_id UUID;
  v_existing_role RECORD;
BEGIN
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
  END IF;
  
  -- Check if user already has member role
  SELECT * INTO v_existing_role FROM public.user_roles 
  WHERE user_id = v_user_id AND role = 'member';
  
  IF FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Already a member');
  END IF;
  
  -- Find and lock the invite
  SELECT * INTO v_invite FROM public.invites
  WHERE code = UPPER(TRIM(invite_code))
  FOR UPDATE;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid code');
  END IF;
  
  -- Check expiration
  IF v_invite.expires_at IS NOT NULL AND v_invite.expires_at < NOW() THEN
    RETURN jsonb_build_object('success', false, 'error', 'Code expired');
  END IF;
  
  -- Check max uses
  IF v_invite.max_uses IS NOT NULL AND v_invite.used_count >= v_invite.max_uses THEN
    RETURN jsonb_build_object('success', false, 'error', 'Code exhausted');
  END IF;
  
  -- Increment used count
  UPDATE public.invites SET used_count = used_count + 1 WHERE id = v_invite.id;
  
  -- Grant member role
  INSERT INTO public.user_roles (user_id, role) VALUES (v_user_id, 'member')
  ON CONFLICT (user_id, role) DO NOTHING;
  
  RETURN jsonb_build_object('success', true);
END;
$$;

-- Remove the INSERT policy we added earlier since the function handles it
DROP POLICY IF EXISTS "Users can insert own member role" ON public.user_roles;
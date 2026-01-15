-- Create function to validate admin role assignments
CREATE OR REPLACE FUNCTION public.validate_admin_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_email TEXT;
  allowed_emails TEXT[] := ARRAY['carla@loverball.com', 'icastro@loverball.com'];
BEGIN
  -- Only check for admin role assignments
  IF NEW.role = 'admin' THEN
    -- Get the user's email
    SELECT email INTO user_email
    FROM auth.users
    WHERE id = NEW.user_id;
    
    -- Check if email is in allowed list
    IF user_email IS NULL OR NOT (user_email = ANY(allowed_emails)) THEN
      RAISE EXCEPTION 'Only authorized users can be assigned admin role';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger to validate before insert or update
DROP TRIGGER IF EXISTS validate_admin_role_trigger ON public.user_roles;
CREATE TRIGGER validate_admin_role_trigger
  BEFORE INSERT OR UPDATE ON public.user_roles
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_admin_role();
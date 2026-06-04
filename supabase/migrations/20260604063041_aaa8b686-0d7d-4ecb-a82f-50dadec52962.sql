DROP FUNCTION IF EXISTS public.admin_get_event_attendees(uuid);

CREATE OR REPLACE FUNCTION public.admin_get_event_attendees(p_event_id uuid)
 RETURNS TABLE(id uuid, status text, approval_status text, user_id uuid, plus_ones integer, guest_name text, guest_phone text, created_at timestamp with time zone, profile_name text, profile_city text, profile_photo_url text, profile_instagram_url text, profile_email text)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;

  RETURN QUERY
  SELECT r.id, r.status, r.approval_status, r.user_id, r.plus_ones, r.guest_name, r.guest_phone, r.created_at,
         p.name, p.city, p.profile_photo_url, p.instagram_url,
         u.email::text
  FROM public.event_rsvps r
  LEFT JOIN public.profiles p ON p.id = r.user_id
  LEFT JOIN auth.users u ON u.id = r.user_id
  WHERE r.event_id = p_event_id
  ORDER BY (CASE WHEN r.approval_status = 'pending' THEN 0 ELSE 1 END), r.created_at ASC;
END;
$function$;
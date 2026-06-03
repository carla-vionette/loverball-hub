UPDATE public.events
   SET password_required = true,
       event_password_hash = crypt('loverball', gen_salt('bf', 10))
 WHERE id = '6abdbee4-b29d-4fb0-a615-f3d99d58a397';
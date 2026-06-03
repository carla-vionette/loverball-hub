UPDATE public.events
   SET password_required = false,
       event_password_hash = NULL
 WHERE id = '6abdbee4-b29d-4fb0-a615-f3d99d58a397';
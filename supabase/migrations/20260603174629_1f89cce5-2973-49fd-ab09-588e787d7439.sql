INSERT INTO public.events (id, title, event_date, visibility, password_required, event_password_hash, slug)
VALUES (
  '00000000-0000-0000-0000-00000000beef',
  '[TEST] Lockout E2E Event',
  current_date + 30,
  'invite_only',
  true,
  extensions.crypt('lockout-test-pw', extensions.gen_salt('bf', 10)),
  '__test-lockout-event'
)
ON CONFLICT (id) DO UPDATE
  SET event_password_hash = extensions.crypt('lockout-test-pw', extensions.gen_salt('bf', 10)),
      password_required = true,
      visibility = 'invite_only';
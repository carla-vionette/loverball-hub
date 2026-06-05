
-- 1. event_submissions: add owner DELETE
CREATE POLICY "Users can delete own submissions"
ON public.event_submissions
FOR DELETE
TO authenticated
USING (auth.uid() = submitter_id);

-- 2. lb_users: tighten insert/update to authenticated + add owner DELETE
DROP POLICY IF EXISTS "lb_users self insert" ON public.lb_users;
DROP POLICY IF EXISTS "lb_users self update" ON public.lb_users;

CREATE POLICY "lb_users self insert"
ON public.lb_users
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

CREATE POLICY "lb_users self update"
ON public.lb_users
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

CREATE POLICY "lb_users self delete"
ON public.lb_users
FOR DELETE
TO authenticated
USING (auth.uid() = id);

-- 3. realtime.messages: replace substring topic check with strict user-prefix structure
DROP POLICY IF EXISTS "Authenticated can read own-scoped topics" ON realtime.messages;
DROP POLICY IF EXISTS "Authenticated can broadcast on own-scoped topics" ON realtime.messages;

CREATE POLICY "Authenticated can read own user topics"
ON realtime.messages
FOR SELECT
TO authenticated
USING (
  realtime.topic() IS NOT NULL
  AND (
    realtime.topic() = 'user:' || (auth.uid())::text
    OR realtime.topic() LIKE 'user:' || (auth.uid())::text || ':%'
  )
);

CREATE POLICY "Authenticated can broadcast on own user topics"
ON realtime.messages
FOR INSERT
TO authenticated
WITH CHECK (
  realtime.topic() IS NOT NULL
  AND (
    realtime.topic() = 'user:' || (auth.uid())::text
    OR realtime.topic() LIKE 'user:' || (auth.uid())::text || ':%'
  )
);

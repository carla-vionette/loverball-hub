
-- 1. Profile contact + notification preference columns
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS phone text,
  ADD COLUMN IF NOT EXISTS email text,
  ADD COLUMN IF NOT EXISTS in_app_notifications_enabled boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS email_notifications_enabled boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS sms_unsubscribed boolean NOT NULL DEFAULT false;

-- Ensure existing sms_notifications_enabled defaults ON
ALTER TABLE public.profiles
  ALTER COLUMN sms_notifications_enabled SET DEFAULT true;

-- 2. Index for notification inbox
CREATE INDEX IF NOT EXISTS idx_notifications_user_created
  ON public.notifications (user_id, created_at DESC);

-- 3. Allow authenticated users to insert notifications targeted at others (for trigger-style flows)
DROP POLICY IF EXISTS "Authenticated can insert notifications" ON public.notifications;
CREATE POLICY "Authenticated can insert notifications"
  ON public.notifications FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- 4. Trigger: notify on new follow
CREATE OR REPLACE FUNCTION public.notify_on_follow()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  follower_name text;
BEGIN
  SELECT name INTO follower_name FROM public.profiles WHERE id = NEW.follower_id;
  INSERT INTO public.notifications (user_id, type, title, body, link, metadata)
  VALUES (
    NEW.following_id,
    'follow',
    COALESCE(follower_name, 'Someone') || ' started following you',
    NULL,
    '/profile/' || NEW.follower_id,
    jsonb_build_object('actor_id', NEW.follower_id)
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_on_follow ON public.follows;
CREATE TRIGGER trg_notify_on_follow
  AFTER INSERT ON public.follows
  FOR EACH ROW EXECUTE FUNCTION public.notify_on_follow();

-- 5. Trigger: notify on friendship request
CREATE OR REPLACE FUNCTION public.notify_on_friend_request()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  requester_name text;
BEGIN
  IF NEW.status = 'pending' THEN
    SELECT name INTO requester_name FROM public.profiles WHERE id = NEW.requester_id;
    INSERT INTO public.notifications (user_id, type, title, body, link, metadata)
    VALUES (
      NEW.addressee_id,
      'friend_request',
      COALESCE(requester_name, 'Someone') || ' wants to connect',
      NULL,
      '/friends',
      jsonb_build_object('actor_id', NEW.requester_id, 'friendship_id', NEW.id)
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_on_friend_request ON public.friendships;
CREATE TRIGGER trg_notify_on_friend_request
  AFTER INSERT ON public.friendships
  FOR EACH ROW EXECUTE FUNCTION public.notify_on_friend_request();

-- 6. Trigger: notify on direct message
CREATE OR REPLACE FUNCTION public.notify_on_direct_message()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  sender_name text;
BEGIN
  SELECT name INTO sender_name FROM public.profiles WHERE id = NEW.sender_id;
  INSERT INTO public.notifications (user_id, type, title, body, link, metadata)
  VALUES (
    NEW.receiver_id,
    'direct_message',
    COALESCE(sender_name, 'Someone') || ' sent you a message',
    LEFT(NEW.message, 140),
    '/messages',
    jsonb_build_object('actor_id', NEW.sender_id, 'message_id', NEW.id)
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_on_direct_message ON public.direct_messages;
CREATE TRIGGER trg_notify_on_direct_message
  AFTER INSERT ON public.direct_messages
  FOR EACH ROW EXECUTE FUNCTION public.notify_on_direct_message();

-- 7. Lightweight SMS rate limit table
CREATE TABLE IF NOT EXISTS public.sms_send_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  to_phone text NOT NULL,
  body_preview text,
  status text NOT NULL DEFAULT 'sent',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.sms_send_log ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins read sms log" ON public.sms_send_log;
CREATE POLICY "Admins read sms log" ON public.sms_send_log
  FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));
CREATE INDEX IF NOT EXISTS idx_sms_send_log_user_time
  ON public.sms_send_log (user_id, created_at DESC);

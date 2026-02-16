
-- Notification preferences per team/sport
CREATE TABLE public.notification_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  preference_type text NOT NULL, -- 'team' or 'sport'
  preference_key text NOT NULL, -- e.g. 'lakers', 'basketball'
  game_reminders boolean NOT NULL DEFAULT true,
  event_alerts boolean NOT NULL DEFAULT true,
  news_updates boolean NOT NULL DEFAULT false,
  sms_enabled boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, preference_type, preference_key)
);

ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notification prefs"
ON public.notification_preferences FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own notification prefs"
ON public.notification_preferences FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own notification prefs"
ON public.notification_preferences FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own notification prefs"
ON public.notification_preferences FOR DELETE
USING (auth.uid() = user_id);

-- User feed preferences (hidden categories/sports)
CREATE TABLE public.user_feed_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  hidden_sports text[] NOT NULL DEFAULT '{}',
  hidden_event_types text[] NOT NULL DEFAULT '{}',
  home_venue text,
  home_neighborhood text,
  preferred_distance_miles integer DEFAULT 25,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.user_feed_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own feed prefs"
ON public.user_feed_preferences FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own feed prefs"
ON public.user_feed_preferences FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own feed prefs"
ON public.user_feed_preferences FOR UPDATE
USING (auth.uid() = user_id);

-- In-app notifications
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  type text NOT NULL, -- 'game_reminder', 'event_reminder', 'new_message', 'connection', 'system'
  title text NOT NULL,
  body text,
  link text,
  is_read boolean NOT NULL DEFAULT false,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications"
ON public.notifications FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
ON public.notifications FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own notifications"
ON public.notifications FOR DELETE
USING (auth.uid() = user_id);

-- Service/system can insert notifications
CREATE POLICY "System can insert notifications"
ON public.notifications FOR INSERT
WITH CHECK (true);

-- Enable realtime for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- Triggers for updated_at
CREATE TRIGGER update_notification_preferences_updated_at
BEFORE UPDATE ON public.notification_preferences
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_user_feed_preferences_updated_at
BEFORE UPDATE ON public.user_feed_preferences
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

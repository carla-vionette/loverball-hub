
CREATE OR REPLACE FUNCTION public.notify_on_chat_message()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  sender_name text;
  recipient_id uuid;
BEGIN
  SELECT CASE WHEN m.user_a_id = NEW.sender_id THEN m.user_b_id ELSE m.user_a_id END
    INTO recipient_id
  FROM public.chats c JOIN public.matches m ON m.id = c.match_id
  WHERE c.id = NEW.chat_id;

  IF recipient_id IS NULL THEN RETURN NEW; END IF;

  SELECT name INTO sender_name FROM public.profiles WHERE id = NEW.sender_id;

  INSERT INTO public.notifications (user_id, type, title, body, link, metadata)
  VALUES (
    recipient_id,
    'message',
    COALESCE(sender_name, 'Someone') || ' sent you a message',
    LEFT(NEW.content, 140),
    '/dms',
    jsonb_build_object('actor_id', NEW.sender_id, 'chat_id', NEW.chat_id, 'message_id', NEW.id)
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_on_chat_message ON public.messages;
CREATE TRIGGER trg_notify_on_chat_message
AFTER INSERT ON public.messages
FOR EACH ROW EXECUTE FUNCTION public.notify_on_chat_message();

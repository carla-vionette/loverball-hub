-- Create rate limit tracking table
CREATE TABLE public.rate_limit_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  action_type TEXT NOT NULL,
  request_count INTEGER NOT NULL DEFAULT 1,
  window_start TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.rate_limit_log ENABLE ROW LEVEL SECURITY;

-- Only the system/edge functions can manage rate limits
CREATE POLICY "Service role only"
  ON public.rate_limit_log
  FOR ALL
  USING (false)
  WITH CHECK (false);

-- Create index for fast lookups
CREATE INDEX idx_rate_limit_user_action ON public.rate_limit_log(user_id, action_type, window_start);

-- Function to check and update rate limit (returns true if allowed)
CREATE OR REPLACE FUNCTION public.check_rate_limit(
  p_user_id UUID,
  p_action_type TEXT,
  p_max_requests INTEGER DEFAULT 100,
  p_window_minutes INTEGER DEFAULT 15
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_window_start TIMESTAMP WITH TIME ZONE;
  v_current_count INTEGER;
BEGIN
  v_window_start := now() - (p_window_minutes || ' minutes')::INTERVAL;
  
  -- Count requests in current window
  SELECT COALESCE(SUM(request_count), 0) INTO v_current_count
  FROM public.rate_limit_log
  WHERE user_id = p_user_id 
    AND action_type = p_action_type
    AND window_start >= v_window_start;
  
  -- Check if over limit
  IF v_current_count >= p_max_requests THEN
    RETURN false;
  END IF;
  
  -- Log this request
  INSERT INTO public.rate_limit_log (user_id, action_type, window_start)
  VALUES (p_user_id, p_action_type, now());
  
  -- Cleanup old entries (older than 1 hour)
  DELETE FROM public.rate_limit_log 
  WHERE window_start < now() - INTERVAL '1 hour';
  
  RETURN true;
END;
$$;
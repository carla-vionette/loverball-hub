ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS account_type text DEFAULT 'fan';

UPDATE public.profiles SET account_type = 'fan' WHERE account_type IS NULL;
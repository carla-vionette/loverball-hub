-- Add phone number field to profiles
ALTER TABLE public.profiles ADD COLUMN phone_number text;

-- Add notification preferences
ALTER TABLE public.profiles ADD COLUMN sms_notifications_enabled boolean DEFAULT true;
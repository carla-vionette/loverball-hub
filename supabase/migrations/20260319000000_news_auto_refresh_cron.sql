-- Migration: Schedule automatic news refresh via pg_cron + pg_net
-- Requires: pg_cron and pg_net extensions (enabled in migration 20260318211400)
-- Runs fetch-sports-news edge function every 2 hours

SELECT cron.schedule(
  'fetch-sports-news-every-2h',
  '0 */2 * * *',
  $$
  SELECT net.http_post(
    url := 'https://nfjavjfxgxrpvieinpdp.supabase.co/functions/v1/fetch-sports-news',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5mamF2amZ4Z3hycHZpZWlucGRwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ0NDc4ODcsImV4cCI6MjA4MDAyMzg4N30.4JeTq8_D-g611y1ruIHFJwVmomnms6mNOWF6ORrkq0U"}'::jsonb,
    body := '{}'::jsonb
  );
  $$
);
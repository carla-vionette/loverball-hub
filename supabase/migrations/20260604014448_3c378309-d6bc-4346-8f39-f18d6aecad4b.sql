ALTER TABLE public.events ADD COLUMN IF NOT EXISTS promoted BOOLEAN NOT NULL DEFAULT FALSE;

-- Update the FIFA World Cup Watch Party to be promoted
UPDATE public.events SET promoted = TRUE WHERE id = 'bbcbee9f-56a9-430b-a2d5-97472cc17c4a';

-- Grant access to the new column (column inherits table grants, but being explicit for clarity)
-- No additional RLS changes needed; promoted flag is just for UI sorting
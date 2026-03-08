ALTER TABLE public.feed_items ADD CONSTRAINT feed_items_source_url_key UNIQUE (source_url);
DELETE FROM public.feed_items;
UPDATE public.events
SET description = regexp_replace(
  description,
  E'\\n*### Where to Watch in [^\\n]*\\n(?:- [^\\n]*\\n?)*(?:\\nPull up solo[^\\n]*)?',
  '',
  'g'
)
WHERE description ILIKE '%### Where to Watch in%';
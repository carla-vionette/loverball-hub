## Scope

Rebuild `src/pages/Index.tsx` as a modular, mobile-first marketing homepage in the project's existing editorial design system (Deep Navy / Coral, Oswald / Poppins, 20px radius). Reuse existing tokens and shadcn primitives. No new global design tokens.

Stay strictly within the homepage and its new section components. No changes to auth, routing, navigation, profile, or other pages except a small `useAuth` read for the gated Drop.

## Section build order (matches the brief)

1. **Hero** — full-bleed editorial hero on Deep Navy.
   - H1: *"Finally, a sports community built for women."*  
     (Alternates kept as code comments only — single rendered headline.)
   - Subhead + ZIP input ("Enter your ZIP to find your sports people nearby.") — removes all "favorite stadium" copy from the homepage.
   - Primary CTA `Join the Club` → `/auth`; secondary `See what members get` → scrolls to Membership.
   - Proof bar pulled from a small editable config object (fans / events / cities) so non-technical edits stay in one place.

2. **Community / Social Proof** — 4 persona testimonial cards (new-to-LA, solo fan, WNBA/NWSL fan, came-for-events-stayed-for-friends). Every card marked `// TODO: replace with real member quote` so placeholders cannot ship unnoticed. Imagery uses branded color blocks + initials (memory: no AI/fake faces).

3. **Benefits** — 3 outcome-led pillars, rewritten per spec, with distinct iconography and asymmetric layout to avoid SaaS grid feel.

4. **The Drop — Every Monday** (new, gated).
   - New Supabase table `public.drops` (title, description, reward_type, image_url, available_from, available_until, is_active) with RLS: anyone signed-in reads active drops, only admins write.
   - Component fetches the current active drop. Signed-in members see live content; signed-out / non-members see a blurred premium teaser with "Members only — Join to unlock" overlay. The gated state is real, not just CSS.

5. **Product Preview** — mock cards for local watch parties, fan crews, member posts, and event activity. Every mock block tagged `// MOCK: …` in source. Scaffolds new `public.watch_parties` table and a `member-media` Supabase Storage bucket so the shape exists for the next iteration.

6. **Event Recap / Media** — recap gallery with short captions (uses branded color blocks until real media is uploaded — memory: no fake event photography). Lazy-loaded.

7. **Stories — "From the Sidelines"** — pulls real story cards from existing `news` / curated content data layer if available; otherwise renders polished placeholder cards consistent with the design system, never empty.

8. **Membership** — rewritten aspirational copy grouped into the five benefit clusters from the brief; founding-member urgency preserved if accurate. Reuses existing pricing card primitives.

9. **Final CTA** — keeps "Your game. Your city. Your crew." with stronger supporting line + single strong CTA.

## Cross-cutting

- **Analytics**: `trackEvent` calls on hero CTA, ZIP submit, secondary CTA, Drop "join to unlock", and Membership CTA — into existing `analytics_events`. No schema changes.
- **SEO**: per-route `<Helmet>` with title, description, canonical, OG + Twitter card tags. Adds `HelmetProvider` at app root if not already mounted. Branded share image referenced (real generation deferred — placeholder note left for the user; we will NOT ship a half-baked og image).
- **A11y**: alt text on every image, semantic `<section>` + heading order, focus-visible on all CTAs, ZIP input has visible label.
- **Performance**: `loading="lazy"` + `decoding="async"` on below-the-fold media, `IntersectionObserver`-mounted recap gallery, no new heavy deps.

## Database migrations (one migration, awaiting approval)

```sql
-- drops
CREATE TABLE public.drops (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  reward_type text,
  image_url text,
  available_from timestamptz,
  available_until timestamptz,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.drops TO authenticated;
GRANT ALL ON public.drops TO service_role;
ALTER TABLE public.drops ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Signed-in users read active drops"
  ON public.drops FOR SELECT TO authenticated
  USING (is_active = true);
CREATE POLICY "Admins manage drops"
  ON public.drops FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin'));

-- watch_parties (scaffold, mock UI will read it when populated)
CREATE TABLE public.watch_parties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  host_user_id uuid NOT NULL,
  title text NOT NULL,
  game_label text,
  venue_name text,
  city text,
  starts_at timestamptz NOT NULL,
  cover_image_url text,
  is_published boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.watch_parties TO authenticated;
GRANT ALL ON public.watch_parties TO service_role;
ALTER TABLE public.watch_parties ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Signed-in users read published watch parties"
  ON public.watch_parties FOR SELECT TO authenticated
  USING (is_published = true);
CREATE POLICY "Hosts manage their own watch parties"
  ON public.watch_parties FOR ALL TO authenticated
  USING (auth.uid() = host_user_id)
  WITH CHECK (auth.uid() = host_user_id);

-- member-media bucket (public, member uploads scoped by folder = user id)
-- Created via storage_create_bucket, with standard RLS on storage.objects.
```

## Files

New section components under `src/components/home/`:
- `HeroSection.tsx`, `ProofBar.tsx`, `SocialProofSection.tsx`, `BenefitsSection.tsx`, `DropSection.tsx`, `ProductPreviewSection.tsx`, `RecapGallery.tsx`, `StoriesSection.tsx`, `MembershipSection.tsx`, `FinalCtaSection.tsx`.
- `homepageConfig.ts` for editable proof-bar counts and placeholder copy.

Rewrites:
- `src/pages/Index.tsx` — composes the sections in order, adds `<Helmet>`, lazy mounts below-the-fold sections.
- `src/main.tsx` — wrap with `HelmetProvider` if not already.

## Out of scope (will NOT do)

- No admin UI for `drops` / `watch_parties` in this pass — seedable via the existing admin pattern in a follow-up.
- No real OG share image generation — leaves a documented hook so the user can drop one in.
- No changes to navigation, footer, auth, or other routes.
- No real member testimonials (every placeholder explicitly marked `// TODO`).

## Approval needed

This plan involves a Supabase migration (new `drops` + `watch_parties` tables and RLS) and a new public storage bucket. Approving the plan will trigger the migration tool for your confirmation before any DB change runs.

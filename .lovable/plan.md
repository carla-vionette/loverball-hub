# Investigation report — wizard, club matching, MCP

No code was changed. Findings below, each verified against the running app / live backend.

## 1. Profile wizard "Continue" goes to /club

Not a routing bug in the wizard. The step logic is correct:

- `src/pages/EditProfile.tsx:593-600` — Continue calls `setStep(step + 1)`; there is no `<form>` and no navigation to `/club` anywhere in the file.
- Driving the page headlessly at 517x532 with a real session, Continue advanced Step 1 → Step 2 correctly.

The real cause is a **tap-target overlap with the floating bottom nav**:

- `src/components/BottomNav.tsx:54` — the nav is `fixed bottom-4 left-4 right-4 z-50 safe-area-pb`, so it occupies roughly nav height (~64px) + 16px offset + `env(safe-area-inset-bottom)` (up to ~34px on iOS) ≈ 100-114px.
- `src/pages/EditProfile.tsx:303` — the page only reserves `pb-20` (80px).
- Measured at 517x532 with no safe-area inset, the Continue button ends at y=435 and the nav pill starts at ~452 — 17px clearance. On a real phone (safe-area inset, or the browser chrome shrinking the viewport) that clearance is gone and the nav pill covers the Continue button. The **"Club" tab sits horizontally centered right under the button**, so the tap lands on Club and routes to `/club`.

Fix direction: increase bottom padding on the wizard container (e.g. `pb-32` plus safe-area) and/or keep the nav out of the Continue button's hit area.

## 2. Club Discover shows "No matches yet"

Root cause: the `get_fan_matches` RPC **errors at runtime**, and the UI swallows the error.

- Verified live against the API: `POST /rest/v1/rpc/get_fan_matches` returns
  `{"code":"42703","message":"column p.neighborhood does not exist"}`.
- The function body references `p.neighborhood` (and `c.neighborhood`) in its profile lookup and `same_hood` scoring, but `public.profiles` has no `neighborhood` column.
- `src/pages/Club.tsx:108-127` — `loadMatches` does `if (!error && Array.isArray(data))`, so on error it silently leaves `matches` empty and renders the empty state at `src/pages/Club.tsx:555`.

It is **not** missing data or unsaved teams/sports: there are 53 profiles, all with names, 53 with `favorite_sports`, 48 with teams; sample profiles have 36-51 candidates that would score above zero once the function runs.

Fix direction: drop the `neighborhood` references from `get_fan_matches` (or add the column), and surface RPC errors in `Club.tsx` instead of falling through to the empty state.

## 3. MCP agent integrations

Authored correctly, **but the endpoint is not live**.

- `.lovable/mcp/manifest.json` is valid and lists all five tools with OAuth issuer `https://<project>.supabase.co/auth/v1`, audience `authenticated`.
- `supabase/functions/mcp/index.ts` is generated (SDK 0.26.1) and contains all five tools.
- Live check: `POST https://<project>.supabase.co/functions/v1/mcp` returns **404**, and `/.well-known/oauth-protected-resource` returns `{"code":"NOT_FOUND","message":"Requested function was not found"}`.

So the `mcp` edge function has not been deployed to the project. Consent page (`src/pages/OAuthConsent.tsx`) and the route exist; nothing else is wrong with the code.

Fix direction: deploy the `mcp` edge function, then re-verify the discovery endpoint and a `tools/list` call.

## Next step

This was investigation only. Say the word and I will turn any of the three fix directions above into changes.

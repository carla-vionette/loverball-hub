import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import MobileHeader from "@/components/MobileHeader";
import DesktopNav from "@/components/DesktopNav";
import BottomNav from "@/components/BottomNav";
import Seo from "@/components/Seo";
import DraftConfirmModal from "@/components/club/DraftConfirmModal";

// ── Loverball design system (Club, aligned with global tokens) ───────
const C = {
  bg: "#0A0A0B",
  card: "#141415",
  cardElev: "#1A1A1C",
  text: "#FAF5E9",
  muted: "#9B9B9F",
  faint: "#6B6B70",
  raspberry: "#E8276F",
  copper: "#D88C5A",
  border: "rgba(255,255,255,0.08)",
  borderStrong: "rgba(255,255,255,0.14)",
  chip: "rgba(255,255,255,0.05)",
};

const DRAFT_LIMIT = 3;
const DRAFTS_KEY = "loverball.club.drafts";

type Profile = {
  id: string;
  name: string | null;
  city: string | null;
  profile_photo_url: string | null;
  favorite_sports: string[] | null;
  favorite_la_teams: string[] | null;
  favorite_teams_players: string[] | null;
  looking_for_tags: string[] | null;
  other_interests: string[] | null;
  bio: string | null;
};

type Candidate = Profile & {
  matchPct: number;
  sharedTeams: string[];
  sharedVibes: string[];
  sharedSports: string[];
  vibe: string;
  identityTags: string[];
  teamCityTags: string[];
};

// ── Compute match score from real overlap ────────────────────────────
function buildCandidate(me: Profile, them: Profile): Candidate {
  const myTeams = new Set(
    [...(me.favorite_la_teams || []), ...(me.favorite_teams_players || [])].map(s => s.toLowerCase())
  );
  const theirTeams = [...(them.favorite_la_teams || []), ...(them.favorite_teams_players || [])];
  const sharedTeams = theirTeams.filter(t => myTeams.has(t.toLowerCase()));

  const mySports = new Set((me.favorite_sports || []).map(s => s.toLowerCase()));
  const sharedSports = (them.favorite_sports || []).filter(s => mySports.has(s.toLowerCase()));

  const myVibes = new Set(
    [...(me.looking_for_tags || []), ...(me.other_interests || [])].map(s => s.toLowerCase())
  );
  const theirVibesAll = [...(them.looking_for_tags || []), ...(them.other_interests || [])];
  const sharedVibes = theirVibesAll.filter(v => myVibes.has(v.toLowerCase()));

  const sameCity = me.city && them.city && me.city.toLowerCase() === them.city.toLowerCase() ? 1 : 0;

  const possible =
    Math.min(myTeams.size, theirTeams.length) * 3 +
    Math.min(mySports.size, (them.favorite_sports || []).length) * 2 +
    Math.min(myVibes.size, theirVibesAll.length) * 1 +
    1;
  const got = sharedTeams.length * 3 + sharedSports.length * 2 + sharedVibes.length * 1 + sameCity;
  const matchPct = Math.max(0, Math.min(99, Math.round((got / possible) * 100)));

  const vibe =
    (them.bio && them.bio.trim()) ||
    sharedVibes[0] ||
    theirVibesAll[0] ||
    sharedSports[0] ||
    "";

  const identityTags = [
    ...sharedVibes.slice(0, 2),
    ...sharedSports.slice(0, 1),
  ].filter(Boolean).slice(0, 3);

  const teamCityTags = [
    ...sharedTeams.slice(0, 1),
    ...(them.city ? [them.city] : []),
  ].filter(Boolean) as string[];

  return {
    ...them,
    matchPct,
    sharedTeams,
    sharedVibes,
    sharedSports,
    vibe,
    identityTags,
    teamCityTags,
  };
}

// ── Weekly draft counter (Mon-reset) ─────────────────────────────────
function weekKey() {
  const d = new Date();
  const day = d.getUTCDay() || 7;
  const monday = new Date(d);
  monday.setUTCDate(d.getUTCDate() - (day - 1));
  return monday.toISOString().slice(0, 10);
}
function loadDrafted(): { week: string; ids: string[] } {
  try {
    const raw = localStorage.getItem(DRAFTS_KEY);
    if (!raw) return { week: weekKey(), ids: [] };
    const parsed = JSON.parse(raw);
    if (parsed.week !== weekKey()) return { week: weekKey(), ids: [] };
    return parsed;
  } catch {
    return { week: weekKey(), ids: [] };
  }
}
function saveDrafted(ids: string[]) {
  localStorage.setItem(DRAFTS_KEY, JSON.stringify({ week: weekKey(), ids }));
}

const Club: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [, setMe] = useState<Profile | null>(null);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [drafted, setDrafted] = useState<string[]>(loadDrafted().ids);
  const [pending, setPending] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<{ open: boolean; first: string; opener: string }>({
    open: false,
    first: "",
    opener: "",
  });

  const draftsLeft = Math.max(0, DRAFT_LIMIT - drafted.length);
  const featured = candidates[0];
  const rest = candidates.slice(1);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!user) return;
      setLoading(true);

      const { data: myRow } = await supabase
        .from("profiles")
        .select(
          "id,name,city,profile_photo_url,favorite_sports,favorite_la_teams,favorite_teams_players,looking_for_tags,other_interests,bio"
        )
        .eq("id", user.id)
        .maybeSingle();

      if (!myRow || cancelled) {
        setLoading(false);
        return;
      }
      setMe(myRow as Profile);

      const { data: rows } = await supabase
        .from("profiles")
        .select(
          "id,name,city,profile_photo_url,favorite_sports,favorite_la_teams,favorite_teams_players,looking_for_tags,other_interests,bio"
        )
        .neq("id", user.id)
        .limit(200);

      const { data: existing } = await supabase
        .from("friendships")
        .select("requester_id,addressee_id")
        .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`);
      const excluded = new Set<string>();
      (existing || []).forEach((r: any) => {
        excluded.add(r.requester_id);
        excluded.add(r.addressee_id);
      });

      const list: Candidate[] = (rows || [])
        .filter((p: any) => p.name && !excluded.has(p.id))
        .map((p: any) => buildCandidate(myRow as Profile, p as Profile))
        .filter(c => c.matchPct > 0)
        .sort((a, b) => b.matchPct - a.matchPct)
        .slice(0, 9);

      if (!cancelled) {
        setCandidates(list);
        setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [user]);

  const handleDraft = async (c: Candidate) => {
    if (!user) {
      navigate("/auth");
      return;
    }
    if (drafted.includes(c.id)) return;
    if (draftsLeft <= 0) {
      toast.error("You've used all your drafts this week. Resets Monday.");
      return;
    }
    setPending(c.id);
    const { error } = await supabase.from("friendships").insert({
      requester_id: user.id,
      addressee_id: c.id,
      status: "pending",
      mutual_teams: c.sharedTeams,
    });
    setPending(null);
    if (error) {
      toast.error("Couldn't send draft. Try again.");
      return;
    }
    const next = [...drafted, c.id];
    setDrafted(next);
    saveDrafted(next);
    const first = c.name?.split(" ")[0] || "Member";
    const opener = c.sharedTeams[0]
      ? `Saw you ride for ${c.sharedTeams[0]}. Watch party this weekend?`
      : c.sharedSports[0]
      ? `Fellow ${c.sharedSports[0]} head — what's your take on the season?`
      : `Hey ${first} — your profile caught my eye. What are you watching?`;
    setConfirm({ open: true, first, opener });
  };

  return (
    <div style={{ background: C.bg, color: C.text }} className="min-h-screen">
      <Seo
        title="Club | Starting XI — Loverball"
        description="Your weekly Starting XI: members surfaced by shared teams, vibes, and matchups."
        path="/club"
      />
      <MobileHeader />
      <DesktopNav />
      <BottomNav />

      <main className="md:ml-64 pb-28 md:pb-10 pt-16 md:pt-2">
        <div className="max-w-[440px] md:max-w-2xl mx-auto px-5">
          {/* MASTHEAD */}
          <header className="pt-3 pb-5">
            <p
              className="text-[10px] uppercase mb-2"
              style={{
                fontFamily: "'Space Mono', ui-monospace, monospace",
                color: C.copper,
                letterSpacing: "0.22em",
              }}
            >
              Vol. 01 · The Club
            </p>
            <div className="flex items-end justify-between gap-3">
              <h1
                className="leading-[0.86] tracking-tight"
                style={{
                  fontFamily: "'Anton', 'Bebas Neue', sans-serif",
                  fontSize: 64,
                  color: C.text,
                  textTransform: "uppercase",
                }}
              >
                The
                <br />
                Roster
              </h1>
              <p
                className="italic text-right pb-1"
                style={{
                  fontFamily: "'Playfair Display', Georgia, serif",
                  fontSize: 16,
                  color: C.text,
                  lineHeight: 1.1,
                  maxWidth: 140,
                }}
              >
                a curated
                <br />
                <span style={{ color: C.raspberry }}>starting&nbsp;XI</span>
              </p>
            </div>

            <div
              className="mt-5 pt-3 flex items-center justify-between"
              style={{ borderTop: `1px solid ${C.border}` }}
            >
              <span
                className="text-[10px] uppercase"
                style={{
                  fontFamily: "'Space Mono', ui-monospace, monospace",
                  color: C.muted,
                  letterSpacing: "0.2em",
                }}
              >
                Picked for you · Week {weekKey().slice(5)}
              </span>
              <span
                className="text-[10px] uppercase font-semibold"
                style={{
                  fontFamily: "'Space Mono', ui-monospace, monospace",
                  color: C.raspberry,
                  letterSpacing: "0.18em",
                }}
              >
                {draftsLeft} draft{draftsLeft === 1 ? "" : "s"} left
              </span>
            </div>
          </header>

          {/* DISCOVERY FILTER CHIPS */}
          <div className="flex flex-wrap gap-1.5 mb-5">
            {["Team", "City", "Vibe", "Sport", "Events", "Interests"].map((f, i) => (
              <span
                key={f}
                className="text-[10px] font-semibold uppercase px-2.5 py-1 rounded-full"
                style={{
                  background: i === 0 ? "rgba(232,39,111,0.12)" : C.chip,
                  color: i === 0 ? C.raspberry : C.muted,
                  border: `1px solid ${i === 0 ? "rgba(232,39,111,0.3)" : C.border}`,
                  letterSpacing: "0.12em",
                  fontFamily: "Inter, sans-serif",
                }}
              >
                {f}
              </span>
            ))}
          </div>

          {loading ? (
            <>
              <FeaturedSkeleton />
              <SkeletonList />
            </>
          ) : candidates.length === 0 ? (
            <EmptyState />
          ) : (
            <>
              {/* FEATURED MEMBER */}
              {featured && (
                <FeaturedCard
                  c={featured}
                  drafted={drafted.includes(featured.id)}
                  pending={pending === featured.id}
                  onDraft={() => handleDraft(featured)}
                  onOpen={() => navigate(`/members/${featured.id}`)}
                />
              )}

              {/* SECTION HEADING */}
              {rest.length > 0 && (
                <div className="flex items-end justify-between mt-7 mb-3">
                  <h2
                    style={{
                      fontFamily: "'Anton', 'Bebas Neue', sans-serif",
                      fontSize: 24,
                      letterSpacing: "0.02em",
                      textTransform: "uppercase",
                      color: C.text,
                    }}
                  >
                    The Bench
                  </h2>
                  <span
                    className="text-[10px] uppercase pb-1"
                    style={{
                      fontFamily: "'Space Mono', ui-monospace, monospace",
                      color: C.faint,
                      letterSpacing: "0.18em",
                    }}
                  >
                    {rest.length} more
                  </span>
                </div>
              )}

              <ul className="space-y-3">
                {rest.map(c => (
                  <MemberCard
                    key={c.id}
                    c={c}
                    drafted={drafted.includes(c.id)}
                    pending={pending === c.id}
                    onDraft={() => handleDraft(c)}
                    onOpen={() => navigate(`/members/${c.id}`)}
                  />
                ))}
              </ul>
            </>
          )}
        </div>
      </main>
    </div>
  );
};

// ── Featured (hero) member card ──────────────────────────────────────
const FeaturedCard: React.FC<{
  c: Candidate;
  drafted: boolean;
  pending: boolean;
  onDraft: () => void;
  onOpen: () => void;
}> = ({ c, drafted, pending, onDraft, onOpen }) => {
  const first = c.name?.split(" ")[0] || "Member";
  const initial = c.name?.split(" ").slice(-1)[0]?.[0] || "";

  return (
    <article
      className="relative rounded-2xl overflow-hidden"
      style={{
        background: C.cardElev,
        border: `1px solid ${C.border}`,
        boxShadow: "0 24px 60px -30px rgba(232,39,111,0.35)",
      }}
    >
      {/* Cinematic portrait */}
      <button
        onClick={onOpen}
        className="block w-full relative"
        style={{ aspectRatio: "4 / 5", background: "#0F0F10" }}
        aria-label={`Open ${first}'s profile`}
      >
        {c.profile_photo_url ? (
          <img
            src={c.profile_photo_url}
            alt={c.name || "Member"}
            className="w-full h-full object-cover"
            loading="lazy"
            style={{ filter: "saturate(0.92) contrast(1.05)" }}
          />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center"
            style={{
              background:
                "linear-gradient(140deg, rgba(232,39,111,0.18), rgba(216,140,90,0.14))",
              fontFamily: "'Anton', sans-serif",
              fontSize: 120,
              color: "rgba(250,245,233,0.35)",
              letterSpacing: "0.02em",
            }}
          >
            {first[0]}
          </div>
        )}

        {/* Top eyebrow */}
        <div className="absolute top-3 left-3 right-3 flex items-start justify-between">
          <span
            className="text-[9.5px] font-bold uppercase px-2 py-1 rounded"
            style={{
              background: "rgba(10,10,11,0.6)",
              border: `1px solid ${C.border}`,
              backdropFilter: "blur(12px)",
              color: C.copper,
              letterSpacing: "0.2em",
              fontFamily: "'Space Mono', monospace",
            }}
          >
            Featured · This Week
          </span>
          <span
            className="text-[10px] font-bold uppercase px-2 py-1 rounded"
            style={{
              background: "rgba(232,39,111,0.92)",
              color: "#0A0A0B",
              letterSpacing: "0.1em",
              fontFamily: "Inter, sans-serif",
            }}
          >
            {c.matchPct}% match
          </span>
        </div>

        {/* Gradient floor */}
        <div
          className="absolute inset-x-0 bottom-0 h-2/3 pointer-events-none"
          style={{
            background:
              "linear-gradient(to top, rgba(10,10,11,0.96) 0%, rgba(10,10,11,0.6) 45%, transparent 100%)",
          }}
        />

        {/* Bottom-left identity */}
        <div className="absolute left-4 right-4 bottom-3">
          <h3
            className="leading-[0.92] tracking-tight"
            style={{
              fontFamily: "'Anton', 'Bebas Neue', sans-serif",
              fontSize: 42,
              color: C.text,
              textTransform: "uppercase",
              textShadow: "0 2px 24px rgba(0,0,0,0.6)",
            }}
          >
            {first} {initial && `${initial}.`}
          </h3>
          {(c.teamCityTags.length > 0) && (
            <p
              className="mt-1 text-[10.5px] font-semibold uppercase"
              style={{
                color: C.copper,
                letterSpacing: "0.18em",
                fontFamily: "'Space Mono', monospace",
              }}
            >
              {c.teamCityTags.join("  ·  ")}
            </p>
          )}
        </div>
      </button>

      {/* Body */}
      <div className="px-4 pt-3 pb-4">
        {c.vibe && (
          <p
            className="italic text-[14.5px] leading-snug line-clamp-3"
            style={{
              fontFamily: "'Playfair Display', Georgia, serif",
              color: C.text,
            }}
          >
            &ldquo;{c.vibe}&rdquo;
          </p>
        )}

        {c.identityTags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {c.identityTags.map(t => (
              <VibeTag key={t} label={t} accent />
            ))}
          </div>
        )}

        {/* Connection prompt + CTA */}
        <div
          className="mt-4 pt-3 flex items-center justify-between gap-3"
          style={{ borderTop: `1px solid ${C.border}` }}
        >
          <p
            className="text-[11px] leading-tight flex-1"
            style={{
              color: C.muted,
              fontFamily: "'Space Mono', monospace",
              letterSpacing: "0.04em",
            }}
          >
            <span style={{ color: C.raspberry }}>↳</span> {connectionPrompt(c)}
          </p>
          <DraftButton drafted={drafted} pending={pending} onClick={onDraft} large />
        </div>
      </div>
    </article>
  );
};

// ── Compact member card ──────────────────────────────────────────────
const MemberCard: React.FC<{
  c: Candidate;
  drafted: boolean;
  pending: boolean;
  onDraft: () => void;
  onOpen: () => void;
}> = ({ c, drafted, pending, onDraft, onOpen }) => {
  const first = c.name?.split(" ")[0] || "Member";
  const initial = c.name?.split(" ").slice(-1)[0]?.[0] || "";
  const meta = c.teamCityTags.join(" · ").toUpperCase();

  return (
    <li
      className="relative rounded-xl p-3 flex gap-3"
      style={{
        background: C.card,
        border: `1px solid ${C.border}`,
      }}
    >
      <button
        onClick={onOpen}
        className="shrink-0 rounded-lg overflow-hidden relative"
        style={{ width: 78, height: 96, background: "#0F0F10" }}
        aria-label={`Open ${first}'s profile`}
      >
        {c.profile_photo_url ? (
          <img
            src={c.profile_photo_url}
            alt={c.name || "Member"}
            className="w-full h-full object-cover"
            loading="lazy"
            style={{ filter: "saturate(0.92) contrast(1.05)" }}
          />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center"
            style={{
              background:
                "linear-gradient(140deg, rgba(232,39,111,0.18), rgba(216,140,90,0.12))",
              fontFamily: "'Anton', sans-serif",
              fontSize: 38,
              color: "rgba(250,245,233,0.4)",
            }}
          >
            {first[0]}
          </div>
        )}
      </button>

      <div className="flex-1 min-w-0 flex flex-col">
        <div className="flex items-start justify-between gap-2">
          <button onClick={onOpen} className="text-left min-w-0">
            <h3
              className="leading-[0.95] tracking-tight truncate"
              style={{
                fontFamily: "'Anton', 'Bebas Neue', sans-serif",
                fontSize: 22,
                color: C.text,
                textTransform: "uppercase",
              }}
            >
              {first} {initial && `${initial}.`}
            </h3>
            {meta && (
              <p
                className="mt-1 text-[9.5px] font-semibold truncate"
                style={{
                  color: C.copper,
                  letterSpacing: "0.16em",
                  fontFamily: "'Space Mono', monospace",
                }}
              >
                {meta}
              </p>
            )}
          </button>
          <span
            className="shrink-0 text-[10px] font-bold uppercase px-2 py-0.5 rounded"
            style={{
              color: C.raspberry,
              background: "rgba(232,39,111,0.1)",
              border: "1px solid rgba(232,39,111,0.25)",
              letterSpacing: "0.08em",
              fontFamily: "Inter, sans-serif",
            }}
          >
            {c.matchPct}%
          </span>
        </div>

        {c.vibe && (
          <p
            className="mt-1.5 italic text-[12px] leading-snug line-clamp-2"
            style={{
              fontFamily: "'Playfair Display', Georgia, serif",
              color: C.muted,
            }}
          >
            &ldquo;{c.vibe}&rdquo;
          </p>
        )}

        <div className="mt-2 flex items-center justify-between gap-2">
          <div className="flex flex-wrap gap-1 min-w-0">
            {c.identityTags.slice(0, 3).map(t => (
              <VibeTag key={t} label={t} />
            ))}
          </div>
          <DraftButton drafted={drafted} pending={pending} onClick={onDraft} />
        </div>
      </div>
    </li>
  );
};

// ── Shared bits ──────────────────────────────────────────────────────
const VibeTag: React.FC<{ label: string; accent?: boolean }> = ({ label, accent }) => (
  <span
    className="text-[9.5px] font-semibold uppercase px-2 py-0.5 rounded-full"
    style={{
      background: accent ? "rgba(216,140,90,0.1)" : C.chip,
      color: accent ? C.copper : C.text,
      border: `1px solid ${accent ? "rgba(216,140,90,0.28)" : C.border}`,
      letterSpacing: "0.1em",
      fontFamily: "Inter, sans-serif",
    }}
  >
    {label}
  </span>
);

const DraftButton: React.FC<{
  drafted: boolean;
  pending: boolean;
  onClick: () => void;
  large?: boolean;
}> = ({ drafted, pending, onClick, large }) => (
  <button
    onClick={onClick}
    disabled={drafted || pending}
    className="shrink-0 font-bold uppercase rounded-full transition-opacity"
    style={{
      fontFamily: "Inter, sans-serif",
      fontSize: large ? 11 : 10,
      letterSpacing: "0.14em",
      padding: large ? "10px 18px" : "7px 14px",
      background: drafted ? "transparent" : C.raspberry,
      color: drafted ? C.muted : "#0A0A0B",
      border: drafted ? `1px solid ${C.borderStrong}` : "none",
      opacity: pending ? 0.6 : 1,
      boxShadow: drafted ? "none" : "0 8px 24px -10px rgba(232,39,111,0.6)",
      minHeight: large ? 40 : 32,
    }}
  >
    {drafted ? "✓ Drafted" : pending ? "…" : large ? "+ Draft to Roster" : "+ Draft"}
  </button>
);

function connectionPrompt(c: Candidate): string {
  if (c.sharedTeams.length > 0)
    return `You both ride for ${c.sharedTeams[0]}. Open the conversation.`;
  if (c.sharedVibes.length > 0)
    return `Shared vibe: ${c.sharedVibes[0]}. Worth a hello.`;
  if (c.sharedSports.length > 0)
    return `Both deep on ${c.sharedSports[0]}. Draft her in.`;
  return "Your scenes overlap. Make the first move.";
}

const FeaturedSkeleton = () => (
  <div
    className="rounded-2xl overflow-hidden animate-pulse"
    style={{ background: C.cardElev, border: `1px solid ${C.border}` }}
  >
    <div style={{ aspectRatio: "4 / 5", background: C.card }} />
    <div className="p-4 space-y-2">
      <div className="h-4 w-3/4 rounded" style={{ background: C.card }} />
      <div className="h-3 w-1/2 rounded" style={{ background: C.card }} />
    </div>
  </div>
);

const SkeletonList = () => (
  <ul className="space-y-3 mt-7">
    {[0, 1, 2, 3].map(i => (
      <li
        key={i}
        className="rounded-xl p-3 flex gap-3 animate-pulse"
        style={{ background: C.card, border: `1px solid ${C.border}` }}
      >
        <div className="rounded-lg" style={{ width: 78, height: 96, background: C.chip }} />
        <div className="flex-1 space-y-2 py-1">
          <div className="h-4 w-2/3 rounded" style={{ background: C.chip }} />
          <div className="h-3 w-1/3 rounded" style={{ background: C.chip }} />
          <div className="h-3 w-full rounded mt-3" style={{ background: C.chip }} />
        </div>
      </li>
    ))}
  </ul>
);

const EmptyState = () => (
  <div
    className="rounded-2xl px-6 py-12 text-center"
    style={{ background: C.cardElev, border: `1px solid ${C.border}` }}
  >
    <p
      className="text-[10px] uppercase mb-3"
      style={{
        fontFamily: "'Space Mono', monospace",
        color: C.copper,
        letterSpacing: "0.22em",
      }}
    >
      Empty roster
    </p>
    <h3
      className="mb-3 leading-[0.95]"
      style={{
        fontFamily: "'Anton', sans-serif",
        fontSize: 32,
        color: C.text,
        textTransform: "uppercase",
      }}
    >
      No matchups
      <br />
      this week.
    </h3>
    <p className="text-[13px] leading-relaxed" style={{ color: C.muted }}>
      Add more teams or vibes in{" "}
      <span style={{ color: C.raspberry }}>Edit Profile</span> and we'll surface
      your people on the next reset.
    </p>
  </div>
);

export default Club;

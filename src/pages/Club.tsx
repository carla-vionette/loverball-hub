import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import MobileHeader from "@/components/MobileHeader";
import DesktopNav from "@/components/DesktopNav";
import BottomNav from "@/components/BottomNav";
import Seo from "@/components/Seo";

// ── Scoped editorial palette (Club only) ─────────────────────────────
const C = {
  bg: "#0a0a0a",
  card: "#1A1A1A",
  text: "#FAF5E9",
  muted: "#B8B8B8",
  accent: "#D4537E",
  chip: "#2A2A2A",
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
  vibe: string;
  tags: string[];
};

// ── Compute match score from real overlap ────────────────────────────
function buildCandidate(me: Profile, them: Profile): Candidate {
  const myTeams = new Set(
    [...(me.favorite_la_teams || []), ...(me.favorite_teams_players || [])].map(s => s.toLowerCase())
  );
  const theirTeams = [...(them.favorite_la_teams || []), ...(them.favorite_teams_players || [])];
  const sharedTeams = theirTeams.filter(t => myTeams.has(t.toLowerCase()));

  const mySports = new Set((me.favorite_sports || []).map(s => s.toLowerCase()));
  const theirSports = (them.favorite_sports || []).filter(s => mySports.has(s.toLowerCase()));

  const myVibes = new Set(
    [...(me.looking_for_tags || []), ...(me.other_interests || [])].map(s => s.toLowerCase())
  );
  const theirVibesAll = [...(them.looking_for_tags || []), ...(them.other_interests || [])];
  const sharedVibes = theirVibesAll.filter(v => myVibes.has(v.toLowerCase()));

  const sameCity = me.city && them.city && me.city.toLowerCase() === them.city.toLowerCase() ? 1 : 0;

  // Weighted score over a possible-overlap denominator (real, not random)
  const possible =
    Math.min(myTeams.size, theirTeams.length) * 3 +
    Math.min(mySports.size, (them.favorite_sports || []).length) * 2 +
    Math.min(myVibes.size, theirVibesAll.length) * 1 +
    1;
  const got = sharedTeams.length * 3 + theirSports.length * 2 + sharedVibes.length * 1 + sameCity;
  const matchPct = Math.max(0, Math.min(99, Math.round((got / possible) * 100)));

  const vibe =
    (them.bio && them.bio.trim()) ||
    sharedVibes[0] ||
    theirVibesAll[0] ||
    theirSports[0] ||
    "";

  const tags = [
    ...sharedTeams.slice(0, 1),
    ...sharedVibes.slice(0, 2),
    ...theirSports.slice(0, 1),
  ]
    .filter(Boolean)
    .slice(0, 3);

  return { ...them, matchPct, sharedTeams, vibe, tags };
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
  const [me, setMe] = useState<Profile | null>(null);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [drafted, setDrafted] = useState<string[]>(loadDrafted().ids);
  const [pending, setPending] = useState<string | null>(null);

  const draftsLeft = Math.max(0, DRAFT_LIMIT - drafted.length);

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

      // Pull members (exclude self). Limit broad pool; we filter for overlap client-side.
      const { data: rows } = await supabase
        .from("profiles")
        .select(
          "id,name,city,profile_photo_url,favorite_sports,favorite_la_teams,favorite_teams_players,looking_for_tags,other_interests,bio"
        )
        .neq("id", user.id)
        .limit(200);

      // Exclude existing friendships (any direction)
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
        .slice(0, 8);

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
    toast.success(`Drafted ${c.name?.split(" ")[0] || "member"} — they'll be notified.`);
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

      <main className="md:ml-64 pb-24 md:pb-10 pt-16 md:pt-2">
        <div className="max-w-[420px] md:max-w-2xl mx-auto px-5 pt-2">
          {/* HEADER */}
          <header className="pt-2 pb-4">
            <div className="flex items-start justify-between gap-4">
              <h1
                className="italic leading-[0.95] tracking-tight"
                style={{
                  fontFamily: "'Playfair Display', Georgia, serif",
                  fontSize: 38,
                  color: C.text,
                }}
              >
                Starting
                <br />
                XI.
              </h1>
              <span
                className="mt-2 text-[10px] font-semibold uppercase"
                style={{ color: C.accent, letterSpacing: "0.18em" }}
              >
                Find your
                <br />
                people
              </span>
            </div>

            <div
              className="mt-5 pt-3 flex items-center justify-between"
              style={{ borderTop: `1px solid ${C.chip}` }}
            >
              <span
                className="text-[10px] uppercase"
                style={{ color: C.muted, letterSpacing: "0.18em" }}
              >
                Picked for you this week
              </span>
              <span
                className="text-[10px] uppercase font-semibold"
                style={{ color: C.accent, letterSpacing: "0.15em" }}
              >
                Drafts left: {draftsLeft}
              </span>
            </div>
          </header>

          {/* AI BANNER */}
          <div
            className="rounded-lg px-4 py-3 mb-5"
            style={{
              background: "rgba(212,83,126,0.08)",
              border: `1px solid rgba(212,83,126,0.22)`,
            }}
          >
            <p className="text-[12px] leading-relaxed" style={{ color: C.text }}>
              Surfaced based on your teams, vibes & this week's matchups.
            </p>
          </div>

          {/* FEED */}
          {loading ? (
            <SkeletonList />
          ) : candidates.length === 0 ? (
            <EmptyState />
          ) : (
            <ul className="space-y-3">
              {candidates.map(c => (
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
          )}
        </div>
      </main>
    </div>
  );
};

// ── Member card ──────────────────────────────────────────────────────
const MemberCard: React.FC<{
  c: Candidate;
  drafted: boolean;
  pending: boolean;
  onDraft: () => void;
  onOpen: () => void;
}> = ({ c, drafted, pending, onDraft, onOpen }) => {
  const first = c.name?.split(" ")[0] || "Member";
  const initial = c.name?.split(" ").slice(-1)[0]?.[0] || "";
  const teamLine = [c.sharedTeams[0], c.city].filter(Boolean).join(" · ").toUpperCase();

  return (
    <li
      className="relative rounded-xl p-3 flex gap-3"
      style={{ background: C.card, border: `1px solid ${C.chip}` }}
    >
      {/* Portrait */}
      <button
        onClick={onOpen}
        className="shrink-0 rounded-lg overflow-hidden"
        style={{ width: 72, height: 88, background: C.chip }}
        aria-label={`Open ${first}'s profile`}
      >
        {c.profile_photo_url ? (
          <img
            src={c.profile_photo_url}
            alt={c.name || "Member"}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center italic"
            style={{
              color: C.muted,
              fontFamily: "'Playfair Display', Georgia, serif",
              fontSize: 28,
            }}
          >
            {first[0]}
          </div>
        )}
      </button>

      {/* Right column */}
      <div className="flex-1 min-w-0 flex flex-col">
        <div className="flex items-start justify-between gap-2">
          <button onClick={onOpen} className="text-left min-w-0">
            <h3
              className="italic truncate"
              style={{
                fontFamily: "'Playfair Display', Georgia, serif",
                fontSize: 19,
                color: C.text,
                lineHeight: 1.15,
              }}
            >
              {first} {initial && `${initial}.`}
            </h3>
            {teamLine && (
              <p
                className="mt-0.5 text-[10px] font-semibold"
                style={{ color: C.accent, letterSpacing: "0.12em" }}
              >
                {teamLine}
              </p>
            )}
          </button>
          <span
            className="shrink-0 text-[10px] font-semibold uppercase px-2 py-1 rounded"
            style={{
              color: C.text,
              background: "rgba(250,245,233,0.06)",
              letterSpacing: "0.08em",
            }}
          >
            {c.matchPct}% match
          </span>
        </div>

        {c.vibe && (
          <p
            className="mt-1.5 text-[11.5px] leading-snug line-clamp-2"
            style={{
              fontFamily:
                "ui-monospace, 'SF Mono', Menlo, Consolas, 'Courier New', monospace",
              color: C.muted,
            }}
          >
            <span style={{ color: C.text }}>VIBE:</span> {c.vibe}
          </p>
        )}

        <div className="mt-2 flex items-center justify-between gap-2">
          <div className="flex flex-wrap gap-1.5 min-w-0">
            {c.tags.map(t => (
              <span
                key={t}
                className="text-[9.5px] font-semibold uppercase px-2 py-0.5 rounded"
                style={{
                  background: C.chip,
                  color: C.text,
                  letterSpacing: "0.08em",
                }}
              >
                {t}
              </span>
            ))}
          </div>
          <button
            onClick={onDraft}
            disabled={drafted || pending}
            className="shrink-0 text-[10px] font-bold uppercase px-3 py-1.5 rounded-full transition-opacity"
            style={{
              background: drafted ? "transparent" : C.accent,
              color: drafted ? C.muted : "#0a0a0a",
              border: drafted ? `1px solid ${C.chip}` : "none",
              letterSpacing: "0.12em",
              opacity: pending ? 0.6 : 1,
              minHeight: 32,
            }}
          >
            {drafted ? "Drafted" : pending ? "…" : "+ Draft"}
          </button>
        </div>
      </div>
    </li>
  );
};

const SkeletonList = () => (
  <ul className="space-y-3">
    {[0, 1, 2, 3].map(i => (
      <li
        key={i}
        className="rounded-xl p-3 flex gap-3 animate-pulse"
        style={{ background: C.card, border: `1px solid ${C.chip}` }}
      >
        <div className="rounded-lg" style={{ width: 72, height: 88, background: C.chip }} />
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
    className="rounded-xl px-5 py-10 text-center"
    style={{ background: C.card, border: `1px solid ${C.chip}` }}
  >
    <p
      className="italic mb-2"
      style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 20, color: C.text }}
    >
      No matchups this week.
    </p>
    <p className="text-[12px]" style={{ color: C.muted }}>
      Add more teams or vibes in <span style={{ color: C.accent }}>Edit Profile</span> and
      we'll surface your people next reset.
    </p>
  </div>
);

export default Club;

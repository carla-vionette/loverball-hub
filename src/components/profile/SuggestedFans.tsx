import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Users, Sparkles, MapPin, Trophy, Calendar, UsersRound, UserCircle2 } from "lucide-react";
import AddFriendButton from "@/components/AddFriendButton";

/* ───────────── Tunable constants ───────────── */
const SUGGESTED_FAN_COUNT = 6;
const PREFILTER_POOL_SIZE = 150;
const FALLBACK_MIN_THRESHOLD = 20;

const WEIGHT_SHARED_TEAMS = 4;
const WEIGHT_SHARED_SPORTS = 2;
const WEIGHT_SHARED_RSVP = 5;
const WEIGHT_SHARED_ATTENDANCE = 6;
const WEIGHT_SHARED_CLUB = 3;
const WEIGHT_SHARED_PLAYER = 2;
const WEIGHT_SAME_METRO = 1;
const WEIGHT_ACTIVITY_RECENCY = 1;

const ACTIVITY_RECENCY_DAYS = 30;

/* ───────────── Styling ───────────── */
const PINK = "#E85D2F";
const PANEL = "#161616";
const BORDER = "1px solid rgba(250, 245, 233, 0.08)";

/* ───────────── Types ───────────── */
interface FanRow {
  id: string;
  name: string;
  profile_photo_url: string | null;
  city: string | null;
  favorite_sports: string[] | null;
  favorite_la_teams: string[] | null;
  favorite_teams: string[] | null;
  favorite_teams_players: string[] | null;
  updated_at?: string | null;
}

interface SuggestedFansProps {
  myCity: string | null;
  mySports: string[];
  myTeams: string[];
  onBrowseAll: () => void;
}

interface ViewerContext {
  eventIds: Set<string>;
  attendedEventIds: Set<string>;
  attendedEventNames: Map<string, string>;
  eventNames: Map<string, string>;
  clubIds: Set<string>;
  clubNames: Map<string, string>;
  followedPlayers: string[];
}

interface CandidateContext {
  rsvpEventIds: Map<string, Set<string>>;
  attendedEventIds: Map<string, Set<string>>;
  clubIds: Map<string, Set<string>>;
  followedPlayers: Map<string, string[]>;
}

interface ScoredFan {
  fan: FanRow;
  score: number;
  topReason: {
    kind: "event_attended" | "event_rsvp" | "club" | "team" | "sport" | "metro" | "new";
    label: string;
  };
}

/* ───────────── Overlap helpers ───────────── */
const overlapList = (a: string[] | null | undefined, b: string[] | null | undefined): string[] => {
  if (!a?.length || !b?.length) return [];
  const lower = new Set(b.map((x) => x.toLowerCase()));
  const seen = new Set<string>();
  const out: string[] = [];
  for (const v of a) {
    const k = v.toLowerCase();
    if (lower.has(k) && !seen.has(k)) {
      seen.add(k);
      out.push(v);
    }
  }
  return out;
};

const overlapSet = (a: Set<string> | undefined, b: Set<string> | undefined): string[] => {
  if (!a?.size || !b?.size) return [];
  const out: string[] = [];
  for (const v of a) if (b.has(v)) out.push(v);
  return out;
};

const allTeamsOf = (f: { favorite_la_teams: string[] | null; favorite_teams: string[] | null; favorite_teams_players: string[] | null }) =>
  [...(f.favorite_la_teams || []), ...(f.favorite_teams || []), ...(f.favorite_teams_players || [])];

const sameMetro = (a: string | null, b: string | null): boolean => {
  if (!a || !b) return false;
  const first = (s: string) => s.toLowerCase().split(",")[0].trim();
  return first(a) === first(b);
};

/* ───────────── Phase 1: Supabase prefilter + viewer context ───────────── */
export async function fetchSuggestedFanCandidates(
  userId: string,
  userProfile: { teams: string[]; sports: string[] }
): Promise<{ candidates: FanRow[]; viewer: ViewerContext; candidateCtx: CandidateContext }> {
  const selectCols =
    "id, name, profile_photo_url, city, favorite_sports, favorite_la_teams, favorite_teams, favorite_teams_players, updated_at";

  // Build exclusion list: self, friends/pending, dismissals
  const [friendsRes, dismissalsRes] = await Promise.all([
    supabase
      .from("friendships")
      .select("requester_id, addressee_id, status")
      .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`)
      .in("status", ["pending", "accepted", "blocked"]),
    supabase.from("fan_dismissals").select("dismissed_user_id").eq("user_id", userId),
  ]);

  const excluded = new Set<string>([userId]);
  (friendsRes.data || []).forEach((f: any) => {
    excluded.add(f.requester_id === userId ? f.addressee_id : f.requester_id);
  });
  (dismissalsRes.data || []).forEach((d: any) => excluded.add(d.dismissed_user_id));

  // Build interest filter expression for PostgREST `.or()`
  const teamArr = `{${userProfile.teams.map((t) => `"${t.replace(/"/g, '\\"')}"`).join(",")}}`;
  const sportArr = `{${userProfile.sports.map((t) => `"${t.replace(/"/g, '\\"')}"`).join(",")}}`;
  const orParts: string[] = [];
  if (userProfile.teams.length) {
    orParts.push(`favorite_la_teams.ov.${teamArr}`);
    orParts.push(`favorite_teams.ov.${teamArr}`);
    orParts.push(`favorite_teams_players.ov.${teamArr}`);
  }
  if (userProfile.sports.length) {
    orParts.push(`favorite_sports.ov.${sportArr}`);
  }

  let candidates: FanRow[] = [];
  if (orParts.length) {
    const { data } = await supabase
      .from("profiles")
      .select(selectCols)
      .neq("id", userId)
      .not("name", "is", null)
      .or(orParts.join(","))
      .limit(PREFILTER_POOL_SIZE);
    candidates = ((data as FanRow[]) || []).filter((c) => !excluded.has(c.id));
  }

  if (candidates.length < FALLBACK_MIN_THRESHOLD) {
    const { data } = await supabase
      .from("profiles")
      .select(selectCols)
      .neq("id", userId)
      .not("name", "is", null)
      .order("created_at", { ascending: false })
      .limit(PREFILTER_POOL_SIZE);
    const seen = new Set(candidates.map((c) => c.id));
    for (const row of (data as FanRow[]) || []) {
      if (excluded.has(row.id) || seen.has(row.id)) continue;
      candidates.push(row);
      seen.add(row.id);
    }
  }

  const candidateIds = candidates.map((c) => c.id);

  // Viewer + candidate context fetched in parallel (graceful failures → empty)
  const safe = async <T,>(p: Promise<{ data: T | null; error: unknown }>): Promise<T[]> => {
    try {
      const { data, error } = await p;
      if (error || !data) return [];
      return data as unknown as T[];
    } catch {
      return [];
    }
  };

  const [
    viewerRsvps,
    viewerAttended,
    viewerClubs,
    candidateRsvps,
    candidateClubs,
    eventTitles,
    clubTitles,
  ] = await Promise.all([
    safe<{ event_id: string }>(
      supabase.from("event_rsvps").select("event_id").eq("user_id", userId) as any
    ),
    safe<{ event_id: string; attendance_status: string }>(
      supabase
        .from("event_rsvps")
        .select("event_id, attendance_status")
        .eq("user_id", userId)
        .eq("attendance_status", "checked_in") as any
    ),
    safe<{ group_id: string }>(
      supabase.from("group_members").select("group_id").eq("user_id", userId) as any
    ),
    candidateIds.length
      ? safe<{ user_id: string; event_id: string; attendance_status: string }>(
          supabase
            .from("event_rsvps")
            .select("user_id, event_id, attendance_status")
            .in("user_id", candidateIds) as any
        )
      : Promise.resolve([]),
    candidateIds.length
      ? safe<{ user_id: string; group_id: string }>(
          supabase.from("group_members").select("user_id, group_id").in("user_id", candidateIds) as any
        )
      : Promise.resolve([]),
    // Event titles for both viewer + candidate events
    (async () => {
      const ids = new Set<string>();
      (await safe<{ event_id: string }>(
        supabase.from("event_rsvps").select("event_id").eq("user_id", userId) as any
      )).forEach((r) => ids.add(r.event_id));
      return ids.size
        ? safe<{ id: string; title: string }>(
            supabase.from("events").select("id, title").in("id", Array.from(ids)) as any
          )
        : [];
    })(),
    (async () => {
      const ids = new Set<string>();
      (await safe<{ group_id: string }>(
        supabase.from("group_members").select("group_id").eq("user_id", userId) as any
      )).forEach((r) => ids.add(r.group_id));
      return ids.size
        ? safe<{ id: string; name: string }>(
            supabase.from("community_groups").select("id, name").in("id", Array.from(ids)) as any
          )
        : [];
    })(),
  ]);

  const eventNames = new Map<string, string>();
  eventTitles.forEach((e) => eventNames.set(e.id, e.title));
  const clubNames = new Map<string, string>();
  clubTitles.forEach((c) => clubNames.set(c.id, c.name));

  const viewer: ViewerContext = {
    eventIds: new Set(viewerRsvps.map((r) => r.event_id)),
    attendedEventIds: new Set(viewerAttended.map((r) => r.event_id)),
    attendedEventNames: eventNames,
    eventNames,
    clubIds: new Set(viewerClubs.map((r) => r.group_id)),
    clubNames,
    followedPlayers: [], // No dedicated table; player-overlap derived from favorite_teams_players
  };

  const candidateCtx: CandidateContext = {
    rsvpEventIds: new Map(),
    attendedEventIds: new Map(),
    clubIds: new Map(),
    followedPlayers: new Map(),
  };
  for (const r of candidateRsvps) {
    if (!candidateCtx.rsvpEventIds.has(r.user_id)) candidateCtx.rsvpEventIds.set(r.user_id, new Set());
    candidateCtx.rsvpEventIds.get(r.user_id)!.add(r.event_id);
    if (r.attendance_status === "checked_in") {
      if (!candidateCtx.attendedEventIds.has(r.user_id))
        candidateCtx.attendedEventIds.set(r.user_id, new Set());
      candidateCtx.attendedEventIds.get(r.user_id)!.add(r.event_id);
    }
  }
  for (const c of candidateClubs) {
    if (!candidateCtx.clubIds.has(c.user_id)) candidateCtx.clubIds.set(c.user_id, new Set());
    candidateCtx.clubIds.get(c.user_id)!.add(c.group_id);
  }

  return { candidates, viewer, candidateCtx };
}

/* ───────────── Scoring ───────────── */
function scoreCandidate(
  fan: FanRow,
  mySports: string[],
  myTeams: string[],
  myCity: string | null,
  viewer: ViewerContext,
  ctx: CandidateContext
): ScoredFan | null {
  const candTeams = allTeamsOf(fan);
  const sharedTeams = overlapList(candTeams, myTeams);
  const sharedSports = overlapList(fan.favorite_sports, mySports);
  const sharedPlayers = overlapList(fan.favorite_teams_players, viewer.followedPlayers);

  const sharedRsvps = overlapSet(ctx.rsvpEventIds.get(fan.id), viewer.eventIds);
  const sharedAttended = overlapSet(ctx.attendedEventIds.get(fan.id), viewer.attendedEventIds);
  const sharedClubs = overlapSet(ctx.clubIds.get(fan.id), viewer.clubIds);

  const metroBonus = sameMetro(fan.city, myCity) ? WEIGHT_SAME_METRO : 0;

  const recentCutoff = Date.now() - ACTIVITY_RECENCY_DAYS * 86_400_000;
  const recencyBonus =
    fan.updated_at && new Date(fan.updated_at).getTime() >= recentCutoff ? WEIGHT_ACTIVITY_RECENCY : 0;

  const score =
    sharedTeams.length * WEIGHT_SHARED_TEAMS +
    sharedSports.length * WEIGHT_SHARED_SPORTS +
    sharedRsvps.length * WEIGHT_SHARED_RSVP +
    sharedAttended.length * WEIGHT_SHARED_ATTENDANCE +
    sharedClubs.length * WEIGHT_SHARED_CLUB +
    sharedPlayers.length * WEIGHT_SHARED_PLAYER +
    metroBonus +
    recencyBonus;

  if (score === 0 && !fan.profile_photo_url) return null;

  // Highest-scoring overlap drives the label
  const buckets: Array<{ weight: number; kind: ScoredFan["topReason"]["kind"]; label: string | null }> = [
    {
      weight: sharedAttended.length * WEIGHT_SHARED_ATTENDANCE,
      kind: "event_attended",
      label: sharedAttended[0]
        ? `Both attended ${viewer.eventNames.get(sharedAttended[0]) || "the same event"}`
        : null,
    },
    {
      weight: sharedRsvps.length * WEIGHT_SHARED_RSVP,
      kind: "event_rsvp",
      label: sharedRsvps[0]
        ? `Both going to ${viewer.eventNames.get(sharedRsvps[0]) || "the same event"}`
        : null,
    },
    {
      weight: sharedClubs.length * WEIGHT_SHARED_CLUB,
      kind: "club",
      label: sharedClubs[0] ? `Both in ${viewer.clubNames.get(sharedClubs[0]) || "the same club"}` : null,
    },
    {
      weight: sharedTeams.length * WEIGHT_SHARED_TEAMS,
      kind: "team",
      label:
        sharedTeams.length >= 2
          ? `Also follows ${sharedTeams[0]} + ${sharedTeams[1]}`
          : sharedTeams[0]
          ? `Also follows ${sharedTeams[0]}`
          : null,
    },
    {
      weight: sharedSports.length * WEIGHT_SHARED_SPORTS,
      kind: "sport",
      label:
        sharedSports.length >= 2
          ? `Into ${sharedSports[0]} + ${sharedSports[1]}`
          : sharedSports[0]
          ? `Into ${sharedSports[0]}`
          : null,
    },
    {
      weight: metroBonus,
      kind: "metro",
      label: fan.city && metroBonus ? `Lives in ${fan.city}` : null,
    },
  ];
  buckets.sort((a, b) => b.weight - a.weight);
  const top = buckets.find((b) => b.label && b.weight > 0);
  const topReason = top
    ? { kind: top.kind, label: top.label! }
    : { kind: "new" as const, label: "New on Loverball" };

  return { fan, score, topReason };
}

const reasonIcon = (kind: ScoredFan["topReason"]["kind"]) => {
  switch (kind) {
    case "event_attended":
    case "event_rsvp":
      return Calendar;
    case "club":
      return UsersRound;
    case "team":
      return Trophy;
    case "sport":
      return Sparkles;
    case "metro":
      return MapPin;
    default:
      return UserCircle2;
  }
};

/* ───────────── Component ───────────── */
const SuggestedFans = ({ myCity, mySports, myTeams, onBrowseAll }: SuggestedFansProps) => {
  const { user } = useAuth();
  const [scored, setScored] = useState<ScoredFan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!user) return;
      setLoading(true);
      try {
        const { candidates, viewer, candidateCtx } = await fetchSuggestedFanCandidates(user.id, {
          teams: myTeams,
          sports: mySports,
        });
        if (cancelled) return;
        const results = candidates
          .map((f) => scoreCandidate(f, mySports, myTeams, myCity, viewer, candidateCtx))
          .filter((r): r is ScoredFan => r !== null)
          .sort((a, b) => (b.score - a.score) || a.fan.id.localeCompare(b.fan.id))
          .slice(0, SUGGESTED_FAN_COUNT);
        setScored(results);
      } catch {
        if (!cancelled) setScored([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.id, myCity, mySports.join("|"), myTeams.join("|")]);

  return (
    <div>
      <div className="mb-3 flex items-end justify-between gap-3">
        <div>
          <p
            className="text-[10px] uppercase"
            style={{ fontFamily: "'Space Mono', monospace", letterSpacing: "0.26em", color: PINK }}
          >
            Your circle
          </p>
          <h2
            className="leading-[0.95] mt-1.5 uppercase"
            style={{ fontFamily: "'Anton', Impact, sans-serif", fontSize: "clamp(28px, 3.4vw, 38px)", color: "#FAF5E9" }}
          >
            People with your <span style={{ color: PINK }}>vibe</span>.
          </h2>
        </div>
        <button
          onClick={onBrowseAll}
          className="text-[11px] uppercase tracking-widest"
          style={{ fontFamily: "'Inter', sans-serif", fontWeight: 700, color: PINK }}
        >
          Find friends
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
          {Array.from({ length: SUGGESTED_FAN_COUNT }).map((_, i) => (
            <div key={i} className="rounded-2xl p-3 flex items-center gap-3" style={{ background: PANEL, border: BORDER }}>
              <div className="w-12 h-12 rounded-full bg-white/5 animate-pulse" />
              <div className="flex-1 space-y-2">
                <div className="h-3.5 w-32 bg-white/5 rounded animate-pulse" />
                <div className="h-2.5 w-44 bg-white/5 rounded animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      ) : scored.length === 0 ? (
        <div className="rounded-3xl p-8 text-center" style={{ background: PANEL, border: BORDER }}>
          <Users className="w-9 h-9 mx-auto mb-3" style={{ color: "rgba(232,93,47,0.7)" }} />
          <p style={{ fontFamily: "'Playfair Display', serif", fontStyle: "italic", fontSize: 16, color: "rgba(250,245,233,0.75)", margin: 0 }}>
            Your people are out there.
          </p>
          <p className="mt-2 text-[12px]" style={{ color: "rgba(250,245,233,0.5)" }}>
            Add favorite teams and sports and we'll match you with fans on the same wavelength.
          </p>
          <button
            onClick={onBrowseAll}
            className="mt-4 px-5 py-2 rounded-full text-[11px] uppercase tracking-widest"
            style={{ background: PINK, color: "#fff", fontFamily: "'Inter', sans-serif", fontWeight: 700 }}
          >
            Browse fans
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
          {scored.map(({ fan, topReason }) => {
            const Icon = reasonIcon(topReason.kind);
            const initials = (fan.name || "?").split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
            return (
              <div
                key={fan.id}
                className="rounded-2xl p-3 flex items-center gap-3"
                style={{ background: PANEL, border: BORDER }}
              >
                <button onClick={() => (window.location.href = `/profile/${fan.id}`)} className="shrink-0">
                  <Avatar className="w-12 h-12 border" style={{ borderColor: "rgba(232,93,47,0.35)" }}>
                    <AvatarImage src={fan.profile_photo_url || undefined} alt={fan.name} />
                    <AvatarFallback style={{ background: "rgba(232,93,47,0.15)", color: PINK, fontWeight: 700 }}>
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                </button>
                <div className="flex-1 min-w-0">
                  <button
                    onClick={() => (window.location.href = `/profile/${fan.id}`)}
                    className="block text-left truncate"
                    style={{ fontFamily: "'Anton', Impact, sans-serif", fontSize: 16, color: "#FAF5E9", textTransform: "uppercase" }}
                  >
                    {fan.name}
                  </button>
                  <p
                    className="mt-0.5 truncate inline-flex items-center gap-1 text-[10.5px]"
                    style={{ fontFamily: "'Space Mono', monospace", color: "rgba(250,245,233,0.6)" }}
                  >
                    <Icon className="w-3 h-3" style={{ color: PINK }} /> {topReason.label}
                  </p>
                </div>
                <AddFriendButton targetUserId={fan.id} size="sm" />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default SuggestedFans;

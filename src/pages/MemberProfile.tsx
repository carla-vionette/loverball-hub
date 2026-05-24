import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import BottomNav from "@/components/BottomNav";
import Seo from "@/components/Seo";
import DraftConfirmModal from "@/components/club/DraftConfirmModal";
import { fetchProfileById } from "@/lib/profileApi";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  ChevronLeft,
  MoreHorizontal,
  Sparkles,
  Beer,
  Calendar,
  Users,
  Loader2,
} from "lucide-react";

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

interface MemberProfileData {
  id: string;
  name: string;
  pronouns?: string | null;
  city?: string | null;
  bio?: string | null;
  profile_photo_url?: string | null;
  primary_role?: string | null;
  industries?: string[] | null;
  looking_for_tags?: string[] | null;
  favorite_la_teams?: string[] | null;
  favorite_teams_players?: string[] | null;
  favorite_sports?: string[] | null;
  other_interests?: string[] | null;
  interested_in_world_cup_la?: boolean | null;
  interested_in_la28?: boolean | null;
  membership_tier?: string | null;
  created_at?: string | null;
}

interface MyProfile {
  id: string;
  city: string | null;
  favorite_la_teams: string[] | null;
  favorite_teams_players: string[] | null;
  favorite_sports: string[] | null;
  looking_for_tags: string[] | null;
  other_interests: string[] | null;
}

function weekKey() {
  const d = new Date();
  const day = d.getUTCDay() || 7;
  const monday = new Date(d);
  monday.setUTCDate(d.getUTCDate() - (day - 1));
  return monday.toISOString().slice(0, 10);
}
function loadDrafted(): string[] {
  try {
    const raw = localStorage.getItem(DRAFTS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (parsed.week !== weekKey()) return [];
    return parsed.ids || [];
  } catch {
    return [];
  }
}
function saveDrafted(ids: string[]) {
  localStorage.setItem(DRAFTS_KEY, JSON.stringify({ week: weekKey(), ids }));
}

function fmtJoined(iso?: string | null): string {
  if (!iso) return "Recently";
  const d = new Date(iso);
  return `Joined ${d.toLocaleString("en-US", { month: "short", year: "numeric" })}`;
}

const Eyebrow: React.FC<{ icon?: React.ReactNode; label: string }> = ({ icon, label }) => (
  <div className="flex items-center gap-1.5 mb-2.5">
    {icon}
    <span
      className="text-[9.5px] uppercase font-bold"
      style={{
        fontFamily: "'Space Mono', monospace",
        letterSpacing: "0.24em",
        color: C.copper,
      }}
    >
      {label}
    </span>
  </div>
);

// Squared team chip (Rides for)
const TeamChip: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <span
    className="font-medium"
    style={{
      background: C.card,
      border: `1px solid rgba(255,255,255,0.07)`,
      color: C.text,
      fontSize: 11,
      padding: "6px 10px",
      borderRadius: 6,
      fontFamily: "Inter, sans-serif",
    }}
  >
    {children}
  </span>
);

// Small square tag chip (uppercase letter-spaced)
const TagChip: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <span
    className="uppercase font-semibold"
    style={{
      background: "rgba(255,255,255,0.06)",
      color: "#B8B8B8",
      fontSize: 9,
      padding: "4px 8px",
      borderRadius: 4,
      letterSpacing: "0.12em",
      fontFamily: "Inter, sans-serif",
    }}
  >
    {children}
  </span>
);


const MemberProfile = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isMember } = useAuth();

  const [profile, setProfile] = useState<MemberProfileData | null>(null);
  const [me, setMe] = useState<MyProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [drafted, setDrafted] = useState<string[]>(loadDrafted());
  const [pending, setPending] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [attending, setAttending] = useState<Array<{ id: string; title: string; event_date: string; venue_name: string | null; city: string | null; image_url: string | null; slug: string | null }>>([]);

  const draftsLeft = Math.max(0, DRAFT_LIMIT - drafted.length);
  const isDrafted = !!id && drafted.includes(id);

  useEffect(() => {
    if (!isMember) {
      navigate("/invite");
      return;
    }
    const run = async () => {
      if (!id || !user) return;
      try {
        const { data } = await fetchProfileById(id);
        setProfile(data as MemberProfileData);
        const { data: myRow } = await supabase
          .from("profiles")
          .select(
            "id,city,favorite_la_teams,favorite_teams_players,favorite_sports,looking_for_tags,other_interests"
          )
          .eq("id", user.id)
          .maybeSingle();
        if (myRow) setMe(myRow as MyProfile);

        // Fetch events this member is attending (going / approved RSVPs on public events)
        const { data: guestRows } = await supabase
          .from("event_guests")
          .select("event_id, status, events!inner(id,title,event_date,venue_name,city,image_url,slug,visibility)")
          .eq("user_id", id)
          .in("status", ["going", "approved", "confirmed"]);
        const upcoming = (guestRows || [])
          .map((r: any) => r.events)
          .filter((e: any) => e && e.visibility === "public" && new Date(e.event_date) >= new Date(new Date().toDateString()))
          .sort((a: any, b: any) => a.event_date.localeCompare(b.event_date))
          .slice(0, 6);
        setAttending(upcoming as any);
      } catch {
        /* swallow */
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [id, user, isMember, navigate]);

  const match = useMemo(() => {
    if (!me || !profile) {
      return {
        pct: 0,
        sharedTeams: [] as string[],
        sharedVibes: [] as string[],
        sharedSports: [] as string[],
        sameCity: false,
      };
    }
    const myTeams = new Set(
      [...(me.favorite_la_teams || []), ...(me.favorite_teams_players || [])].map((s) =>
        s.toLowerCase()
      )
    );
    const theirTeams = [
      ...(profile.favorite_la_teams || []),
      ...(profile.favorite_teams_players || []),
    ];
    const sharedTeams = theirTeams.filter((t) => myTeams.has(t.toLowerCase()));

    const mySports = new Set((me.favorite_sports || []).map((s) => s.toLowerCase()));
    const sharedSports = (profile.favorite_sports || []).filter((s) =>
      mySports.has(s.toLowerCase())
    );

    const myVibes = new Set(
      [...(me.looking_for_tags || []), ...(me.other_interests || [])].map((s) => s.toLowerCase())
    );
    const theirVibes = [
      ...(profile.looking_for_tags || []),
      ...(profile.other_interests || []),
    ];
    const sharedVibes = theirVibes.filter((v) => myVibes.has(v.toLowerCase()));

    const sameCity =
      !!me.city &&
      !!profile.city &&
      me.city.toLowerCase() === profile.city.toLowerCase();

    const possible =
      Math.min(myTeams.size, theirTeams.length) * 3 +
      Math.min(mySports.size, (profile.favorite_sports || []).length) * 2 +
      Math.min(myVibes.size, theirVibes.length) * 1 +
      1;
    const got =
      sharedTeams.length * 3 + sharedSports.length * 2 + sharedVibes.length * 1 + (sameCity ? 1 : 0);
    const pct = Math.max(0, Math.min(99, Math.round((got / possible) * 100)));
    return { pct, sharedTeams, sharedVibes, sharedSports, sameCity };
  }, [me, profile]);

  const whyVibe = useMemo(() => {
    if (!profile) return [] as string[];
    const out: string[] = [];
    if (match.sharedTeams[0] && match.sameCity)
      out.push(`Both ride for ${match.sharedTeams[0]} in ${profile.city}.`);
    else if (match.sharedTeams[0])
      out.push(`Both ride for ${match.sharedTeams[0]}.`);
    else if (match.sameCity && profile.city)
      out.push(`You're both based in ${profile.city}.`);
    if (match.sharedVibes[0])
      out.push(`Shared vibe: ${match.sharedVibes[0]}.`);
    if (match.sharedSports[0])
      out.push(`Both deep on ${match.sharedSports[0]}.`);
    if (out.length === 0 && profile.looking_for_tags?.[0])
      out.push(`She's looking for ${profile.looking_for_tags[0].toLowerCase()}.`);
    return out.slice(0, 3);
  }, [profile, match]);

  const opener = useMemo(() => {
    if (!profile) return "";
    const first = profile.name?.split(" ")[0] || "her";
    if (match.sharedTeams[0])
      return `Saw you ride for ${match.sharedTeams[0]}. Watch party this weekend?`;
    if (match.sharedSports[0])
      return `Fellow ${match.sharedSports[0]} head. What's your take on the season so far?`;
    if (profile.city)
      return `Hey ${first} — fellow ${profile.city} member. What are you watching this weekend?`;
    return `Hey ${first} — your profile caught my eye. What are you watching this weekend?`;
  }, [profile, match]);

  const handleDraft = async () => {
    if (!user || !profile || !id) return;
    if (isDrafted) return;
    if (draftsLeft <= 0) {
      toast.error("You've used all your drafts this week. Resets Monday.");
      return;
    }
    setPending(true);
    const { error } = await supabase.from("friendships").insert({
      requester_id: user.id,
      addressee_id: id,
      status: "pending",
      mutual_teams: match.sharedTeams,
    });
    setPending(false);
    if (error) {
      toast.error("Couldn't send draft. Try again.");
      return;
    }
    const next = [...drafted, id];
    setDrafted(next);
    saveDrafted(next);
    setConfirmOpen(true);
  };

  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: C.bg }}
      >
        <Loader2 className="w-7 h-7 animate-spin" style={{ color: C.raspberry }} />
      </div>
    );
  }

  if (!profile) {
    return (
      <div
        className="min-h-screen flex items-center justify-center text-center px-6"
        style={{ background: C.bg, color: C.text }}
      >
        <div>
          <h2
            style={{
              fontFamily: "'Playfair Display', Georgia, serif",
              fontStyle: "italic",
              fontSize: 28,
            }}
          >
            Profile not found
          </h2>
          <button
            onClick={() => navigate("/club")}
            className="mt-4 rounded-full px-5 py-2.5 uppercase font-bold"
            style={{
              fontFamily: "Inter, sans-serif",
              fontSize: 11,
              letterSpacing: "0.16em",
              background: C.raspberry,
              color: "#0A0A0B",
            }}
          >
            Back to Club
          </button>
        </div>
      </div>
    );
  }

  const first = profile.name?.split(" ")[0] || "Member";
  const initial = profile.name?.split(" ").slice(-1)[0]?.[0] || "";
  const teamsRow = [
    ...(profile.favorite_la_teams || []),
    ...(profile.favorite_teams_players || []),
  ];
  const allTags = [
    ...(profile.looking_for_tags || []),
    ...(profile.other_interests || []),
    ...(profile.industries || []),
  ];

  return (
    <div style={{ background: C.bg, color: C.text }} className="min-h-screen">
      <Seo
        title={`${profile.name} | Member — Loverball`}
        description={profile.bio || `Member profile on Loverball.`}
        path={`/members/${id}`}
      />
      <BottomNav />

      <main className="pt-16 md:pt-2" style={{ paddingBottom: 120 }}>
        <div className="max-w-[440px] md:max-w-2xl mx-auto px-5">
          {/* Top bar */}
          <div className="flex items-center justify-between py-3">
            <button
              onClick={() => navigate(-1)}
              className="p-1.5 -ml-1.5 rounded-full"
              style={{ color: C.text }}
              aria-label="Back"
            >
              <ChevronLeft size={22} />
            </button>
            <span
              className="text-[10px] uppercase font-bold"
              style={{
                fontFamily: "'Space Mono', monospace",
                letterSpacing: "0.32em",
                color: C.muted,
              }}
            >
              Member
            </span>
            <button
              onClick={handleDraft}
              disabled={isDrafted || pending}
              className="rounded-full uppercase font-bold transition-opacity active:opacity-80 disabled:opacity-60"
              style={{
                fontFamily: "'Space Mono', monospace",
                fontSize: 10,
                letterSpacing: "0.18em",
                padding: "7px 14px",
                background: isDrafted ? "transparent" : C.raspberry,
                color: isDrafted ? C.muted : "#0A0A0B",
                border: isDrafted ? `1px solid ${C.borderStrong}` : "none",
                boxShadow: isDrafted ? "none" : "0 8px 20px -8px rgba(232,39,111,0.55)",
              }}
              aria-label="Draft to your XI"
            >
              {isDrafted ? "✓ Added" : pending ? "…" : "+ Add"}
            </button>
          </div>

          {/* Hero */}
          <div
            className="relative overflow-hidden mb-5"
            style={{
              borderRadius: 16,
              height: 280,
              background: "#0F0F10",
              border: `1px solid ${C.border}`,
            }}
          >
            {profile.profile_photo_url ? (
              <img
                src={profile.profile_photo_url}
                alt={profile.name}
                className="w-full h-full object-cover"
                style={{ filter: "saturate(0.92) contrast(1.05)" }}
              />
            ) : (
              <div
                className="w-full h-full flex items-center justify-center"
                style={{
                  background:
                    "linear-gradient(140deg, rgba(232,39,111,0.18), rgba(216,140,90,0.14))",
                  fontFamily: "'Anton', sans-serif",
                  fontSize: 140,
                  color: "rgba(250,245,233,0.35)",
                }}
              >
                {first[0]}
              </div>
            )}

            {/* Frosted match badge */}
            {match.pct > 0 && (
              <div
                className="absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1.5 rounded-full"
                style={{
                  background: "rgba(10,10,11,0.55)",
                  border: "1px solid rgba(250,245,233,0.18)",
                  backdropFilter: "blur(14px)",
                }}
              >
                <Sparkles size={11} color={C.raspberry} />
                <span
                  className="text-[10px] uppercase font-bold"
                  style={{
                    fontFamily: "Inter, sans-serif",
                    letterSpacing: "0.14em",
                    color: C.text,
                  }}
                >
                  {match.pct}% Match
                </span>
              </div>
            )}

            {/* Gradient floor */}
            <div
              className="absolute inset-x-0 bottom-0 pointer-events-none"
              style={{
                height: "60%",
                background:
                  "linear-gradient(to top, rgba(10,10,11,0.96) 0%, rgba(10,10,11,0.55) 50%, transparent 100%)",
              }}
            />

            {/* Identity */}
            <div className="absolute left-4 right-4 bottom-4">
              <h1
                style={{
                  fontFamily: "'Playfair Display', Georgia, serif",
                  fontStyle: "italic",
                  fontSize: 34,
                  lineHeight: 1.0,
                  color: C.text,
                  letterSpacing: "-0.015em",
                  textShadow: "0 2px 20px rgba(0,0,0,0.5)",
                }}
              >
                {first} {initial && `${initial}.`}
              </h1>
              <div className="mt-1.5 flex items-center gap-2 flex-wrap">
                {teamsRow[0] && (
                  <span
                    className="text-[10px] uppercase font-bold"
                    style={{
                      fontFamily: "'Space Mono', monospace",
                      color: C.raspberry,
                      letterSpacing: "0.2em",
                    }}
                  >
                    {teamsRow[0]}
                    {profile.city ? ` · ${profile.city.toUpperCase()}` : ""}
                  </span>
                )}
                <span
                  className="text-[10px]"
                  style={{
                    fontFamily: "'Space Mono', monospace",
                    color: C.faint,
                    letterSpacing: "0.16em",
                  }}
                >
                  {fmtJoined(profile.created_at)}
                </span>
              </div>
            </div>
          </div>

          {/* Why you'd vibe */}
          {whyVibe.length > 0 && (
            <section
              className="rounded-2xl p-4 mb-5"
              style={{
                background: "rgba(232,39,111,0.06)",
                border: "1px solid rgba(232,39,111,0.22)",
              }}
            >
              <Eyebrow
                icon={<Sparkles size={11} color={C.raspberry} />}
                label="Why you'd vibe"
              />
              <ul className="space-y-1.5">
                {whyVibe.map((line, i) => (
                  <li
                    key={i}
                    className="flex gap-2 text-[13px] leading-snug"
                    style={{ color: C.text }}
                  >
                    <span style={{ color: C.raspberry, lineHeight: 1.45 }}>·</span>
                    <span>{line}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* VIBE bio */}
          {profile.bio && (
            <section className="mb-6">
              <Eyebrow label="Vibe" />
              <p
                style={{
                  fontFamily: "'Space Mono', ui-monospace, monospace",
                  fontSize: 13,
                  lineHeight: 1.65,
                  color: C.text,
                }}
              >
                {profile.bio}
              </p>
            </section>
          )}

          {/* Rides for */}
          {teamsRow.length > 0 && (
            <section className="mb-6">
              <Eyebrow label="Rides for" />
              <div className="flex flex-wrap gap-1.5">
                {teamsRow.map((t) => (
                  <TeamChip key={t}>{t}</TeamChip>
                ))}
              </div>
            </section>
          )}

          {/* You both */}
          {(match.sharedTeams.length > 0 ||
            match.sharedSports.length > 0 ||
            match.sameCity) && (
            <section className="mb-6">
              <Eyebrow label="You both" />
              <div className="flex flex-col gap-2">
                {match.sameCity && profile.city && (
                  <div
                    className="flex items-center gap-2.5 rounded-lg px-3 py-2.5"
                    style={{ background: C.card }}
                  >
                    <Beer size={16} color={C.raspberry} />
                    <span style={{ fontSize: 12.5, color: C.text }}>
                      Based in {profile.city}
                    </span>
                  </div>
                )}
                {match.sharedSports[0] && (
                  <div
                    className="flex items-center gap-2.5 rounded-lg px-3 py-2.5"
                    style={{ background: C.card }}
                  >
                    <Calendar size={16} color={C.raspberry} />
                    <span style={{ fontSize: 12.5, color: C.text }}>
                      Watch the same {match.sharedSports[0]} fixtures
                    </span>
                  </div>
                )}
                {match.sharedTeams.length > 0 && (
                  <div
                    className="flex items-center gap-2.5 rounded-lg px-3 py-2.5"
                    style={{ background: C.card }}
                  >
                    <Users size={16} color={C.raspberry} />
                    <span style={{ fontSize: 12.5, color: C.text }}>
                      Ride for {match.sharedTeams.slice(0, 2).join(" & ")}
                    </span>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* Attending */}
          {attending.length > 0 && (
            <section className="mb-6">
              <Eyebrow label={`Attending · ${attending.length}`} />
              <div className="flex flex-col gap-2">
                {attending.map((e) => {
                  const d = new Date(e.event_date);
                  const dateLbl = d.toLocaleString("en-US", { month: "short", day: "numeric" });
                  return (
                    <button
                      key={e.id}
                      onClick={() => navigate(`/events/${e.slug || e.id}`)}
                      className="flex items-center gap-3 rounded-xl p-2.5 text-left active:opacity-80 transition-opacity"
                      style={{ background: C.card, border: `1px solid ${C.border}` }}
                    >
                      <div
                        className="flex-shrink-0 rounded-lg overflow-hidden flex flex-col items-center justify-center"
                        style={{
                          width: 52, height: 52,
                          background: e.image_url ? `url(${e.image_url}) center/cover` : C.cardElev,
                          border: `1px solid ${C.border}`,
                        }}
                      >
                        {!e.image_url && (
                          <>
                            <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 9, letterSpacing: "0.18em", color: C.copper }}>
                              {d.toLocaleString("en-US", { month: "short" }).toUpperCase()}
                            </span>
                            <span style={{ fontFamily: "'Playfair Display', Georgia, serif", fontStyle: "italic", fontSize: 20, lineHeight: 1, color: C.text }}>
                              {d.getDate()}
                            </span>
                          </>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div
                          className="truncate"
                          style={{ fontFamily: "'Playfair Display', Georgia, serif", fontStyle: "italic", fontSize: 15, color: C.text, lineHeight: 1.15 }}
                        >
                          {e.title}
                        </div>
                        <div
                          className="truncate mt-1"
                          style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, letterSpacing: "0.12em", color: C.muted, textTransform: "uppercase" }}
                        >
                          {dateLbl}{e.venue_name ? ` · ${e.venue_name}` : e.city ? ` · ${e.city}` : ""}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>
          )}

          {/* Recent rounds — soft empty when no live activity */}
          <section className="mb-6">
            <Eyebrow label="Recent rounds" />
            <div
              className="rounded-xl px-4 py-4"
              style={{
                background: C.card,
                border: `1px solid ${C.border}`,
              }}
            >
              <p
                className="text-[12.5px] leading-relaxed"
                style={{ color: C.muted, fontStyle: "italic", fontFamily: "'Playfair Display', Georgia, serif" }}
              >
                Activity will surface here as {first} shows up around the league.
              </p>
            </div>
          </section>

          {/* Tags cluster */}
          {allTags.length > 0 && (
            <section className="mb-4">
              <Eyebrow label="Tags" />
              <div className="flex flex-wrap gap-1.5">
                {Array.from(new Set(allTags)).slice(0, 12).map((t) => (
                  <TagChip key={t}>{t}</TagChip>
                ))}
              </div>
            </section>
          )}
        </div>
      </main>

      {/* Sticky bottom CTA */}
      <div
        className="fixed inset-x-0 bottom-0 md:left-64 z-40"
        style={{ pointerEvents: "none" }}
      >
        <div
          className="h-16"
          style={{
            background:
              "linear-gradient(to top, rgba(10,10,11,1) 30%, rgba(10,10,11,0) 100%)",
          }}
        />
        <div
          className="px-5 pt-2 pb-5"
          style={{ background: C.bg, pointerEvents: "auto" }}
        >
          <div className="max-w-[440px] md:max-w-2xl mx-auto flex gap-2.5">
            <button
              onClick={() => navigate(-1)}
              className="rounded-full uppercase font-bold transition-opacity active:opacity-80"
              style={{
                fontFamily: "Inter, sans-serif",
                fontSize: 11,
                letterSpacing: "0.16em",
                padding: "14px 18px",
                background: "transparent",
                color: C.text,
                border: `1px solid ${C.borderStrong}`,
                flex: "0 0 33%",
              }}
            >
              Pass
            </button>
            <button
              onClick={handleDraft}
              disabled={isDrafted || pending}
              className="flex-1 rounded-full uppercase font-bold transition-opacity active:opacity-80"
              style={{
                fontFamily: "Inter, sans-serif",
                fontSize: 12,
                letterSpacing: "0.18em",
                padding: "14px 18px",
                background: isDrafted ? "transparent" : C.raspberry,
                color: isDrafted ? C.muted : "#0A0A0B",
                border: isDrafted ? `1px solid ${C.borderStrong}` : "none",
                opacity: pending ? 0.6 : 1,
                boxShadow: isDrafted
                  ? "none"
                  : "0 16px 36px -12px rgba(232,39,111,0.6)",
              }}
            >
              {isDrafted ? "✓ Added" : pending ? "…" : "+ Add to Your Team"}
            </button>
          </div>
        </div>
      </div>

      <DraftConfirmModal
        open={confirmOpen}
        memberFirstName={first}
        suggestedOpener={opener}
        draftsLeft={draftsLeft}
        onClose={() => setConfirmOpen(false)}
      />
    </div>
  );
};

export default MemberProfile;

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Seo } from "@/components/Seo";
import { Tv, Users, MessagesSquare, MapPin, Gift, Sparkles, ArrowRight, Search } from "lucide-react";
import { C, fonts } from "@/lib/editorialTheme";
import { H1, H2, H3, Body, Slug, Mono, PrimaryBtn, SecondaryBtn } from "@/components/editorial/primitives";
import BottomNav from "@/components/BottomNav";
import SiteNav from "@/components/SiteNav";
import { loadDrafts, MOCK_MEMBERS, type Member } from "@/lib/startingXiData";
import ClubMessagesInbox from "@/components/club/ClubMessagesInbox";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

const PILLARS = [
  { Icon: Tv, chip: "Watch parties", h: "Watch the game with your people.", p: "Members-only watch parties, both IRL and in private chat rooms. Live reactions, hot takes, post-game debriefs — without the chaos of public timelines." },
  { Icon: Sparkles, chip: "Fan matching", h: "Smart matches, not swipes.", p: "Three curated drafts a week, built around the teams you love, the games you watch, and the city you live in. Make the introductions count." },
  { Icon: MessagesSquare, chip: "Group chats", h: "Rooms by team & moment.", p: "Private group chats organized by team, sport, and ritual. The game-thread energy you actually want — vetted, members-only, on-topic." },
  { Icon: MapPin, chip: "City crews", h: "Find your local lineup.", p: "City crews for the cities Loverball lives in. LA first, then everywhere members show up. Bar takeovers, away-game travel, post-game dinners." },
  { Icon: Users, chip: "Fan circles", h: "Small rooms, real friendships.", p: "Members-only circles built around fandoms and rituals. Quiet onboarding so new members land in a real conversation, not a stadium of strangers." },
  { Icon: Gift, chip: "Perks", h: "Members-only everything.", p: "Priority event invites, mixers, merch drops, partner discounts, and a direct line to the team. The good stuff is reserved for the people in the room." },
];

const Club = () => {
  const navigate = useNavigate();
  const [connections, setConnections] = useState<Member[]>([]);
  const [curated, setCurated] = useState<Member[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const { drafted } = loadDrafts();
    setConnections(drafted.map((id) => MOCK_MEMBERS.find((m) => m.id === id)).filter(Boolean) as Member[]);
    // 3 curated weekly matches: top matches not already drafted
    const available = MOCK_MEMBERS.filter((m) => !drafted.includes(m.id))
      .sort((a, b) => b.match - a.match)
      .slice(0, 3);
    setCurated(available);
  }, []);

  return (
    <div style={{ background: C.bg, color: C.text, fontFamily: fonts.sans }} className="min-h-screen">
      <Seo
        title="The Club — Loverball"
        description="Members-only home for women's sports fans. Curated matches, connections, group chats, and city crews."
        path="/club"
      />

      <BottomNav />

      <main className="pb-24 md:pb-0">
        {/* Header */}
        <section className="max-w-7xl mx-auto px-5 md:px-10 pt-24 md:pt-32 pb-10">
          <div className="flex items-center gap-2 mb-4">
            <span
              style={{
                fontFamily: "'Space Mono', ui-monospace, monospace",
                fontSize: 11,
                letterSpacing: "0.22em",
                color: C.raspberry,
                textTransform: "uppercase",
              }}
            >
              {"\n"}
            </span>
            <span
              style={{
                fontFamily: "'Space Mono', ui-monospace, monospace",
                fontSize: 11,
                letterSpacing: "0.22em",
                color: C.muted,
                textTransform: "uppercase",
              }}
            >
              Club{connections.length ? ` · ${connections.length} connected` : ""}
            </span>
          </div>
          <Slug>The Club</Slug>
          <H1 className="mt-6" style={{ fontSize: "clamp(40px, 7vw, 96px)", lineHeight: 0.95 }}>
            The members-only home<br/>for women's sports fans.
          </H1>
          <div className="mt-8 flex flex-wrap gap-3 items-center">
            <PrimaryBtn onClick={() => navigate("/club/xi")}>My Connections</PrimaryBtn>
            <SecondaryBtn onClick={() => navigate("/messages")}>Messages</SecondaryBtn>
          </div>
        </section>

        {/* Current roster */}
        <section className="max-w-7xl mx-auto px-5 md:px-10 pb-2">
          <div className="flex items-end justify-between gap-4 mb-5">
            <div>
              <Slug>Current roster</Slug>
              <H3 className="mt-2" style={{ fontSize: 22 }}>
                Your friends {connections.length ? `· ${connections.length}` : ""}
              </H3>
            </div>
            <button
              onClick={() => navigate("/club/xi")}
              className="inline-flex items-center gap-2 text-xs hover:opacity-80 transition-opacity"
              style={{ color: C.raspberry, fontFamily: fonts.mono, letterSpacing: "0.08em", textTransform: "uppercase" }}
            >
              Manage <ArrowRight size={12} />
            </button>
          </div>

          {connections.length === 0 ? (
            <div
              className="rounded-[20px] p-6 flex items-center justify-between gap-4"
              style={{ background: C.surface, border: `1px dashed ${C.border}` }}
            >
              <Body muted size={14}>No friends added yet. Build your roster from this week's matches.</Body>
              <button
                onClick={() => navigate("/club/xi")}
                className="inline-flex items-center gap-2 text-xs px-4 py-2 rounded-full whitespace-nowrap"
                style={{ background: C.raspberry, color: "#fff", fontFamily: fonts.mono, letterSpacing: "0.08em", textTransform: "uppercase" }}
              >
                + Add
              </button>
            </div>
          ) : (
            <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1" style={{ scrollbarWidth: "thin" }}>
              {connections.map((m) => (
                <div
                  key={m.id}
                  className="flex-shrink-0 flex flex-col items-center gap-2"
                  style={{ width: 84 }}
                >
                  <button
                    onClick={() => navigate(`/members/${m.id}`)}
                    className="relative rounded-full overflow-hidden transition-transform hover:-translate-y-0.5"
                    style={{ width: 64, height: 64, border: `1px solid ${C.border}` }}
                    aria-label={`View ${m.name}`}
                  >
                    <img src={m.photo} alt={m.name} loading="lazy" className="w-full h-full object-cover" />
                  </button>
                  <div className="w-full text-center truncate" style={{ fontFamily: fonts.mono, fontSize: 10, letterSpacing: "0.06em", color: C.text }}>
                    {m.name.split(" ")[0]}
                  </div>
                  <button
                    onClick={() => navigate(`/messages?member=${m.id}`)}
                    className="inline-flex items-center justify-center rounded-full"
                    style={{ width: 28, height: 28, background: C.surface, border: `1px solid ${C.border}`, color: C.raspberry }}
                    aria-label={`Message ${m.name}`}
                  >
                    <MessagesSquare size={13} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Tabs */}
        <section className="max-w-7xl mx-auto px-5 md:px-10 pb-20">
          <Tabs defaultValue="matches" className="w-full">
            <TabsList
              className="h-auto p-1 mb-10 inline-flex gap-1"
              style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 999 }}
            >
              {[
                { v: "matches", label: "This Week's Matches" },
                { v: "connections", label: "My Connections" },
                { v: "inside", label: "Inside the Club" },
              ].map((t) => (
                <TabsTrigger
                  key={t.v}
                  value={t.v}
                  className="rounded-full px-5 py-2.5 text-sm data-[state=active]:shadow-none"
                  style={{ fontFamily: fonts.mono, letterSpacing: "0.06em", textTransform: "uppercase" }}
                >
                  {t.label}
                </TabsTrigger>
              ))}
            </TabsList>

            {/* ---- MATCHES ---- */}
            <TabsContent value="matches" className="mt-0">
              <div className="flex items-end justify-between gap-4 mb-6">
                <div>
                  <Slug>Curated for you</Slug>
                  <H2 className="mt-3">Three matches this week.</H2>
                  <Body muted size={15} className="mt-3 max-w-xl">
                    Hand-picked by your teams, your city, and your rituals. New drops every Monday.
                  </Body>
                </div>
              </div>

              {curated.length === 0 ? (
                <div
                  className="rounded-[20px] p-10 text-center"
                  style={{ background: C.surface, border: `1px dashed ${C.border}` }}
                >
                  <Body muted size={15}>No new matches this week. Check back Monday.</Body>
                </div>
              ) : (
                <div className="grid md:grid-cols-3 gap-6">
                  {curated.map((m) => (
                    <article
                      key={m.id}
                      onClick={() => navigate(`/members/${m.id}`)}
                      className="cursor-pointer rounded-[20px] overflow-hidden transition-transform hover:-translate-y-1"
                      style={{ background: C.surface, border: `1px solid ${C.border}` }}
                    >
                      <div className="aspect-[4/5] overflow-hidden" style={{ background: C.bg }}>
                        <img src={m.photo} alt={m.name} loading="lazy" className="w-full h-full object-cover" />
                      </div>
                      <div className="p-5">
                        <Mono color={C.raspberry} size={10}>{m.match}% MATCH</Mono>
                        <H3 className="mt-2" style={{ fontSize: 22 }}>{m.name}</H3>
                        <Body muted size={13} className="mt-1 line-clamp-1">{m.team} · {m.city}</Body>
                        <Body size={14} className="mt-3 line-clamp-2" style={{ fontFamily: fonts.mono }}>
                          {m.vibe}
                        </Body>
                        <div className="mt-5 flex items-center gap-2">
                          <button
                            onClick={(e) => { e.stopPropagation(); navigate("/club/xi"); }}
                            className="flex-1 inline-flex items-center justify-center gap-2 text-xs px-3 py-2.5 rounded-full transition-colors"
                            style={{ background: C.raspberry, color: "#fff", fontFamily: fonts.mono, letterSpacing: "0.08em", textTransform: "uppercase" }}
                          >
                            + Add
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); navigate(`/members/${m.id}`); }}
                            className="inline-flex items-center gap-1 text-xs px-3 py-2.5 rounded-full transition-colors"
                            style={{ background: C.bg, color: C.text, border: `1px solid ${C.border}`, fontFamily: fonts.mono, letterSpacing: "0.08em", textTransform: "uppercase" }}
                          >
                            View
                          </button>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* ---- CONNECTIONS ---- */}
            <TabsContent value="connections" className="mt-0">
              <div className="flex items-end justify-between gap-4 mb-6">
                <div>
                  <Slug>Your Team</Slug>
                  <H2 className="mt-3">My Connections</H2>
                </div>
                <button
                  onClick={() => navigate("/club/xi")}
                  className="inline-flex items-center gap-2 text-sm hover:opacity-80 transition-opacity"
                  style={{ color: C.raspberry, fontFamily: fonts.mono, letterSpacing: "0.08em", textTransform: "uppercase" }}
                >
                  Add more <ArrowRight size={14} />
                </button>
              </div>

              {/* Search bar */}
              <div className="mb-6">
                <div
                  className="flex items-center gap-3 rounded-full px-4 py-3"
                  style={{ background: C.surface, border: `1px solid ${C.border}` }}
                >
                  <Search size={16} color={C.muted} />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by name, team, city..."
                    className="flex-1 bg-transparent outline-none text-sm"
                    style={{ color: C.text, fontFamily: fonts.sans }}
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      className="text-xs hover:opacity-80 transition-opacity"
                      style={{ color: C.muted }}
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>

              {(() => {
                const q = searchQuery.trim().toLowerCase();
                const filtered = q
                  ? connections.filter((m) =>
                      m.name.toLowerCase().includes(q) ||
                      m.team.toLowerCase().includes(q) ||
                      m.city.toLowerCase().includes(q) ||
                      m.vibe.toLowerCase().includes(q) ||
                      m.teams.some((t) => t.toLowerCase().includes(q)) ||
                      m.tags.some((t) => t.toLowerCase().includes(q))
                    )
                  : connections;

                if (filtered.length === 0) {
                  return (
                    <div
                      className="rounded-[20px] p-10 md:p-14 text-center"
                      style={{ background: C.surface, border: `1px dashed ${C.border}` }}
                    >
                      <Sparkles size={28} color={C.gold} strokeWidth={1.25} className="mx-auto" />
                      <H3 className="mt-5">{q ? "No matches found" : "No friends added yet"}</H3>
                      <Body muted size={15} className="mt-3 max-w-md mx-auto">
                        {q
                          ? "Try a different search term or clear the filter."
                          : "Your Team is empty. Open the picker to choose the members you want in your lineup this week."}
                      </Body>
                      {!q && (
                        <div className="mt-7 flex justify-center">
                          <PrimaryBtn onClick={() => navigate("/club/xi")}>Open Your Team</PrimaryBtn>
                        </div>
                      )}
                    </div>
                  );
                }

                return (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
                    {filtered.map((m) => (
                      <article
                        key={m.id}
                        onClick={() => navigate(`/members/${m.id}`)}
                        className="cursor-pointer rounded-[20px] overflow-hidden transition-transform hover:-translate-y-1"
                        style={{ background: C.surface, border: `1px solid ${C.border}` }}
                      >
                        <div className="aspect-[4/5] overflow-hidden" style={{ background: C.bg }}>
                          <img src={m.photo} alt={m.name} loading="lazy" className="w-full h-full object-cover" />
                        </div>
                        <div className="p-4">
                          <Mono color={C.raspberry} size={10}>{m.match}% MATCH</Mono>
                          <H3 className="mt-2" style={{ fontSize: 20 }}>{m.name}</H3>
                          <Body muted size={13} className="mt-1 line-clamp-1">{m.team} · {m.city}</Body>
                          <button
                            onClick={(e) => { e.stopPropagation(); navigate("/messages"); }}
                            className="mt-4 inline-flex items-center gap-2 text-xs px-3 py-2 rounded-full transition-colors"
                            style={{ background: C.bg, color: C.text, border: `1px solid ${C.border}`, fontFamily: fonts.mono, letterSpacing: "0.08em", textTransform: "uppercase" }}
                          >
                            <MessagesSquare size={12} /> Message
                          </button>
                        </div>
                      </article>
                    ))}
                  </div>
                );
              })()}

              <div className="mt-12">
                <ClubMessagesInbox />
              </div>
            </TabsContent>

            {/* ---- INSIDE THE CLUB ---- */}
            <TabsContent value="inside" className="mt-0">
              <div className="mb-8">
                <Slug>What's inside</Slug>
                <H2 className="mt-3">Everything the Club includes.</H2>
              </div>

              <ul
                className="rounded-[20px] overflow-hidden"
                style={{ background: C.surface, border: `1px solid ${C.border}` }}
              >
                {PILLARS.map(({ Icon, chip, h, p }, i) => (
                  <li
                    key={chip}
                    className="flex items-start gap-5 md:gap-7 p-6 md:p-8"
                    style={{ borderTop: i === 0 ? "none" : `0.5px solid ${C.border}` }}
                  >
                    <div
                      className="flex-shrink-0 flex items-center justify-center rounded-full"
                      style={{ background: C.bg, border: `1px solid ${C.border}`, width: 56, height: 56 }}
                    >
                      <Icon size={22} color={C.gold} strokeWidth={1.25} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <Mono color={C.raspberry} size={10}>{chip}</Mono>
                      <H3 className="mt-2" style={{ fontSize: 22 }}>{h}</H3>
                      <Body muted size={15} className="mt-2">{p}</Body>
                    </div>
                  </li>
                ))}
              </ul>
            </TabsContent>
          </Tabs>
        </section>

        <footer className="max-w-7xl mx-auto px-5 md:px-10 py-10" style={{ borderTop: `0.5px solid ${C.border}` }}>
          <Mono size={10}>© 2026 Loverball · Built in LA</Mono>
        </footer>
      </main>
    </div>
  );
};

export default Club;

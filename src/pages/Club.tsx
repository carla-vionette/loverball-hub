import { useState, useMemo, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Seo } from "@/components/Seo";
import { Tv, Users, MessagesSquare, MapPin, Gift, Sparkles, Search, ArrowRight } from "lucide-react";
import { C, fonts } from "@/lib/editorialTheme";
import { H1, H2, H3, Body, Slug, Mono, PrimaryBtn, SecondaryBtn, TertiaryLink } from "@/components/editorial/primitives";
import MobileHeader from "@/components/MobileHeader";
import DesktopNav from "@/components/DesktopNav";
import BottomNav from "@/components/BottomNav";
import { loadDrafts, MOCK_MEMBERS, type Member } from "@/lib/startingXiData";
import ClubMessagesInbox from "@/components/club/ClubMessagesInbox";


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
  const goSignup = () => navigate("/auth?mode=signup");
  const [query, setQuery] = useState("");
  const [connections, setConnections] = useState<Member[]>([]);

  useEffect(() => {
    const { drafted } = loadDrafts();
    setConnections(drafted.map((id) => MOCK_MEMBERS.find((m) => m.id === id)).filter(Boolean) as Member[]);
  }, []);

  const filteredPillars = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return PILLARS;
    return PILLARS.filter(({ chip, h, p }) =>
      `${chip} ${h} ${p}`.toLowerCase().includes(q)
    );
  }, [query]);


  return (
    <div style={{ background: C.bg, color: C.text, fontFamily: fonts.sans }} className="min-h-screen">
      <Seo
        title="The Club — Loverball"
        description="The Club is the members-only home for women's sports fans. Watch parties, fan matching, group chats, city crews, and members-only perks."
        path="/club"
      />

      <MobileHeader /><DesktopNav /><BottomNav />

      <main className="md:ml-16 xl:ml-64 pt-16 md:pt-0 pb-24 md:pb-0">
      <section className="max-w-7xl mx-auto px-5 md:px-10 pt-32 md:pt-40 pb-20">
        <Slug>The Club</Slug>
        <H1 className="mt-6" style={{ fontSize: "clamp(48px, 9vw, 128px)", lineHeight: 0.92 }}>
          The members-only home<br/>for women's sports fans.
        </H1>
        <Body muted size={18} className="mt-8 max-w-xl">
          A private club for the watch parties, group chats, city crews, and friendships that the rest of the internet keeps flattening. Vetted, quiet, real.
        </Body>
        <div className="mt-10 flex flex-wrap gap-4 items-center">
          <PrimaryBtn onClick={() => navigate("/club/xi")}>My Connections</PrimaryBtn>
          <SecondaryBtn onClick={() => navigate("/messages")}>Messages</SecondaryBtn>
          <TertiaryLink to="/events">Upcoming events</TertiaryLink>
          <TertiaryLink to="/membership">See passes</TertiaryLink>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-5 md:px-10 pb-16">
        <div className="flex items-end justify-between gap-4 mb-8">
          <div>
            <Slug>Your Starting XI</Slug>
            <H2 className="mt-3">My Connections</H2>
          </div>
          <button
            onClick={() => navigate("/club/xi")}
            className="inline-flex items-center gap-2 text-sm hover:opacity-80 transition-opacity"
            style={{ color: C.raspberry, fontFamily: fonts.mono, letterSpacing: "0.08em", textTransform: "uppercase" }}
          >
            Draft more <ArrowRight size={14} />
          </button>
        </div>

        {connections.length === 0 ? (
          <div
            className="rounded-[20px] p-10 md:p-14 text-center"
            style={{ background: C.surface, border: `1px dashed ${C.border}` }}
          >
            <Sparkles size={28} color={C.gold} strokeWidth={1.25} className="mx-auto" />
            <H3 className="mt-5">No connections drafted yet</H3>
            <Body muted size={15} className="mt-3 max-w-md mx-auto">
              Your Starting XI is empty. Open the draft to pick the members you want in your lineup this week.
            </Body>
            <div className="mt-7 flex justify-center">
              <PrimaryBtn onClick={() => navigate("/club/xi")}>Open Starting XI</PrimaryBtn>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {connections.map((m) => (
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
        )}
      </section>

      <ClubMessagesInbox />

      <section className="max-w-7xl mx-auto px-5 md:px-10 pb-24">
        <div
          className="mb-10 flex items-center gap-3 px-5 py-3 rounded-full"
          style={{ background: C.surface, border: `1px solid ${C.border}` }}
        >
          <Search size={18} color={C.muted} aria-hidden="true" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search the Club — watch parties, crews, perks…"
            aria-label="Search the Club"
            className="flex-1 bg-transparent outline-none text-base placeholder:opacity-60"
            style={{ color: C.text, fontFamily: fonts.sans }}
          />
        </div>

        {filteredPillars.length === 0 ? (
          <div className="text-center py-16" style={{ color: C.muted }}>
            <Body muted size={16}>No matches for "{query}".</Body>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPillars.map(({ Icon, chip, h, p }) => (
              <article
                key={chip}
                className="p-8 md:p-10 rounded-[20px] transition-all duration-300 hover:-translate-y-1"
                style={{ background: C.surface, border: `1px solid ${C.border}` }}
              >
                <Mono color={C.raspberry}>{chip}</Mono>
                <div className="mt-6"><Icon size={28} color={C.gold} strokeWidth={1.25} /></div>
                <H3 className="mt-6">{h}</H3>
                <Body muted size={15} className="mt-4">{p}</Body>
              </article>
            ))}
          </div>
        )}
      </section>


      <section className="max-w-7xl mx-auto px-5 md:px-10 py-24">
        <div className="grid md:grid-cols-12 gap-10 items-start">
          <div className="md:col-span-4"><Slug>Member perks</Slug></div>
          <div className="md:col-span-8">
            <H2>The room you've been looking for.</H2>
            <ul className="mt-10 space-y-5" style={{ fontFamily: fonts.sans, fontSize: 17, lineHeight: 1.6, color: C.text }}>
              {[
                "Priority RSVP to every members-only event",
                "Curated fan matches three times a week",
                "Private city crews and away-game travel",
                "Members-only mixers, dinners, and bar takeovers",
                "Merch drops and partner perks",
                "A direct line to the Loverball team",
              ].map((p) => (
                <li key={p} className="flex items-start gap-4">
                  <span style={{ color: C.raspberry, fontFamily: fonts.mono, fontSize: 11, marginTop: 6 }}>—</span>
                  <span>{p}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-5 md:px-10 py-24 text-center" style={{ borderTop: `0.5px solid ${C.border}` }}>
        <Slug>Join</Slug>
        <H2 className="mt-4 mx-auto max-w-3xl" style={{ fontSize: "clamp(40px, 6vw, 80px)" }}>
          A members-only home for sports fandom.
        </H2>
        <Body muted size={16} className="mt-6 mx-auto max-w-md">
          The Club is invite-only this season. Bring your code, or join the waitlist.
        </Body>
        <div className="mt-10 flex flex-wrap gap-4 justify-center">
          <PrimaryBtn onClick={goSignup}>Join the Club</PrimaryBtn>
          <SecondaryBtn to="/membership">Compare passes</SecondaryBtn>
        </div>
      </section>

      <footer className="max-w-7xl mx-auto px-5 md:px-10 py-10" style={{ borderTop: `0.5px solid ${C.border}` }}>
        <Mono size={10}>© 2026 Loverball · Built in LA</Mono>
      </footer>
      </main>

    </div>
  );
};

export default Club;

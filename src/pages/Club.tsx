import { Link, useNavigate } from "react-router-dom";
import { Seo } from "@/components/Seo";
import { Tv, Users, MessagesSquare, MapPin, Gift, Sparkles } from "lucide-react";
import { C, fonts } from "@/lib/editorialTheme";
import { H1, H2, H3, Body, Slug, Mono, PrimaryBtn, SecondaryBtn, TertiaryLink } from "@/components/editorial/primitives";
import SiteNav from "@/components/SiteNav";


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

  return (
    <div style={{ background: C.bg, color: C.text, fontFamily: fonts.sans }} className="min-h-screen">
      <Seo
        title="The Club — Loverball"
        description="The Club is the members-only home for women's sports fans. Watch parties, fan matching, group chats, city crews, and members-only perks."
        path="/club"
      />

      <SiteNav />

      <section className="px-6 md:px-12 pt-16 md:pt-24 pb-20 max-w-6xl">
        <Slug>The Club</Slug>
        <H1 className="mt-6" style={{ fontSize: "clamp(48px, 9vw, 128px)", lineHeight: 0.92 }}>
          The members-only home<br/>for women's sports fans.
        </H1>
        <Body muted size={18} className="mt-8 max-w-xl">
          A private club for the watch parties, group chats, city crews, and friendships that the rest of the internet keeps flattening. Vetted, quiet, real.
        </Body>
        <div className="mt-10 flex flex-wrap gap-4 items-center">
          <PrimaryBtn onClick={() => navigate("/club/xi")}>Open Starting XI</PrimaryBtn>
          <SecondaryBtn onClick={goSignup}>Join the Club</SecondaryBtn>
          <TertiaryLink to="/membership">See passes</TertiaryLink>
        </div>
      </section>

      <section className="grid md:grid-cols-2 lg:grid-cols-3 gap-px" style={{ background: C.border, borderTop: `0.5px solid ${C.border}`, borderBottom: `0.5px solid ${C.border}` }}>
        {PILLARS.map(({ Icon, chip, h, p }) => (
          <article key={chip} className="p-10" style={{ background: C.bg }}>
            <Mono color={C.raspberry}>{chip}</Mono>
            <div className="mt-6"><Icon size={28} color={C.gold} strokeWidth={1.25} /></div>
            <H3 className="mt-6">{h}</H3>
            <Body muted size={15} className="mt-4">{p}</Body>
          </article>
        ))}
      </section>

      <section className="px-6 md:px-12 py-24 max-w-5xl">
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

      <section className="px-6 md:px-12 py-24 text-center" style={{ borderTop: `0.5px solid ${C.border}` }}>
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

      <footer className="px-6 md:px-12 py-10" style={{ borderTop: `0.5px solid ${C.border}` }}>
        <Mono size={10}>© 2026 Loverball · Built in LA</Mono>
      </footer>
    </div>
  );
};

export default Club;

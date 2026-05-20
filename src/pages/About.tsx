import { Link } from "react-router-dom";
import { Seo } from "@/components/Seo";
import { C, fonts } from "@/lib/editorialTheme";
import { H1, Body, Slug, Mono, PrimaryBtn, TertiaryLink } from "@/components/editorial/primitives";



const About = () => (
  <div style={{ background: C.bg, color: C.text, fontFamily: fonts.sans }} className="min-h-screen">
    <Seo title="About — Loverball" description="Loverball is the members-only home for sports fandom. Built in Los Angeles for the fans who finally want a place that gets it." path="/about" />
    <SiteNav />

    <section className="px-6 md:px-12 pt-32 md:pt-40 pb-12 max-w-4xl">
      <Slug>About</Slug>
      <H1 className="mt-6">A members-only home for sports fandom.</H1>
    </section>

    <section className="px-6 md:px-12 pb-24 max-w-3xl space-y-6">
      <Body size={18}>
        <span style={{ fontFamily: fonts.serif, fontSize: 64, lineHeight: 0.8, float: "left", marginRight: 10, marginTop: 6, color: C.raspberry }}>L</span>
        overball is a private club for sports fans built in Los Angeles. We make space for the watch parties, group chats, rivalries, rituals, and friendships that the rest of the internet keeps flattening.
      </Body>
      <Body muted size={18}>
        We started Loverball because the best part of sports is who you watch it with. Members get matched into fan circles, find people headed to the same game, and trade hot takes in rooms where the conversation actually goes somewhere.
      </Body>
      <Body muted size={18}>
        No bots. No bad-faith trolls. No algorithm dragging you off-topic. Just members, the games, and the people who love them.
      </Body>
      <div className="pt-6 flex flex-wrap gap-4 items-center">
        <PrimaryBtn to="/auth?mode=signup">JOIN US!</PrimaryBtn>
        <TertiaryLink to="/contact">Contact us</TertiaryLink>
      </div>
    </section>

    <footer className="px-6 md:px-12 py-10" style={{ borderTop: `0.5px solid ${C.border}` }}>
      <Mono size={10}>© 2026 Loverball · Built in LA</Mono>
    </footer>
  </div>
);

export default About;

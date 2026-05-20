import { Link, useNavigate } from "react-router-dom ";
import { Seo } from "@/components/Seo ";
import { Users, MessagesSquare, Sparkles, MapPin } from "lucide-react ";
import { C, fonts } from "@/lib/editorialTheme ";
import { H1, H3, Body, Slug, Mono, PrimaryBtn, TertiaryLink } from "@/components/editorial/primitives ";
const PILLARS = [
  { Icon: Sparkles, chip:"Matching ", h:"Smart matches, not swipes ", p:"Curated by the teams you love, the games you watch, and the city you live in. Three drafts a week — make them count." },
  { Icon: MessagesSquare, chip:"Group chats ", h:"Rooms by team & city ", p:"Live game-thread energy in private rooms. Sound off during the game, debrief after, plan the next watch party." },
  { Icon: Users, chip:"Fan circles ", h:"Find your people ", p:"Small, members-only circles built around fandoms and rituals. Quiet onboarding, real friendships." },
  { Icon: MapPin, chip:"IRL ", h:"Mixers in your city ", p:"Members-only meetups, watch parties, and away-game travel. Hosted in LA first, expanding by demand." },
];

const Connect = () => {
  const navigate = useNavigate();
  return (
    <div style={{ background: C.bg, color: C.text, fontFamily: fonts.sans }} className="min-h-screen ">
      <Seo
        title="Connect — Loverball "
        description="Connect with sports fans who actually get it. Smart matching, private group chats, and members-only mixers built around the teams you love."
        path="/connect "
      />
      <section className="px-6 md:px-12 pt-32 md:pt-40 pb-20 max-w-6xl ">
        <Slug>Issue · Connect</Slug>
        <H1 className="mt-6">Find your<br/>people.</H1>
        <Body muted size={18} className="mt-8 max-w-xl ">
          A members-only home for sports fans who want more than a comment section. Matching, group chats, and meetups — quiet, vetted, real.
        </Body>
        <div className="mt-10 flex flex-wrap gap-4 items-center ">
          <PrimaryBtn onClick={() => navigate("/auth?mode=signup ")}>JOIN US!</PrimaryBtn>
          <TertiaryLink to="/club ">What is The Club?</TertiaryLink>
        </div>
      </section>

      <section className="px-6 md:px-12 pb-24 grid md:grid-cols-2 gap-px " style={{ background: C.border }}>
        {PILLARS.map(({ Icon, chip, h, p }) => (
          <article key={chip} className="p-10" style={{ background: C.bg }}>
            <Mono color={C.raspberry}>{chip}</Mono>
            <div className="mt-6"><Icon size={28} color={C.gold} strokeWidth={1.25} /></div>
            <H3 className="mt-6">{h}</H3>
            <Body muted size={15} className="mt-4">{p}</Body>
          </article>
        ))}
      </section>

      <footer className="px-6 md:px-12 py-10" style={{ borderTop: `0.5px solid ${C.border}` }}>
        <Mono size={10}>© 2026 Loverball · Built in LA</Mono>
      </footer>
    </div>
  );
};

export default Connect;

import { Seo } from "@/components/Seo";
import { ArrowRight, Sparkles, Users, Radio, CalendarHeart } from "lucide-react";
import LandingLayout from "@/components/landing/LandingLayout";
import Eyebrow from "@/components/landing/Eyebrow";
import DisplayHeading from "@/components/landing/DisplayHeading";
import Marker from "@/components/landing/Marker";
import BrandButton from "@/components/landing/BrandButton";
import PhoneMockup from "@/components/landing/PhoneMockup";
import {
  MatchingScreen,
  SquadsScreen,
  FeedScreen,
  DerbyDayScreen,
} from "@/components/landing/PhoneScreens";

interface Block {
  eyebrow: string;
  accent: "lime" | "pink" | "orange";
  title: React.ReactNode;
  body: string;
  cta: { label: string; to: string };
  screen: React.ReactNode;
  icon: React.ReactNode;
  reverse?: boolean;
}

const BLOCKS: Block[] = [
  {
    eyebrow: "Match",
    accent: "lime",
    title: (
      <>
        Your <Marker color="lime">fandom fingerprint.</Marker>
      </>
    ),
    body: "Teams. Hated rivals. Hot takes. We turn it into a match score. Maya, 26 — Sky / Liberty / Thorns, 'Diana over Sue,' Aces blocked on sight — 94% match. That's a teammate.",
    cta: { label: "Join free", to: "/join" },
    screen: <MatchingScreen />,
    icon: <Sparkles size={18} />,
  },
  {
    eyebrow: "Squads",
    accent: "pink",
    title: (
      <>
        Roll <Marker color="pink">five-deep.</Marker>
      </>
    ),
    body: "Build a squad of women's sports fans you actually want to text on a Tuesday. Group chats. Shared calendars. The crew that shows up for the Sky home opener and stays for last call.",
    cta: { label: "Join free", to: "/join" },
    screen: <SquadsScreen />,
    icon: <Users size={18} />,
    reverse: true,
  },
  {
    eyebrow: "Feed & Live",
    accent: "orange",
    title: (
      <>
        Every game, <Marker color="orange">never alone.</Marker>
      </>
    ),
    body: "A live feed of takes, reactions, and scoreboard chatter from women's sports fans. WNBA, NWSL, USWNT, UCLA, USC, the whole slate. Loud. Live. Yours.",
    cta: { label: "Join free", to: "/join" },
    screen: <FeedScreen />,
    icon: <Radio size={18} />,
  },
  {
    eyebrow: "Watch Parties",
    accent: "lime",
    title: (
      <>
        Derby day, <Marker color="lime">two taps.</Marker>
      </>
    ),
    body: "RSVP to verified watch parties for the Thorns derby, the Liberty home stand, USWNT friendlies. Or host your own. Bring the scarf.",
    cta: { label: "Join free", to: "/join" },
    screen: <DerbyDayScreen />,
    icon: <CalendarHeart size={18} />,
    reverse: true,
  },
];

const Features = () => {
  return (
    <LandingLayout>
      <Seo
        title="Loverball Features — Match, squad, feed, watch parties"
        description="Match on fandom. Build a squad. Live feed for every women's sports game. RSVP to verified watch parties. Every tool you need to go all in."
        path="/features"
      />

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-lb-border">
        <div className="mx-auto max-w-7xl px-4 py-20 md:py-28 lg:px-8">
          <Eyebrow color="orange">Features</Eyebrow>
          <DisplayHeading size="xl" className="mt-4 max-w-4xl text-white">
            Every tool you need to{" "}
            <Marker color="orange">go all in.</Marker>
          </DisplayHeading>
          <p className="mt-6 max-w-2xl text-base md:text-lg leading-relaxed text-lb-muted font-body">
            Loverball is the squad layer for women's sports fans. Built for the
            people who already know the rotation, the rivalry, and the right
            bar for game seven.
          </p>
        </div>
      </section>

      {/* Blocks */}
      {BLOCKS.map((b, idx) => (
        <section
          key={idx}
          className={`border-b border-lb-border ${idx % 2 === 1 ? "bg-lb-bg-secondary" : ""}`}
        >
          <div className="mx-auto max-w-7xl px-4 py-20 md:py-24 lg:px-8">
            <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-12 lg:gap-12">
              <div
                className={`lg:col-span-6 ${
                  b.reverse ? "lg:order-2" : ""
                }`}
              >
                <Eyebrow color={b.accent}>{b.eyebrow}</Eyebrow>
                <DisplayHeading size="lg" className="mt-4 text-white">
                  {b.title}
                </DisplayHeading>
                <p className="mt-6 max-w-xl text-base md:text-lg leading-relaxed text-lb-muted font-body">
                  {b.body}
                </p>
                <div className="mt-8">
                  <BrandButton to={b.cta.to} size="lg" variant="primary">
                    {b.cta.label} <ArrowRight size={16} />
                  </BrandButton>
                </div>
              </div>
              <div
                className={`lg:col-span-6 flex justify-center ${
                  b.reverse ? "lg:order-1" : ""
                }`}
              >
                <PhoneMockup className="scale-90 md:scale-100">{b.screen}</PhoneMockup>
              </div>
            </div>
          </div>
        </section>
      ))}

      {/* CTA strip */}
      <section className="relative overflow-hidden bg-pink">
        <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-6 px-4 py-14 md:flex-row md:items-center md:py-16 lg:px-8">
          <DisplayHeading size="md" className="text-white">
            You're already loud about it.
          </DisplayHeading>
          <BrandButton to="/join" variant="lime" size="lg">
            Join free <ArrowRight size={16} />
          </BrandButton>
        </div>
      </section>
    </LandingLayout>
  );
};

export default Features;

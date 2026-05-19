import { Seo } from "@/components/Seo";
import { ArrowRight, Users, Flame, CalendarHeart, Radio } from "lucide-react";
import LandingLayout from "@/components/landing/LandingLayout";
import Eyebrow from "@/components/landing/Eyebrow";
import DisplayHeading from "@/components/landing/DisplayHeading";
import Marker from "@/components/landing/Marker";
import BrandButton from "@/components/landing/BrandButton";
import FeatureCard from "@/components/landing/FeatureCard";
import PhoneMockup from "@/components/landing/PhoneMockup";
import StatsMarquee from "@/components/landing/StatsMarquee";
import { DerbyDayScreen, MatchingScreen, FeedScreen } from "@/components/landing/PhoneScreens";

const MARQUEE = [
  "Sparks host Fever",
  "Angel City vs Wave",
  "JuJu Watkins · 38 pts",
  "Brink doubles up",
  "UCLA women top 4",
  "Angel City Pride Night",
  "LA28 women's hoops",
  "Sparks throwback kits",
  "Sky stack the bench",
  "Liberty home stand",
  "Thorns sellout",
  "USWNT camp opens",
];

const Index = () => {
  return (
    <LandingLayout>
      <Seo
        title="Loverball — Find your teammate. Feel the game."
        description="Loverball is where women sports fans match on fandom, build squads, and RSVP to watch parties. WNBA, NWSL, USWNT, women's college — all in one place."
        path="/"
      />

      {/* ───────────────── Hero ───────────────── */}
      <section className="relative overflow-hidden border-b border-lb-border">
        {/* Watermark */}
        <div
          aria-hidden
          className="pointer-events-none absolute -right-6 -top-10 select-none font-display text-[28vw] leading-none text-white/[0.025] md:text-[20vw]"
        >
          94%
        </div>

        <div className="relative mx-auto max-w-7xl px-4 pt-10 md:pt-16 lg:px-8 lg:pt-20">
          <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-12 lg:gap-8">
            {/* Left */}
            <div className="lg:col-span-6">
              <Eyebrow color="orange">Featured Match · Live now</Eyebrow>

              <DisplayHeading size="xl" className="mt-5 text-white">
                <span className="block">Find your</span>
                <span className="block"><Marker color="lime">teammate.</Marker></span>
                <span className="block">
                  Feel the <span className="text-lb-orange">game.</span>
                </span>
              </DisplayHeading>

              <p className="mt-6 max-w-xl text-base md:text-lg leading-relaxed text-lb-muted font-body">
                Match with die-hard women's sports fans who run the same teams.
                Debate Sue vs Diana. RSVP to watch parties. Roll deep on match
                day. No more watching the WNBA Finals alone in your living room.
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-3">
                <BrandButton to="/join" size="lg" variant="primary">
                  Join free <ArrowRight size={16} />
                </BrandButton>
                <BrandButton to="/how-it-works" size="lg" variant="ghost">
                  How it works
                </BrandButton>
              </div>

              <div className="mt-8 flex flex-wrap items-center gap-3 text-xs uppercase tracking-[0.18em] text-lb-muted font-condensed">
                <span className="inline-flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-lime" />
                  Free to join
                </span>
                <span className="inline-flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-pink" />
                  WNBA · NWSL · USWNT
                </span>
                <span className="inline-flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-lb-orange" />
                  Built for women fans
                </span>
              </div>
            </div>

            {/* Right — phone trio */}
            <div className="lg:col-span-6">
              <div className="relative mx-auto flex items-end justify-center gap-3 md:gap-6 lg:gap-4">
                <PhoneMockup tilt={-6} className="scale-[0.82] md:scale-90" ariaLabel="Derby Day watch party screen">
                  <DerbyDayScreen />
                </PhoneMockup>
                <PhoneMockup raise={28} className="scale-[0.9] md:scale-100" ariaLabel="Match preview with 94% match">
                  <MatchingScreen />
                </PhoneMockup>
                <PhoneMockup tilt={6} className="scale-[0.82] md:scale-90" ariaLabel="Women's sports feed">
                  <FeedScreen />
                </PhoneMockup>
              </div>
            </div>
          </div>
        </div>

        {/* Marquee band */}
        <div className="mt-12 md:mt-16">
          <StatsMarquee items={MARQUEE} color="lime" />
        </div>
      </section>

      {/* ───────────────── Why Loverball ───────────────── */}
      <section className="border-b border-lb-border">
        <div className="mx-auto max-w-7xl px-4 py-20 md:py-28 lg:px-8">
          <div className="grid grid-cols-1 items-end gap-8 md:grid-cols-12">
            <div className="md:col-span-7">
              <Eyebrow color="pink">Why Loverball</Eyebrow>
              <DisplayHeading size="lg" className="mt-4 text-white">
                Built for the{" "}
                <Marker color="pink">die-hards.</Marker>
              </DisplayHeading>
            </div>
            <p className="md:col-span-5 text-base md:text-lg leading-relaxed text-lb-muted font-body">
              Other apps treat women's sports like a side quest. We don't.
              Loverball is the squad layer for the fans who already know JuJu's
              shooting form and what Candace did in '08.
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-4 md:grid-cols-2">
            <FeatureCard
              icon={<Flame size={20} />}
              accent="orange"
              title="Fandom-first matching"
              body="Your fandom fingerprint — favorite teams, hated rivals, hot takes — is the match. Sky stans go with Sky stans. Aces fans get filtered to the back."
            />
            <FeatureCard
              icon={<Users size={20} />}
              accent="pink"
              title="Squads, not strangers"
              body="Build a crew of fans you actually want to watch with. Roll five-deep into the bar for the Thorns derby. Group chat included."
            />
            <FeatureCard
              icon={<Radio size={20} />}
              accent="lime"
              title="Live every game"
              body="Reactions, hot takes, scoreboard chatter — all live, all women's sports. WNBA. NWSL. USWNT. Women's college. The full slate."
            />
            <FeatureCard
              icon={<CalendarHeart size={20} />}
              accent="pink"
              title="RSVP in two taps"
              body="Watch parties by your team, your city, your vibe. Hit RSVP. Show up. Lose your voice yelling at the ref."
            />
          </div>
        </div>
      </section>

      {/* ───────────────── CTA strip ───────────────── */}
      <section className="relative overflow-hidden bg-lb-orange">
        <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-6 px-4 py-14 md:flex-row md:items-center md:py-16 lg:px-8">
          <DisplayHeading size="md" className="text-white">
            Game day ready?
          </DisplayHeading>
          <BrandButton to="/join" variant="lime" size="lg">
            Join Loverball <ArrowRight size={16} />
          </BrandButton>
        </div>
      </section>
    </LandingLayout>
  );
};

export default Index;

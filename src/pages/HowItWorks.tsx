import { Seo } from "@/components/Seo";
import { ArrowRight, Palette, Users, MessageCircle, MapPin } from "lucide-react";
import LandingLayout from "@/components/landing/LandingLayout";
import Eyebrow from "@/components/landing/Eyebrow";
import DisplayHeading from "@/components/landing/DisplayHeading";
import Marker from "@/components/landing/Marker";
import BrandButton from "@/components/landing/BrandButton";

interface Step {
  num: string;
  title: string;
  body: string;
  accent: "lime" | "pink" | "orange";
  icon: React.ReactNode;
}

const STEPS: Step[] = [
  {
    num: "01",
    title: "Pick your colors",
    body: "Drop your teams, hated rivals, hot takes. Sky over Aces. Diana over Sue. Candace = GOAT. We build your fandom fingerprint from that — not your height or your love language.",
    accent: "lime",
    icon: <Palette size={20} />,
  },
  {
    num: "02",
    title: "Match with your people",
    body: "We surface other women's sports fans whose fingerprint actually overlaps with yours. The 94% match is real. The hot takes don't have to be polite.",
    accent: "pink",
    icon: <Users size={20} />,
  },
  {
    num: "03",
    title: "Form a squad",
    body: "Group chat with your matches. Plan the trip to LA for the Sparks. Pre-game the Liberty home opener. Send memes after a JuJu Watkins explosion.",
    accent: "orange",
    icon: <MessageCircle size={20} />,
  },
  {
    num: "04",
    title: "Show up. Lose your voice.",
    body: "RSVP to a Loverball watch party near you or host your own. Roll five-deep, scream at the ref, hug a stranger after the buzzer beater. Repeat next match day.",
    accent: "lime",
    icon: <MapPin size={20} />,
  },
];

const FAQS = [
  {
    q: "Is Loverball a dating app?",
    a: "No. Loverball is a social app for women's sports fans. We match you with fans, build squads, and run watch parties. If something else happens at the bar after Liberty wins, that's between you and the universe.",
  },
  {
    q: "Do I have to like one team?",
    a: "Nope. Most of our fans rep three or four — Chicago Sky in summer, Portland Thorns in fall, USWNT whenever, women's NCAA in March. Bring them all.",
  },
  {
    q: "What sports are on Loverball?",
    a: "Women's first, always. WNBA. NWSL. USWNT. Women's college hoops and soccer. Athletes Unlimited. Unrivaled. If it's women's sports, it's on Loverball.",
  },
  {
    q: "Can I keep my profile private?",
    a: "Yes. You control who sees what — your teams, your takes, your squads. Lock it down to friends, or go loud and public. Your call.",
  },
];

const HowItWorks = () => {
  return (
    <LandingLayout>
      <Seo
        title="How Loverball Works — From solo fan to squad goals"
        description="Four steps from solo fan to squad goals. Pick your colors, match with your people, form a squad, show up to women's sports watch parties."
        path="/how-it-works"
      />

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-lb-border">
        <div className="mx-auto max-w-7xl px-4 py-20 md:py-28 lg:px-8">
          <Eyebrow color="lime">How it works</Eyebrow>
          <DisplayHeading size="xl" className="mt-4 max-w-4xl text-white">
            Four steps from solo fan to{" "}
            <Marker color="lime">squad goals.</Marker>
          </DisplayHeading>
          <p className="mt-6 max-w-2xl text-base md:text-lg leading-relaxed text-lb-muted font-body">
            No hiking bios. No love-language filler. No bots. Loverball gets you
            into a watch party with the right people — fast.
          </p>
        </div>
      </section>

      {/* Steps */}
      <section className="border-b border-lb-border">
        <div className="mx-auto max-w-7xl px-4 py-20 md:py-24 lg:px-8">
          <ol className="space-y-12 md:space-y-16">
            {STEPS.map((step, i) => (
              <li
                key={step.num}
                className="grid grid-cols-1 gap-6 md:grid-cols-12 md:items-center"
              >
                <div className={`md:col-span-3 ${i % 2 === 1 ? "md:order-2" : ""}`}>
                  <div
                    className={`font-display text-7xl md:text-8xl leading-[0.95] text-${step.accent === "orange" ? "lb-orange" : step.accent}`}
                    style={{
                      color:
                        step.accent === "orange"
                          ? "#F04E23"
                          : step.accent === "pink"
                          ? "#E86BB0"
                          : "#E6F25A",
                    }}
                  >
                    {step.num}
                  </div>
                </div>
                <div className={`md:col-span-9 ${i % 2 === 1 ? "md:order-1" : ""}`}>
                  <div className="rounded-2xl border border-lb-border bg-lb-bg-secondary p-6 md:p-8">
                    <div className="flex items-center gap-3 text-lb-muted">
                      <span
                        className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-lb-bg-tertiary"
                        style={{
                          color:
                            step.accent === "orange"
                              ? "#F04E23"
                              : step.accent === "pink"
                              ? "#E86BB0"
                              : "#E6F25A",
                        }}
                      >
                        {step.icon}
                      </span>
                      <span className="font-condensed uppercase tracking-[0.2em] text-xs">
                        Step {step.num}
                      </span>
                    </div>
                    <h3 className="mt-4 font-condensed uppercase text-3xl md:text-4xl text-white leading-[0.95]">
                      {step.title}
                    </h3>
                    <p className="mt-3 max-w-2xl text-base leading-relaxed text-lb-muted font-body">
                      {step.body}
                    </p>
                  </div>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* FAQ */}
      <section className="border-b border-lb-border">
        <div className="mx-auto max-w-5xl px-4 py-20 md:py-24 lg:px-8">
          <Eyebrow color="pink">FAQ</Eyebrow>
          <DisplayHeading size="md" className="mt-4 text-white">
            Quick answers.
          </DisplayHeading>

          <dl className="mt-10 divide-y divide-lb-border border-y border-lb-border">
            {FAQS.map((f) => (
              <div key={f.q} className="grid grid-cols-1 gap-3 py-6 md:grid-cols-12">
                <dt className="md:col-span-5 font-condensed uppercase text-xl md:text-2xl text-white leading-[1] tracking-tight">
                  {f.q}
                </dt>
                <dd className="md:col-span-7 text-base leading-relaxed text-lb-muted font-body">
                  {f.a}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* CTA strip */}
      <section className="relative overflow-hidden bg-lime">
        <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-6 px-4 py-14 md:flex-row md:items-center md:py-16 lg:px-8">
          <DisplayHeading size="md" className="text-black">
            Stop watching alone.
          </DisplayHeading>
          <BrandButton to="/join" variant="primary" size="lg">
            Join Loverball <ArrowRight size={16} />
          </BrandButton>
        </div>
      </section>
    </LandingLayout>
  );
};

export default HowItWorks;

import { useState, FormEvent } from "react";
import { Seo } from "@/components/Seo";
import { ArrowRight, Check, Globe, Lock, Mail, Trash2 } from "lucide-react";
import LandingLayout from "@/components/landing/LandingLayout";
import Eyebrow from "@/components/landing/Eyebrow";
import DisplayHeading from "@/components/landing/DisplayHeading";
import Marker from "@/components/landing/Marker";
import BrandButton from "@/components/landing/BrandButton";

const FAQS = [
  {
    q: "Is Loverball free?",
    a: "Yes. Signup is free. The matching, the squads, the watch-party RSVPs — free. We may add premium perks later, but the core experience stays free.",
    icon: <Check size={16} />,
  },
  {
    q: "Do I need to install anything?",
    a: "Nope. Loverball runs in your mobile browser — open it on your phone and go. No installs, no extra setup. Add it to your home screen if you want one-tap access.",
    icon: <Globe size={16} />,
  },
  {
    q: "Can I delete my account?",
    a: "Whenever you want. One tap in Settings and you're out — profile, matches, squad chats, all of it.",
    icon: <Trash2 size={16} />,
  },
  {
    q: "Is Loverball safe?",
    a: "We verify accounts, moderate aggressively, and give you full control over who sees your profile and squad. Block, mute, report — instant. The bar is for women sports fans, not creeps.",
    icon: <Lock size={16} />,
  },
  {
    q: "What if my team isn't on Loverball yet?",
    a: "Add it. Every WNBA, NWSL, USWNT, women's college and pro team is in. If you rep a smaller league we haven't surfaced yet, tell us — we'll add it.",
    icon: <Mail size={16} />,
  },
];

const Join = () => {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setSubmitted(true);
  }

  return (
    <LandingLayout>
      <Seo
        title="Join Loverball — Free. Loud. Now live."
        description="Join Loverball free. We run in your mobile browser. No install, no app store. Match with women's sports fans, build squads, RSVP to watch parties."
        path="/join"
      />

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-lb-border">
        <div
          aria-hidden
          className="pointer-events-none absolute -left-12 top-10 font-display text-[28vw] leading-none text-white/[0.03] md:text-[18vw]"
        >
          JOIN
        </div>

        <div className="relative mx-auto max-w-5xl px-4 py-20 md:py-28 lg:px-8">
          <Eyebrow color="lime">Join</Eyebrow>
          <DisplayHeading size="xl" className="mt-4 text-white">
            <span className="block">Free.</span>
            <span className="block">
              <Marker color="lime">Loud.</Marker>
            </span>
            <span className="block text-lb-orange">Now live.</span>
          </DisplayHeading>

          <p className="mt-6 max-w-2xl text-base md:text-lg leading-relaxed text-lb-muted font-body">
            Loverball runs in your mobile browser. No install. No store badges.
            Just a real social platform for women's sports fans — open the link
            on your phone and you're in.
          </p>

          {/* Email signup */}
          <form
            onSubmit={handleSubmit}
            className="mt-10 flex w-full max-w-xl flex-col items-stretch gap-3 sm:flex-row"
          >
            <label className="sr-only" htmlFor="join-email">Email</label>
            <input
              id="join-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@yourteam.com"
              className="flex-1 rounded-full border border-lb-border bg-lb-bg-secondary px-5 py-4 text-sm text-white placeholder:text-lb-muted focus:outline-none focus:ring-2 focus:ring-lime/70"
              aria-label="Email address"
              disabled={submitted}
            />
            <BrandButton type="submit" size="lg" variant="primary">
              {submitted ? (
                <>
                  <Check size={16} /> You're in
                </>
              ) : (
                <>
                  Join free <ArrowRight size={16} />
                </>
              )}
            </BrandButton>
          </form>

          {submitted && (
            <p className="mt-4 max-w-xl text-sm text-lime font-condensed uppercase tracking-[0.18em]">
              ✓ You're in. We'll text you when the squad goes live in your city.
            </p>
          )}

          <div className="mt-10 flex flex-wrap items-center gap-4 text-xs uppercase tracking-[0.18em] text-lb-muted font-condensed">
            <span className="inline-flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-lime" /> Always free to join
            </span>
            <span className="inline-flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-pink" /> Mobile browser ready
            </span>
            <span className="inline-flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-lb-orange" /> Women's sports first
            </span>
          </div>
        </div>
      </section>

      {/* Launch list */}
      <section className="border-b border-lb-border">
        <div className="mx-auto max-w-7xl px-4 py-20 md:py-24 lg:px-8">
          <div className="grid grid-cols-1 items-end gap-8 md:grid-cols-12">
            <div className="md:col-span-7">
              <Eyebrow color="pink">Launch list</Eyebrow>
              <DisplayHeading size="lg" className="mt-4 text-white">
                We're rolling out{" "}
                <Marker color="pink">city by city.</Marker>
              </DisplayHeading>
            </div>
            <p className="md:col-span-5 text-base md:text-lg leading-relaxed text-lb-muted font-body">
              Chicago, New York, Portland, LA, Seattle and Atlanta are first.
              Drop your email and we'll text you when Loverball opens in your
              city — and again when the first watch party drops.
            </p>
          </div>

          <div className="mt-10 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
            {[
              { city: "Chicago", team: "Sky" },
              { city: "New York", team: "Liberty" },
              { city: "Portland", team: "Thorns" },
              { city: "Los Angeles", team: "Sparks" },
              { city: "Seattle", team: "Storm / Reign" },
              { city: "Atlanta", team: "Dream" },
            ].map((c) => (
              <div
                key={c.city}
                className="rounded-2xl border border-lb-border bg-lb-bg-secondary p-4"
              >
                <p className="font-condensed uppercase text-xl text-white leading-[0.95]">
                  {c.city}
                </p>
                <p className="mt-1 text-xs uppercase tracking-[0.18em] text-lime font-condensed">
                  {c.team}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="border-b border-lb-border">
        <div className="mx-auto max-w-5xl px-4 py-20 md:py-24 lg:px-8">
          <Eyebrow color="lime">FAQ</Eyebrow>
          <DisplayHeading size="md" className="mt-4 text-white">
            Real questions, real fast.
          </DisplayHeading>

          <dl className="mt-10 space-y-3">
            {FAQS.map((f) => (
              <div
                key={f.q}
                className="rounded-2xl border border-lb-border bg-lb-bg-secondary p-5 md:p-6"
              >
                <dt className="flex items-center gap-3 font-condensed uppercase text-lg md:text-xl text-white">
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-lb-bg-tertiary text-lime">
                    {f.icon}
                  </span>
                  {f.q}
                </dt>
                <dd className="mt-3 text-base leading-relaxed text-lb-muted font-body">
                  {f.a}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative overflow-hidden bg-lb-orange">
        <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-6 px-4 py-14 md:flex-row md:items-center md:py-16 lg:px-8">
          <DisplayHeading size="md" className="text-white">
            Get loud with us.
          </DisplayHeading>
          <BrandButton to="/join" variant="lime" size="lg">
            Sign up free <ArrowRight size={16} />
          </BrandButton>
        </div>
      </section>
    </LandingLayout>
  );
};

export default Join;

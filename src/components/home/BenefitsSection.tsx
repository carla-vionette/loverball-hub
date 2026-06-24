import { Users, MapPin, Activity } from "lucide-react";
import { C, fonts, Mono } from "./_theme";

const PILLARS = [
  {
    n: "01",
    kicker: "Meet your people",
    Icon: Users,
    title: "Meet women in LA who actually want to hang out.",
    body:
      "Go out, watch the game, become real friends. No more being the only one in your group who cares about the score.",
  },
  {
    n: "02",
    kicker: "Know where to go",
    Icon: MapPin,
    title: "Know where people are watching in LA, and where to pull up.",
    body:
      "Watch parties, fan-owned bars, and meet-ups near you — with the people, the vibe, and the broadcast already locked in.",
  },
  {
    n: "03",
    kicker: "Never miss it",
    Icon: Activity,
    title: "Real-time scores and stories from the leagues you love.",
    body:
      "WNBA, NWSL, NCAA, NBA, NFL, F1 — all of it. The full female-gaze view of sports, in one place.",
  },
];

export default function BenefitsSection() {
  return (
    <section
      className="px-5 md:px-10 py-20 md:py-28"
      style={{ background: C.cream }}
      aria-labelledby="benefits-heading"
    >
      <div className="max-w-[1400px] mx-auto">
        <div className="flex items-end justify-between gap-6 mb-12">
          <div className="max-w-2xl">
            <Mono color={C.ink}>§ — Why women join · LA beta</Mono>
            <h2
              id="benefits-heading"
              className="mt-4"
              style={{
                fontFamily: fonts.serif,
                fontWeight: 400,
                fontSize: "clamp(36px, 5.5vw, 76px)",
                lineHeight: 0.96,
                letterSpacing: "-0.03em",
                color: C.ink,
              }}
            >
              Your team, your LA,<br />
              <span style={{ fontStyle: "italic", color: C.accent }}>
                your people.
              </span>
            </h2>

          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {PILLARS.map((b, i) => (
            <article
              key={b.n}
              className="p-7 md:p-9 flex flex-col"
              style={{
                background: i === 1 ? C.ink : C.creamHi,
                color: i === 1 ? C.cream : C.ink,
                border: `1px solid ${i === 1 ? C.inkRule : C.rule}`,
                borderRadius: 20,
                minHeight: 380,
              }}
            >
              <div className="flex items-start justify-between">
                <div
                  className="inline-flex items-center justify-center"
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 14,
                    background: i === 1 ? C.accent : C.ink,
                    color: i === 1 ? "#fff" : C.accent,
                  }}
                >
                  <b.Icon size={22} strokeWidth={1.75} />
                </div>
                <span
                  style={{
                    fontFamily: fonts.display,
                    fontSize: 52,
                    lineHeight: 1,
                    color: C.accent,
                    letterSpacing: "-0.02em",
                  }}
                >
                  {b.n}
                </span>
              </div>

              <div className="mt-8">
                <span
                  style={{
                    fontFamily: fonts.sans,
                    fontSize: 12,
                    letterSpacing: "0.02em",
                    fontWeight: 600,
                    color: i === 1 ? C.inkMuted : C.creamMuted,
                  }}
                >
                  {b.kicker}
                </span>
              </div>
              <h3
                className="mt-3"
                style={{
                  fontFamily: fonts.serif,
                  fontWeight: 400,
                  fontSize: 26,
                  lineHeight: 1.15,
                  letterSpacing: "-0.015em",
                  color: i === 1 ? C.cream : C.ink,
                }}
              >
                {b.title}
              </h3>
              <p
                className="mt-4 flex-1"
                style={{
                  color: i === 1 ? C.inkMuted : C.inkSoft,
                  fontSize: 15,
                  lineHeight: 1.65,
                }}
              >
                {b.body}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

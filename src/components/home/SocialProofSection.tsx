import { C, fonts, Mono } from "./_theme";
import { HOMEPAGE_PROOF, PERSONA_TESTIMONIALS } from "./homepageConfig";

const PERSONA_COLORS = [
  "#E85D26", // coral
  "#7B5CFF", // violet
  "#1F8F6F", // pine
  "#C2185B", // raspberry
];

export default function SocialProofSection() {
  return (
    <section
      className="px-5 md:px-10 py-20 md:py-28"
      style={{ background: C.cream, color: C.ink }}
      aria-labelledby="social-proof-heading"
    >
      <div className="max-w-[1400px] mx-auto">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-12">
          <div className="max-w-2xl">
            <Mono color={C.ink}>§ — Real members. Real cities.</Mono>
            <h2
              id="social-proof-heading"
              className="mt-4"
              style={{
                fontFamily: fonts.serif,
                fontWeight: 400,
                fontSize: "clamp(34px, 5vw, 64px)",
                lineHeight: 1,
                letterSpacing: "-0.025em",
                color: C.ink,
              }}
            >
              The women already in.
            </h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {[HOMEPAGE_PROOF.fans, HOMEPAGE_PROOF.events, HOMEPAGE_PROOF.cities].map((p) => (
              <span
                key={p}
                style={{
                  fontFamily: fonts.mono,
                  fontSize: 11,
                  letterSpacing: "0.18em",
                  textTransform: "uppercase",
                  color: C.ink,
                  border: `1px solid ${C.rule}`,
                  borderRadius: 999,
                  padding: "8px 14px",
                  background: C.creamHi,
                }}
              >
                {p}
              </span>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {PERSONA_TESTIMONIALS.map((t, i) => {
            const color = PERSONA_COLORS[i % PERSONA_COLORS.length];
            return (
              // TODO: replace with real member quote
              <article
                key={t.name}
                className="p-7 md:p-9 flex flex-col"
                style={{
                  background: C.creamHi,
                  border: `1px solid ${C.rule}`,
                  borderRadius: 20,
                }}
              >
                <div className="flex items-center gap-2 mb-5">
                  <span
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: 999,
                      background: color,
                      display: "inline-block",
                    }}
                    aria-hidden
                  />
                  <Mono color={C.creamMuted} size={10}>
                    {t.persona}
                  </Mono>
                </div>
                <blockquote
                  style={{
                    fontFamily: fonts.serif,
                    fontStyle: "italic",
                    fontSize: "clamp(20px, 2.2vw, 26px)",
                    lineHeight: 1.35,
                    color: C.ink,
                  }}
                >
                  "{t.quote}"
                </blockquote>
                <div className="mt-6 pt-5 flex items-center gap-3" style={{ borderTop: `1px solid ${C.rule}` }}>
                  <div
                    aria-hidden
                    className="flex items-center justify-center shrink-0"
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 999,
                      background: color,
                      color: "#fff",
                      fontFamily: fonts.sans,
                      fontWeight: 600,
                      fontSize: 13,
                      letterSpacing: "0.04em",
                    }}
                  >
                    {t.initials}
                  </div>
                  <div className="min-w-0">
                    <div
                      style={{
                        fontFamily: fonts.sans,
                        fontSize: 14,
                        fontWeight: 600,
                        color: C.ink,
                      }}
                    >
                      {t.name}
                    </div>
                    <div
                      style={{
                        fontFamily: fonts.sans,
                        fontSize: 12,
                        color: C.creamMuted,
                      }}
                    >
                      {t.cityLine}
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

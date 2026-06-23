import { C, fonts, Mono } from "./_theme";
import { HOMEPAGE_PROOF, PERSONA_TESTIMONIALS } from "./homepageConfig";
import sparksWatch from "@/assets/sparks-watch.jpg.asset.json";
import angelCityPregame from "@/assets/angel-city-pregame.png.asset.json";
import picoHouse from "@/assets/pico-house.jpg.asset.json";

const FAN_PHOTOS = [
  { src: sparksWatch.url, alt: "Members at a Sparks watch party in Los Angeles", caption: "Sparks watch · LA" },
  { src: angelCityPregame.url, alt: "Members gathered for an Angel City pre-game brunch in LA", caption: "Angel City brunch · LA" },
  { src: picoHouse.url, alt: "Members at a Pico House event in Los Angeles", caption: "Pico House · LA" },
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
            <Mono color={C.ink}>§ — Founding members · Los Angeles</Mono>
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
              The women building this with us.
            </h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {[HOMEPAGE_PROOF.fans, HOMEPAGE_PROOF.events, HOMEPAGE_PROOF.cities].map((p) => (
              <span
                key={p}
                style={{
                  fontFamily: fonts.sans,
                  fontSize: 14,
                  letterSpacing: "-0.01em",
                  color: C.ink,
                  border: `1px solid ${C.rule}`,
                  borderRadius: 999,
                  padding: "8px 14px",
                  background: C.creamHi,
                  fontWeight: 500,
                }}
              >
                {p}
              </span>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 md:gap-4 mb-10 md:mb-14">
          {FAN_PHOTOS.map((p) => (
            <figure
              key={p.src}
              className="relative overflow-hidden"
              style={{ borderRadius: 16, border: `1px solid ${C.rule}`, aspectRatio: "3 / 4" }}
            >
              <img
                src={p.src}
                alt={p.alt}
                loading="lazy"
                decoding="async"
                className="absolute inset-0 w-full h-full object-cover"
              />
              <figcaption
                className="absolute left-3 bottom-3 px-2 py-1"
                style={{
                  fontFamily: fonts.sans,
                  fontSize: 11,
                  letterSpacing: "0.02em",
                  color: C.ink,
                  background: C.creamHi,
                  borderRadius: 999,
                }}
              >
                {p.caption}
              </figcaption>
            </figure>
          ))}
        </div>

        {PERSONA_TESTIMONIALS.length === 0 ? (
          <div
            className="p-7 md:p-9"
            style={{
              background: C.creamHi,
              border: `1px solid ${C.rule}`,
              borderRadius: 20,
            }}
          >
            <p
              style={{
                fontFamily: fonts.serif,
                fontStyle: "italic",
                fontSize: "clamp(20px, 2.2vw, 26px)",
                lineHeight: 1.35,
                color: C.ink,
              }}
            >
              We're in beta in Los Angeles. Request an invite, come to a watch
              party, and help shape the community.
            </p>
            <div className="mt-5 pt-5 flex items-center gap-3" style={{ borderTop: `1px solid ${C.rule}` }}>
              <span
                style={{
                  fontFamily: fonts.sans,
                  fontSize: 13,
                  letterSpacing: "0.02em",
                  color: C.creamMuted,
                  fontWeight: 500,
                }}
              >
                Founding member spots are limited.
              </span>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {PERSONA_TESTIMONIALS.map((t) => (
              <article
                key={t.name}
                className="p-7 md:p-9 flex flex-col"
                style={{
                  background: C.creamHi,
                  border: `1px solid ${C.rule}`,
                  borderRadius: 20,
                }}
              >
                <blockquote
                  style={{
                    fontFamily: fonts.serif,
                    fontStyle: "italic",
                    fontSize: "clamp(20px, 2.2vw, 26px)",
                    lineHeight: 1.35,
                    color: C.ink,
                  }}
                >
                  &ldquo;{t.quote}&rdquo;
                </blockquote>
                <div className="mt-6 pt-5 flex items-center gap-3" style={{ borderTop: `1px solid ${C.rule}` }}>
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
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

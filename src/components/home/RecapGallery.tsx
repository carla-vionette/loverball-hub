import { useEffect, useRef, useState } from "react";
import { C, fonts, Mono } from "./_theme";
import angelCityPregame from "@/assets/angel-city-pregame.png.asset.json";

// Branded color blocks act as recap stand-ins until real event media is uploaded.
// Per project memory: no AI-generated event photography on the marketing site.
// TODO: swap each block for real recap photo/video as members upload them.
const RECAPS = [
  {
    caption: "Sparks watch · The Goat",
    sub: "84 members, one room, two overtimes.",
    color: "linear-gradient(135deg,#E85D26 0%,#C2185B 100%)",
  },
  {
    caption: "Angel City pre-game brunch",
    sub: "Mimosas, lineups, and a new group chat.",
    image: angelCityPregame.url,
    alt: "Members gathered for an Angel City pre-game brunch",
  },
  {
    caption: "Pico House · El Pueblo VIP",
    sub: "Culture + sports + the women shaping LA.",
    color: "linear-gradient(135deg,#7B5CFF 0%,#E85D26 100%)",
  },
  {
    caption: "Watch Party · June 12",
    sub: "Past event — packed house, new crew.",
    color: "linear-gradient(135deg,#0D0D0D 0%,#E85D26 100%)",
  },

];

export default function RecapGallery() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            setVisible(true);
            io.disconnect();
            break;
          }
        }
      },
      { rootMargin: "200px 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <section
      ref={ref}
      className="px-5 md:px-10 py-20 md:py-28"
      style={{ background: C.cream }}
      aria-labelledby="recap-heading"
    >
      <div className="max-w-[1400px] mx-auto">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-12">
          <div className="max-w-2xl">
            <Mono color={C.ink}>§ — From recent events</Mono>
            <h2
              id="recap-heading"
              className="mt-4"
              style={{
                fontFamily: fonts.serif,
                fontWeight: 400,
                fontStyle: "italic",
                fontSize: "clamp(34px, 5vw, 64px)",
                lineHeight: 1,
                letterSpacing: "-0.025em",
                color: C.ink,
              }}
            >
              The receipts.
            </h2>
          </div>
          <Mono color={C.creamMuted}>Recap · Vol. 01</Mono>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {RECAPS.map((r, i) => (
            <figure
              key={r.caption}
              className="overflow-hidden"
              style={{
                borderRadius: 18,
                border: `1px solid ${C.rule}`,
                background: r.image
                  ? "#fff"
                  : visible
                  ? r.color
                  : C.creamHi,
                transition: "background 600ms ease",
              }}
            >
              {r.image ? (
                <img
                  src={r.image}
                  alt={r.alt || r.caption}
                  loading="lazy"
                  decoding="async"
                  style={{
                    aspectRatio: i % 2 === 0 ? "3/4" : "4/5",
                    width: "100%",
                    height: "auto",
                    objectFit: "cover",
                    display: "block",
                    opacity: visible ? 1 : 0,
                    transition: "opacity 600ms ease",
                  }}
                />
              ) : (
                <div
                  aria-hidden
                  style={{
                    aspectRatio: i % 2 === 0 ? "3/4" : "4/5",
                    width: "100%",
                    background: visible ? r.color : "transparent",
                  }}
                />
              )}
              <figcaption
                className="p-4"
                style={{
                  background: "#fff",
                  borderTop: `1px solid ${C.rule}`,
                }}
              >
                <div
                  style={{
                    fontFamily: fonts.serif,
                    fontStyle: "italic",
                    fontSize: 16,
                    color: C.ink,
                    lineHeight: 1.2,
                  }}
                >
                  {r.caption}
                </div>
                <div className="mt-1" style={{ fontSize: 12, color: C.creamMuted }}>
                  {r.sub}
                </div>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}

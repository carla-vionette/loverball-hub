import { MapPin, Users, MessageCircle, Camera, Tv } from "lucide-react";
import { C, fonts, Mono } from "./_theme";

// Preview-only examples. No counts, names, or quotes are real while Loverball
// is in beta; real data will replace these once the community is live.
const PREVIEW_WATCH_PARTIES = [
  { team: "Sparks vs. Liberty", venue: "The Goat · Highland Park" },
  { team: "Angel City vs. Wave", venue: "Member's living room · Eastside" },
  { team: "Lakers vs. Warriors", venue: "Hank's · Westside" },
];

const PREVIEW_CREWS = [
  { name: "Eastside Soccer Girlies", dot: "#1F8F6F" },
  { name: "WNBA Watch Club LA", dot: "#E85D26" },
  { name: "Lakers Sunday Brunch", dot: "#7B5CFF" },
];

const PREVIEW_POSTS = [
  {
    body: "Post photos, ask for a plus-one, or share the lineup. Member posts will show up here once the feed is live.",
  },
];

export default function ProductPreviewSection() {
  return (
    <section
      className="px-5 md:px-10 py-20 md:py-28"
      style={{ background: C.creamHi }}
      aria-labelledby="product-preview-heading"
    >
      <div className="max-w-[1400px] mx-auto">
        <div className="max-w-2xl mb-12">
          <Mono color={C.ink}>§ — Inside the app</Mono>
          <h2
            id="product-preview-heading"
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
            Watch parties, crews,<br />
            <span style={{ fontStyle: "italic", color: C.accent }}>and a feed that's all you.</span>
          </h2>
          <p
            className="mt-5"
            style={{ color: C.inkSoft, fontSize: 17, lineHeight: 1.6 }}
          >
            A preview of what's coming for members — find watch parties, join
            crews, and share posts from the stadium. Starting in LA.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Watch parties card — preview */}
          <article
            className="lg:col-span-7 p-7 md:p-9"
            style={{
              background: C.ink,
              color: C.cream,
              borderRadius: 20,
              border: `1px solid ${C.inkRule}`,
            }}
          >
            <div className="flex items-center gap-2 mb-6">
              <Tv size={16} color={C.accent} />
              <span
                style={{
                  fontFamily: fonts.sans,
                  fontSize: 12,
                  letterSpacing: "0.02em",
                  fontWeight: 600,
                  color: C.accent,
                }}
              >
                Watch parties — beta preview
              </span>
            </div>
            <ul className="space-y-3">
              {PREVIEW_WATCH_PARTIES.map((w) => (
                <li
                  key={w.team}
                  className="flex items-center justify-between gap-4 p-4"
                  style={{
                    background: "rgba(245,240,232,0.04)",
                    border: `1px solid ${C.inkRule}`,
                    borderRadius: 14,
                  }}
                >
                  <div className="min-w-0">
                    <div
                      style={{
                        fontFamily: fonts.serif,
                        fontStyle: "italic",
                        fontSize: 20,
                        color: C.cream,
                        lineHeight: 1.2,
                      }}
                    >
                      {w.team}
                    </div>
                    <div className="mt-1 inline-flex items-center gap-1.5" style={{ color: C.inkMuted, fontSize: 13 }}>
                      <MapPin size={12} />
                      <span className="truncate">{w.venue}</span>
                    </div>
                  </div>
                  <span
                    className="shrink-0"
                    style={{ color: C.inkMuted, fontSize: 12, fontWeight: 500 }}
                  >
                    Example
                  </span>
                </li>
              ))}
            </ul>
            <div className="mt-6 flex items-start gap-2" style={{ color: C.inkMuted }}>
              <Camera size={14} color={C.accent} className="mt-0.5 shrink-0" />
              <span style={{ fontFamily: fonts.sans, fontSize: 13, lineHeight: 1.55 }}>
                Real watch parties go live as members host them. Every member is
                a verified woman, and every event follows our community
                guidelines.
              </span>
            </div>
          </article>

          {/* Crews card — preview */}
          <aside
            className="lg:col-span-5 p-7 md:p-9 flex flex-col"
            style={{
              background: C.creamHi,
              border: `1px solid ${C.rule}`,
              borderRadius: 20,
            }}
          >
            <div className="flex items-center gap-2 mb-6">
              <Users size={16} color={C.accent} />
              <span
                style={{
                  fontFamily: fonts.sans,
                  fontSize: 12,
                  letterSpacing: "0.02em",
                  fontWeight: 600,
                  color: C.ink,
                }}
              >
                Your crews — beta preview
              </span>
            </div>
            <ul className="space-y-3 flex-1">
              {PREVIEW_CREWS.map((c) => (
                <li
                  key={c.name}
                  className="flex items-center justify-between gap-3 p-4"
                  style={{
                    background: "#fff",
                    border: `1px solid ${C.rule}`,
                    borderRadius: 14,
                  }}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span
                      aria-hidden
                      style={{ width: 10, height: 10, borderRadius: 999, background: c.dot, display: "inline-block" }}
                    />
                    <span
                      className="truncate"
                      style={{ fontFamily: fonts.sans, fontSize: 15, color: C.ink, fontWeight: 600 }}
                    >
                      {c.name}
                    </span>
                  </div>
                  <span style={{ color: C.creamMuted, fontSize: 12, fontWeight: 500 }}>Example</span>
                </li>
              ))}
            </ul>
          </aside>

          {/* Posts card — preview */}
          <article
            className="lg:col-span-12 p-7 md:p-9"
            style={{
              background: "#fff",
              border: `1px solid ${C.rule}`,
              borderRadius: 20,
            }}
          >
            <div className="flex items-center gap-2 mb-6">
              <MessageCircle size={16} color={C.accent} />
              <span
                style={{
                  fontFamily: fonts.sans,
                  fontSize: 12,
                  letterSpacing: "0.02em",
                  fontWeight: 600,
                  color: C.ink,
                }}
              >
                From the member feed — beta preview
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {PREVIEW_POSTS.map((p) => (
                <div
                  key={p.body}
                  className="p-5"
                  style={{
                    background: C.creamHi,
                    border: `1px solid ${C.rule}`,
                    borderRadius: 16,
                  }}
                >
                  <p className="mt-4" style={{ fontSize: 15, lineHeight: 1.6, color: C.inkSoft }}>
                    {p.body}
                  </p>
                </div>
              ))}
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}

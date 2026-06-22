import { MapPin, Users, MessageCircle, Camera, Tv } from "lucide-react";
import { C, fonts, Mono } from "./_theme";

// MOCK: all cards on this section are illustrative previews of product surfaces.
// Real data fetching is intentionally deferred — see homepage rebuild plan.
// TODO: wire to backend (events / watch_parties / posts / member feed)
const MOCK_WATCH_PARTIES = [
  { team: "Sparks vs. Liberty", venue: "The Goat · Highland Park", count: 14 },
  { team: "Angel City vs. Wave", venue: "Member's living room · Eastside", count: 8 },
  { team: "Lakers vs. Warriors", venue: "Hank's · Westside", count: 22 },
];

const MOCK_CREWS = [
  { name: "Eastside Soccer Girlies", count: 47, dot: "#1F8F6F" },
  { name: "WNBA Watch Club LA", count: 112, dot: "#E85D26" },
  { name: "Lakers Sunday Brunch", count: 34, dot: "#7B5CFF" },
];

const MOCK_POSTS = [
  {
    author: "Maya",
    initials: "M",
    color: "#E85D26",
    body: "Tonight: brunch + Angel City at @themavencafe. Pulled up solo, leaving with three new numbers 📲",
  },
  {
    author: "Jess",
    initials: "J",
    color: "#7B5CFF",
    body: "Hosting WNBA finals watch Sunday. BYO snacks, I'll do the bracket. DM for the address 🏀",
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
            Host a watch party in your living room. Post photos and video from the
            stadium. Join a crew built around your team. It's a real community —
            not a feed full of strangers.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Watch parties card — MOCK */}
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
                  letterSpacing: "0.04em",
                  fontWeight: 600,
                  textTransform: "uppercase",
                  color: C.accent,
                }}
              >
                Watch parties near you
              </span>
            </div>
            <ul className="space-y-3">
              {MOCK_WATCH_PARTIES.map((w) => (
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
                  <div className="shrink-0 inline-flex items-center gap-1.5" style={{ color: C.cream, fontSize: 13 }}>
                    <Users size={13} color={C.accent} />
                    {w.count} going
                  </div>
                </li>
              ))}
            </ul>
            <div className="mt-6 flex items-start gap-2" style={{ color: C.inkMuted }}>
              <Camera size={14} color={C.accent} className="mt-0.5 shrink-0" />
              <span style={{ fontFamily: fonts.sans, fontSize: 13, lineHeight: 1.55 }}>
                Members can host, post photos &amp; video, and tag friends. For verified women members with community guidelines.
              </span>
            </div>
          </article>

          {/* Crews card — MOCK */}
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
                  letterSpacing: "0.04em",
                  fontWeight: 600,
                  textTransform: "uppercase",
                  color: C.ink,
                }}
              >
                Your crews
              </span>
            </div>
            <ul className="space-y-3 flex-1">
              {MOCK_CREWS.map((c) => (
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
                  <span style={{ color: C.creamMuted, fontSize: 13 }}>{c.count}</span>
                </li>
              ))}
            </ul>
          </aside>

          {/* Posts card — MOCK */}
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
                  letterSpacing: "0.04em",
                  fontWeight: 600,
                  textTransform: "uppercase",
                  color: C.ink,
                }}
              >
                From the member feed
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {MOCK_POSTS.map((p) => (
                <div
                  key={p.author}
                  className="p-5"
                  style={{
                    background: C.creamHi,
                    border: `1px solid ${C.rule}`,
                    borderRadius: 16,
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div
                      aria-hidden
                      className="flex items-center justify-center"
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 999,
                        background: p.color,
                        color: "#fff",
                        fontFamily: fonts.sans,
                        fontWeight: 700,
                        fontSize: 14,
                      }}
                    >
                      {p.initials}
                    </div>
                    <div style={{ fontFamily: fonts.sans, fontSize: 14, color: C.ink, fontWeight: 600 }}>
                      {p.author}
                    </div>
                  </div>
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

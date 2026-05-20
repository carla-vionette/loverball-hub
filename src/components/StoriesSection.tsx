import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { C, fonts } from "@/lib/editorialTheme";

interface Story {
  id: string;
  title: string;
  source_name: string | null;
  source_url: string | null;
  image_url: string | null;
  summary: string | null;
  category: string | null;
  published_at: string | null;
}

const REACTIONS = ["🔥", "💯", "😤", "👀", "❤️"] as const;
type Reaction = (typeof REACTIONS)[number];

const CATEGORY_LABELS: Record<string, string> = {
  opinion: "HOT TAKE",
  recap: "ANALYSIS",
  preview: "ANALYSIS",
  culture: "CULTURE",
  lifestyle: "CULTURE",
  breaking: "BREAKING",
  womens_sports: "HOT TAKE",
  la_local: "LOCAL",
  national: "ANALYSIS",
  trade: "BREAKING",
};

const tagFor = (cat: string | null) =>
  CATEGORY_LABELS[(cat || "").toLowerCase()] || "STORY";

const readTime = (s: string | null, title: string) => {
  const words = ((s || "") + " " + title).trim().split(/\s+/).length;
  return `${Math.max(2, Math.round(words / 50))} min read`;
};

const STORAGE_KEY = "loverball.story.reactions.v1";
type ReactionMap = Record<string, Reaction>;

const loadReactions = (): ReactionMap => {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}"); }
  catch { return {}; }
};

const StoriesSection = () => {
  const [stories, setStories] = useState<Story[]>([]);
  const [reactions, setReactions] = useState<ReactionMap>(() => loadReactions());

  useEffect(() => {
    (async () => {
      const { data } = await (supabase as any)
        .from("news_articles")
        .select("id,title,source_name,source_url,image_url,summary,category,published_at")
        .not("image_url", "is", null)
        .order("published_at", { ascending: false, nullsFirst: false })
        .limit(4);
      setStories(((data || []) as Story[]).filter((s) => !!s.image_url));
    })();
  }, []);

  const toggle = (id: string, r: Reaction) => {
    setReactions((prev) => {
      const next = { ...prev };
      if (next[id] === r) delete next[id];
      else next[id] = r;
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch {}
      return next;
    });
  };

  if (stories.length === 0) return null;

  return (
    <section className="max-w-7xl mx-auto px-5 md:px-10 mt-20 md:mt-28">
      <div className="flex items-end justify-between mb-8 gap-4">
        <div>
          <div
            style={{
              color: C.raspberry,
              fontFamily: fonts.mono,
              fontSize: 11,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
            }}
          >
            Stories
          </div>
          <h2
            className="mt-3"
            style={{
              fontFamily: "'Oswald', Impact, sans-serif",
              fontSize: "clamp(36px, 5vw, 64px)",
              lineHeight: 0.95,
              color: C.text,
              textTransform: "uppercase",
              letterSpacing: "-0.01em",
            }}
          >
            The read.
          </h2>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-8 md:gap-10">
        {stories.map((s) => (
          <article
            key={s.id}
            className="rounded-[20px] overflow-hidden flex flex-col"
            style={{ background: C.surface, border: `1px solid ${C.border}` }}
          >
            <a
              href={s.source_url || "#"}
              target={s.source_url ? "_blank" : undefined}
              rel="noreferrer"
              className="block aspect-[16/10] overflow-hidden"
              style={{ background: C.bg }}
            >
              <img
                src={s.image_url!}
                alt={s.title}
                loading="lazy"
                className="w-full h-full object-cover transition-transform hover:scale-105"
              />
            </a>

            <div className="p-6 md:p-8 flex-1 flex flex-col">
              <span
                style={{
                  color: C.raspberry,
                  fontFamily: fonts.mono,
                  fontSize: 11,
                  letterSpacing: "0.16em",
                  textTransform: "uppercase",
                }}
              >
                {tagFor(s.category)}
              </span>

              <a
                href={s.source_url || "#"}
                target={s.source_url ? "_blank" : undefined}
                rel="noreferrer"
                className="mt-3 hover:opacity-90 transition-opacity"
              >
                <h3
                  style={{
                    fontFamily: "'Oswald', Impact, sans-serif",
                    fontSize: 26,
                    lineHeight: 1.1,
                    color: C.text,
                    fontWeight: 700,
                  }}
                  className="line-clamp-3"
                >
                  {s.title}
                </h3>
              </a>

              <div
                className="mt-4 flex items-center gap-2 text-sm"
                style={{ color: C.muted, fontFamily: fonts.sans }}
              >
                <span style={{ color: C.text }}>{s.source_name || "Loverball"}</span>
                <span>·</span>
                <span>{readTime(s.summary, s.title)}</span>
              </div>

              {/* Inline reactions */}
              <div className="mt-5 pt-5 flex items-center gap-2 flex-wrap" style={{ borderTop: `0.5px solid ${C.border}` }}>
                {REACTIONS.map((r) => {
                  const active = reactions[s.id] === r;
                  return (
                    <button
                      key={r}
                      onClick={() => toggle(s.id, r)}
                      aria-label={`React ${r}`}
                      aria-pressed={active}
                      className="inline-flex items-center justify-center transition-all"
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: 999,
                        background: active ? C.raspberry : C.bg,
                        border: `1px solid ${active ? C.raspberry : C.border}`,
                        fontSize: 18,
                        transform: active ? "scale(1.05)" : "scale(1)",
                      }}
                    >
                      {r}
                    </button>
                  );
                })}
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
};

export default StoriesSection;

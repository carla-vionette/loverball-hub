import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { C, fonts } from "@/lib/editorialTheme";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";

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

const REACTIONS = [
  { key: "fire", emoji: "🔥", label: "Hot take" },
  { key: "hundred", emoji: "💯", label: "Facts" },
  { key: "mad", emoji: "😤", label: "Mad" },
  { key: "watching", emoji: "👀", label: "Watching" },
  { key: "love", emoji: "❤️", label: "Love" },
] as const;
type ReactionKey = (typeof REACTIONS)[number]["key"];

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

type Counts = Record<string, Record<ReactionKey, number>>;
type Mine = Record<string, Set<ReactionKey>>;

const StoriesSection = () => {
  const { user } = useAuth();
  const [stories, setStories] = useState<Story[]>([]);
  const [counts, setCounts] = useState<Counts>({});
  const [mine, setMine] = useState<Mine>({});

  const loadReactions = useCallback(async (ids: string[]) => {
    if (ids.length === 0) return;
    const { data } = await (supabase as any)
      .from("story_reactions")
      .select("article_id,reaction,user_id")
      .in("article_id", ids);

    const nextCounts: Counts = {};
    const nextMine: Mine = {};
    for (const id of ids) {
      nextCounts[id] = { fire: 0, hundred: 0, mad: 0, watching: 0, love: 0 };
      nextMine[id] = new Set();
    }
    for (const row of (data || []) as Array<{ article_id: string; reaction: ReactionKey; user_id: string }>) {
      if (!nextCounts[row.article_id]) continue;
      nextCounts[row.article_id][row.reaction] = (nextCounts[row.article_id][row.reaction] || 0) + 1;
      if (user && row.user_id === user.id) nextMine[row.article_id].add(row.reaction);
    }
    setCounts(nextCounts);
    setMine(nextMine);
  }, [user]);

  useEffect(() => {
    (async () => {
      const { data } = await (supabase as any)
        .from("news_articles")
        .select("id,title,source_name,source_url,image_url,summary,category,published_at")
        .not("image_url", "is", null)
        .order("published_at", { ascending: false, nullsFirst: false })
        .limit(4);
      const list = ((data || []) as Story[]).filter((s) => !!s.image_url);
      setStories(list);
      loadReactions(list.map((s) => s.id));
    })();
  }, [loadReactions]);

  const toggle = async (articleId: string, reaction: ReactionKey) => {
    if (!user) {
      toast({ title: "Sign in to react", description: "Members only — log in to drop a reaction." });
      return;
    }
    const has = mine[articleId]?.has(reaction);

    // Optimistic update
    setMine((prev) => {
      const next = { ...prev };
      const set = new Set(next[articleId] || []);
      if (has) set.delete(reaction); else set.add(reaction);
      next[articleId] = set;
      return next;
    });
    setCounts((prev) => {
      const next = { ...prev };
      const row = { ...(next[articleId] || ({} as Record<ReactionKey, number>)) };
      row[reaction] = Math.max(0, (row[reaction] || 0) + (has ? -1 : 1));
      next[articleId] = row;
      return next;
    });

    const sb = supabase as any;
    if (has) {
      await sb.from("story_reactions").delete()
        .eq("article_id", articleId).eq("user_id", user.id).eq("reaction", reaction);
    } else {
      const { error } = await sb.from("story_reactions").insert({
        article_id: articleId, user_id: user.id, reaction,
      });
      if (error && !String(error.message).includes("duplicate")) {
        // rollback
        setMine((prev) => {
          const next = { ...prev };
          const set = new Set(next[articleId] || []);
          set.delete(reaction);
          next[articleId] = set;
          return next;
        });
        setCounts((prev) => {
          const next = { ...prev };
          const row = { ...(next[articleId] || ({} as Record<ReactionKey, number>)) };
          row[reaction] = Math.max(0, (row[reaction] || 1) - 1);
          next[articleId] = row;
          return next;
        });
      }
    }
  };

  if (stories.length === 0) return null;

  return (
    <section className="max-w-7xl mx-auto px-5 md:px-10 mt-20 md:mt-28">
      <div className="flex items-end justify-between mb-8 gap-4">
        <div>
          <div style={{ color: C.raspberry, fontFamily: fonts.mono, fontSize: 11, letterSpacing: "0.18em", textTransform: "uppercase" }}>
            Stories
          </div>
          <h2 className="mt-3" style={{ fontFamily: "'Anton', Impact, sans-serif", fontSize: "clamp(36px, 5vw, 64px)", lineHeight: 0.95, color: C.text, textTransform: "uppercase", letterSpacing: "-0.01em" }}>
            The read.
          </h2>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-8 md:gap-10">
        {stories.map((s) => (
          <article key={s.id} className="rounded-[20px] overflow-hidden flex flex-col" style={{ background: C.surface, border: `1px solid ${C.border}` }}>
            <a href={s.source_url || "#"} target={s.source_url ? "_blank" : undefined} rel="noreferrer" className="block aspect-[16/10] overflow-hidden" style={{ background: C.bg }}>
              <img src={s.image_url!} alt={s.title} loading="lazy" className="w-full h-full object-cover transition-transform hover:scale-105" />
            </a>

            <div className="p-6 md:p-8 flex-1 flex flex-col">
              <span style={{ color: C.raspberry, fontFamily: fonts.mono, fontSize: 11, letterSpacing: "0.16em", textTransform: "uppercase" }}>
                {tagFor(s.category)}
              </span>

              <a href={s.source_url || "#"} target={s.source_url ? "_blank" : undefined} rel="noreferrer" className="mt-3 hover:opacity-90 transition-opacity">
                <h3 className="line-clamp-3" style={{ fontFamily: "'Anton', Impact, sans-serif", fontSize: 26, lineHeight: 1.1, color: C.text, fontWeight: 700 }}>
                  {s.title}
                </h3>
              </a>

              <div className="mt-4 flex items-center gap-2 text-sm" style={{ color: C.muted, fontFamily: fonts.sans }}>
                <span style={{ color: C.text }}>{s.source_name || "Loverball"}</span>
                <span>·</span>
                <span>{readTime(s.summary, s.title)}</span>
              </div>

              {/* Inline reactions */}
              <div className="mt-5 pt-5 flex items-center gap-2 flex-wrap" style={{ borderTop: `0.5px solid ${C.border}` }}>
                {REACTIONS.map(({ key, emoji, label }) => {
                  const active = mine[s.id]?.has(key);
                  const count = counts[s.id]?.[key] || 0;
                  return (
                    <button
                      key={key}
                      onClick={() => toggle(s.id, key)}
                      aria-label={`${label}${count ? ` (${count})` : ""}`}
                      aria-pressed={active}
                      className="inline-flex items-center gap-1.5 transition-all"
                      style={{
                        minHeight: 36,
                        padding: "6px 12px",
                        borderRadius: 999,
                        background: active ? C.raspberry : C.bg,
                        color: active ? "#fff" : C.text,
                        border: `1px solid ${active ? C.raspberry : C.border}`,
                        fontFamily: fonts.mono,
                        fontSize: 12,
                        letterSpacing: "0.04em",
                        textTransform: "uppercase",
                      }}
                    >
                      <span style={{ fontSize: 15 }}>{emoji}</span>
                      <span>{label}</span>
                      {count > 0 && (
                        <span style={{ opacity: active ? 0.9 : 0.6, marginLeft: 2 }}>
                          {count}
                        </span>
                      )}
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

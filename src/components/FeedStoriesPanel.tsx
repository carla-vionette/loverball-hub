import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
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
  opinion: "HOT TAKE", recap: "ANALYSIS", preview: "ANALYSIS",
  culture: "CULTURE", lifestyle: "CULTURE", breaking: "BREAKING",
  womens_sports: "HOT TAKE", la_local: "LOCAL", national: "ANALYSIS", trade: "BREAKING",
};
const tagFor = (cat: string | null) =>
  CATEGORY_LABELS[(cat || "").toLowerCase()] || "STORY";

const readTime = (s: string | null, title: string) => {
  const words = ((s || "") + " " + title).trim().split(/\s+/).length;
  return `${Math.max(2, Math.round(words / 50))} min read`;
};

type Counts = Record<string, Record<ReactionKey, number>>;
type Mine = Record<string, Set<ReactionKey>>;

const FeedStoriesPanel = () => {
  const { user } = useAuth();
  const [stories, setStories] = useState<Story[]>([]);
  const [counts, setCounts] = useState<Counts>({});
  const [mine, setMine] = useState<Mine>({});
  const [loading, setLoading] = useState(true);

  const loadReactions = useCallback(async (ids: string[]) => {
    if (ids.length === 0) return;
    const { data } = await (supabase as any)
      .from("story_reactions")
      .select("article_id,reaction,user_id")
      .in("article_id", ids);
    const nC: Counts = {}; const nM: Mine = {};
    ids.forEach((id) => { nC[id] = { fire: 0, hundred: 0, mad: 0, watching: 0, love: 0 }; nM[id] = new Set(); });
    for (const r of (data || []) as Array<{ article_id: string; reaction: ReactionKey; user_id: string }>) {
      if (!nC[r.article_id]) continue;
      nC[r.article_id][r.reaction] = (nC[r.article_id][r.reaction] || 0) + 1;
      if (user && r.user_id === user.id) nM[r.article_id].add(r.reaction);
    }
    setCounts(nC); setMine(nM);
  }, [user]);

  useEffect(() => {
    (async () => {
      const { data } = await (supabase as any)
        .from("news_articles")
        .select("id,title,source_name,source_url,image_url,summary,category,published_at")
        .not("image_url", "is", null)
        .order("published_at", { ascending: false, nullsFirst: false })
        .limit(20);
      const list = ((data || []) as Story[]).filter((s) => !!s.image_url);
      setStories(list);
      setLoading(false);
      loadReactions(list.map((s) => s.id));
    })();
  }, [loadReactions]);

  const toggle = async (articleId: string, reaction: ReactionKey) => {
    if (!user) {
      toast({ title: "Sign in to react", description: "Members only — log in to drop a reaction." });
      return;
    }
    const has = mine[articleId]?.has(reaction);
    setMine((p) => { const n = { ...p }; const s = new Set(n[articleId] || []); has ? s.delete(reaction) : s.add(reaction); n[articleId] = s; return n; });
    setCounts((p) => { const n = { ...p }; const r = { ...(n[articleId] || ({} as Record<ReactionKey, number>)) }; r[reaction] = Math.max(0, (r[reaction] || 0) + (has ? -1 : 1)); n[articleId] = r; return n; });

    const sb = supabase as any;
    if (has) {
      await sb.from("story_reactions").delete().eq("article_id", articleId).eq("user_id", user.id).eq("reaction", reaction);
    } else {
      await sb.from("story_reactions").insert({ article_id: articleId, user_id: user.id, reaction });
    }
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-white/20 border-t-[#E85D2F] rounded-full animate-spin" />
      </div>
    );
  }

  if (stories.length === 0) {
    return (
      <div className="h-full flex items-center justify-center px-6 text-center">
        <p className="text-white/60 text-sm max-w-xs">No stories yet. Check back soon.</p>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto scrollbar-hide pt-32 pb-28 px-4 md:px-8">
      <div className="max-w-3xl mx-auto space-y-6">
        {stories.map((s) => (
          <article
            key={s.id}
            className="rounded-[20px] overflow-hidden"
            style={{ background: "rgba(20,20,21,0.7)", border: "1px solid rgba(255,255,255,0.08)" }}
          >
            <a
              href={s.source_url || "#"}
              target={s.source_url ? "_blank" : undefined}
              rel="noreferrer"
              className="block aspect-[16/10] overflow-hidden bg-black"
            >
              <img src={s.image_url!} alt={s.title} loading="lazy" className="w-full h-full object-cover" />
            </a>
            <div className="p-5 md:p-6">
              <span style={{ color: "#E85D2F", fontFamily: "'Space Mono', monospace", fontSize: 10, letterSpacing: "0.18em", textTransform: "uppercase" }}>
                {tagFor(s.category)}
              </span>
              <a href={s.source_url || "#"} target={s.source_url ? "_blank" : undefined} rel="noreferrer">
                <h3 className="mt-2 line-clamp-3" style={{ fontFamily: "'Oswald', Impact, sans-serif", fontSize: 22, lineHeight: 1.15, color: "#fff", fontWeight: 700 }}>
                  {s.title}
                </h3>
              </a>
              <div className="mt-3 flex items-center gap-2 text-xs" style={{ color: "rgba(255,255,255,0.55)" }}>
                <span style={{ color: "rgba(255,255,255,0.85)" }}>{s.source_name || "Loverball"}</span>
                <span>·</span>
                <span>{readTime(s.summary, s.title)}</span>
              </div>

              <div className="mt-4 pt-4 flex items-center gap-2 flex-wrap" style={{ borderTop: "0.5px solid rgba(255,255,255,0.08)" }}>
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
                        minHeight: 36, padding: "6px 11px", borderRadius: 999,
                        background: active ? "#E85D2F" : "rgba(255,255,255,0.06)",
                        color: active ? "#fff" : "rgba(255,255,255,0.85)",
                        border: `1px solid ${active ? "#E85D2F" : "rgba(255,255,255,0.1)"}`,
                        fontFamily: "'Space Mono', monospace", fontSize: 11,
                        letterSpacing: "0.04em", textTransform: "uppercase",
                      }}
                    >
                      <span style={{ fontSize: 14 }}>{emoji}</span>
                      <span>{label}</span>
                      {count > 0 && <span style={{ opacity: active ? 0.9 : 0.6, marginLeft: 2 }}>{count}</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
};

export default FeedStoriesPanel;

import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Sparkles } from "lucide-react";
import { motion } from "framer-motion";

interface CuratedItem {
  id: string;
  title: string;
  body: string | null;
  image_url: string | null;
  sport: string | null;
  team_tag: string | null;
  content_type: string;
}

const SPORT_EMOJIS: Record<string, string> = {
  basketball: "🏀",
  soccer: "⚽",
  football: "🏈",
  tennis: "🎾",
  hockey: "🏒",
  baseball: "⚾",
  f1: "🏎️",
};

const TodaysHighlightCard = ({ userTeams }: { userTeams: string[] }) => {
  const [highlight, setHighlight] = useState<CuratedItem | null>(null);

  useEffect(() => {
    const today = new Date().toISOString().split("T")[0];
    supabase
      .from("curated_content" as any)
      .select("*")
      .eq("content_type", "highlight")
      .eq("date", today)
      .order("created_at", { ascending: false })
      .limit(5)
      .then(({ data }) => {
        if (!data || data.length === 0) return;
        // Prioritize team-matched content
        const items = data as any[];
        const matched = items.find(
          (item: any) => item.team_tag && userTeams.some((t) => t.toLowerCase().includes(item.team_tag?.toLowerCase()))
        );
        setHighlight(matched || items[0]);
      });
  }, [userTeams]);

  if (!highlight) return null;

  const emoji = SPORT_EMOJIS[highlight.sport?.toLowerCase() || ""] || "🏅";

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
      className="relative rounded-2xl overflow-hidden"
    >
      {/* Gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary/80 to-accent" />
      {highlight.image_url && (
        <div
          className="absolute inset-0 bg-cover bg-center opacity-20"
          style={{ backgroundImage: `url(${highlight.image_url})` }}
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />

      <div className="relative z-10 p-5 min-h-[160px] flex flex-col justify-end">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="w-4 h-4 text-white/80" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-white/70">
            Today's Highlight
          </span>
        </div>
        <h3 className="text-lg font-display font-bold text-white leading-tight">
          {emoji} {highlight.title}
        </h3>
        {highlight.body && (
          <p className="text-sm text-white/80 mt-1.5 line-clamp-2 leading-relaxed">
            {highlight.body}
          </p>
        )}
        {highlight.team_tag && (
          <span className="mt-2 inline-flex items-center gap-1 text-[10px] font-semibold bg-white/20 text-white rounded-full px-2.5 py-0.5 w-fit backdrop-blur-sm">
            {emoji} {highlight.team_tag}
          </span>
        )}
      </div>
    </motion.div>
  );
};

export default TodaysHighlightCard;

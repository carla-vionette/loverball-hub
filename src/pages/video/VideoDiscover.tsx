import { useState } from "react";
import { motion } from "framer-motion";
import { Compass, Users } from "lucide-react";
import { MOCK_CHANNELS } from "@/lib/mockVideoData";

const stagger = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};
const item = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } };

const formatSubs = (n: number) => {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return String(n);
};

const VideoDiscover = () => {
  const [search, setSearch] = useState("");

  const filtered = MOCK_CHANNELS.filter(
    (ch) =>
      ch.name.toLowerCase().includes(search.toLowerCase()) ||
      ch.sportFocus.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen pb-20 md:pb-6">
      <header className="sticky top-0 z-40 bg-background/90 backdrop-blur-md px-4 py-3 md:px-8 md:py-4 border-b border-border/20">
        <div className="flex items-center gap-2 mb-3">
          <Compass className="w-5 h-5 text-primary" />
          <h1 className="text-lg font-bold tracking-tight">Discover Channels</h1>
        </div>
        <input
          type="text"
          placeholder="Search channels..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-secondary rounded-lg px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-primary"
        />
      </header>

      <motion.div
        variants={stagger}
        initial="hidden"
        animate="show"
        className="px-4 md:px-8 py-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
      >
        {filtered.map((channel) => (
          <motion.div
            key={channel.id}
            variants={item}
            whileHover={{ scale: 1.02 }}
            className="bg-card rounded-xl p-5 border border-border/30 hover:border-primary/30 transition-colors cursor-pointer"
          >
            <div className="flex items-start gap-4">
              <img
                src={channel.avatar}
                alt={channel.name}
                className="w-14 h-14 rounded-full object-cover flex-shrink-0"
              />
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-bold text-foreground truncate">{channel.name}</h3>
                <p className="text-xs text-primary mt-0.5">{channel.sportFocus}</p>
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{channel.description}</p>
                <div className="flex items-center gap-3 mt-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    {formatSubs(channel.subscribers)} subscribers
                  </span>
                  <span>{channel.videoCount} videos</span>
                </div>
              </div>
            </div>
            <button className="mt-4 w-full py-2 bg-primary text-primary-foreground text-xs font-bold rounded-lg hover:bg-primary/90 transition-colors">
              Subscribe
            </button>
          </motion.div>
        ))}
      </motion.div>

      {filtered.length === 0 && (
        <div className="text-center py-20 text-muted-foreground">
          <Compass className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p className="text-sm">No channels found</p>
        </div>
      )}
    </div>
  );
};

export default VideoDiscover;

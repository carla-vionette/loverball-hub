import { motion } from "framer-motion";
import { User, Settings, Film, Heart, Clock, ChevronRight } from "lucide-react";
import VideoCard from "@/components/video/VideoCard";
import { MOCK_VIDEOS } from "@/lib/mockVideoData";

const stats = [
  { label: "Videos", value: "0" },
  { label: "Subscribers", value: "0" },
  { label: "Watch Time", value: "0h" },
];

const menuItems = [
  { icon: Film, label: "My Videos", count: 0 },
  { icon: Heart, label: "Liked Videos", count: MOCK_VIDEOS.length },
  { icon: Clock, label: "Watch History", count: 12 },
];

const VideoProfile = () => {
  return (
    <div className="min-h-screen pb-20 md:pb-6">
      <header className="sticky top-0 z-40 bg-background/90 backdrop-blur-md px-4 py-3 md:px-8 md:py-4 border-b border-border/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <User className="w-5 h-5 text-primary" />
            <h1 className="text-lg font-bold tracking-tight">Profile</h1>
          </div>
          <Settings className="w-5 h-5 text-muted-foreground cursor-pointer hover:text-foreground transition-colors" />
        </div>
      </header>

      <div className="px-4 md:px-8 py-6 space-y-6">
        {/* Profile card */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card rounded-xl p-6 border border-border/30"
        >
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center">
              <User className="w-8 h-8 text-muted-foreground" />
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground">Creator Profile</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Set up your channel to start uploading</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 mt-5 pt-5 border-t border-border/30">
            {stats.map((s) => (
              <div key={s.label} className="text-center">
                <p className="text-lg font-bold text-foreground">{s.value}</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{s.label}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Menu */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-card rounded-xl border border-border/30 divide-y divide-border/30"
        >
          {menuItems.map((m) => (
            <button
              key={m.label}
              className="w-full flex items-center gap-4 px-5 py-4 hover:bg-secondary/50 transition-colors"
            >
              <m.icon className="w-5 h-5 text-muted-foreground" />
              <span className="flex-1 text-sm text-foreground text-left">{m.label}</span>
              <span className="text-xs text-muted-foreground mr-2">{m.count}</span>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </button>
          ))}
        </motion.div>

        {/* Liked videos preview */}
        <div>
          <h3 className="text-sm font-bold text-foreground mb-3">Liked Videos</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {MOCK_VIDEOS.slice(0, 6).map((v) => (
              <VideoCard key={v.id} {...v} layout="grid" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoProfile;

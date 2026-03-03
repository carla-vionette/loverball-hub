import { useParams } from "react-router-dom";
import { CheckCircle, Users, Play, Eye, ArrowLeft } from "lucide-react";
import { useState } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import BottomNav from "@/components/BottomNav";
import DesktopNav from "@/components/DesktopNav";
import MobileHeader from "@/components/MobileHeader";

const CHANNELS: Record<string, { name: string; category: string; followers: string; description: string }> = {
  CourtSideQueens: { name: "CourtSide Queens", category: "Basketball", followers: "51.3K", description: "Courtside perspectives on women's basketball" },
  WNBAHighlights: { name: "WNBA Highlights", category: "WNBA", followers: "45.2K", description: "Daily WNBA highlights and analysis" },
  GameDayGirls: { name: "Game Day Girls", category: "Lifestyle", followers: "41.2K", description: "Game day fashion, food & culture" },
  FitFemmes: { name: "Fit Femmes", category: "Fitness", followers: "38.7K", description: "Sports fitness and training content" },
  SoccerSisters: { name: "Soccer Sisters", category: "Soccer", followers: "32.1K", description: "Women's soccer coverage worldwide" },
  LoverballOriginals: { name: "Loverball Originals", category: "Culture", followers: "28.5K", description: "Original content from the Loverball team" },
  OlympicDreams: { name: "Olympic Dreams", category: "Culture", followers: "27.9K", description: "Road to LA28 and beyond" },
  NWSLWatch: { name: "NWSL Watch", category: "Soccer", followers: "22.4K", description: "All things NWSL" },
  TitleIXToday: { name: "Title IX Today", category: "Culture", followers: "19.8K", description: "Covering the evolution of women in sports" },
  ServeAndVolley: { name: "Serve & Volley", category: "Tennis", followers: "15.6K", description: "WTA and women's tennis coverage" },
};

const AVATAR_COLORS: Record<string, string> = {
  Basketball: "bg-orange-500", Soccer: "bg-emerald-500", WNBA: "bg-purple-500",
  Tennis: "bg-yellow-500", Culture: "bg-pink-500", Lifestyle: "bg-sky-500", Fitness: "bg-red-500",
};

const PLACEHOLDER_VIDEOS = [
  { title: "Top 10 Plays This Week", views: "34K", color: "from-purple-700 to-pink-500" },
  { title: "Behind the Scenes", views: "21K", color: "from-sky-700 to-blue-500" },
  { title: "Game Recap Highlights", views: "47K", color: "from-orange-700 to-amber-500" },
  { title: "Pregame Routine", views: "18K", color: "from-emerald-700 to-teal-500" },
  { title: "Fan Reactions", views: "29K", color: "from-pink-700 to-rose-500" },
  { title: "Locker Room Talk", views: "15K", color: "from-violet-700 to-indigo-500" },
  { title: "Match Day Vlog", views: "38K", color: "from-red-700 to-orange-500" },
  { title: "Skills & Drills", views: "22K", color: "from-teal-700 to-cyan-500" },
  { title: "Season Preview", views: "41K", color: "from-amber-700 to-yellow-500" },
];

const ChannelProfile = () => {
  const { handle } = useParams<{ handle: string }>();
  const [following, setFollowing] = useState(false);
  const channel = handle ? CHANNELS[handle] : null;

  if (!channel) {
    return (
      <div className="min-h-screen bg-background">
        <MobileHeader /><DesktopNav /><BottomNav />
        <main className="md:ml-64 pt-16 md:pt-0 pb-24 flex items-center justify-center min-h-[60vh]">
          <p className="text-muted-foreground">Channel not found</p>
        </main>
      </div>
    );
  }

  const initials = channel.name.split(" ").map(w => w[0]).join("").slice(0, 2);

  return (
    <div className="min-h-screen bg-background">
      <MobileHeader />
      <DesktopNav />
      <BottomNav />

      <main className="md:ml-64 pt-16 md:pt-0 pb-24 md:pb-0">
        <div className="max-w-3xl mx-auto px-5 md:px-10 py-6">
          {/* Back */}
          <Button variant="ghost" className="gap-2 mb-4 -ml-2 text-muted-foreground hover:text-foreground" onClick={() => window.history.back()}>
            <ArrowLeft className="w-4 h-4" /> Back
          </Button>

          {/* Channel Header */}
          <div className="flex flex-col items-center text-center gap-4 mb-8">
            <Avatar className="w-24 h-24">
              <AvatarFallback className={`${AVATAR_COLORS[channel.category] || "bg-primary"} text-white font-bold text-2xl`}>
                {initials}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center justify-center gap-1.5 mb-1">
                <h1 className="font-condensed text-2xl font-bold uppercase tracking-wide">{channel.name}</h1>
                <CheckCircle className="w-5 h-5 text-primary" />
              </div>
              <p className="text-sm text-muted-foreground mb-2">@{handle}</p>
              <div className="flex items-center justify-center gap-3 mb-3">
                <Badge className="bg-primary/10 text-primary text-xs font-bold border-0 rounded-full">{channel.category}</Badge>
                <span className="text-sm text-muted-foreground flex items-center gap-1">
                  <Users className="w-3.5 h-3.5" /> {channel.followers} followers
                </span>
              </div>
              <p className="text-sm text-muted-foreground max-w-md">{channel.description}</p>
            </div>
            <Button
              onClick={() => setFollowing(!following)}
              className={`rounded-full px-8 ${
                following
                  ? "bg-secondary text-muted-foreground border border-border/50 hover:bg-destructive/10 hover:text-destructive"
                  : "bg-primary text-primary-foreground hover:bg-primary/90"
              }`}
            >
              {following ? "Following" : "+ Follow"}
            </Button>
          </div>

          {/* Videos Grid */}
          <h2 className="font-condensed text-lg font-bold uppercase tracking-wide mb-4">Videos</h2>
          <div className="grid grid-cols-3 gap-2">
            {PLACEHOLDER_VIDEOS.map(video => (
              <div key={video.title} className="cursor-pointer group">
                <div className={`relative w-full aspect-[9/16] rounded-xl overflow-hidden bg-gradient-to-br ${video.color}`}>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-10 h-10 rounded-full bg-background/30 backdrop-blur-sm flex items-center justify-center group-hover:bg-background/50 transition-colors">
                      <Play className="w-4 h-4 text-white ml-0.5" fill="currentColor" />
                    </div>
                  </div>
                  <div className="absolute bottom-2 left-2">
                    <span className="text-[10px] text-white/80 font-medium flex items-center gap-1">
                      <Eye className="w-3 h-3" /> {video.views}
                    </span>
                  </div>
                </div>
                <p className="text-[11px] font-semibold text-foreground mt-1.5 leading-tight line-clamp-2">{video.title}</p>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

export default ChannelProfile;

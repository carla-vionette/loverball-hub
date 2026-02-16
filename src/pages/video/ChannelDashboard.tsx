import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Upload, Video, Settings, Users, BarChart3, Play,
  Eye, Heart, TrendingUp, Calendar, Clock, Edit3,
  Film, Plus, ChevronRight, ArrowLeft, Globe,
  CheckCircle, AlertCircle, Loader2,
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import loverbballLogo from "@/assets/loverball-script-logo.png";

// ─── Types ──────────────────────────────────────────────
interface ChannelData {
  id: string;
  channel_name: string;
  slug: string;
  description: string | null;
  avatar_url: string | null;
  banner_url: string | null;
  sport_focus: string | null;
  status: string;
  channel_type: string;
  follower_count: number;
  total_views: number;
  verified: boolean;
  created_at: string;
}

interface DashboardTab {
  id: string;
  label: string;
  icon: typeof BarChart3;
}

const TABS: DashboardTab[] = [
  { id: "overview", label: "Overview", icon: BarChart3 },
  { id: "videos", label: "Videos", icon: Film },
  { id: "settings", label: "Settings", icon: Settings },
];

// Mock analytics data
const MOCK_ANALYTICS = {
  totalViews: 152_400,
  totalLikes: 8_320,
  totalFollowers: 1_240,
  avgWatchTime: "4:32",
  viewsGrowth: 12.5,
  followersGrowth: 8.3,
  topVideos: [
    { title: "Best Moments from the Season", views: 45_200, likes: 3_100, date: "2 days ago" },
    { title: "Training Day Behind the Scenes", views: 28_400, likes: 2_100, date: "1 week ago" },
    { title: "Top 10 Plays of the Week", views: 19_800, likes: 1_400, date: "2 weeks ago" },
    { title: "Pregame Warmup Routine", views: 12_600, likes: 890, date: "3 weeks ago" },
  ],
  recentPerformance: [
    { day: "Mon", views: 1200 },
    { day: "Tue", views: 1800 },
    { day: "Wed", views: 1400 },
    { day: "Thu", views: 2200 },
    { day: "Fri", views: 3100 },
    { day: "Sat", views: 2800 },
    { day: "Sun", views: 2400 },
  ],
};

const formatNum = (n: number) => {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
};

// ─── Stat Card ──────────────────────────────────────────
const StatCard = ({ icon: Icon, label, value, growth }: { icon: typeof Eye; label: string; value: string; growth?: number }) => (
  <div className="bg-card border border-border/30 rounded-xl p-4">
    <div className="flex items-center gap-2 mb-2">
      <Icon className="w-4 h-4 text-muted-foreground" />
      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{label}</span>
    </div>
    <p className="text-2xl font-bold text-foreground">{value}</p>
    {growth !== undefined && (
      <p className={`text-[11px] font-medium mt-1 ${growth >= 0 ? "text-primary" : "text-destructive"}`}>
        <TrendingUp className="w-3 h-3 inline mr-0.5" />
        {growth >= 0 ? "+" : ""}{growth}% this week
      </p>
    )}
  </div>
);

// ─── Mini Chart (bar) ───────────────────────────────────
const MiniChart = ({ data }: { data: { day: string; views: number }[] }) => {
  const max = Math.max(...data.map((d) => d.views));
  return (
    <div className="flex items-end gap-2 h-24">
      {data.map((d) => (
        <div key={d.day} className="flex-1 flex flex-col items-center gap-1">
          <div
            className="w-full bg-primary/80 rounded-t-md transition-all hover:bg-primary"
            style={{ height: `${(d.views / max) * 100}%`, minHeight: 4 }}
          />
          <span className="text-[9px] text-muted-foreground">{d.day}</span>
        </div>
      ))}
    </div>
  );
};

// ─── Main Component ─────────────────────────────────────
const ChannelDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [channels, setChannels] = useState<ChannelData[]>([]);
  const [selectedChannel, setSelectedChannel] = useState<ChannelData | null>(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetchChannels = async () => {
      const { data, error } = await supabase
        .from("creator_channels")
        .select("id, channel_name, slug, description, avatar_url, banner_url, sport_focus, status, channel_type, follower_count, total_views, verified, created_at")
        .eq("owner_user_id", user.id);

      if (!error && data) {
        setChannels(data as unknown as ChannelData[]);
        if (data.length > 0) setSelectedChannel(data[0] as unknown as ChannelData);
      }
      setLoading(false);
    };
    fetchChannels();
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // No channels yet
  if (channels.length === 0) {
    return (
      <div className="min-h-screen pb-20 md:pb-6">
        <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-md px-4 py-3 md:px-8 md:py-4 border-b border-border/20">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="text-muted-foreground hover:text-foreground">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-lg font-bold tracking-tight">My Channels</h1>
          </div>
        </header>
        <div className="px-4 md:px-8 py-16 text-center max-w-md mx-auto">
          <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
            <Film className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-xl font-bold text-foreground mb-2">No channels yet</h2>
          <p className="text-sm text-muted-foreground mb-8">Create your first channel to start uploading content and building your audience.</p>
          <button
            onClick={() => navigate("/watch/channel/create")}
            className="bg-primary text-primary-foreground px-8 py-3 rounded-xl text-sm font-bold hover:bg-primary/90 transition-colors inline-flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Create Channel
          </button>
        </div>
      </div>
    );
  }

  const ch = selectedChannel!;
  const isPending = ch.status === "pending_review";

  return (
    <div className="min-h-screen pb-20 md:pb-6">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-md border-b border-border/20">
        <div className="px-4 md:px-8 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button onClick={() => navigate(-1)} className="text-muted-foreground hover:text-foreground">
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg overflow-hidden bg-secondary">
                  <img src={ch.avatar_url || loverbballLogo} alt="" className="w-full h-full object-cover" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h1 className="text-sm font-bold">{ch.channel_name}</h1>
                    {ch.verified && <CheckCircle className="w-3.5 h-3.5 text-primary" />}
                  </div>
                  <p className="text-[10px] text-muted-foreground">@{ch.slug}</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigate("/watch/upload")}
                className="px-4 py-2 bg-primary text-primary-foreground text-xs font-bold rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-1.5"
              >
                <Upload className="w-3.5 h-3.5" /> Upload
              </button>
            </div>
          </div>
        </div>

        {/* Channel selector (if multiple) */}
        {channels.length > 1 && (
          <div className="px-4 md:px-8 pb-2 flex gap-2 overflow-x-auto scrollbar-hide">
            {channels.map((c) => (
              <button
                key={c.id}
                onClick={() => { setSelectedChannel(c); setActiveTab("overview"); }}
                className={`flex-shrink-0 flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  selectedChannel?.id === c.id
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-muted-foreground hover:text-foreground"
                }`}
              >
                <div className="w-4 h-4 rounded-full overflow-hidden bg-background">
                  <img src={c.avatar_url || loverbballLogo} alt="" className="w-full h-full object-cover" />
                </div>
                {c.channel_name}
              </button>
            ))}
          </div>
        )}

        {/* Tabs */}
        <div className="px-4 md:px-8 flex gap-1">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold transition-all border-b-2 ${
                  activeTab === tab.id
                    ? "text-primary border-primary"
                    : "text-muted-foreground border-transparent hover:text-foreground"
                }`}
              >
                <Icon className="w-3.5 h-3.5" /> {tab.label}
              </button>
            );
          })}
        </div>
      </header>

      <div className="px-4 md:px-8 py-6 max-w-5xl mx-auto">
        {/* Status banner */}
        {isPending && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-primary/5 border border-primary/20 rounded-xl p-4 mb-6 flex items-start gap-3"
          >
            <AlertCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-foreground">Channel under review</p>
              <p className="text-xs text-muted-foreground">Your channel is pending admin approval. You can start setting up content while you wait.</p>
            </div>
          </motion.div>
        )}

        {/* ─── OVERVIEW TAB ──────────────────────────── */}
        {activeTab === "overview" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            {/* Stats grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <StatCard icon={Eye} label="Total Views" value={formatNum(MOCK_ANALYTICS.totalViews)} growth={MOCK_ANALYTICS.viewsGrowth} />
              <StatCard icon={Heart} label="Total Likes" value={formatNum(MOCK_ANALYTICS.totalLikes)} />
              <StatCard icon={Users} label="Followers" value={formatNum(MOCK_ANALYTICS.totalFollowers)} growth={MOCK_ANALYTICS.followersGrowth} />
              <StatCard icon={Clock} label="Avg Watch Time" value={MOCK_ANALYTICS.avgWatchTime} />
            </div>

            {/* Views chart */}
            <div className="bg-card border border-border/30 rounded-xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-foreground">Views This Week</h3>
                <span className="text-[10px] text-muted-foreground">Last 7 days</span>
              </div>
              <MiniChart data={MOCK_ANALYTICS.recentPerformance} />
            </div>

            {/* Top videos */}
            <div className="bg-card border border-border/30 rounded-xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-foreground">Top Performing Videos</h3>
                <button onClick={() => setActiveTab("videos")} className="text-xs text-primary hover:underline flex items-center gap-1">
                  See all <ChevronRight className="w-3 h-3" />
                </button>
              </div>
              <div className="space-y-3">
                {MOCK_ANALYTICS.topVideos.map((v, i) => (
                  <div key={i} className="flex items-center gap-3 p-2 rounded-lg hover:bg-secondary/50 transition-colors cursor-pointer">
                    <span className="text-lg font-bold text-muted-foreground/30 w-6 text-center">{i + 1}</span>
                    <div className="w-16 aspect-video rounded-lg bg-secondary flex items-center justify-center flex-shrink-0">
                      <Play className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{v.title}</p>
                      <p className="text-[10px] text-muted-foreground">{formatNum(v.views)} views · {v.date}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-xs text-foreground font-medium">❤️ {formatNum(v.likes)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick actions */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <button
                onClick={() => navigate("/watch/upload")}
                className="bg-primary text-primary-foreground p-4 rounded-xl text-left hover:bg-primary/90 transition-colors"
              >
                <Upload className="w-5 h-5 mb-2" />
                <p className="text-sm font-bold">Upload Video</p>
                <p className="text-[10px] opacity-70">Add new content</p>
              </button>
              <button
                onClick={() => setActiveTab("settings")}
                className="bg-card border border-border/30 p-4 rounded-xl text-left hover:bg-secondary/50 transition-colors"
              >
                <Edit3 className="w-5 h-5 mb-2 text-primary" />
                <p className="text-sm font-bold text-foreground">Edit Channel</p>
                <p className="text-[10px] text-muted-foreground">Update info & branding</p>
              </button>
              <button
                onClick={() => navigate(`/watch/channel/${ch.slug}`)}
                className="bg-card border border-border/30 p-4 rounded-xl text-left hover:bg-secondary/50 transition-colors"
              >
                <Globe className="w-5 h-5 mb-2 text-primary" />
                <p className="text-sm font-bold text-foreground">View Channel</p>
                <p className="text-[10px] text-muted-foreground">See public page</p>
              </button>
            </div>
          </motion.div>
        )}

        {/* ─── VIDEOS TAB ────────────────────────────── */}
        {activeTab === "videos" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-foreground">All Videos</h2>
              <button
                onClick={() => navigate("/watch/upload")}
                className="px-4 py-2 bg-primary text-primary-foreground text-xs font-bold rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" /> Upload
              </button>
            </div>

            {MOCK_ANALYTICS.topVideos.length > 0 ? (
              <div className="space-y-2">
                {MOCK_ANALYTICS.topVideos.map((v, i) => (
                  <div key={i} className="flex items-center gap-4 p-3 bg-card border border-border/30 rounded-xl hover:bg-secondary/50 transition-colors cursor-pointer">
                    <div className="w-32 aspect-video rounded-lg bg-secondary flex items-center justify-center flex-shrink-0">
                      <Play className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-foreground mb-1">{v.title}</p>
                      <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                        <span><Eye className="w-3 h-3 inline mr-0.5" /> {formatNum(v.views)}</span>
                        <span><Heart className="w-3 h-3 inline mr-0.5" /> {formatNum(v.likes)}</span>
                        <span><Calendar className="w-3 h-3 inline mr-0.5" /> {v.date}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <span className="px-2 py-1 bg-primary/10 text-primary text-[10px] font-bold rounded-full">Published</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <Video className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
                <p className="text-sm text-muted-foreground">No videos yet. Upload your first video!</p>
              </div>
            )}
          </motion.div>
        )}

        {/* ─── SETTINGS TAB ──────────────────────────── */}
        {activeTab === "settings" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <div className="bg-card border border-border/30 rounded-xl p-5 space-y-4">
              <h3 className="text-sm font-bold text-foreground">Channel Information</h3>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <p className="text-muted-foreground mb-1">Channel Name</p>
                  <p className="text-foreground font-medium">{ch.channel_name}</p>
                </div>
                <div>
                  <p className="text-muted-foreground mb-1">Handle</p>
                  <p className="text-foreground font-medium">@{ch.slug}</p>
                </div>
                <div>
                  <p className="text-muted-foreground mb-1">Type</p>
                  <p className="text-foreground font-medium capitalize">{ch.channel_type}</p>
                </div>
                <div>
                  <p className="text-muted-foreground mb-1">Status</p>
                  <p className={`font-medium capitalize ${ch.status === "approved" ? "text-primary" : "text-muted-foreground"}`}>
                    {ch.status.replace("_", " ")}
                  </p>
                </div>
                {ch.sport_focus && (
                  <div>
                    <p className="text-muted-foreground mb-1">Sport Focus</p>
                    <p className="text-foreground font-medium">{ch.sport_focus}</p>
                  </div>
                )}
                <div>
                  <p className="text-muted-foreground mb-1">Created</p>
                  <p className="text-foreground font-medium">{new Date(ch.created_at).toLocaleDateString()}</p>
                </div>
              </div>
            </div>

            {ch.description && (
              <div className="bg-card border border-border/30 rounded-xl p-5">
                <h3 className="text-sm font-bold text-foreground mb-2">Description</h3>
                <p className="text-xs text-muted-foreground">{ch.description}</p>
              </div>
            )}

            <div className="bg-destructive/5 border border-destructive/20 rounded-xl p-5">
              <h3 className="text-sm font-bold text-foreground mb-1">Danger Zone</h3>
              <p className="text-xs text-muted-foreground mb-3">Deleting your channel will remove all videos and data permanently.</p>
              <button className="px-4 py-2 bg-destructive/10 text-destructive text-xs font-bold rounded-lg hover:bg-destructive/20 transition-colors">
                Delete Channel
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default ChannelDashboard;

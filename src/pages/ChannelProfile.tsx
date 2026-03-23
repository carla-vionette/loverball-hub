import { useParams, useNavigate } from "react-router-dom";
import { CheckCircle, Users, Play, Eye, ArrowLeft, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import BottomNav from "@/components/BottomNav";
import DesktopNav from "@/components/DesktopNav";
import MobileHeader from "@/components/MobileHeader";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

interface Channel {
  id: string;
  channel_name: string;
  slug: string;
  handle: string | null;
  description: string | null;
  channel_type: string;
  league: string | null;
  sport_focus: string | null;
  location: string | null;
  avatar_url: string | null;
  banner_url: string | null;
  verified: boolean;
  follower_count: number;
  total_views: number;
}

interface ChannelVideo {
  id: string;
  title: string;
  thumbnail: string | null;
  thumbnail_url: string | null;
  video_url: string;
  created_at: string;
}

const CHANNEL_TYPE_COLORS: Record<string, string> = {
  team: "bg-accent",
  creator: "bg-primary",
  loverball_official: "bg-primary",
};

const ChannelProfile = () => {
  const { handle } = useParams<{ handle: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [channel, setChannel] = useState<Channel | null>(null);
  const [videos, setVideos] = useState<ChannelVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [following, setFollowing] = useState(false);

  useEffect(() => {
    if (handle) fetchChannel();
  }, [handle]);

  const fetchChannel = async () => {
    setLoading(true);
    try {
      // Try matching by handle first, then slug
      let { data, error } = await supabase
        .from("creator_channels")
        .select("*")
        .eq("handle", handle)
        .maybeSingle();

      if (!data) {
        ({ data, error } = await supabase
          .from("creator_channels")
          .select("*")
          .eq("slug", handle)
          .maybeSingle());
      }

      if (error) throw error;
      setChannel(data);

      if (data) {
        // Fetch channel videos
        const { data: vids } = await supabase
          .from("videos")
          .select("id, title, thumbnail, thumbnail_url, video_url, created_at")
          .eq("channel_id", data.id)
          .eq("is_published", true)
          .order("created_at", { ascending: false })
          .limit(30);
        setVideos(vids || []);
      }
    } catch {
      // silently handle
    } finally {
      setLoading(false);
    }
  };

  const handleFollow = () => {
    if (!user) {
      toast({ title: "Sign in to follow channels", variant: "destructive" });
      return;
    }
    setFollowing(!following);
    toast({ title: following ? "Unfollowed" : "Following!" });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <MobileHeader /><DesktopNav /><BottomNav />
        <main className="md:ml-64 pt-16 md:pt-0 pb-24 flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </main>
      </div>
    );
  }

  if (!channel) {
    return (
      <div className="min-h-screen bg-background">
        <MobileHeader /><DesktopNav /><BottomNav />
        <main className="md:ml-64 pt-16 md:pt-0 pb-24 flex flex-col items-center justify-center min-h-[60vh] gap-4">
          <p className="text-muted-foreground">Channel not found</p>
          <Button variant="outline" onClick={() => navigate(-1)}>Go Back</Button>
        </main>
      </div>
    );
  }

  const initials = channel.channel_name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const typeLabel =
    channel.channel_type === "team"
      ? "Team"
      : channel.channel_type === "creator"
      ? "Creator"
      : "Official";

  return (
    <div className="min-h-screen bg-background">
      <MobileHeader />
      <DesktopNav />
      <BottomNav />

      <main className="md:ml-64 pt-16 md:pt-0 pb-24 md:pb-0">
        <div className="max-w-3xl mx-auto px-5 md:px-10 py-6">
          {/* Back */}
          <Button
            variant="ghost"
            className="gap-2 mb-4 -ml-2 text-muted-foreground hover:text-foreground"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </Button>

          {/* Banner */}
          {channel.banner_url && (
            <div className="h-40 md:h-52 rounded-xl overflow-hidden mb-6">
              <img src={channel.banner_url} alt="" className="w-full h-full object-cover" />
            </div>
          )}

          {/* Channel Header */}
          <div className="flex flex-col items-center text-center gap-4 mb-8">
            <Avatar className="w-24 h-24">
              {channel.avatar_url ? (
                <AvatarImage src={channel.avatar_url} />
              ) : null}
              <AvatarFallback
                className={`${CHANNEL_TYPE_COLORS[channel.channel_type] || "bg-primary"} text-white font-bold text-2xl`}
              >
                {initials}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center justify-center gap-1.5 mb-1">
                <h1 className="font-condensed text-2xl font-bold uppercase tracking-wide">
                  {channel.channel_name}
                </h1>
                {channel.verified && <CheckCircle className="w-5 h-5 text-primary" />}
              </div>
              <p className="text-sm text-muted-foreground mb-2">
                @{channel.handle || channel.slug}
              </p>
              <div className="flex items-center justify-center gap-3 mb-3 flex-wrap">
                <Badge className="bg-primary/10 text-primary text-xs font-bold border-0 rounded-full">
                  {typeLabel}
                </Badge>
                {channel.league && (
                  <Badge variant="outline" className="text-xs rounded-full">
                    {channel.league}
                  </Badge>
                )}
                {channel.sport_focus && (
                  <Badge variant="outline" className="text-xs rounded-full">
                    {channel.sport_focus}
                  </Badge>
                )}
                <span className="text-sm text-muted-foreground flex items-center gap-1">
                  <Users className="w-3.5 h-3.5" />{" "}
                  {channel.follower_count.toLocaleString()} followers
                </span>
              </div>
              {channel.description && (
                <p className="text-sm text-muted-foreground max-w-md">{channel.description}</p>
              )}
              {channel.location && (
                <p className="text-xs text-muted-foreground mt-1">{channel.location}</p>
              )}
            </div>
            <Button
              onClick={handleFollow}
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
          <h2 className="font-condensed text-lg font-bold uppercase tracking-wide mb-4">
            Videos ({videos.length})
          </h2>
          {videos.length === 0 ? (
            <div className="text-center py-12">
              <Play className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">No videos published yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {videos.map((video) => (
                <a
                  key={video.id}
                  href={`/watch/video/${video.id}`}
                  className="cursor-pointer group block"
                >
                  <div className="relative w-full aspect-[9/16] rounded-xl overflow-hidden bg-muted">
                    {(video.thumbnail || video.thumbnail_url) ? (
                      <img
                        src={video.thumbnail || video.thumbnail_url || ""}
                        alt={video.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                        <Play className="w-6 h-6 text-white/50" />
                      </div>
                    )}
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="w-10 h-10 rounded-full bg-white/30 backdrop-blur-sm flex items-center justify-center">
                        <Play className="w-4 h-4 text-white ml-0.5" fill="currentColor" />
                      </div>
                    </div>
                  </div>
                  <p className="text-[11px] font-semibold text-foreground mt-1.5 leading-tight line-clamp-2">
                    {video.title}
                  </p>
                </a>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default ChannelProfile;

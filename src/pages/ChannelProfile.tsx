import { useParams } from "react-router-dom";
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
  name: string;
  handle: string;
  description: string | null;
  channel_type: string;
  league: string | null;
  avatar_url: string | null;
  is_verified: boolean;
}

interface ChannelVideo {
  id: string;
  title: string;
  thumbnail: string | null;
  video_url: string;
  description: string | null;
}

const ChannelProfile = () => {
  const { handle } = useParams<{ handle: string }>();
  const { user } = useAuth();
  const { toast } = useToast();
  const [channel, setChannel] = useState<Channel | null>(null);
  const [videos, setVideos] = useState<ChannelVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [subscribed, setSubscribed] = useState(false);
  const [subCount, setSubCount] = useState(0);
  const [toggling, setToggling] = useState(false);

  useEffect(() => {
    if (handle) fetchChannel();
  }, [handle]);

  useEffect(() => {
    if (channel && user) checkSubscription();
  }, [channel?.id, user?.id]);

  const fetchChannel = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("channels")
      .select("*")
      .eq("handle", handle)
      .maybeSingle();

    if (error || !data) {
      setLoading(false);
      return;
    }

    setChannel(data as Channel);

    // Fetch videos for this channel
    const { data: vids } = await supabase
      .from("videos")
      .select("id, title, thumbnail, video_url, description")
      .eq("channel_id", data.id)
      .eq("approval_status" as any, "approved")
      .eq("is_published", true)
      .order("created_at", { ascending: false });

    setVideos((vids || []) as ChannelVideo[]);

    // Fetch subscriber count
    const { count } = await supabase
      .from("channel_subscriptions")
      .select("*", { count: "exact", head: true })
      .eq("channel_id", data.id);

    setSubCount(count || 0);
    setLoading(false);
  };

  const checkSubscription = async () => {
    if (!user || !channel) return;
    const { data } = await supabase
      .from("channel_subscriptions")
      .select("id")
      .eq("user_id", user.id)
      .eq("channel_id", channel.id)
      .maybeSingle();
    setSubscribed(!!data);
  };

  const toggleSubscription = async () => {
    if (!user) {
      toast({ title: "Sign in required", variant: "destructive" });
      return;
    }
    if (!channel) return;
    setToggling(true);

    if (subscribed) {
      await supabase
        .from("channel_subscriptions")
        .delete()
        .eq("user_id", user.id)
        .eq("channel_id", channel.id);
      setSubscribed(false);
      setSubCount((c) => Math.max(0, c - 1));
    } else {
      await supabase
        .from("channel_subscriptions")
        .insert({ user_id: user.id, channel_id: channel.id });
      setSubscribed(true);
      setSubCount((c) => c + 1);
    }
    setToggling(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <MobileHeader /><DesktopNav /><BottomNav />
        <main className="md:ml-64 pt-16 md:pt-0 pb-24 flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </main>
      </div>
    );
  }

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

  const initials = channel.name.split(" ").map((w) => w[0]).join("").slice(0, 2);

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
              <AvatarImage src={channel.avatar_url || undefined} />
              <AvatarFallback className="bg-primary text-white font-bold text-2xl">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center justify-center gap-1.5 mb-1">
                <h1 className="font-condensed text-2xl font-bold uppercase tracking-wide">{channel.name}</h1>
                {channel.is_verified && <CheckCircle className="w-5 h-5 text-primary" />}
              </div>
              <p className="text-sm text-muted-foreground mb-2">@{channel.handle}</p>
              <div className="flex items-center justify-center gap-3 mb-3">
                {channel.league && (
                  <Badge className="bg-primary/10 text-primary text-xs font-bold border-0 rounded-full">{channel.league}</Badge>
                )}
                <Badge variant="outline" className="text-xs rounded-full capitalize">{channel.channel_type.replace("_", " ")}</Badge>
                <span className="text-sm text-muted-foreground flex items-center gap-1">
                  <Users className="w-3.5 h-3.5" /> {subCount} {subCount === 1 ? "subscriber" : "subscribers"}
                </span>
              </div>
              {channel.description && (
                <p className="text-sm text-muted-foreground max-w-md">{channel.description}</p>
              )}
            </div>
            <Button
              onClick={toggleSubscription}
              disabled={toggling}
              className={`rounded-full px-8 ${
                subscribed
                  ? "bg-secondary text-muted-foreground border border-border/50 hover:bg-destructive/10 hover:text-destructive"
                  : "bg-primary text-primary-foreground hover:bg-primary/90"
              }`}
            >
              {toggling ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : null}
              {subscribed ? "Subscribed" : "+ Subscribe"}
            </Button>
          </div>

          {/* Videos Grid */}
          <h2 className="font-condensed text-lg font-bold uppercase tracking-wide mb-4">
            Videos {videos.length > 0 && `(${videos.length})`}
          </h2>
          {videos.length === 0 ? (
            <div className="text-center py-12">
              <Play className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground text-sm">No videos yet. Check back soon!</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {videos.map((video) => (
                <a key={video.id} href={`/watch/video/${video.id}`} className="cursor-pointer group">
                  <div className="relative w-full aspect-[9/16] rounded-xl overflow-hidden bg-gradient-to-br from-primary/30 to-accent/30">
                    {video.thumbnail ? (
                      <img src={video.thumbnail} alt={video.title} className="w-full h-full object-cover" loading="lazy" />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-10 h-10 rounded-full bg-background/30 backdrop-blur-sm flex items-center justify-center group-hover:bg-background/50 transition-colors">
                          <Play className="w-4 h-4 text-white ml-0.5" fill="currentColor" />
                        </div>
                      </div>
                    )}
                  </div>
                  <p className="text-[11px] font-semibold text-foreground mt-1.5 leading-tight line-clamp-2">{video.title}</p>
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

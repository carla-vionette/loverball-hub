import React, { useState, useRef, useEffect } from "react";
import { useParams } from "react-router-dom";
import { ArrowLeft, Heart, Share2, Eye, Clock, Play, Pause, Volume2, VolumeX, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import BottomNav from "@/components/BottomNav";
import DesktopNav from "@/components/DesktopNav";
import MobileHeader from "@/components/MobileHeader";
import { DISCOVER_VIDEOS, type DiscoverVideo } from "@/lib/discoverVideoData";
import { supabase } from "@/integrations/supabase/client";

const formatViews = (n: number) => {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
};

interface DbVideo {
  id: string;
  title: string;
  description: string | null;
  video_url: string;
  thumbnail: string | null;
  category: string | null;
  creator_name: string | null;
  likes_count: number;
  comments_count: number;
  channel: {
    name: string;
    handle: string;
    avatar_url: string | null;
    is_verified: boolean;
  } | null;
}

const VideoDetail = () => {
  const { id } = useParams<{ id: string }>();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [liked, setLiked] = useState(false);
  const [dbVideo, setDbVideo] = useState<DbVideo | null>(null);
  const [loading, setLoading] = useState(true);
  const goTo = (path: string) => { window.location.href = path; };

  // Try hardcoded data first
  const hardcodedVideo = DISCOVER_VIDEOS.find(v => v.id === id);

  useEffect(() => {
    if (!hardcodedVideo && id) {
      fetchDbVideo();
    } else {
      setLoading(false);
    }
  }, [id]);

  const fetchDbVideo = async () => {
    const { data } = await supabase
      .from("videos")
      .select(`
        id, title, description, video_url, thumbnail, category, creator_name,
        likes_count, comments_count,
        channel:channels!videos_channel_id_fkey (
          name, handle, avatar_url, is_verified
        )
      `)
      .eq("id", id!)
      .maybeSingle();

    if (data) {
      const v = data as any;
      setDbVideo({
        id: v.id,
        title: v.title,
        description: v.description,
        video_url: v.video_url,
        thumbnail: v.thumbnail,
        category: v.category,
        creator_name: v.creator_name,
        likes_count: v.likes_count || 0,
        comments_count: v.comments_count || 0,
        channel: v.channel ? { name: v.channel.name, handle: v.channel.handle, avatar_url: v.channel.avatar_url, is_verified: v.channel.is_verified } : null,
      });
    }
    setLoading(false);
  };

  const relatedVideos = DISCOVER_VIDEOS.filter(v => v.id !== id && v.category === hardcodedVideo?.category).slice(0, 6);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (playing) videoRef.current.pause();
    else videoRef.current.play();
    setPlaying(!playing);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  // Use hardcoded or DB video
  const video = hardcodedVideo || dbVideo;
  if (!video) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Video not found</p>
          <Button onClick={() => goTo("/explore")}>Back to Discover</Button>
        </div>
      </div>
    );
  }

  // Normalize to common shape
  const title = hardcodedVideo ? hardcodedVideo.title : (dbVideo?.title || "");
  const videoUrl = hardcodedVideo ? hardcodedVideo.videoUrl : (dbVideo?.video_url || "");
  const thumbnail = hardcodedVideo ? hardcodedVideo.thumbnail : (dbVideo?.thumbnail || "");
  const channelName = hardcodedVideo ? hardcodedVideo.channel : (dbVideo?.channel?.name || dbVideo?.creator_name || "Loverball");
  const category = hardcodedVideo ? hardcodedVideo.category : (dbVideo?.category || "");
  const views = hardcodedVideo ? hardcodedVideo.views : 0;
  const likes = hardcodedVideo ? hardcodedVideo.likes : (dbVideo?.likes_count || 0);
  const gradient = hardcodedVideo ? hardcodedVideo.gradient : "from-primary/40 to-accent/40";
  const duration = hardcodedVideo ? hardcodedVideo.duration : "";
  const isVerified = dbVideo?.channel?.is_verified || false;

  return (
    <div className="min-h-screen bg-background">
      <MobileHeader />
      <DesktopNav />
      <BottomNav />

      <main className="md:ml-64 pt-16 md:pt-0 pb-24 md:pb-0">
        <div className="max-w-4xl mx-auto px-4 md:px-8 py-4">
          <button onClick={() => window.history.back()} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back
          </button>

          <div className="relative aspect-[9/16] max-h-[70vh] mx-auto rounded-2xl overflow-hidden bg-foreground/5 mb-6">
            {videoUrl ? (
              <>
                <video
                  ref={videoRef}
                  src={videoUrl}
                  className="w-full h-full object-cover"
                  loop
                  muted={muted}
                  playsInline
                  poster={thumbnail || undefined}
                  onClick={togglePlay}
                />
                <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
                  <div className="flex gap-2">
                    <button onClick={togglePlay} className="w-10 h-10 rounded-full bg-foreground/60 flex items-center justify-center text-background">
                      {playing ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" fill="currentColor" />}
                    </button>
                    <button onClick={() => setMuted(!muted)} className="w-10 h-10 rounded-full bg-foreground/60 flex items-center justify-center text-background">
                      {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </>
            ) : thumbnail ? (
              <img src={thumbnail} alt={title} className="w-full h-full object-cover" />
            ) : (
              <div className={`w-full h-full bg-gradient-to-br ${gradient} flex items-center justify-center`}>
                <div className="w-20 h-20 rounded-full bg-background/20 backdrop-blur-sm flex items-center justify-center">
                  <Play className="w-8 h-8 text-background ml-1" fill="currentColor" />
                </div>
              </div>
            )}
          </div>

          <div className="mb-6">
            <h1 className="text-xl font-bold text-foreground mb-2">{title}</h1>
            <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
              {views > 0 && <span className="flex items-center gap-1"><Eye className="w-4 h-4" />{formatViews(views)}</span>}
              {duration && <span className="flex items-center gap-1"><Clock className="w-4 h-4" />{duration}</span>}
              {category && <Badge className="bg-accent/10 text-accent border-0 text-xs">{category}</Badge>}
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar className="w-10 h-10">
                  <AvatarImage src={dbVideo?.channel?.avatar_url || undefined} />
                  <AvatarFallback className="bg-accent text-accent-foreground font-bold text-sm">
                    {channelName.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="flex items-center gap-1">
                    <p className="font-semibold text-sm">{channelName}</p>
                    {isVerified && <CheckCircle className="w-3.5 h-3.5 text-primary" />}
                  </div>
                  {category && <p className="text-xs text-muted-foreground">{category}</p>}
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className={`rounded-full ${liked ? "text-destructive border-destructive/30" : ""}`}
                  onClick={() => setLiked(!liked)}
                >
                  <Heart className={`w-4 h-4 mr-1 ${liked ? "fill-current" : ""}`} />{formatViews(likes + (liked ? 1 : 0))}
                </Button>
                <Button variant="outline" size="sm" className="rounded-full" onClick={() => {
                  if (navigator.share) navigator.share({ title, url: window.location.href });
                }}>
                  <Share2 className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {dbVideo?.description && (
              <p className="text-sm text-muted-foreground mt-4">{dbVideo.description}</p>
            )}
          </div>

          {relatedVideos.length > 0 && (
            <section>
              <h2 className="font-display text-lg font-semibold uppercase tracking-wide mb-3">Related Videos</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {relatedVideos.map(v => (
                  <a key={v.id} href={`/watch/video/${v.id}`} className="group cursor-pointer">
                    <div className="relative aspect-[9/16] rounded-xl overflow-hidden mb-2">
                      {v.thumbnail ? (
                        <img src={v.thumbnail} alt={v.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className={`w-full h-full bg-gradient-to-br ${v.gradient}`} />
                      )}
                      <div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/10 transition-colors flex items-center justify-center">
                        <div className="w-10 h-10 rounded-full bg-background/20 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <Play className="w-4 h-4 text-background ml-0.5" fill="currentColor" />
                        </div>
                      </div>
                      <span className="absolute bottom-1.5 right-1.5 bg-foreground/70 text-background text-[10px] px-1.5 py-0.5 rounded-full">{v.duration}</span>
                    </div>
                    <p className="text-xs font-medium line-clamp-2">{v.title}</p>
                    <p className="text-[10px] text-muted-foreground">{v.channel}</p>
                  </a>
                ))}
              </div>
            </section>
          )}
        </div>
      </main>
    </div>
  );
};

export default VideoDetail;

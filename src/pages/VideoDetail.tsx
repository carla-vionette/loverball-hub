import React, { useState, useRef, useEffect } from "react";
import { useParams } from "react-router-dom";
import { ArrowLeft, Heart, Share2, Eye, Clock, Play, Pause, Volume2, VolumeX, CheckCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import BottomNav from "@/components/BottomNav";
import DesktopNav from "@/components/DesktopNav";
import MobileHeader from "@/components/MobileHeader";
import { DISCOVER_VIDEOS, type DiscoverVideo } from "@/lib/discoverVideoData";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

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
  thumbnail_url: string | null;
  category: string | null;
  tags: string[] | null;
  created_at: string;
  duration: string | null;
  channel: {
    id: string;
    channel_name: string;
    slug: string;
    avatar_url: string | null;
    verified: boolean;
  } | null;
}

const VideoDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [liked, setLiked] = useState(false);
  const [dbVideo, setDbVideo] = useState<DbVideo | null>(null);
  const [relatedDbVideos, setRelatedDbVideos] = useState<DbVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const goTo = (path: string) => { window.location.href = path; };

  // Try DB first, fall back to legacy
  const legacyVideo = DISCOVER_VIDEOS.find(v => v.id === id);

  useEffect(() => {
    if (!id) return;
    fetchDbVideo();
  }, [id]);

  const fetchDbVideo = async () => {
    setLoading(true);
    try {
      const { data } = await supabase
        .from("videos")
        .select(`
          id, title, description, video_url, thumbnail, thumbnail_url, category, tags, created_at, duration,
          channel:creator_channels!videos_channel_id_fkey (id, channel_name, slug, avatar_url, verified)
        `)
        .eq("id", id!)
        .maybeSingle();

      if (data) {
        setDbVideo(data as DbVideo);
        // Fetch related
        const { data: related } = await supabase
          .from("videos")
          .select(`
            id, title, description, video_url, thumbnail, thumbnail_url, category, tags, created_at, duration,
            channel:creator_channels!videos_channel_id_fkey (id, channel_name, slug, avatar_url, verified)
          `)
          .neq("id", id!)
          .eq("is_published", true)
          .order("created_at", { ascending: false })
          .limit(6);
        setRelatedDbVideos((related || []) as DbVideo[]);
      }
    } catch {}
    setLoading(false);
  };

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (playing) videoRef.current.pause();
    else videoRef.current.play();
    setPlaying(!playing);
  };

  // Use DB video if found, otherwise legacy
  const video = dbVideo;
  const isLegacy = !dbVideo && !!legacyVideo;

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

  // Legacy video fallback
  if (isLegacy && legacyVideo) {
    const relatedVideos = DISCOVER_VIDEOS.filter(v => v.id !== id && v.category === legacyVideo.category).slice(0, 6);
    return (
      <div className="min-h-screen bg-background">
        <MobileHeader /><DesktopNav /><BottomNav />
        <main className="md:ml-64 pt-16 md:pt-0 pb-24 md:pb-0">
          <div className="max-w-4xl mx-auto px-4 md:px-8 py-4 md:pt-10 md:scroll-mt-[96px]">
            <button onClick={() => window.history.back()} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors">
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
            <div className="relative aspect-[9/16] max-h-[70vh] mx-auto rounded-2xl overflow-hidden bg-muted mb-6">
              {legacyVideo.videoUrl ? (
                <video ref={videoRef} src={legacyVideo.videoUrl} className="w-full h-full object-cover" loop muted={muted} playsInline poster={legacyVideo.thumbnail} onClick={togglePlay} />
              ) : (
                <div className={`w-full h-full bg-gradient-to-br ${legacyVideo.gradient} flex items-center justify-center`}>
                  <Play className="w-8 h-8 text-white" fill="currentColor" />
                </div>
              )}
            </div>
            <h1 className="text-xl font-bold mb-2">{legacyVideo.title}</h1>
            <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
              <span className="flex items-center gap-1"><Eye className="w-4 h-4" />{formatViews(legacyVideo.views)}</span>
              <span className="flex items-center gap-1"><Clock className="w-4 h-4" />{legacyVideo.duration}</span>
              <Badge className="bg-accent/10 text-accent border-0 text-xs">{legacyVideo.category}</Badge>
            </div>
            <div className="flex items-center gap-3 mb-6">
              <Avatar className="w-10 h-10"><AvatarFallback className="bg-accent text-accent-foreground font-bold text-sm">{legacyVideo.channel.slice(0,2).toUpperCase()}</AvatarFallback></Avatar>
              <p className="font-semibold text-sm">{legacyVideo.channel}</p>
            </div>
            {relatedVideos.length > 0 && (
              <section>
                <h2 className="font-display text-lg font-semibold uppercase tracking-wide mb-3">Related Videos</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {relatedVideos.map(v => (
                    <a key={v.id} href={`/watch/video/${v.id}`} className="group cursor-pointer">
                      <div className="relative aspect-[9/16] rounded-xl overflow-hidden mb-2">
                        {v.thumbnail ? <img src={v.thumbnail} alt={v.title} className="w-full h-full object-cover" /> : <div className={`w-full h-full bg-gradient-to-br ${v.gradient}`} />}
                      </div>
                      <p className="text-xs font-medium line-clamp-2">{v.title}</p>
                    </a>
                  ))}
                </div>
              </section>
            )}
          </div>
        </main>
      </div>
    );
  }

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

  return (
    <div className="min-h-screen bg-background">
      <MobileHeader /><DesktopNav /><BottomNav />
      <main className="md:ml-64 pt-16 md:pt-0 pb-24 md:pb-0">
        <div className="max-w-4xl mx-auto px-4 md:px-8 py-4 md:pt-10 md:scroll-mt-[96px]">
          <button onClick={() => window.history.back()} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back
          </button>

          {/* Video Player */}
          <div className="relative aspect-[9/16] max-h-[70vh] mx-auto rounded-2xl overflow-hidden bg-muted mb-6">
            <video
              ref={videoRef}
              src={video.video_url}
              className="w-full h-full object-cover"
              loop
              muted={muted}
              playsInline
              poster={video.thumbnail || video.thumbnail_url || undefined}
              onClick={togglePlay}
            />
            <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
              <div className="flex gap-2">
                <button onClick={togglePlay} className="w-10 h-10 rounded-full bg-black/60 flex items-center justify-center text-white">
                  {playing ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" fill="currentColor" />}
                </button>
                <button onClick={() => setMuted(!muted)} className="w-10 h-10 rounded-full bg-black/60 flex items-center justify-center text-white">
                  {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>

          {/* Info */}
          <h1 className="text-xl font-bold mb-2">{video.title}</h1>
          {video.description && <p className="text-sm text-muted-foreground mb-3">{video.description}</p>}
          <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
            {video.duration && <span className="flex items-center gap-1"><Clock className="w-4 h-4" />{video.duration}</span>}
            {video.category && <Badge className="bg-accent/10 text-accent border-0 text-xs">{video.category}</Badge>}
          </div>

          {/* Channel */}
          {video.channel && (
            <div className="flex items-center justify-between mb-6">
              <a href={`/channel/${video.channel.slug}`} className="flex items-center gap-3">
                <Avatar className="w-10 h-10">
                  {video.channel.avatar_url && <AvatarImage src={video.channel.avatar_url} />}
                  <AvatarFallback className="bg-accent text-accent-foreground font-bold text-sm">
                    {video.channel.channel_name.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex items-center gap-1">
                  <p className="font-semibold text-sm">{video.channel.channel_name}</p>
                  {video.channel.verified && <CheckCircle className="w-4 h-4 text-primary" />}
                </div>
              </a>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className={`rounded-full ${liked ? "text-destructive border-destructive/30" : ""}`}
                  onClick={() => setLiked(!liked)}
                >
                  <Heart className={`w-4 h-4 mr-1 ${liked ? "fill-current" : ""}`} /> Like
                </Button>
                <Button variant="outline" size="sm" className="rounded-full" onClick={() => {
                  if (navigator.share) navigator.share({ title: video.title, url: window.location.href });
                  else { navigator.clipboard.writeText(window.location.href); }
                }}>
                  <Share2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Related */}
          {relatedDbVideos.length > 0 && (
            <section>
              <h2 className="font-display text-lg font-semibold uppercase tracking-wide mb-3">More Videos</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {relatedDbVideos.map(v => (
                  <a key={v.id} href={`/watch/video/${v.id}`} className="group cursor-pointer">
                    <div className="relative aspect-[9/16] rounded-xl overflow-hidden mb-2 bg-muted">
                      {(v.thumbnail || v.thumbnail_url) ? (
                        <img src={v.thumbnail || v.thumbnail_url || ""} alt={v.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" loading="lazy" />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                          <Play className="w-6 h-6 text-white/50" />
                        </div>
                      )}
                    </div>
                    <p className="text-xs font-medium line-clamp-2">{v.title}</p>
                    {v.channel && <p className="text-[10px] text-muted-foreground">{v.channel.channel_name}</p>}
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

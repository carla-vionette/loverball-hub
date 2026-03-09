import React, { useState, useRef, useEffect } from "react";
import { useParams } from "react-router-dom";
import { ArrowLeft, Heart, Share2, Eye, Clock, Play, Pause, Volume2, VolumeX, Maximize } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import BottomNav from "@/components/BottomNav";
import DesktopNav from "@/components/DesktopNav";
import MobileHeader from "@/components/MobileHeader";
import { DISCOVER_VIDEOS, type DiscoverVideo } from "@/lib/discoverVideoData";

const formatViews = (n: number) => {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
};

const VideoDetail = () => {
  const { id } = useParams<{ id: string }>();
  const video = DISCOVER_VIDEOS.find(v => v.id === id);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [liked, setLiked] = useState(false);
  const goTo = (path: string) => { window.location.href = path; };

  const relatedVideos = DISCOVER_VIDEOS.filter(v => v.id !== id && v.category === video?.category).slice(0, 6);
  const moreVideos = relatedVideos.length < 4
    ? [...relatedVideos, ...DISCOVER_VIDEOS.filter(v => v.id !== id && !relatedVideos.find(r => r.id === v.id)).slice(0, 4 - relatedVideos.length)]
    : relatedVideos;

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (playing) videoRef.current.pause();
    else videoRef.current.play();
    setPlaying(!playing);
  };

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
      <MobileHeader />
      <DesktopNav />
      <BottomNav />

      <main className="md:ml-64 pt-16 md:pt-0 pb-24 md:pb-0">
        <div className="max-w-4xl mx-auto px-4 md:px-8 py-4">
          {/* Back */}
          <button onClick={() => window.history.back()} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back
          </button>

          {/* Video Player */}
          <div className="relative aspect-[9/16] max-h-[70vh] mx-auto rounded-2xl overflow-hidden bg-foreground/5 mb-6">
            {video.videoUrl ? (
              <>
                <video
                  ref={videoRef}
                  src={video.videoUrl}
                  className="w-full h-full object-cover"
                  loop
                  muted={muted}
                  playsInline
                  poster={video.thumbnail}
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
            ) : (
              <div className={`w-full h-full bg-gradient-to-br ${video.gradient} flex items-center justify-center`}>
                <div className="w-20 h-20 rounded-full bg-background/20 backdrop-blur-sm flex items-center justify-center">
                  <Play className="w-8 h-8 text-background ml-1" fill="currentColor" />
                </div>
              </div>
            )}
          </div>

          {/* Info */}
          <div className="mb-6">
            <h1 className="text-xl font-bold text-foreground mb-2">{video.title}</h1>
            <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
              <span className="flex items-center gap-1"><Eye className="w-4 h-4" />{formatViews(video.views)}</span>
              <span className="flex items-center gap-1"><Clock className="w-4 h-4" />{video.duration}</span>
              <Badge className="bg-accent/10 text-accent border-0 text-xs">{video.category}</Badge>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar className="w-10 h-10">
                  <AvatarFallback className="bg-accent text-accent-foreground font-bold text-sm">
                    {video.channel.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold text-sm">{video.channel}</p>
                  <p className="text-xs text-muted-foreground">{video.category}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className={`rounded-full ${liked ? "text-destructive border-destructive/30" : ""}`}
                  onClick={() => setLiked(!liked)}
                >
                  <Heart className={`w-4 h-4 mr-1 ${liked ? "fill-current" : ""}`} />{formatViews(video.likes + (liked ? 1 : 0))}
                </Button>
                <Button variant="outline" size="sm" className="rounded-full" onClick={() => {
                  if (navigator.share) navigator.share({ title: video.title, url: window.location.href });
                }}>
                  <Share2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Related */}
          {moreVideos.length > 0 && (
            <section>
              <h2 className="font-display text-lg font-semibold uppercase tracking-wide mb-3">Related Videos</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {moreVideos.map(v => (
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

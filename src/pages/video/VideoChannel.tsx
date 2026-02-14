import { useState, useMemo } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Bell,
  BellOff,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Clock,
  Eye,
  ExternalLink,
  Heart,
  ListVideo,
  Play,
  Share2,
  ThumbsUp,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { FollowButton } from "@/components/video/ChannelCard";
import ChannelRow from "@/components/video/ChannelRow";
import ChannelCard from "@/components/video/ChannelCard";
import loverbballLogo from "@/assets/loverball-logo-red.png";
import {
  PRO_TEAMS,
  COLLEGE_TEAMS,
  CREATOR_CHANNELS,
  LOVERBALL_CHANNELS,
  type DiscoverChannel,
} from "@/lib/discoverChannelData";
import {
  generateChannelVideos,
  generatePlaylists,
  generateAbout,
  type ChannelVideo,
} from "@/lib/channelPageData";

const ALL_CHANNELS: DiscoverChannel[] = [
  ...PRO_TEAMS,
  ...COLLEGE_TEAMS,
  ...CREATOR_CHANNELS,
  ...LOVERBALL_CHANNELS,
];

const formatCount = (n: number) => {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
};

type VideoSort = "latest" | "popular" | "oldest";

// ─── Video Card ─────────────────────────────────────────
const VideoGridCard = ({ video }: { video: ChannelVideo }) => (
  <Link to={`/watch/video/${video.id}`}>
    <motion.div whileHover={{ scale: 1.03 }} className="group cursor-pointer">
      <div className="relative aspect-video rounded-lg overflow-hidden mb-2">
        <img
          src={video.thumbnail}
          alt={video.title}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-background/0 group-hover:bg-background/20 transition-colors" />
        <span className="absolute bottom-1.5 right-1.5 bg-background/80 text-foreground text-[10px] font-medium px-1.5 py-0.5 rounded flex items-center gap-1">
          <Clock className="w-2.5 h-2.5" />
          {video.duration}
        </span>
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="w-11 h-11 rounded-full bg-primary/90 flex items-center justify-center">
            <Play className="w-5 h-5 text-primary-foreground ml-0.5" fill="currentColor" />
          </div>
        </div>
      </div>
      <h4 className="text-sm font-medium text-foreground line-clamp-2 mb-1">{video.title}</h4>
      <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
        <span className="flex items-center gap-1">
          <Eye className="w-3 h-3" />
          {formatCount(video.views)} views
        </span>
        <span>{video.uploadDate}</span>
      </div>
      <div className="flex items-center gap-1 text-[11px] text-muted-foreground mt-0.5">
        <ThumbsUp className="w-3 h-3" />
        {formatCount(video.likes)}
      </div>
    </motion.div>
  </Link>
);

// ─── Main Page ──────────────────────────────────────────
const VideoChannel = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const channel = useMemo(
    () => ALL_CHANNELS.find((c) => c.id === id) ?? ALL_CHANNELS[0],
    [id]
  );
  const logoSrc = channel.category === "loverball" ? loverbballLogo : channel.logo;
  const coverImage =
    channel.coverImage ||
    channel.latestThumb?.replace("400", "1200").replace("225", "600") ||
    "https://images.unsplash.com/photo-1504450758-28f095a56e89?w=1200&h=600&fit=crop";

  const videos = useMemo(() => generateChannelVideos(channel.name), [channel.name]);
  const playlists = useMemo(() => generatePlaylists(channel.name), [channel.name]);
  const about = useMemo(() => generateAbout(channel), [channel]);

  const [sort, setSort] = useState<VideoSort>("latest");
  const [notifs, setNotifs] = useState(false);
  const [aboutExpanded, setAboutExpanded] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Simulate load
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useMemo(() => {
    setTimeout(() => setIsLoading(false), 400);
  }, []);

  const sortedVideos = useMemo(() => {
    const copy = [...videos];
    if (sort === "popular") copy.sort((a, b) => b.views - a.views);
    if (sort === "oldest") copy.sort((a, b) => a.uploadTimestamp - b.uploadTimestamp);
    return copy;
  }, [videos, sort]);

  // Similar channels (same category, exclude self)
  const similarChannels = useMemo(
    () =>
      ALL_CHANNELS.filter(
        (c) => c.category === channel.category && c.id !== channel.id
      ).slice(0, 10),
    [channel]
  );

  const handleShare = async () => {
    const url = `${window.location.origin}/watch/channel/${channel.id}`;
    if (navigator.share) {
      await navigator.share({ title: channel.name, url });
    } else {
      await navigator.clipboard.writeText(url);
    }
  };

  return (
    <div className="min-h-screen pb-20 md:pb-6">
      {/* Banner */}
      <div className="relative h-48 md:h-64">
        {isLoading ? (
          <Skeleton className="w-full h-full bg-secondary" />
        ) : (
          <>
            <img src={coverImage} alt="" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
          </>
        )}
        {/* Back button */}
        <button
          onClick={() => navigate(-1)}
          className="absolute top-3 left-3 z-10 w-9 h-9 rounded-full bg-background/60 backdrop-blur-sm flex items-center justify-center"
        >
          <ArrowLeft className="w-4 h-4 text-foreground" />
        </button>
        {/* Share */}
        <button
          onClick={handleShare}
          className="absolute top-3 right-3 z-10 w-9 h-9 rounded-full bg-background/60 backdrop-blur-sm flex items-center justify-center"
        >
          <Share2 className="w-4 h-4 text-foreground" />
        </button>
      </div>

      {/* Channel header info */}
      <div className="px-4 md:px-8 -mt-10 relative z-10">
        <div className="flex items-end gap-4">
          {isLoading ? (
            <Skeleton className="w-20 h-20 rounded-full bg-secondary" />
          ) : (
            <img
              src={logoSrc}
              alt={channel.name}
              className="w-20 h-20 rounded-full object-contain bg-background border-4 border-background"
              onError={(e) => {
                (e.target as HTMLImageElement).src = loverbballLogo;
              }}
            />
          )}
          <div className="flex-1 min-w-0 pb-1">
            <div className="flex items-center gap-2">
              <h1 className="text-xl md:text-2xl font-bold text-foreground truncate">
                {channel.name}
              </h1>
              {channel.verified && (
                <CheckCircle className="w-5 h-5 text-primary flex-shrink-0" />
              )}
            </div>
            <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
              <span>{formatCount(channel.followers)} followers</span>
              <span>{videos.length} videos</span>
              <span className="bg-primary/10 text-primary font-bold px-2 py-0.5 rounded-full text-[10px]">
                {channel.sportBadge}
              </span>
            </div>
          </div>
        </div>

        {/* Actions row */}
        <div className="flex items-center gap-3 mt-4">
          <FollowButton />
          <button
            onClick={() => setNotifs(!notifs)}
            className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors ${
              notifs
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-muted-foreground hover:text-foreground"
            }`}
          >
            {notifs ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
          </button>
          <button
            onClick={handleShare}
            className="w-9 h-9 rounded-full bg-secondary text-muted-foreground hover:text-foreground flex items-center justify-center transition-colors"
          >
            <Share2 className="w-4 h-4" />
          </button>
        </div>

        {/* About snippet */}
        <div className="mt-4">
          <p className={`text-sm text-muted-foreground ${aboutExpanded ? "" : "line-clamp-2"}`}>
            {channel.description}
          </p>
          <button
            onClick={() => setAboutExpanded(!aboutExpanded)}
            className="flex items-center gap-1 text-xs text-primary mt-1"
          >
            {aboutExpanded ? (
              <>
                Show less <ChevronUp className="w-3 h-3" />
              </>
            ) : (
              <>
                More <ChevronDown className="w-3 h-3" />
              </>
            )}
          </button>

          {/* Tags */}
          {channel.tags && (
            <div className="flex gap-2 mt-3 flex-wrap">
              {channel.tags.map((tag) => (
                <span
                  key={tag}
                  className="text-[10px] text-muted-foreground bg-secondary px-2 py-1 rounded-full"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="videos" className="mt-6">
        <TabsList className="mx-4 md:mx-8 bg-secondary/50">
          <TabsTrigger value="videos" className="text-xs">
            Videos
          </TabsTrigger>
          <TabsTrigger value="playlists" className="text-xs">
            Playlists
          </TabsTrigger>
          <TabsTrigger value="about" className="text-xs">
            About
          </TabsTrigger>
        </TabsList>

        {/* ─── VIDEOS TAB ─── */}
        <TabsContent value="videos" className="px-4 md:px-8 mt-4">
          {/* Sort pills */}
          <div className="flex gap-2 mb-4">
            {(["latest", "popular", "oldest"] as VideoSort[]).map((s) => (
              <button
                key={s}
                onClick={() => setSort(s)}
                className={`px-3 py-1 rounded-full text-xs font-medium capitalize transition-colors ${
                  sort === s
                    ? "bg-foreground text-background"
                    : "bg-secondary text-muted-foreground hover:bg-secondary/80"
                }`}
              >
                {s === "popular" ? "Most Popular" : s}
              </button>
            ))}
          </div>

          {isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {[...Array(10)].map((_, i) => (
                <div key={i}>
                  <Skeleton className="aspect-video rounded-lg bg-secondary mb-2" />
                  <Skeleton className="h-4 w-3/4 bg-secondary mb-1" />
                  <Skeleton className="h-3 w-1/2 bg-secondary" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {sortedVideos.map((v) => (
                <VideoGridCard key={v.id} video={v} />
              ))}
            </div>
          )}
        </TabsContent>

        {/* ─── PLAYLISTS TAB ─── */}
        <TabsContent value="playlists" className="px-4 md:px-8 mt-4">
          <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-2">
            {playlists.map((pl) => (
              <div
                key={pl.id}
                className="flex-shrink-0 w-[260px] md:w-[300px] group cursor-pointer"
              >
                <div className="relative aspect-video rounded-lg overflow-hidden mb-2">
                  <img
                    src={pl.thumbnail}
                    alt={pl.name}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
                  <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between">
                    <span className="text-xs text-foreground font-medium flex items-center gap-1">
                      <ListVideo className="w-3.5 h-3.5" />
                      {pl.videoCount} videos
                    </span>
                    <span className="text-[10px] text-foreground/70">{pl.totalDuration}</span>
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="w-11 h-11 rounded-full bg-primary/90 flex items-center justify-center">
                      <Play className="w-5 h-5 text-primary-foreground ml-0.5" fill="currentColor" />
                    </div>
                  </div>
                </div>
                <h3 className="text-sm font-bold text-foreground truncate">{pl.name}</h3>
              </div>
            ))}
          </div>
        </TabsContent>

        {/* ─── ABOUT TAB ─── */}
        <TabsContent value="about" className="px-4 md:px-8 mt-4">
          <div className="max-w-2xl space-y-6">
            <div>
              <h3 className="text-sm font-bold text-foreground mb-2">Description</h3>
              <p className="text-sm text-muted-foreground whitespace-pre-line">
                {about.fullDescription}
              </p>
            </div>

            {about.uploadSchedule && (
              <div>
                <h3 className="text-sm font-bold text-foreground mb-1">Upload Schedule</h3>
                <p className="text-sm text-muted-foreground">{about.uploadSchedule}</p>
              </div>
            )}

            <div>
              <h3 className="text-sm font-bold text-foreground mb-1">Channel Created</h3>
              <p className="text-sm text-muted-foreground">{about.createdDate}</p>
            </div>

            {about.contactEmail && (
              <div>
                <h3 className="text-sm font-bold text-foreground mb-1">Contact</h3>
                <p className="text-sm text-muted-foreground">{about.contactEmail}</p>
              </div>
            )}

            {about.website && (
              <div>
                <h3 className="text-sm font-bold text-foreground mb-1">Website</h3>
                <a
                  href={about.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-primary flex items-center gap-1"
                >
                  {about.website} <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            )}

            {about.socialLinks && (
              <div>
                <h3 className="text-sm font-bold text-foreground mb-2">Social</h3>
                <div className="flex gap-3 flex-wrap">
                  {about.socialLinks.map((link) => (
                    <a
                      key={link.platform}
                      href={link.url}
                      className="text-xs text-muted-foreground bg-secondary px-3 py-1.5 rounded-full hover:text-foreground transition-colors"
                    >
                      {link.platform}
                    </a>
                  ))}
                </div>
              </div>
            )}

            {about.sponsors && about.sponsors.length > 0 && (
              <div>
                <h3 className="text-sm font-bold text-foreground mb-2">Partners & Sponsors</h3>
                <div className="flex gap-3 flex-wrap">
                  {about.sponsors.map((s) => (
                    <span
                      key={s}
                      className="text-xs text-muted-foreground bg-secondary px-3 py-1.5 rounded-full"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Similar Channels */}
      {similarChannels.length > 0 && (
        <div className="mt-10">
          <ChannelRow title="Similar Channels" onSeeAll={() => navigate("/watch/discover")}>
            {similarChannels.map((ch) => (
              <div key={ch.id} onClick={() => navigate(`/watch/channel/${ch.id}`)}>
                <ChannelCard channel={ch} variant={ch.category === "creator" ? "creator" : "team"} />
              </div>
            ))}
          </ChannelRow>
        </div>
      )}
    </div>
  );
};

export default VideoChannel;

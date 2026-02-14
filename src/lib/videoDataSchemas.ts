// ─── Comprehensive Video & User Data Schemas ────────────
// Types and mock generators for videos, users, and preferences

import { FEED_VIDEOS, type FeedVideoItem } from "@/lib/feedVideoData";
import { MOCK_VIDEOS, type VideoItem } from "@/lib/mockVideoData";

// ─── TYPES ──────────────────────────────────────────────

export interface VideoSchema {
  videoId: string;
  channelId: string;
  channelName: string;
  channelAvatar: string;
  channelVerified: boolean;

  title: string;
  description: string;

  videoUrl: string;
  thumbnail: string;

  duration: number; // seconds
  resolution: string;
  format: string;

  views: number;
  likes: number;
  dislikes: number;
  shares: number;

  uploadedAt: string;
  publishedAt: string;

  category: VideoCategory;
  sport: string;
  tags: string[];

  privacy: "public" | "unlisted" | "private";
  ageRestriction: boolean;
  allowLikes: boolean;
  allowShares: boolean;

  captions: { language: string; url: string }[];
  qualityOptions: { quality: string; url: string }[];

  analytics: {
    avgWatchTime: number;
    completionRate: number;
    engagementRate: number;
  };
}

export type VideoCategory =
  | "highlights"
  | "full_game"
  | "analysis"
  | "training"
  | "behind_the_scenes"
  | "interviews"
  | "vlogs"
  | "documentaries"
  | "tutorials"
  | "live"
  | "news"
  | "entertainment";

export interface UserPreferences {
  autoPlay: boolean;
  defaultQuality: "auto" | "1080p" | "720p" | "480p" | "360p";
  dataUsage: "wifi_only" | "always" | "ask";
  playbackSpeed: number;
  closedCaptions: boolean;
  notifications: {
    newVideos: boolean;
    liveStreams: boolean;
    channelUpdates: boolean;
  };
}

export interface WatchHistoryEntry {
  videoId: string;
  watchedAt: string;
  watchDuration: number; // seconds
  totalDuration: number;
  completed: boolean;
  lastPosition: number;
}

export interface UserVideoProfile {
  userId: string;
  followedChannels: string[];
  likedVideos: string[];
  dislikedVideos: string[];
  savedVideos: string[];
  watchHistory: WatchHistoryEntry[];
  preferences: UserPreferences;
}

// ─── DEFAULTS ───────────────────────────────────────────

export const DEFAULT_USER_PREFERENCES: UserPreferences = {
  autoPlay: true,
  defaultQuality: "auto",
  dataUsage: "wifi_only",
  playbackSpeed: 1,
  closedCaptions: false,
  notifications: {
    newVideos: true,
    liveStreams: true,
    channelUpdates: false,
  },
};

export const DEFAULT_USER_VIDEO_PROFILE: UserVideoProfile = {
  userId: "",
  followedChannels: ["loverball", "court-vision", "skill-school"],
  likedVideos: [],
  dislikedVideos: [],
  savedVideos: [],
  watchHistory: [],
  preferences: DEFAULT_USER_PREFERENCES,
};

// ─── CONVERTERS ─────────────────────────────────────────

/** Convert existing FeedVideoItem to full VideoSchema */
export const feedVideoToSchema = (video: FeedVideoItem): VideoSchema => ({
  videoId: video.id,
  channelId: video.channelId,
  channelName: video.channelName,
  channelAvatar: video.channelAvatar,
  channelVerified: true,
  title: video.title,
  description: video.description,
  videoUrl: video.videoUrl,
  thumbnail: video.thumbnail,
  duration: video.duration,
  resolution: "1080p",
  format: "mp4",
  views: video.views,
  likes: video.likes,
  dislikes: Math.floor(video.likes * 0.03),
  shares: Math.floor(video.views * 0.01),
  uploadedAt: video.uploadDate,
  publishedAt: video.uploadDate,
  category: "highlights",
  sport: video.tags[0] || "multi-sport",
  tags: video.tags,
  privacy: "public",
  ageRestriction: false,
  allowLikes: true,
  allowShares: true,
  captions: [],
  qualityOptions: [
    { quality: "1080p", url: video.videoUrl },
    { quality: "720p", url: video.videoUrl },
    { quality: "480p", url: video.videoUrl },
  ],
  analytics: {
    avgWatchTime: Math.floor(video.duration * 0.73),
    completionRate: 0.73,
    engagementRate: video.likes / video.views,
  },
});

/** Convert existing VideoItem (mock) to full VideoSchema */
export const mockVideoToSchema = (video: VideoItem): VideoSchema => {
  const durationParts = video.duration.split(":").map(Number);
  const durationSec = (durationParts[0] || 0) * 60 + (durationParts[1] || 0);

  return {
    videoId: video.id,
    channelId: video.channelName.toLowerCase().replace(/\s+/g, "-"),
    channelName: video.channelName,
    channelAvatar: video.channelAvatar,
    channelVerified: true,
    title: video.title,
    description: `Watch ${video.title} from ${video.channelName}. The best sports content on Loverball Watch.`,
    videoUrl: video.videoUrl,
    thumbnail: video.thumbnail,
    duration: durationSec,
    resolution: "1080p",
    format: "mp4",
    views: video.views,
    likes: video.likes,
    dislikes: Math.floor(video.likes * 0.02),
    shares: Math.floor(video.views * 0.008),
    uploadedAt: "2026-02-01T12:00:00Z",
    publishedAt: "2026-02-01T12:00:00Z",
    category: video.category.toLowerCase().replace(/\s+/g, "_") as VideoCategory,
    sport: "multi-sport",
    tags: [video.category.toLowerCase()],
    privacy: "public",
    ageRestriction: false,
    allowLikes: true,
    allowShares: true,
    captions: [],
    qualityOptions: [
      { quality: "1080p", url: video.videoUrl },
      { quality: "720p", url: video.videoUrl },
    ],
    analytics: {
      avgWatchTime: Math.floor(durationSec * 0.65),
      completionRate: 0.65,
      engagementRate: video.likes / video.views,
    },
  };
};

// ─── LOVERBALL FLAGSHIP CHANNEL ─────────────────────────

export const LOVERBALL_CHANNEL = {
  channelId: "loverball",
  type: "creator" as const,
  sport: "multi-sport" as const,
  name: "Loverball",
  handle: "@loverball",
  avatar: "",  // Uses logo import
  banner: "",
  description: "Your home for the best sports content. Official Loverball network — where sports meets culture, community, and creativity.",
  verified: true,
  followers: 5_000_000,
  totalVideos: 342,
  totalViews: 890_000_000,
  totalLikes: 67_000_000,
  location: "Los Angeles, CA",
  founded: 2025,
  brandColors: {
    primary: "#DA3A2B",
    accent: "#FDB927",
  },
  socialLinks: {
    website: "https://loverball.com",
    twitter: "@loverball",
    instagram: "@loverball",
    tiktok: "@loverball",
    youtube: "@loverball",
  },
  category: "sports_media",
  tags: ["sports", "culture", "community", "los angeles", "basketball", "football", "soccer"],
  uploadSchedule: "New content daily",
  contactEmail: "media@loverball.com",
  admins: ["admin_001"],
  createdAt: "2025-06-01",
  featured: true,
};

// ─── CREATOR CHANNELS ───────────────────────────────────

export const CREATOR_CHANNEL_DATA = [
  {
    channelId: "coach_mike",
    name: "Coach Mike's Basketball Academy",
    type: "creator" as const,
    handle: "@coachmike",
    description: "Professional basketball training tips, drills, and coaching insights. 20+ years experience.",
    sport: "basketball",
    followers: 340_000,
    totalVideos: 287,
    tags: ["training", "basketball", "coaching", "drills"],
  },
  {
    channelId: "sports_analyst",
    name: "The Sports Breakdown",
    type: "creator" as const,
    handle: "@sportsbreakdown",
    description: "In-depth game analysis, predictions, and advanced analytics across all major sports.",
    sport: "multi-sport",
    followers: 890_000,
    totalVideos: 456,
    tags: ["analysis", "predictions", "stats", "fantasy"],
  },
  {
    channelId: "fit_athlete",
    name: "Fit Athlete",
    type: "creator" as const,
    handle: "@fitathlete",
    description: "Workout routines, meal plans, and recovery tips from professional athletes.",
    sport: "multi-sport",
    followers: 1_200_000,
    totalVideos: 189,
    tags: ["fitness", "workout", "nutrition", "recovery"],
  },
  {
    channelId: "streetball_legends",
    name: "Streetball Legends",
    type: "creator" as const,
    handle: "@streetball",
    description: "The best streetball, pickup games, and And1 mixtape-style content from courts around the world.",
    sport: "basketball",
    followers: 2_100_000,
    totalVideos: 534,
    tags: ["streetball", "and1", "pickup", "highlights"],
  },
  {
    channelId: "soccer_daily",
    name: "Soccer Daily",
    type: "creator" as const,
    handle: "@soccerdaily",
    description: "Daily soccer news, transfer rumors, match previews, and highlights from around the globe.",
    sport: "soccer",
    followers: 3_400_000,
    totalVideos: 1_200,
    tags: ["soccer", "football", "transfers", "premier league", "la liga"],
  },
  {
    channelId: "womens_sports_hub",
    name: "Women's Sports Hub",
    type: "creator" as const,
    handle: "@wsportshub",
    description: "Elevating women's sports coverage. WNBA, NWSL, college, and more.",
    sport: "multi-sport",
    followers: 560_000,
    totalVideos: 312,
    tags: ["women's sports", "wnba", "nwsl", "title ix", "equality"],
  },
];

// ─── VIDEO CATEGORIES ───────────────────────────────────

export const VIDEO_CATEGORY_OPTIONS: { value: VideoCategory; label: string; icon: string }[] = [
  { value: "highlights", label: "Highlights", icon: "⚡" },
  { value: "full_game", label: "Full Game", icon: "🎮" },
  { value: "analysis", label: "Analysis", icon: "📊" },
  { value: "training", label: "Training", icon: "💪" },
  { value: "behind_the_scenes", label: "Behind the Scenes", icon: "🎬" },
  { value: "interviews", label: "Interviews", icon: "🎤" },
  { value: "vlogs", label: "Vlogs", icon: "📹" },
  { value: "documentaries", label: "Documentaries", icon: "🎥" },
  { value: "tutorials", label: "Tutorials", icon: "📚" },
  { value: "live", label: "Live", icon: "🔴" },
  { value: "news", label: "News", icon: "📰" },
  { value: "entertainment", label: "Entertainment", icon: "🎭" },
];

// ─── SPORT OPTIONS ──────────────────────────────────────

export const SPORT_OPTIONS = [
  "Basketball", "Football", "Baseball", "Soccer", "Hockey",
  "Tennis", "Golf", "Volleyball", "Track & Field", "Swimming",
  "Boxing", "MMA", "Wrestling", "Lacrosse", "Rugby",
  "Cricket", "Esports", "Skateboarding", "Surfing", "Other",
];

// ─── MOCK VIDEO GENERATOR ───────────────────────────────

const thumbBase = "https://images.unsplash.com/photo-";
const THUMB_IDS = [
  "1504450758-28f095a56e89", "1546519638-68e109498ffc",
  "1574629810360-7efbbe195018", "1579952363873-27f3bade9f55",
  "1461896836934-bd45ea8b2c58", "1517649763962-0c623066013b",
  "1571019613454-1cb2f99b2d8b", "1431324155629-1a6deb1dec8d",
];

/** Generate N mock videos for a given channel */
export const generateMockVideos = (
  channelId: string,
  channelName: string,
  channelAvatar: string,
  count: number = 20
): VideoSchema[] => {
  const titles = [
    `${channelName} | Top 10 Plays of the Week`,
    `Game Day Highlights vs. Rivals`,
    `Behind the Scenes: Practice Day`,
    `Pre-Game Hype | ${channelName}`,
    `Post-Game Recap & Analysis`,
    `${channelName} Season Preview 2026`,
    `Locker Room Access | Exclusive`,
    `Draft Day Reactions & Breakdown`,
    `Fan Cam: Best Moments This Month`,
    `Player Spotlight: Rising Stars`,
    `${channelName} vs. All-Stars`,
    `Training Camp Day 1 Vlog`,
    `Road Trip Diaries | Away Game`,
    `Community Day Recap`,
    `Press Conference Highlights`,
    `Mic'd Up: On The Field`,
    `Top 50 Plays All-Time`,
    `Rookie Showcase | New Talent`,
    `Championship Chase | Episode 3`,
    `Fan Q&A with the Squad`,
    `Late Night Training Session`,
    `Warm-Up Routine Breakdown`,
    `Rivalry Week Special`,
    `Trophy Room Tour`,
    `Best Celebrations of the Season`,
  ];

  return titles.slice(0, count).map((title, i) => {
    const dur = Math.floor(Math.random() * 900) + 30;
    const views = Math.floor(Math.random() * 1_000_000) + 1_000;
    const likes = Math.floor(views * (0.03 + Math.random() * 0.07));
    return {
      videoId: `${channelId}_vid_${i}`,
      channelId,
      channelName,
      channelAvatar,
      channelVerified: true,
      title,
      description: `Watch ${title} — the best content from ${channelName} on Loverball Watch.`,
      videoUrl: "",
      thumbnail: `${thumbBase}${THUMB_IDS[i % THUMB_IDS.length]}?w=640&h=360&fit=crop`,
      duration: dur,
      resolution: "1080p",
      format: "mp4",
      views,
      likes,
      dislikes: Math.floor(likes * 0.03),
      shares: Math.floor(views * 0.01),
      uploadedAt: new Date(Date.now() - i * 86_400_000 * 2).toISOString(),
      publishedAt: new Date(Date.now() - i * 86_400_000 * 2).toISOString(),
      category: (["highlights", "behind_the_scenes", "analysis", "vlogs", "training"] as VideoCategory[])[i % 5],
      sport: "multi-sport",
      tags: [channelName.toLowerCase().split(" ")[0], "highlights", "sports"],
      privacy: "public",
      ageRestriction: false,
      allowLikes: true,
      allowShares: true,
      captions: [],
      qualityOptions: [
        { quality: "1080p", url: "" },
        { quality: "720p", url: "" },
      ],
      analytics: {
        avgWatchTime: Math.floor(dur * 0.65),
        completionRate: 0.6 + Math.random() * 0.3,
        engagementRate: likes / views,
      },
    };
  });
};

// ─── COMBINED ALL VIDEOS ────────────────────────────────

/** All feed + mock videos as unified schemas */
export const getAllVideoSchemas = (): VideoSchema[] => [
  ...FEED_VIDEOS.map(feedVideoToSchema),
  ...MOCK_VIDEOS.map(mockVideoToSchema),
];

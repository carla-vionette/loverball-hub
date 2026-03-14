import feedVideo29 from "@/assets/feed-video-29.mp4";
import feedVideo30 from "@/assets/feed-video-30.mp4";
import feedVideo31 from "@/assets/feed-video-31.mp4";
import feedVideo32 from "@/assets/feed-video-32.mp4";
import feedVideo33 from "@/assets/feed-video-33.mp4";
import feedVideo34 from "@/assets/feed-video-34.mp4";
import feedVideo35 from "@/assets/feed-video-35.mp4";
import feedVideo36 from "@/assets/feed-video-36.mp4";
import feedVideo37 from "@/assets/feed-video-37.mov";
import feedVideo43 from "@/assets/feed-video-43.mp4";
import feedVideo44 from "@/assets/feed-video-44.mp4";
import feedVideo45 from "@/assets/feed-video-45.mp4";

import loverballLogo from "@/assets/loverball-script-logo.png";

export interface FeedVideoItem {
  id: string;
  channelId: string;
  channelName: string;
  channelAvatar: string;
  videoUrl: string;
  thumbnail: string;
  title: string;
  description: string;
  duration: number;
  likes: number;
  views: number;
  uploadDate: string;
  tags: string[];
  isFollowing?: boolean;
}

export const FEED_VIDEOS: FeedVideoItem[] = [
  {
    id: "feed_29",
    channelId: "loverball",
    channelName: "Loverball",
    channelAvatar: loverballLogo,
    videoUrl: feedVideo29,
    thumbnail: "",
    title: "Court Culture 🏀",
    description: "The energy is unmatched. This is what we live for.",
    duration: 30,
    likes: 8400,
    views: 142000,
    uploadDate: "2026-02-17",
    tags: ["culture", "basketball", "vibes"],
    isFollowing: true,
  },
  {
    id: "feed_30",
    channelId: "fan-life",
    channelName: "Fan Life",
    channelAvatar: loverballLogo,
    videoUrl: feedVideo30,
    thumbnail: "",
    title: "Game Day Ready 🔥",
    description: "From tailgate to tip-off, we don't miss.",
    duration: 28,
    likes: 6100,
    views: 98000,
    uploadDate: "2026-02-17",
    tags: ["gameday", "fans", "lifestyle"],
  },
  {
    id: "feed_31",
    channelId: "court-vision",
    channelName: "Court Vision",
    channelAvatar: loverballLogo,
    videoUrl: feedVideo31,
    thumbnail: "",
    title: "Highlight Reel — Best Plays 🎯",
    description: "You won't believe how this one ended.",
    duration: 35,
    likes: 11200,
    views: 187000,
    uploadDate: "2026-02-17",
    tags: ["highlights", "plays", "sports"],
  },
  {
    id: "feed_32",
    channelId: "skill-school",
    channelName: "Skill School",
    channelAvatar: loverballLogo,
    videoUrl: feedVideo32,
    thumbnail: "",
    title: "Level Up Your Game 💪",
    description: "Train different. Play different.",
    duration: 40,
    likes: 7300,
    views: 121000,
    uploadDate: "2026-02-17",
    tags: ["skills", "training", "tips"],
  },
  {
    id: "feed_33",
    channelId: "inside-game",
    channelName: "Inside the Game",
    channelAvatar: loverballLogo,
    videoUrl: feedVideo33,
    thumbnail: "",
    title: "Behind the Scenes 🎬",
    description: "Exclusive access you won't find anywhere else.",
    duration: 33,
    likes: 5900,
    views: 94000,
    uploadDate: "2026-02-17",
    tags: ["behind-the-scenes", "access", "exclusive"],
  },
  {
    id: "feed_34",
    channelId: "loverball",
    channelName: "Loverball",
    channelAvatar: loverballLogo,
    videoUrl: feedVideo34,
    thumbnail: "",
    title: "Community Vibes — Together We Play",
    description: "Real people. Real moments. That's what it's about.",
    duration: 30,
    likes: 9500,
    views: 168000,
    uploadDate: "2026-02-17",
    tags: ["community", "lifestyle"],
    isFollowing: true,
  },
  {
    id: "feed_35",
    channelId: "loverball",
    channelName: "Loverball",
    channelAvatar: loverballLogo,
    videoUrl: feedVideo35,
    thumbnail: "",
    title: "Pure Energy ⚡",
    description: "When the crowd hits different. You had to be there.",
    duration: 32,
    likes: 7800,
    views: 134000,
    uploadDate: "2026-02-17",
    tags: ["energy", "fans", "vibes"],
    isFollowing: true,
  },
  {
    id: "feed_36",
    channelId: "court-vision",
    channelName: "Court Vision",
    channelAvatar: loverballLogo,
    videoUrl: feedVideo36,
    thumbnail: "",
    title: "Next Up 🌟",
    description: "Keep your eyes on this one. Star in the making.",
    duration: 28,
    likes: 6500,
    views: 112000,
    uploadDate: "2026-02-17",
    tags: ["rising", "talent", "sports"],
  },
  {
    id: "feed_37",
    channelId: "fan-life",
    channelName: "Fan Life",
    channelAvatar: loverballLogo,
    videoUrl: feedVideo37,
    thumbnail: "",
    title: "Sideline Stories 📖",
    description: "The moments between the moments. That's the real game.",
    duration: 35,
    likes: 5400,
    views: 89000,
    uploadDate: "2026-02-17",
    tags: ["stories", "lifestyle", "culture"],
  },
  {
    id: "feed_43",
    channelId: "loverball",
    channelName: "Loverball",
    channelAvatar: loverballLogo,
    videoUrl: feedVideo43,
    thumbnail: "",
    title: "Run It Back 🏃‍♀️",
    description: "No days off. The grind speaks for itself.",
    duration: 34,
    likes: 7100,
    views: 119000,
    uploadDate: "2026-03-12",
    tags: ["fitness", "grind", "lifestyle"],
    isFollowing: true,
  },
  {
    id: "feed_44",
    channelId: "court-vision",
    channelName: "Court Vision",
    channelAvatar: loverballLogo,
    videoUrl: feedVideo44,
    thumbnail: "",
    title: "Main Character Energy ✨",
    description: "When you show up and show out. Period.",
    duration: 29,
    likes: 8800,
    views: 153000,
    uploadDate: "2026-03-13",
    tags: ["energy", "culture", "vibes"],
  },
  {
    id: "feed_45",
    channelId: "fan-life",
    channelName: "Fan Life",
    channelAvatar: loverballLogo,
    videoUrl: feedVideo45,
    thumbnail: "",
    title: "Off the Clock 🎉",
    description: "Sports after dark hits different. Trust.",
    duration: 31,
    likes: 6400,
    views: 107000,
    uploadDate: "2026-03-14",
    tags: ["nightlife", "fans", "community"],
  },
];

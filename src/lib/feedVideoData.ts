import feedVideoNew from "@/assets/feed-video-new.mov";
import feedVideo14 from "@/assets/feed-video-14.mp4";
import feedVideo15 from "@/assets/feed-video-15.mp4";
import feedVideo16 from "@/assets/feed-video-16.mp4";
import feedVideo17 from "@/assets/feed-video-17.mp4";
import feedVideo18 from "@/assets/feed-video-18.mp4";

import risingStarsThumb from "@/assets/rising-stars.jpg";
import pickupGameThumb from "@/assets/pickup-game.jpg";
import teamSpiritThumb from "@/assets/team-spirit.jpg";
import fieldDayThumb from "@/assets/field-day.jpg";
import trainingDayThumb from "@/assets/training-day.jpg";

const thumbBase = "https://images.unsplash.com/photo-";

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
    id: "feed_new",
    channelId: "fan-life",
    channelName: "Fan Life",
    channelAvatar: thumbBase + "1438761681033-6461ffad8d80?w=80&h=80&fit=crop&crop=faces",
    videoUrl: feedVideoNew,
    thumbnail: teamSpiritThumb,
    title: "Game Day Energy — Fan Life Unfiltered",
    description: "The vibes are immaculate. This is what game day is all about.",
    duration: 28,
    likes: 6200,
    views: 104000,
    uploadDate: "2026-02-16",
    tags: ["culture", "fans", "vibes"],
  },
  {
    id: "feed_14",
    channelId: "court-vision",
    channelName: "Court Vision",
    channelAvatar: thumbBase + "1494790108377-be9c29b29330?w=80&h=80&fit=crop&crop=faces",
    videoUrl: feedVideo14,
    thumbnail: pickupGameThumb,
    title: "Plays of the Week — Best Highlights 🎯",
    description: "You won't believe play #3. The best moments this week.",
    duration: 38,
    likes: 11300,
    views: 198000,
    uploadDate: "2026-02-16",
    tags: ["highlights", "plays", "sports"],
  },
  {
    id: "feed_15",
    channelId: "skill-school",
    channelName: "Skill School",
    channelAvatar: thumbBase + "1472099645785-5658abf4ff4e?w=80&h=80&fit=crop&crop=faces",
    videoUrl: feedVideo15,
    thumbnail: risingStarsThumb,
    title: "Level Up — Skills That Pay the Bills 💪",
    description: "Master these moves and watch your game transform.",
    duration: 42,
    likes: 7400,
    views: 132000,
    uploadDate: "2026-02-16",
    tags: ["skills", "training", "tips"],
  },
  {
    id: "feed_16",
    channelId: "inside-game",
    channelName: "Inside the Game",
    channelAvatar: thumbBase + "1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop&crop=faces",
    videoUrl: feedVideo16,
    thumbnail: fieldDayThumb,
    title: "Behind the Scenes — Inside Access 🎬",
    description: "What happens when the cameras aren't rolling? Now you know.",
    duration: 33,
    likes: 5800,
    views: 89000,
    uploadDate: "2026-02-16",
    tags: ["behind-the-scenes", "access", "exclusive"],
  },
  {
    id: "feed_17",
    channelId: "loverball",
    channelName: "Loverball",
    channelAvatar: thumbBase + "1535930749574-1399327ce78f?w=80&h=80&fit=crop&crop=faces",
    videoUrl: feedVideo17,
    thumbnail: trainingDayThumb,
    title: "Athletes Unleashed 🔥",
    description: "Pure athletic energy, captured frame by frame.",
    duration: 35,
    likes: 8700,
    views: 156000,
    uploadDate: "2026-02-16",
    tags: ["athletics", "lifestyle"],
    isFollowing: true,
  },
  {
    id: "feed_18",
    channelId: "loverball",
    channelName: "Loverball",
    channelAvatar: thumbBase + "1535930749574-1399327ce78f?w=80&h=80&fit=crop&crop=faces",
    videoUrl: feedVideo18,
    thumbnail: teamSpiritThumb,
    title: "Community Vibes — Together We Play",
    description: "This is what community looks like. Real people, real moments.",
    duration: 30,
    likes: 9200,
    views: 175000,
    uploadDate: "2026-02-16",
    tags: ["community", "lifestyle"],
    isFollowing: true,
  },
];

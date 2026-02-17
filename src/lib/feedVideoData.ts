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
    id: "feed_new",
    channelId: "fan-life",
    channelName: "Fan Life",
    channelAvatar: loverballLogo,
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
    channelAvatar: loverballLogo,
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
    channelAvatar: loverballLogo,
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
    channelAvatar: loverballLogo,
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
    channelAvatar: loverballLogo,
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
    channelAvatar: loverballLogo,
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

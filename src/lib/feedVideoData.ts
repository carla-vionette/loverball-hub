import feedVideoNew from "@/assets/feed-video-new.mov";
import tiktokSport1 from "@/assets/tiktok-sport-1.mov";
import tiktokSport2 from "@/assets/tiktok-sport-2.mp4";
import tiktokSport3 from "@/assets/tiktok-sport-3.mp4";
import tiktokSport4 from "@/assets/tiktok-sport-4.mp4";

import risingStarsThumb from "@/assets/rising-stars.jpg";
import pickupGameThumb from "@/assets/pickup-game.jpg";
import teamSpiritThumb from "@/assets/team-spirit.jpg";
import fieldDayThumb from "@/assets/field-day.jpg";

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
    id: "tiktok_sport_1",
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
    id: "tiktok_sport_2",
    channelId: "court-vision",
    channelName: "Court Vision",
    channelAvatar: thumbBase + "1494790108377-be9c29b29330?w=80&h=80&fit=crop&crop=faces",
    videoUrl: tiktokSport2,
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
    id: "tiktok_sport_3",
    channelId: "skill-school",
    channelName: "Skill School",
    channelAvatar: thumbBase + "1472099645785-5658abf4ff4e?w=80&h=80&fit=crop&crop=faces",
    videoUrl: tiktokSport3,
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
    id: "tiktok_sport_4",
    channelId: "inside-game",
    channelName: "Inside the Game",
    channelAvatar: thumbBase + "1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop&crop=faces",
    videoUrl: tiktokSport4,
    thumbnail: fieldDayThumb,
    title: "Behind the Scenes — Inside Access 🎬",
    description: "What happens when the cameras aren't rolling? Now you know.",
    duration: 33,
    likes: 5800,
    views: 89000,
    uploadDate: "2026-02-16",
    tags: ["behind-the-scenes", "access", "exclusive"],
  },
];

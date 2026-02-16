import soraSoccer from "@/assets/sora-soccer.mp4";
import soraTennis from "@/assets/sora-tennis.mp4";
import soraBasketball from "@/assets/sora-basketball.mp4";
import soraSport4 from "@/assets/sora-sport-4.mp4";
import tiktokSport1 from "@/assets/tiktok-sport-1.mov";
import tiktokSport2 from "@/assets/tiktok-sport-2.mp4";
import tiktokSport3 from "@/assets/tiktok-sport-3.mp4";
import tiktokSport4 from "@/assets/tiktok-sport-4.mp4";

import risingStarsThumb from "@/assets/rising-stars.jpg";
import pickupGameThumb from "@/assets/pickup-game.jpg";
import trainingDayThumb from "@/assets/training-day.jpg";
import teamSpiritThumb from "@/assets/team-spirit.jpg";
import fullCourtThumb from "@/assets/full-court-press.jpg";
import sunsetVolleyballThumb from "@/assets/sunset-volleyball.jpg";
import contentBasketballThumb from "@/assets/content-basketball.jpg";
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
    videoUrl: tiktokSport1,
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
  {
    id: "loverball_soccer",
    channelId: "loverball",
    channelName: "Loverball",
    channelAvatar: thumbBase + "1535930749574-1399327ce78f?w=80&h=80&fit=crop&crop=faces",
    videoUrl: soraSoccer,
    thumbnail: sunsetVolleyballThumb,
    title: "Beautiful Game — Soccer in Slow Motion ⚽",
    description: "The art of the pitch. Cinematic beauty meets the beautiful game.",
    duration: 30,
    likes: 12400,
    views: 245000,
    uploadDate: "2026-02-16",
    tags: ["soccer", "cinematic"],
    isFollowing: true,
  },
  {
    id: "loverball_tennis",
    channelId: "loverball",
    channelName: "Loverball",
    channelAvatar: thumbBase + "1535930749574-1399327ce78f?w=80&h=80&fit=crop&crop=faces",
    videoUrl: soraTennis,
    thumbnail: fullCourtThumb,
    title: "Match Point — Tennis Reimagined 🎾",
    description: "Every rally tells a story. Cinematic tennis like you've never seen.",
    duration: 28,
    likes: 9800,
    views: 189000,
    uploadDate: "2026-02-16",
    tags: ["tennis", "cinematic"],
    isFollowing: true,
  },
  {
    id: "loverball_basketball",
    channelId: "loverball",
    channelName: "Loverball",
    channelAvatar: thumbBase + "1535930749574-1399327ce78f?w=80&h=80&fit=crop&crop=faces",
    videoUrl: soraBasketball,
    thumbnail: contentBasketballThumb,
    title: "Above the Rim — Basketball Dreams 🏀",
    description: "Where gravity meets grace. Pure hoops cinema.",
    duration: 32,
    likes: 15200,
    views: 312000,
    uploadDate: "2026-02-16",
    tags: ["basketball", "cinematic"],
    isFollowing: true,
  },
  {
    id: "loverball_sport_4",
    channelId: "loverball-originals",
    channelName: "Loverball Originals",
    channelAvatar: thumbBase + "1535930749574-1399327ce78f?w=80&h=80&fit=crop&crop=faces",
    videoUrl: soraSport4,
    thumbnail: trainingDayThumb,
    title: "In Motion — Athletes Unleashed 🔥",
    description: "Pure athletic energy, captured frame by frame.",
    duration: 35,
    likes: 8700,
    views: 156000,
    uploadDate: "2026-02-16",
    tags: ["athletics", "cinematic"],
  },
];

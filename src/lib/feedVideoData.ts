import colorCoverageVideo from "@/assets/color-coverage-video.mp4";
import colorCoverageVideo2 from "@/assets/color-coverage-video-2.mp4";
import matchPointVideo from "@/assets/match-point-video.mp4";
import playMeVideo from "@/assets/play-me-video.mp4";
import risingStarsVideo from "@/assets/rising-stars-video.mp4";
import feedVideo1 from "@/assets/feed-video-1.mp4";
import feedVideo2 from "@/assets/feed-video-2.mp4";
import feedVideo3 from "@/assets/feed-video-3.mp4";
import feedVideo4 from "@/assets/feed-video-4.mp4";
import feedVideo5 from "@/assets/feed-video-5.mov";

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
  duration: number; // seconds
  likes: number;
  views: number;
  uploadDate: string;
  tags: string[];
  isFollowing?: boolean;
}

export const FEED_VIDEOS: FeedVideoItem[] = [
  {
    id: "feed_001",
    channelId: "loverball",
    channelName: "Loverball",
    channelAvatar: thumbBase + "1535930749574-1399327ce78f?w=80&h=80&fit=crop&crop=faces",
    videoUrl: feedVideo1,
    thumbnail: risingStarsThumb,
    title: "Color Coverage — Game Day Energy 🏀🔥",
    description: "The culture, the fits, the game. This is what sports fandom looks like.",
    duration: 30,
    likes: 4520,
    views: 89000,
    uploadDate: "2026-02-12",
    tags: ["basketball", "culture", "fashion"],
    isFollowing: true,
  },
  {
    id: "feed_002",
    channelId: "court-vision",
    channelName: "Court Vision",
    channelAvatar: thumbBase + "1494790108377-be9c29b29330?w=80&h=80&fit=crop&crop=faces",
    videoUrl: feedVideo2,
    thumbnail: fullCourtThumb,
    title: "Match Point — When Everything's on the Line",
    description: "The most clutch moments from this week's biggest games.",
    duration: 45,
    likes: 12300,
    views: 234000,
    uploadDate: "2026-02-11",
    tags: ["highlights", "clutch", "tennis"],
  },
  {
    id: "feed_003",
    channelId: "skill-school",
    channelName: "Skill School",
    channelAvatar: thumbBase + "1472099645785-5658abf4ff4e?w=80&h=80&fit=crop&crop=faces",
    videoUrl: feedVideo3,
    thumbnail: pickupGameThumb,
    title: "Play Me — 1v1 Challenge Accepted 🎯",
    description: "Think you got handles? Watch and learn from the best.",
    duration: 38,
    likes: 8900,
    views: 156000,
    uploadDate: "2026-02-10",
    tags: ["basketball", "skills", "1v1"],
    isFollowing: true,
  },
  {
    id: "feed_004",
    channelId: "loverball-originals",
    channelName: "Loverball Originals",
    channelAvatar: thumbBase + "1535930749574-1399327ce78f?w=80&h=80&fit=crop&crop=faces",
    videoUrl: feedVideo4,
    thumbnail: trainingDayThumb,
    title: "Rising Stars — Next Gen Athletes",
    description: "Meet the young athletes changing the game in LA.",
    duration: 52,
    likes: 15600,
    views: 312000,
    uploadDate: "2026-02-09",
    tags: ["documentary", "athletes", "LA"],
  },
  {
    id: "feed_005",
    channelId: "fan-life",
    channelName: "Fan Life",
    channelAvatar: thumbBase + "1438761681033-6461ffad8d80?w=80&h=80&fit=crop&crop=faces",
    videoUrl: feedVideo5,
    thumbnail: teamSpiritThumb,
    title: "Color Coverage Vol. 2 — Courtside Edition",
    description: "The best fits and moments from courtside this season.",
    duration: 28,
    likes: 3400,
    views: 67000,
    uploadDate: "2026-02-08",
    tags: ["fashion", "courtside", "culture"],
  },
  {
    id: "feed_006",
    channelId: "inside-game",
    channelName: "Inside the Game",
    channelAvatar: thumbBase + "1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop&crop=faces",
    videoUrl: colorCoverageVideo,
    thumbnail: sunsetVolleyballThumb,
    title: "Beach Volleyball Finals — Sunset Session",
    description: "The golden hour hits different when the game is this good.",
    duration: 40,
    likes: 6700,
    views: 98000,
    uploadDate: "2026-02-07",
    tags: ["volleyball", "beach", "sunset"],
  },
  {
    id: "feed_007",
    channelId: "court-vision",
    channelName: "Court Vision",
    channelAvatar: thumbBase + "1494790108377-be9c29b29330?w=80&h=80&fit=crop&crop=faces",
    videoUrl: matchPointVideo,
    thumbnail: contentBasketballThumb,
    title: "Full Court Press — Defensive Masterclass",
    description: "Breaking down the most elite defensive plays of the season.",
    duration: 35,
    likes: 9200,
    views: 178000,
    uploadDate: "2026-02-06",
    tags: ["basketball", "defense", "analysis"],
    isFollowing: true,
  },
  {
    id: "feed_008",
    channelId: "skill-school",
    channelName: "Skill School",
    channelAvatar: thumbBase + "1472099645785-5658abf4ff4e?w=80&h=80&fit=crop&crop=faces",
    videoUrl: risingStarsVideo,
    thumbnail: fieldDayThumb,
    title: "Field Day — Track & Field Highlights",
    description: "Speed, power, grace. The best moments from field day.",
    duration: 44,
    likes: 5100,
    views: 82000,
    uploadDate: "2026-02-05",
    tags: ["track", "field", "athletics"],
  },
];

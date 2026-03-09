import feedVideo29 from "@/assets/feed-video-29.mp4";
import feedVideo30 from "@/assets/feed-video-30.mp4";
import feedVideo31 from "@/assets/feed-video-31.mp4";
import feedVideo32 from "@/assets/feed-video-32.mp4";
import feedVideo33 from "@/assets/feed-video-33.mp4";
import feedVideo34 from "@/assets/feed-video-34.mp4";
import feedVideo35 from "@/assets/feed-video-35.mp4";
import feedVideo36 from "@/assets/feed-video-36.mp4";
import feedVideo38 from "@/assets/feed-video-38.mp4";
import feedVideo39 from "@/assets/feed-video-39.mp4";
import feedVideo40 from "@/assets/feed-video-40.mp4";
import feedVideo41 from "@/assets/feed-video-41.mp4";
import feedVideo42 from "@/assets/feed-video-42.mp4";

export interface DiscoverVideo {
  id: string;
  title: string;
  channel: string;
  category: string;
  views: number;
  likes: number;
  duration: string;
  gradient: string;
  thumbnail: string;
  videoUrl?: string;
  addedDate: string;
  trending?: boolean;
}

export const DISCOVER_VIDEOS: DiscoverVideo[] = [
  // Basketball
  { id: "dv1", title: "Top 10 WNBA Plays This Week", channel: "Loverball Originals", category: "Basketball", views: 24100, likes: 3200, duration: "2:45", gradient: "from-primary to-primary/70", thumbnail: "/images/all-stars-event.jpg", videoUrl: feedVideo29, addedDate: "2026-03-08", trending: true },
  { id: "dv2", title: "Courtside Breakdown: Lakers vs Clippers", channel: "CourtSide Queens", category: "Basketball", views: 31400, likes: 4100, duration: "4:20", gradient: "from-accent to-accent/60", thumbnail: "/images/life-basketball-sanaa.jpg", videoUrl: feedVideo31, addedDate: "2026-03-07", trending: true },
  { id: "dv3", title: "March Madness Preview — Top Upsets", channel: "Court Vision", category: "Basketball", views: 18700, likes: 2400, duration: "3:15", gradient: "from-primary/80 to-accent/50", thumbnail: "", videoUrl: feedVideo33, addedDate: "2026-03-06" },

  // Soccer
  { id: "dv4", title: "Angel City FC Match Highlights", channel: "ACFC Media", category: "Soccer", views: 18300, likes: 2800, duration: "3:12", gradient: "from-accent to-accent/70", thumbnail: "/images/angel-city-fc-opener.jpg", videoUrl: feedVideo30, addedDate: "2026-03-08", trending: true },
  { id: "dv5", title: "Soccer Skills Challenge", channel: "Soccer Sisters", category: "Soccer", views: 15400, likes: 1900, duration: "2:30", gradient: "from-accent to-primary/60", thumbnail: "/images/world-cup-la-preview.jpg", videoUrl: feedVideo36, addedDate: "2026-03-05" },
  { id: "dv6", title: "NWSL Season Kickoff Preview", channel: "NWSL Watch", category: "Soccer", views: 12100, likes: 1500, duration: "5:00", gradient: "from-primary/60 to-accent/80", thumbnail: "", addedDate: "2026-03-04" },

  // WNBA
  { id: "dv7", title: "WNBA Draft Prospects to Watch", channel: "WNBA Highlights", category: "WNBA", views: 22800, likes: 3000, duration: "4:10", gradient: "from-accent to-accent/50", thumbnail: "", videoUrl: feedVideo32, addedDate: "2026-03-08", trending: true },
  { id: "dv8", title: "Best Plays — Sparks Season Recap", channel: "WNBA Highlights", category: "WNBA", views: 14200, likes: 1800, duration: "3:45", gradient: "from-primary to-accent/70", thumbnail: "", addedDate: "2026-03-03" },

  // Tennis
  { id: "dv9", title: "WTA Tour Highlights — Indian Wells", channel: "Serve & Volley", category: "Tennis", views: 9800, likes: 1200, duration: "2:50", gradient: "from-primary to-primary/50", thumbnail: "", videoUrl: feedVideo34, addedDate: "2026-03-07" },
  { id: "dv10", title: "Tennis Drills for Beginners", channel: "Serve & Volley", category: "Tennis", views: 7200, likes: 900, duration: "5:15", gradient: "from-accent/80 to-primary/40", thumbnail: "", addedDate: "2026-03-02" },

  // Culture
  { id: "dv11", title: "LA28 Olympic Venue Tour", channel: "Olympic Dreams", category: "Culture", views: 9800, likes: 1400, duration: "6:30", gradient: "from-accent/80 to-primary/60", thumbnail: "/images/la28-olympics-mixer.jpg", videoUrl: feedVideo35, addedDate: "2026-03-06" },
  { id: "dv12", title: "Title IX: 50 Years Later", channel: "Title IX Today", category: "Culture", views: 8400, likes: 1100, duration: "8:00", gradient: "from-primary/70 to-accent/50", thumbnail: "", addedDate: "2026-03-01" },

  // Lifestyle
  { id: "dv13", title: "Game Day Outfit Inspo 🔥", channel: "Game Day Girls", category: "Lifestyle", views: 12700, likes: 2100, duration: "1:30", gradient: "from-primary/80 to-primary/40", thumbnail: "/images/women-panel-event.jpg", addedDate: "2026-03-07" },
  { id: "dv14", title: "Tailgate Cooking: Stadium Style 🌭", channel: "Game Day Girls", category: "Lifestyle", views: 8900, likes: 980, duration: "2:00", gradient: "from-accent/60 to-primary/40", thumbnail: "/images/reggaeton-superbowl-party.jpg", addedDate: "2026-03-05" },

  // Fitness
  { id: "dv15", title: "Pre-Game Yoga Flow", channel: "Fit Femmes", category: "Fitness", views: 7200, likes: 800, duration: "4:30", gradient: "from-primary to-accent/60", thumbnail: "", videoUrl: feedVideo34, addedDate: "2026-03-06" },
  { id: "dv16", title: "Athlete Morning Routine", channel: "Strong Girl Summer", category: "Fitness", views: 19500, likes: 2600, duration: "3:00", gradient: "from-accent to-primary/50", thumbnail: "", addedDate: "2026-03-08", trending: true },

  // New uploads
  { id: "dv17", title: "Courtside Vibes — Game Night Energy", channel: "Loverball Originals", category: "Basketball", views: 28400, likes: 3800, duration: "0:45", gradient: "from-primary to-accent/80", thumbnail: "", videoUrl: feedVideo38, addedDate: "2026-03-09", trending: true },
  { id: "dv18", title: "Match Day Highlights Recap", channel: "ACFC Media", category: "Soccer", views: 16200, likes: 2100, duration: "1:00", gradient: "from-accent/90 to-primary/50", thumbnail: "", videoUrl: feedVideo39, addedDate: "2026-03-09" },
  { id: "dv19", title: "Behind the Scenes — Tunnel Walk", channel: "CourtSide Queens", category: "Culture", views: 21300, likes: 2900, duration: "0:30", gradient: "from-primary/70 to-accent/60", thumbnail: "", videoUrl: feedVideo40, addedDate: "2026-03-09", trending: true },
  { id: "dv20", title: "Pickup Game Highlights 🏀", channel: "Court Vision", category: "Basketball", views: 13800, likes: 1700, duration: "0:55", gradient: "from-accent to-accent/40", thumbnail: "", videoUrl: feedVideo41, addedDate: "2026-03-08" },
  { id: "dv21", title: "Stadium Fit Check 🔥", channel: "Game Day Girls", category: "Lifestyle", views: 24600, likes: 3400, duration: "0:40", gradient: "from-primary/80 to-accent/70", thumbnail: "", videoUrl: feedVideo42, addedDate: "2026-03-09", trending: true },
];

export const DISCOVER_CATEGORIES = ["All", "Basketball", "Soccer", "WNBA", "Tennis", "Culture", "Lifestyle", "Fitness"] as const;

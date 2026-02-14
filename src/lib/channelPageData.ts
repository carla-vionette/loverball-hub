const thumbBase = "https://images.unsplash.com/photo-";

export interface ChannelVideo {
  id: string;
  title: string;
  thumbnail: string;
  duration: string;
  views: number;
  likes: number;
  uploadDate: string; // relative
  uploadTimestamp: number; // for sorting
}

export interface ChannelPlaylist {
  id: string;
  name: string;
  thumbnail: string;
  videoCount: number;
  totalDuration: string;
}

export interface ChannelAbout {
  fullDescription: string;
  createdDate: string;
  contactEmail?: string;
  website?: string;
  socialLinks?: { platform: string; url: string }[];
  sponsors?: string[];
  uploadSchedule?: string;
}

// Generate mock videos for any channel
export const generateChannelVideos = (channelName: string): ChannelVideo[] => {
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
    `${channelName} vs. All-Stars | Full Highlights`,
    `Training Camp Day 1 Vlog`,
    `Road Trip Diaries | Away Game`,
    `${channelName} Community Day Recap`,
    `Press Conference: Coach Interview`,
    `Mic'd Up: On The Field`,
    `${channelName} Top 50 Plays All-Time`,
    `Rookie Showcase | New Talent`,
    `Championship Chase | Episode 3`,
    `Fan Q&A with the Squad`,
  ];

  const thumbs = [
    "1504450758-28f095a56e89",
    "1546519638-68e109498ffc",
    "1574629810360-7efbbe195018",
    "1579952363873-27f3bade9f55",
    "1461896836934-bd45ea8b2c58",
    "1517649763962-0c623066013b",
    "1571019613454-1cb2f99b2d8b",
    "1431324155629-1a6deb1dec8d",
  ];

  const durations = ["2:34", "5:12", "8:45", "12:30", "3:17", "6:52", "10:08", "4:23", "7:19", "15:42"];
  const dates = ["2 hours ago", "5 hours ago", "1 day ago", "2 days ago", "3 days ago", "5 days ago", "1 week ago", "2 weeks ago", "3 weeks ago", "1 month ago"];

  return titles.map((title, i) => ({
    id: `vid-${i}`,
    title,
    thumbnail: `${thumbBase}${thumbs[i % thumbs.length]}?w=640&h=360&fit=crop`,
    duration: durations[i % durations.length],
    views: Math.floor(Math.random() * 500_000) + 1_000,
    likes: Math.floor(Math.random() * 20_000) + 100,
    uploadDate: dates[i % dates.length],
    uploadTimestamp: Date.now() - i * 86_400_000,
  }));
};

export const generatePlaylists = (channelName: string): ChannelPlaylist[] => [
  {
    id: "pl-1",
    name: "Best of 2025",
    thumbnail: `${thumbBase}1504450758-28f095a56e89?w=640&h=360&fit=crop`,
    videoCount: 24,
    totalDuration: "3h 42m",
  },
  {
    id: "pl-2",
    name: "Highlights Reel",
    thumbnail: `${thumbBase}1546519638-68e109498ffc?w=640&h=360&fit=crop`,
    videoCount: 18,
    totalDuration: "2h 15m",
  },
  {
    id: "pl-3",
    name: "Behind The Scenes",
    thumbnail: `${thumbBase}1574629810360-7efbbe195018?w=640&h=360&fit=crop`,
    videoCount: 12,
    totalDuration: "1h 30m",
  },
  {
    id: "pl-4",
    name: "Player Spotlights",
    thumbnail: `${thumbBase}1579952363873-27f3bade9f55?w=640&h=360&fit=crop`,
    videoCount: 8,
    totalDuration: "58m",
  },
  {
    id: "pl-5",
    name: "Game Day",
    thumbnail: `${thumbBase}1517649763962-0c623066013b?w=640&h=360&fit=crop`,
    videoCount: 32,
    totalDuration: "5h 10m",
  },
];

export const generateAbout = (channel: { name: string; description: string; sportBadge: string }): ChannelAbout => ({
  fullDescription: `${channel.description}\n\nWelcome to the official ${channel.name} channel on Loverball Watch. Here you'll find highlights, behind-the-scenes content, player interviews, exclusive access, and community stories. Subscribe for notifications to never miss a new upload.\n\nWe upload new content every week including game recaps, pre-game analysis, and original features. Join our community of passionate fans and stay connected with everything ${channel.name}.`,
  createdDate: "January 2024",
  contactEmail: `media@${channel.name.toLowerCase().replace(/\s+/g, "")}.com`,
  website: `https://${channel.name.toLowerCase().replace(/\s+/g, "")}.com`,
  socialLinks: [
    { platform: "Instagram", url: "#" },
    { platform: "X / Twitter", url: "#" },
    { platform: "TikTok", url: "#" },
  ],
  sponsors: ["Nike", "Gatorade"],
  uploadSchedule: "New videos every Mon, Wed & Fri",
});

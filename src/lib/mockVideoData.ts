export interface VideoItem {
  id: string;
  title: string;
  thumbnail: string;
  channelName: string;
  channelAvatar: string;
  views: number;
  likes: number;
  duration: string;
  category: string;
  videoUrl: string;
}

export interface ChannelItem {
  id: string;
  name: string;
  avatar: string;
  subscribers: number;
  videoCount: number;
  description: string;
  sportFocus: string;
}

// Using Unsplash sport images as placeholders
const thumbBase = "https://images.unsplash.com/photo-";

export const MOCK_VIDEOS: VideoItem[] = [
  {
    id: "v1",
    title: "Best Moments from the LA Derby — Full Highlights",
    thumbnail: thumbBase + "1574629810360-7efbbe195018?w=640&h=360&fit=crop",
    channelName: "Loverball Highlights",
    channelAvatar: thumbBase + "1535930749574-1399327ce78f?w=80&h=80&fit=crop&crop=faces",
    views: 245000,
    likes: 18200,
    duration: "12:34",
    category: "Highlights",
    videoUrl: "",
  },
  {
    id: "v2",
    title: "Training Day: Behind the Scenes with Pro Athletes",
    thumbnail: thumbBase + "1517649763962-0c623066013b?w=640&h=360&fit=crop",
    channelName: "Inside the Game",
    channelAvatar: thumbBase + "1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop&crop=faces",
    views: 87400,
    likes: 6300,
    duration: "8:21",
    category: "Behind the Scenes",
    videoUrl: "",
  },
  {
    id: "v3",
    title: "Women's Basketball: Rising Stars to Watch This Season",
    thumbnail: thumbBase + "1546519638-68e109498ffc?w=640&h=360&fit=crop",
    channelName: "Court Vision",
    channelAvatar: thumbBase + "1494790108377-be9c29b29330?w=80&h=80&fit=crop&crop=faces",
    views: 156000,
    likes: 12400,
    duration: "15:47",
    category: "Analysis",
    videoUrl: "",
  },
  {
    id: "v4",
    title: "Game Day Vlog: Tailgating to Final Whistle",
    thumbnail: thumbBase + "1431324155629-1a6deb1dec8d?w=640&h=360&fit=crop",
    channelName: "Fan Life",
    channelAvatar: thumbBase + "1438761681033-6461ffad8d80?w=80&h=80&fit=crop&crop=faces",
    views: 43200,
    likes: 3100,
    duration: "22:15",
    category: "Vlogs",
    videoUrl: "",
  },
  {
    id: "v5",
    title: "Soccer Skills Masterclass — Dribbling & Control",
    thumbnail: thumbBase + "1579952363873-27f3bade9f55?w=640&h=360&fit=crop",
    channelName: "Skill School",
    channelAvatar: thumbBase + "1472099645785-5658abf4ff4e?w=80&h=80&fit=crop&crop=faces",
    views: 312000,
    likes: 28500,
    duration: "18:03",
    category: "Tutorials",
    videoUrl: "",
  },
  {
    id: "v6",
    title: "The Culture of Pickup Basketball in LA",
    thumbnail: thumbBase + "1504450758-28f095a56e89?w=640&h=360&fit=crop",
    channelName: "Loverball Originals",
    channelAvatar: thumbBase + "1535930749574-1399327ce78f?w=80&h=80&fit=crop&crop=faces",
    views: 198000,
    likes: 15600,
    duration: "25:40",
    category: "Documentaries",
    videoUrl: "",
  },
  {
    id: "v7",
    title: "Top 10 Plays of the Week — You Won't Believe #3",
    thumbnail: thumbBase + "1461896836934-bd45ea8b2c58?w=640&h=360&fit=crop",
    channelName: "Loverball Highlights",
    channelAvatar: thumbBase + "1535930749574-1399327ce78f?w=80&h=80&fit=crop&crop=faces",
    views: 520000,
    likes: 41000,
    duration: "6:52",
    category: "Highlights",
    videoUrl: "",
  },
  {
    id: "v8",
    title: "Stretching Routine for Athletes — 15 Min Recovery",
    thumbnail: thumbBase + "1571019613454-1cb2f99b2d8b?w=640&h=360&fit=crop",
    channelName: "Skill School",
    channelAvatar: thumbBase + "1472099645785-5658abf4ff4e?w=80&h=80&fit=crop&crop=faces",
    views: 67800,
    likes: 4200,
    duration: "15:00",
    category: "Tutorials",
    videoUrl: "",
  },
];

export const MOCK_CHANNELS: ChannelItem[] = [
  {
    id: "c1",
    name: "Loverball Highlights",
    avatar: thumbBase + "1535930749574-1399327ce78f?w=80&h=80&fit=crop&crop=faces",
    subscribers: 12400,
    videoCount: 87,
    description: "Official highlights and top plays curated by the Loverball team.",
    sportFocus: "Multi-sport",
  },
  {
    id: "c2",
    name: "Court Vision",
    avatar: thumbBase + "1494790108377-be9c29b29330?w=80&h=80&fit=crop&crop=faces",
    subscribers: 8300,
    videoCount: 45,
    description: "Deep dives into basketball strategy, player analysis, and game breakdowns.",
    sportFocus: "Basketball",
  },
  {
    id: "c3",
    name: "Inside the Game",
    avatar: thumbBase + "1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop&crop=faces",
    subscribers: 5600,
    videoCount: 32,
    description: "Behind-the-scenes access to pro and amateur athletes.",
    sportFocus: "Multi-sport",
  },
  {
    id: "c4",
    name: "Skill School",
    avatar: thumbBase + "1472099645785-5658abf4ff4e?w=80&h=80&fit=crop&crop=faces",
    subscribers: 15200,
    videoCount: 63,
    description: "Tutorials, drills, and skill breakdowns for every level.",
    sportFocus: "Soccer & Basketball",
  },
  {
    id: "c5",
    name: "Fan Life",
    avatar: thumbBase + "1438761681033-6461ffad8d80?w=80&h=80&fit=crop&crop=faces",
    subscribers: 3100,
    videoCount: 21,
    description: "Vlogs from the stands, tailgates, and fan experiences.",
    sportFocus: "Fan Culture",
  },
  {
    id: "c6",
    name: "Loverball Originals",
    avatar: thumbBase + "1535930749574-1399327ce78f?w=80&h=80&fit=crop&crop=faces",
    subscribers: 9800,
    videoCount: 18,
    description: "Original documentaries and long-form sports storytelling.",
    sportFocus: "Documentaries",
  },
];

export const VIDEO_CATEGORIES = [
  "All",
  "Highlights",
  "Analysis",
  "Tutorials",
  "Vlogs",
  "Behind the Scenes",
  "Documentaries",
  "Live",
];

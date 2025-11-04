import { useState } from "react";
import { Search as SearchIcon, X } from "lucide-react";
import BottomNav from "@/components/BottomNav";
import DesktopNav from "@/components/DesktopNav";
import MobileHeader from "@/components/MobileHeader";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import colorCoverageVideo from "@/assets/color-coverage-video.mp4";
import colorCoverageVideo2 from "@/assets/color-coverage-video-2.mp4";
import christineVideo from "@/assets/christine-video.mov";
import playMeVideo from "@/assets/play-me-video.mp4";
import risingStarsVideo from "@/assets/rising-stars-video.mp4";
import matchPointVideo from "@/assets/match-point-video.mp4";
import beyondCourt from "@/assets/beyond-court.jpg";
import gameChangers from "@/assets/game-changers.jpg";
import trainingDay from "@/assets/training-day.jpg";
import coachCorner from "@/assets/coach-corner.jpg";

const Search = () => {
  const [searchQuery, setSearchQuery] = useState("");

  const unscriptedContent = [
    {
      id: 1,
      title: "Christine's Sports Journey",
      image: christineVideo,
      type: "video",
      creator: "thechristinewang",
      views: "3.5M",
    },
    {
      id: 2,
      title: "Larissa on the Court",
      image: colorCoverageVideo,
      type: "video",
      creator: "Larissa_Bball",
      views: "2.8M",
    },
    {
      id: 3,
      title: "Beyond the Court",
      image: beyondCourt,
      type: "image",
      creator: "WNBA Stories",
      views: "1.2M",
    },
    {
      id: 4,
      title: "Game Changers",
      image: gameChangers,
      type: "image",
      creator: "SportsDoc",
      views: "890K",
    },
    {
      id: 5,
      title: "Training Day",
      image: trainingDay,
      type: "image",
      creator: "EliteAthletes",
      views: "654K",
    },
  ];

  const scriptedContent = [
    {
      id: 1,
      title: "Play Me",
      image: playMeVideo,
      type: "video",
      creator: "TeamDynamics",
      views: "8.9M",
      description: "A soccer team's journey to championship glory, exploring themes of teamwork, determination, and personal growth on and off the field.",
    },
    {
      id: 2,
      title: "Rising Stars",
      image: risingStarsVideo,
      type: "video",
      creator: "YouthSports",
      views: "2.1M",
      description: "Follow the next generation of basketball talent as young athletes train, compete, and chase their dreams of becoming professional players.",
    },
    {
      id: 3,
      title: "Match Point",
      image: matchPointVideo,
      type: "video",
      creator: "CourtSide",
      views: "3.8M",
      description: "Charlie and Katarina, two professional tennis players, find romance on and off the court as they compete in the biggest tournament of their careers.",
    },
    {
      id: 4,
      title: "Coach's Corner",
      image: coachCorner,
      type: "image",
      creator: "CoachLife",
      views: "1.5M",
      description: "Behind-the-scenes insights from legendary coaches sharing their strategies, philosophies, and life lessons from decades in sports.",
    },
  ];

  const teamChannels = [
    {
      id: 1,
      name: "Seattle Storm",
      image: colorCoverageVideo2,
      type: "channel",
      followers: "245K",
      videos: 156,
    },
    {
      id: 2,
      name: "USWNT",
      image: beyondCourt,
      type: "channel",
      followers: "892K",
      videos: 342,
    },
    {
      id: 3,
      name: "Chicago Sky",
      image: gameChangers,
      type: "channel",
      followers: "178K",
      videos: 89,
    },
    {
      id: 4,
      name: "Portland Thorns",
      image: trainingDay,
      type: "channel",
      followers: "156K",
      videos: 124,
    },
  ];

  const handleClearSearch = () => {
    setSearchQuery("");
  };

  return (
    <div className="min-h-screen bg-background">
      <MobileHeader />
      <DesktopNav />
      <BottomNav />
      
      <main className="md:ml-64 pb-20 md:pb-8">
        <div className="container mx-auto px-4 pt-20 md:pt-6 py-6">
          {/* Search Bar */}
          <div className="mb-6">
            <div className="relative max-w-2xl mx-auto">
              <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search creators, teams, or content..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 pr-12 h-12 text-base rounded-full"
              />
              {searchQuery && (
                <button
                  onClick={handleClearSearch}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>

          {/* Content Tabs */}
          <Tabs defaultValue="unscripted" className="w-full">
            <TabsList className="w-full justify-start mb-6 bg-transparent border-b rounded-none h-auto p-0">
              <TabsTrigger 
                value="unscripted" 
                className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none pb-3"
              >
                Unscripted
              </TabsTrigger>
              <TabsTrigger 
                value="scripted"
                className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none pb-3"
              >
                Scripted
              </TabsTrigger>
              <TabsTrigger 
                value="teams"
                className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none pb-3"
              >
                Team Channels
              </TabsTrigger>
            </TabsList>

            <TabsContent value="unscripted" className="mt-0">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {unscriptedContent.map((item) => (
                  <div key={item.id} className="group cursor-pointer">
                    <div className="relative aspect-[3/4] rounded-lg overflow-hidden bg-secondary mb-2">
                      {item.type === "video" ? (
                        <video
                          src={item.image}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          muted
                          loop
                          playsInline
                        />
                      ) : (
                        <img
                          src={item.image}
                          alt={item.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                      )}
                      <div className="absolute bottom-2 left-2 right-2">
                        <p className="text-white text-xs font-semibold">{item.views} views</p>
                      </div>
                    </div>
                    <h3 className="font-semibold text-sm line-clamp-2 mb-1">{item.title}</h3>
                    <p className="text-xs text-muted-foreground">@{item.creator}</p>
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="scripted" className="mt-0">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {scriptedContent.map((item) => (
                  <div key={item.id} className="group cursor-pointer">
                    <div className="relative aspect-video rounded-lg overflow-hidden bg-secondary mb-3">
                      {item.type === "video" ? (
                        <video
                          src={item.image}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          muted
                          loop
                          playsInline
                        />
                      ) : (
                        <img
                          src={item.image}
                          alt={item.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                      )}
                      <div className="absolute bottom-2 left-2 right-2">
                        <p className="text-white text-xs font-semibold">{item.views} views</p>
                      </div>
                    </div>
                    <h3 className="font-semibold text-lg mb-2">{item.title}</h3>
                    <p className="text-sm text-muted-foreground mb-2 line-clamp-2">{item.description}</p>
                    <p className="text-xs text-muted-foreground">by @{item.creator}</p>
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="teams" className="mt-0">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {teamChannels.map((channel) => (
                  <div key={channel.id} className="group cursor-pointer">
                    <div className="flex items-center gap-4 p-4 rounded-lg border border-border hover:bg-muted transition-colors">
                      <div className="w-20 h-20 rounded-full overflow-hidden bg-secondary flex-shrink-0">
                        {channel.type === "channel" ? (
                          <img
                            src={channel.image}
                            alt={channel.name}
                            className="w-full h-full object-cover"
                          />
                        ) : null}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-lg mb-1">{channel.name}</h3>
                        <div className="flex gap-4 text-sm text-muted-foreground">
                          <span>{channel.followers} followers</span>
                          <span>{channel.videos} videos</span>
                        </div>
                        <button className="mt-2 px-4 py-1 bg-primary text-primary-foreground rounded-full text-sm font-semibold hover:bg-primary/90 transition-colors">
                          Follow
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
};

export default Search;

import BottomNav from "@/components/BottomNav";
import DesktopNav from "@/components/DesktopNav";
import MobileHeader from "@/components/MobileHeader";
import VideoPost from "@/components/VideoPost";
import StatsTicker from "@/components/StatsTicker";
import christineVideo from "@/assets/christine-video.mov";
import colorCoverageVideo from "@/assets/color-coverage-video.mp4";
import playMeVideo from "@/assets/play-me-video.mp4";
import risingStarsVideo from "@/assets/rising-stars-video.mp4";
import matchPointVideo from "@/assets/match-point-video.mp4";

const Following = () => {
  const followingVideos = [
    {
      id: 1,
      videoUrl: playMeVideo,
      username: "TeamDynamics",
      userAvatar: "",
      caption: "Play Me - An inspiring story about teamwork and determination on the court! 🏀 #TeamSpirit #BasketballLife",
      likes: 8924,
      comments: 567,
      shares: 423,
    },
    {
      id: 2,
      videoUrl: risingStarsVideo,
      username: "YouthSports",
      userAvatar: "",
      caption: "Rising Stars - Watch the next generation shine on the court! 🌟🏀 #RisingStars #YouthBasketball #FutureChampions",
      likes: 5234,
      comments: 312,
      shares: 189,
    },
    {
      id: 3,
      videoUrl: colorCoverageVideo,
      username: "Larissa_Bball",
      userAvatar: "",
      caption: "Larissa on the court with the Falcons. 🏀 #Basketball #Falcons #WomenInSports",
      likes: 2847,
      comments: 156,
      shares: 89,
    },
    {
      id: 4,
      videoUrl: matchPointVideo,
      username: "CourtSide",
      userAvatar: "",
      caption: "Match Point - Charlie and Katarina compete for love and glory on the tennis court 🎾❤️ #MatchPoint #Tennis #SportsRomance",
      likes: 3842,
      comments: 298,
      shares: 176,
    },
    {
      id: 5,
      videoUrl: christineVideo,
      username: "thechristinewang",
      userAvatar: "",
      caption: "Christine sharing her sports journey and inspiring others to stay active! 🏀⚽️ #SportsLife #Inspiration #WomenInSports",
      likes: 3547,
      comments: 234,
      shares: 156,
    },
  ];

  return (
    <div className="min-h-screen bg-black">
      <MobileHeader />
      <DesktopNav />
      <BottomNav />
      
      <main className="md:ml-64 snap-y snap-mandatory h-screen overflow-y-scroll pt-20 md:pt-0">
        <div className="snap-start">
          <StatsTicker />
        </div>
        {followingVideos.length > 0 ? (
          followingVideos.map((video) => (
            <VideoPost key={video.id} {...video} />
          ))
        ) : (
          <div className="h-screen flex items-center justify-center text-white">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-2">No content yet</h2>
              <p className="text-muted-foreground">Follow creators to see their videos here</p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Following;

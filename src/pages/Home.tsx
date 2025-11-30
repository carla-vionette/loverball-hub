import BottomNav from "@/components/BottomNav";
import DesktopNav from "@/components/DesktopNav";
import MobileHeader from "@/components/MobileHeader";
import VideoPost from "@/components/VideoPost";
import StatsTicker from "@/components/StatsTicker";
import colorCoverageVideo from "@/assets/color-coverage-video.mp4";
import colorCoverageVideo2 from "@/assets/color-coverage-video-2.mp4";
import playMeVideo from "@/assets/play-me-video.mp4";
import matchPointVideo from "@/assets/match-point-video.mp4";

const Home = () => {
  const videoFeed = [
    {
      id: 1,
      videoUrl: colorCoverageVideo,
      username: "Larissa_Bball",
      userAvatar: "",
      caption: "Larissa on the court with the Falcons. 🏀 #WomenInSports #Basketball #Falcons",
      likes: 2847,
      comments: 156,
      shares: 89,
    },
    {
      id: 2,
      videoUrl: colorCoverageVideo2,
      username: "SportsHighlights",
      userAvatar: "",
      caption: "Amazing game highlights from this week! 🔥 #SportsLife #Highlights",
      likes: 5123,
      comments: 287,
      shares: 145,
    },
    {
      id: 3,
      videoUrl: matchPointVideo,
      username: "CourtSide",
      userAvatar: "",
      caption: "Match Point - Charlie and Katarina's epic tennis romance! 🎾❤️ #Tennis #Romance #MatchPoint",
      likes: 3842,
      comments: 298,
      shares: 176,
    },
    {
      id: 4,
      videoUrl: playMeVideo,
      username: "TeamDynamics",
      userAvatar: "",
      caption: "Play Me - A soccer team's journey to championship glory and personal growth ⚽️ #PlayMe #Soccer #Championship",
      likes: 8956,
      comments: 432,
      shares: 267,
    },
  ];
  return (
    <div className="min-h-screen bg-black">
      <MobileHeader />
      <DesktopNav />
      <BottomNav />
      
      <div className="fixed top-16 md:top-0 left-0 right-0 md:left-64 z-30">
        <StatsTicker />
      </div>
      
      <main className="md:ml-64 snap-y snap-mandatory h-screen overflow-y-scroll pt-[92px] md:pt-[48px]">
        {videoFeed.map((video) => (
          <VideoPost key={video.id} {...video} />
        ))}
      </main>
    </div>
  );
};

export default Home;

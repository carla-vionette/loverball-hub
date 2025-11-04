import BottomNav from "@/components/BottomNav";
import DesktopNav from "@/components/DesktopNav";
import MobileHeader from "@/components/MobileHeader";
import VideoPost from "@/components/VideoPost";
import FloatingUploadButton from "@/components/FloatingUploadButton";
import colorCoverageVideo from "@/assets/color-coverage-video.mp4";
import colorCoverageVideo2 from "@/assets/color-coverage-video-2.mp4";
import playMeVideo from "@/assets/play-me-video.mp4";

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
      <FloatingUploadButton />
      
      <main className="md:ml-64 snap-y snap-mandatory h-screen overflow-y-scroll">
        {videoFeed.map((video) => (
          <VideoPost key={video.id} {...video} />
        ))}
      </main>
    </div>
  );
};

export default Home;

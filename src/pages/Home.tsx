import BottomNav from "@/components/BottomNav";
import DesktopNav from "@/components/DesktopNav";
import MobileHeader from "@/components/MobileHeader";
import VideoPost from "@/components/VideoPost";
import StatsTicker from "@/components/StatsTicker";
import { videoFeed } from "@/pages/Video";

const Home = () => {
  return (
    <div className="min-h-screen bg-foreground">
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

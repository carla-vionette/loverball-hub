import { Outlet } from "react-router-dom";
import VideoBottomNav from "./VideoBottomNav";
import VideoSidebar from "./VideoSidebar";

const VideoLayout = () => {
  return (
    <div className="min-h-screen bg-background text-foreground font-sans">
      <VideoSidebar />
      <main id="main-content" className="md:ml-60" role="main">
        <Outlet />
      </main>
      <VideoBottomNav />
    </div>
  );
};

export default VideoLayout;

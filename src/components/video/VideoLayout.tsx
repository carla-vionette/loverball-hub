import { Outlet } from "react-router-dom";
import VideoBottomNav from "./VideoBottomNav";
import VideoSidebar from "./VideoSidebar";

const VideoLayout = () => {
  return (
    <div className="min-h-screen bg-background text-foreground font-sans">
      <VideoSidebar />
      <div className="md:ml-60">
        <Outlet />
      </div>
      <VideoBottomNav />
    </div>
  );
};

export default VideoLayout;

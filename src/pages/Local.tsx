import BottomNav from "@/components/BottomNav";
import DesktopNav from "@/components/DesktopNav";
import VideoPost from "@/components/VideoPost";
import FloatingUploadButton from "@/components/FloatingUploadButton";

const Local = () => {
  const localVideos = [
    {
      id: 1,
      videoUrl: "/placeholder-video.mp4",
      username: "LocalSportsHero",
      userAvatar: "",
      caption: "Discover amazing sports content from creators near you! 📍 #LocalSports #Community",
      likes: 892,
      comments: 67,
      shares: 34,
    },
  ];

  return (
    <div className="min-h-screen bg-black">
      <DesktopNav />
      <BottomNav />
      <FloatingUploadButton />
      
      <main className="md:ml-64 snap-y snap-mandatory h-screen overflow-y-scroll">
        {localVideos.map((video) => (
          <VideoPost key={video.id} {...video} />
        ))}
      </main>
    </div>
  );
};

export default Local;

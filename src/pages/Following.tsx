import BottomNav from "@/components/BottomNav";
import DesktopNav from "@/components/DesktopNav";
import VideoPost from "@/components/VideoPost";
import FloatingUploadButton from "@/components/FloatingUploadButton";
import colorCoverageVideo2 from "@/assets/color-coverage-video-2.mp4";

const Following = () => {
  const followingVideos = [
    {
      id: 1,
      videoUrl: colorCoverageVideo2,
      username: "thechristinewang",
      userAvatar: "",
      caption: "Christine sharing her sports journey and inspiring others to stay active! 🏀⚽️ #SportsLife #Inspiration #WomenInSports",
      likes: 3547,
      comments: 234,
      shares: 156,
    },
    {
      id: 2,
      videoUrl: colorCoverageVideo2,
      username: "FavoriteCreator",
      userAvatar: "",
      caption: "Check out what your favorite creators are posting! Follow more accounts to see their content here. #Following",
      likes: 1234,
      comments: 89,
      shares: 45,
    },
  ];

  return (
    <div className="min-h-screen bg-black">
      <DesktopNav />
      <BottomNav />
      <FloatingUploadButton />
      
      <main className="md:ml-64 snap-y snap-mandatory h-screen overflow-y-scroll">
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

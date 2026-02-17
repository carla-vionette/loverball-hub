import { Film } from "lucide-react";

const VideoForYou = () => {
  return (
    <div className="fixed inset-0 bg-black z-40 md:relative md:z-auto md:h-screen flex items-center justify-center">
      <div className="text-center px-8">
        <Film className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <h2 className="text-lg font-bold text-white mb-2">No Videos Yet</h2>
        <p className="text-sm text-muted-foreground">Fresh content is on the way. Check back soon.</p>
      </div>
    </div>
  );
};

export default VideoForYou;

import { useState } from "react";
import { Heart, MessageCircle, Share2, Volume2, VolumeX } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

interface VideoPostProps {
  videoUrl: string;
  username: string;
  userAvatar?: string;
  caption: string;
  likes: number;
  comments: number;
  shares: number;
  isLiked?: boolean;
}

const VideoPost = ({
  videoUrl,
  username,
  userAvatar,
  caption,
  likes,
  comments,
  shares,
  isLiked = false,
}: VideoPostProps) => {
  const [liked, setLiked] = useState(isLiked);
  const [likeCount, setLikeCount] = useState(likes);
  const [muted, setMuted] = useState(true);

  const handleLike = () => {
    if (liked) {
      setLiked(false);
      setLikeCount(likeCount - 1);
    } else {
      setLiked(true);
      setLikeCount(likeCount + 1);
    }
  };

  return (
    <div className="relative h-screen w-full snap-start snap-always bg-black">
      <video
        src={videoUrl}
        className="absolute inset-0 w-full h-full object-cover"
        loop
        autoPlay
        playsInline
        muted={muted}
      />
      
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
      
      {/* Video Info */}
      <div className="absolute bottom-20 md:bottom-6 left-4 right-20 text-white z-10">
        <div className="flex items-center gap-3 mb-3">
          <Avatar className="h-10 w-10 border-2 border-white">
            <AvatarImage src={userAvatar} />
            <AvatarFallback>{username[0]?.toUpperCase()}</AvatarFallback>
          </Avatar>
          <span className="font-semibold text-lg">{username}</span>
        </div>
        <p className="text-sm line-clamp-3">{caption}</p>
      </div>

      {/* Action Buttons */}
      <div className="absolute bottom-20 md:bottom-6 right-4 flex flex-col items-center gap-6 z-10">
        <button
          onClick={handleLike}
          className="flex flex-col items-center gap-1 transition-transform active:scale-90"
        >
          <Heart
            className={`w-8 h-8 ${liked ? "fill-red-500 text-red-500" : "text-white"}`}
          />
          <span className="text-white text-xs font-semibold">{likeCount}</span>
        </button>

        <button className="flex flex-col items-center gap-1 transition-transform active:scale-90">
          <MessageCircle className="w-8 h-8 text-white" />
          <span className="text-white text-xs font-semibold">{comments}</span>
        </button>

        <button className="flex flex-col items-center gap-1 transition-transform active:scale-90">
          <Share2 className="w-8 h-8 text-white" />
          <span className="text-white text-xs font-semibold">{shares}</span>
        </button>

        <button
          onClick={() => setMuted(!muted)}
          className="flex flex-col items-center gap-1 transition-transform active:scale-90 mt-4"
        >
          {muted ? (
            <VolumeX className="w-8 h-8 text-white" />
          ) : (
            <Volume2 className="w-8 h-8 text-white" />
          )}
        </button>
      </div>
    </div>
  );
};

export default VideoPost;

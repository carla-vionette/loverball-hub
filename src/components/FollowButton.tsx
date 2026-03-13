import { Button } from "@/components/ui/button";
import { UserPlus, UserCheck, Loader2 } from "lucide-react";
import { useFollow } from "@/hooks/useFollow";
import { useAuth } from "@/hooks/useAuth";

interface Props {
  targetUserId: string;
  size?: "sm" | "default" | "icon";
  className?: string;
}

const FollowButton = ({ targetUserId, size = "sm", className }: Props) => {
  const { user } = useAuth();
  const { isFollowing, loading, toggleFollow } = useFollow(targetUserId);

  if (!user || user.id === targetUserId) return null;

  if (loading) {
    return (
      <Button variant="outline" size={size} disabled className={className}>
        <Loader2 className="w-4 h-4 animate-spin" />
      </Button>
    );
  }

  return (
    <Button
      variant={isFollowing ? "secondary" : "default"}
      size={size}
      onClick={(e) => { e.stopPropagation(); toggleFollow(); }}
      className={className}
    >
      {isFollowing ? (
        <>
          <UserCheck className="w-4 h-4 mr-1" />
          Following
        </>
      ) : (
        <>
          <UserPlus className="w-4 h-4 mr-1" />
          Follow
        </>
      )}
    </Button>
  );
};

export default FollowButton;

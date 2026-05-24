import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import MemberBadge from "@/components/MemberBadge";
import { MapPin, Edit, MessageCircle, Settings, LogOut } from "lucide-react";
import { useFollow } from "@/hooks/useFollow";
import FollowButton from "@/components/FollowButton";

interface ProfileHeaderProps {
  profile: {
    id: string;
    name: string;
    pronouns: string | null;
    city: string | null;
    bio: string | null;
    profile_photo_url: string | null;
    membership_tier: string | null;
    username?: string | null;
  };
  isOwnProfile: boolean;
  onEditProfile: () => void;
  onOpenFollowers: () => void;
  onOpenFollowing: () => void;
  onDMs: () => void;
  onSettings: () => void;
  onLogout: () => void;
}

const ProfileHeader = ({
  profile,
  isOwnProfile,
  onEditProfile,
  onOpenFollowers,
  onOpenFollowing,
  onDMs,
  onSettings,
  onLogout,
}: ProfileHeaderProps) => {
  const { followerCount, followingCount } = useFollow(profile.id);
  const initials = profile.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();

  return (
    <div className="relative md:rounded-2xl overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-primary/15 via-background/40 to-background z-10" />
      <div className="relative z-20 px-4 pt-8 pb-6 md:px-8 md:pt-10 md:pb-8">
        <div className="flex flex-col items-center text-center gap-5">
          {/* Avatar */}
          <div className="relative">
            <div className="absolute -inset-2 rounded-full bg-gradient-to-br from-primary/40 to-accent/30 blur-lg" />
            <Avatar className="relative w-32 h-32 md:w-40 md:h-40 border-[3px] border-primary/60 shadow-xl">
              {profile.profile_photo_url ? (
                <AvatarImage src={profile.profile_photo_url} alt={profile.name} className="object-cover" />
              ) : null}
              <AvatarFallback className="bg-primary text-primary-foreground text-4xl md:text-5xl font-sans">
                {initials}
              </AvatarFallback>
            </Avatar>
            {isOwnProfile && (
              <button
                onClick={onEditProfile}
                className="absolute bottom-1 right-1 w-9 h-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg hover:bg-primary/90 transition-colors border-2 border-background"
              >
                <Edit className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Name */}
          <div className="space-y-1">
            <h1 className="text-3xl md:text-4xl font-display text-foreground tracking-tight flex items-center gap-2 justify-center leading-tight">
              {profile.name}
              <MemberBadge tier={profile.membership_tier} size="lg" />
            </h1>
            {profile.pronouns && (
              <p className="text-sm text-muted-foreground">{profile.pronouns}</p>
            )}
            <div className="flex items-center justify-center gap-1.5 text-sm text-muted-foreground pt-0.5">
              <MapPin className="w-3.5 h-3.5 text-primary flex-shrink-0" />
              <span>{profile.city || "Location not set"}</span>
            </div>
          </div>

          {/* Bio */}
          {profile.bio && (
            <p className="text-sm text-foreground/70 max-w-sm leading-relaxed line-clamp-3">
              {profile.bio}
            </p>
          )}

          {/* Follower counts */}
          <div className="flex items-center gap-5 text-sm">
            <button onClick={onOpenFollowers} className="hover:text-primary transition-colors">
              <strong>{followerCount}</strong>{" "}
              <span className="text-muted-foreground">followers</span>
            </button>
            <button onClick={onOpenFollowing} className="hover:text-primary transition-colors">
              <strong>{followingCount}</strong>{" "}
              <span className="text-muted-foreground">following</span>
            </button>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 flex-wrap justify-center">
            {isOwnProfile ? (
              <>
                <Button
                  onClick={onEditProfile}
                  size="sm"
                  className="rounded-full bg-primary hover:bg-primary/90 text-primary-foreground gap-1.5 text-xs"
                >
                  <Edit className="w-3.5 h-3.5" /> Edit Profile
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={onDMs}
                  className="rounded-full border-border/40 h-8 w-8"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={onSettings}
                  className="rounded-full border-border/40 h-8 w-8"
                >
                  <Settings className="w-3.5 h-3.5" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={onLogout}
                  className="rounded-full border-border/40 text-destructive h-8 w-8"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </Button>
              </>
            ) : (
              <>
                <FollowButton targetUserId={profile.id} />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onDMs}
                  className="rounded-full gap-1.5 text-xs"
                >
                  <MessageCircle className="w-3.5 h-3.5" /> Message
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileHeader;

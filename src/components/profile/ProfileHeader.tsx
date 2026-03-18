import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Settings, Camera } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import MemberBadge from "@/components/MemberBadge";
import FollowButton from "@/components/FollowButton";

interface ProfileHeaderProps {
  profile: {
    id: string;
    name: string;
    username?: string | null;
    bio?: string | null;
    profile_photo_url?: string | null;
    membership_tier?: string | null;
  };
  isOwnProfile: boolean;
  postsCount: number;
  followerCount: number;
  followingCount: number;
  onClickFollowers: () => void;
  onClickFollowing: () => void;
  onAvatarUpdated?: (url: string) => void;
}

function getFanLevel(postsCount: number): { label: string; emoji: string; color: string } {
  if (postsCount >= 200) return { label: "MVP", emoji: "🏆", color: "bg-amber-500/20 text-amber-700 border-amber-500/30" };
  if (postsCount >= 51) return { label: "All-Star", emoji: "⭐", color: "bg-purple-500/20 text-purple-700 border-purple-500/30" };
  if (postsCount >= 11) return { label: "Superfan", emoji: "🔥", color: "bg-primary/20 text-primary border-primary/30" };
  return { label: "New Fan", emoji: "🌱", color: "bg-emerald-500/20 text-emerald-700 border-emerald-500/30" };
}

const ProfileHeader = ({
  profile,
  isOwnProfile,
  postsCount,
  followerCount,
  followingCount,
  onClickFollowers,
  onClickFollowing,
  onAvatarUpdated,
}: ProfileHeaderProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [bioExpanded, setBioExpanded] = useState(false);
  const [uploading, setUploading] = useState(false);

  const initials = profile.name?.split(" ").map(n => n[0]).join("").toUpperCase() || "?";
  const fanLevel = getFanLevel(postsCount);
  const handle = profile.username || profile.name?.toLowerCase().replace(/\s+/g, "") || "user";

  const bioText = profile.bio || "";
  const bioTruncated = bioText.length > 100 && !bioExpanded;

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "File too large", description: "Max 5MB", variant: "destructive" });
      return;
    }
    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `${profile.id}/profile.${ext}`;
      const { error } = await supabase.storage.from("profile-photos").upload(path, file, { upsert: true });
      if (error) throw error;
      const { data } = supabase.storage.from("profile-photos").getPublicUrl(path);
      await supabase.from("profiles").update({ profile_photo_url: data.publicUrl }).eq("id", profile.id);
      onAvatarUpdated?.(data.publicUrl);
      toast({ title: "Photo updated!" });
    } catch (err: any) {
      toast({ title: "Upload failed", description: err.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="px-4 pt-4 pb-2">
      {/* Top row: settings gear */}
      {isOwnProfile && (
        <div className="flex justify-end mb-2">
          <Button variant="ghost" size="icon" onClick={() => navigate("/settings")} className="text-foreground/60 hover:text-foreground">
            <Settings className="w-5 h-5" />
          </Button>
        </div>
      )}

      {/* Avatar + Stats row */}
      <div className="flex items-center gap-5">
        {/* Avatar */}
        <div className="relative flex-shrink-0">
          <div
            className={`relative ${isOwnProfile ? "cursor-pointer" : ""}`}
            onClick={() => isOwnProfile && fileInputRef.current?.click()}
          >
            <Avatar className="w-20 h-20 md:w-24 md:h-24 border-[3px] border-primary/40">
              {profile.profile_photo_url ? (
                <AvatarImage src={profile.profile_photo_url} alt={profile.name} className="object-cover" />
              ) : null}
              <AvatarFallback className="bg-primary text-primary-foreground text-2xl font-bold">{initials}</AvatarFallback>
            </Avatar>
            {isOwnProfile && (
              <div className="absolute bottom-0 right-0 w-7 h-7 bg-primary rounded-full flex items-center justify-center border-2 border-background">
                <Camera className="w-3.5 h-3.5 text-primary-foreground" />
              </div>
            )}
          </div>
          {isOwnProfile && (
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
          )}
        </div>

        {/* Stats */}
        <div className="flex-1 flex justify-around text-center">
          <div>
            <p className="text-lg font-bold text-foreground">{postsCount}</p>
            <p className="text-xs text-muted-foreground">Posts</p>
          </div>
          <button onClick={onClickFollowers} className="hover:opacity-70 transition-opacity">
            <p className="text-lg font-bold text-foreground">{followerCount}</p>
            <p className="text-xs text-muted-foreground">Followers</p>
          </button>
          <button onClick={onClickFollowing} className="hover:opacity-70 transition-opacity">
            <p className="text-lg font-bold text-foreground">{followingCount}</p>
            <p className="text-xs text-muted-foreground">Following</p>
          </button>
        </div>
      </div>

      {/* Name + handle + fan badge */}
      <div className="mt-3">
        <div className="flex items-center gap-2">
          <h1 className="text-base font-bold text-foreground">{profile.name}</h1>
          <MemberBadge tier={profile.membership_tier || null} size="sm" />
          <Badge variant="outline" className={`text-[10px] px-1.5 py-0 border ${fanLevel.color}`}>
            {fanLevel.emoji} {fanLevel.label}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">@{handle}</p>
      </div>

      {/* Bio */}
      {bioText && (
        <div className="mt-2">
          <p className="text-sm text-foreground leading-relaxed">
            {bioTruncated ? bioText.slice(0, 100) : bioText}
            {bioTruncated && (
              <button onClick={() => setBioExpanded(true)} className="text-muted-foreground ml-1 font-medium">
                ...more
              </button>
            )}
          </p>
        </div>
      )}

      {/* Action button */}
      <div className="mt-3">
        {isOwnProfile ? (
          <Button
            variant="outline"
            className="w-full rounded-lg text-sm font-semibold h-9 border-border/60"
            onClick={() => navigate("/profile/edit")}
          >
            Edit Profile
          </Button>
        ) : (
          <FollowButton targetUserId={profile.id} size="default" className="w-full rounded-lg" />
        )}
      </div>
    </div>
  );
};

export default ProfileHeader;

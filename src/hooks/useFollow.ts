import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export function useFollow(targetUserId: string | undefined) {
  const { user } = useAuth();
  const [isFollowing, setIsFollowing] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchState = useCallback(async () => {
    if (!targetUserId) return;
    setLoading(true);

    const followersPromise = supabase.from("follows").select("id", { count: "exact", head: true }).eq("following_id", targetUserId);
    const followingPromise = supabase.from("follows").select("id", { count: "exact", head: true }).eq("follower_id", targetUserId);

    const [followers, following] = await Promise.all([followersPromise, followingPromise]);
    setFollowerCount(followers.count ?? 0);
    setFollowingCount(following.count ?? 0);

    if (user && user.id !== targetUserId) {
      const { data: followData } = await supabase.from("follows").select("id").eq("follower_id", user.id).eq("following_id", targetUserId).maybeSingle();
      setIsFollowing(!!followData);
    }
    setFollowerCount(followers.count ?? 0);
    setFollowingCount(following.count ?? 0);
    if (isFollowingRes) setIsFollowing(!!isFollowingRes.data);
    setLoading(false);
  }, [targetUserId, user?.id]);

  useEffect(() => { fetchState(); }, [fetchState]);

  const toggleFollow = async () => {
    if (!user || !targetUserId || user.id === targetUserId) return;
    if (isFollowing) {
      await supabase.from("follows").delete().eq("follower_id", user.id).eq("following_id", targetUserId);
      setIsFollowing(false);
      setFollowerCount((c) => Math.max(0, c - 1));
    } else {
      await supabase.from("follows").insert({ follower_id: user.id, following_id: targetUserId });
      setIsFollowing(true);
      setFollowerCount((c) => c + 1);
    }
  };

  return { isFollowing, followerCount, followingCount, loading, toggleFollow };
}

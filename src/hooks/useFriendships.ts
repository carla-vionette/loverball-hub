import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface FriendshipActions {
  sendRequest: (targetId: string, mutualTeams?: string[]) => Promise<boolean>;
  acceptRequest: (friendshipId: string) => Promise<boolean>;
  declineRequest: (friendshipId: string) => Promise<boolean>;
  removeFriend: (friendshipId: string) => Promise<boolean>;
  getFriendshipStatus: (targetId: string) => "none" | "pending_sent" | "pending_received" | "accepted";
  friendships: Map<string, { id: string; status: string; requester_id: string }>;
  loading: boolean;
  refresh: () => Promise<void>;
  pendingCount: number;
}

export function useFriendships(): FriendshipActions {
  const { user } = useAuth();
  const [friendships, setFriendships] = useState<Map<string, { id: string; status: string; requester_id: string }>>(new Map());
  const [loading, setLoading] = useState(true);
  const [pendingCount, setPendingCount] = useState(0);

  const refresh = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("friendships")
      .select("id, requester_id, addressee_id, status")
      .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`)
      .in("status", ["pending", "accepted"]);

    const map = new Map<string, { id: string; status: string; requester_id: string }>();
    let pending = 0;
    (data || []).forEach((f) => {
      const otherId = f.requester_id === user.id ? f.addressee_id : f.requester_id;
      map.set(otherId, { id: f.id, status: f.status, requester_id: f.requester_id });
      if (f.status === "pending" && f.addressee_id === user.id) pending++;
    });
    setFriendships(map);
    setPendingCount(pending);
    setLoading(false);
  }, [user?.id]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const getFriendshipStatus = useCallback(
    (targetId: string): "none" | "pending_sent" | "pending_received" | "accepted" => {
      if (!user) return "none";
      const f = friendships.get(targetId);
      if (!f) return "none";
      if (f.status === "accepted") return "accepted";
      if (f.status === "pending") {
        return f.requester_id === user.id ? "pending_sent" : "pending_received";
      }
      return "none";
    },
    [friendships, user?.id]
  );

  const sendRequest = async (targetId: string, mutualTeams: string[] = []) => {
    if (!user) return false;
    const { error } = await supabase.from("friendships").insert({
      requester_id: user.id,
      addressee_id: targetId,
      status: "pending",
      mutual_teams: mutualTeams,
    });
    if (!error) {
      await refresh();
      return true;
    }
    return false;
  };

  const acceptRequest = async (friendshipId: string) => {
    const { error } = await supabase
      .from("friendships")
      .update({ status: "accepted", updated_at: new Date().toISOString() })
      .eq("id", friendshipId);
    if (!error) {
      await refresh();
      return true;
    }
    return false;
  };

  const declineRequest = async (friendshipId: string) => {
    const { error } = await supabase
      .from("friendships")
      .update({ status: "declined", updated_at: new Date().toISOString() })
      .eq("id", friendshipId);
    if (!error) {
      await refresh();
      return true;
    }
    return false;
  };

  const removeFriend = async (friendshipId: string) => {
    const { error } = await supabase.from("friendships").delete().eq("id", friendshipId);
    if (!error) {
      await refresh();
      return true;
    }
    return false;
  };

  return {
    sendRequest,
    acceptRequest,
    declineRequest,
    removeFriend,
    getFriendshipStatus,
    friendships,
    loading,
    refresh,
    pendingCount,
  };
}

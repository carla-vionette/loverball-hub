import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { UserPlus, Check, Clock, Loader2 } from "lucide-react";

interface Props {
  targetUserId: string;
  targetName?: string;
  size?: "sm" | "default" | "icon";
  className?: string;
}

type RequestState = "none" | "pending_sent" | "pending_received" | "accepted" | "loading";

const AddFriendButton = ({ targetUserId, targetName, size = "sm", className = "" }: Props) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [state, setState] = useState<RequestState>("loading");
  const [acting, setActing] = useState(false);

  useEffect(() => {
    if (user && targetUserId && user.id !== targetUserId) {
      checkStatus();
    } else {
      setState("none");
    }
  }, [user?.id, targetUserId]);

  const checkStatus = async () => {
    if (!user) return;
    setState("loading");

    // Check friend_requests table
    const { data } = await supabase
      .from("friend_requests" as any)
      .select("sender_id, receiver_id, status")
      .or(
        `and(sender_id.eq.${user.id},receiver_id.eq.${targetUserId}),and(sender_id.eq.${targetUserId},receiver_id.eq.${user.id})`
      )
      .maybeSingle();

    if (!data) {
      // Also check legacy friendships table
      const { data: legacy } = await supabase
        .from("friendships")
        .select("requester_id, addressee_id, status")
        .or(
          `and(requester_id.eq.${user.id},addressee_id.eq.${targetUserId}),and(requester_id.eq.${targetUserId},addressee_id.eq.${user.id})`
        )
        .maybeSingle();

      if (!legacy) {
        setState("none");
      } else if (legacy.status === "accepted") {
        setState("accepted");
      } else if (legacy.status === "pending" && legacy.requester_id === user.id) {
        setState("pending_sent");
      } else if (legacy.status === "pending") {
        setState("pending_received");
      } else {
        setState("none");
      }
      return;
    }

    const row = data as any;
    if (row.status === "accepted") {
      setState("accepted");
    } else if (row.status === "pending" && row.sender_id === user.id) {
      setState("pending_sent");
    } else if (row.status === "pending") {
      setState("pending_received");
    } else {
      setState("none");
    }
  };

  const handleAdd = async () => {
    if (!user) return;
    setActing(true);
    const { error } = await supabase.from("friend_requests" as any).insert({
      sender_id: user.id,
      receiver_id: targetUserId,
    } as any);
    if (error) {
      toast({ title: "Error", description: "Could not send friend request.", variant: "destructive" });
    } else {
      setState("pending_sent");
      toast({ title: "Request sent!", description: targetName ? `Friend request sent to ${targetName}.` : "Friend request sent." });
    }
    setActing(false);
  };

  if (!user || user.id === targetUserId) return null;

  if (state === "loading") {
    return (
      <Button size={size} variant="ghost" disabled className={className}>
        <Loader2 className="w-3 h-3 animate-spin" />
      </Button>
    );
  }

  if (state === "accepted") {
    return (
      <Button size={size} variant="ghost" disabled className={`text-primary ${className}`}>
        <Check className="w-3 h-3 mr-1" />
        <span className="text-[10px]">Friends</span>
      </Button>
    );
  }

  if (state === "pending_sent") {
    return (
      <Button size={size} variant="ghost" disabled className={`text-muted-foreground ${className}`}>
        <Clock className="w-3 h-3 mr-1" />
        <span className="text-[10px]">Sent</span>
      </Button>
    );
  }

  return (
    <Button
      size={size}
      variant="outline"
      onClick={(e) => { e.stopPropagation(); handleAdd(); }}
      disabled={acting}
      className={`text-xs rounded-full ${className}`}
    >
      {acting ? <Loader2 className="w-3 h-3 animate-spin" /> : <UserPlus className="w-3 h-3 mr-1" />}
      Add Friend
    </Button>
  );
};

export default AddFriendButton;

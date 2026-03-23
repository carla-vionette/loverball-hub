import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { UserPlus, Check, Clock, Loader2 } from "lucide-react";

interface Props {
  targetUserId: string;
  size?: "sm" | "default";
}

type FriendStatus = "none" | "pending_sent" | "pending_received" | "accepted" | "loading";

const AddFriendButton = ({ targetUserId, size = "sm" }: Props) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [status, setStatus] = useState<FriendStatus>("loading");
  const [acting, setActing] = useState(false);

  useEffect(() => {
    if (!user || user.id === targetUserId) {
      setStatus("none");
      return;
    }
    checkStatus();
  }, [user, targetUserId]);

  const checkStatus = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("friendships")
      .select("requester_id, addressee_id, status")
      .or(`and(requester_id.eq.${user.id},addressee_id.eq.${targetUserId}),and(requester_id.eq.${targetUserId},addressee_id.eq.${user.id})`)
      .maybeSingle();

    if (!data) {
      setStatus("none");
    } else if (data.status === "accepted") {
      setStatus("accepted");
    } else if (data.requester_id === user.id) {
      setStatus("pending_sent");
    } else {
      setStatus("pending_received");
    }
  };

  const sendRequest = async () => {
    if (!user) {
      toast({ title: "Sign in to add friends", variant: "destructive" });
      return;
    }
    setActing(true);
    try {
      const { error } = await supabase.from("friendships").insert({
        requester_id: user.id,
        addressee_id: targetUserId,
        status: "pending",
      });
      if (error) {
        if (error.code === "23505") {
          toast({ title: "Request already sent" });
        } else {
          throw error;
        }
      } else {
        toast({ title: "Friend request sent!" });
        setStatus("pending_sent");
      }
    } catch (err: any) {
      toast({ title: "Failed to send request", description: err.message, variant: "destructive" });
    } finally {
      setActing(false);
    }
  };

  const acceptRequest = async () => {
    if (!user) return;
    setActing(true);
    try {
      const { error } = await supabase
        .from("friendships")
        .update({ status: "accepted" })
        .eq("requester_id", targetUserId)
        .eq("addressee_id", user.id);
      if (error) throw error;
      toast({ title: "Friend request accepted!" });
      setStatus("accepted");
    } catch (err: any) {
      toast({ title: "Failed to accept", description: err.message, variant: "destructive" });
    } finally {
      setActing(false);
    }
  };

  if (!user || user.id === targetUserId || status === "loading") return null;

  if (status === "accepted") {
    return (
      <Button variant="outline" size={size} className="rounded-full text-xs gap-1" disabled>
        <Check className="w-3 h-3" /> Friends
      </Button>
    );
  }

  if (status === "pending_sent") {
    return (
      <Button variant="outline" size={size} className="rounded-full text-xs gap-1" disabled>
        <Clock className="w-3 h-3" /> Pending
      </Button>
    );
  }

  if (status === "pending_received") {
    return (
      <Button size={size} className="rounded-full text-xs gap-1" onClick={acceptRequest} disabled={acting}>
        {acting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />} Accept
      </Button>
    );
  }

  return (
    <Button variant="outline" size={size} className="rounded-full text-xs gap-1" onClick={sendRequest} disabled={acting}>
      {acting ? <Loader2 className="w-3 h-3 animate-spin" /> : <UserPlus className="w-3 h-3" />} Add Friend
    </Button>
  );
};

export default AddFriendButton;

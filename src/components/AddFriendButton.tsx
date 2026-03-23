import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { UserPlus, Check, Clock, Loader2 } from "lucide-react";
import { useFriendships } from "@/hooks/useFriendships";
import { useToast } from "@/hooks/use-toast";

interface AddFriendButtonProps {
  targetUserId: string;
  targetName: string;
  mutualTeams?: string[];
  size?: "sm" | "default";
}

const AddFriendButton = ({ targetUserId, targetName, mutualTeams = [], size = "sm" }: AddFriendButtonProps) => {
  const { sendRequest, getFriendshipStatus } = useFriendships();
  const { toast } = useToast();
  const [sending, setSending] = useState(false);
  const status = getFriendshipStatus(targetUserId);

  const handleAdd = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setSending(true);
    const ok = await sendRequest(targetUserId, mutualTeams);
    if (ok) {
      toast({ title: "Request sent!", description: `Friend request sent to ${targetName}` });
    }
    setSending(false);
  };

  if (status === "accepted") {
    return (
      <Button variant="outline" size={size} disabled className="rounded-full gap-1 text-xs">
        <Check className="w-3 h-3" /> Friends
      </Button>
    );
  }

  if (status === "pending_sent") {
    return (
      <Button variant="outline" size={size} disabled className="rounded-full gap-1 text-xs">
        <Clock className="w-3 h-3" /> Pending
      </Button>
    );
  }

  if (status === "pending_received") {
    return (
      <Button variant="secondary" size={size} disabled className="rounded-full gap-1 text-xs">
        <Clock className="w-3 h-3" /> Respond
      </Button>
    );
  }

  return (
    <Button
      size={size}
      onClick={handleAdd}
      disabled={sending}
      className="rounded-full gap-1 text-xs bg-primary hover:bg-primary/90"
    >
      {sending ? <Loader2 className="w-3 h-3 animate-spin" /> : <UserPlus className="w-3 h-3" />}
      Add Friend
    </Button>
  );
};

export default AddFriendButton;

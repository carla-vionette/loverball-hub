import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from "@/components/ui/drawer";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { UserPlus, Check, Clock, Loader2, MessageCircle, Send, X } from "lucide-react";
import FollowButton from "@/components/FollowButton";

interface AttendeeProfile {
  id: string;
  name: string;
  profile_photo_url: string | null;
  bio: string | null;
  favorite_sports?: string[] | null;
  primary_role?: string | null;
  city?: string | null;
}

interface Props {
  profile: AttendeeProfile | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type FriendshipState = "none" | "pending_sent" | "pending_received" | "accepted" | "loading";

const AttendeeProfileDrawer = ({ profile, open, onOpenChange }: Props) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [friendState, setFriendState] = useState<FriendshipState>("loading");
  const [acting, setActing] = useState(false);
  const [showCompose, setShowCompose] = useState(false);
  const [messageText, setMessageText] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (open && profile && user && profile.id !== user.id) {
      fetchFriendship();
    } else if (!open) {
      setFriendState("loading");
      setShowCompose(false);
      setMessageText("");
    }
  }, [open, profile?.id, user?.id]);

  const fetchFriendship = async () => {
    if (!user || !profile) return;
    setFriendState("loading");

    const { data } = await supabase
      .from("friendships")
      .select("requester_id, addressee_id, status")
      .or(
        `and(requester_id.eq.${user.id},addressee_id.eq.${profile.id}),and(requester_id.eq.${profile.id},addressee_id.eq.${user.id})`
      )
      .maybeSingle();

    if (!data) {
      setFriendState("none");
    } else if (data.status === "accepted") {
      setFriendState("accepted");
    } else if (data.status === "pending" && data.requester_id === user.id) {
      setFriendState("pending_sent");
    } else if (data.status === "pending" && data.addressee_id === user.id) {
      setFriendState("pending_received");
    } else {
      setFriendState("none");
    }
  };

  const handleAddFriend = async () => {
    if (!user || !profile) return;
    setActing(true);
    const { error } = await supabase.from("friendships").insert({
      requester_id: user.id,
      addressee_id: profile.id,
    });
    if (error) {
      toast({ title: "Error", description: "Could not send friend request.", variant: "destructive" });
    } else {
      setFriendState("pending_sent");
      toast({ title: "Request sent!", description: `Friend request sent to ${profile.name}.` });
    }
    setActing(false);
  };

  const handleAccept = async () => {
    if (!user || !profile) return;
    setActing(true);
    const { error } = await supabase
      .from("friendships")
      .update({ status: "accepted" })
      .eq("requester_id", profile.id)
      .eq("addressee_id", user.id);
    if (error) {
      toast({ title: "Error", description: "Could not accept request.", variant: "destructive" });
    } else {
      setFriendState("accepted");
      toast({ title: "Friends!", description: `You and ${profile.name} are now friends.` });
    }
    setActing(false);
  };

  const handleSendMessage = async () => {
    if (!user || !profile || !messageText.trim()) return;
    setSending(true);
    const { error } = await supabase.from("direct_messages" as any).insert({
      sender_id: user.id,
      receiver_id: profile.id,
      message: messageText.trim(),
    } as any);
    if (error) {
      toast({ title: "Error", description: "Could not send message.", variant: "destructive" });
    } else {
      toast({ title: "Message sent!", description: `Your message was sent to ${profile.name}.` });
      setMessageText("");
      setShowCompose(false);
    }
    setSending(false);
  };

  if (!profile) return null;

  const isOwnProfile = user?.id === profile.id;

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[85vh]">
        <DrawerHeader className="text-center pb-2">
          <DrawerTitle className="sr-only">{profile.name}</DrawerTitle>
          <DrawerDescription className="sr-only">Profile details</DrawerDescription>
        </DrawerHeader>
        <div className="px-6 pb-8 flex flex-col items-center gap-4">
          <Avatar className="w-24 h-24 border-4 border-primary/20">
            <AvatarImage src={profile.profile_photo_url || undefined} />
            <AvatarFallback className="bg-primary/10 text-primary text-2xl font-bold">
              {profile.name?.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>

          <div className="text-center">
            <div className="flex items-center justify-center gap-2">
              <h3 className="text-xl font-bold text-foreground">{profile.name}</h3>
              {user && !isOwnProfile && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-muted-foreground hover:text-primary"
                  onClick={() => setShowCompose(true)}
                >
                  <MessageCircle className="w-4 h-4" />
                </Button>
              )}
            </div>
            {profile.primary_role && (
              <p className="text-sm text-muted-foreground">{profile.primary_role}</p>
            )}
            {profile.city && (
              <p className="text-xs text-muted-foreground">{profile.city}</p>
            )}
          </div>

          {profile.bio && (
            <p className="text-sm text-muted-foreground text-center max-w-sm">{profile.bio}</p>
          )}

          {profile.favorite_sports && profile.favorite_sports.length > 0 && (
            <div className="flex flex-wrap justify-center gap-1.5">
              {profile.favorite_sports.slice(0, 5).map((sport) => (
                <Badge key={sport} variant="outline" className="text-xs">
                  {sport}
                </Badge>
              ))}
            </div>
          )}

          {/* Action buttons */}
          {user && !isOwnProfile && (
            <div className="mt-2 w-full max-w-xs space-y-2">
              {/* Follow button */}
              <FollowButton targetUserId={profile.id} size="default" className="w-full" />
              {/* Friend action button */}
              {friendState === "loading" && (
                <Button disabled className="w-full" variant="outline">
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Loading…
                </Button>
              )}
              {friendState === "none" && (
                <Button onClick={handleAddFriend} disabled={acting} className="w-full">
                  {acting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <UserPlus className="w-4 h-4 mr-2" />}
                  Add Friend
                </Button>
              )}
              {friendState === "pending_sent" && (
                <Button disabled variant="secondary" className="w-full">
                  <Clock className="w-4 h-4 mr-2" />
                  Request Sent
                </Button>
              )}
              {friendState === "pending_received" && (
                <Button onClick={handleAccept} disabled={acting} className="w-full">
                  {acting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Check className="w-4 h-4 mr-2" />}
                  Accept Request
                </Button>
              )}
              {friendState === "accepted" && (
                <Badge className="w-full justify-center py-2 text-sm bg-success text-success-foreground">
                  <Check className="w-4 h-4 mr-1" />
                  Friends
                </Badge>
              )}

              {/* Send Message button */}
              {!showCompose ? (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setShowCompose(true)}
                >
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Send Message
                </Button>
              ) : (
                <div className="w-full space-y-2 rounded-lg border border-border p-3 bg-muted/30">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-foreground">Message {profile.name}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => { setShowCompose(false); setMessageText(""); }}
                    >
                      <X className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                  <Textarea
                    placeholder="Type your message…"
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    className="min-h-[80px] resize-none text-sm"
                    maxLength={1000}
                  />
                  <Button
                    className="w-full"
                    size="sm"
                    disabled={!messageText.trim() || sending}
                    onClick={handleSendMessage}
                  >
                    {sending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
                    Send
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
};

export default AttendeeProfileDrawer;

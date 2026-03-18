import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Users, Loader2 } from "lucide-react";

interface FollowListSheetProps {
  userId: string;
  type: "followers" | "following" | null;
  onClose: () => void;
}

interface FollowUser {
  id: string;
  name: string;
  profile_photo_url: string | null;
  username?: string | null;
}

const FollowListSheet = ({ userId, type, onClose }: FollowListSheetProps) => {
  const [users, setUsers] = useState<FollowUser[]>([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!type) return;
    setLoading(true);

    const fetchList = async () => {
      const column = type === "followers" ? "following_id" : "follower_id";
      const targetColumn = type === "followers" ? "follower_id" : "following_id";

      const { data: follows } = await supabase
        .from("follows")
        .select(targetColumn)
        .eq(column, userId);

      if (!follows || follows.length === 0) {
        setUsers([]);
        setLoading(false);
        return;
      }

      const ids = follows.map((f: any) => f[targetColumn]);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, name, profile_photo_url, username")
        .in("id", ids);

      setUsers(profiles || []);
      setLoading(false);
    };

    fetchList();
  }, [userId, type]);

  return (
    <Sheet open={!!type} onOpenChange={() => onClose()}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>{type === "followers" ? "Followers" : "Following"}</SheetTitle>
        </SheetHeader>

        {loading ? (
          <div className="py-12 flex justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : users.length === 0 ? (
          <div className="py-12 text-center">
            <Users className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
            <p className="text-muted-foreground text-sm">
              {type === "followers" ? "No followers yet" : "Not following anyone yet"}
            </p>
          </div>
        ) : (
          <div className="mt-4 space-y-1">
            {users.map((u) => (
              <div
                key={u.id}
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-foreground/[0.04] cursor-pointer transition-colors"
                onClick={() => { onClose(); navigate(`/members/${u.id}`); }}
              >
                <Avatar className="w-10 h-10">
                  {u.profile_photo_url && <AvatarImage src={u.profile_photo_url} />}
                  <AvatarFallback className="bg-primary/20 text-primary text-sm font-bold">
                    {u.name?.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium text-foreground">{u.name}</p>
                  {u.username && <p className="text-xs text-muted-foreground">@{u.username}</p>}
                </div>
              </div>
            ))}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
};

export default FollowListSheet;

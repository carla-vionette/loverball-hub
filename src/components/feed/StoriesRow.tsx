import { Plus } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

interface Story {
  id: string;
  name: string;
  avatar: string;
  seen: boolean;
}

interface StoriesRowProps {
  userAvatar: string;
  userName: string;
  stories: Story[];
}

const StoriesRow = ({ userAvatar, userName, stories }: StoriesRowProps) => {
  return (
    <div className="flex gap-3 overflow-x-auto scrollbar-hide px-4 py-2">
      {/* Your story */}
      <div className="flex flex-col items-center gap-1 shrink-0">
        <div className="relative">
          <Avatar className="w-16 h-16 ring-2 ring-border">
            <AvatarImage src={userAvatar} />
            <AvatarFallback className="bg-muted text-muted-foreground font-display text-lg">
              {userName?.charAt(0) || "?"}
            </AvatarFallback>
          </Avatar>
          <span className="absolute bottom-0 right-0 w-5 h-5 rounded-full bg-primary flex items-center justify-center ring-2 ring-background">
            <Plus className="w-3 h-3 text-primary-foreground" />
          </span>
        </div>
        <span className="text-[11px] font-body text-muted-foreground">You</span>
      </div>

      {stories.map((s) => (
        <div key={s.id} className="flex flex-col items-center gap-1 shrink-0">
          <Avatar className={`w-16 h-16 ring-2 ${s.seen ? "ring-border" : "ring-primary"}`}>
            <AvatarImage src={s.avatar} />
            <AvatarFallback className="bg-muted text-muted-foreground font-display text-lg">
              {s.name.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <span className="text-[11px] font-body text-muted-foreground">{s.name}</span>
        </div>
      ))}
    </div>
  );
};

export default StoriesRow;

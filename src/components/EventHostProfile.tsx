import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Crown } from "lucide-react";

interface HostProfileProps {
  hostId?: string | null;
  coHostIds?: string[] | null;
}

interface HostInfo {
  id: string;
  name: string;
  profile_photo_url: string | null;
  primary_role: string | null;
  bio: string | null;
}

const EventHostProfile = ({ hostId, coHostIds }: HostProfileProps) => {
  const [host, setHost] = useState<HostInfo | null>(null);
  const [coHosts, setCoHosts] = useState<HostInfo[]>([]);

  useEffect(() => {
    const allIds = [hostId, ...(coHostIds || [])].filter(Boolean) as string[];
    if (allIds.length === 0) return;

    supabase
      .from("profiles")
      .select("id, name, profile_photo_url, primary_role, bio")
      .in("id", allIds)
      .then(({ data }) => {
        if (!data) return;
        const hostProfile = data.find((p) => p.id === hostId) || null;
        setHost(hostProfile);
        setCoHosts(data.filter((p) => p.id !== hostId));
      });
  }, [hostId, coHostIds]);

  if (!host && coHosts.length === 0) return null;

  return (
    <div className="mb-6">
      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
        Hosted by
      </h3>
      <div className="space-y-3">
        {host && (
          <a
            href={`/members/${host.id}`}
            className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors"
          >
            <Avatar className="w-12 h-12 border-2 border-primary/20">
              <AvatarImage src={host.profile_photo_url || undefined} />
              <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                {host.name?.charAt(0)?.toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-sm text-foreground">{host.name}</span>
                <Crown className="w-3.5 h-3.5 text-primary" />
                <Badge variant="outline" className="text-[9px] rounded-full px-1.5 py-0">Host</Badge>
              </div>
              {host.primary_role && (
                <p className="text-xs text-muted-foreground truncate">{host.primary_role}</p>
              )}
            </div>
          </a>
        )}
        {coHosts.map((coHost) => (
          <a
            key={coHost.id}
            href={`/members/${coHost.id}`}
            className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors"
          >
            <Avatar className="w-10 h-10">
              <AvatarImage src={coHost.profile_photo_url || undefined} />
              <AvatarFallback className="bg-accent/10 text-accent-foreground text-xs font-semibold">
                {coHost.name?.charAt(0)?.toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-medium text-sm text-foreground">{coHost.name}</span>
                <Badge variant="outline" className="text-[9px] rounded-full px-1.5 py-0">Co-host</Badge>
              </div>
              {coHost.primary_role && (
                <p className="text-xs text-muted-foreground truncate">{coHost.primary_role}</p>
              )}
            </div>
          </a>
        ))}
      </div>
    </div>
  );
};

export default EventHostProfile;

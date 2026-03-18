import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Calendar, MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

interface ProfileEventsTabProps {
  userId: string;
}

interface RSVPEvent {
  id: string;
  status: string;
  event: {
    id: string;
    title: string;
    event_date: string;
    event_time: string | null;
    venue_name: string | null;
    city: string | null;
    image_url: string | null;
  };
}

const STATUS_COLORS: Record<string, string> = {
  attending: "bg-primary/20 text-primary border-primary/30",
  requested: "bg-amber-500/20 text-amber-700 border-amber-500/30",
  waitlisted: "bg-muted text-muted-foreground border-border",
  canceled: "bg-destructive/20 text-destructive border-destructive/30",
};

const ProfileEventsTab = ({ userId }: ProfileEventsTabProps) => {
  const [rsvps, setRsvps] = useState<RSVPEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from("event_rsvps")
        .select("id, status, event:events (id, title, event_date, event_time, venue_name, city, image_url)")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });
      setRsvps((data || []).filter(r => r.event !== null) as RSVPEvent[]);
      setLoading(false);
    };
    fetch();
  }, [userId]);

  if (loading) {
    return (
      <div className="p-4 space-y-3">
        {[1, 2, 3].map(i => <div key={i} className="h-20 bg-muted animate-pulse rounded-xl" />)}
      </div>
    );
  }

  if (rsvps.length === 0) {
    return (
      <div className="py-16 text-center">
        <Calendar className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
        <p className="text-muted-foreground text-sm">No events yet</p>
        <p className="text-muted-foreground text-xs mt-1">RSVP to events to see them here</p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-border/30">
      {rsvps.map((rsvp) => (
        <div
          key={rsvp.id}
          className="p-4 flex gap-3 cursor-pointer hover:bg-foreground/[0.03] transition-colors"
          onClick={() => navigate(`/event/${rsvp.event.id}`)}
        >
          <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 bg-muted">
            {rsvp.event.image_url ? (
              <img src={rsvp.event.image_url} alt="" className="w-full h-full object-cover" loading="lazy" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Calendar className="w-5 h-5 text-muted-foreground" />
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground line-clamp-1">{rsvp.event.title}</p>
            <div className="flex items-center gap-1 mt-0.5">
              <MapPin className="w-3 h-3 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">{rsvp.event.venue_name || rsvp.event.city || "TBD"}</span>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs text-muted-foreground">
                {format(new Date(rsvp.event.event_date), "MMM d, yyyy")}
              </span>
              <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${STATUS_COLORS[rsvp.status] || ""}`}>
                {rsvp.status}
              </Badge>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ProfileEventsTab;

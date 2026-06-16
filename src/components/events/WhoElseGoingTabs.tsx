import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { MapPin, Tv, Plus, Users } from "lucide-react";

interface Attendee {
  user_id: string;
  name: string;
  profile_photo_url: string | null;
}

interface WatchParty {
  id: string;
  name: string;
  venue: string;
  distanceMi: number;
  attendeeCount: number;
  attendees: Attendee[];
}

interface Props {
  eventId: string;
  eventCity?: string | null;
  stadiumAttendees: Attendee[];
  stadiumTotal: number;
  onMarkStadium?: () => void;
}

// Realistic mock watch parties — only used as demonstration data.
const MOCK_WATCH_PARTIES: WatchParty[] = [
  {
    id: "mock-wp-1",
    name: "The Sports Bra Watch Party",
    venue: "The Sports Bra · Portland",
    distanceMi: 1.2,
    attendeeCount: 24,
    attendees: [
      { user_id: "m1", name: "Maya", profile_photo_url: null },
      { user_id: "m2", name: "Jess", profile_photo_url: null },
      { user_id: "m3", name: "Riley", profile_photo_url: null },
      { user_id: "m4", name: "Tess", profile_photo_url: null },
    ],
  },
  {
    id: "mock-wp-2",
    name: "Brunch & Ball at Maven",
    venue: "Maven Cafe",
    distanceMi: 2.8,
    attendeeCount: 12,
    attendees: [
      { user_id: "m5", name: "Sam", profile_photo_url: null },
      { user_id: "m6", name: "Avery", profile_photo_url: null },
      { user_id: "m7", name: "Nia", profile_photo_url: null },
    ],
  },
  {
    id: "mock-wp-3",
    name: "Loverball House Watch",
    venue: "Member's living room · Eastside",
    distanceMi: 4.6,
    attendeeCount: 8,
    attendees: [
      { user_id: "m8", name: "Quinn", profile_photo_url: null },
      { user_id: "m9", name: "Drew", profile_photo_url: null },
    ],
  },
];

const initials = (name: string) =>
  name.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase();

export default function WhoElseGoingTabs({
  eventId,
  stadiumAttendees,
  stadiumTotal,
  onMarkStadium,
}: Props) {
  const navigate = useNavigate();
  const watchParties = useMemo(() => MOCK_WATCH_PARTIES, []);

  return (
    <div className="rounded-xl bg-card border border-border/30 p-3">
      <div className="flex justify-between items-baseline mb-2.5">
        <span className="text-[10px] font-semibold tracking-[0.1em] text-muted-foreground">
          WHO ELSE IS GOING
        </span>
      </div>

      <Tabs defaultValue="stadium" className="w-full">
        <TabsList className="grid grid-cols-2 w-full h-9 mb-3">
          <TabsTrigger value="stadium" className="text-xs gap-1.5">
            <MapPin className="w-3.5 h-3.5" />
            At the stadium
          </TabsTrigger>
          <TabsTrigger value="watch" className="text-xs gap-1.5">
            <Tv className="w-3.5 h-3.5" />
            Watch parties
          </TabsTrigger>
        </TabsList>

        {/* AT THE STADIUM */}
        <TabsContent value="stadium" className="mt-0 space-y-2">
          {stadiumAttendees.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border/50 p-4 text-center space-y-2">
              <MapPin className="w-5 h-5 mx-auto text-muted-foreground" />
              <p className="text-xs font-semibold">No one's at the stadium yet</p>
              <p className="text-[11px] text-muted-foreground">
                Be the first to claim your seat.
              </p>
              <Button
                size="sm"
                className="rounded-full h-8 text-xs mt-1"
                onClick={onMarkStadium}
              >
                I'm going to the game
              </Button>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-primary">
                  {stadiumTotal} going in-person
                </span>
              </div>
              <div className="space-y-1.5">
                {stadiumAttendees.slice(0, 6).map((a) => (
                  <button
                    key={a.user_id}
                    onClick={() => navigate(`/profile/${a.user_id}`)}
                    className="w-full flex items-center gap-2.5 p-1.5 rounded-lg hover:bg-muted/50 transition-colors text-left"
                  >
                    <div className="relative">
                      <Avatar className="w-9 h-9">
                        <AvatarImage src={a.profile_photo_url || undefined} alt={a.name} />
                        <AvatarFallback className="text-[11px]">{initials(a.name)}</AvatarFallback>
                      </Avatar>
                      <span
                        className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-[hsl(173_58%_39%)] border-2 border-card flex items-center justify-center"
                        aria-label="At the stadium"
                      >
                        <MapPin className="w-2 h-2 text-white" />
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold truncate">{a.name}</p>
                      <p className="text-[10px] text-muted-foreground">At the stadium</p>
                    </div>
                  </button>
                ))}
              </div>
            </>
          )}
        </TabsContent>

        {/* WATCH PARTIES NEAR YOU */}
        <TabsContent value="watch" className="mt-0 space-y-2">
          {watchParties.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border/50 p-4 text-center space-y-2">
              <Tv className="w-5 h-5 mx-auto text-muted-foreground" />
              <p className="text-xs font-semibold">No watch parties nearby yet</p>
              <Button
                size="sm"
                className="rounded-full h-8 text-xs mt-1 gap-1"
                onClick={() =>
                  navigate(`/events/create?type=watch_party&game=${eventId}`)
                }
              >
                <Plus className="w-3.5 h-3.5" />
                Create Watch Party
              </Button>
            </div>
          ) : (
            <>
              <div className="space-y-2">
                {watchParties.map((wp) => (
                  <button
                    key={wp.id}
                    onClick={() => navigate(`/event/${wp.id}`)}
                    className="w-full text-left rounded-lg border border-border/40 bg-background/40 hover:bg-muted/50 transition-colors p-2.5"
                  >
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold truncate">{wp.name}</p>
                        <p className="text-[10px] text-muted-foreground truncate">
                          {wp.venue}
                        </p>
                      </div>
                      <span className="text-[10px] font-semibold text-primary whitespace-nowrap">
                        {wp.distanceMi.toFixed(1)} mi
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex -space-x-1.5">
                        {wp.attendees.slice(0, 4).map((a) => (
                          <Avatar key={a.user_id} className="w-6 h-6 border-2 border-card">
                            <AvatarImage src={a.profile_photo_url || undefined} alt={a.name} />
                            <AvatarFallback className="text-[9px]">
                              {initials(a.name)}
                            </AvatarFallback>
                          </Avatar>
                        ))}
                      </div>
                      <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {wp.attendeeCount} going
                      </span>
                    </div>
                  </button>
                ))}
              </div>
              <Button
                size="sm"
                variant="outline"
                className="w-full rounded-full h-8 text-xs gap-1 mt-1"
                onClick={() =>
                  navigate(`/events/create?type=watch_party&game=${eventId}`)
                }
              >
                <Plus className="w-3.5 h-3.5" />
                Host your own watch party
              </Button>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

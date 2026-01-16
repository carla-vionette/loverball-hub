import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { MapPin, Edit, Sparkles, LogOut, Calendar, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import MobileHeader from "@/components/MobileHeader";
import DesktopNav from "@/components/DesktopNav";
import BottomNav from "@/components/BottomNav";
import { format } from "date-fns";

type Profile = {
  id: string;
  name: string;
  pronouns: string | null;
  city: string | null;
  age_range: string | null;
  favorite_sports: string[] | null;
  favorite_teams_players: string[] | null;
  sports_experience_types: string[] | null;
  other_interests: string[] | null;
  event_comfort_level: string | null;
  participation_preferences: string[] | null;
  bio: string | null;
  profile_photo_url: string | null;
};

type RSVPEvent = {
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
};

type SuggestedEvent = {
  id: string;
  title: string;
  event_date: string;
  event_time: string | null;
  venue_name: string | null;
  city: string | null;
  image_url: string | null;
};

const Profile = () => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [rsvpEvents, setRsvpEvents] = useState<RSVPEvent[]>([]);
  const [suggestedEvents, setSuggestedEvents] = useState<SuggestedEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast({
      title: "Signed out",
      description: "You have been logged out successfully.",
    });
    navigate("/");
  };

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          navigate("/auth");
          return;
        }

        // Fetch profile, RSVPs, and suggested events in parallel
        const [profileResult, rsvpResult, suggestedResult] = await Promise.all([
          supabase
            .from("profiles")
            .select("*")
            .eq("id", user.id)
            .maybeSingle(),
          supabase
            .from("event_rsvps")
            .select(`
              id,
              status,
              event:events (
                id,
                title,
                event_date,
                event_time,
                venue_name,
                city,
                image_url
              )
            `)
            .eq("user_id", user.id)
            .order("created_at", { ascending: false }),
          supabase
            .from("events")
            .select("id, title, event_date, event_time, venue_name, city, image_url")
            .gte("event_date", new Date().toISOString().split("T")[0])
            .eq("status", "published")
            .order("event_date", { ascending: true })
            .limit(4)
        ]);

        // If there's an RLS error or no profile, redirect to onboarding
        if (profileResult.error) {
          console.log("Profile fetch error:", profileResult.error.message);
          navigate("/onboarding");
          return;
        }

        if (!profileResult.data) {
          navigate("/onboarding");
          return;
        }

        setProfile(profileResult.data);
        
        // Filter out any RSVPs where the event might be null
        if (rsvpResult.data) {
          const validRsvps = rsvpResult.data.filter(rsvp => rsvp.event !== null) as RSVPEvent[];
          setRsvpEvents(validRsvps);
        }

        // Set suggested events
        if (suggestedResult.data) {
          setSuggestedEvents(suggestedResult.data);
        }
      } catch (error: any) {
        console.error("Profile error:", error);
        navigate("/onboarding");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [navigate, toast]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p>Loading profile...</p>
      </div>
    );
  }

  if (!profile) return null;

  const initials = profile.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();

  const locationText = profile.city || "Location not set";

  return (
    <div className="min-h-screen bg-background">
      <MobileHeader />
      <DesktopNav />
      <BottomNav />
      
      <main className="md:ml-64 pb-20 md:pb-8 pt-20 md:pt-8">
        <div className="max-w-4xl mx-auto px-4 space-y-6">
          {/* Profile Header */}
          <Card className="overflow-hidden">
            <CardContent className="pt-8 pb-6">
              <div className="flex flex-col md:flex-row md:items-start gap-5">
                <div className="flex items-start gap-4 md:gap-5">
                  <Avatar className="w-20 h-20 md:w-24 md:h-24 border-4 border-primary/20 flex-shrink-0">
                    {profile.profile_photo_url ? (
                      <AvatarImage src={profile.profile_photo_url} alt={profile.name} className="object-cover" />
                    ) : null}
                    <AvatarFallback className="bg-primary text-primary-foreground text-xl md:text-2xl font-serif">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-2 md:mb-3">
                      <div>
                        <h1 className="text-xl md:text-2xl font-serif font-semibold">{profile.name}</h1>
                        {profile.pronouns && (
                          <p className="text-sm text-muted-foreground">{profile.pronouns}</p>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3 md:mb-4">
                      <MapPin className="w-4 h-4 text-primary/70 flex-shrink-0" />
                      <span className="truncate">{locationText}</span>
                      {profile.age_range && (
                        <>
                          <span>•</span>
                          <span>{profile.age_range}</span>
                        </>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2 md:hidden">
                      <Button variant="outline" size="sm" onClick={() => navigate("/profile/edit")} className="rounded-full">
                        <Edit className="w-4 h-4 mr-1" />
                        Edit
                      </Button>
                      <Button variant="outline" size="sm" onClick={handleLogout} className="text-destructive hover:text-destructive rounded-full">
                        <LogOut className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="hidden md:flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => navigate("/profile/edit")} className="rounded-full">
                      <Edit className="w-4 h-4 mr-2" />
                      Edit
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleLogout} className="text-destructive hover:text-destructive rounded-full">
                      <LogOut className="w-4 h-4 mr-2" />
                      Logout
                    </Button>
                  </div>
                </div>
                
                {profile.bio && (
                  <div className="flex items-start gap-2 p-4 bg-primary/5 rounded-xl border border-primary/10 w-full md:flex-1">
                    <Sparkles className="w-4 h-4 mt-1 text-primary flex-shrink-0" />
                    <p className="text-sm">{profile.bio}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Favorite Sports */}
            {profile.favorite_sports && profile.favorite_sports.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Favorite Sports</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {profile.favorite_sports.map((sport) => (
                      <Badge key={sport} variant="secondary">
                        {sport}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Favorite Teams */}
            {profile.favorite_teams_players && profile.favorite_teams_players.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Favorite Teams & Players</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {profile.favorite_teams_players.map((team) => (
                      <Badge key={team} variant="outline">
                        {team}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* How They Experience Sports */}
            {profile.sports_experience_types && profile.sports_experience_types.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>How I Experience Sports</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {profile.sports_experience_types.map((type) => (
                      <Badge key={type} variant="secondary">
                        {type}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Other Interests */}
            {profile.other_interests && profile.other_interests.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Other Interests</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {profile.other_interests.map((interest) => (
                      <Badge key={interest} variant="outline">
                        {interest}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Event Preferences */}
          {(profile.event_comfort_level || (profile.participation_preferences && profile.participation_preferences.length > 0)) && (
            <Card>
              <CardHeader>
                <CardTitle>Event Preferences</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {profile.event_comfort_level && (
                  <div>
                    <p className="text-sm font-medium mb-2">Comfort Level</p>
                    <Badge variant="secondary">{profile.event_comfort_level}</Badge>
                  </div>
                )}
                {profile.participation_preferences && profile.participation_preferences.length > 0 && (
                  <div>
                    <p className="text-sm font-medium mb-2">I want to</p>
                    <div className="flex flex-wrap gap-2">
                      {profile.participation_preferences.map((pref) => (
                        <Badge key={pref} variant="outline">
                          {pref}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* My RSVPed Events */}
          {rsvpEvents.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  My Events
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4">
                  {rsvpEvents.map((rsvp) => (
                    <div 
                      key={rsvp.id} 
                      className="p-4 border rounded-lg cursor-pointer hover:border-primary transition-colors"
                      onClick={() => navigate("/events")}
                    >
                      {rsvp.event.image_url ? (
                        <img 
                          src={rsvp.event.image_url} 
                          alt={rsvp.event.title}
                          className="w-full h-32 object-cover rounded-md mb-3"
                        />
                      ) : (
                        <div className="w-full h-32 bg-muted rounded-md mb-3 flex items-center justify-center">
                          <Calendar className="w-8 h-8 text-muted-foreground" />
                        </div>
                      )}
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-medium">{rsvp.event.title}</p>
                          <p className="text-sm text-muted-foreground">
                            {rsvp.event.venue_name || rsvp.event.city || "Location TBD"}
                          </p>
                          <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                            <Calendar className="w-3 h-3" />
                            <span>{format(new Date(rsvp.event.event_date), "MMM d, yyyy")}</span>
                            {rsvp.event.event_time && (
                              <>
                                <Clock className="w-3 h-3 ml-1" />
                                <span>{rsvp.event.event_time}</span>
                              </>
                            )}
                          </div>
                        </div>
                        <Badge 
                          variant={rsvp.status === "confirmed" ? "default" : "secondary"}
                          className="text-xs"
                        >
                          {rsvp.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Recommended Events */}
          {suggestedEvents.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Recommended Events for You</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4">
                  {suggestedEvents.map((event) => (
                    <div 
                      key={event.id} 
                      className="p-4 border rounded-lg cursor-pointer hover:border-primary transition-colors"
                      onClick={() => navigate(`/event/${event.id}`)}
                    >
                      {event.image_url ? (
                        <img 
                          src={event.image_url} 
                          alt={event.title}
                          className="w-full h-32 object-cover rounded-md mb-3"
                        />
                      ) : (
                        <div className="w-full h-32 bg-muted rounded-md mb-3 flex items-center justify-center">
                          <Calendar className="w-8 h-8 text-muted-foreground" />
                        </div>
                      )}
                      <p className="font-medium">{event.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {event.venue_name || event.city || "Location TBD"} • {format(new Date(event.event_date), "MMM d")}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Recommended Content */}
          <Card>
            <CardHeader>
              <CardTitle>Recommended Content</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-4">
                <a 
                  href="https://www.wnba.com/news" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="p-4 border rounded-lg cursor-pointer hover:border-primary hover:bg-muted/50 transition-colors block"
                >
                  <div className="w-full h-24 bg-gradient-to-br from-orange-500/20 to-primary/20 rounded-md mb-2 flex items-center justify-center">
                    <span className="text-2xl">🏀</span>
                  </div>
                  <p className="text-sm font-medium">Top WNBA Highlights</p>
                  <p className="text-xs text-muted-foreground">Latest news & videos</p>
                </a>
                <a 
                  href="https://www.nba.com/lakers" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="p-4 border rounded-lg cursor-pointer hover:border-primary hover:bg-muted/50 transition-colors block"
                >
                  <div className="w-full h-24 bg-gradient-to-br from-purple-500/20 to-yellow-500/20 rounded-md mb-2 flex items-center justify-center">
                    <span className="text-2xl">💜💛</span>
                  </div>
                  <p className="text-sm font-medium">Lakers Season Preview</p>
                  <p className="text-xs text-muted-foreground">Team updates & schedule</p>
                </a>
                <a 
                  href="https://www.latimes.com/sports" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="p-4 border rounded-lg cursor-pointer hover:border-primary hover:bg-muted/50 transition-colors block"
                >
                  <div className="w-full h-24 bg-gradient-to-br from-blue-500/20 to-accent/20 rounded-md mb-2 flex items-center justify-center">
                    <span className="text-2xl">📰</span>
                  </div>
                  <p className="text-sm font-medium">Local Sports News</p>
                  <p className="text-xs text-muted-foreground">LA Times Sports</p>
                </a>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Profile;

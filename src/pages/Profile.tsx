import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { MapPin, Edit, Sparkles, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import MobileHeader from "@/components/MobileHeader";
import DesktopNav from "@/components/DesktopNav";
import BottomNav from "@/components/BottomNav";

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

const Profile = () => {
  const [profile, setProfile] = useState<Profile | null>(null);
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

        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .maybeSingle();

        // If there's an RLS error or no profile, redirect to onboarding
        if (error) {
          console.log("Profile fetch error:", error.message);
          // User likely has no profile - redirect to onboarding
          navigate("/onboarding");
          return;
        }

        if (!data) {
          // No profile found, redirect to onboarding
          navigate("/onboarding");
          return;
        }

        setProfile(data);
      } catch (error: any) {
        console.error("Profile error:", error);
        // On any error, redirect to onboarding to create profile
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
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <Avatar className="w-20 h-20">
                  {profile.profile_photo_url ? (
                    <AvatarImage src={profile.profile_photo_url} alt={profile.name} className="object-cover" />
                  ) : null}
                  <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h1 className="text-2xl font-bold">{profile.name}</h1>
                      {profile.pronouns && (
                        <p className="text-sm text-muted-foreground">{profile.pronouns}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" onClick={() => navigate("/onboarding")}>
                        <Edit className="w-4 h-4 mr-2" />
                        Edit
                      </Button>
                      <Button variant="outline" size="sm" onClick={handleLogout} className="text-destructive hover:text-destructive">
                        <LogOut className="w-4 h-4 mr-2" />
                        Logout
                      </Button>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                    <MapPin className="w-4 h-4" />
                    <span>{locationText}</span>
                    {profile.age_range && (
                      <>
                        <span>•</span>
                        <span>{profile.age_range}</span>
                      </>
                    )}
                  </div>
                  
                  {profile.bio && (
                    <div className="flex items-start gap-2 p-3 bg-muted rounded-lg">
                      <Sparkles className="w-4 h-4 mt-1 text-primary flex-shrink-0" />
                      <p className="text-sm">{profile.bio}</p>
                    </div>
                  )}
                </div>
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

          {/* Recommended Events - Placeholder */}
          <Card>
            <CardHeader>
              <CardTitle>Recommended Events for You</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="p-4 border rounded-lg">
                  <div className="w-full h-32 bg-muted rounded-md mb-3"></div>
                  <p className="font-medium">Lakers Watch Party</p>
                  <p className="text-sm text-muted-foreground">Echo Park • This Saturday</p>
                </div>
                <div className="p-4 border rounded-lg">
                  <div className="w-full h-32 bg-muted rounded-md mb-3"></div>
                  <p className="font-medium">Women's Soccer Pickup</p>
                  <p className="text-sm text-muted-foreground">Downtown LA • Every Sunday</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recommended Content - Placeholder */}
          <Card>
            <CardHeader>
              <CardTitle>Recommended Content</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="p-4 border rounded-lg">
                  <div className="w-full h-24 bg-muted rounded-md mb-2"></div>
                  <p className="text-sm font-medium">Top WNBA Highlights</p>
                </div>
                <div className="p-4 border rounded-lg">
                  <div className="w-full h-24 bg-muted rounded-md mb-2"></div>
                  <p className="text-sm font-medium">Lakers Season Preview</p>
                </div>
                <div className="p-4 border rounded-lg">
                  <div className="w-full h-24 bg-muted rounded-md mb-2"></div>
                  <p className="text-sm font-medium">Local Sports News</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Profile;

import BottomNav from "@/components/BottomNav";
import DesktopNav from "@/components/DesktopNav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Calendar, Heart, Edit, MessageCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Profile = () => {
  const navigate = useNavigate();
  
  const favoriteTeams = [
    "Seattle Storm",
    "USWNT",
    "Chicago Sky",
    "Portland Thorns",
  ];

  const interests = [
    "Basketball",
    "Soccer",
    "Marathon Running",
    "Volleyball",
    "Tennis",
  ];

  const recentActivity = [
    {
      id: 1,
      type: "Joined Event",
      title: "WNBA Watch Party",
      date: "2 days ago",
    },
    {
      id: 2,
      type: "Commented",
      title: "Beyond the Court - Episode 5",
      date: "5 days ago",
    },
    {
      id: 3,
      type: "Joined Event",
      title: "Basketball Skills Workshop",
      date: "1 week ago",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <DesktopNav />
      <BottomNav />
      
      <main className="md:ml-64 container mx-auto px-4 py-8 pb-20 md:pb-8">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Messages Button - Mobile Only */}
          <Button 
            onClick={() => navigate('/messages')}
            className="w-full md:hidden flex items-center justify-center gap-2"
            size="lg"
          >
            <MessageCircle className="w-5 h-5" />
            Messages
          </Button>

          {/* Profile Header */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row gap-6">
                <div className="w-32 h-32 rounded-full bg-primary/20 flex items-center justify-center text-4xl font-bold text-primary">
                  JD
                </div>
                
                <div className="flex-1">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h1 className="text-3xl font-bold text-foreground mb-2">Jane Doe</h1>
                      <div className="flex flex-col gap-2 text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4" />
                          <span>Brooklyn, NY</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          <span>Joined January 2025</span>
                        </div>
                      </div>
                    </div>
                    <Button variant="outline" size="sm">
                      <Edit className="w-4 h-4 mr-2" />
                      Edit Profile
                    </Button>
                  </div>
                  
                  <p className="text-foreground/80 mb-4">
                    Basketball enthusiast and sports content creator. Love connecting with fellow fans and attending live games!
                  </p>
                  
                  <div className="flex gap-6 text-sm">
                    <div>
                      <span className="font-bold text-foreground">12</span>{" "}
                      <span className="text-muted-foreground">Events Attended</span>
                    </div>
                    <div>
                      <span className="font-bold text-foreground">48</span>{" "}
                      <span className="text-muted-foreground">Connections</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Favorite Teams */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Heart className="w-5 h-5 text-primary" />
                Favorite Teams
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {favoriteTeams.map((team) => (
                  <Badge key={team} variant="secondary" className="text-sm py-2 px-4">
                    {team}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Sports Interests */}
          <Card>
            <CardHeader>
              <CardTitle>Sports Interests</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {interests.map((interest) => (
                  <Badge key={interest} className="bg-accent text-accent-foreground text-sm py-2 px-4">
                    {interest}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivity.map((activity) => (
                  <div key={activity.id} className="flex justify-between items-center py-3 border-b border-border last:border-0">
                    <div>
                      <div className="font-semibold text-foreground">{activity.title}</div>
                      <div className="text-sm text-muted-foreground">{activity.type}</div>
                    </div>
                    <div className="text-sm text-muted-foreground">{activity.date}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Profile;

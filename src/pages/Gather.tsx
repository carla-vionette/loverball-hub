import { Calendar, MapPin, Users, Clock } from "lucide-react";
import BottomNav from "@/components/BottomNav";
import DesktopNav from "@/components/DesktopNav";
import MobileHeader from "@/components/MobileHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import wnbaWatchParty from "@/assets/wnba-watch-party.jpg";
import brunchBasketball from "@/assets/brunch-basketball.jpg";
import sunsetVolleyball from "@/assets/sunset-volleyball.jpg";
import fieldDay from "@/assets/field-day.jpg";
import marchMadnessParty from "@/assets/march-madness-party.jpg";
import brunchRunClub from "@/assets/brunch-run-club.jpg";

const Gather = () => {
  const events = [
    {
      id: 1,
      title: "WNBA Finals Watch Party",
      type: "Watch Party",
      date: "March 15, 2025",
      time: "7:00 PM",
      location: "Brooklyn Sports Bar",
      city: "Brooklyn, NY",
      attendees: 24,
      maxAttendees: 30,
      image: wnbaWatchParty,
      hostAvatar: "",
      hostName: "Sarah M.",
    },
    {
      id: 2,
      title: "Sunday Brunch & Basketball Talk",
      type: "Brunch",
      date: "March 17, 2025",
      time: "11:00 AM",
      location: "The Garden Cafe",
      city: "Austin, TX",
      attendees: 12,
      maxAttendees: 15,
      image: brunchBasketball,
      hostAvatar: "",
      hostName: "Emma J.",
    },
    {
      id: 3,
      title: "Sunset Picnic & Volleyball",
      type: "Picnic",
      date: "March 20, 2025",
      time: "5:30 PM",
      location: "Riverside Park",
      city: "Chicago, IL",
      attendees: 18,
      maxAttendees: 25,
      image: sunsetVolleyball,
      hostAvatar: "",
      hostName: "Lisa C.",
    },
    {
      id: 4,
      title: "Field Day: Soccer & Basketball",
      type: "Field Day",
      date: "March 22, 2025",
      time: "10:00 AM",
      location: "Central Sports Complex",
      city: "Seattle, WA",
      attendees: 32,
      maxAttendees: 40,
      image: fieldDay,
      hostAvatar: "",
      hostName: "Maya P.",
    },
    {
      id: 5,
      title: "Women's March Madness Watch Party",
      type: "Watch Party",
      date: "March 24, 2025",
      time: "6:00 PM",
      location: "The Sports Lounge",
      city: "Denver, CO",
      attendees: 28,
      maxAttendees: 35,
      image: marchMadnessParty,
      hostAvatar: "",
      hostName: "Rachel K.",
    },
    {
      id: 6,
      title: "Brunch & Run Club Kickoff",
      type: "Brunch",
      date: "March 28, 2025",
      time: "9:00 AM",
      location: "Morning Glory Cafe",
      city: "Portland, OR",
      attendees: 15,
      maxAttendees: 20,
      image: brunchRunClub,
      hostAvatar: "",
      hostName: "Jenna T.",
    },
  ];

  const typeColors: Record<string, string> = {
    "Watch Party": "bg-primary text-primary-foreground",
    "Brunch": "bg-secondary text-secondary-foreground",
    "Picnic": "bg-accent text-accent-foreground",
    "Field Day": "bg-muted text-muted-foreground",
  };

  return (
    <div className="min-h-screen bg-background">
      <MobileHeader />
      <DesktopNav />
      <BottomNav />
      
      <main className="md:ml-64 pb-20 md:pb-8">
        <div className="container mx-auto px-4 pt-20 md:pt-6 py-6">
          <div className="mb-6">
            <h1 className="text-3xl md:text-4xl font-bold mb-2">Gather</h1>
            <p className="text-muted-foreground">
              Join local watch parties, brunches, picnics, and field day games near you
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {events.map((event) => (
              <Card key={event.id} className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer">
                <div className="relative aspect-video overflow-hidden">
                  <img
                    src={event.image}
                    alt={event.title}
                    className="w-full h-full object-cover hover:scale-105 transition-transform"
                  />
                  <Badge className={`absolute top-3 right-3 ${typeColors[event.type]}`}>
                    {event.type}
                  </Badge>
                </div>
                
                <CardContent className="pt-4">
                  <h3 className="font-bold text-lg mb-3 line-clamp-2">{event.title}</h3>
                  
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="w-4 h-4 flex-shrink-0" />
                      <span>{event.date}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="w-4 h-4 flex-shrink-0" />
                      <span>{event.time}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="w-4 h-4 flex-shrink-0" />
                      <span className="line-clamp-1">{event.location}, {event.city}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Users className="w-4 h-4 flex-shrink-0" />
                      <span>{event.attendees}/{event.maxAttendees} attending</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-border">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">
                        {event.hostName.split(' ').map(n => n[0]).join('')}
                      </div>
                      <span className="text-sm text-muted-foreground">by {event.hostName}</span>
                    </div>
                    <Button size="sm" className="rounded-full">
                      Join
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Gather;

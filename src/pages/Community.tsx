import Navigation from "@/components/Navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, Users } from "lucide-react";
import communityImg from "@/assets/community-event.jpg";

const Community = () => {
  const events = [
    {
      id: 1,
      title: "WNBA Watch Party",
      date: "March 15, 2025",
      location: "Brooklyn, NY",
      attendees: 24,
      category: "Watch Party",
      image: communityImg,
    },
    {
      id: 2,
      title: "Women's Soccer Meetup",
      date: "March 18, 2025",
      location: "Austin, TX",
      attendees: 16,
      category: "Pickup Game",
      image: communityImg,
    },
    {
      id: 3,
      title: "Basketball Skills Workshop",
      date: "March 22, 2025",
      location: "Chicago, IL",
      attendees: 32,
      category: "Workshop",
      image: communityImg,
    },
    {
      id: 4,
      title: "Marathon Training Group",
      date: "March 25, 2025",
      location: "Seattle, WA",
      attendees: 18,
      category: "Training",
      image: communityImg,
    },
    {
      id: 5,
      title: "Softball League Kickoff",
      date: "March 28, 2025",
      location: "Denver, CO",
      attendees: 45,
      category: "League",
      image: communityImg,
    },
    {
      id: 6,
      title: "Tennis Tournament",
      date: "April 2, 2025",
      location: "Miami, FL",
      attendees: 28,
      category: "Tournament",
      image: communityImg,
    },
  ];

  const categoryColors = {
    "Watch Party": "bg-coral text-coral-foreground",
    "Pickup Game": "bg-accent text-accent-foreground",
    "Workshop": "bg-medium-blue text-medium-blue-foreground",
    "Training": "bg-olive text-olive-foreground",
    "League": "bg-pale-pink text-pale-pink-foreground",
    "Tournament": "bg-primary text-primary-foreground",
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">Community Events</h1>
          <p className="text-lg text-muted-foreground">
            Find and join local meetups, watch parties, and sports experiences
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((event) => (
            <Card key={event.id} className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer">
              <div className="aspect-video overflow-hidden">
                <img
                  src={event.image}
                  alt={event.title}
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                />
              </div>
              <CardHeader>
                <div className="flex justify-between items-start mb-2">
                  <CardTitle className="text-xl">{event.title}</CardTitle>
                  <Badge className={categoryColors[event.category as keyof typeof categoryColors]}>
                    {event.category}
                  </Badge>
                </div>
                <CardDescription className="space-y-2">
                  <div className="flex items-center gap-2 text-foreground/80">
                    <Calendar className="w-4 h-4" />
                    <span>{event.date}</span>
                  </div>
                  <div className="flex items-center gap-2 text-foreground/80">
                    <MapPin className="w-4 h-4" />
                    <span>{event.location}</span>
                  </div>
                  <div className="flex items-center gap-2 text-foreground/80">
                    <Users className="w-4 h-4" />
                    <span>{event.attendees} attending</span>
                  </div>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <button className="w-full bg-primary text-primary-foreground py-2 rounded-lg font-semibold hover:bg-primary/90 transition-colors">
                  Join Event
                </button>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
};

export default Community;

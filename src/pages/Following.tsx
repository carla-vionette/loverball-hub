import BottomNav from "@/components/BottomNav";
import DesktopNav from "@/components/DesktopNav";
import MobileHeader from "@/components/MobileHeader";
import LASportsTicker from "@/components/LASportsTicker";
import { useNavigate } from "react-router-dom";
import { CalendarDays, Users, ShoppingBag, Heart } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import loverballLogo from "@/assets/loverball-logo-new.png";

const Following = () => {
  const navigate = useNavigate();

  const quickLinks = [
    { icon: CalendarDays, label: "Events", description: "Browse upcoming events & watch parties", path: "/events" },
    { icon: Heart, label: "Network", description: "Discover & connect with other fans", path: "/network" },
    { icon: Users, label: "Members", description: "See your matches & connections", path: "/members" },
    { icon: ShoppingBag, label: "Shop", description: "Browse Loverball merch", path: "/shop" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <MobileHeader />
      <DesktopNav />
      <BottomNav />
      
      <div className="fixed top-16 md:top-0 left-0 right-0 md:left-64 z-30">
        <LASportsTicker />
      </div>
      
      <main className="md:ml-64 pb-20 md:pb-8 pt-[92px] md:pt-[48px]">
        <div className="container mx-auto px-4 py-8 max-w-2xl">
          <div className="flex flex-col items-center text-center mb-10">
            <img src={loverballLogo} alt="Loverball" className="h-16 w-auto mb-4" />
            <h1 className="text-2xl font-serif text-foreground mb-2">Welcome to Loverball</h1>
            <p className="text-foreground/60 text-sm">Your home for women in sports culture.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {quickLinks.map((link) => {
              const Icon = link.icon;
              return (
                <Card
                  key={link.path}
                  className="cursor-pointer hover:border-primary hover:shadow-md transition-all duration-200"
                  onClick={() => navigate(link.path)}
                >
                  <CardContent className="flex items-start gap-4 p-5">
                    <div className="p-2.5 rounded-xl bg-primary/10">
                      <Icon className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{link.label}</p>
                      <p className="text-sm text-foreground/50 mt-0.5">{link.description}</p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Following;

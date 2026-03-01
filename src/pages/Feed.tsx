import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Clock, TrendingUp, Bookmark } from "lucide-react";
import BottomNav from "@/components/BottomNav";
import DesktopNav from "@/components/DesktopNav";
import MobileHeader from "@/components/MobileHeader";

const TABS = ["For You", "WNBA", "NWSL", "Tennis", "Trending"];

const FEATURED_ARTICLE = {
  id: "f1",
  title: "Inside the Rise of Women's Basketball: Why Viewership Just Doubled",
  category: "WNBA",
  image: "/images/all-stars-event.jpg",
  author: "Loverball Editorial",
  readTime: "6 min read",
  excerpt: "From packed arenas to record TV deals, women's basketball is having its biggest moment yet. Here's what's driving the surge.",
};

const ARTICLES = [
  { id: "a1", title: "Angel City FC's Bold New Strategy for 2025 Season", category: "NWSL", image: "/images/angel-city-fc-opener.jpg", author: "Maya Chen", readTime: "4 min", time: "2h ago" },
  { id: "a2", title: "Coco Gauff's Unstoppable Run: What It Means for Women's Tennis", category: "Tennis", image: "/images/la28-olympics-mixer.jpg", author: "Sarah Kim", readTime: "5 min", time: "4h ago" },
  { id: "a3", title: "The Best Watch Party Spots in LA This Weekend", category: "Community", image: "/images/reggaeton-superbowl-party.jpg", author: "Loverball Staff", readTime: "3 min", time: "6h ago" },
  { id: "a4", title: "How NIL Deals Are Changing Women's College Sports", category: "NCAA", image: "/images/women-panel-event.jpg", author: "Rachel Torres", readTime: "7 min", time: "8h ago" },
  { id: "a5", title: "LA28 Olympics: Women's Events You Won't Want to Miss", category: "Olympics", image: "/images/world-cup-la-preview.jpg", author: "Emma Davis", readTime: "5 min", time: "12h ago" },
  { id: "a6", title: "Your Guide to the Women's World Cup Coming to LA", category: "FIFA", image: "/images/life-basketball-sanaa.jpg", author: "Sophia Lopez", readTime: "6 min", time: "1d ago" },
];

const Feed = () => {
  const [activeTab, setActiveTab] = useState("For You");

  return (
    <div className="min-h-screen bg-background">
      <MobileHeader />
      <DesktopNav />
      <BottomNav />

      <main className="md:ml-64 pt-16 md:pt-0 pb-24 md:pb-0">
        <div className="max-w-4xl mx-auto px-5 md:px-10 py-6">
          <h1 className="font-condensed text-3xl font-bold uppercase tracking-wide mb-5">News Feed</h1>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="bg-transparent gap-1 mb-6 flex-wrap h-auto p-0">
              {TABS.map((tab) => (
                <TabsTrigger
                  key={tab}
                  value={tab}
                  className="rounded-full px-5 py-2 text-sm font-semibold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                >
                  {tab}
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value={activeTab} className="mt-0 space-y-6">
              {/* FEATURED ARTICLE */}
              <Card className="overflow-hidden group cursor-pointer hover:shadow-lg transition-all border-border/30">
                <div className="relative h-56 md:h-72 overflow-hidden">
                  <img src={FEATURED_ARTICLE.image} alt={FEATURED_ARTICLE.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-5">
                    <Badge className="bg-primary text-primary-foreground text-[10px] font-bold tracking-wider rounded-sm mb-2">
                      {FEATURED_ARTICLE.category}
                    </Badge>
                    <h2 className="text-white font-condensed text-2xl md:text-3xl font-bold uppercase leading-tight">
                      {FEATURED_ARTICLE.title}
                    </h2>
                    <p className="text-white/70 text-sm mt-2 line-clamp-2">{FEATURED_ARTICLE.excerpt}</p>
                    <div className="flex items-center gap-3 mt-3 text-white/60 text-xs">
                      <span>{FEATURED_ARTICLE.author}</span>
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{FEATURED_ARTICLE.readTime}</span>
                    </div>
                  </div>
                </div>
              </Card>

              {/* ARTICLE LIST */}
              <div className="space-y-4">
                {ARTICLES.map((article) => (
                  <Card key={article.id} className="overflow-hidden group cursor-pointer hover:shadow-md transition-all border-border/30">
                    <div className="flex gap-4 p-4">
                      <div className="w-24 h-24 md:w-32 md:h-24 rounded-lg overflow-hidden flex-shrink-0">
                        <img src={article.image} alt={article.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline" className="text-[10px] font-bold rounded-full px-2 py-0.5">
                            {article.category}
                          </Badge>
                          <span className="text-[10px] text-muted-foreground">{article.time}</span>
                        </div>
                        <h3 className="font-bold text-sm md:text-base line-clamp-2 group-hover:text-primary transition-colors">
                          {article.title}
                        </h3>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-xs text-muted-foreground">{article.author} · {article.readTime}</span>
                          <Bookmark className="w-4 h-4 text-muted-foreground hover:text-primary cursor-pointer" />
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
};

export default Feed;

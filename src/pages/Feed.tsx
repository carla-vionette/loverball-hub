import React, { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Clock, Bookmark, Share2, ExternalLink, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import BottomNav from "@/components/BottomNav";
import DesktopNav from "@/components/DesktopNav";
import MobileHeader from "@/components/MobileHeader";
import { useShare } from "@/hooks/useShare";
import { toast } from "@/hooks/use-toast";

const TABS = ["For You", "WNBA", "NWSL", "Tennis", "Trending"];

interface Article {
  id: string;
  title: string;
  tag: string;
  image: string;
  author: string;
  readTime: string;
  time: string;
  sourceUrl: string;
  sourceName: string;
  synopsis: string;
}

const FEATURED: Article = {
  id: "featured",
  title: "Inside the Rise of Women's Basketball: Why Viewership Just Doubled",
  tag: "WNBA",
  image: "/images/all-stars-event.jpg",
  author: "Loverball Editorial",
  readTime: "6 min read",
  time: "1h ago",
  sourceUrl: "https://www.espn.com/wnba/",
  sourceName: "ESPN",
  synopsis: "Women's basketball is experiencing an unprecedented surge in popularity, with WNBA viewership doubling year-over-year and arenas selling out across the country. The league's new media deal, worth over $2 billion, signals a seismic shift in how women's sports are valued by networks and advertisers.\n\nFrom Caitlin Clark's record-breaking rookie season to A'ja Wilson's MVP dominance, the star power driving this growth is undeniable. Cities are competing to land expansion franchises, and merchandise sales have shattered previous records.\n\nExperts say this isn't a temporary spike — it's a structural change in the sports landscape. With the 2028 Olympics in Los Angeles on the horizon, women's basketball is positioned to become one of the most-watched sports in America.",
};

const ARTICLES: Article[] = [
  { id: "a1", title: "Angel City FC's Bold New Strategy for 2025 Season", tag: "NWSL", image: "/images/angel-city-fc-opener.jpg", author: "Maya Chen", readTime: "4 min", time: "2h ago", sourceUrl: "https://www.nwslsoccer.com/", sourceName: "NWSL", synopsis: "Angel City FC is making waves with a completely revamped roster and coaching philosophy heading into the 2025 season. The club has invested heavily in international talent while maintaining its commitment to developing homegrown players from the LA area.\n\nNew head coach has implemented a high-pressing system that mirrors the most successful European clubs, and early preseason results suggest the strategy is paying dividends. Fan engagement is at an all-time high, with season ticket sales surpassing expectations.\n\nThe ownership group, led by prominent women in entertainment and business, continues to set the standard for how professional women's sports teams should be run — both on and off the pitch." },
  { id: "a2", title: "Coco Gauff's Unstoppable Run: What It Means for Women's Tennis", tag: "Tennis", image: "/images/la28-olympics-mixer.jpg", author: "Sarah Kim", readTime: "5 min", time: "4h ago", sourceUrl: "https://www.wtatennis.com/", sourceName: "WTA", synopsis: "At just 20 years old, Coco Gauff is redefining what's possible in women's tennis. Her dominant run through the hardcourt season has drawn comparisons to the Williams sisters in their prime, and she's showing no signs of slowing down.\n\nGauff's game has matured dramatically — her serve is more consistent, her movement more efficient, and her tactical awareness has reached an elite level. Off the court, she's become one of the most marketable athletes in the world.\n\nTennis analysts believe Gauff could hold the number one ranking for years to come, ushering in a new golden age for women's tennis that will captivate audiences worldwide." },
  { id: "a3", title: "The Best Watch Party Spots in LA This Weekend", tag: "Trending", image: "/images/reggaeton-superbowl-party.jpg", author: "Loverball Staff", readTime: "3 min", time: "6h ago", sourceUrl: "#", sourceName: "Loverball", synopsis: "Looking for the perfect spot to catch this weekend's games with fellow sports fans? LA has no shortage of amazing watch party venues, from rooftop bars in DTLA to beachside lounges in Santa Monica.\n\nOur curated list includes spots that cater specifically to women's sports fans, with big screens, great food, and an atmosphere that celebrates the games we love. Several venues are partnering with Loverball for exclusive member events.\n\nWhether you're into basketball, soccer, or tennis, there's a watch party waiting for you this weekend." },
  { id: "a4", title: "How NIL Deals Are Changing Women's College Sports", tag: "Trending", image: "/images/women-panel-event.jpg", author: "Rachel Torres", readTime: "7 min", time: "8h ago", sourceUrl: "https://www.ncaa.com/", sourceName: "NCAA", synopsis: "The NIL (Name, Image, and Likeness) era has been transformative for women's college athletes, with many earning six-figure deals that were unimaginable just a few years ago. From social media partnerships to local business sponsorships, female athletes are finally being compensated for their marketability.\n\nData shows that women's college basketball and volleyball players are among the highest earners in the NIL space, often outpacing their male counterparts in social media engagement and brand alignment.\n\nThis shift is not only changing the financial landscape for student-athletes but also influencing recruiting, with top prospects considering NIL opportunities alongside athletic and academic programs." },
  { id: "a5", title: "LA28 Olympics: Women's Events You Won't Want to Miss", tag: "Trending", image: "/images/world-cup-la-preview.jpg", author: "Emma Davis", readTime: "5 min", time: "12h ago", sourceUrl: "https://la28.org/", sourceName: "LA28", synopsis: "With the 2028 Olympics coming to Los Angeles, the countdown is on for what promises to be a landmark moment for women's sports. The Games will feature more women's events than ever before, with several new disciplines making their Olympic debut.\n\nFrom flag football to cricket, the expanded program reflects the growing global interest in women's athletics. Venue preparations are already underway across LA, with several iconic locations being transformed into world-class competition sites.\n\nFor LA-based sports fans, the Olympics represent an once-in-a-lifetime opportunity to witness the world's best female athletes compete right in their backyard." },
  { id: "a6", title: "Your Guide to the Women's World Cup Coming to LA", tag: "Trending", image: "/images/life-basketball-sanaa.jpg", author: "Sophia Lopez", readTime: "6 min", time: "1d ago", sourceUrl: "https://www.fifa.com/", sourceName: "FIFA", synopsis: "The FIFA Women's World Cup is heading to the United States, and Los Angeles is set to be one of the premier host cities. With matches scheduled at SoFi Stadium and the Rose Bowl, LA will be at the center of the world's biggest women's sporting event.\n\nTicket demand is expected to be unprecedented, with organizers projecting record-breaking attendance figures. The tournament will also bring a massive economic boost to the city, with hotels, restaurants, and local businesses preparing for an influx of international visitors.\n\nFor the Loverball community, this is the ultimate opportunity to come together and celebrate women's soccer on the biggest stage." },
];

const Feed = () => {
  const [tab, setTab] = useState("For You");
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [bookmarked, setBookmarked] = useState<Set<string>>(new Set());
  const { share } = useShare();

  const filteredArticles = tab === "For You" || tab === "Trending"
    ? ARTICLES
    : ARTICLES.filter(a => a.tag === tab);

  const showFeatured = tab === "For You" || tab === FEATURED.tag;

  const toggleBookmark = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setBookmarked(prev => {
      const s = new Set(prev);
      s.has(id) ? s.delete(id) : s.add(id);
      toast({ title: s.has(id) ? "Bookmarked" : "Removed bookmark" });
      return s;
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <MobileHeader />
      <DesktopNav />
      <BottomNav />

      <main className="md:ml-64 pt-16 md:pt-0 pb-24 md:pb-0">
        <div className="max-w-4xl mx-auto px-5 md:px-10 py-6">
          <h1 className="font-condensed text-3xl font-bold uppercase tracking-wide mb-5">News Feed</h1>

          <Tabs value={tab} onValueChange={setTab}>
            <TabsList className="bg-transparent gap-1 mb-6 flex-wrap h-auto p-0">
              {TABS.map(t => (
                <TabsTrigger key={t} value={t} className="rounded-full px-5 py-2 text-sm font-semibold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                  {t}
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value={tab} className="mt-0 space-y-6">
              {/* FEATURED */}
              {showFeatured && (
                <Card
                  className="overflow-hidden group cursor-pointer hover:shadow-lg transition-all border-border/30"
                  onClick={() => setSelectedArticle(FEATURED)}
                >
                  <div className="relative h-56 md:h-72 overflow-hidden">
                    <img src={FEATURED.image} alt={FEATURED.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    <div className="absolute inset-0 bg-gradient-to-t from-foreground/70 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-5">
                      <Badge className="bg-primary text-primary-foreground text-[10px] font-bold tracking-wider rounded-sm mb-2">{FEATURED.tag}</Badge>
                      <h2 className="text-card font-condensed text-2xl md:text-3xl font-bold uppercase leading-tight">{FEATURED.title}</h2>
                      <p className="text-card/70 text-sm mt-2 line-clamp-2 font-sans">{FEATURED.synopsis.split('\n')[0]}</p>
                      <div className="flex items-center gap-3 mt-3 text-card/60 text-xs font-sans">
                        <span>{FEATURED.author}</span>
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{FEATURED.readTime}</span>
                      </div>
                    </div>
                  </div>
                </Card>
              )}

              {/* ARTICLES */}
              <div className="space-y-4">
                {filteredArticles.map(a => (
                  <Card
                    key={a.id}
                    className="overflow-hidden group cursor-pointer hover:shadow-md transition-all border-border/30"
                    onClick={() => setSelectedArticle(a)}
                  >
                    <div className="flex gap-4 p-4">
                      <div className="w-24 h-24 md:w-32 md:h-24 rounded-lg overflow-hidden flex-shrink-0">
                        <img src={a.image} alt={a.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline" className="text-[10px] font-bold rounded-full px-2 py-0.5">{a.tag}</Badge>
                          <span className="text-[10px] text-muted-foreground font-sans">{a.time}</span>
                        </div>
                        <h3 className="font-bold text-sm md:text-base line-clamp-2 group-hover:text-primary transition-colors font-sans">{a.title}</h3>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-xs text-muted-foreground font-sans">{a.author} · {a.readTime}</span>
                          <Bookmark
                            className={`w-4 h-4 cursor-pointer transition-colors ${bookmarked.has(a.id) ? "text-primary fill-primary" : "text-muted-foreground hover:text-primary"}`}
                            onClick={(e) => toggleBookmark(a.id, e)}
                          />
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

      {/* ARTICLE DETAIL MODAL */}
      <Dialog open={!!selectedArticle} onOpenChange={(open) => !open && setSelectedArticle(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0 gap-0">
          {selectedArticle && (
            <>
              <div className="relative h-48 md:h-64 overflow-hidden">
                <img src={selectedArticle.image} alt={selectedArticle.title} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent" />
                <Badge className="absolute top-4 left-4 bg-primary text-primary-foreground text-[10px] font-bold tracking-wider rounded-sm">
                  {selectedArticle.tag}
                </Badge>
              </div>

              <div className="px-6 pb-6 -mt-8 relative z-10">
                <h2 className="font-condensed text-2xl md:text-3xl font-bold uppercase leading-tight mb-3">
                  {selectedArticle.title}
                </h2>
                <div className="flex items-center gap-3 text-xs text-muted-foreground font-sans mb-6">
                  <span>{selectedArticle.author}</span>
                  <span>·</span>
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{selectedArticle.readTime}</span>
                  <span>·</span>
                  <span>{selectedArticle.time}</span>
                  <span>·</span>
                  <span className="text-primary font-semibold">{selectedArticle.sourceName}</span>
                </div>

                {/* Synopsis */}
                <div className="space-y-4 text-sm leading-relaxed text-foreground/80 font-sans mb-8">
                  {selectedArticle.synopsis.split('\n\n').map((p, i) => (
                    <p key={i}>{p}</p>
                  ))}
                </div>

                {/* Actions */}
                <div className="flex flex-wrap gap-3">
                  <Button
                    className="flex-1 min-w-[200px] gap-2 font-semibold"
                    onClick={() => window.open(selectedArticle.sourceUrl, '_blank', 'noopener,noreferrer')}
                  >
                    <ExternalLink className="w-4 h-4" />
                    Read Full Article
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => share({ title: selectedArticle.title, url: selectedArticle.sourceUrl })}
                  >
                    <Share2 className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => toggleBookmark(selectedArticle.id)}
                  >
                    <Bookmark className={`w-4 h-4 ${bookmarked.has(selectedArticle.id) ? "fill-primary text-primary" : ""}`} />
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Feed;

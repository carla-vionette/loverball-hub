import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { motion } from "framer-motion";
import { ArrowRight, Calendar, MapPin, Clock, Play, Users, Heart, ChevronLeft, ChevronRight } from "lucide-react";
import { format } from "date-fns";

import heroImage from "@/assets/hero-women-new.png";
import loverballLogo from "@/assets/loverball-script-logo.png";
import communityImage from "@/assets/landing-community.jpg";
import { FEED_VIDEOS } from "@/lib/feedVideoData";

// LA Teams grid data
const LA_TEAMS = [
  { name: "Lakers", logo: "https://a.espncdn.com/i/teamlogos/nba/500/lal.png", league: "NBA" },
  { name: "Dodgers", logo: "https://a.espncdn.com/i/teamlogos/mlb/500/lad.png", league: "MLB" },
  { name: "LAFC", logo: "https://a.espncdn.com/i/teamlogos/soccer/500/5765.png", league: "MLS" },
  { name: "Rams", logo: "https://a.espncdn.com/i/teamlogos/nfl/500/lar.png", league: "NFL" },
  { name: "Angel City", logo: "https://a.espncdn.com/i/teamlogos/soccer/500/6926.png", league: "NWSL" },
  { name: "Sparks", logo: "https://a.espncdn.com/i/teamlogos/wnba/500/la.png", league: "WNBA" },
  { name: "Clippers", logo: "https://a.espncdn.com/i/teamlogos/nba/500/lac.png", league: "NBA" },
  { name: "Galaxy", logo: "https://a.espncdn.com/i/teamlogos/soccer/500/184.png", league: "MLS" },
  { name: "Kings", logo: "https://a.espncdn.com/i/teamlogos/nhl/500/la.png", league: "NHL" },
  { name: "Chargers", logo: "https://a.espncdn.com/i/teamlogos/nfl/500/lac.png", league: "NFL" },
  { name: "UCLA", logo: "https://a.espncdn.com/i/teamlogos/ncaa/500/26.png", league: "NCAA" },
  { name: "USC", logo: "https://a.espncdn.com/i/teamlogos/ncaa/500/30.png", league: "NCAA" },
];

const testimonials = [
  { quote: "Loverball changed how I experience game day. I finally have a crew that matches my energy.", name: "Jasmine T.", role: "Basketball & WNBA fan" },
  { quote: "The watch parties are incredible—I've never felt more connected to other women sports fans.", name: "Sophia R.", role: "Soccer & Liga MX fan" },
  { quote: "As a die-hard baseball fan, finding women who go just as hard for their teams was everything.", name: "Kayla M.", role: "Baseball & Dodgers fan" },
];

const howItWorks = [
  { step: "01", icon: Users, title: "Join the Community", description: "Sign up with an invite code and set up your profile with your favorite teams and sports." },
  { step: "02", icon: Calendar, title: "Attend Events", description: "Find watch parties, brunches, and meetups with women who love the same teams you do." },
  { step: "03", icon: Heart, title: "Connect & Grow", description: "Build real friendships, discover new content, and celebrate your fandom together." },
];

interface FeaturedEvent {
  id: string;
  title: string;
  event_date: string;
  event_time?: string | null;
  venue_name?: string | null;
  city?: string | null;
  image_url?: string | null;
  event_type?: string | null;
}

const Home = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [featuredEvents, setFeaturedEvents] = useState<FeaturedEvent[]>([]);
  const [carouselIdx, setCarouselIdx] = useState(0);
  const [memberCount, setMemberCount] = useState(2500);

  useEffect(() => {
    if (!authLoading && user) {
      navigate("/profile", { replace: true });
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    const fetchData = async () => {
      const [eventsRes, profilesRes] = await Promise.all([
        supabase.from("events").select("id, title, event_date, event_time, venue_name, city, image_url, event_type").gte("event_date", new Date().toISOString().split("T")[0]).eq("status", "published").order("event_date", { ascending: true }).limit(5),
        supabase.from("profiles").select("id", { count: "exact", head: true }),
      ]);
      if (eventsRes.data) setFeaturedEvents(eventsRes.data);
      if (profilesRes.count) setMemberCount(Math.max(profilesRes.count, 2500));
    };
    fetchData();
  }, []);

  const latestVideos = FEED_VIDEOS.slice(0, 4);

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(":");
    const d = new Date();
    d.setHours(parseInt(hours), parseInt(minutes));
    return format(d, "h:mm a");
  };

  const nextSlide = () => setCarouselIdx(i => (i + 1) % Math.max(featuredEvents.length, 1));
  const prevSlide = () => setCarouselIdx(i => (i - 1 + Math.max(featuredEvents.length, 1)) % Math.max(featuredEvents.length, 1));

  if (authLoading) return null;

  return (
    <div className="min-h-screen bg-background">
      {/* HERO SECTION — Full bleed with bold red overlay */}
      <section className="relative min-h-[95vh] flex items-end overflow-hidden">
        <div className="absolute inset-0">
          <img src={heroImage} alt="LA women sports community" className="w-full h-full object-cover object-[center_35%]" />
          <div className="absolute inset-0 bg-gradient-to-t from-foreground/90 via-foreground/40 to-transparent" />
        </div>
        <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-12 pb-16 md:pb-24 w-full">
          <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} className="max-w-3xl">
            <img src={loverballLogo} alt="Loverball" className="h-14 w-auto mb-6 brightness-0 invert" />
            <h1 className="text-6xl sm:text-7xl lg:text-8xl font-display leading-none mb-6 text-primary">
              Her Game.<br /><em>Her Community.</em>
            </h1>
            <p className="text-xl text-white/70 leading-relaxed mb-8 max-w-lg font-serif">
              Join {memberCount.toLocaleString()}+ women sports lovers in Los Angeles
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button size="lg" onClick={() => navigate("/")} className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90 px-10 py-6 text-base font-sans tracking-widest uppercase shadow-xl">
                Join Free <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button size="lg" variant="outline" onClick={() => navigate("/events")} className="rounded-full border-2 border-white/30 text-white hover:bg-white/10 px-8 py-6 text-base bg-transparent font-sans tracking-widest uppercase">
                Explore Events
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* RED SCROLLING TICKER */}
      <div className="bg-primary py-3 overflow-hidden">
        <motion.div
          animate={{ x: [0, -1200] }}
          transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
          className="flex gap-16 whitespace-nowrap"
        >
          {[...Array(12)].map((_, i) => (
            <span key={i} className="flex items-center gap-16 text-xs tracking-[0.4em] font-sans font-bold text-primary-foreground/90 uppercase">
              <span>Women's Sports Elevated</span>
              <span className="text-primary-foreground/40">★</span>
              <span>Join the Movement</span>
              <span className="text-primary-foreground/40">★</span>
              <span>Her Game Her Rules</span>
              <span className="text-primary-foreground/40">★</span>
            </span>
          ))}
        </motion.div>
      </div>

      {/* EDITORIAL QUOTE BLOCK */}
      <section className="py-24 bg-background">
        <div className="max-w-4xl mx-auto px-6 lg:px-12 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <span className="text-8xl font-display text-primary leading-none italic">"</span>
            <p className="text-3xl sm:text-4xl lg:text-5xl font-display text-foreground leading-[1.15] -mt-6">
              We specialize in creating{" "}
              <em className="text-primary">tailored</em>{" "}
              sports content and experiences that{" "}
              <em className="text-primary">inspire women.</em>
            </p>
          </motion.div>
        </div>
      </section>

      {/* FEATURED EVENTS CAROUSEL */}
      {featuredEvents.length > 0 && (
        <section className="py-20 bg-secondary">
          <div className="max-w-7xl mx-auto px-6 lg:px-12">
            <div className="flex items-end justify-between mb-10">
              <div>
                <p className="text-xs font-sans tracking-[0.3em] uppercase text-foreground/50 mb-3">What's Next</p>
                <h2 className="font-display text-4xl md:text-5xl text-foreground italic">Featured Events</h2>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="icon" className="rounded-full" onClick={prevSlide}><ChevronLeft className="w-4 h-4" /></Button>
                <Button variant="outline" size="icon" className="rounded-full" onClick={nextSlide}><ChevronRight className="w-4 h-4" /></Button>
              </div>
            </div>
            <div className="overflow-hidden">
              <motion.div
                className="flex gap-6"
                animate={{ x: `-${carouselIdx * (100 / Math.min(featuredEvents.length, 3))}%` }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              >
                {featuredEvents.map(event => (
                  <div key={event.id} className="min-w-[calc(33.333%-16px)] max-w-[calc(33.333%-16px)] flex-shrink-0 max-md:min-w-[calc(100%-16px)] max-md:max-w-[calc(100%-16px)]">
                    <Card className="overflow-hidden cursor-pointer group border-border" onClick={() => navigate(`/event/${event.id}`)}>
                      <div className="relative h-52 bg-muted overflow-hidden">
                        {event.image_url ? (
                          <img src={event.image_url} alt={event.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center"><Calendar className="w-12 h-12 text-primary/20" /></div>
                        )}
                        {event.event_type && (
                          <Badge className="absolute top-3 left-3 bg-primary text-primary-foreground rounded-sm font-sans font-bold tracking-wider text-xs">{event.event_type}</Badge>
                        )}
                      </div>
                      <CardContent className="pt-4 space-y-2">
                        <h4 className="font-display text-lg line-clamp-2 group-hover:text-primary transition-colors normal-case">{event.title}</h4>
                        <div className="flex items-center gap-3 text-sm text-muted-foreground font-sans">
                          <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />{format(new Date(event.event_date), "MMM d")}</span>
                          {event.event_time && <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{formatTime(event.event_time)}</span>}
                        </div>
                        {(event.venue_name || event.city) && (
                          <p className="text-sm text-muted-foreground flex items-center gap-1 font-sans"><MapPin className="w-3.5 h-3.5" />{event.venue_name}{event.venue_name && event.city ? ", " : ""}{event.city}</p>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                ))}
              </motion.div>
            </div>
          </div>
        </section>
      )}

      {/* HOW IT WORKS — Numbered editorial */}
      <section className="py-24 bg-background">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="text-center mb-16">
            <p className="text-xs font-sans tracking-[0.3em] uppercase text-foreground/50 mb-4">Getting Started</p>
            <h2 className="font-display text-5xl md:text-6xl text-foreground italic">How It Works</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {howItWorks.map((step, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: i * 0.15 }} viewport={{ once: true }}>
                <div className="border border-border p-8 h-full hover:border-primary transition-colors duration-300">
                  <span className="font-display text-6xl text-primary/25 leading-none block mb-6">{step.step}</span>
                  <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-6">
                    <step.icon className="w-7 h-7 text-primary" />
                  </div>
                  <h3 className="text-2xl font-display text-foreground mb-3 normal-case">{step.title}</h3>
                  <p className="text-foreground/60 leading-relaxed font-serif">{step.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* LATEST VIDEOS */}
      <section className="py-20 bg-secondary">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="flex items-end justify-between mb-10">
            <div>
              <p className="text-xs font-sans tracking-[0.3em] uppercase text-foreground/50 mb-3">Watch Now</p>
              <h2 className="font-display text-4xl md:text-5xl text-foreground italic">Latest Videos</h2>
            </div>
            <Button variant="outline" className="rounded-full font-sans tracking-widest uppercase text-xs" onClick={() => navigate("/watch")}>View All <ArrowRight className="ml-1 w-4 h-4" /></Button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {latestVideos.map((video, i) => (
              <Card key={video.id} className={`overflow-hidden cursor-pointer group border-border ${i === 0 ? 'sm:col-span-2 sm:row-span-2' : ''}`} onClick={() => navigate("/watch")}>
                <div className={`relative ${i === 0 ? 'aspect-[4/3]' : 'aspect-video'} bg-muted overflow-hidden`}>
                  <img src={video.thumbnail} alt={video.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  <div className="absolute inset-0 flex items-center justify-center bg-foreground/20 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="w-14 h-14 rounded-full bg-primary flex items-center justify-center shadow-xl">
                      <Play className="w-6 h-6 text-primary-foreground ml-0.5" />
                    </div>
                  </div>
                  {video.duration && (
                    <span className="absolute bottom-2 right-2 bg-foreground/80 text-background text-[10px] px-1.5 py-0.5 rounded font-sans font-bold">{Math.floor(video.duration / 60)}:{String(video.duration % 60).padStart(2, '0')}</span>
                  )}
                </div>
                <CardContent className="pt-3 pb-4">
                  <h4 className="text-sm font-display line-clamp-2 group-hover:text-primary transition-colors normal-case">{video.title}</h4>
                  <p className="text-xs text-muted-foreground mt-1 font-sans">{video.channelName}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* COMMUNITY TESTIMONIALS */}
      <section className="py-24 bg-background">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="text-center mb-14">
            <p className="text-xs font-sans tracking-[0.3em] uppercase text-foreground/50 mb-4">Community Love</p>
            <h2 className="font-display text-5xl md:text-6xl text-foreground italic">What Members Say</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((t, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: i * 0.1 }} viewport={{ once: true }}>
                <div className={`p-8 sm:p-10 h-full flex flex-col ${i === 0 ? 'bg-primary text-primary-foreground' : i === 1 ? 'bg-accent text-accent-foreground' : 'border border-border bg-card'}`}>
                  <span className="font-display text-5xl leading-none opacity-20 mb-4">"</span>
                  <p className={`leading-relaxed flex-1 mb-6 text-lg font-serif italic ${i < 2 ? 'opacity-90' : 'text-foreground/80'}`}>"{t.quote}"</p>
                  <div>
                    <p className={`font-sans font-bold text-sm ${i < 2 ? '' : 'text-foreground'}`}>{t.name}</p>
                    <p className={`text-xs font-sans ${i < 2 ? 'opacity-60' : 'text-muted-foreground'}`}>{t.role}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* TEAMS WE LOVE */}
      <section className="py-20 bg-secondary">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="text-center mb-14">
            <p className="text-xs font-sans tracking-[0.3em] uppercase text-foreground/50 mb-4">Our Teams</p>
            <h2 className="font-display text-5xl md:text-6xl text-foreground italic">Teams We Love</h2>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-5">
            {LA_TEAMS.map(team => (
              <motion.div key={team.name} whileHover={{ scale: 1.06, y: -4 }} className="flex flex-col items-center gap-3 p-5 bg-card border border-border hover:border-primary hover:shadow-lg transition-all cursor-pointer">
                <img src={team.logo} alt={team.name} className="w-14 h-14 object-contain" onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
                <div className="text-center">
                  <p className="text-sm font-sans font-bold text-foreground">{team.name}</p>
                  <p className="text-[10px] text-muted-foreground font-sans font-bold tracking-wider uppercase">{team.league}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* JOIN CTA — Bold red block */}
      <section className="py-28 bg-primary">
        <div className="max-w-4xl mx-auto px-6 lg:px-12 text-center">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} transition={{ duration: 0.8 }} viewport={{ once: true }}>
            <h2 className="text-5xl sm:text-6xl lg:text-7xl font-display text-primary-foreground mb-6 italic leading-[0.95]">
              Ready to Join?
            </h2>
            <p className="text-xl text-primary-foreground/60 mb-10 max-w-2xl mx-auto font-serif">
              Be part of the movement redefining women's sports fandom in LA.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" onClick={() => navigate("/")} className="rounded-full text-lg px-10 py-7 bg-accent text-accent-foreground hover:bg-accent/90 font-sans tracking-widest uppercase shadow-xl">
                Join Loverball <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button size="lg" variant="outline" onClick={() => navigate("/events")} className="rounded-full text-lg px-10 py-7 border-2 border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10 bg-transparent font-sans tracking-widest uppercase">
                Explore Events
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="py-12 bg-foreground">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <img src={loverballLogo} alt="Loverball" className="h-10 w-auto brightness-0 invert" />
            <p className="text-sm text-background/40 font-sans">© 2026 Loverball. All rights reserved. Built by women, for women.</p>
            <div className="flex gap-4">
              <a href="/privacy" className="text-sm text-background/50 hover:text-background transition-colors font-sans">Privacy</a>
              <a href="/terms" className="text-sm text-background/50 hover:text-background transition-colors font-sans">Terms</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;

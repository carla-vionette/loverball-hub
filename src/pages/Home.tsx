import { useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { motion } from "framer-motion";
import { ArrowRight, Users, Calendar, Trophy, Play, ShoppingBag, Heart, Compass, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import BottomNav from "@/components/BottomNav";
import DesktopNav from "@/components/DesktopNav";
import MobileHeader from "@/components/MobileHeader";

import loverballLogo from "@/assets/loverball-script-logo.png";
import heroImage from "@/assets/hero-women-new.png";

const STATS = [
  { label: "Members", value: "24K", icon: Users },
  { label: "Events", value: "340", icon: Calendar },
  { label: "Sports", value: "18", icon: Trophy },
];

const SPORTS = [
  "BASKETBALL", "SOCCER", "TENNIS", "VOLLEYBALL", "SOFTBALL", "TRACK & FIELD",
  "SWIMMING", "GYMNASTICS", "WNBA", "NWSL", "GOLF", "BOXING", "SURFING",
  "SKATEBOARDING", "WRESTLING", "FENCING", "LACROSSE", "ROWING",
];

const QUICK_LINKS = [
  { label: "Discover", desc: "Find your match", icon: Compass, path: "/discover", color: "bg-primary" },
  { label: "Events", desc: "Join the fun", icon: Calendar, path: "/events", color: "bg-info" },
  { label: "Watch", desc: "Trending reels", icon: Play, path: "/watch", color: "bg-hot-pink" },
  { label: "Shop", desc: "Merch drop", icon: ShoppingBag, path: "/shop", color: "bg-foreground" },
];

const TRENDING = [
  { id: 1, title: "Angel City FC Announces New Stadium Deal", tag: "NWSL", image: "/images/angel-city-fc-opener.jpg", time: "2h ago" },
  { id: 2, title: "WNBA All-Star Weekend Comes to LA", tag: "WNBA", image: "/images/all-stars-event.jpg", time: "4h ago" },
  { id: 3, title: "Women's World Cup 2026: What to Expect", tag: "FIFA", image: "/images/world-cup-la-preview.jpg", time: "6h ago" },
];

const EVENTS = [
  { id: 1, title: "WNBA Finals Watch Party", date: "Mar 15", loc: "Downtown LA", count: 24, img: "/images/all-stars-event.jpg" },
  { id: 2, title: "Brunch & Basketball Talk", date: "Mar 17", loc: "Silver Lake", count: 12, img: "/images/women-panel-event.jpg" },
  { id: 3, title: "Sunset Volleyball Meetup", date: "Mar 20", loc: "Santa Monica", count: 18, img: "/images/la28-olympics-mixer.jpg" },
  { id: 4, title: "Soccer Saturday Tailgate", date: "Mar 22", loc: "Inglewood", count: 32, img: "/images/reggaeton-superbowl-party.jpg" },
  { id: 5, title: "Tennis Social & Clinic", date: "Mar 25", loc: "Pasadena", count: 15, img: "/images/life-basketball-sanaa.jpg" },
];

const Home = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && !user) navigate("/", { replace: true });
  }, [user, loading, navigate]);

  if (loading) return null;

  return (
    <div className="min-h-screen bg-background">
      <MobileHeader />
      <DesktopNav />
      <BottomNav />

      <main className="md:ml-64 pt-16 md:pt-0 pb-24 md:pb-0">
        {/* ── HERO ── */}
        <section className="relative overflow-hidden bg-gradient-to-br from-primary via-primary/90 to-primary/70 text-primary-foreground">
          <div className="absolute inset-0 opacity-20">
            <img src={heroImage} alt="" className="w-full h-full object-cover" aria-hidden="true" />
          </div>
          <div className="relative z-10 px-5 py-14 md:px-10 md:py-20 max-w-6xl mx-auto">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
              <img src={loverballLogo} alt="Loverball" className="h-10 w-auto mb-4 brightness-0 invert" />
              <h1 className="font-condensed text-5xl md:text-7xl font-bold uppercase tracking-tight leading-none mb-3">
                Her Game.<br />Her Story.
              </h1>
              <p className="text-primary-foreground/80 text-lg max-w-md mb-6 font-sans">
                The #1 community for women sports fans in LA.
              </p>
              <Button size="lg" className="rounded-full bg-card text-primary hover:bg-card/90 font-bold px-8" onClick={() => navigate("/discover")}>
                Start Matching <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </motion.div>
          </div>
        </section>

        {/* ── STATS ROW ── */}
        <div className="bg-foreground text-background">
          <div className="max-w-6xl mx-auto px-5 py-5 flex justify-around">
            {STATS.map((s) => (
              <div key={s.label} className="text-center">
                <p className="font-condensed text-3xl md:text-4xl font-bold tabular-nums">{s.value}</p>
                <p className="text-xs uppercase tracking-widest text-background/60 mt-1 font-sans">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── SPORTS MARQUEE ── */}
        <div className="bg-primary/10 py-3 overflow-hidden">
          <motion.div
            animate={{ x: [0, -1500] }}
            transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
            className="flex gap-8 whitespace-nowrap"
          >
            {[...SPORTS, ...SPORTS].map((s, i) => (
              <span key={i} className="flex items-center gap-8 text-xs font-condensed font-bold tracking-[0.2em] text-primary/70 uppercase">
                <span>{s}</span>
                <span className="text-primary/30">◆</span>
              </span>
            ))}
          </motion.div>
        </div>

        {/* ── QUICK ACCESS ── */}
        <section className="px-5 md:px-10 py-8 max-w-6xl mx-auto">
          <h2 className="font-condensed text-2xl font-bold uppercase tracking-wide mb-5">Quick Access</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {QUICK_LINKS.map((l) => (
              <Link key={l.path} to={l.path}>
                <Card className="group hover:shadow-lg transition-all border-border/30 overflow-hidden">
                  <CardContent className="p-5 flex flex-col items-start gap-3">
                    <div className={`w-11 h-11 rounded-xl ${l.color} flex items-center justify-center`}>
                      <l.icon className="w-5 h-5 text-primary-foreground" />
                    </div>
                    <div>
                      <p className="font-condensed text-lg font-bold uppercase">{l.label}</p>
                      <p className="text-xs text-muted-foreground font-sans">{l.desc}</p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </section>

        {/* ── TRENDING NEWS ── */}
        <section className="px-5 md:px-10 py-8 max-w-6xl mx-auto">
          <h2 className="font-condensed text-2xl font-bold uppercase tracking-wide flex items-center gap-2 mb-5">
            <TrendingUp className="w-5 h-5 text-primary" /> Trending
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {TRENDING.map((n) => (
              <Card key={n.id} className="overflow-hidden group cursor-pointer hover:shadow-lg transition-all border-border/30">
                <div className="relative h-44 overflow-hidden">
                  <img src={n.image} alt={n.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  <Badge className="absolute top-3 left-3 bg-primary text-primary-foreground text-[10px] font-bold tracking-wider rounded-sm">{n.tag}</Badge>
                </div>
                <CardContent className="p-4">
                  <h3 className="font-bold text-sm line-clamp-2 group-hover:text-primary transition-colors font-sans">{n.title}</h3>
                  <p className="text-xs text-muted-foreground mt-2 font-sans">{n.time}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* ── UPCOMING EVENTS SCROLL ── */}
        <section className="px-5 md:px-10 py-8 max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-condensed text-2xl font-bold uppercase tracking-wide">Upcoming Events</h2>
            <Link to="/events" className="text-sm text-primary font-semibold hover:underline flex items-center gap-1 font-sans">
              View All <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide -mx-5 px-5">
            {EVENTS.map((e) => (
              <Card key={e.id} className="min-w-[260px] max-w-[260px] flex-shrink-0 overflow-hidden group cursor-pointer hover:shadow-lg transition-all border-border/30">
                <div className="relative h-36 overflow-hidden">
                  <img src={e.img} alt={e.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                </div>
                <CardContent className="p-4">
                  <h3 className="font-bold text-sm line-clamp-2 font-sans">{e.title}</h3>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground mt-2 font-sans">
                    <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{e.date}</span>
                    <span className="flex items-center gap-1"><Users className="w-3 h-3" />{e.count}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 font-sans">{e.loc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* ── MATCH CTA BANNER ── */}
        <section className="px-5 md:px-10 py-8 max-w-6xl mx-auto">
          <div className="bg-gradient-to-r from-primary to-hot-pink rounded-2xl p-8 md:p-12 text-primary-foreground flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h2 className="font-condensed text-3xl md:text-4xl font-bold uppercase mb-2">Find Your Sports Bestie</h2>
              <p className="text-primary-foreground/80 max-w-md font-sans">Swipe, match, and connect with women who love the same teams you do.</p>
            </div>
            <Button size="lg" className="rounded-full bg-card text-primary hover:bg-card/90 font-bold px-8 shrink-0" onClick={() => navigate("/discover")}>
              <Heart className="w-4 h-4 mr-2" /> Start Matching
            </Button>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Home;

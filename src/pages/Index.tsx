import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { useAuth } from "@/hooks/useAuth";
import { motion } from "framer-motion";
import { ArrowRight, Lock, Users, Sparkles, Calendar, X, Menu, Mail, Play, Heart, ShoppingBag, Clock, MapPin, Zap } from "lucide-react";
import heroImage from "@/assets/hero-women-new.png";
import { useLiveSportsBadge } from "@/hooks/useLiveSportsBadge";
import loverballLogo from "@/assets/loverball-script-logo.png";
import philosophyImage from "@/assets/philosophy-image.jpg";
import communityImage from "@/assets/landing-community.jpg";
import athletesImage from "@/assets/landing-athletes.jpg";
import fansImage from "@/assets/landing-fans.jpg";
import teamSpirit from "@/assets/community-women.jpg";
import wnbaWatch from "@/assets/landing-woman.png";
import { z } from "zod";

const signUpSchema = z.object({
  email: z.string().trim().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});


const LiveSportsBadge = () => {
  const { currentItem, loading: badgeLoading } = useLiveSportsBadge();

  const displayText = badgeLoading
    ? "Loading live scores…"
    : currentItem
      ? currentItem.text
      : "No live games right now — check back soon!";

  const isLive = currentItem?.isLive ?? false;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, delay: 0.3 }}
      className="inline-flex items-center gap-2 bg-accent text-accent-foreground rounded-full px-4 py-2 mb-8 shadow-lg"
    >
      <span className="relative flex h-2.5 w-2.5">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent-foreground opacity-75" />
        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-accent-foreground" />
      </span>
      {currentItem?.sport && <span className="text-sm">{currentItem.sport}</span>}
      <span className="text-[11px] font-sans font-bold tracking-wide uppercase">
        {displayText}
      </span>
    </motion.div>
  );
};

const Index = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();
  const isAuthenticated = !!user;


  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error, data } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (error) throw error;
      if (data.user) {
        const { data: profile } = await supabase.from("profiles").select("*").eq("id", data.user.id).maybeSingle();
        navigate(profile ? "/profile" : "/onboarding");
        toast({ title: "Welcome back!", description: "Successfully logged in." });
        setAuthModalOpen(false);
      }
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      toast({ title: "Email required", description: "Please enter your email address.", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/auth?reset=true`
      });
      if (error) throw error;
      toast({ title: "Check your email", description: "We've sent you a password reset link." });
      setShowForgotPassword(false);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const validation = signUpSchema.safeParse({ email, password });
      if (!validation.success) throw new Error(validation.error.errors[0].message);
      const { error, data } = await supabase.auth.signUp({
        email: validation.data.email,
        password: validation.data.password,
        options: { emailRedirectTo: `${window.location.origin}/onboarding` }
      });
      if (error) throw error;
      if (data.user) {
        toast({ title: "Welcome to Loverball!", description: "Let's set up your profile." });
        setAuthModalOpen(false);
        navigate("/onboarding");
      }
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const openAuthModal = () => setAuthModalOpen(true);

  const sportsTicker = [
  { emoji: "🎾", label: "Tennis" },
  { emoji: "🏎️", label: "Formula 1" },
  { emoji: "⛳", label: "Golf" },
  { emoji: "🏐", label: "Volleyball" },
  { emoji: "🥎", label: "Softball" },
  { emoji: "🏒", label: "Hockey" },
  { emoji: "🏀", label: "Basketball" },
  { emoji: "⚽", label: "Soccer" },
  { emoji: "🏃‍♀️", label: "Running" },
  { emoji: "🏈", label: "Football" }];


  const trendingStories = [
  { tag: "TENNIS", title: "Coco Gauff Leads USA Fed Cup Charge in April Showdown", time: "Mar 14", image: "/images/all-stars-event.jpg" },
  { tag: "NWSL", title: "Angel City FC Signs Brazilian Star Ary Borges to Three-Year Deal", time: "Apr 2", image: "/images/angel-city-fc-opener.jpg" },
  { tag: "OLYMPICS", title: "LA28 Women's Sports Preview: New Events & Venues Announced", time: "Jun 10", image: "/images/la28-olympics-mixer.jpg" },
  { tag: "SOCCER", title: "World Cup LA 2026: Women's Watch Party Guide Drops This Spring", time: "Apr 18", image: "/images/world-cup-la-preview.jpg" }];


  const nearbyEvents = [
  { date: "MAR 22", time: "7:00 PM", title: "Sparks vs Aces Watch Party", venue: "The Victorian, Santa Monica", type: "Watch Party" },
  { date: "MAR 28", time: "5:30 PM", title: "Angel City FC Tailgate", venue: "BMO Stadium, DTLA", type: "Game Day" },
  { date: "APR 02", time: "6:00 PM", title: "Tennis & Tequila: Indian Wells", venue: "The Bungalow, Santa Monica", type: "Meetup" },
  { date: "APR 05", time: "4:00 PM", title: "March Madness Mixer", venue: "Loverball HQ, Venice", type: "Watch Party" }];


  const featureCards = [
  { icon: Heart, title: "DISCOVER FANS", desc: "Connect with women who share your sports passion", color: "bg-hot-pink" },
  { icon: Calendar, title: "FIND EVENTS", desc: "Watch parties, tailgates & meetups near you", color: "bg-primary" },
  { icon: Play, title: "WATCH", desc: "Originals, highlights & creator content", color: "bg-accent" },
  { icon: ShoppingBag, title: "SHOP", desc: "Apparel and gear for the ultimate fan", color: "bg-foreground" }];


  return (
    <div className="min-h-screen bg-background overflow-x-hidden landing-theme">
      {/* NAV */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/98 backdrop-blur-sm">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
          <div className="flex items-center justify-between h-20">
            <div className="hidden lg:flex items-center gap-10">
              <a href="#explore" className="text-[11px] font-sans font-bold tracking-[0.25em] uppercase text-foreground/50 hover:text-foreground transition-colors">Explore</a>
              <a href="#trending" className="text-[11px] font-sans font-bold tracking-[0.25em] uppercase text-foreground/50 hover:text-foreground transition-colors">Trending</a>
              <a href="#events" className="text-[11px] font-sans font-bold tracking-[0.25em] uppercase text-foreground/50 hover:text-foreground transition-colors">Events</a>
            </div>
            <div className="absolute left-1/2 -translate-x-1/2">
              <img src={loverballLogo} alt="Loverball" className="h-56 w-auto" />
            </div>
            <div className="hidden lg:flex items-center gap-10">
              <button onClick={() => isAuthenticated ? navigate("/shop") : openAuthModal()} className="text-[11px] font-sans font-bold tracking-[0.25em] uppercase text-foreground/50 hover:text-foreground transition-colors bg-transparent border-none cursor-pointer">Shop</button>
              <button onClick={() => isAuthenticated ? navigate("/watch") : openAuthModal()} className="text-[11px] font-sans font-bold tracking-[0.25em] uppercase text-foreground/50 hover:text-foreground transition-colors bg-transparent border-none cursor-pointer">Watch</button>
              <Button onClick={openAuthModal} className="rounded-full bg-accent text-accent-foreground hover:bg-accent/90 px-7 py-2.5 text-[11px] font-sans font-bold tracking-[0.2em] uppercase h-auto shadow-lg">
                Join Loverball
              </Button>
            </div>
            <div className="lg:hidden ml-auto">
              <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="rounded-full">
                {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
            </div>
          </div>
        </div>
        {mobileMenuOpen &&
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="lg:hidden bg-background border-t border-border/30 px-8 py-6 space-y-1">
            <div className="flex justify-center mb-6">
              <img src={loverballLogo} alt="Loverball" className="h-14 w-auto" />
            </div>
            <a href="#explore" onClick={() => setMobileMenuOpen(false)} className="block py-3 text-[11px] font-sans font-bold tracking-[0.25em] uppercase text-foreground/60">Explore</a>
            <a href="#trending" onClick={() => setMobileMenuOpen(false)} className="block py-3 text-[11px] font-sans font-bold tracking-[0.25em] uppercase text-foreground/60">Trending</a>
            <a href="#events" onClick={() => setMobileMenuOpen(false)} className="block py-3 text-[11px] font-sans font-bold tracking-[0.25em] uppercase text-foreground/60">Events</a>
            <Button onClick={() => {setMobileMenuOpen(false);openAuthModal();}} className="w-full rounded-full mt-4 bg-accent text-accent-foreground text-[11px] tracking-[0.2em] uppercase">
              Join Loverball
            </Button>
          </motion.div>
        }
      </nav>

      {/* AUTH MODAL */}
      <Dialog open={authModalOpen} onOpenChange={setAuthModalOpen}>
        <DialogContent className="sm:max-w-md rounded-3xl p-0 overflow-hidden border-border/20">
          <div className="p-8 sm:p-10">
            <DialogTitle className="sr-only">Member Access</DialogTitle>
            <div className="flex justify-center mb-8">
              <img src={loverballLogo} alt="Loverball" className="h-20 w-auto" />
            </div>
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2 bg-muted rounded-full p-1 h-12">
                <TabsTrigger value="login" className="rounded-full data-[state=active]:bg-accent data-[state=active]:text-accent-foreground text-[11px] font-sans font-bold tracking-[0.1em] uppercase">Sign In</TabsTrigger>
                <TabsTrigger value="signup" className="rounded-full data-[state=active]:bg-accent data-[state=active]:text-accent-foreground text-[11px] font-sans font-bold tracking-[0.1em] uppercase">Sign Up</TabsTrigger>
              </TabsList>
              <TabsContent value="login">
                {showForgotPassword ?
                <form onSubmit={handleForgotPassword} className="space-y-5 mt-8">
                    <div className="space-y-2">
                      <Label htmlFor="reset-email" className="text-foreground text-[11px] tracking-[0.1em] uppercase">Email</Label>
                      <Input id="reset-email" type="email" placeholder="Enter your email" value={email} onChange={(e) => setEmail(e.target.value)} required className="bg-background border-border text-foreground rounded-xl h-12" />
                    </div>
                    <p className="text-muted-foreground text-sm">We'll send you a link to reset your password.</p>
                    <Button type="submit" className="w-full rounded-full h-12 bg-accent text-accent-foreground text-[11px] font-sans tracking-[0.1em] uppercase" disabled={loading}>{loading ? "Sending..." : "Send Reset Link"}</Button>
                    <button type="button" onClick={() => setShowForgotPassword(false)} className="w-full text-sm text-accent hover:text-accent/80 transition-colors font-medium">Back to sign in</button>
                  </form> :

                <form onSubmit={handleLogin} className="space-y-5 mt-8">
                    <div className="space-y-2">
                      <Label htmlFor="login-email" className="text-foreground text-[11px] tracking-[0.1em] uppercase">Email</Label>
                      <Input id="login-email" type="email" placeholder="Enter your email" value={email} onChange={(e) => setEmail(e.target.value)} required className="bg-background border-border text-foreground rounded-xl h-12" />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="login-password" className="text-foreground text-[11px] tracking-[0.1em] uppercase">Password</Label>
                        <button type="button" onClick={() => setShowForgotPassword(true)} className="text-xs text-accent hover:text-accent/80 transition-colors">Forgot?</button>
                      </div>
                      <Input id="login-password" type="password" placeholder="Enter your password" value={password} onChange={(e) => setPassword(e.target.value)} required className="bg-background border-border text-foreground rounded-xl h-12" />
                    </div>
                    <Button type="submit" className="w-full rounded-full h-12 bg-accent text-accent-foreground text-[11px] font-sans tracking-[0.1em] uppercase" disabled={loading}>{loading ? "Signing in..." : "Sign In"}</Button>
                  </form>
                }
              </TabsContent>
              <TabsContent value="signup">
                <form onSubmit={handleSignup} className="space-y-5 mt-8">
                  <div className="space-y-2">
                    <Label htmlFor="signup-email" className="text-foreground text-[11px] tracking-[0.1em] uppercase">Email</Label>
                    <Input id="signup-email" type="email" placeholder="Enter your email" value={email} onChange={(e) => setEmail(e.target.value)} required className="bg-background border-border text-foreground rounded-xl h-12" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password" className="text-foreground text-[11px] tracking-[0.1em] uppercase">Password</Label>
                    <Input id="signup-password" type="password" placeholder="Create a password (min 6)" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} className="bg-background border-border text-foreground rounded-xl h-12" />
                  </div>
                  <Button type="submit" className="w-full rounded-full h-12 bg-accent text-accent-foreground text-[11px] font-sans tracking-[0.1em] uppercase" disabled={loading}>{loading ? "Creating account..." : "Create Account"}</Button>
                </form>
              </TabsContent>
            </Tabs>
          </div>
        </DialogContent>
      </Dialog>

      {/* ═══════ HERO ═══════ */}
      <section className="pt-28 lg:pt-24">
        <div className="grid lg:grid-cols-2 min-h-[90vh]">
          {/* Left */}
          <div className="bg-primary relative flex items-center px-8 lg:px-16 py-20 lg:py-0">
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, ease: "easeOut" }}
              className="relative z-10 max-w-lg">
              
              {/* Live badge - dynamic */}
              <LiveSportsBadge />

              <span className="text-[11px] font-sans font-bold tracking-[0.3em] uppercase text-primary-foreground/70 mb-6 block">
                A GLOBAL SPORTS MEDIA + COMMUNITY PLATFORM
              </span>
              <h1 className="font-condensed font-bold text-[4.5rem] sm:text-[6rem] lg:text-[7.5rem] leading-[0.85] tracking-tight text-primary-foreground uppercase mb-6">
                Her<br />Game.<br />
                <span className="text-foreground">Her</span><br />
                <span className="text-foreground">Community.</span>
              </h1>
              <p className="text-base font-sans font-medium text-primary-foreground/85 leading-relaxed mb-8 max-w-sm">The media platform built for women who live and breathe sports. Discover community events, connect with fans, and watch exclusive sports content curated for you.
              </p>
              <div className="flex flex-col sm:flex-row items-start gap-4">
                <Button onClick={openAuthModal} className="rounded-full bg-accent text-accent-foreground hover:bg-accent/90 px-8 py-5 text-[11px] font-sans font-bold tracking-[0.2em] uppercase shadow-xl h-auto">
                  Join Loverball <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <Button onClick={() => document.getElementById("events")?.scrollIntoView({ behavior: "smooth" })} variant="outline" className="rounded-full border-2 border-primary-foreground text-primary-foreground bg-transparent hover:bg-primary-foreground/10 px-8 py-5 text-[11px] font-sans font-bold tracking-[0.2em] uppercase h-auto">
                  Find Events
                </Button>
              </div>
            </motion.div>
          </div>

          {/* Right — Images */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.9, delay: 0.2 }}
            className="bg-background relative flex items-center justify-center py-20 lg:py-0 px-8 overflow-hidden">
            
            <div className="relative w-full max-w-md h-[500px] lg:h-[600px]">
              <motion.div initial={{ opacity: 0, rotate: -8, scale: 0.9 }} animate={{ opacity: 1, rotate: -6, scale: 1 }} transition={{ duration: 0.8, delay: 0.4 }} className="absolute left-0 bottom-12 w-[55%] z-10">
                <div className="rounded-2xl overflow-hidden shadow-2xl border-4 border-card">
                  <img src={athletesImage} alt="Women athletes" className="w-full aspect-[3/4] object-cover" />
                </div>
              </motion.div>
              <motion.div initial={{ opacity: 0, y: 30, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.8, delay: 0.5 }} className="absolute left-[20%] top-4 w-[60%] z-20">
                <div className="rounded-2xl overflow-hidden shadow-2xl border-4 border-card">
                  <img src={heroImage} alt="Women sports fans" className="w-full aspect-[3/4] object-cover object-[center_30%]" />
                </div>
              </motion.div>
              <motion.div initial={{ opacity: 0, rotate: 8, scale: 0.9 }} animate={{ opacity: 1, rotate: 5, scale: 1 }} transition={{ duration: 0.8, delay: 0.6 }} className="absolute right-0 bottom-16 w-[50%] z-10">
                <div className="rounded-2xl overflow-hidden shadow-2xl border-4 border-card">
                  <img src={fansImage} alt="Fans celebrating" className="w-full aspect-[3/4] object-cover" />
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>

      </section>

      {/* ═══════ SPORTS TICKER ═══════ */}
      <div className="bg-accent py-3.5 overflow-hidden">
        <div className="flex items-center gap-10 whitespace-nowrap animate-[shimmer_30s_linear_infinite] px-8">
          {[...sportsTicker, ...sportsTicker, ...sportsTicker].map((sport, i) =>
          <span key={i} className="text-[12px] font-sans font-bold tracking-[0.25em] uppercase text-accent-foreground/90 flex items-center gap-2.5">
              <span className="text-lg">{sport.emoji}</span>
              {sport.label}
            </span>
          )}
        </div>
      </div>

      {/* ═══════ EXPLORE LOVERBALL ═══════ */}
      <section id="explore" className="py-20 lg:py-28 bg-background">
        <div className="max-w-[1400px] mx-auto px-8 lg:px-16">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} viewport={{ once: true }} className="text-center mb-16">
            <h2 className="font-condensed text-[3rem] lg:text-[4.5rem] leading-none tracking-tight text-foreground uppercase font-extrabold">
              Explore Loverball
            </h2>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featureCards.map((card, i) =>
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              viewport={{ once: true }}
              onClick={openAuthModal}
              className="cursor-pointer group">
              
                <div className={`${card.color} rounded-2xl p-8 h-full transition-all duration-300 hover:scale-[1.03] hover:shadow-xl`}>
                  <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-background/15 mb-6">
                    <card.icon className="w-7 h-7 text-background" />
                  </div>
                  <h3 className="font-condensed text-xl uppercase text-background mb-3 tracking-wide font-bold">{card.title}</h3>
                  <p className="text-background/75 text-sm font-medium leading-relaxed">{card.desc}</p>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </section>

      {/* ═══════ TRENDING NOW ═══════ */}
      <section id="trending" className="py-20 lg:py-28 bg-secondary/80">
        <div className="max-w-[1400px] mx-auto px-8 lg:px-16">
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} transition={{ duration: 0.8 }} viewport={{ once: true }} className="flex items-end justify-between mb-12">
            <h2 className="font-condensed text-[3rem] lg:text-[4.5rem] leading-none tracking-tight text-foreground uppercase font-extrabold">Trending Now</h2>
            <Zap className="w-8 h-8 text-accent hidden md:block" />
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {trendingStories.map((story, i) =>
            <motion.div
              key={story.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              viewport={{ once: true }}
              onClick={openAuthModal}
              className="cursor-pointer group">
              
                <div className="bg-card rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 h-full border border-border/20">
                  <div className="p-6 flex flex-col justify-between h-full">
                    <div>
                      <div className="flex items-center gap-3 mb-4">
                        <span className="text-[10px] font-sans font-bold tracking-[0.2em] uppercase text-accent-foreground bg-accent px-2.5 py-1 rounded-full">{story.tag}</span>
                        <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {story.time}
                        </span>
                      </div>
                      <h3 className="font-sans font-bold text-foreground text-base leading-snug group-hover:text-accent transition-colors">{story.title}</h3>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </section>

      {/* ═══════ EVENTS NEAR YOU ═══════ */}
      <section id="events" className="py-20 lg:py-28 bg-background">
        <div className="max-w-[1400px] mx-auto px-8 lg:px-16">
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} transition={{ duration: 0.8 }} viewport={{ once: true }} className="flex items-end justify-between mb-12">
            <h2 className="font-condensed text-[3rem] lg:text-[4.5rem] leading-none tracking-tight text-foreground uppercase font-extrabold">Events Near You</h2>
            <Button onClick={openAuthModal} className="hidden md:flex rounded-full bg-accent text-accent-foreground hover:bg-accent/90 px-6 py-2.5 text-[11px] font-sans font-bold tracking-[0.2em] uppercase h-auto shadow-lg">
              View All <ArrowRight className="ml-2 h-3.5 w-3.5" />
            </Button>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {nearbyEvents.map((event, i) =>
            <motion.div
              key={event.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              viewport={{ once: true }}
              onClick={openAuthModal}
              className="cursor-pointer group">
              
                <div className="bg-card rounded-2xl p-6 shadow-sm hover:shadow-lg transition-all duration-300 h-full border border-border/20">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="bg-accent/10 rounded-xl px-3 py-2 text-center">
                      <span className="font-condensed text-lg text-accent font-bold block leading-none">{event.date.split(" ")[0]}</span>
                      <span className="font-condensed text-2xl text-accent font-bold block leading-none">{event.date.split(" ")[1]}</span>
                    </div>
                    <span className="text-[10px] font-sans font-bold tracking-[0.15em] uppercase text-accent bg-accent/10 px-2.5 py-1 rounded-full">{event.type}</span>
                  </div>
                  <h3 className="font-sans font-bold text-foreground text-base mb-3 group-hover:text-accent transition-colors leading-snug">{event.title}</h3>
                  <div className="space-y-1.5">
                    <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-accent/60" /> {event.time}
                    </p>
                    <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-accent/60" /> {event.venue}
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </div>

          <div className="mt-8 md:hidden text-center">
            <Button onClick={openAuthModal} className="rounded-full bg-accent text-accent-foreground px-6 py-2.5 text-[11px] font-sans font-bold tracking-[0.2em] uppercase h-auto">
              View All Events
            </Button>
          </div>
        </div>
      </section>

      {/* ═══════ MATCH / SOCIAL CTA ═══════ */}
      <section className="py-16 lg:py-20 bg-hot-pink">
        <div className="max-w-[900px] mx-auto px-8 lg:px-16">
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center">
            
            <div className="inline-flex items-center gap-2 bg-hot-pink-foreground/20 rounded-full px-5 py-2 mb-6">
              <Sparkles className="w-4 h-4 text-hot-pink-foreground" />
              <span className="text-[11px] font-sans font-bold tracking-[0.2em] uppercase text-hot-pink-foreground">New Match Waiting</span>
            </div>
            <h2 className="font-condensed text-[2.5rem] lg:text-[4rem] leading-[0.9] tracking-tight text-hot-pink-foreground uppercase font-extrabold mb-4">
              Someone Just Liked<br />Your Profile!
            </h2>
            <p className="text-base font-sans text-hot-pink-foreground/80 leading-relaxed mb-8 max-w-md mx-auto">
              3 new fans match your sports vibe. See who's out there.
            </p>
            <Button onClick={openAuthModal} className="rounded-full bg-background text-foreground hover:bg-background/90 px-10 py-5 text-[11px] font-sans font-bold tracking-[0.2em] uppercase shadow-xl h-auto">
              Discover Matches <Heart className="ml-2 h-4 w-4" />
            </Button>
          </motion.div>
        </div>
      </section>

      {/* ═══════ ABOUT SECTION ═══════ */}
      <section className="bg-accent">
        <div className="grid lg:grid-cols-2">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="px-8 lg:px-16 py-20 lg:py-28 flex flex-col justify-center">
            
            <span className="text-[11px] font-sans font-bold tracking-[0.3em] uppercase text-accent-foreground/60 mb-4">Our Mission</span>
            <h2 className="font-condensed text-[3rem] lg:text-[4.5rem] leading-[0.85] tracking-tight text-accent-foreground uppercase mb-8 font-extrabold">
              Giving Women Fans<br />A Home in Sports
            </h2>
            <p className="text-base text-accent-foreground/80 leading-relaxed mb-8 max-w-md font-medium">
              Loverball exists to give women fans a home in sports — more representation, more access to live experiences, and more real friendships built around the teams they love.
            </p>
            <button onClick={openAuthModal} className="rounded-full border border-accent-foreground text-accent-foreground bg-transparent hover:bg-accent-foreground hover:text-accent transition-colors px-7 py-3.5 text-[11px] font-sans font-bold tracking-[0.2em] uppercase w-fit flex items-center gap-3">
              Join Loverball <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </motion.div>
          <motion.div initial={{ opacity: 0, scale: 0.97 }} whileInView={{ opacity: 1, scale: 1 }} transition={{ duration: 0.8, delay: 0.1 }} viewport={{ once: true }} className="relative min-h-[400px] lg:min-h-0">
            <img src={philosophyImage} alt="Loverball community" className="w-full h-full object-cover" />
          </motion.div>
        </div>
      </section>

      {/* ═══════ TESTIMONIALS ═══════ */}
      <section className="bg-primary py-20 lg:py-28">
        <div className="max-w-[1400px] mx-auto px-8 lg:px-16">
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} transition={{ duration: 0.8 }} viewport={{ once: true }}>
            <span className="font-condensed text-[3rem] lg:text-[4rem] leading-none tracking-tight text-primary-foreground/40 uppercase block mb-12">What They Say</span>
            <div className="grid md:grid-cols-3 gap-8 lg:gap-12">
              {[
              { quote: "Finally a sports community that gets me.", name: "Alicia", detail: "Lakers fan" },
              { quote: "I met my best friends at a Loverball watch party.", name: "Dani", detail: "WNBA superfan" },
              { quote: "The content here actually speaks to women fans.", name: "Maria", detail: "Soccer obsessed" }].
              map((t, i) =>
              <motion.div key={t.name} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: i * 0.1 }} viewport={{ once: true }} className="bg-primary-foreground/10 backdrop-blur-sm rounded-2xl p-8">
                  <p className="font-display text-xl lg:text-2xl text-primary-foreground italic leading-relaxed mb-6">"{t.quote}"</p>
                  <p className="text-[11px] font-sans font-bold tracking-[0.2em] uppercase text-primary-foreground/70">— {t.name}, {t.detail}</p>
                </motion.div>
              )}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ═══════ FINAL CTA ═══════ */}
      <section className="py-28 lg:py-36 bg-foreground relative overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center opacity-[0.04]">
          <span className="font-script text-[14rem] lg:text-[20rem] text-background leading-none whitespace-nowrap">join us</span>
        </div>
        <div className="max-w-[900px] mx-auto px-8 lg:px-16 text-center relative z-10">
          <motion.div initial={{ opacity: 0, scale: 0.97 }} whileInView={{ opacity: 1, scale: 1 }} transition={{ duration: 0.8 }} viewport={{ once: true }}>
            <span className="font-condensed text-[4rem] sm:text-[5rem] lg:text-[7rem] leading-[0.85] tracking-tight text-accent uppercase block mb-6">
              Ready To<br />Join?
            </span>
            <p className="text-lg font-sans text-background/50 mb-12 max-w-lg mx-auto leading-relaxed">
              Be part of the community redefining women's sports fandom. Your game. Your community. Your story.
            </p>
            <Button size="lg" onClick={openAuthModal} className="rounded-full bg-accent text-accent-foreground hover:bg-accent/90 text-[11px] font-sans font-bold tracking-[0.2em] uppercase px-12 py-7 shadow-2xl h-auto">
              Join Loverball <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </motion.div>
        </div>
      </section>

      {/* ═══════ FOOTER ═══════ */}
      <footer className="py-16 bg-foreground border-t border-background/10">
        <div className="max-w-[1400px] mx-auto px-8 lg:px-16">
          <div className="mb-16 pb-12 border-b border-background/10">
            <div className="max-w-md mx-auto text-center">
              <h3 className="font-condensed text-2xl uppercase tracking-wide text-background mb-3">Stay In The Loop</h3>
              <p className="text-background/40 text-sm mb-6">Get the latest on events, content drops, and community updates.</p>
              <form onSubmit={(e) => {e.preventDefault();toast({ title: "Subscribed!", description: "You'll hear from us soon." });setNewsletterEmail("");}} className="flex gap-2">
                <Input type="email" placeholder="Enter your email" value={newsletterEmail} onChange={(e) => setNewsletterEmail(e.target.value)} required className="flex-1 rounded-full bg-background/10 border-background/10 text-background placeholder:text-background/30 h-12" />
                <Button type="submit" className="rounded-full bg-accent text-accent-foreground hover:bg-accent/90 px-6 h-12">
                  <Mail className="h-4 w-4" />
                </Button>
              </form>
            </div>
          </div>
          <div className="grid lg:grid-cols-12 gap-12 items-start mb-12">
            <div className="lg:col-span-4">
              <img src={loverballLogo} alt="Loverball" className="w-[130px] h-auto brightness-0 invert mb-6" />
              <p className="text-background/40 text-sm leading-relaxed max-w-xs">
                A community platform for women who love sports. Born in Los Angeles.
              </p>
            </div>
            <div className="lg:col-span-2 lg:col-start-7">
              <p className="text-background/30 text-[11px] font-sans font-bold tracking-[0.2em] uppercase mb-4">Platform</p>
              <nav className="space-y-3">
                <a href="#explore" className="block text-sm text-background/60 hover:text-background transition-colors">Explore</a>
                <a href="#trending" className="block text-sm text-background/60 hover:text-background transition-colors">Trending</a>
                <a href="#events" className="block text-sm text-background/60 hover:text-background transition-colors">Events</a>
              </nav>
            </div>
            <div className="lg:col-span-2">
              <p className="text-background/30 text-[11px] font-sans font-bold tracking-[0.2em] uppercase mb-4">Connect</p>
              <nav className="space-y-3">
                <a href="https://www.instagram.com/loverballclub/" target="_blank" rel="noopener noreferrer" className="block text-sm text-background/60 hover:text-background transition-colors">Instagram</a>
                <a href="https://www.tiktok.com/@loverballclub" target="_blank" rel="noopener noreferrer" className="block text-sm text-background/60 hover:text-background transition-colors">TikTok</a>
              </nav>
            </div>
            <div className="lg:col-span-2">
              <p className="text-background/30 text-[11px] font-sans font-bold tracking-[0.2em] uppercase mb-4">Legal</p>
              <nav className="space-y-3">
                <a href="/privacy" className="block text-sm text-background/60 hover:text-background transition-colors">Privacy</a>
                <a href="/terms" className="block text-sm text-background/60 hover:text-background transition-colors">Terms</a>
                <a href="mailto:hello@loverball.com" className="block text-sm text-background/60 hover:text-background transition-colors">Contact</a>
              </nav>
            </div>
          </div>
          <div className="border-t border-background/10 pt-8">
            <p className="text-[11px] font-sans tracking-[0.1em] text-background/30">© 2026 Loverball. All rights reserved. Built by women, for women.</p>
          </div>
        </div>
      </footer>
    </div>);

};

export default Index;
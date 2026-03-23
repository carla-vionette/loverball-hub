import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles, Calendar, X, Menu, Mail, Play, Heart, ShoppingBag, Clock, MapPin, Zap } from "lucide-react";
import TrendingNews from "@/components/TrendingNews";
import heroImage from "@/assets/hero-women-new.png";

import loverballLogo from "@/assets/loverball-script-logo.png";
import philosophyImage from "@/assets/philosophy-image.jpg";
import athletesImage from "@/assets/landing-athletes.jpg";
import fansImage from "@/assets/landing-fans.jpg";
import { z } from "zod";

const signUpSchema = z.object({
  email: z.string().trim().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters")
});

const ACCESS_CODE = "7988";

const Index = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [inviteVerified, setInviteVerified] = useState(false);
  const [inviteError, setInviteError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (mounted) setIsAuthenticated(!!session);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (mounted) setIsAuthenticated(!!session);
    });
    return () => {mounted = false;subscription.unsubscribe();};
  }, []);

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
    } finally {setLoading(false);}
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
    } finally {setLoading(false);}
  };

  const handleVerifyInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (inviteCode.trim() === ACCESS_CODE) {setInviteVerified(true);setInviteError(false);return;}
    setInviteError(true);
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteVerified) {setInviteError(true);toast({ title: "Error", description: "Invalid invite code", variant: "destructive" });return;}
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
    } finally {setLoading(false);}
  };

  const openAuthModal = () => {
    setInviteCode("");setInviteVerified(false);setInviteError(false);setAuthModalOpen(true);
  };

  const nearbyEvents = [
  { date: "MAR 27", time: "7:00 PM", title: "ACFC vs Houston Dash Watch Party", venue: "BMO Stadium, DTLA", type: "Watch Party" },
  { date: "APR 26", time: "3:00 PM", title: "ACFC vs Portland Thorns Watch Party", venue: "BMO Stadium, DTLA", type: "Watch Party" },
  { date: "MAY 10", time: "3:00 PM", title: "Sparks vs Aces Season Opener", venue: "Crypto.com Arena, DTLA", type: "Watch Party" },
  { date: "MAY 13", time: "7:00 PM", title: "Sparks vs Indiana Fever Watch Party", venue: "Crypto.com Arena, DTLA", type: "Watch Party" }];


  const featureCards = [
  { icon: Heart, title: "DISCOVER FANS", desc: "Connect with women who share your sports passion" },
  { icon: Calendar, title: "FIND EVENTS", desc: "Watch parties, tailgates & meetups near you" },
  { icon: Play, title: "WATCH", desc: "Originals, highlights & creator content" },
  { icon: ShoppingBag, title: "SHOP", desc: "Apparel and gear for the ultimate fan" }];


  const tickerItems = ["WNBA SEASON", "NWSL PLAYOFFS", "USWNT", "ANGEL CITY FC", "LA SPARKS", "WTA TOUR", "WOMEN'S WORLD CUP", "MARCH MADNESS", "OLYMPIC GAMES"];

  return (
    <div className="min-h-screen bg-background overflow-x-hidden landing-theme">
      {/* ═══════ NAV ═══════ */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-b border-border/10">
        <div className="max-w-[1280px] mx-auto px-8">
          <div className="flex items-center justify-between h-20">
            <div className="hidden lg:flex items-center gap-10">
              <a href="#explore" className="text-[11px] font-sans font-bold tracking-[0.25em] uppercase text-muted-foreground hover:text-foreground transition-colors duration-300">Explore</a>
              <a href="#trending" className="text-[11px] font-sans font-bold tracking-[0.25em] uppercase text-muted-foreground hover:text-foreground transition-colors duration-300">Trending</a>
              <a href="#events" className="text-[11px] font-sans font-bold tracking-[0.25em] uppercase text-muted-foreground hover:text-foreground transition-colors duration-300">Events</a>
            </div>
            <div className="absolute left-1/2 -translate-x-1/2">
              <img src={loverballLogo} alt="Loverball" className="h-56 w-auto" style={{ filter: 'brightness(0) invert(1)' }} />
            </div>
            <div className="hidden lg:flex items-center gap-10">
              <button onClick={() => isAuthenticated ? navigate("/shop") : openAuthModal()} className="text-[11px] font-sans font-bold tracking-[0.25em] uppercase text-muted-foreground hover:text-foreground transition-colors duration-300 bg-transparent border-none cursor-pointer">Shop</button>
              <button onClick={() => isAuthenticated ? navigate("/watch") : openAuthModal()} className="text-[11px] font-sans font-bold tracking-[0.25em] uppercase text-muted-foreground hover:text-foreground transition-colors duration-300 bg-transparent border-none cursor-pointer">Watch</button>
              <Button onClick={openAuthModal} className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90 px-7 py-2.5 text-[11px] font-sans font-bold tracking-[0.2em] uppercase h-auto">
                Join Loverball
              </Button>
            </div>
            <div className="lg:hidden ml-auto">
              <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="rounded-full text-foreground">
                {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
            </div>
          </div>
        </div>
        {mobileMenuOpen &&
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="lg:hidden bg-background border-t border-border/20 px-8 py-6 space-y-1">
            <a href="#explore" onClick={() => setMobileMenuOpen(false)} className="block py-3 text-[11px] font-sans font-bold tracking-[0.25em] uppercase text-muted-foreground">Explore</a>
            <a href="#trending" onClick={() => setMobileMenuOpen(false)} className="block py-3 text-[11px] font-sans font-bold tracking-[0.25em] uppercase text-muted-foreground">Trending</a>
            <a href="#events" onClick={() => setMobileMenuOpen(false)} className="block py-3 text-[11px] font-sans font-bold tracking-[0.25em] uppercase text-muted-foreground">Events</a>
            <Button onClick={() => {setMobileMenuOpen(false);openAuthModal();}} className="w-full rounded-full mt-4 bg-primary text-primary-foreground text-[11px] tracking-[0.2em] uppercase">
              Join Loverball
            </Button>
          </motion.div>
        }
      </nav>

      {/* ═══════ AUTH MODAL ═══════ */}
      <Dialog open={authModalOpen} onOpenChange={setAuthModalOpen}>
        <DialogContent className="sm:max-w-md rounded-[20px] p-0 overflow-hidden border-border/20 bg-card">
          <div className="p-8 sm:p-10">
            <DialogTitle className="sr-only">Member Access</DialogTitle>
            <div className="flex justify-center mb-8">
              <img src={loverballLogo} alt="Loverball" className="h-20 w-auto brightness-0 invert" />
            </div>
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2 bg-secondary rounded-full p-1 h-12">
                <TabsTrigger value="login" className="rounded-full data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-[11px] font-sans font-bold tracking-[0.1em] uppercase">Sign In</TabsTrigger>
                <TabsTrigger value="signup" className="rounded-full data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-[11px] font-sans font-bold tracking-[0.1em] uppercase">Sign Up</TabsTrigger>
              </TabsList>
              <TabsContent value="login">
                {showForgotPassword ?
                <form onSubmit={handleForgotPassword} className="space-y-5 mt-8">
                    <div className="space-y-2">
                      <Label htmlFor="reset-email" className="text-foreground text-[11px] tracking-[0.1em] uppercase">Email</Label>
                      <Input id="reset-email" type="email" placeholder="Enter your email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                    </div>
                    <p className="text-muted-foreground text-sm">We'll send you a link to reset your password.</p>
                    <Button type="submit" className="w-full rounded-full h-12 text-[11px] font-sans tracking-[0.1em] uppercase" disabled={loading}>{loading ? "Sending..." : "Send Reset Link"}</Button>
                    <button type="button" onClick={() => setShowForgotPassword(false)} className="w-full text-sm text-primary hover:text-primary/80 transition-colors font-medium">Back to sign in</button>
                  </form> :

                <form onSubmit={handleLogin} className="space-y-5 mt-8">
                    <div className="space-y-2">
                      <Label htmlFor="login-email" className="text-foreground text-[11px] tracking-[0.1em] uppercase">Email</Label>
                      <Input id="login-email" type="email" placeholder="Enter your email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="login-password" className="text-foreground text-[11px] tracking-[0.1em] uppercase">Password</Label>
                        <button type="button" onClick={() => setShowForgotPassword(true)} className="text-xs text-primary hover:text-primary/80 transition-colors">Forgot?</button>
                      </div>
                      <Input id="login-password" type="password" placeholder="Enter your password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                    </div>
                    <Button type="submit" className="w-full rounded-full h-12 text-[11px] font-sans tracking-[0.1em] uppercase" disabled={loading}>{loading ? "Signing in..." : "Sign In"}</Button>
                  </form>
                }
              </TabsContent>
              <TabsContent value="signup">
                {!inviteVerified ?
                <form onSubmit={handleVerifyInvite} className="space-y-5 mt-8">
                    <div className="space-y-2">
                      <Label htmlFor="signup-invite-code" className="text-foreground text-[11px] tracking-[0.1em] uppercase">Invite Code</Label>
                      <Input id="signup-invite-code" type="text" inputMode="numeric" maxLength={4} placeholder="Enter invite code" value={inviteCode} onChange={(e) => {setInviteCode(e.target.value);setInviteError(false);}} required />
                      {inviteError && <p className="text-destructive text-sm">Invalid invite code</p>}
                    </div>
                    <Button type="submit" className="w-full rounded-full h-12 text-[11px] font-sans tracking-[0.1em] uppercase">VERIFY CODE</Button>
                  </form> :

                <form onSubmit={handleSignup} className="space-y-5 mt-8">
                    <div className="space-y-2">
                      <Label htmlFor="signup-email" className="text-foreground text-[11px] tracking-[0.1em] uppercase">Email</Label>
                      <Input id="signup-email" type="email" placeholder="Enter your email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-password" className="text-foreground text-[11px] tracking-[0.1em] uppercase">Password</Label>
                      <Input id="signup-password" type="password" placeholder="Create a password (min 6)" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
                    </div>
                    <Button type="submit" className="w-full rounded-full h-12 text-[11px] font-sans tracking-[0.1em] uppercase" disabled={loading}>{loading ? "Creating account..." : "Create Account"}</Button>
                  </form>
                }
              </TabsContent>
            </Tabs>
          </div>
        </DialogContent>
      </Dialog>

      {/* ═══════ HERO ═══════ */}
      <section className="pt-20">
        <div className="grid lg:grid-cols-12 min-h-[90vh]">
          {/* Left — 7 cols */}
          <div className="lg:col-span-7 bg-secondary relative flex items-center px-8 lg:px-16 py-24 lg:py-0">
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, ease: "easeOut" }}
              className="relative z-10 max-w-xl">
              
              <span className="text-[11px] font-sans font-bold tracking-[0.3em] uppercase mb-8 block" style={{ color: '#9CA3AF' }}>

              </span>
              <h1 className="font-display font-bold text-[3.5rem] sm:text-[5rem] lg:text-[6.5rem] leading-[0.85] tracking-tight uppercase mb-8" style={{ color: '#FFFFFF' }}>
                Her<br />Game.<br />
                <span className="text-primary">Her</span><br />
                <span className="text-primary">Community.</span>
              </h1>
              <p className="text-base font-sans font-medium text-muted-foreground leading-relaxed mb-10 max-w-[480px]">
                The media platform built for women who live and breathe sports. Discover community events, connect with fans, and watch exclusive sports content curated for you.
              </p>
              <div className="flex flex-col sm:flex-row items-start gap-4">
                <Button onClick={openAuthModal} className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90 px-8 py-5 text-[11px] font-sans font-bold tracking-[0.2em] uppercase h-auto">
                  Join Loverball <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <Button onClick={() => document.getElementById("events")?.scrollIntoView({ behavior: "smooth" })} variant="outline" className="rounded-full border-2 border-foreground/30 text-foreground bg-transparent hover:bg-foreground/5 px-8 py-5 text-[11px] font-sans font-bold tracking-[0.2em] uppercase h-auto">
                  Find Events
                </Button>
              </div>
            </motion.div>
          </div>

          {/* Right — 5 cols */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.9, delay: 0.2 }}
            className="lg:col-span-5 bg-card relative flex items-center justify-center py-24 lg:py-0 px-8 overflow-hidden">
            
            <div className="relative w-full max-w-md h-[500px] lg:h-[600px]">
              <motion.div initial={{ opacity: 0, rotate: -8, scale: 0.9 }} animate={{ opacity: 1, rotate: -6, scale: 1 }} transition={{ duration: 0.8, delay: 0.4 }} className="absolute left-0 bottom-12 w-[55%] z-10">
                <div className="rounded-[20px] overflow-hidden" style={{ boxShadow: '0 12px 40px rgba(0,0,0,0.5)' }}>
                  <img src={athletesImage} alt="Women athletes" className="w-full aspect-[3/4] object-cover" />
                </div>
              </motion.div>
              <motion.div initial={{ opacity: 0, y: 30, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.8, delay: 0.5 }} className="absolute left-[20%] top-4 w-[60%] z-20">
                <div className="rounded-[20px] overflow-hidden" style={{ boxShadow: '0 12px 40px rgba(0,0,0,0.5)' }}>
                  <img src={heroImage} alt="Women sports fans" className="w-full aspect-[3/4] object-cover object-[center_30%]" />
                </div>
              </motion.div>
              <motion.div initial={{ opacity: 0, rotate: 8, scale: 0.9 }} animate={{ opacity: 1, rotate: 5, scale: 1 }} transition={{ duration: 0.8, delay: 0.6 }} className="absolute right-0 bottom-16 w-[50%] z-10">
                <div className="rounded-[20px] overflow-hidden" style={{ boxShadow: '0 12px 40px rgba(0,0,0,0.5)' }}>
                  <img src={fansImage} alt="Fans celebrating" className="w-full aspect-[3/4] object-cover" />
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ═══════ SCROLLING TICKER ═══════ */}
      <div className="bg-primary py-3.5 overflow-hidden">
        <div className="marquee-track">
          {[...tickerItems, ...tickerItems].map((item, i) =>
          <span key={i} className="text-primary-foreground font-display text-sm font-bold tracking-[0.15em] uppercase flex items-center gap-8">
              {item} <span className="text-primary-foreground/40">+</span>
            </span>
          )}
        </div>
      </div>

      {/* ═══════ EXPLORE / CATEGORY CARDS ═══════ */}
      <section id="explore" className="section-spacing bg-background">
        <div className="max-w-[1280px] mx-auto px-8">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} viewport={{ once: true }} className="text-center section-gap">
            <h2 className="font-display text-[2.5rem] lg:text-[3.5rem] leading-none tracking-tight text-foreground uppercase font-bold">
              Explore Loverball
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 lg:gap-8">
            {featureCards.map((card, i) =>
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              viewport={{ once: true }}
              onClick={openAuthModal}
              className="cursor-pointer group">
              
                <div className="bg-card rounded-[20px] p-6 h-full transition-all duration-300 hover:scale-[1.03] border border-border/20" style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.3)' }}>
                  <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-primary/15 mb-6">
                    <card.icon className="w-7 h-7 text-primary" />
                  </div>
                  <h3 className="font-display text-xl uppercase text-foreground mb-3 tracking-wide font-bold">{card.title}</h3>
                  <p className="text-muted-foreground text-sm font-medium leading-relaxed">{card.desc}</p>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </section>

      {/* ═══════ TRENDING NOW ═══════ */}
      <section id="trending" className="section-spacing bg-secondary">
        <div className="max-w-[1280px] mx-auto px-8">
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} transition={{ duration: 0.8 }} viewport={{ once: true }} className="flex items-end justify-between section-gap">
            <h2 className="font-display text-[2.5rem] lg:text-[3.5rem] leading-none tracking-tight text-foreground uppercase font-bold">Trending Now</h2>
            <Zap className="w-8 h-8 text-primary hidden md:block" />
          </motion.div>

          <TrendingNews />
        </div>
      </section>

      {/* ═══════ EVENTS NEAR YOU ═══════ */}
      <section id="events" className="section-spacing bg-background">
        <div className="max-w-[1280px] mx-auto px-8">
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} transition={{ duration: 0.8 }} viewport={{ once: true }} className="flex items-end justify-between section-gap">
            <h2 className="font-display text-[2.5rem] lg:text-[3.5rem] leading-none tracking-tight text-foreground uppercase font-bold">Events Near You</h2>
            <Button onClick={openAuthModal} className="hidden md:flex rounded-full px-6 py-2.5 text-[11px] font-sans font-bold tracking-[0.2em] uppercase h-auto">
              View All <ArrowRight className="ml-2 h-3.5 w-3.5" />
            </Button>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
            {nearbyEvents.map((event, i) =>
            <motion.div
              key={event.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              viewport={{ once: true }}
              onClick={openAuthModal}
              className="cursor-pointer group">
              
                <div className="bg-card rounded-[20px] p-6 h-full border border-border/20 transition-all duration-300 hover:scale-[1.02]" style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.3)' }}>
                  <div className="flex items-center gap-3 mb-5">
                    <div className="bg-primary/10 rounded-xl px-3 py-2 text-center">
                      <span className="font-display text-lg text-primary font-bold block leading-none">{event.date.split(" ")[0]}</span>
                      <span className="font-display text-2xl text-primary font-bold block leading-none">{event.date.split(" ")[1]}</span>
                    </div>
                    <span className="text-[10px] font-sans font-bold tracking-[0.15em] uppercase text-primary bg-primary/10 px-2.5 py-1 rounded-full">{event.type}</span>
                  </div>
                  <h3 className="font-sans font-bold text-foreground text-base mb-4 group-hover:text-primary transition-colors duration-300 leading-snug">{event.title}</h3>
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-primary/60" /> {event.time}
                    </p>
                    <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-primary/60" /> {event.venue}
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </div>

          <div className="mt-10 md:hidden text-center">
            <Button onClick={openAuthModal} className="rounded-full px-6 py-2.5 text-[11px] font-sans font-bold tracking-[0.2em] uppercase h-auto">
              View All Events
            </Button>
          </div>
        </div>
      </section>

      {/* ═══════ SOCIAL CTA ═══════ */}
      <section className="section-spacing bg-primary">
        <div className="max-w-[900px] mx-auto px-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center">
            
            <div className="inline-flex items-center gap-2 bg-primary-foreground/20 rounded-full px-5 py-2 mb-8">
              <Sparkles className="w-4 h-4 text-primary-foreground" />
              <span className="text-[11px] font-sans font-bold tracking-[0.2em] uppercase text-primary-foreground">New Match Waiting</span>
            </div>
            <h2 className="font-display text-[2.5rem] lg:text-[4rem] leading-[0.9] tracking-tight text-primary-foreground uppercase font-bold mb-6">
              Someone Just Liked<br />Your Profile!
            </h2>
            <p className="text-base font-sans text-primary-foreground/70 leading-relaxed mb-10 max-w-md mx-auto">
              3 new fans match your sports vibe. See who's out there.
            </p>
            <Button onClick={openAuthModal} className="rounded-full bg-background text-foreground hover:bg-background/90 px-10 py-5 text-[11px] font-sans font-bold tracking-[0.2em] uppercase h-auto">
              Discover Matches <Heart className="ml-2 h-4 w-4" />
            </Button>
          </motion.div>
        </div>
      </section>

      {/* ═══════ ABOUT / MISSION ═══════ */}
      <section className="bg-card">
        <div className="grid lg:grid-cols-2">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="px-8 lg:px-16 py-24 lg:py-28 flex flex-col justify-center">
            
            <span className="text-[11px] font-sans font-bold tracking-[0.3em] uppercase text-muted-foreground mb-6">Our Mission</span>
            <h2 className="font-display text-[2.5rem] lg:text-[3.5rem] leading-[0.85] tracking-tight text-foreground uppercase mb-8 font-bold">
              Giving Women Fans<br />A Home in Sports
            </h2>
            <p className="text-base text-muted-foreground leading-relaxed mb-10 max-w-md font-medium">
              Loverball exists to give women fans a home in sports — more representation, more access to live experiences, and more real friendships built around the teams they love.
            </p>
            <button onClick={openAuthModal} className="rounded-full border border-foreground/30 text-foreground bg-transparent hover:bg-foreground/5 transition-all duration-300 px-7 py-3.5 text-[11px] font-sans font-bold tracking-[0.2em] uppercase w-fit flex items-center gap-3">
              Join Loverball <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </motion.div>
          <motion.div initial={{ opacity: 0, scale: 0.97 }} whileInView={{ opacity: 1, scale: 1 }} transition={{ duration: 0.8, delay: 0.1 }} viewport={{ once: true }} className="relative min-h-[400px] lg:min-h-0">
            <img src={philosophyImage} alt="Loverball community" className="w-full h-full object-cover" />
          </motion.div>
        </div>
      </section>

      {/* ═══════ TESTIMONIALS ═══════ */}
      <section className="bg-secondary section-spacing">
        <div className="max-w-[1280px] mx-auto px-8">
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} transition={{ duration: 0.8 }} viewport={{ once: true }}>
            <h2 className="font-display text-[2.5rem] lg:text-[3rem] leading-none tracking-tight text-muted-foreground uppercase block mb-12">What They Say</h2>
            <div className="grid md:grid-cols-3 gap-8">
              {[
              { quote: "Finally a sports community that gets me.", name: "Alicia", detail: "Lakers fan" },
              { quote: "I met my best friends at a Loverball watch party.", name: "Dani", detail: "WNBA superfan" },
              { quote: "The content here actually speaks to women fans.", name: "Maria", detail: "Soccer obsessed" }].
              map((t, i) =>
              <motion.div key={t.name} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: i * 0.1 }} viewport={{ once: true }} className="bg-card rounded-[20px] p-8 border border-border/20" style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.3)' }}>
                  <p className="font-elegant text-xl lg:text-2xl text-foreground leading-relaxed mb-6">"{t.quote}"</p>
                  <p className="text-[11px] font-sans font-bold tracking-[0.2em] uppercase text-muted-foreground">— {t.name}, {t.detail}</p>
                </motion.div>
              )}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ═══════ FINAL CTA ═══════ */}
      <section className="py-28 lg:py-36 bg-card relative overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center opacity-[0.03]">
          <span className="font-script text-[14rem] lg:text-[20rem] text-foreground leading-none whitespace-nowrap">join us</span>
        </div>
        <div className="max-w-[900px] mx-auto px-8 text-center relative z-10">
          <motion.div initial={{ opacity: 0, scale: 0.97 }} whileInView={{ opacity: 1, scale: 1 }} transition={{ duration: 0.8 }} viewport={{ once: true }}>
            <span className="font-display text-[3.5rem] sm:text-[4.5rem] lg:text-[6rem] leading-[0.85] tracking-tight text-primary uppercase block mb-8">
              Ready To<br />Join?
            </span>
            <p className="text-lg font-sans text-muted-foreground mb-12 max-w-lg mx-auto leading-relaxed">
              Be part of the community redefining women's sports fandom. Your game. Your community. Your story.
            </p>
            <Button size="lg" onClick={openAuthModal} className="rounded-full text-[11px] font-sans font-bold tracking-[0.2em] uppercase px-12 py-7 h-auto">
              Join Loverball <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </motion.div>
        </div>
      </section>

      {/* ═══════ FOOTER ═══════ */}
      <footer className="py-16 bg-secondary border-t border-border/20">
        <div className="max-w-[1280px] mx-auto px-8">
          <div className="mb-16 pb-12 border-b border-border/20">
            <div className="max-w-md mx-auto text-center">
              <h3 className="font-display text-2xl uppercase tracking-wide text-foreground mb-4">Stay In The Loop</h3>
              <p className="text-muted-foreground text-sm mb-6">Get the latest on events, content drops, and community updates.</p>
              <form onSubmit={(e) => {e.preventDefault();toast({ title: "Subscribed!", description: "You'll hear from us soon." });setNewsletterEmail("");}} className="flex gap-2">
                <Input type="email" placeholder="Enter your email" value={newsletterEmail} onChange={(e) => setNewsletterEmail(e.target.value)} required className="flex-1 rounded-full h-12" />
                <Button type="submit" className="rounded-full px-6 h-12">
                  <Mail className="h-4 w-4" />
                </Button>
              </form>
            </div>
          </div>
          <div className="grid lg:grid-cols-12 gap-12 items-start mb-12">
            <div className="lg:col-span-4">
              <img src={loverballLogo} alt="Loverball" className="w-[130px] h-auto brightness-0 invert mb-6" />
              <p className="text-muted-foreground text-sm leading-relaxed max-w-xs">
                A community platform for women who love sports. Born in Los Angeles.
              </p>
            </div>
            <div className="lg:col-span-2 lg:col-start-7">
              <p className="text-muted-foreground/50 text-[11px] font-sans font-bold tracking-[0.2em] uppercase mb-4">Platform</p>
              <nav className="space-y-3">
                <a href="#explore" className="block text-sm text-muted-foreground hover:text-foreground transition-colors duration-300">Explore</a>
                <a href="#trending" className="block text-sm text-muted-foreground hover:text-foreground transition-colors duration-300">Trending</a>
                <a href="#events" className="block text-sm text-muted-foreground hover:text-foreground transition-colors duration-300">Events</a>
              </nav>
            </div>
            <div className="lg:col-span-2">
              <p className="text-muted-foreground/50 text-[11px] font-sans font-bold tracking-[0.2em] uppercase mb-4">Connect</p>
              <nav className="space-y-3">
                <a href="https://www.instagram.com/loverballclub/" target="_blank" rel="noopener noreferrer" className="block text-sm text-muted-foreground hover:text-foreground transition-colors duration-300">Instagram</a>
                <a href="https://www.tiktok.com/@loverballclub" target="_blank" rel="noopener noreferrer" className="block text-sm text-muted-foreground hover:text-foreground transition-colors duration-300">TikTok</a>
              </nav>
            </div>
            <div className="lg:col-span-2">
              <p className="text-muted-foreground/50 text-[11px] font-sans font-bold tracking-[0.2em] uppercase mb-4">Legal</p>
              <nav className="space-y-3">
                <a href="/privacy" className="block text-sm text-muted-foreground hover:text-foreground transition-colors duration-300">Privacy</a>
                <a href="/terms" className="block text-sm text-muted-foreground hover:text-foreground transition-colors duration-300">Terms</a>
                <a href="mailto:hello@loverball.com" className="block text-sm text-muted-foreground hover:text-foreground transition-colors duration-300">Contact</a>
              </nav>
            </div>
          </div>
          <div className="border-t border-border/20 pt-8">
            <p className="text-[11px] font-sans tracking-[0.1em] text-muted-foreground/50">© 2026 Loverball. All rights reserved. Built by women, for women.</p>
          </div>
        </div>
      </footer>
    </div>);

};

export default Index;
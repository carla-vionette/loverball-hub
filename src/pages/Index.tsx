import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { useAuth } from "@/hooks/useAuth";
import { motion, useInView } from "framer-motion";
import { ArrowRight, Lock, Ticket, Users, Sparkles, Calendar, X, Menu, Mail, Play, Eye, Heart, Plus, Minus, Star, CheckCircle, Trophy, Tv, MessageCircle } from "lucide-react";
import heroImage from "@/assets/hero-women-new.png";
import loverballLogo from "@/assets/loverball-script-logo.png";
import philosophyImage from "@/assets/philosophy-image.jpg";
import communityImage from "@/assets/landing-community.jpg";
import athletesImage from "@/assets/landing-athletes.jpg";
import fansImage from "@/assets/landing-fans.jpg";
import landingHeroImage from "@/assets/landing-hero.jpg";
import { FEED_VIDEOS } from "@/lib/feedVideoData";
import { z } from "zod";

const signUpSchema = z.object({
  email: z.string().trim().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  inviteCode: z.string().trim().min(1, "Invite code is required"),
});

const channels = [
  { name: "LA Sparks", sport: "WNBA", followers: "12.4K", image: "https://a.espncdn.com/i/teamlogos/wnba/500/la.png" },
  { name: "Angel City FC", sport: "NWSL", followers: "18.2K", image: "https://a.espncdn.com/i/teamlogos/soccer/500/6926.png" },
  { name: "Lakers", sport: "NBA", followers: "45.1K", image: "https://a.espncdn.com/i/teamlogos/nba/500/lal.png" },
  { name: "Dodgers", sport: "MLB", followers: "38.7K", image: "https://a.espncdn.com/i/teamlogos/mlb/500/lad.png" },
  { name: "USWNT", sport: "Soccer", followers: "52.3K", image: "https://a.espncdn.com/i/teamlogos/soccer/500/660.png" },
  { name: "UCLA Bruins", sport: "NCAA", followers: "9.8K", image: "https://a.espncdn.com/i/teamlogos/ncaa/500/26.png" },
];

const services = [
  { title: "Exclusive Content & Stories", description: "Original reporting, player features, and behind-the-scenes access to women's sports that mainstream media overlooks. Our editorial team delivers the stories that matter." },
  { title: "Live Events & Watch Parties", description: "From game-day brunches to playoff viewing parties, we host community events across Los Angeles that bring women sports fans together IRL." },
  { title: "Community & Connections", description: "Connect with thousands of women who share your passion. Our members include athletes, creators, industry professionals, and superfans." },
  { title: "Team Channels & Updates", description: "Follow your favorite teams — Lakers, Angel City FC, Sparks, USWNT and more. Get real-time updates, analysis, and fan commentary." },
  { title: "Creator Platform", description: "Have a unique voice in women's sports? Launch your own channel, build an audience, and create content that reaches fans who care." },
];

const painPoints = [
  { title: "You can't find women's sports content that matches your passion", description: "Mainstream sports media barely covers women's sports. When it does, it's surface-level. You deserve depth, analysis, and stories." },
  { title: "You want to connect with fans who actually get it", description: "Your group chat is tired of your game-day rants. You need a community that matches your energy and obsession." },
  { title: "You're missing out on the live sports culture in LA", description: "Watch parties, brunches, meetups — they exist, but finding them feels impossible. We bring the events to you." },
];

const testimonials = [
  { quote: "Loverball is the community I didn't know I needed. Finally a space where women's sports fandom is celebrated, not sidelined.", name: "Maya T.", title: "WNBA Superfan", rating: 5 },
  { quote: "The events are incredible — I've met my best friends through Loverball watch parties. This is what sports fandom should feel like.", name: "Jessica R.", title: "Angel City FC Season Ticket Holder", rating: 5 },
  { quote: "As a sports creator, Loverball gave me an audience that actually cares about women's sports content. Game changer.", name: "Dani K.", title: "Content Creator", rating: 5 },
];

const socialLogos = ["ESPN", "BLEACHER REPORT", "THE CUT", "VOGUE SPORTS", "LA TIMES", "COMPLEX"];

const howItWorks = [
  { step: "01", icon: Heart, title: "Follow Your Teams", description: "Pick the teams and sports you love. We'll curate content and events just for you." },
  { step: "02", icon: Play, title: "Watch Exclusive Content", description: "Original stories, player interviews, and behind-the-scenes access you won't find anywhere else." },
  { step: "03", icon: Users, title: "Connect With Fans", description: "Join watch parties, brunches, and meetups with women who share your passion for the game." },
];

const Index = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [expandedService, setExpandedService] = useState<number | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();
  const isAuthenticated = !!user;

  if (!authLoading && isAuthenticated) {
    navigate("/profile", { replace: true });
    return null;
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error, data } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
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
        redirectTo: `${window.location.origin}/auth?reset=true`,
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
      const validation = signUpSchema.safeParse({ email, password, inviteCode });
      if (!validation.success) throw new Error(validation.error.errors[0].message);
      const { error, data } = await supabase.auth.signUp({
        email: validation.data.email,
        password: validation.data.password,
        options: { emailRedirectTo: `${window.location.origin}/onboarding` },
      });
      if (error) throw error;
      if (data.user) {
        const { data: inviteResult, error: inviteError } = await supabase.rpc("validate_and_use_invite", {
          invite_code: validation.data.inviteCode,
        });
        if (inviteError) {
          await supabase.auth.signOut();
          throw new Error("Invalid invite code. Please check and try again.");
        }
        const result = inviteResult as { success: boolean; error?: string };
        if (!result.success) {
          await supabase.auth.signOut();
          throw new Error(result.error || "Invalid invite code");
        }
        toast({ title: "Welcome to Loverball!", description: "Your invite code has been verified. Let's set up your profile." });
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
  const latestVideos = FEED_VIDEOS.slice(0, 4);

  return (
    <div className="min-h-screen bg-background">
      {/* ── Red Ticker Bar ── */}
      <div className="bg-primary py-2 overflow-hidden">
        <motion.div
          animate={{ x: [0, -1400] }}
          transition={{ duration: 16, repeat: Infinity, ease: "linear" }}
          className="flex gap-16 whitespace-nowrap"
        >
          {[...Array(14)].map((_, i) => (
            <span key={i} className="flex items-center gap-16 text-xs tracking-[0.4em] font-sans font-bold text-primary-foreground/90 uppercase">
              <span>Skyrocket Your Fandom Today</span>
              <span className="text-primary-foreground/40">♦</span>
              <span>Her Game Her Rules</span>
              <span className="text-primary-foreground/40">♦</span>
              <span>Join the Movement</span>
              <span className="text-primary-foreground/40">♦</span>
            </span>
          ))}
        </motion.div>
      </div>

      {/* ── Navigation ── */}
      <nav className="sticky top-0 z-50 bg-card border-b border-border/50">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="flex items-center justify-between h-16">
            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden text-foreground/80 hover:text-foreground transition-colors">
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            <img src={loverballLogo} alt="Loverball" className="h-20 w-auto absolute left-1/2 -translate-x-1/2" />

            <div className="hidden md:flex items-center gap-8">
              <a href="#services" className="text-xs font-sans tracking-widest uppercase text-foreground/60 hover:text-primary transition-colors">Services</a>
              <a href="#about" className="text-xs font-sans tracking-widest uppercase text-foreground/60 hover:text-primary transition-colors">About</a>
              <a href="#how-it-works" className="text-xs font-sans tracking-widest uppercase text-foreground/60 hover:text-primary transition-colors">How It Works</a>
              <a href="#channels" className="text-xs font-sans tracking-widest uppercase text-foreground/60 hover:text-primary transition-colors">Channels</a>
            </div>

            <Button
              onClick={openAuthModal}
              className="rounded-full bg-accent text-accent-foreground hover:bg-accent/90 font-sans text-xs tracking-widest uppercase px-6"
            >
              Join Now
            </Button>
          </div>
        </div>

        {mobileMenuOpen && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="md:hidden bg-card border-t border-border px-6 py-4 space-y-2">
            <a href="#services" onClick={() => setMobileMenuOpen(false)} className="block py-3 text-sm font-sans text-foreground/70 tracking-widest uppercase">Services</a>
            <a href="#about" onClick={() => setMobileMenuOpen(false)} className="block py-3 text-sm font-sans text-foreground/70 tracking-widest uppercase">About</a>
            <a href="#how-it-works" onClick={() => setMobileMenuOpen(false)} className="block py-3 text-sm font-sans text-foreground/70 tracking-widest uppercase">How It Works</a>
            <a href="#channels" onClick={() => setMobileMenuOpen(false)} className="block py-3 text-sm font-sans text-foreground/70 tracking-widest uppercase">Channels</a>
          </motion.div>
        )}
      </nav>

      {/* ── Auth Modal ── */}
      <Dialog open={authModalOpen} onOpenChange={setAuthModalOpen}>
        <DialogContent className="sm:max-w-md rounded-3xl p-0 overflow-hidden border-border/20">
          <div className="p-8 sm:p-10">
            <DialogTitle className="sr-only">Member Access</DialogTitle>
            <div className="flex justify-center mb-6">
              <img src={loverballLogo} alt="Loverball" className="h-10 w-auto" />
            </div>
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2 bg-muted rounded-full p-1 h-14">
                <TabsTrigger value="login" className="rounded-full data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-sm font-medium">Sign In</TabsTrigger>
                <TabsTrigger value="signup" className="rounded-full data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-sm font-medium">Sign Up</TabsTrigger>
              </TabsList>

              <TabsContent value="login">
                {showForgotPassword ? (
                  <form onSubmit={handleForgotPassword} className="space-y-6 mt-8">
                    <div className="space-y-2">
                      <Label htmlFor="reset-email" className="text-foreground text-sm font-medium">Email</Label>
                      <Input id="reset-email" type="email" placeholder="Enter your email" value={email} onChange={(e) => setEmail(e.target.value)} required className="bg-background border-border text-foreground rounded-xl h-12" />
                    </div>
                    <p className="text-foreground/50 text-sm">We'll send you a link to reset your password.</p>
                    <Button type="submit" className="w-full rounded-full h-12 text-sm font-medium" disabled={loading}>{loading ? "Sending..." : "Send Reset Link"}</Button>
                    <button type="button" onClick={() => setShowForgotPassword(false)} className="w-full text-sm text-primary hover:text-primary/80 transition-colors font-medium">Back to sign in</button>
                  </form>
                ) : (
                  <form onSubmit={handleLogin} className="space-y-6 mt-8">
                    <div className="space-y-2">
                      <Label htmlFor="login-email" className="text-foreground text-sm font-medium">Email</Label>
                      <Input id="login-email" type="email" placeholder="Enter your email" value={email} onChange={(e) => setEmail(e.target.value)} required className="bg-background border-border text-foreground rounded-xl h-12" />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="login-password" className="text-foreground text-sm font-medium">Password</Label>
                        <button type="button" onClick={() => setShowForgotPassword(true)} className="text-sm text-primary hover:text-primary/80 transition-colors">Forgot password?</button>
                      </div>
                      <Input id="login-password" type="password" placeholder="Enter your password" value={password} onChange={(e) => setPassword(e.target.value)} required className="bg-background border-border text-foreground rounded-xl h-12" />
                    </div>
                    <Button type="submit" className="w-full rounded-full h-12 text-sm font-medium" disabled={loading}>{loading ? "Signing in..." : "Sign In"}</Button>
                  </form>
                )}
              </TabsContent>

              <TabsContent value="signup">
                <form onSubmit={handleSignup} className="space-y-6 mt-8">
                  <div className="space-y-2">
                    <Label htmlFor="signup-email" className="text-foreground text-sm font-medium">Email</Label>
                    <Input id="signup-email" type="email" placeholder="Enter your email" value={email} onChange={(e) => setEmail(e.target.value)} required className="bg-background border-border text-foreground rounded-xl h-12" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password" className="text-foreground text-sm font-medium">Password</Label>
                    <Input id="signup-password" type="password" placeholder="Create a password (min 6 characters)" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} className="bg-background border-border text-foreground rounded-xl h-12" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-invite" className="text-foreground text-sm font-medium flex items-center gap-2">
                      <Ticket className="w-4 h-4" /> Invite Code
                    </Label>
                    <Input id="signup-invite" type="text" placeholder="Enter your invite code" value={inviteCode} onChange={(e) => setInviteCode(e.target.value.toUpperCase())} required className="bg-background border-border text-foreground rounded-xl h-12 uppercase tracking-widest" />
                    <p className="text-xs text-foreground/50">Need a code? Request one from an existing member.</p>
                  </div>
                  <Button type="submit" className="w-full rounded-full h-12 text-sm font-medium" disabled={loading}>{loading ? "Creating account..." : "Create Account"}</Button>
                </form>
              </TabsContent>
            </Tabs>
          </div>
        </DialogContent>
      </Dialog>

      {/* ═══════════════════════════════════════════════
          1. HERO — Split layout: photo + red content block
         ═══════════════════════════════════════════════ */}
      <section className="relative overflow-hidden">
        <div className="grid lg:grid-cols-2 min-h-[85vh]">
          {/* Left: Editorial photo */}
          <div className="relative overflow-hidden bg-accent">
            <img
              src={heroImage}
              alt="Women in sports culture"
              className="w-full h-full object-cover object-top opacity-90"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/30 to-transparent" />
          </div>

          {/* Right: Red content block */}
          <div className="bg-primary flex items-center">
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="px-8 lg:px-16 py-16 lg:py-0"
            >
              <p className="text-xs font-sans tracking-[0.3em] uppercase text-primary-foreground/50 mb-6">Welcome to Loverball</p>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-display text-primary-foreground leading-[0.9] mb-8">
                Expand Your<br />
                <em>Influence.</em><br />
                Amplify Your<br />
                <em>Impact.</em>
              </h1>
              <p className="text-lg font-serif text-primary-foreground/75 leading-relaxed mb-10 max-w-lg">
                The platform where women sports fans connect, celebrate, and elevate the game together. Original content, live events, and a community that gets it.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  onClick={openAuthModal}
                  size="lg"
                  className="rounded-full bg-white text-primary hover:bg-white/90 px-10 py-7 text-base font-sans tracking-widest uppercase shadow-2xl"
                >
                  Join Loverball
                </Button>
                <Button
                  onClick={() => document.getElementById("services")?.scrollIntoView({ behavior: "smooth" })}
                  size="lg"
                  className="rounded-full bg-transparent border-2 border-primary-foreground text-primary-foreground hover:bg-primary-foreground/10 px-10 py-7 text-base font-sans tracking-widest uppercase"
                >
                  Learn More
                </Button>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          2. MISSION STATEMENT — Cream bg, centered
         ═══════════════════════════════════════════════ */}
      <section className="py-24 lg:py-32 bg-background">
        <div className="max-w-4xl mx-auto px-6 lg:px-12 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className="font-display text-4xl sm:text-5xl md:text-6xl text-primary mb-8 leading-[0.95]">
              We specialize in creating <span className="editorial-underline"><em>tailored</em></span> experiences
            </h2>
            <p className="text-lg md:text-xl font-serif text-foreground/70 leading-relaxed max-w-2xl mx-auto mb-10">
              community connections that drive engagement, build lifelong friendships, and celebrate women's sports culture — from watch parties to original storytelling.
            </p>
            <Button
              onClick={openAuthModal}
              className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90 px-10 py-6 font-sans text-sm tracking-widest uppercase shadow-lg"
            >
              Start Your Journey
            </Button>
          </motion.div>
        </div>
      </section>

      {/* ── Red services ticker ── */}
      <div className="bg-primary py-3 overflow-hidden">
        <motion.div
          animate={{ x: [0, -1600] }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="flex gap-12 whitespace-nowrap"
        >
          {[...Array(10)].map((_, i) => (
            <span key={i} className="flex items-center gap-12 text-sm tracking-[0.3em] font-display text-primary-foreground/90 uppercase">
              <span>Content</span>
              <span className="text-primary-foreground/30">✦</span>
              <span>Events</span>
              <span className="text-primary-foreground/30">✦</span>
              <span>Community</span>
              <span className="text-primary-foreground/30">✦</span>
              <span>Channels</span>
              <span className="text-primary-foreground/30">✦</span>
            </span>
          ))}
        </motion.div>
      </div>

      {/* ═══════════════════════════════════════════════
          3. SERVICES — Expandable accordions
         ═══════════════════════════════════════════════ */}
      <section id="services" className="py-24 lg:py-32 bg-card">
        <div className="max-w-5xl mx-auto px-6 lg:px-12">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="font-display text-5xl md:text-7xl text-primary leading-[0.9]">
              Our <em>Services</em>
            </h2>
          </motion.div>

          <div className="space-y-0 border-t border-border">
            {services.map((service, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ duration: 0.4, delay: i * 0.05 }}
                viewport={{ once: true }}
                className="border-b border-border"
              >
                <button
                  onClick={() => setExpandedService(expandedService === i ? null : i)}
                  className="w-full flex items-center justify-between py-6 text-left group"
                >
                  <h3 className="font-display text-xl md:text-2xl text-foreground group-hover:text-primary transition-colors normal-case">{service.title}</h3>
                  {expandedService === i ? (
                    <Minus className="w-5 h-5 text-primary flex-shrink-0" />
                  ) : (
                    <Plus className="w-5 h-5 text-foreground/40 group-hover:text-primary flex-shrink-0 transition-colors" />
                  )}
                </button>
                {expandedService === i && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="pb-6"
                  >
                    <p className="font-serif text-foreground/60 leading-relaxed max-w-2xl">{service.description}</p>
                  </motion.div>
                )}
              </motion.div>
            ))}
          </div>

          <div className="text-center mt-12">
            <Button
              onClick={openAuthModal}
              className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90 px-10 py-6 font-sans text-sm tracking-widest uppercase"
            >
              Let's Make Sports Magic
              <Sparkles className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          4. ABOUT — Split layout: photo + red block
         ═══════════════════════════════════════════════ */}
      <section id="about" className="relative overflow-hidden">
        <div className="grid lg:grid-cols-2 min-h-[600px]">
          <div className="relative overflow-hidden">
            <img src={fansImage} alt="Our community" className="w-full h-full object-cover" />
          </div>
          <div className="bg-primary flex items-center">
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="px-8 lg:px-16 py-16"
            >
              <p className="text-xs font-sans tracking-[0.3em] uppercase text-primary-foreground/50 mb-4">About Us</p>
              <h2 className="font-display text-4xl md:text-5xl text-primary-foreground mb-8 leading-[0.95]">
                Built By <em>Fans,</em><br />For Fans
              </h2>
              <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-primary-foreground/30 mb-6">
                <img src={communityImage} alt="Loverball founder" className="w-full h-full object-cover" />
              </div>
              <p className="text-lg font-serif text-primary-foreground/80 leading-relaxed mb-4">
                Born in Los Angeles, Loverball was created for the millions of women who live and breathe sports but couldn't find a community that matched their energy.
              </p>
              <p className="text-base font-serif text-primary-foreground/60 leading-relaxed mb-8">
                We're building the destination for the $28B women's sports market — where fandom meets culture, connection, and content.
              </p>
              <Button
                onClick={openAuthModal}
                className="rounded-full bg-transparent border-2 border-primary-foreground text-primary-foreground hover:bg-primary-foreground/10 px-8 py-5 font-sans text-xs tracking-widest uppercase"
              >
                Learn More
              </Button>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          5. PAIN POINTS / PROCESS — Cream bg, cards
         ═══════════════════════════════════════════════ */}
      <section className="py-24 lg:py-32 bg-background">
        <div className="max-w-6xl mx-auto px-6 lg:px-12">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="font-display text-4xl md:text-6xl text-primary leading-[0.95]">
              Does this sound <em>familiar?</em>
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6 mb-20">
            {painPoints.map((point, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                viewport={{ once: true }}
              >
                <div className="bg-card border-2 border-primary/20 rounded-2xl p-8 h-full hover:border-primary hover:shadow-lg transition-all duration-300">
                  <h3 className="font-display text-lg text-primary mb-4 normal-case leading-tight">{point.title}</h3>
                  <p className="font-serif text-foreground/60 leading-relaxed">{point.description}</p>
                </div>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center"
          >
            <p className="script-accent text-primary mb-4">imagine if you could...</p>
            <h3 className="font-display text-3xl md:text-4xl text-foreground mb-6">
              Find your <em className="text-primary">tribe,</em> watch the stories that <em className="text-primary">matter,</em> and never miss a <em className="text-primary">moment</em>
            </h3>
            <Button
              onClick={openAuthModal}
              className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90 px-10 py-6 font-sans text-sm tracking-widest uppercase mt-4"
            >
              That's Loverball
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </motion.div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          6. HOW IT WORKS — White bg, 3-column
         ═══════════════════════════════════════════════ */}
      <section id="how-it-works" className="py-24 lg:py-32 bg-card">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="text-center mb-16">
            <p className="text-xs font-sans tracking-[0.3em] uppercase text-foreground/50 mb-4">How It Works</p>
            <h2 className="font-display text-5xl md:text-6xl text-foreground">
              Getting <em className="text-primary">Started</em>
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {howItWorks.map((step, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: i * 0.15 }}
                viewport={{ once: true }}
              >
                <div className="border-2 border-border rounded-2xl p-8 h-full hover:border-primary hover:shadow-lg transition-all duration-300">
                  <span className="font-display text-6xl text-primary/20 leading-none block mb-6">{step.step}</span>
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

      {/* ═══════════════════════════════════════════════
          7. FEATURED CHANNELS — Cream bg
         ═══════════════════════════════════════════════ */}
      <section id="channels" className="py-24 lg:py-32 bg-background">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="font-display text-5xl md:text-6xl text-foreground">
              Featured <em className="text-primary">Channels</em>
            </h2>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {channels.map((channel, i) => (
              <motion.div
                key={channel.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: i * 0.08 }}
                viewport={{ once: true }}
              >
                <div className="group bg-card border-2 border-border rounded-2xl overflow-hidden hover:border-primary hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer h-full">
                  <div className="relative bg-primary/5 p-8 flex items-center justify-center h-36">
                    <img
                      src={channel.image}
                      alt={channel.name}
                      className="w-16 h-16 object-contain group-hover:scale-110 transition-transform duration-300"
                      onError={e => { (e.target as HTMLImageElement).style.display = "none"; }}
                    />
                    <span className="absolute top-3 left-3 category-tag bg-primary/10 text-primary">{channel.sport}</span>
                  </div>
                  <div className="p-5 flex items-center justify-between">
                    <div>
                      <h3 className="font-display text-lg text-foreground group-hover:text-primary transition-colors normal-case">{channel.name}</h3>
                      <p className="text-xs font-sans text-muted-foreground mt-0.5">{channel.followers} followers</p>
                    </div>
                    <Button
                      onClick={(e) => { e.stopPropagation(); openAuthModal(); }}
                      size="sm"
                      className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-sans tracking-widest uppercase px-5"
                    >
                      Follow
                    </Button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          8. SIGNATURE HIGHLIGHT — Black bg for contrast
         ═══════════════════════════════════════════════ */}
      <section className="py-24 lg:py-32 bg-accent text-accent-foreground overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
            >
              <p className="text-xs font-sans tracking-[0.3em] uppercase text-accent-foreground/40 mb-4">Signature Experience</p>
              <h2 className="font-display text-5xl md:text-7xl text-primary leading-[0.9] mb-8">
                Our<br />SIGNATURE<br /><em>Experience</em>
              </h2>
              <p className="text-lg font-serif text-accent-foreground/70 leading-relaxed mb-8 max-w-lg">
                Exclusive watch parties, curated content drops, and VIP community events that bring women's sports fandom to life in ways you've never experienced.
              </p>
              <Button
                onClick={openAuthModal}
                className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90 px-10 py-6 font-sans text-sm tracking-widest uppercase"
              >
                Learn More
              </Button>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="polaroid-alt">
                <img src={athletesImage} alt="Loverball signature event" className="w-full aspect-[4/3] object-cover" />
                <p className="text-center mt-1 font-serif text-sm text-foreground/50 italic">game day magic ✨</p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          9. CONTENT PREVIEW — Trending videos
         ═══════════════════════════════════════════════ */}
      <section className="py-24 lg:py-32 bg-card">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <p className="text-xs font-sans tracking-[0.3em] uppercase text-foreground/50 mb-4">What's Hot</p>
            <h2 className="font-display text-5xl md:text-6xl text-foreground">
              Trending <em className="text-primary">Now</em>
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {latestVideos.map((video, i) => (
              <motion.div
                key={video.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: i * 0.08 }}
                viewport={{ once: true }}
                className={i === 0 ? 'sm:col-span-2 sm:row-span-2' : ''}
              >
                <div
                  className="group bg-card border-2 border-border rounded-2xl overflow-hidden hover:border-primary hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer h-full"
                  onClick={openAuthModal}
                >
                  <div className={`relative ${i === 0 ? 'aspect-[4/3]' : 'aspect-video'} bg-muted overflow-hidden`}>
                    <img src={video.thumbnail} alt={video.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="w-14 h-14 rounded-full bg-primary flex items-center justify-center shadow-xl">
                        <Play className="w-6 h-6 text-primary-foreground ml-0.5" />
                      </div>
                    </div>
                    {video.duration && (
                      <span className="absolute bottom-2 right-2 bg-black/70 text-white text-[10px] px-1.5 py-0.5 rounded font-sans font-bold">
                        {Math.floor(video.duration / 60)}:{String(video.duration % 60).padStart(2, '0')}
                      </span>
                    )}
                  </div>
                  <div className="p-4">
                    <h4 className="text-sm font-display line-clamp-2 group-hover:text-primary transition-colors normal-case">{video.title}</h4>
                    <div className="flex items-center gap-3 mt-2">
                      <p className="text-xs text-muted-foreground font-sans">{video.channelName}</p>
                      {video.views && (
                        <span className="flex items-center gap-1 text-xs text-muted-foreground font-sans">
                          <Eye className="w-3 h-3" />
                          {video.views >= 1000 ? `${(video.views / 1000).toFixed(1)}K` : video.views}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          10. TESTIMONIALS — Cream bg, cards
         ═══════════════════════════════════════════════ */}
      <section className="py-24 lg:py-32 bg-background">
        <div className="max-w-6xl mx-auto px-6 lg:px-12">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="font-display text-5xl md:text-6xl text-foreground">
              What Our <em className="text-primary">Members</em> Say
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                viewport={{ once: true }}
              >
                <div className="bg-card border-2 border-primary/15 rounded-2xl p-8 h-full">
                  <div className="flex gap-1 mb-4">
                    {[...Array(t.rating)].map((_, j) => (
                      <Star key={j} className="w-4 h-4 fill-primary text-primary" />
                    ))}
                  </div>
                  <p className="font-serif text-foreground/80 leading-relaxed mb-6 italic">"{t.quote}"</p>
                  <div>
                    <p className="font-sans font-bold text-sm text-foreground">{t.name}</p>
                    <p className="font-sans text-xs text-muted-foreground">{t.title}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          11. SOCIAL PROOF — Logo bar
         ═══════════════════════════════════════════════ */}
      <section className="py-16 bg-card border-y border-border">
        <div className="max-w-6xl mx-auto px-6 lg:px-12">
          <p className="text-center text-xs font-sans tracking-[0.3em] uppercase text-muted-foreground mb-8">As Featured In</p>
          <div className="flex flex-wrap items-center justify-center gap-8 md:gap-14">
            {socialLogos.map((logo) => (
              <span key={logo} className="text-sm md:text-base font-sans font-bold tracking-widest uppercase text-foreground/25 hover:text-foreground/50 transition-colors">
                {logo}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          12. FINAL CTA — Full red, email signup
         ═══════════════════════════════════════════════ */}
      <section className="py-28 lg:py-36 bg-primary">
        <div className="max-w-3xl mx-auto px-6 lg:px-12 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <p className="script-accent text-primary-foreground/40 mb-4">ready?</p>
            <h2 className="text-5xl sm:text-6xl lg:text-7xl font-display text-primary-foreground mb-6 leading-[0.95]">
              Ready to Transform<br />Your <em>Fandom?</em>
            </h2>
            <p className="text-lg font-serif text-primary-foreground/65 mb-4 max-w-xl mx-auto leading-relaxed">
              Sign up to get early access to events, exclusive content, and connect with women who love the game as much as you do.
            </p>
            <p className="text-sm font-sans text-primary-foreground/40 mb-10 tracking-wider uppercase">
              Join 10,000+ women sports fans
            </p>

            <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto mb-6">
              <input
                type="email"
                value={newsletterEmail}
                onChange={e => setNewsletterEmail(e.target.value)}
                placeholder="Enter your email"
                className="flex-1 px-6 py-4 rounded-full bg-primary-foreground/15 border border-primary-foreground/25 text-primary-foreground placeholder:text-primary-foreground/40 font-sans text-sm focus:outline-none focus:ring-2 focus:ring-primary-foreground/50 backdrop-blur-sm"
              />
              <Button
                onClick={openAuthModal}
                size="lg"
                className="rounded-full bg-white text-primary hover:bg-white/90 px-8 py-4 font-sans tracking-widest uppercase text-sm shadow-xl whitespace-nowrap"
              >
                Let's Get Started
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-primary-foreground/35 font-sans">Free to join. No credit card required.</p>
          </motion.div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="py-16 bg-accent text-accent-foreground">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="grid lg:grid-cols-12 gap-12 items-start mb-12">
            <div className="lg:col-span-4">
              <img src={loverballLogo} alt="Loverball" className="h-14 w-auto brightness-0 invert mb-4" />
              <p className="text-accent-foreground/50 text-sm leading-relaxed max-w-xs font-serif">
                The community platform for women who love sports.
              </p>
            </div>
            <div className="lg:col-span-2 lg:col-start-7">
              <p className="text-accent-foreground/40 text-xs font-sans font-bold tracking-widest uppercase mb-4">Platform</p>
              <nav className="space-y-3">
                <a href="#services" className="block text-sm text-accent-foreground/60 hover:text-accent-foreground transition-colors font-sans">Services</a>
                <a href="#about" className="block text-sm text-accent-foreground/60 hover:text-accent-foreground transition-colors font-sans">About</a>
                <a href="#how-it-works" className="block text-sm text-accent-foreground/60 hover:text-accent-foreground transition-colors font-sans">How It Works</a>
              </nav>
            </div>
            <div className="lg:col-span-2">
              <p className="text-accent-foreground/40 text-xs font-sans font-bold tracking-widest uppercase mb-4">Connect</p>
              <nav className="space-y-3">
                <a href="https://www.instagram.com/loverballclub/" target="_blank" rel="noopener noreferrer" className="block text-sm text-accent-foreground/60 hover:text-accent-foreground transition-colors font-sans">Instagram</a>
                <a href="https://www.tiktok.com/@loverballclub" target="_blank" rel="noopener noreferrer" className="block text-sm text-accent-foreground/60 hover:text-accent-foreground transition-colors font-sans">TikTok</a>
              </nav>
            </div>
            <div className="lg:col-span-2">
              <p className="text-accent-foreground/40 text-xs font-sans font-bold tracking-widest uppercase mb-4">Legal</p>
              <nav className="space-y-3">
                <a href="/privacy" className="block text-sm text-accent-foreground/60 hover:text-accent-foreground transition-colors font-sans">Privacy</a>
                <a href="/terms" className="block text-sm text-accent-foreground/60 hover:text-accent-foreground transition-colors font-sans">Terms</a>
                <a href="#" className="block text-sm text-accent-foreground/60 hover:text-accent-foreground transition-colors font-sans">Contact</a>
              </nav>
            </div>
          </div>
          <div className="border-t border-accent-foreground/10 pt-8">
            <p className="text-sm text-accent-foreground/40 font-sans">© 2026 Loverball. All rights reserved. Built by women, for women.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;

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
import { ArrowRight, Lock, Ticket, Users, Sparkles, Calendar, X, Menu, Mail, Play } from "lucide-react";
import heroImage from "@/assets/hero-women-new.png";
import loverballLogo from "@/assets/loverball-script-logo.png";
import philosophyImage from "@/assets/philosophy-image.jpg";
import communityImage from "@/assets/landing-community.jpg";
import athletesImage from "@/assets/landing-athletes.jpg";
import fansImage from "@/assets/landing-fans.jpg";
import fieldDay from "@/assets/field-day.jpg";
import teamSpirit from "@/assets/team-spirit.jpg";
import pickupGame from "@/assets/pickup-game.jpg";
import wnbaWatch from "@/assets/wnba-watch-party.jpg";
import { z } from "zod";

const signUpSchema = z.object({
  email: z.string().trim().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  inviteCode: z.string().trim().min(1, "Invite code is required"),
});

// Animated counter component
const AnimatedStat = ({ value, suffix = "%" }: { value: number; suffix?: string }) => {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!isInView) return;
    let start = 0;
    const duration = 1500;
    const step = (timestamp: number) => {
      if (!start) start = timestamp;
      const progress = Math.min((timestamp - start) / duration, 1);
      setCount(Math.floor(progress * value));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [isInView, value]);

  return <span ref={ref}>{count}{suffix}</span>;
};

const Index = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [newsletterEmail, setNewsletterEmail] = useState("");
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

  const sportCategories = [
    { label: "WNBA", color: "bg-accent text-accent-foreground" },
    { label: "SOCCER", color: "bg-terracotta text-terracotta-foreground" },
    { label: "TENNIS", color: "bg-accent text-accent-foreground" },
    { label: "BASKETBALL", color: "bg-terracotta text-terracotta-foreground" },
    { label: "VOLLEYBALL", color: "bg-accent text-accent-foreground" },
  ];

  const upcomingEvents = [
    { date: "MAR 22", title: "WNBA Season Opener Watch Party", venue: "The Victorian, Santa Monica", type: "Watch Party" },
    { date: "MAR 28", title: "Loverball Run Club × Griffith Park", venue: "Griffith Observatory Trailhead", type: "Meetup" },
    { date: "APR 05", title: "Angel City FC Home Opener", venue: "BMO Stadium, DTLA", type: "Game Day" },
    { date: "APR 12", title: "Women in Sports Panel + Mixer", venue: "Soho House, WeHo", type: "Panel" },
    { date: "APR 19", title: "March Madness Final Four Party", venue: "Loverball HQ, Venice", type: "Watch Party" },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* ══════════════════════════════════════════
          EDITORIAL NAV — Minimal masthead style
         ══════════════════════════════════════════ */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/98 backdrop-blur-sm">
        <div className="max-w-[1400px] mx-auto px-8 lg:px-16">
          <div className="flex items-center justify-between h-20">
            {/* Left — small uppercase links */}
            <div className="hidden lg:flex items-center gap-10">
              <a href="#about" className="text-[11px] font-sans font-medium tracking-[0.2em] uppercase text-foreground/50 hover:text-foreground transition-colors">About</a>
              <a href="#stories" className="text-[11px] font-sans font-medium tracking-[0.2em] uppercase text-foreground/50 hover:text-foreground transition-colors">Stories</a>
              <a href="#events" className="text-[11px] font-sans font-medium tracking-[0.2em] uppercase text-foreground/50 hover:text-foreground transition-colors">Events</a>
            </div>

            {/* Center — Masthead logo */}
            <div className="absolute left-1/2 -translate-x-1/2">
              <img src={loverballLogo} alt="Loverball" className="h-28 w-auto" />
            </div>

            {/* Right — CTA + links */}
            <div className="hidden lg:flex items-center gap-10">
              <button onClick={() => (isAuthenticated ? navigate("/shop") : openAuthModal())} className="text-[11px] font-sans font-medium tracking-[0.2em] uppercase text-foreground/50 hover:text-foreground transition-colors bg-transparent border-none cursor-pointer">Shop</button>
              <button onClick={() => (isAuthenticated ? navigate("/watch") : openAuthModal())} className="text-[11px] font-sans font-medium tracking-[0.2em] uppercase text-foreground/50 hover:text-foreground transition-colors bg-transparent border-none cursor-pointer">Watch</button>
              <Button onClick={openAuthModal} className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90 px-7 py-2 text-[11px] font-sans font-medium tracking-[0.15em] uppercase h-auto">
                Join Loverball
              </Button>
            </div>

            {/* Mobile menu */}
            <div className="lg:hidden ml-auto">
              <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="rounded-full">
                {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile dropdown */}
        {mobileMenuOpen && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="lg:hidden bg-background border-t border-border/30 px-8 py-6 space-y-1">
            <a href="#about" onClick={() => setMobileMenuOpen(false)} className="block py-3 text-[11px] font-sans font-medium tracking-[0.2em] uppercase text-foreground/60">About</a>
            <a href="#stories" onClick={() => setMobileMenuOpen(false)} className="block py-3 text-[11px] font-sans font-medium tracking-[0.2em] uppercase text-foreground/60">Stories</a>
            <a href="#events" onClick={() => setMobileMenuOpen(false)} className="block py-3 text-[11px] font-sans font-medium tracking-[0.2em] uppercase text-foreground/60">Events</a>
            <Button onClick={() => { setMobileMenuOpen(false); openAuthModal(); }} className="w-full rounded-full mt-4 bg-primary text-primary-foreground text-[11px] tracking-[0.15em] uppercase">
              Join Loverball
            </Button>
          </motion.div>
        )}
      </nav>

      {/* ══════════════════════════════════════════
          AUTH MODAL — unchanged logic
         ══════════════════════════════════════════ */}
      <Dialog open={authModalOpen} onOpenChange={setAuthModalOpen}>
        <DialogContent className="sm:max-w-md rounded-3xl p-0 overflow-hidden border-border/20">
          <div className="p-8 sm:p-10">
            <DialogTitle className="sr-only">Member Access</DialogTitle>
            <div className="flex justify-center mb-6">
              <img src={loverballLogo} alt="Loverball" className="h-16 w-auto" />
            </div>
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2 bg-muted rounded-full p-1 h-12">
                <TabsTrigger value="login" className="rounded-full data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-[11px] font-sans font-medium tracking-[0.1em] uppercase">Sign In</TabsTrigger>
                <TabsTrigger value="signup" className="rounded-full data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-[11px] font-sans font-medium tracking-[0.1em] uppercase">Sign Up</TabsTrigger>
              </TabsList>

              <TabsContent value="login">
                {showForgotPassword ? (
                  <form onSubmit={handleForgotPassword} className="space-y-5 mt-8">
                    <div className="space-y-2">
                      <Label htmlFor="reset-email" className="text-foreground text-[11px] tracking-[0.1em] uppercase">Email</Label>
                      <Input id="reset-email" type="email" placeholder="Enter your email" value={email} onChange={(e) => setEmail(e.target.value)} required className="bg-background border-border text-foreground rounded-xl h-12" />
                    </div>
                    <p className="text-muted-foreground text-sm">We'll send you a link to reset your password.</p>
                    <Button type="submit" className="w-full rounded-full h-12 text-[11px] font-sans tracking-[0.1em] uppercase" disabled={loading}>{loading ? "Sending..." : "Send Reset Link"}</Button>
                    <button type="button" onClick={() => setShowForgotPassword(false)} className="w-full text-sm text-primary hover:text-primary/80 transition-colors font-medium">Back to sign in</button>
                  </form>
                ) : (
                  <form onSubmit={handleLogin} className="space-y-5 mt-8">
                    <div className="space-y-2">
                      <Label htmlFor="login-email" className="text-foreground text-[11px] tracking-[0.1em] uppercase">Email</Label>
                      <Input id="login-email" type="email" placeholder="Enter your email" value={email} onChange={(e) => setEmail(e.target.value)} required className="bg-background border-border text-foreground rounded-xl h-12" />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="login-password" className="text-foreground text-[11px] tracking-[0.1em] uppercase">Password</Label>
                        <button type="button" onClick={() => setShowForgotPassword(true)} className="text-xs text-primary hover:text-primary/80 transition-colors">Forgot?</button>
                      </div>
                      <Input id="login-password" type="password" placeholder="Enter your password" value={password} onChange={(e) => setPassword(e.target.value)} required className="bg-background border-border text-foreground rounded-xl h-12" />
                    </div>
                    <Button type="submit" className="w-full rounded-full h-12 text-[11px] font-sans tracking-[0.1em] uppercase" disabled={loading}>{loading ? "Signing in..." : "Sign In"}</Button>
                  </form>
                )}
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
                  <div className="space-y-2">
                    <Label htmlFor="signup-invite" className="text-foreground text-[11px] tracking-[0.1em] uppercase flex items-center gap-2">
                      <Ticket className="w-3.5 h-3.5" /> Invite Code
                    </Label>
                    <Input id="signup-invite" type="text" placeholder="Enter invite code" value={inviteCode} onChange={(e) => setInviteCode(e.target.value.toUpperCase())} required className="bg-background border-border text-foreground rounded-xl h-12 uppercase tracking-widest" />
                    <p className="text-xs text-muted-foreground">Need a code? Request one from an existing member.</p>
                  </div>
                  <Button type="submit" className="w-full rounded-full h-12 text-[11px] font-sans tracking-[0.1em] uppercase" disabled={loading}>{loading ? "Creating account..." : "Create Account"}</Button>
                </form>
              </TabsContent>
            </Tabs>
          </div>
        </DialogContent>
      </Dialog>

      {/* ══════════════════════════════════════════
          HERO — Editorial split: headline left, asymmetric image right
         ══════════════════════════════════════════ */}
      <section className="pt-20">
        <div className="max-w-[1400px] mx-auto px-8 lg:px-16">
          <div className="grid lg:grid-cols-12 gap-0 min-h-[85vh] items-center py-16 lg:py-0">
            {/* Left — Editorial headline */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, ease: "easeOut" }}
              className="lg:col-span-5 relative z-10 py-12 lg:py-0"
            >
              <span className="text-[11px] font-sans font-medium tracking-[0.3em] uppercase text-accent mb-6 block">Women's Sports Fandom Club</span>
              <h1 className="font-condensed text-[4rem] sm:text-[5.5rem] lg:text-[7rem] leading-[0.9] tracking-tight text-foreground mb-8 uppercase">
                Her<br />
                Game.<br />
                <span className="text-secondary">Her Story.</span>
              </h1>
              <p className="text-lg font-serif text-muted-foreground leading-relaxed mb-10 max-w-md">
                The platform where women's sports culture meets connection, storytelling, and sisterhood. Born in Los Angeles.
              </p>
              <div className="flex flex-col sm:flex-row items-start gap-4">
                <Button onClick={openAuthModal} size="lg" className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90 px-10 py-6 text-[11px] font-sans font-medium tracking-[0.15em] uppercase shadow-lg h-auto">
                  Join Loverball
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <button onClick={() => document.getElementById("about")?.scrollIntoView({ behavior: "smooth" })} className="text-[11px] font-sans font-medium tracking-[0.15em] uppercase text-foreground/50 hover:text-foreground transition-colors py-4 bg-transparent border-none cursor-pointer">
                  Learn More ↓
                </button>
              </div>
            </motion.div>

            {/* Right — Asymmetric image with color block overlap */}
            <motion.div
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.9, delay: 0.2 }}
              className="lg:col-span-7 relative"
            >
              {/* Teal color block behind */}
              <div className="absolute top-8 right-0 w-[85%] h-[90%] bg-secondary rounded-sm" />
              {/* Main image */}
              <div className="relative aspect-[4/5] lg:aspect-[3/4] max-h-[680px] overflow-hidden rounded-sm shadow-2xl lg:ml-12">
                <img src={heroImage} alt="Women sports fans celebrating together" className="w-full h-full object-cover object-[center_30%]" />
              </div>
              {/* Coral accent strip */}
              <div className="absolute -bottom-4 left-0 lg:left-12 w-32 h-2 bg-accent" />
            </motion.div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          TICKER STRIP — Sport category badges
         ══════════════════════════════════════════ */}
      <div className="bg-foreground py-4 overflow-hidden">
        <div className="flex items-center gap-12 animate-[shimmer_20s_linear_infinite] whitespace-nowrap px-8">
          {[...sportCategories, ...sportCategories, ...sportCategories].map((cat, i) => (
            <span key={i} className="text-[11px] font-sans font-bold tracking-[0.3em] uppercase text-background/70 flex items-center gap-3">
              <span className="w-1.5 h-1.5 rounded-full bg-accent inline-block" />
              {cat.label}
            </span>
          ))}
        </div>
      </div>

      {/* ══════════════════════════════════════════
          ABOUT — Asymmetric editorial grid with stats
         ══════════════════════════════════════════ */}
      <section id="about" className="py-28 lg:py-40">
        <div className="max-w-[1400px] mx-auto px-8 lg:px-16">
          <div className="grid lg:grid-cols-12 gap-8 lg:gap-0">
            {/* Left column — Label + stats */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="lg:col-span-4 lg:pr-16"
            >
              <span className="font-condensed text-[3rem] lg:text-[4rem] leading-none tracking-tight text-secondary uppercase block mb-10">FANDOM</span>
              <div className="space-y-10">
                <div>
                  <span className="font-condensed text-[4rem] text-foreground leading-none"><AnimatedStat value={72} /></span>
                  <p className="text-sm text-muted-foreground mt-2 leading-relaxed">of women globally identify as avid sports fans</p>
                </div>
                <div>
                  <span className="font-condensed text-[4rem] text-foreground leading-none">$28B</span>
                  <p className="text-sm text-muted-foreground mt-2 leading-relaxed">women's sports market — and growing</p>
                </div>
              </div>
            </motion.div>

            {/* Center — Image */}
            <motion.div
              initial={{ opacity: 0, scale: 0.97 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.1 }}
              viewport={{ once: true }}
              className="lg:col-span-4"
            >
              <div className="aspect-[3/4] overflow-hidden rounded-sm">
                <img src={philosophyImage} alt="Loverball community" className="w-full h-full object-cover object-top" />
              </div>
            </motion.div>

            {/* Right — Text */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              viewport={{ once: true }}
              className="lg:col-span-4 lg:pl-16 flex flex-col justify-center"
            >
              <h2 className="font-display text-3xl lg:text-4xl text-foreground leading-tight mb-6">
                We specialize in creating <em>tailored</em> sports content and experiences that <em>inspire women.</em>
              </h2>
              <p className="text-base text-muted-foreground leading-relaxed mb-8">
                Loverball is a content and community platform for the women's sports market. AI-powered stories, community events, and narrative-driven coverage — all built for her.
              </p>
              <Button onClick={openAuthModal} variant="outline" className="rounded-full border-2 border-foreground text-foreground hover:bg-foreground hover:text-background px-8 py-5 text-[11px] font-sans font-medium tracking-[0.15em] uppercase w-fit h-auto transition-all">
                Meet Us
                <ArrowRight className="ml-2 h-3.5 w-3.5" />
              </Button>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          QUOTE — Color block band (teal)
         ══════════════════════════════════════════ */}
      <section className="bg-secondary py-20 lg:py-28">
        <div className="max-w-[900px] mx-auto px-8 lg:px-16 text-center">
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} transition={{ duration: 1 }} viewport={{ once: true }}>
            <span className="font-display text-7xl text-secondary-foreground/30 leading-none block mb-2">"</span>
            <p className="font-display text-2xl sm:text-3xl lg:text-4xl text-secondary-foreground leading-[1.3] -mt-6 italic">
              Sports aren't just games — they're culture, community, and connection.
            </p>
            <span className="block mt-8 text-[11px] font-sans font-medium tracking-[0.3em] uppercase text-secondary-foreground/50">
              — The Loverball Philosophy
            </span>
          </motion.div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          FEATURES — Editorial numbered cards
         ══════════════════════════════════════════ */}
      <section id="features" className="py-28 lg:py-40 bg-background">
        <div className="max-w-[1400px] mx-auto px-8 lg:px-16">
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} transition={{ duration: 0.8 }} viewport={{ once: true }} className="mb-20">
            <span className="font-condensed text-[3rem] lg:text-[4rem] leading-none tracking-tight text-secondary uppercase">PLATFORM</span>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-px bg-border">
            {[
              { num: "01", title: "AI-Powered Stories", desc: "Personalized sports content that speaks to what you care about. Beyond stats — the stories, drama, and culture.", icon: Sparkles },
              { num: "02", title: "Community Events", desc: "Watch parties, meetups, and experiences designed for women who love sports. Find your squad.", icon: Calendar },
              { num: "03", title: "Exclusive Content", desc: "Behind-the-scenes access, player interviews, and insider perspectives you won't find anywhere else.", icon: Users },
            ].map((feature, i) => (
              <motion.div
                key={feature.num}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                viewport={{ once: true }}
                className="bg-background p-10 lg:p-14 group"
              >
                <span className="font-condensed text-6xl text-border leading-none block mb-8">{feature.num}</span>
                <feature.icon className="w-6 h-6 text-accent mb-5" />
                <h3 className="font-condensed text-2xl uppercase text-foreground mb-4 tracking-wide">{feature.title}</h3>
                <p className="text-muted-foreground leading-relaxed text-[15px]">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          COMMUNITY — Masonry photo grid + text
         ══════════════════════════════════════════ */}
      <section id="stories" className="py-28 lg:py-40 bg-card">
        <div className="max-w-[1400px] mx-auto px-8 lg:px-16">
          <div className="grid lg:grid-cols-12 gap-8 lg:gap-16">
            {/* Left text */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="lg:col-span-4 flex flex-col justify-center"
            >
              <span className="font-condensed text-[3rem] lg:text-[4rem] leading-none tracking-tight text-secondary uppercase block mb-8">STORIES</span>
              <p className="text-lg font-serif text-muted-foreground leading-relaxed mb-6">
                Connect with thousands of women who share your passion for sports. Build real friendships, discover new content, and celebrate your fandom together.
              </p>
              <div className="grid grid-cols-3 gap-6 mb-8">
                {[
                  { value: "10K+", label: "Members" },
                  { value: "500+", label: "Stories" },
                  { value: "50+", label: "Events" },
                ].map((stat) => (
                  <div key={stat.label}>
                    <p className="font-condensed text-3xl text-foreground">{stat.value}</p>
                    <p className="text-[10px] font-sans tracking-[0.2em] uppercase text-muted-foreground mt-1">{stat.label}</p>
                  </div>
                ))}
              </div>
              <Button onClick={openAuthModal} className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90 px-8 py-5 text-[11px] font-sans font-medium tracking-[0.15em] uppercase w-fit h-auto">
                Explore Community
                <ArrowRight className="ml-2 h-3.5 w-3.5" />
              </Button>
            </motion.div>

            {/* Right — Masonry grid */}
            <div className="lg:col-span-8">
              <div className="grid grid-cols-2 gap-3">
                <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} viewport={{ once: true }} className="row-span-2">
                  <div className="aspect-[3/4] overflow-hidden rounded-sm hover:scale-[1.02] transition-transform duration-500">
                    <img src={communityImage} alt="Community watch party" className="w-full h-full object-cover" />
                  </div>
                </motion.div>
                <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 }} viewport={{ once: true }}>
                  <div className="aspect-[4/3] overflow-hidden rounded-sm hover:scale-[1.02] transition-transform duration-500">
                    <img src={athletesImage} alt="Athletes" className="w-full h-full object-cover" />
                  </div>
                </motion.div>
                <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }} viewport={{ once: true }}>
                  <div className="aspect-[4/3] overflow-hidden rounded-sm hover:scale-[1.02] transition-transform duration-500">
                    <img src={fansImage} alt="Fans celebrating" className="w-full h-full object-cover" />
                  </div>
                </motion.div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          EVENTS — Editorial schedule listing
         ══════════════════════════════════════════ */}
      <section id="events" className="py-28 lg:py-40 bg-background">
        <div className="max-w-[1400px] mx-auto px-8 lg:px-16">
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} transition={{ duration: 0.8 }} viewport={{ once: true }} className="flex items-end justify-between mb-16">
            <span className="font-condensed text-[3rem] lg:text-[4rem] leading-none tracking-tight text-secondary uppercase">EVENTS</span>
            <Button onClick={openAuthModal} variant="outline" className="hidden md:flex rounded-full border-2 border-foreground/20 text-foreground/70 hover:border-foreground hover:text-foreground px-6 py-2 text-[11px] font-sans font-medium tracking-[0.15em] uppercase h-auto transition-all">
              View All Events
            </Button>
          </motion.div>

          <div className="border-t border-foreground/10">
            {upcomingEvents.map((event, i) => (
              <motion.div
                key={event.title}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: i * 0.05 }}
                viewport={{ once: true }}
                onClick={openAuthModal}
                className="grid grid-cols-12 gap-4 py-6 border-b border-foreground/10 items-center cursor-pointer group hover:bg-muted/30 transition-colors px-4 -mx-4"
              >
                <div className="col-span-2 md:col-span-1">
                  <span className="font-condensed text-xl text-accent">{event.date}</span>
                </div>
                <div className="col-span-7 md:col-span-5">
                  <p className="font-sans font-medium text-foreground group-hover:text-secondary transition-colors">{event.title}</p>
                </div>
                <div className="hidden md:block col-span-3">
                  <p className="text-sm text-muted-foreground">{event.venue}</p>
                </div>
                <div className="col-span-3 md:col-span-2 text-right md:col-span-2">
                  <span className="text-[10px] font-sans font-bold tracking-[0.2em] uppercase text-accent/80 bg-accent/10 px-3 py-1 rounded-full">{event.type}</span>
                </div>
                <div className="hidden md:block col-span-1 text-right">
                  <ArrowRight className="h-4 w-4 text-foreground/20 group-hover:text-secondary transition-colors inline" />
                </div>
              </motion.div>
            ))}
          </div>

          <div className="mt-8 md:hidden text-center">
            <Button onClick={openAuthModal} variant="outline" className="rounded-full border-2 border-foreground/20 text-foreground/70 px-6 py-2 text-[11px] font-sans font-medium tracking-[0.15em] uppercase h-auto">
              View All Events
            </Button>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          PRESS — Color block with testimonials
         ══════════════════════════════════════════ */}
      <section className="bg-accent py-20 lg:py-28">
        <div className="max-w-[1400px] mx-auto px-8 lg:px-16">
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} transition={{ duration: 0.8 }} viewport={{ once: true }}>
            <span className="font-condensed text-[3rem] lg:text-[4rem] leading-none tracking-tight text-accent-foreground/30 uppercase block mb-12">WHAT THEY SAY</span>
            <div className="grid md:grid-cols-3 gap-8 lg:gap-12">
              {[
                { quote: "Finally a sports community that gets me.", name: "Alicia", detail: "Lakers fan" },
                { quote: "I met my best friends at a Loverball watch party.", name: "Dani", detail: "WNBA superfan" },
                { quote: "The content here actually speaks to women fans.", name: "Maria", detail: "Soccer obsessed" },
              ].map((t, i) => (
                <motion.div key={t.name} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: i * 0.1 }} viewport={{ once: true }}>
                  <p className="font-display text-xl lg:text-2xl text-accent-foreground italic leading-relaxed mb-6">"{t.quote}"</p>
                  <p className="text-[11px] font-sans font-medium tracking-[0.2em] uppercase text-accent-foreground/70">— {t.name}, {t.detail}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          APP / PRODUCT FOCUS — Editorial feature
         ══════════════════════════════════════════ */}
      <section className="py-28 lg:py-40 bg-background">
        <div className="max-w-[1400px] mx-auto px-8 lg:px-16">
          <div className="grid lg:grid-cols-2 gap-16 lg:gap-24 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
            >
              <span className="font-condensed text-[3rem] lg:text-[4rem] leading-none tracking-tight text-secondary uppercase block mb-8">THE APP</span>
              <h2 className="font-display text-3xl lg:text-4xl text-foreground leading-tight mb-8">
                Your fandom, <em className="text-secondary">personalized.</em>
              </h2>
              <div className="space-y-6">
                {[
                  "AI-powered sports stories tailored to your interests",
                  "Community events and watch parties near you",
                  "Connect with other women fans in your city",
                  "Exclusive content and behind-the-scenes access",
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-4">
                    <span className="w-1.5 h-1.5 rounded-full bg-accent mt-2.5 flex-shrink-0" />
                    <p className="text-base text-muted-foreground leading-relaxed">{item}</p>
                  </div>
                ))}
              </div>
              <div className="mt-10">
                <Button onClick={openAuthModal} size="lg" className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90 px-10 py-6 text-[11px] font-sans font-medium tracking-[0.15em] uppercase shadow-lg h-auto">
                  Get Started
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              viewport={{ once: true }}
              className="relative"
            >
              {/* Coral block behind */}
              <div className="absolute -top-6 -right-6 w-[85%] h-[85%] bg-accent/10 rounded-sm" />
              <div className="relative aspect-[4/5] overflow-hidden rounded-sm shadow-xl">
                <img src={wnbaWatch} alt="Loverball app experience" className="w-full h-full object-cover" />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          FINAL CTA — Dark editorial band
         ══════════════════════════════════════════ */}
      <section className="py-28 lg:py-36 bg-foreground">
        <div className="max-w-[900px] mx-auto px-8 lg:px-16 text-center">
          <motion.div initial={{ opacity: 0, scale: 0.97 }} whileInView={{ opacity: 1, scale: 1 }} transition={{ duration: 0.8 }} viewport={{ once: true }}>
            <span className="font-condensed text-[4rem] sm:text-[5rem] lg:text-[6rem] leading-[0.9] tracking-tight text-primary uppercase block mb-6">
              READY TO<br />JOIN?
            </span>
            <p className="text-lg font-serif text-background/50 mb-12 max-w-lg mx-auto leading-relaxed">
              Be part of the community redefining women's sports fandom. Your game. Your community. Your story.
            </p>
            <Button size="lg" onClick={openAuthModal} className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90 text-[11px] font-sans font-medium tracking-[0.15em] uppercase px-12 py-7 shadow-2xl h-auto">
              Join Loverball
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </motion.div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          FOOTER — Dark editorial
         ══════════════════════════════════════════ */}
      <footer className="py-16 bg-foreground border-t border-background/10">
        <div className="max-w-[1400px] mx-auto px-8 lg:px-16">
          {/* Newsletter */}
          <div className="mb-16 pb-12 border-b border-background/10">
            <div className="max-w-md mx-auto text-center">
              <h3 className="font-condensed text-2xl uppercase tracking-wide text-background mb-3">Stay In The Loop</h3>
              <p className="text-background/40 text-sm mb-6">Get the latest on events, content drops, and community updates.</p>
              <form onSubmit={(e) => { e.preventDefault(); toast({ title: "Subscribed!", description: "You'll hear from us soon." }); setNewsletterEmail(""); }} className="flex gap-2">
                <Input
                  type="email"
                  placeholder="Enter your email"
                  value={newsletterEmail}
                  onChange={(e) => setNewsletterEmail(e.target.value)}
                  required
                  className="flex-1 rounded-full bg-background/10 border-background/10 text-background placeholder:text-background/30 h-12"
                />
                <Button type="submit" className="rounded-full bg-accent text-accent-foreground hover:bg-accent/90 px-6 h-12">
                  <Mail className="h-4 w-4" />
                </Button>
              </form>
            </div>
          </div>

          <div className="grid lg:grid-cols-12 gap-12 items-start mb-12">
            <div className="lg:col-span-4">
              <img src={loverballLogo} alt="Loverball" className="h-12 w-auto brightness-0 invert mb-4" />
              <p className="text-background/40 text-sm leading-relaxed max-w-xs">
                A community platform for women who love sports. Born in Los Angeles.
              </p>
            </div>
            <div className="lg:col-span-2 lg:col-start-7">
              <p className="text-background/30 text-[11px] font-sans font-medium tracking-[0.2em] uppercase mb-4">Platform</p>
              <nav className="space-y-3">
                <a href="#about" className="block text-sm text-background/60 hover:text-background transition-colors">About</a>
                <a href="#features" className="block text-sm text-background/60 hover:text-background transition-colors">Features</a>
                <a href="#stories" className="block text-sm text-background/60 hover:text-background transition-colors">Community</a>
              </nav>
            </div>
            <div className="lg:col-span-2">
              <p className="text-background/30 text-[11px] font-sans font-medium tracking-[0.2em] uppercase mb-4">Connect</p>
              <nav className="space-y-3">
                <a href="https://www.instagram.com/loverballclub/" target="_blank" rel="noopener noreferrer" className="block text-sm text-background/60 hover:text-background transition-colors">Instagram</a>
                <a href="https://www.tiktok.com/@loverballclub" target="_blank" rel="noopener noreferrer" className="block text-sm text-background/60 hover:text-background transition-colors">TikTok</a>
              </nav>
            </div>
            <div className="lg:col-span-2">
              <p className="text-background/30 text-[11px] font-sans font-medium tracking-[0.2em] uppercase mb-4">Legal</p>
              <nav className="space-y-3">
                <a href="/privacy" className="block text-sm text-background/60 hover:text-background transition-colors">Privacy</a>
                <a href="/terms" className="block text-sm text-background/60 hover:text-background transition-colors">Terms</a>
                <a href="#" className="block text-sm text-background/60 hover:text-background transition-colors">Contact</a>
              </nav>
            </div>
          </div>
          <div className="border-t border-background/10 pt-8">
            <p className="text-[11px] font-sans tracking-[0.1em] text-background/30">© 2026 Loverball. All rights reserved. Built by women, for women.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;

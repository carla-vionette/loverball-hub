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
import { ArrowRight, Lock, Ticket, Users, Sparkles, Calendar, X, Menu, Mail } from "lucide-react";
import heroImage from "@/assets/hero-women-new.png";
import loverballLogo from "@/assets/loverball-script-logo.png";
import philosophyImage from "@/assets/philosophy-image.jpg";
import communityImage from "@/assets/landing-community.jpg";
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
    navigate("/following", { replace: true });
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
        navigate(profile ? "/following" : "/onboarding");
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

  const testimonials = [
    "\"Finally a sports community that gets me.\" — Alicia, Lakers fan 💜💛",
    "\"I met my best friends at a Loverball watch party.\" — Dani, WNBA superfan 🏀",
    "\"The content here actually speaks to women fans.\" — Maria, soccer obsessed ⚽",
    "\"Loverball made me feel like my fandom matters.\" — Priya, tennis & F1 🏎️",
  ];

  const features = [
    {
      icon: Sparkles,
      title: "AI-Powered Stats & Stories",
      description: "Personalized sports content that speaks to what you care about. Not just stats—the stories, drama, and culture that make the game matter.",
    },
    {
      icon: Calendar,
      title: "Community Events",
      description: "Watch parties, meetups, and experiences designed for women who love sports. Find your squad. Build your community.",
    },
    {
      icon: Users,
      title: "Exclusive Content",
      description: "Behind-the-scenes access, player interviews, and insider perspectives you won't find anywhere else.",
    },
  ];

  const communityTestimonials = [
    { quote: "Loverball changed how I experience game day. I finally have a crew that matches my energy.", name: "Jasmine T.", sport: "Basketball & WNBA", avatar: "🏀" },
    { quote: "The watch parties are incredible—I've never felt more connected to other women sports fans.", name: "Sophia R.", sport: "Soccer & Liga MX", avatar: "⚽" },
    { quote: "As a die-hard baseball fan, finding women who go just as hard for their teams was everything.", name: "Kayla M.", sport: "Baseball & Dodgers", avatar: "⚾" },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border/50">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="flex items-center justify-between h-20">
            {/* Left nav */}
            <div className="hidden md:flex items-center gap-2">
              <a href="#about" className="px-5 py-2 text-sm font-medium text-foreground/70 hover:text-foreground hover:bg-secondary rounded-full transition-all">About</a>
              <a href="#features" className="px-5 py-2 text-sm font-medium text-foreground/70 hover:text-foreground hover:bg-secondary rounded-full transition-all">Features</a>
              <a href="#community" className="px-5 py-2 text-sm font-medium text-foreground/70 hover:text-foreground hover:bg-secondary rounded-full transition-all">Community</a>
            </div>

            {/* Center logo */}
            <img src={loverballLogo} alt="Loverball" className="h-24 w-auto absolute left-1/2 -translate-x-1/2" />

            {/* Right nav */}
            <div className="hidden md:flex items-center gap-3">
              <button onClick={() => (isAuthenticated ? navigate("/events") : openAuthModal())} className="px-5 py-2 text-sm font-medium text-foreground/70 hover:text-foreground hover:bg-secondary rounded-full transition-all bg-transparent border-none cursor-pointer">Events</button>
              <button onClick={() => (isAuthenticated ? navigate("/shop") : openAuthModal())} className="px-5 py-2 text-sm font-medium text-foreground/70 hover:text-foreground hover:bg-secondary rounded-full transition-all bg-transparent border-none cursor-pointer">Shop</button>
              {isAuthenticated ? (
                <Button onClick={() => navigate("/following")} className="rounded-full bg-primary hover:bg-primary/90 px-6">Enter</Button>
              ) : (
                <Button onClick={openAuthModal} className="rounded-full bg-primary hover:bg-primary/90 px-6">
                  <Lock className="h-4 w-4 mr-2" />
                  Member Access
                </Button>
              )}
            </div>

            {/* Mobile hamburger */}
            <div className="md:hidden">
              <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="rounded-full">
                {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="md:hidden bg-background border-t border-border/50 px-6 py-4 space-y-2">
            <a href="#about" onClick={() => setMobileMenuOpen(false)} className="block py-3 text-sm font-medium text-foreground/70">About</a>
            <a href="#features" onClick={() => setMobileMenuOpen(false)} className="block py-3 text-sm font-medium text-foreground/70">Features</a>
            <a href="#community" onClick={() => setMobileMenuOpen(false)} className="block py-3 text-sm font-medium text-foreground/70">Community</a>
            <Button onClick={() => { setMobileMenuOpen(false); openAuthModal(); }} className="w-full rounded-full mt-2">
              <Lock className="h-4 w-4 mr-2" /> Member Access
            </Button>
          </motion.div>
        )}
      </nav>

      {/* Auth Modal */}
      <Dialog open={authModalOpen} onOpenChange={setAuthModalOpen}>
        <DialogContent className="sm:max-w-md rounded-3xl p-0 overflow-hidden border-border/20">
          <div className="p-8 sm:p-10">
            <DialogTitle className="sr-only">Member Access</DialogTitle>
            <div className="flex justify-center mb-6">
              <img src={loverballLogo} alt="Loverball" className="h-10 w-auto" />
            </div>
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2 bg-secondary rounded-full p-1 h-14">
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

      {/* Hero Section */}
      <section className="pt-20 relative bg-background">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-0 items-center min-h-[75vh] py-12">
            {/* Left - Hero Image (reduced 25%) */}
            <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8 }} className="relative order-1">
              <div className="relative aspect-[4/5] lg:aspect-[4/4] overflow-hidden rounded-2xl shadow-2xl">
                <img src={heroImage} alt="Women sports fans celebrating together" className="w-full h-full object-cover object-[center_35%]" />
              </div>
            </motion.div>

            {/* Right - Content Card */}
            <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8, delay: 0.2 }} className="relative order-2 lg:-ml-24 z-10">
              <div className="bg-foreground text-background p-8 sm:p-12 lg:p-14 rounded-3xl shadow-2xl">
                <h1 className="text-[2rem] sm:text-5xl lg:text-6xl font-sans font-normal leading-[1.1] mb-6 text-background whitespace-nowrap">
                  Her Game.<br />
                  Her Community.<br />
                  Her Platform.
                </h1>
                <p className="text-background/60 text-lg leading-relaxed mb-8 max-w-md">
                  The only platform built for women sports fans—where AI-powered stories, real-world events, and authentic community celebrate her game.
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button onClick={openAuthModal} size="lg" className="rounded-full bg-accent text-accent-foreground hover:bg-accent/90 px-10 py-6 text-base font-semibold shadow-lg">
                    Join Loverball
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                  <Button variant="outline" size="lg" onClick={() => document.getElementById("about")?.scrollIntoView({ behavior: "smooth" })} className="rounded-full border-2 border-background/30 text-background hover:bg-background/10 px-8 py-6 text-base font-medium bg-transparent">
                    How It Works
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>


      {/* About Section - "Why Loverball?" */}
      <section id="about" className="py-32 lg:py-40 bg-gradient-to-b from-card to-background">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} viewport={{ once: true }} className="text-center mb-24">
            <span className="inline-block text-muted-foreground text-xs font-medium tracking-widest uppercase mb-4">The Movement</span>
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-sans font-normal text-foreground">
              Why <span className="italic">Loverball</span>?
            </h2>
          </motion.div>

          <div className="grid lg:grid-cols-3 gap-16 lg:gap-8 items-start">
            {/* Stats */}
            <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} viewport={{ once: true }} className="space-y-8">
              <div className="bg-secondary/60 p-10 rounded-3xl">
                <span className="text-6xl sm:text-7xl font-sans font-normal text-foreground">
                  <AnimatedStat value={72} />
                </span>
                <p className="text-foreground/60 text-base mt-4 leading-relaxed">
                  of women globally identify as <span className="text-foreground font-medium">avid sports fans</span>
                </p>
                <p className="text-foreground/30 text-xs mt-3">Source: Nielsen Sports 2024</p>
              </div>
              <div className="bg-secondary/60 p-10 rounded-3xl">
                <span className="text-6xl sm:text-7xl font-sans font-normal text-foreground">
                  <AnimatedStat value={85} />
                </span>
                <p className="text-foreground/60 text-base mt-4 leading-relaxed">
                  of household sports purchasing decisions are <span className="text-foreground font-medium">controlled by women</span>
                </p>
                <p className="text-foreground/30 text-xs mt-3">Source: ESPN/espnW Research 2024</p>
              </div>
            </motion.div>

            {/* Center Image (reduced 30%) */}
            <motion.div initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} transition={{ duration: 0.8, delay: 0.1 }} viewport={{ once: true }} className="relative">
              <div className="aspect-[3/4] max-h-[420px] mx-auto overflow-hidden rounded-2xl shadow-xl">
                <img src={philosophyImage} alt="Loverball community member" className="w-full h-full object-cover object-top" />
              </div>
              <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 bg-foreground text-background px-6 py-3 rounded-full shadow-lg whitespace-nowrap">
                <span className="text-sm font-medium">Yet she remains overlooked.</span>
              </div>
            </motion.div>

            {/* Text content */}
            <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.2 }} viewport={{ once: true }} className="lg:pt-8">
              <h3 className="text-2xl sm:text-3xl font-sans font-normal leading-snug mb-6 text-foreground">
                Loverball is the platform where <span className="italic">female fandom</span> thrives.
              </h3>
              <p className="text-foreground/60 text-base leading-relaxed mb-6">
                We're creating the space for her to gather, share, and celebrate the games she loves. AI-powered stories, community events, and narrative-driven coverage tailored to female fans.
              </p>
              <p className="text-foreground/60 text-base leading-relaxed mb-8">
                By 2030, women will command 75% of global discretionary spending. <span className="font-semibold">The future of sports is female.</span>
              </p>
              <Button onClick={openAuthModal} className="rounded-full px-8">
                Join Loverball
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </motion.div>
          </div>
        </div>
      </section>


      {/* Features Section */}
      <section id="features" className="py-28 lg:py-36 bg-gradient-to-b from-background to-card/50">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} viewport={{ once: true }} className="text-center mb-16">
            <span className="inline-block text-muted-foreground text-xs font-medium tracking-widest uppercase mb-4">Our Platform</span>
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-sans font-normal text-foreground">
              Built <span className="italic">For Her</span>
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="group"
              >
                <div className="bg-card p-8 rounded-3xl shadow-[0_4px_20px_rgba(0,0,0,0.04)] hover:shadow-[0_12px_40px_rgba(0,0,0,0.1)] hover:-translate-y-1 transition-all duration-300 h-full border border-border/20">
                  <div className="w-14 h-14 bg-secondary rounded-2xl flex items-center justify-center mb-6 group-hover:bg-foreground group-hover:text-background transition-colors duration-300">
                    <feature.icon className="h-7 w-7 text-foreground group-hover:text-background transition-colors duration-300" />
                  </div>
                  <h3 className="text-xl font-sans text-foreground mb-4">{feature.title}</h3>
                  <p className="text-foreground/60 leading-relaxed mb-4">{feature.description}</p>
                  <button onClick={() => document.getElementById("about")?.scrollIntoView({ behavior: "smooth" })} className="text-sm font-medium text-foreground/70 hover:text-foreground transition-colors inline-flex items-center gap-1">
                    Learn More <ArrowRight className="h-3 w-3" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Community Section */}
      <section id="community" className="py-28 lg:py-36 bg-card">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-0 items-center">
            <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} transition={{ duration: 0.8 }} viewport={{ once: true }} className="lg:pr-12 order-2 lg:order-1">
              <span className="inline-block text-muted-foreground text-xs font-medium tracking-widest uppercase mb-4">Community</span>
              <h2 className="text-4xl sm:text-5xl font-sans font-normal text-foreground leading-tight mb-6">
                Ready to be part of the <span className="italic">movement</span>?
              </h2>
              <p className="text-foreground/60 text-lg leading-relaxed mb-8 max-w-lg">
                Be part of the community redefining women's sports fandom. Your fandom matters here.
              </p>
              <Button onClick={openAuthModal} size="lg" className="rounded-full bg-accent text-accent-foreground hover:bg-accent/90 px-10 py-6 text-base font-semibold">
                Join Loverball
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </motion.div>

            <motion.div initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} transition={{ duration: 0.8, delay: 0.2 }} viewport={{ once: true }} className="relative order-1 lg:order-2">
              <div className="aspect-[4/3] overflow-hidden rounded-2xl shadow-xl lg:-ml-12">
                <img src={communityImage} alt="Loverball community at a watch party" className="w-full h-full object-cover" />
              </div>
              <div className="hidden lg:block absolute -bottom-8 -left-8 w-32 h-32 bg-accent/20 rounded-3xl -z-10" />
            </motion.div>
          </div>
        </div>
      </section>


      {/* Final CTA */}
      <section className="py-24 bg-foreground">
        <div className="max-w-4xl mx-auto px-6 lg:px-12 text-center">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} transition={{ duration: 0.8 }} viewport={{ once: true }}>
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-sans text-background mb-6">
              Ready to <span className="italic">Join</span>?
            </h2>
            <p className="text-xl text-background/60 mb-10 max-w-2xl mx-auto">
              Be part of the movement redefining women's sports fandom.
            </p>
            <Button size="lg" onClick={openAuthModal} className="rounded-full text-lg px-10 py-7 bg-accent text-accent-foreground hover:bg-accent/90 font-semibold shadow-xl">
              Join Loverball
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-16" style={{ backgroundColor: "#1a1a1a" }}>
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          {/* Newsletter */}
          <div className="mb-16 pb-12 border-b border-white/10">
            <div className="max-w-md mx-auto text-center">
              <h3 className="text-2xl font-sans font-normal text-white mb-3">Stay in the loop</h3>
              <p className="text-white/50 text-sm mb-6">Get the latest on events, content drops, and community updates.</p>
              <form onSubmit={(e) => { e.preventDefault(); toast({ title: "Subscribed!", description: "You'll hear from us soon." }); setNewsletterEmail(""); }} className="flex gap-2">
                <Input
                  type="email"
                  placeholder="Enter your email"
                  value={newsletterEmail}
                  onChange={(e) => setNewsletterEmail(e.target.value)}
                  required
                  className="flex-1 rounded-full bg-white/10 border-white/10 text-white placeholder:text-white/40 h-12"
                />
                <Button type="submit" className="rounded-full bg-accent text-accent-foreground hover:bg-accent/90 px-6 h-12">
                  <Mail className="h-4 w-4" />
                </Button>
              </form>
            </div>
          </div>

          <div className="grid lg:grid-cols-12 gap-12 items-start mb-12">
            <div className="lg:col-span-4">
              <img src={loverballLogo} alt="Loverball" className="h-14 w-auto brightness-0 invert mb-4" />
              <p className="text-white/50 text-sm leading-relaxed max-w-xs">
                We're a community platform for women who love sports.
              </p>
            </div>
            <div className="lg:col-span-2 lg:col-start-7">
              <p className="text-white/40 text-sm font-medium tracking-wide uppercase mb-4">Platform</p>
              <nav className="space-y-3">
                <a href="#about" className="block text-sm text-white/70 hover:text-white transition-colors">About</a>
                <a href="#features" className="block text-sm text-white/70 hover:text-white transition-colors">Features</a>
                <a href="#community" className="block text-sm text-white/70 hover:text-white transition-colors">Community</a>
              </nav>
            </div>
            <div className="lg:col-span-2">
              <p className="text-white/40 text-sm font-medium tracking-wide uppercase mb-4">Connect</p>
              <nav className="space-y-3">
                <a href="https://www.instagram.com/loverballclub/" target="_blank" rel="noopener noreferrer" className="block text-sm text-white/70 hover:text-white transition-colors">Instagram</a>
                <a href="https://www.tiktok.com/@loverballclub" target="_blank" rel="noopener noreferrer" className="block text-sm text-white/70 hover:text-white transition-colors">TikTok</a>
              </nav>
            </div>
            <div className="lg:col-span-2">
              <p className="text-white/40 text-sm font-medium tracking-wide uppercase mb-4">Legal</p>
              <nav className="space-y-3">
                <a href="/privacy" className="block text-sm text-white/70 hover:text-white transition-colors">Privacy</a>
                <a href="/terms" className="block text-sm text-white/70 hover:text-white transition-colors">Terms</a>
                <a href="#" className="block text-sm text-white/70 hover:text-white transition-colors">Contact</a>
              </nav>
            </div>
          </div>
          <div className="border-t border-white/10 pt-8">
            <p className="text-sm text-white/40">© 2026 Loverball. All rights reserved. Built by women, for women.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;

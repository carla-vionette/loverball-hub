import { useState } from "react";
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
import { ArrowRight, Ticket, Sparkles, Users, Zap, Star, X, Menu, Mail } from "lucide-react";
import heroImage from "@/assets/hero-women-new.png";
import loverballLogo from "@/assets/loverball-script-logo.png";
import communityImage from "@/assets/landing-community.jpg";
import fansImage from "@/assets/landing-fans.jpg";
import { z } from "zod";

const signUpSchema = z.object({
  email: z.string().trim().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  inviteCode: z.string().trim().min(1, "Invite code is required"),
});

const features = [
  {
    icon: Sparkles,
    title: "AI-Powered Stats & Stories",
    description: "Personalized sports content that speaks to what you care about. Not just stats—the stories, drama, and culture that make the game matter.",
  },
  {
    icon: Users,
    title: "Community Events",
    description: "Watch parties, meetups, and experiences designed for women who love sports. Find your squad. Build your community.",
  },
  {
    icon: Star,
    title: "Exclusive Content",
    description: "Behind-the-scenes access, player interviews, and insider perspectives you won't find anywhere else.",
  },
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

  const scrollTo = (id: string) => {
    setMobileMenuOpen(false);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  const fadeUp = {
    initial: { opacity: 0, y: 30 },
    whileInView: { opacity: 1, y: 0 },
    transition: { duration: 0.7 },
    viewport: { once: true },
  };

  return (
    <div className="min-h-screen bg-background">
      {/* ── Navigation ── */}
      <nav className="sticky top-0 z-50 bg-background/95 backdrop-blur-md border-b border-border/50">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="flex items-center justify-between h-16">
            {/* Left nav */}
            <div className="hidden md:flex items-center gap-8">
              <button onClick={() => scrollTo("about")} className="text-sm font-sans text-foreground/60 hover:text-foreground transition-colors">About</button>
              <button onClick={() => scrollTo("features")} className="text-sm font-sans text-foreground/60 hover:text-foreground transition-colors">Features</button>
              <button onClick={() => scrollTo("community")} className="text-sm font-sans text-foreground/60 hover:text-foreground transition-colors">Community</button>
            </div>

            {/* Mobile hamburger */}
            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden text-foreground/80 hover:text-foreground transition-colors">
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            {/* Center logo */}
            <img src={loverballLogo} alt="Loverball" className="h-16 w-auto absolute left-1/2 -translate-x-1/2" />

            {/* Right nav */}
            <div className="hidden md:flex items-center gap-4">
              <button onClick={() => scrollTo("community")} className="text-sm font-sans text-foreground/60 hover:text-foreground transition-colors">Events</button>
              <a href="/shop" className="text-sm font-sans text-foreground/60 hover:text-foreground transition-colors">Shop</a>
              <Button onClick={openAuthModal} className="rounded-full px-6 text-sm font-sans">
                Member Access
              </Button>
            </div>

            {/* Mobile CTA */}
            <Button onClick={openAuthModal} className="md:hidden rounded-full px-4 text-xs font-sans">
              Join
            </Button>
          </div>
        </div>

        {mobileMenuOpen && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="md:hidden bg-background border-t border-border px-6 py-4 space-y-1">
            <button onClick={() => scrollTo("about")} className="block w-full text-left py-3 text-sm font-sans text-foreground/70">About</button>
            <button onClick={() => scrollTo("features")} className="block w-full text-left py-3 text-sm font-sans text-foreground/70">Features</button>
            <button onClick={() => scrollTo("community")} className="block w-full text-left py-3 text-sm font-sans text-foreground/70">Community</button>
            <a href="/shop" className="block py-3 text-sm font-sans text-foreground/70">Shop</a>
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
                      <Label htmlFor="reset-email" className="text-sm font-medium">Email</Label>
                      <Input id="reset-email" type="email" placeholder="Enter your email" value={email} onChange={(e) => setEmail(e.target.value)} required className="rounded-xl h-12" />
                    </div>
                    <p className="text-foreground/50 text-sm">We'll send you a link to reset your password.</p>
                    <Button type="submit" className="w-full rounded-full h-12 text-sm font-medium" disabled={loading}>{loading ? "Sending..." : "Send Reset Link"}</Button>
                    <button type="button" onClick={() => setShowForgotPassword(false)} className="w-full text-sm text-primary hover:text-primary/80 transition-colors font-medium">Back to sign in</button>
                  </form>
                ) : (
                  <form onSubmit={handleLogin} className="space-y-6 mt-8">
                    <div className="space-y-2">
                      <Label htmlFor="login-email" className="text-sm font-medium">Email</Label>
                      <Input id="login-email" type="email" placeholder="Enter your email" value={email} onChange={(e) => setEmail(e.target.value)} required className="rounded-xl h-12" />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="login-password" className="text-sm font-medium">Password</Label>
                        <button type="button" onClick={() => setShowForgotPassword(true)} className="text-sm text-primary hover:text-primary/80 transition-colors">Forgot password?</button>
                      </div>
                      <Input id="login-password" type="password" placeholder="Enter your password" value={password} onChange={(e) => setPassword(e.target.value)} required className="rounded-xl h-12" />
                    </div>
                    <Button type="submit" className="w-full rounded-full h-12 text-sm font-medium" disabled={loading}>{loading ? "Signing in..." : "Sign In"}</Button>
                  </form>
                )}
              </TabsContent>

              <TabsContent value="signup">
                <form onSubmit={handleSignup} className="space-y-6 mt-8">
                  <div className="space-y-2">
                    <Label htmlFor="signup-email" className="text-sm font-medium">Email</Label>
                    <Input id="signup-email" type="email" placeholder="Enter your email" value={email} onChange={(e) => setEmail(e.target.value)} required className="rounded-xl h-12" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password" className="text-sm font-medium">Password</Label>
                    <Input id="signup-password" type="password" placeholder="Create a password (min 6 characters)" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} className="rounded-xl h-12" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-invite" className="text-sm font-medium flex items-center gap-2">
                      <Ticket className="w-4 h-4" /> Invite Code
                    </Label>
                    <Input id="signup-invite" type="text" placeholder="Enter your invite code" value={inviteCode} onChange={(e) => setInviteCode(e.target.value.toUpperCase())} required className="rounded-xl h-12 uppercase tracking-widest" />
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
          HERO SECTION
         ═══════════════════════════════════════════════ */}
      <section className="relative overflow-hidden">
        <div className="relative min-h-[85vh] flex items-center">
          {/* Background image */}
          <div className="absolute inset-0">
            <img src={heroImage} alt="Women sports fans celebrating together" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-r from-foreground/70 via-foreground/50 to-transparent" />
          </div>

          {/* Content */}
          <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-12 py-24">
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="max-w-2xl"
            >
              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-display text-white leading-[0.95] mb-6">
                Her Game.<br />
                Her Community.<br />
                Her <em>Platform.</em>
              </h1>
              <p className="text-lg md:text-xl text-white/80 font-serif leading-relaxed mb-10 max-w-lg">
                The only platform built for women sports fans—where AI-powered stories, real-world events, and authentic community celebrate her game.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  onClick={openAuthModal}
                  size="lg"
                  className="rounded-full px-10 py-7 text-base font-sans tracking-wide shadow-2xl"
                >
                  Join Loverball
                </Button>
                <Button
                  onClick={() => scrollTo("features")}
                  size="lg"
                  variant="outline"
                  className="rounded-full border-2 border-white text-white hover:bg-white/10 px-10 py-7 text-base font-sans tracking-wide bg-transparent"
                >
                  How It Works
                </Button>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          THE MOVEMENT — Why Loverball?
         ═══════════════════════════════════════════════ */}
      <section id="about" className="py-24 lg:py-32 bg-background">
        <div className="max-w-6xl mx-auto px-6 lg:px-12">
          <motion.div {...fadeUp} className="text-center mb-16">
            <p className="text-xs font-sans tracking-[0.3em] uppercase text-primary font-bold mb-4">The Movement</p>
            <h2 className="font-display text-4xl sm:text-5xl md:text-6xl text-foreground leading-[0.95]">
              Why <em className="text-primary">Loverball?</em>
            </h2>
          </motion.div>

          {/* Stats */}
          <div className="grid md:grid-cols-2 gap-6 mb-16">
            <motion.div {...fadeUp} className="bg-card border border-border rounded-2xl p-10 text-center hover:shadow-lg transition-shadow">
              <span className="block font-display text-7xl md:text-8xl text-primary leading-none mb-4">72%</span>
              <p className="text-lg font-serif text-foreground/80 mb-2">of women globally identify as avid sports fans</p>
              <p className="text-xs font-sans text-muted-foreground">Source: Nielsen Sports 2024</p>
            </motion.div>
            <motion.div {...fadeUp} className="bg-card border border-border rounded-2xl p-10 text-center hover:shadow-lg transition-shadow">
              <span className="block font-display text-7xl md:text-8xl text-primary leading-none mb-4">85%</span>
              <p className="text-lg font-serif text-foreground/80 mb-2">of household sports purchasing decisions are controlled by women</p>
              <p className="text-xs font-sans text-muted-foreground">Source: ESPN/espnW Research 2024</p>
            </motion.div>
          </div>

          {/* Story */}
          <div className="grid lg:grid-cols-2 gap-12 items-center mb-16">
            <motion.div {...fadeUp}>
              <div className="rounded-2xl overflow-hidden">
                <img src={communityImage} alt="Loverball community member" className="w-full aspect-[4/3] object-cover" />
              </div>
            </motion.div>
            <motion.div {...fadeUp}>
              <p className="text-2xl font-serif text-foreground/50 mb-6 italic">Yet she remains overlooked.</p>
              <h3 className="font-display text-3xl md:text-4xl text-foreground mb-6 leading-tight">
                Loverball is the platform where <strong className="text-primary">female fandom</strong> thrives.
              </h3>
              <p className="text-lg font-serif text-foreground/70 leading-relaxed mb-6">
                We're creating the space for her to gather, share, and celebrate the games she loves. AI-powered stories, community events, and narrative-driven coverage tailored to female fans.
              </p>
              <p className="text-base font-sans font-bold text-foreground mb-8">
                By 2030, women will command 75% of global discretionary spending. The future of sports is female.
              </p>
              <Button onClick={openAuthModal} className="rounded-full px-8 py-6 font-sans text-sm tracking-wide">
                Join Loverball
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          OUR PLATFORM — Built For Her
         ═══════════════════════════════════════════════ */}
      <section id="features" className="py-24 lg:py-32 bg-card">
        <div className="max-w-6xl mx-auto px-6 lg:px-12">
          <motion.div {...fadeUp} className="text-center mb-16">
            <p className="text-xs font-sans tracking-[0.3em] uppercase text-primary font-bold mb-4">Our Platform</p>
            <h2 className="font-display text-4xl sm:text-5xl md:text-6xl text-foreground leading-[0.95]">
              Built For <em className="text-primary">Her</em>
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, i) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: i * 0.15 }}
                  viewport={{ once: true }}
                >
                  <div className="bg-background border border-border rounded-2xl p-8 h-full hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
                    <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
                      <Icon className="w-7 h-7 text-primary" />
                    </div>
                    <h3 className="font-display text-xl text-foreground mb-3 normal-case">{feature.title}</h3>
                    <p className="font-serif text-foreground/60 leading-relaxed mb-6">{feature.description}</p>
                    <button
                      onClick={openAuthModal}
                      className="text-sm font-sans font-semibold text-primary hover:text-primary/80 transition-colors inline-flex items-center gap-1"
                    >
                      Learn More <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          COMMUNITY — Join the movement
         ═══════════════════════════════════════════════ */}
      <section id="community" className="py-24 lg:py-32 bg-background">
        <div className="max-w-6xl mx-auto px-6 lg:px-12">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div {...fadeUp}>
              <p className="text-xs font-sans tracking-[0.3em] uppercase text-primary font-bold mb-4">Community</p>
              <h2 className="font-display text-4xl sm:text-5xl md:text-6xl text-foreground leading-[0.95] mb-6">
                Ready to be part of the <em className="text-primary">movement?</em>
              </h2>
              <p className="text-lg font-serif text-foreground/70 leading-relaxed mb-8">
                Be part of the community redefining women's sports fandom. Your fandom matters here.
              </p>
              <Button onClick={openAuthModal} size="lg" className="rounded-full px-10 py-7 text-base font-sans tracking-wide">
                Join Loverball
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </motion.div>
            <motion.div {...fadeUp}>
              <div className="rounded-2xl overflow-hidden shadow-xl">
                <img src={fansImage} alt="Loverball community at a watch party" className="w-full aspect-[4/3] object-cover" />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          FINAL CTA — Ready to Join?
         ═══════════════════════════════════════════════ */}
      <section className="py-24 lg:py-32 bg-primary">
        <div className="max-w-3xl mx-auto px-6 lg:px-12 text-center">
          <motion.div {...fadeUp}>
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-display text-primary-foreground mb-6 leading-[0.95]">
              Ready to <em>Join?</em>
            </h2>
            <p className="text-lg font-serif text-primary-foreground/75 mb-10 max-w-xl mx-auto leading-relaxed">
              Be part of the movement redefining women's sports fandom.
            </p>
            <Button
              onClick={openAuthModal}
              size="lg"
              className="rounded-full bg-white text-primary hover:bg-white/90 px-10 py-7 text-base font-sans tracking-wide shadow-2xl"
            >
              Join Loverball
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </motion.div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          EMAIL SIGNUP — Stay in the loop
         ═══════════════════════════════════════════════ */}
      <section className="py-20 lg:py-24 bg-card">
        <div className="max-w-xl mx-auto px-6 lg:px-12 text-center">
          <motion.div {...fadeUp}>
            <h3 className="font-display text-3xl md:text-4xl text-foreground mb-4">Stay in the loop</h3>
            <p className="text-base font-serif text-foreground/60 mb-8">
              Get the latest on events, content drops, and community updates.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="email"
                value={newsletterEmail}
                onChange={e => setNewsletterEmail(e.target.value)}
                placeholder="Enter your email"
                className="flex-1 px-5 py-4 rounded-full border border-border bg-background text-foreground placeholder:text-muted-foreground font-sans text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
              <Button onClick={openAuthModal} className="rounded-full px-8 py-4 font-sans text-sm tracking-wide whitespace-nowrap">
                <Mail className="mr-2 h-4 w-4" />
                Subscribe
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="py-16 bg-foreground text-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="grid lg:grid-cols-12 gap-12 items-start mb-12">
            <div className="lg:col-span-4">
              <img src={loverballLogo} alt="Loverball" className="h-14 w-auto brightness-0 invert mb-4" />
              <p className="text-white/50 text-sm leading-relaxed max-w-xs font-serif">
                We're a community platform for women who love sports.
              </p>
            </div>
            <div className="lg:col-span-2 lg:col-start-7">
              <p className="text-white/40 text-xs font-sans font-bold tracking-widest uppercase mb-4">Platform</p>
              <nav className="space-y-3">
                <button onClick={() => scrollTo("about")} className="block text-sm text-white/60 hover:text-white transition-colors font-sans">About</button>
                <button onClick={() => scrollTo("features")} className="block text-sm text-white/60 hover:text-white transition-colors font-sans">Features</button>
                <button onClick={() => scrollTo("community")} className="block text-sm text-white/60 hover:text-white transition-colors font-sans">Community</button>
              </nav>
            </div>
            <div className="lg:col-span-2">
              <p className="text-white/40 text-xs font-sans font-bold tracking-widest uppercase mb-4">Connect</p>
              <nav className="space-y-3">
                <a href="https://www.instagram.com/loverballclub/" target="_blank" rel="noopener noreferrer" className="block text-sm text-white/60 hover:text-white transition-colors font-sans">Instagram</a>
                <a href="https://www.tiktok.com/@loverballclub" target="_blank" rel="noopener noreferrer" className="block text-sm text-white/60 hover:text-white transition-colors font-sans">TikTok</a>
              </nav>
            </div>
            <div className="lg:col-span-2">
              <p className="text-white/40 text-xs font-sans font-bold tracking-widest uppercase mb-4">Legal</p>
              <nav className="space-y-3">
                <a href="/privacy" className="block text-sm text-white/60 hover:text-white transition-colors font-sans">Privacy</a>
                <a href="/terms" className="block text-sm text-white/60 hover:text-white transition-colors font-sans">Terms</a>
                <a href="#" className="block text-sm text-white/60 hover:text-white transition-colors font-sans">Contact</a>
              </nav>
            </div>
          </div>
          <div className="border-t border-white/10 pt-8">
            <p className="text-sm text-white/40 font-sans">© 2026 Loverball. All rights reserved. Built by women, for women.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;

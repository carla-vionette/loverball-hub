import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { motion } from "framer-motion";
import { ArrowRight, Users, Sparkles, Heart, TrendingUp, Lock, Ticket } from "lucide-react";
import heroImage from "@/assets/hero-women-new.jpg";
import loverballLogo from "@/assets/loverball-logo-new.png";
import philosophyImage from "@/assets/philosophy-image.jpg";
import { z } from "zod";

const signUpSchema = z.object({
  email: z.string().trim().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  inviteCode: z.string().trim().min(1, "Invite code is required"),
});

const Index = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();

  const isAuthenticated = !!user;

  // Redirect authenticated users to For You page
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
        // Check if user has a profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .maybeSingle();

        if (profile) {
          navigate("/following");
        } else {
          navigate("/onboarding");
        }

        toast({
          title: "Welcome back!",
          description: "Successfully logged in.",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate inputs
      const validation = signUpSchema.safeParse({ email, password, inviteCode });
      if (!validation.success) {
        throw new Error(validation.error.errors[0].message);
      }

      // First, sign up the user
      const { error, data } = await supabase.auth.signUp({
        email: validation.data.email,
        password: validation.data.password,
        options: {
          emailRedirectTo: `${window.location.origin}/onboarding`,
        },
      });

      if (error) throw error;

      if (data.user) {
        // Validate and use the invite code
        const { data: inviteResult, error: inviteError } = await supabase
          .rpc('validate_and_use_invite', { invite_code: validation.data.inviteCode });

        if (inviteError) {
          await supabase.auth.signOut();
          throw new Error("Invalid invite code. Please check and try again.");
        }

        const result = inviteResult as { success: boolean; error?: string };
        if (!result.success) {
          await supabase.auth.signOut();
          throw new Error(result.error || "Invalid invite code");
        }

        toast({
          title: "Welcome to Loverball!",
          description: "Your invite code has been verified. Let's set up your profile.",
        });
        navigate("/onboarding");
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const scrollToMemberAccess = () => {
    document.getElementById('member-access')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation - Centered Logo */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[hsl(40,33%,96%)] border-b border-border/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20 relative">
            {/* Left nav links */}
            <div className="hidden md:flex items-center gap-8">
              <a href="#about" className="text-xs font-medium tracking-[0.15em] text-foreground/70 hover:text-primary transition-colors uppercase">Home</a>
              <a href="#about" className="text-xs font-medium tracking-[0.15em] text-foreground/70 hover:text-primary transition-colors uppercase">About</a>
              <a href="#features" className="text-xs font-medium tracking-[0.15em] text-foreground/70 hover:text-primary transition-colors uppercase">Features</a>
              <a href="#community" className="text-xs font-medium tracking-[0.15em] text-foreground/70 hover:text-primary transition-colors uppercase">Community</a>
            </div>
            
            {/* Center logo */}
            <img src={loverballLogo} alt="Loverball" className="h-20 w-auto absolute left-1/2 -translate-x-1/2" />
            
            {/* Right nav links */}
            <div className="hidden md:flex items-center gap-8">
              <a href="#" className="text-xs font-medium tracking-[0.15em] text-foreground/70 hover:text-primary transition-colors uppercase">Events</a>
              <a href="#" className="text-xs font-medium tracking-[0.15em] text-foreground/70 hover:text-primary transition-colors uppercase">Shop</a>
              <a href="#" className="text-xs font-medium tracking-[0.15em] text-foreground/70 hover:text-primary transition-colors uppercase">Contact</a>
              {isAuthenticated ? (
                <Button onClick={() => navigate("/following")} size="sm" className="rounded-none text-xs tracking-[0.1em]">
                  Enter
                </Button>
              ) : (
                <Button onClick={scrollToMemberAccess} size="sm" variant="ghost" className="rounded-none text-xs tracking-[0.1em] text-foreground/70 hover:text-primary">
                  Login
                </Button>
              )}
            </div>
            
            {/* Mobile nav button */}
            <div className="md:hidden">
              {isAuthenticated ? (
                <Button onClick={() => navigate("/following")} size="sm" className="rounded-none">
                  Enter
                </Button>
              ) : (
                <Button onClick={scrollToMemberAccess} size="sm" variant="outline" className="rounded-none">
                  <Lock className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section - 3 Column Editorial Layout */}
      <section className="pt-16 min-h-screen relative bg-[hsl(40,33%,96%)]">
        <div className="grid lg:grid-cols-12 min-h-screen">
          {/* Left Content Column */}
          <div className="lg:col-span-4 relative flex flex-col justify-center px-6 sm:px-8 lg:px-16 py-16 lg:py-0 order-2 lg:order-1">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <p className="text-primary text-xs font-medium tracking-[0.2em] mb-8 uppercase">Hey Friend.</p>
              <h1 className="text-4xl sm:text-5xl lg:text-[3.25rem] font-serif font-normal leading-[1.1] mb-8 text-foreground">
                Her Game.<br />
                Her Community.<br />
                Her Platform.
              </h1>
              <p className="text-foreground/60 text-[15px] leading-relaxed mb-10 max-w-[320px]">
                The platform where women's fandom controls the narrative. Stories, community, and culture—powered by passion for the games she loves.
              </p>
              {isAuthenticated ? (
                <Button 
                  onClick={() => navigate("/following")}
                  className="rounded-none bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-5 text-xs tracking-[0.15em] font-medium"
                >
                  ENTER PLATFORM
                </Button>
              ) : (
                <Button 
                  onClick={scrollToMemberAccess}
                  className="rounded-none bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-5 text-xs tracking-[0.15em] font-medium"
                >
                  LEARN MORE
                </Button>
              )}
            </motion.div>
          </div>

          {/* Center Image Column with Accent Bar */}
          <div className="lg:col-span-5 relative h-[60vh] lg:h-auto order-1 lg:order-2 flex">
            {/* Teal/Sage accent bar */}
            <div className="hidden lg:block w-12 bg-[hsl(185,25%,75%)] shrink-0" />
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1 }}
              className="flex-1 relative"
            >
              <img
                src={heroImage}
                alt="Women sports fans celebrating together"
                className="w-full h-full object-cover object-center"
              />
            </motion.div>
          </div>

          {/* Right Navigation Column */}
          <div className="lg:col-span-3 hidden lg:flex flex-col justify-center px-10 bg-[hsl(40,33%,96%)] order-3">
            <motion.nav
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="space-y-5"
            >
              <a href="#about" className="flex items-center justify-between text-sm font-medium text-foreground hover:text-primary transition-colors group py-1">
                <span className="tracking-wide">ABOUT</span>
                <span className="text-foreground/30 group-hover:text-primary transition-colors text-lg">›</span>
              </a>
              <a href="#features" className="flex items-center justify-between text-sm font-medium text-foreground hover:text-primary transition-colors group py-1">
                <span className="tracking-wide">FEATURES</span>
                <span className="text-foreground/30 group-hover:text-primary transition-colors text-lg">›</span>
              </a>
              <a href="#community" className="flex items-center justify-between text-sm font-medium text-foreground hover:text-primary transition-colors group py-1">
                <span className="tracking-wide">COMMUNITY</span>
                <span className="text-foreground/30 group-hover:text-primary transition-colors text-lg">›</span>
              </a>
              <Button 
                onClick={scrollToMemberAccess}
                variant="outline"
                className="rounded-none border border-[hsl(185,25%,75%)] text-foreground hover:bg-[hsl(185,25%,75%)] hover:text-foreground w-full justify-between mt-6 py-5 bg-transparent"
              >
                <span className="text-sm tracking-wide">INQUIRE</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </motion.nav>
          </div>
        </div>
      </section>

      {/* About Section - Clean Editorial Grid */}
      <section id="about" className="py-40 bg-[hsl(40,33%,96%)]">
        <div className="max-w-6xl mx-auto px-6 sm:px-8 lg:px-16">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-start">
            {/* Left Column - Stats with Image */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
            >
              <p className="text-primary text-xs font-medium tracking-[0.2em] mb-10 uppercase">The Movement</p>
              <div className="space-y-12">
                {/* First stat with image beside it */}
                <div className="flex gap-6 items-start">
                  <div className="flex-1">
                    <span className="text-6xl sm:text-7xl font-serif font-light text-foreground tracking-tight">75%</span>
                    <p className="text-foreground/50 text-[15px] mt-4 leading-relaxed max-w-[280px]">of women globally identify as avid sports fans</p>
                  </div>
                  <div className="relative w-32 h-40 shrink-0">
                    <img
                      src={philosophyImage}
                      alt="Loverball community member"
                      className="w-full h-full object-cover object-top"
                    />
                    <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-[hsl(185,25%,75%)] -z-10" />
                  </div>
                </div>
                {/* Second stat */}
                <div>
                  <span className="text-6xl sm:text-7xl font-serif font-light text-foreground tracking-tight">85%</span>
                  <p className="text-foreground/50 text-[15px] mt-4 leading-relaxed max-w-[280px]">of household sports purchasing decisions are controlled by women</p>
                </div>
              </div>
            </motion.div>
            
            {/* Right Column - Text */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              viewport={{ once: true }}
              className="lg:pt-8"
            >
              <h2 className="text-3xl sm:text-4xl font-serif font-normal leading-[1.2] mb-8 text-foreground">
                Yet she remains overlooked.
              </h2>
              <p className="text-foreground/50 text-[15px] leading-[1.8] mb-6">
                Loverball is a content and community platform where female fandom thrives. We're creating the space for her to gather, share, and celebrate the games she loves.
              </p>
              <p className="text-foreground/50 text-[15px] leading-[1.8]">
                By 2030, women will command 75% of global discretionary spending. The future of sports is female.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section - Minimal List */}
      <section id="features" className="py-40 bg-white">
        <div className="max-w-5xl mx-auto px-6 sm:px-8 lg:px-16">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="mb-20"
          >
            <p className="text-primary text-xs font-medium tracking-[0.2em] mb-6 uppercase">Platform</p>
            <h2 className="text-4xl sm:text-5xl font-serif font-normal text-foreground leading-[1.1]">
              Built for Her
            </h2>
          </motion.div>

          <div className="border-t border-foreground/10">
            {[
              {
                number: "01",
                title: "AI-Powered Stories",
                description: "Personalized sports content that speaks to what you care about. Beyond stats—the stories, drama, and culture that make the game matter.",
              },
              {
                number: "02",
                title: "Community Events",
                description: "Watch parties, meetups, and experiences designed for women who love sports. Find your squad. Build your community.",
              },
              {
                number: "03",
                title: "Exclusive Content",
                description: "Behind-the-scenes access, player interviews, and insider perspectives you won't find anywhere else.",
              },
            ].map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="grid lg:grid-cols-12 gap-6 lg:gap-12 py-10 border-b border-foreground/10 group cursor-pointer"
              >
                <div className="lg:col-span-1">
                  <span className="text-xs font-medium text-foreground/30 tracking-wider">{feature.number}</span>
                </div>
                <div className="lg:col-span-4">
                  <h3 className="text-xl font-serif text-foreground group-hover:text-primary transition-colors duration-300">{feature.title}</h3>
                </div>
                <div className="lg:col-span-6">
                  <p className="text-foreground/50 text-[15px] leading-[1.8]">{feature.description}</p>
                </div>
                <div className="lg:col-span-1 flex items-center justify-end">
                  <ArrowRight className="h-4 w-4 text-foreground/20 group-hover:text-primary group-hover:translate-x-1 transition-all duration-300" />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section - Clean Editorial */}
      <section id="community" className="py-32 bg-[hsl(40,33%,96%)]">
        <div className="max-w-5xl mx-auto px-6 sm:px-8 lg:px-16">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
            >
              <p className="text-primary text-xs font-medium tracking-[0.2em] mb-8 uppercase">Join Us</p>
              <h2 className="text-3xl sm:text-4xl font-serif font-normal text-foreground leading-[1.2] mb-6">
                Ready to be part of the movement?
              </h2>
              <p className="text-foreground/50 text-[15px] leading-[1.8] max-w-md">
                Be part of the community redefining women's sports fandom. Your story matters here.
              </p>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              viewport={{ once: true }}
              className="flex lg:justify-end"
            >
              {isAuthenticated ? (
                <Button 
                  onClick={() => navigate("/following")}
                  className="rounded-none bg-primary text-primary-foreground hover:bg-primary/90 px-10 py-5 text-xs tracking-[0.15em] font-medium group"
                >
                  ENTER PLATFORM
                  <ArrowRight className="ml-3 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              ) : (
                <Button 
                  onClick={scrollToMemberAccess}
                  className="rounded-none bg-primary text-primary-foreground hover:bg-primary/90 px-10 py-5 text-xs tracking-[0.15em] font-medium group"
                >
                  GET ACCESS
                  <ArrowRight className="ml-3 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              )}
            </motion.div>
          </div>
        </div>
      </section>

      {/* Member Access Section - Editorial */}
      {!isAuthenticated && (
        <section id="member-access" className="py-32 bg-background border-t border-border">
          <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
            <div className="grid lg:grid-cols-2 gap-16 items-start">
              {/* Left Column - Info */}
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8 }}
                viewport={{ once: true }}
                className="lg:sticky lg:top-32"
              >
                <p className="text-primary text-sm font-medium tracking-widest mb-6 uppercase">Member Access</p>
                <h2 className="text-4xl sm:text-5xl font-serif font-normal text-foreground leading-tight mb-6">
                  Sign in to access the full platform.
                </h2>
                <p className="text-foreground/60 text-sm leading-relaxed max-w-md">
                  Join our community of women who are passionate about sports. Get access to exclusive content, events, and connections.
                </p>
              </motion.div>
              
              {/* Right Column - Form */}
              <motion.div
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                viewport={{ once: true }}
              >
                <div className="bg-pale-pink p-8 sm:p-12">
                  <Tabs defaultValue="login" className="w-full">
                    <TabsList className="grid w-full grid-cols-2 bg-background/50 rounded-none h-12">
                      <TabsTrigger value="login" className="rounded-none data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-sm tracking-wider">
                        SIGN IN
                      </TabsTrigger>
                      <TabsTrigger value="signup" className="rounded-none data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-sm tracking-wider">
                        SIGN UP
                      </TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="login">
                      <form onSubmit={handleLogin} className="space-y-6 mt-8">
                        <div className="space-y-2">
                          <Label htmlFor="login-email" className="text-foreground text-xs tracking-wider uppercase">Email</Label>
                          <Input
                            id="login-email"
                            type="email"
                            placeholder="Enter your email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="bg-background border-border text-foreground placeholder:text-muted-foreground rounded-none h-12"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="login-password" className="text-foreground text-xs tracking-wider uppercase">Password</Label>
                          <Input
                            id="login-password"
                            type="password"
                            placeholder="Enter your password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className="bg-background border-border text-foreground placeholder:text-muted-foreground rounded-none h-12"
                          />
                        </div>
                        <Button 
                          type="submit" 
                          className="w-full rounded-none h-12 text-sm tracking-wider" 
                          disabled={loading}
                        >
                          {loading ? "SIGNING IN..." : "SIGN IN"}
                        </Button>
                      </form>
                    </TabsContent>
                    
                    <TabsContent value="signup">
                      <form onSubmit={handleSignup} className="space-y-6 mt-8">
                        <div className="space-y-2">
                          <Label htmlFor="signup-email" className="text-foreground text-xs tracking-wider uppercase">Email</Label>
                          <Input
                            id="signup-email"
                            type="email"
                            placeholder="Enter your email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="bg-background border-border text-foreground placeholder:text-muted-foreground rounded-none h-12"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="signup-password" className="text-foreground text-xs tracking-wider uppercase">Password</Label>
                          <Input
                            id="signup-password"
                            type="password"
                            placeholder="Create a password (min 6 characters)"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            minLength={6}
                            className="bg-background border-border text-foreground placeholder:text-muted-foreground rounded-none h-12"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="signup-invite" className="text-foreground text-xs tracking-wider uppercase flex items-center gap-2">
                            <Ticket className="w-3 h-3" />
                            Invite Code
                          </Label>
                          <Input
                            id="signup-invite"
                            type="text"
                            placeholder="Enter your invite code"
                            value={inviteCode}
                            onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                            required
                            className="bg-background border-border text-foreground placeholder:text-muted-foreground rounded-none h-12 uppercase tracking-widest"
                          />
                          <p className="text-xs text-foreground/50">
                            Need a code? Request one from an existing member.
                          </p>
                        </div>
                        <Button 
                          type="submit" 
                          className="w-full rounded-none h-12 text-sm tracking-wider" 
                          disabled={loading}
                        >
                          {loading ? "CREATING ACCOUNT..." : "CREATE ACCOUNT"}
                        </Button>
                      </form>
                    </TabsContent>
                  </Tabs>
                </div>
              </motion.div>
            </div>
          </div>
        </section>
      )}

      {/* Footer - Editorial */}
      <footer className="py-20 bg-foreground text-background border-t border-background/10">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
          <div className="grid lg:grid-cols-12 gap-12 items-start mb-16">
            <div className="lg:col-span-4">
              <img src={loverballLogo} alt="Loverball" className="h-10 w-auto brightness-0 invert mb-6" />
              <p className="text-background/50 text-sm leading-relaxed max-w-xs">
                The platform where women's fandom controls the narrative.
              </p>
            </div>
            <div className="lg:col-span-2 lg:col-start-7">
              <p className="text-background/40 text-xs tracking-wider uppercase mb-4">Platform</p>
              <nav className="space-y-3">
                <a href="#about" className="block text-sm text-background/70 hover:text-background transition-colors">About</a>
                <a href="#features" className="block text-sm text-background/70 hover:text-background transition-colors">Features</a>
                <a href="#community" className="block text-sm text-background/70 hover:text-background transition-colors">Community</a>
              </nav>
            </div>
            <div className="lg:col-span-2">
              <p className="text-background/40 text-xs tracking-wider uppercase mb-4">Connect</p>
              <nav className="space-y-3">
                <a href="#" className="block text-sm text-background/70 hover:text-background transition-colors">Instagram</a>
                <a href="#" className="block text-sm text-background/70 hover:text-background transition-colors">Twitter</a>
                <a href="#" className="block text-sm text-background/70 hover:text-background transition-colors">TikTok</a>
              </nav>
            </div>
            <div className="lg:col-span-2">
              <p className="text-background/40 text-xs tracking-wider uppercase mb-4">Legal</p>
              <nav className="space-y-3">
                <a href="#" className="block text-sm text-background/70 hover:text-background transition-colors">Privacy</a>
                <a href="#" className="block text-sm text-background/70 hover:text-background transition-colors">Terms</a>
                <a href="#" className="block text-sm text-background/70 hover:text-background transition-colors">Contact</a>
              </nav>
            </div>
          </div>
          <div className="border-t border-background/10 pt-8">
            <p className="text-xs text-background/40">
              © 2024 Loverball. All rights reserved. Built by women, for women.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;

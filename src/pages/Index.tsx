import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { motion } from "framer-motion";
import { ArrowRight, Lock, Ticket, Users, Sparkles, Calendar } from "lucide-react";
import heroImage from "@/assets/hero-women-new.png";
import loverballLogo from "@/assets/loverball-logo-new.png";
import philosophyImage from "@/assets/philosophy-image.jpg";
import communityImage from "@/assets/landing-community.jpg";
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
  const [showForgotPassword, setShowForgotPassword] = useState(false);
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

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      toast({
        title: "Email required",
        description: "Please enter your email address.",
        variant: "destructive",
      });
      return;
    }
    
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/auth?reset=true`,
      });
      
      if (error) throw error;
      
      toast({
        title: "Check your email",
        description: "We've sent you a password reset link.",
      });
      setShowForgotPassword(false);
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
      const validation = signUpSchema.safeParse({ email, password, inviteCode });
      if (!validation.success) {
        throw new Error(validation.error.errors[0].message);
      }

      const { error, data } = await supabase.auth.signUp({
        email: validation.data.email,
        password: validation.data.password,
        options: {
          emailRedirectTo: `${window.location.origin}/onboarding`,
        },
      });

      if (error) throw error;

      if (data.user) {
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
      {/* Navigation - Pill Style */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border/50">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="flex items-center justify-between h-20">
            {/* Left nav - Pill buttons */}
            <div className="hidden md:flex items-center gap-2">
              <a href="#about" className="px-5 py-2 text-sm font-medium text-foreground/70 hover:text-foreground hover:bg-secondary rounded-full transition-all">
                About
              </a>
              <a href="#features" className="px-5 py-2 text-sm font-medium text-foreground/70 hover:text-foreground hover:bg-secondary rounded-full transition-all">
                Features
              </a>
              <a href="#community" className="px-5 py-2 text-sm font-medium text-foreground/70 hover:text-foreground hover:bg-secondary rounded-full transition-all">
                Community
              </a>
            </div>
            
            {/* Center logo */}
            <img src={loverballLogo} alt="Loverball" className="h-16 w-auto absolute left-1/2 -translate-x-1/2" />
            
            {/* Right nav */}
            <div className="hidden md:flex items-center gap-3">
              <button 
                onClick={() => isAuthenticated ? navigate("/events") : scrollToMemberAccess()} 
                className="px-5 py-2 text-sm font-medium text-foreground/70 hover:text-foreground hover:bg-secondary rounded-full transition-all bg-transparent border-none cursor-pointer"
              >
                Events
              </button>
              <button 
                onClick={() => isAuthenticated ? navigate("/shop") : scrollToMemberAccess()} 
                className="px-5 py-2 text-sm font-medium text-foreground/70 hover:text-foreground hover:bg-secondary rounded-full transition-all bg-transparent border-none cursor-pointer"
              >
                Shop
              </button>
              {isAuthenticated ? (
                <Button onClick={() => navigate("/following")} className="rounded-full bg-primary hover:bg-primary/90 px-6">
                  Enter
                </Button>
              ) : (
                <Button 
                  onClick={scrollToMemberAccess} 
                  className="rounded-full bg-primary hover:bg-primary/90 px-6"
                >
                  <Lock className="h-4 w-4 mr-2" />
                  Member Access
                </Button>
              )}
            </div>
            
            {/* Mobile nav button */}
            <div className="md:hidden">
              <Button onClick={scrollToMemberAccess} size="sm" className="rounded-full">
                <Lock className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section - Overlapping Editorial Layout */}
      <section className="pt-20 min-h-screen relative bg-background">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-0 items-center min-h-[calc(100vh-80px)] py-12">
            
            {/* Left - Large Hero Image */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              className="relative order-1"
            >
              <div className="relative aspect-[4/5] lg:aspect-[3/4] overflow-hidden rounded-2xl shadow-2xl">
                <img
                  src={heroImage}
                  alt="Women sports fans celebrating together"
                  className="w-full h-full object-cover object-[center_25%]"
                />
              </div>
              {/* Overlapping ribbon */}
              <div className="absolute -bottom-4 -right-4 lg:right-auto lg:-left-8 bg-primary text-primary-foreground px-6 py-3 rounded-full shadow-lg">
                <span className="text-sm font-medium tracking-wide">Est. 2024</span>
              </div>
            </motion.div>

            {/* Right - Content Card (Overlapping) */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="relative order-2 lg:-ml-24 z-10"
            >
              <div className="bg-primary text-primary-foreground p-8 sm:p-12 lg:p-14 rounded-2xl shadow-2xl">
                <p className="text-primary-foreground/80 text-sm font-medium tracking-widest mb-6 uppercase">
                  Hey Friend.
                </p>
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-serif font-normal leading-[1.1] mb-6">
                  Her Game.<br />
                  Her Community.<br />
                  <span className="italic">Her Platform.</span>
                </h1>
                <p className="text-primary-foreground/80 text-lg leading-relaxed mb-8 max-w-md">
                  We're a community platform for women who love sports—where stories, connection, and culture meet her passion for the game.
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button 
                    onClick={scrollToMemberAccess}
                    size="lg"
                    className="rounded-full bg-background text-primary hover:bg-background/90 px-8 py-6 text-base font-medium"
                  >
                    Get Started
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                  <Button 
                    variant="outline"
                    size="lg"
                    onClick={() => document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' })}
                    className="rounded-full border-2 border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10 px-8 py-6 text-base font-medium bg-transparent"
                  >
                    Learn More
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Scrolling Ticker */}
      <div className="bg-primary text-primary-foreground py-4 overflow-hidden">
        <motion.div
          animate={{ x: [0, -1000] }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="flex gap-12 whitespace-nowrap"
        >
          {[...Array(10)].map((_, i) => (
            <span key={i} className="flex items-center gap-12 text-sm tracking-widest font-medium">
              <span>WOMEN'S SPORTS ELEVATED</span>
              <span className="text-primary-foreground/60">◆</span>
              <span>JOIN THE MOVEMENT</span>
              <span className="text-primary-foreground/60">◆</span>
            </span>
          ))}
        </motion.div>
      </div>

      {/* About Section - Editorial Grid */}
      <section id="about" className="py-24 lg:py-32 bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          {/* Section Header */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-20"
          >
            <span className="inline-block bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium tracking-wide mb-6">
              The Movement
            </span>
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-serif font-normal text-foreground mb-6">
              Why <span className="italic text-primary">Loverball</span>?
            </h2>
          </motion.div>

          <div className="grid lg:grid-cols-3 gap-12 lg:gap-8 items-start">
            {/* Left Column - Stats with editorial styling */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="space-y-12"
            >
              <div className="bg-secondary/50 p-8 rounded-2xl">
                <span className="text-6xl sm:text-7xl font-serif font-normal text-primary">75%</span>
                <p className="text-foreground/60 text-base mt-4 leading-relaxed">
                  of women globally identify as <span className="text-primary font-medium">avid sports fans</span>
                </p>
              </div>
              <div className="bg-secondary/50 p-8 rounded-2xl">
                <span className="text-6xl sm:text-7xl font-serif font-normal text-primary">85%</span>
                <p className="text-foreground/60 text-base mt-4 leading-relaxed">
                  of household sports purchasing decisions are <span className="text-primary font-medium">controlled by women</span>
                </p>
              </div>
            </motion.div>
            
            {/* Center Column - Portrait Image */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.1 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="aspect-[3/4] overflow-hidden rounded-2xl shadow-xl">
                <img
                  src={philosophyImage}
                  alt="Loverball community member"
                  className="w-full h-full object-cover object-top"
                />
              </div>
              {/* Overlapping annotation */}
              <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-6 py-3 rounded-full shadow-lg whitespace-nowrap">
                <span className="text-sm font-medium">Yet she remains overlooked.</span>
              </div>
            </motion.div>
            
            {/* Right Column - Text content */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              viewport={{ once: true }}
              className="lg:pt-8"
            >
              <h3 className="text-2xl sm:text-3xl font-serif font-normal leading-snug mb-6 text-foreground">
                Loverball is the platform where <span className="text-primary italic">female fandom</span> thrives.
              </h3>
              <p className="text-foreground/60 text-base leading-relaxed mb-6">
                We're creating the space for her to gather, share, and celebrate the games she loves. AI-powered stories, community events, and narrative-driven coverage tailored to female fans.
              </p>
              <p className="text-foreground/60 text-base leading-relaxed mb-8">
                By 2030, women will command <span className="text-primary font-semibold">75% of global discretionary spending</span>. The future of sports is female.
              </p>
              <Button 
                onClick={scrollToMemberAccess}
                className="rounded-full bg-primary hover:bg-primary/90 px-8"
              >
                Join the Movement
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section - Clean Cards */}
      <section id="features" className="py-24 lg:py-32 bg-background">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <span className="inline-block bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium tracking-wide mb-6">
              Our Services
            </span>
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-serif font-normal text-foreground">
              Built <span className="italic">For Her</span>
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
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
            ].map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="group"
              >
                <div className="bg-white p-8 rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.06)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.1)] transition-all duration-300 h-full border border-border/50">
                  <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-300">
                    <feature.icon className="h-7 w-7 text-primary group-hover:text-primary-foreground transition-colors duration-300" />
                  </div>
                  <h3 className="text-xl font-serif text-foreground mb-4 group-hover:text-primary transition-colors duration-300">
                    {feature.title}
                  </h3>
                  <p className="text-foreground/60 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Community Section - Image + Text Overlap */}
      <section id="community" className="py-24 lg:py-32 bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-0 items-center">
            {/* Content Block */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="lg:pr-12 order-2 lg:order-1"
            >
              <span className="inline-block bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium tracking-wide mb-6">
                Join Us
              </span>
              <h2 className="text-4xl sm:text-5xl font-serif font-normal text-foreground leading-tight mb-6">
                Ready to be part of the <span className="text-primary italic">movement</span>?
              </h2>
              <p className="text-foreground/60 text-lg leading-relaxed mb-8 max-w-lg">
                Be part of the community redefining women's sports fandom. Your fandom matters here.
              </p>
              
              {/* Stats row */}
              <div className="grid grid-cols-3 gap-6 mb-10">
                {[
                  { value: "10K+", label: "Members" },
                  { value: "500+", label: "Stories" },
                  { value: "50+", label: "Events" },
                ].map((stat) => (
                  <div key={stat.label} className="text-center">
                    <p className="text-3xl sm:text-4xl font-serif text-primary mb-1">{stat.value}</p>
                    <p className="text-sm text-foreground/50">{stat.label}</p>
                  </div>
                ))}
              </div>

              <Button 
                onClick={scrollToMemberAccess}
                size="lg"
                className="rounded-full bg-primary hover:bg-primary/90 px-10 py-6 text-base font-medium"
              >
                Get Access
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </motion.div>

            {/* Image with overlap effect */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              viewport={{ once: true }}
              className="relative order-1 lg:order-2"
            >
              <div className="aspect-[4/3] overflow-hidden rounded-2xl shadow-xl lg:-ml-12">
                <img
                  src={communityImage}
                  alt="Loverball community"
                  className="w-full h-full object-cover"
                />
              </div>
              {/* Overlapping color block */}
              <div className="hidden lg:block absolute -bottom-8 -left-8 w-32 h-32 bg-primary/20 rounded-2xl -z-10" />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Member Access Section */}
      {!isAuthenticated && (
        <section id="member-access" className="py-24 lg:py-32 bg-background">
          <div className="max-w-7xl mx-auto px-6 lg:px-12">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              {/* Left Column - Info */}
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8 }}
                viewport={{ once: true }}
              >
                <span className="inline-block bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium tracking-wide mb-6">
                  Member Access
                </span>
                <h2 className="text-4xl sm:text-5xl font-serif font-normal text-foreground leading-tight mb-6">
                  Sign in to access the <span className="text-primary italic">full platform</span>.
                </h2>
                <p className="text-foreground/60 text-lg leading-relaxed max-w-md">
                  Join our community of women who are passionate about sports. Get access to exclusive content, events, and connections.
                </p>
              </motion.div>
              
              {/* Right Column - Form Card */}
              <motion.div
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                viewport={{ once: true }}
              >
                <div className="bg-white p-8 sm:p-10 rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.08)] border border-border/50">
                  <Tabs defaultValue="login" className="w-full">
                    <TabsList className="grid w-full grid-cols-2 bg-secondary/50 rounded-full p-1 h-14">
                      <TabsTrigger value="login" className="rounded-full data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-sm font-medium">
                        Sign In
                      </TabsTrigger>
                      <TabsTrigger value="signup" className="rounded-full data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-sm font-medium">
                        Sign Up
                      </TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="login">
                      {showForgotPassword ? (
                        <form onSubmit={handleForgotPassword} className="space-y-6 mt-8">
                          <div className="space-y-2">
                            <Label htmlFor="reset-email" className="text-foreground text-sm font-medium">Email</Label>
                            <Input
                              id="reset-email"
                              type="email"
                              placeholder="Enter your email"
                              value={email}
                              onChange={(e) => setEmail(e.target.value)}
                              required
                              className="bg-background border-border text-foreground rounded-xl h-12"
                            />
                          </div>
                          <p className="text-foreground/50 text-sm">
                            We'll send you a link to reset your password.
                          </p>
                          <Button 
                            type="submit" 
                            className="w-full rounded-full h-12 text-sm font-medium" 
                            disabled={loading}
                          >
                            {loading ? "Sending..." : "Send Reset Link"}
                          </Button>
                          <button
                            type="button"
                            onClick={() => setShowForgotPassword(false)}
                            className="w-full text-sm text-primary hover:text-primary/80 transition-colors font-medium"
                          >
                            Back to sign in
                          </button>
                        </form>
                      ) : (
                        <form onSubmit={handleLogin} className="space-y-6 mt-8">
                          <div className="space-y-2">
                            <Label htmlFor="login-email" className="text-foreground text-sm font-medium">Email</Label>
                            <Input
                              id="login-email"
                              type="email"
                              placeholder="Enter your email"
                              value={email}
                              onChange={(e) => setEmail(e.target.value)}
                              required
                              className="bg-background border-border text-foreground rounded-xl h-12"
                            />
                          </div>
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <Label htmlFor="login-password" className="text-foreground text-sm font-medium">Password</Label>
                              <button
                                type="button"
                                onClick={() => setShowForgotPassword(true)}
                                className="text-sm text-primary hover:text-primary/80 transition-colors"
                              >
                                Forgot password?
                              </button>
                            </div>
                            <Input
                              id="login-password"
                              type="password"
                              placeholder="Enter your password"
                              value={password}
                              onChange={(e) => setPassword(e.target.value)}
                              required
                              className="bg-background border-border text-foreground rounded-xl h-12"
                            />
                          </div>
                          <Button 
                            type="submit" 
                            className="w-full rounded-full h-12 text-sm font-medium" 
                            disabled={loading}
                          >
                            {loading ? "Signing in..." : "Sign In"}
                          </Button>
                        </form>
                      )}
                    </TabsContent>
                    
                    <TabsContent value="signup">
                      <form onSubmit={handleSignup} className="space-y-6 mt-8">
                        <div className="space-y-2">
                          <Label htmlFor="signup-email" className="text-foreground text-sm font-medium">Email</Label>
                          <Input
                            id="signup-email"
                            type="email"
                            placeholder="Enter your email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="bg-background border-border text-foreground rounded-xl h-12"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="signup-password" className="text-foreground text-sm font-medium">Password</Label>
                          <Input
                            id="signup-password"
                            type="password"
                            placeholder="Create a password (min 6 characters)"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            minLength={6}
                            className="bg-background border-border text-foreground rounded-xl h-12"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="signup-invite" className="text-foreground text-sm font-medium flex items-center gap-2">
                            <Ticket className="w-4 h-4" />
                            Invite Code
                          </Label>
                          <Input
                            id="signup-invite"
                            type="text"
                            placeholder="Enter your invite code"
                            value={inviteCode}
                            onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                            required
                            className="bg-background border-border text-foreground rounded-xl h-12 uppercase tracking-widest"
                          />
                          <p className="text-xs text-foreground/50">
                            Need a code? Request one from an existing member.
                          </p>
                        </div>
                        <Button 
                          type="submit" 
                          className="w-full rounded-full h-12 text-sm font-medium" 
                          disabled={loading}
                        >
                          {loading ? "Creating account..." : "Create Account"}
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

      {/* Final CTA Banner */}
      <section className="py-20 bg-primary">
        <div className="max-w-4xl mx-auto px-6 lg:px-12 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-serif text-primary-foreground mb-6">
              Ready to <span className="italic">Join</span>?
            </h2>
            <p className="text-xl text-primary-foreground/80 mb-10 max-w-2xl mx-auto">
              Be part of the movement redefining women's sports fandom.
            </p>
            <Button 
              size="lg"
              onClick={scrollToMemberAccess}
              className="rounded-full text-lg px-10 py-7 bg-background text-primary hover:bg-background/90 font-medium shadow-xl"
            >
              Get Started Now
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-16 bg-foreground text-background">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="grid lg:grid-cols-12 gap-12 items-start mb-12">
            <div className="lg:col-span-4">
              <img src={loverballLogo} alt="Loverball" className="h-16 w-auto brightness-0 invert mb-4" />
              <p className="text-background/50 text-sm leading-relaxed max-w-xs">
                We're a community platform for women who love sports.
              </p>
            </div>
            <div className="lg:col-span-2 lg:col-start-7">
              <p className="text-background/40 text-sm font-medium tracking-wide uppercase mb-4">Platform</p>
              <nav className="space-y-3">
                <a href="#about" className="block text-sm text-background/70 hover:text-background transition-colors">About</a>
                <a href="#features" className="block text-sm text-background/70 hover:text-background transition-colors">Features</a>
                <a href="#community" className="block text-sm text-background/70 hover:text-background transition-colors">Community</a>
              </nav>
            </div>
            <div className="lg:col-span-2">
              <p className="text-background/40 text-sm font-medium tracking-wide uppercase mb-4">Connect</p>
              <nav className="space-y-3">
                <a href="https://www.instagram.com/loverballclub/" target="_blank" rel="noopener noreferrer" className="block text-sm text-background/70 hover:text-background transition-colors">Instagram</a>
                <a href="https://www.tiktok.com/@loverballclub" target="_blank" rel="noopener noreferrer" className="block text-sm text-background/70 hover:text-background transition-colors">TikTok</a>
              </nav>
            </div>
            <div className="lg:col-span-2">
              <p className="text-background/40 text-sm font-medium tracking-wide uppercase mb-4">Legal</p>
              <nav className="space-y-3">
                <a href="/privacy" className="block text-sm text-background/70 hover:text-background transition-colors">Privacy</a>
                <a href="/terms" className="block text-sm text-background/70 hover:text-background transition-colors">Terms</a>
                <a href="#" className="block text-sm text-background/70 hover:text-background transition-colors">Contact</a>
              </nav>
            </div>
          </div>
          <div className="border-t border-background/10 pt-8">
            <p className="text-sm text-background/40">
              © 2025 Loverball. All rights reserved. Built by women, for women.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;

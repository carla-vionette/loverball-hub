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
import { ArrowRight, Users, Sparkles, Heart, TrendingUp, Lock } from "lucide-react";
import heroImage from "@/assets/landing-fans.jpg";
import loverballLogo from "@/assets/loverball-logo-new.png";
import philosophyImage from "@/assets/philosophy-image.jpg";

const ALLOWED_EMAIL = "member@loverball.com";

const Index = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();

  const isAuthenticated = user && user.email?.toLowerCase() === ALLOWED_EMAIL;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (email.toLowerCase() !== ALLOWED_EMAIL) {
      toast({
        title: "Access Denied",
        description: "This email is not authorized to access the site.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      toast({
        title: "Welcome!",
        description: "Successfully logged in.",
      });
      navigate("/following");
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
    
    if (email.toLowerCase() !== ALLOWED_EMAIL) {
      toast({
        title: "Access Denied",
        description: "This email is not authorized to sign up.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
        },
      });

      if (error) throw error;

      toast({
        title: "Account Created!",
        description: "You can now sign in with your credentials.",
      });
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
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/90 backdrop-blur-sm border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Left nav links */}
            <div className="hidden md:flex items-center gap-6">
              <a href="#about" className="text-xs font-medium tracking-wider text-foreground/70 hover:text-primary transition-colors uppercase">About</a>
              <a href="#features" className="text-xs font-medium tracking-wider text-foreground/70 hover:text-primary transition-colors uppercase">Features</a>
              <a href="#community" className="text-xs font-medium tracking-wider text-foreground/70 hover:text-primary transition-colors uppercase">Community</a>
            </div>
            
            {/* Center logo */}
            <img src={loverballLogo} alt="Loverball" className="h-10 w-auto absolute left-1/2 -translate-x-1/2" />
            
            {/* Right nav links */}
            <div className="hidden md:flex items-center gap-6">
              <a href="#" className="text-xs font-medium tracking-wider text-foreground/70 hover:text-primary transition-colors uppercase">Events</a>
              <a href="#" className="text-xs font-medium tracking-wider text-foreground/70 hover:text-primary transition-colors uppercase">Shop</a>
              {isAuthenticated ? (
                <Button onClick={() => navigate("/following")} size="sm" className="rounded-none">
                  Enter Platform
                </Button>
              ) : (
                <Button onClick={scrollToMemberAccess} size="sm" variant="outline" className="rounded-none">
                  <Lock className="h-4 w-4 mr-2" />
                  Member Access
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
      <section className="pt-16 min-h-screen relative bg-background">
        <div className="grid lg:grid-cols-12 min-h-screen">
          {/* Left Content Column */}
          <div className="lg:col-span-4 relative flex flex-col justify-center px-6 sm:px-8 lg:px-12 py-16 lg:py-0 order-2 lg:order-1">
            {/* Accent color bar */}
            <div className="absolute left-0 top-0 bottom-0 w-4 sm:w-8 bg-pale-pink hidden lg:block" />
            
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="lg:pl-8"
            >
              <p className="text-primary text-sm font-medium tracking-widest mb-6 uppercase">Hey Friend.</p>
              <h1 className="text-4xl sm:text-5xl lg:text-5xl font-serif font-normal leading-tight mb-6 text-foreground">
                Her Game.<br />
                Her Community.<br />
                Her Platform.
              </h1>
              <p className="text-foreground/70 text-sm leading-relaxed mb-8 max-w-sm">
                The platform where women's fandom controls the narrative. Stories, community, and culture—powered by passion for the games she loves.
              </p>
              {isAuthenticated ? (
                <Button 
                  onClick={() => navigate("/following")}
                  className="rounded-none bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-6 text-sm tracking-wider"
                >
                  ENTER PLATFORM
                </Button>
              ) : (
                <Button 
                  onClick={scrollToMemberAccess}
                  className="rounded-none bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-6 text-sm tracking-wider"
                >
                  LEARN MORE
                </Button>
              )}
            </motion.div>
          </div>

          {/* Center Image Column */}
          <div className="lg:col-span-5 relative h-[60vh] lg:h-auto order-1 lg:order-2">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1 }}
              className="absolute inset-0"
            >
              <img
                src={heroImage}
                alt="Women sports fans celebrating together"
                className="w-full h-full object-cover object-top"
              />
            </motion.div>
          </div>

          {/* Right Navigation Column */}
          <div className="lg:col-span-3 hidden lg:flex flex-col justify-center px-8 bg-background order-3">
            <motion.nav
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="space-y-6"
            >
              <a href="#about" className="flex items-center justify-between text-sm font-medium text-foreground hover:text-primary transition-colors group">
                <span>ABOUT</span>
                <span className="text-foreground/30 group-hover:text-primary transition-colors">›</span>
              </a>
              <a href="#features" className="flex items-center justify-between text-sm font-medium text-foreground hover:text-primary transition-colors group">
                <span>FEATURES</span>
                <span className="text-foreground/30 group-hover:text-primary transition-colors">›</span>
              </a>
              <a href="#community" className="flex items-center justify-between text-sm font-medium text-foreground hover:text-primary transition-colors group">
                <span>COMMUNITY</span>
                <span className="text-foreground/30 group-hover:text-primary transition-colors">›</span>
              </a>
              <Button 
                onClick={scrollToMemberAccess}
                variant="outline"
                className="rounded-none border border-primary text-primary hover:bg-primary hover:text-primary-foreground w-full justify-between mt-4 py-5"
              >
                <span>INQUIRE</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </motion.nav>
          </div>
        </div>
      </section>

      {/* About Section - Editorial Grid */}
      <section id="about" className="py-32 bg-background border-t border-border">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
          <div className="grid lg:grid-cols-12 gap-16 items-center">
            {/* Left Column - Stats */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="lg:col-span-4"
            >
              <p className="text-primary text-sm font-medium tracking-widest mb-8 uppercase">The Movement</p>
              <div className="space-y-12">
                <div>
                  <span className="text-6xl sm:text-7xl font-serif text-foreground">75%</span>
                  <p className="text-foreground/60 text-sm mt-2 max-w-xs">of women globally identify as avid sports fans</p>
                </div>
                <div>
                  <span className="text-6xl sm:text-7xl font-serif text-foreground">85%</span>
                  <p className="text-foreground/60 text-sm mt-2 max-w-xs">of household sports purchasing decisions are controlled by women</p>
                </div>
              </div>
            </motion.div>
            
            {/* Center Column - Image */}
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.1 }}
              viewport={{ once: true }}
              className="lg:col-span-4 relative"
            >
              <div className="aspect-[3/4] overflow-hidden">
                <img
                  src={philosophyImage}
                  alt="Loverball community member"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-pale-pink -z-10" />
            </motion.div>
            
            {/* Right Column - Text */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              viewport={{ once: true }}
              className="lg:col-span-4"
            >
              <h2 className="text-3xl sm:text-4xl font-serif font-normal leading-tight mb-6 text-foreground">
                Yet she remains overlooked.
              </h2>
              <p className="text-foreground/60 text-sm leading-relaxed mb-6">
                Loverball is a content and community platform where female fandom thrives. We're creating the space for her to gather, share, and celebrate the games she loves.
              </p>
              <p className="text-foreground/60 text-sm leading-relaxed">
                By 2030, women will command 75% of global discretionary spending. The future of sports is female.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section - Editorial Stacked */}
      <section id="features" className="py-32 bg-pale-pink border-t border-primary/10">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="mb-20"
          >
            <p className="text-primary text-sm font-medium tracking-widest mb-4 uppercase">Platform</p>
            <h2 className="text-4xl sm:text-5xl font-serif font-normal text-foreground">
              Built for Her
            </h2>
          </motion.div>

          <div className="space-y-0">
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
                className="grid lg:grid-cols-12 gap-8 py-12 border-t border-foreground/10 group hover:bg-background/50 transition-colors px-6 -mx-6"
              >
                <div className="lg:col-span-1">
                  <span className="text-sm font-medium text-foreground/40">{feature.number}</span>
                </div>
                <div className="lg:col-span-4">
                  <h3 className="text-2xl font-serif text-foreground group-hover:text-primary transition-colors">{feature.title}</h3>
                </div>
                <div className="lg:col-span-6">
                  <p className="text-foreground/60 text-sm leading-relaxed">{feature.description}</p>
                </div>
                <div className="lg:col-span-1 flex items-center justify-end">
                  <ArrowRight className="h-5 w-5 text-foreground/20 group-hover:text-primary group-hover:translate-x-1 transition-all" />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section - Editorial Split */}
      <section id="community" className="py-32 bg-primary border-t border-primary-foreground/10">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
            >
              <p className="text-primary-foreground/60 text-sm font-medium tracking-widest mb-6 uppercase">Join Us</p>
              <h2 className="text-4xl sm:text-5xl font-serif font-normal text-primary-foreground leading-tight mb-6">
                Ready to be part of the movement?
              </h2>
              <p className="text-primary-foreground/70 text-sm leading-relaxed max-w-md">
                Be part of the community redefining women's sports fandom. Your story matters here.
              </p>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              viewport={{ once: true }}
              className="flex lg:justify-end"
            >
              {isAuthenticated ? (
                <Button 
                  onClick={() => navigate("/following")}
                  className="rounded-none bg-background text-primary hover:bg-background/90 px-12 py-6 text-sm tracking-wider font-medium group"
                >
                  ENTER PLATFORM
                  <ArrowRight className="ml-3 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              ) : (
                <Button 
                  onClick={scrollToMemberAccess}
                  className="rounded-none bg-background text-primary hover:bg-background/90 px-12 py-6 text-sm tracking-wider font-medium group"
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

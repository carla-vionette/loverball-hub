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
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/90 backdrop-blur-sm border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <img src={loverballLogo} alt="Loverball" className="h-10 w-auto" />
            <div className="hidden md:flex items-center gap-8">
              <a href="#about" className="text-sm font-medium text-foreground/70 hover:text-primary transition-colors">About</a>
              <a href="#features" className="text-sm font-medium text-foreground/70 hover:text-primary transition-colors">Features</a>
              <a href="#community" className="text-sm font-medium text-foreground/70 hover:text-primary transition-colors">Community</a>
              {isAuthenticated ? (
                <Button onClick={() => navigate("/following")} size="sm">
                  Enter Platform
                </Button>
              ) : (
                <Button onClick={scrollToMemberAccess} size="sm" variant="outline">
                  <Lock className="h-4 w-4 mr-2" />
                  Member Access
                </Button>
              )}
            </div>
            {/* Mobile nav button */}
            <div className="md:hidden">
              {isAuthenticated ? (
                <Button onClick={() => navigate("/following")} size="sm">
                  Enter
                </Button>
              ) : (
                <Button onClick={scrollToMemberAccess} size="sm" variant="outline">
                  <Lock className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-16 min-h-screen relative overflow-hidden">
        <div className="grid lg:grid-cols-2 min-h-screen">
          {/* Image Side */}
          <div className="relative h-[50vh] lg:h-auto order-2 lg:order-1">
            <motion.div
              initial={{ scale: 1.1, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 1.2, ease: "easeOut" }}
              className="absolute inset-0"
            >
              <img
                src={heroImage}
                alt="Women sports fans celebrating together"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-transparent to-background/30 lg:hidden" />
            </motion.div>
          </div>

          {/* Text Side */}
          <div className="relative flex items-center justify-center p-8 lg:p-16 order-1 lg:order-2 bg-pale-pink">
            <div className="max-w-xl">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.3 }}
              >
                <h1 className="text-6xl sm:text-7xl lg:text-8xl font-black text-primary tracking-tight leading-none mb-6">
                  Loverball.
                </h1>
              </motion.div>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.5 }}
                className="text-xl sm:text-2xl font-semibold text-foreground mb-4"
              >
                Women Sports Fans. Elevated.
              </motion.p>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.6 }}
                className="text-base sm:text-lg text-foreground/70 mb-8"
              >
                The platform where female fandom gets the spotlight. Stories, community, and culture—built by women, for women.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.7 }}
                className="flex flex-col sm:flex-row gap-4"
              >
                {isAuthenticated ? (
                  <Button 
                    size="lg" 
                    onClick={() => navigate("/following")}
                    className="text-lg px-8 py-6 rounded-full group"
                  >
                    Enter Platform
                    <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </Button>
                ) : (
                  <Button 
                    size="lg" 
                    onClick={scrollToMemberAccess}
                    className="text-lg px-8 py-6 rounded-full group"
                  >
                    Join the Movement
                    <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </Button>
                )}
                <Button 
                  variant="outline" 
                  size="lg"
                  onClick={() => document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' })}
                  className="text-lg px-8 py-6 rounded-full border-2 border-primary text-primary hover:bg-primary hover:text-primary-foreground"
                >
                  Learn More
                </Button>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* What is Loverball Section */}
      <section id="about" className="py-24 px-4 sm:px-6 lg:px-8 bg-background">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <span className="inline-block px-4 py-2 bg-pale-pink text-primary font-semibold text-sm rounded-full mb-6">
              Our Philosophy
            </span>
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black text-foreground leading-tight max-w-4xl mx-auto">
              <span className="text-primary">85%</span> of household purchasing decisions made by women.{" "}
              <span className="italic font-serif">Yet we're overlooked in sports.</span>
            </h2>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            viewport={{ once: true }}
            className="grid md:grid-cols-2 gap-12 items-center"
          >
            <div className="bg-primary rounded-3xl p-8 sm:p-12 text-primary-foreground">
              <p className="text-xl sm:text-2xl leading-relaxed mb-6">
                Loverball is a content and community platform for the <strong>$28B women's sports market</strong>. 
                AI-powered stories, community events, and narrative-driven coverage tailored to female fans.
              </p>
              <p className="text-lg opacity-90">
                We're redefining how women experience sports—not as spectators, but as the heart of the culture.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-6">
              {[
                { icon: Users, label: "Community", value: "10K+" },
                { icon: Sparkles, label: "Stories", value: "500+" },
                { icon: Heart, label: "Events", value: "50+" },
                { icon: TrendingUp, label: "Growth", value: "300%" },
              ].map((stat, index) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="bg-pale-pink rounded-2xl p-6 text-center hover:shadow-lg transition-shadow"
                >
                  <stat.icon className="h-8 w-8 text-primary mx-auto mb-3" />
                  <p className="text-3xl font-black text-primary">{stat.value}</p>
                  <p className="text-sm text-foreground/70 font-medium">{stat.label}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 px-4 sm:px-6 lg:px-8 bg-pale-pink">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <span className="inline-block px-4 py-2 bg-background text-primary font-semibold text-sm rounded-full mb-6">
              What We Offer
            </span>
            <h2 className="text-4xl sm:text-5xl font-black text-foreground">
              Built for <span className="italic font-serif">Her</span>
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                title: "AI-Powered Stories",
                description: "Personalized sports content that speaks to what you care about. Beyond stats—the stories, drama, and culture.",
                image: "📚",
              },
              {
                title: "Community Events",
                description: "Watch parties, meetups, and experiences designed for women who love sports. Find your squad.",
                image: "🎉",
              },
              {
                title: "Exclusive Content",
                description: "Behind-the-scenes access, player interviews, and insider perspectives you won't find anywhere else.",
                image: "✨",
              },
            ].map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.15 }}
                viewport={{ once: true }}
                className="bg-background rounded-3xl p-8 hover:shadow-xl transition-all hover:-translate-y-2"
              >
                <span className="text-5xl mb-6 block">{feature.image}</span>
                <h3 className="text-2xl font-bold text-foreground mb-4">{feature.title}</h3>
                <p className="text-foreground/70 leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section id="community" className="py-24 px-4 sm:px-6 lg:px-8 bg-primary">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black text-primary-foreground mb-6">
              Ready to Join?
            </h2>
            <p className="text-xl text-primary-foreground/90 mb-10 max-w-2xl mx-auto">
              Be part of the movement redefining women's sports fandom. Your story matters here.
            </p>
            {isAuthenticated ? (
              <Button 
                size="lg"
                onClick={() => navigate("/following")}
                className="text-lg px-10 py-7 rounded-full bg-background text-primary hover:bg-background/90 font-bold group"
              >
                Explore Now
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            ) : (
              <Button 
                size="lg"
                onClick={scrollToMemberAccess}
                className="text-lg px-10 py-7 rounded-full bg-background text-primary hover:bg-background/90 font-bold group"
              >
                Get Access
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            )}
          </motion.div>
        </div>
      </section>

      {/* Member Access Section */}
      {!isAuthenticated && (
        <section id="member-access" className="py-24 px-4 sm:px-6 lg:px-8 bg-background">
          <div className="max-w-md mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
            >
              <Card className="bg-pale-pink border-none shadow-2xl">
                <CardHeader className="text-center space-y-4 pb-2">
                  <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto">
                    <Lock className="h-8 w-8 text-primary-foreground" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-primary">
                      Member Access
                    </h2>
                    <p className="text-sm text-foreground/70 mt-1">
                      Sign in to access the full platform
                    </p>
                  </div>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="login" className="w-full">
                    <TabsList className="grid w-full grid-cols-2 bg-background/50">
                      <TabsTrigger value="login" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-semibold">
                        Sign In
                      </TabsTrigger>
                      <TabsTrigger value="signup" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-semibold">
                        Sign Up
                      </TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="login">
                      <form onSubmit={handleLogin} className="space-y-4 mt-4">
                        <div className="space-y-2">
                          <Label htmlFor="login-email" className="text-foreground font-medium">Email</Label>
                          <Input
                            id="login-email"
                            type="email"
                            placeholder="Enter your email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="bg-background border-border text-foreground placeholder:text-muted-foreground"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="login-password" className="text-foreground font-medium">Password</Label>
                          <Input
                            id="login-password"
                            type="password"
                            placeholder="Enter your password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className="bg-background border-border text-foreground placeholder:text-muted-foreground"
                          />
                        </div>
                        <Button 
                          type="submit" 
                          className="w-full font-bold rounded-full" 
                          disabled={loading}
                        >
                          {loading ? "Signing in..." : "Sign In"}
                        </Button>
                      </form>
                    </TabsContent>
                    
                    <TabsContent value="signup">
                      <form onSubmit={handleSignup} className="space-y-4 mt-4">
                        <div className="space-y-2">
                          <Label htmlFor="signup-email" className="text-foreground font-medium">Email</Label>
                          <Input
                            id="signup-email"
                            type="email"
                            placeholder="Enter your email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="bg-background border-border text-foreground placeholder:text-muted-foreground"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="signup-password" className="text-foreground font-medium">Password</Label>
                          <Input
                            id="signup-password"
                            type="password"
                            placeholder="Create a password (min 6 characters)"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            minLength={6}
                            className="bg-background border-border text-foreground placeholder:text-muted-foreground"
                          />
                        </div>
                        <Button 
                          type="submit" 
                          className="w-full font-bold rounded-full" 
                          disabled={loading}
                        >
                          {loading ? "Creating account..." : "Create Account"}
                        </Button>
                      </form>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="py-12 px-4 sm:px-6 lg:px-8 bg-foreground text-background">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <img src={loverballLogo} alt="Loverball" className="h-10 w-auto brightness-0 invert" />
            <p className="text-sm text-background/70">
              © 2024 Loverball. All rights reserved. Built by women, for women.
            </p>
            <div className="flex gap-6">
              <a href="#" className="text-sm text-background/70 hover:text-background transition-colors">Privacy</a>
              <a href="#" className="text-sm text-background/70 hover:text-background transition-colors">Terms</a>
              <a href="#" className="text-sm text-background/70 hover:text-background transition-colors">Contact</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;

import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { motion } from "framer-motion";
import { ArrowRight, Lock, Ticket, Menu, X, Check } from "lucide-react";
import heroImage from "@/assets/editorial-hero.avif";
import founderImage from "@/assets/editorial-founder.avif";
import loverballLogo from "@/assets/loverball-logo-new.png";
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
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

  const scrollToSection = (id: string) => {
    setMobileMenuOpen(false);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  const services = [
    {
      title: "Social Media Strategy & Management",
      description: "Elevate your presence with tailored content strategies that resonate with women sports fans.",
      includes: ["Content calendar development", "Platform-specific strategies", "Community engagement", "Performance analytics"],
      perfectFor: "Brands and organizations looking to authentically connect with the women's sports community.",
      investment: "Starting at $2,500/month",
    },
    {
      title: "Content Creation & Storytelling",
      description: "Compelling narratives that capture the passion, culture, and community of women's sports.",
      includes: ["Brand storytelling", "Video production", "Editorial content", "Athlete spotlights"],
      perfectFor: "Teams, leagues, and sponsors seeking to tell authentic stories that resonate.",
      investment: "Starting at $3,000/project",
    },
    {
      title: "Event & Game-Day Activations",
      description: "Unforgettable experiences that bring women sports fans together.",
      includes: ["Watch parties", "Fan experiences", "Influencer activations", "Brand partnerships"],
      perfectFor: "Organizations looking to create memorable moments and build community.",
      investment: "Starting at $5,000/event",
    },
    {
      title: "Brand Partnerships & Sponsorship Strategy",
      description: "Strategic partnerships that drive authentic engagement and measurable results.",
      includes: ["Partnership development", "Sponsorship strategy", "ROI measurement", "Activation planning"],
      perfectFor: "Brands seeking to meaningfully invest in the women's sports ecosystem.",
      investment: "Custom pricing",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation - Sticky Editorial */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <Link to="/">
              <img src={loverballLogo} alt="Loverball" className="h-16 w-auto" />
            </Link>
            
            {/* Desktop Nav */}
            <div className="hidden lg:flex items-center gap-12">
              <button onClick={() => scrollToSection('about')} className="text-xs font-medium tracking-[0.2em] text-foreground/70 hover:text-primary transition-colors uppercase">
                About
              </button>
              <button onClick={() => scrollToSection('services')} className="text-xs font-medium tracking-[0.2em] text-foreground/70 hover:text-primary transition-colors uppercase">
                Services
              </button>
              <button onClick={() => scrollToSection('community')} className="text-xs font-medium tracking-[0.2em] text-foreground/70 hover:text-primary transition-colors uppercase">
                Community
              </button>
              <button onClick={() => scrollToSection('contact')} className="text-xs font-medium tracking-[0.2em] text-foreground/70 hover:text-primary transition-colors uppercase">
                Contact
              </button>
            </div>
            
            {/* CTA */}
            <div className="hidden lg:block">
              <Button 
                onClick={() => scrollToSection('member-access')}
                className="rounded-sm bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-5 text-xs tracking-[0.15em] font-semibold shadow-lg"
              >
                BOOK A STRATEGY CALL
              </Button>
            </div>
            
            {/* Mobile Menu Button */}
            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
        
        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="lg:hidden bg-background border-b border-border px-6 py-8"
          >
            <div className="flex flex-col gap-6">
              <button onClick={() => scrollToSection('about')} className="text-sm font-medium tracking-[0.15em] text-foreground hover:text-primary transition-colors uppercase text-left">
                About
              </button>
              <button onClick={() => scrollToSection('services')} className="text-sm font-medium tracking-[0.15em] text-foreground hover:text-primary transition-colors uppercase text-left">
                Services
              </button>
              <button onClick={() => scrollToSection('community')} className="text-sm font-medium tracking-[0.15em] text-foreground hover:text-primary transition-colors uppercase text-left">
                Community
              </button>
              <button onClick={() => scrollToSection('contact')} className="text-sm font-medium tracking-[0.15em] text-foreground hover:text-primary transition-colors uppercase text-left">
                Contact
              </button>
              <Button 
                onClick={() => scrollToSection('member-access')}
                className="rounded-sm bg-primary text-primary-foreground w-full text-sm tracking-[0.15em] mt-4"
              >
                BOOK A CALL
              </Button>
            </div>
          </motion.div>
        )}
      </nav>

      {/* Hero Section - Split Layout with Red Panel */}
      <section className="pt-20 min-h-screen relative">
        <div className="grid lg:grid-cols-2 min-h-[calc(100vh-5rem)]">
          {/* Left - Image */}
          <div className="relative h-[50vh] lg:h-auto order-2 lg:order-1">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1 }}
              className="h-full"
            >
              <img
                src={heroImage}
                alt="Confident woman in sports environment"
                className="w-full h-full object-cover"
              />
            </motion.div>
          </div>

          {/* Right - Red CTA Panel */}
          <div className="relative flex items-center order-1 lg:order-2">
            <div className="bg-primary text-primary-foreground p-8 sm:p-12 lg:p-16 xl:p-20 w-full min-h-[50vh] lg:min-h-full flex flex-col justify-center">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
              >
                <p className="text-primary-foreground/70 text-xs font-medium tracking-[0.25em] mb-8 uppercase">
                  Women's Sports Platform
                </p>
                <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-serif font-normal leading-[1.1] mb-8">
                  BOOST Your<br />
                  Women's Sports<br />
                  Presence
                </h1>
                <p className="text-primary-foreground/80 text-lg leading-relaxed mb-10 max-w-lg">
                  Expert storytelling & community activations. Tailored strategies that drive engagement, loyalty, and revenue.
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button 
                    onClick={() => scrollToSection('member-access')}
                    variant="outline"
                    className="rounded-sm border-2 border-primary-foreground text-foreground bg-primary-foreground hover:bg-primary-foreground/90 px-8 py-6 text-sm tracking-[0.15em] font-semibold"
                  >
                    BOOK A STRATEGY CALL
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                  <Button 
                    onClick={() => scrollToSection('services')}
                    variant="ghost"
                    className="rounded-sm text-primary-foreground hover:bg-primary-foreground/10 px-8 py-6 text-sm tracking-[0.15em] font-semibold"
                  >
                    VIEW SERVICES
                  </Button>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* About Section - Side by Side Editorial */}
      <section id="about" className="py-24 lg:py-40 bg-background relative overflow-hidden">
        {/* Background Text */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.03]">
          <span className="text-[20vw] font-serif font-bold tracking-tight text-foreground whitespace-nowrap">
            LOVERBALL
          </span>
        </div>
        
        <div className="max-w-7xl mx-auto px-6 lg:px-12 relative">
          <div className="grid lg:grid-cols-2 gap-16 lg:gap-24 items-center">
            {/* Left - Founder Image */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="aspect-[3/4] overflow-hidden">
                <img
                  src={founderImage}
                  alt="Founder"
                  className="w-full h-full object-cover"
                />
              </div>
              {/* Floating Badge */}
              <div className="absolute -bottom-6 -right-6 lg:-right-12 bg-primary text-primary-foreground p-6 lg:p-8 max-w-[200px]">
                <p className="text-xs tracking-[0.2em] uppercase mb-2">Founder &</p>
                <p className="font-serif text-lg">Creative Producer</p>
              </div>
            </motion.div>
            
            {/* Right - Text Content */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              viewport={{ once: true }}
            >
              <p className="text-primary text-xs font-semibold tracking-[0.25em] mb-8 uppercase">About Loverball</p>
              <h2 className="text-4xl sm:text-5xl lg:text-6xl font-serif font-normal leading-[1.1] mb-8 text-foreground">
                Where Female Fandom Thrives
              </h2>
              <div className="space-y-6 text-foreground/60 text-lg leading-relaxed">
                <p>
                  <strong className="text-foreground">75% of women globally</strong> identify as sports fans. Yet their voices, communities, and purchasing power remain overlooked.
                </p>
                <p>
                  Loverball is a content and community platform built for women who love sports. We create the space for her to gather, share, and celebrate the games she loves.
                </p>
                <p>
                  By 2030, women will command <strong className="text-foreground">75% of global discretionary spending</strong>. The future of sports is female.
                </p>
              </div>
              <Button 
                onClick={() => scrollToSection('services')}
                variant="outline"
                className="rounded-sm border-foreground text-foreground hover:bg-foreground hover:text-background mt-10 px-8 py-6 text-sm tracking-[0.15em] font-semibold"
              >
                LEARN MORE
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Services Section - Editorial Grid */}
      <section id="services" className="py-24 lg:py-40 bg-foreground text-background relative overflow-hidden">
        {/* Background Repeated Text */}
        <div className="absolute inset-0 flex flex-col justify-center items-start pointer-events-none overflow-hidden">
          {[...Array(8)].map((_, i) => (
            <span key={i} className="text-[8vw] font-serif font-bold text-primary/10 whitespace-nowrap leading-none">
              OUR SERVICES OUR SERVICES OUR SERVICES
            </span>
          ))}
        </div>
        
        <div className="max-w-7xl mx-auto px-6 lg:px-12 relative">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="mb-20"
          >
            <p className="text-primary text-xs font-semibold tracking-[0.25em] mb-6 uppercase">Signature Services</p>
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-serif font-normal leading-[1.1] max-w-3xl">
              Strategic Solutions for Women's Sports
            </h2>
          </motion.div>

          <div className="space-y-16 lg:space-y-24">
            {services.map((service, index) => (
              <motion.div
                key={service.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="grid lg:grid-cols-2 gap-8 lg:gap-16 items-start border-t border-background/20 pt-12"
              >
                <div>
                  <span className="text-primary text-sm font-medium tracking-wider">0{index + 1}</span>
                  <h3 className="text-2xl lg:text-3xl font-serif text-background mt-4 mb-4">{service.title}</h3>
                  <p className="text-background/60 text-lg leading-relaxed">{service.description}</p>
                </div>
                <div className="bg-background/5 p-8 lg:p-10 space-y-8">
                  <div>
                    <p className="text-xs tracking-[0.2em] uppercase text-background/50 mb-4">What's Included</p>
                    <ul className="space-y-3">
                      {service.includes.map((item) => (
                        <li key={item} className="flex items-start gap-3 text-background/80">
                          <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="text-xs tracking-[0.2em] uppercase text-background/50 mb-3">This Is Perfect For</p>
                    <p className="text-background/80">{service.perfectFor}</p>
                  </div>
                  <div className="border-t border-background/10 pt-6">
                    <p className="text-xs tracking-[0.2em] uppercase text-background/50 mb-2">Investment</p>
                    <p className="text-xl font-serif text-primary">{service.investment}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="mt-20 text-center"
          >
            <Button 
              onClick={() => scrollToSection('member-access')}
              className="rounded-sm bg-primary hover:bg-primary/90 text-primary-foreground px-12 py-6 text-sm tracking-[0.15em] font-semibold shadow-lg"
            >
              GET STARTED
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Community / Stats Section */}
      <section id="community" className="py-24 lg:py-40 bg-background">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-20"
          >
            <p className="text-primary text-xs font-semibold tracking-[0.25em] mb-6 uppercase">The Movement</p>
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-serif font-normal leading-[1.1] mb-8">
              The Future Is Female Fandom
            </h2>
            <p className="text-foreground/60 text-lg max-w-2xl mx-auto">
              Join the community redefining what it means to be a woman who loves sports.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-12 lg:gap-16">
            {[
              { stat: "75%", label: "of women globally identify as sports fans" },
              { stat: "85%", label: "of household sports purchases controlled by women" },
              { stat: "$1.2T", label: "women's sports market opportunity by 2030" },
            ].map((item, index) => (
              <motion.div
                key={item.stat}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.15 }}
                viewport={{ once: true }}
                className="text-center"
              >
                <span className="text-6xl lg:text-8xl font-serif text-primary tracking-tight">{item.stat}</span>
                <p className="text-foreground/60 mt-4 max-w-[250px] mx-auto">{item.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-24 lg:py-32 bg-primary text-primary-foreground">
        <div className="max-w-4xl mx-auto px-6 lg:px-12 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-serif font-normal leading-[1.1] mb-8">
              Ready to Elevate Your Women's Sports Strategy?
            </h2>
            <p className="text-primary-foreground/80 text-lg leading-relaxed mb-10 max-w-2xl mx-auto">
              Let's build something that matters. Book a free strategy call to discuss how we can help you connect with the fastest-growing audience in sports.
            </p>
            <Button 
              onClick={() => scrollToSection('member-access')}
              variant="outline"
              className="rounded-sm border-2 border-primary-foreground text-foreground bg-primary-foreground hover:bg-primary-foreground/90 px-12 py-6 text-sm tracking-[0.15em] font-semibold"
            >
              BOOK YOUR FREE CALL
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Member Access / Contact Section */}
      {!isAuthenticated && (
        <section id="member-access" className="py-24 lg:py-40 bg-background">
          <div className="max-w-7xl mx-auto px-6 lg:px-12">
            <div className="grid lg:grid-cols-2 gap-16 lg:gap-24 items-start">
              {/* Left - Info */}
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8 }}
                viewport={{ once: true }}
                className="lg:sticky lg:top-32"
              >
                <p className="text-primary text-xs font-semibold tracking-[0.25em] mb-6 uppercase">Member Access</p>
                <h2 className="text-4xl sm:text-5xl font-serif font-normal text-foreground leading-[1.1] mb-6">
                  Sign in to access the full platform.
                </h2>
                <p className="text-foreground/60 text-lg leading-relaxed max-w-md mb-8">
                  Join our community of women who are passionate about sports. Get access to exclusive content, events, and connections.
                </p>
                <div className="bg-secondary/50 p-6 rounded-sm">
                  <p className="text-sm text-foreground/70 leading-relaxed">
                    <strong className="text-foreground">Want to work with us?</strong> Book a strategy call or reach out at{" "}
                    <a href="mailto:hello@loverball.com" className="text-primary hover:underline">hello@loverball.com</a>
                  </p>
                </div>
              </motion.div>
              
              {/* Right - Form */}
              <motion.div
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                viewport={{ once: true }}
              >
                <div className="bg-secondary p-8 sm:p-12 rounded-sm shadow-lg">
                  <Tabs defaultValue="login" className="w-full">
                    <TabsList className="grid w-full grid-cols-2 bg-background/50 rounded-sm h-12">
                      <TabsTrigger value="login" className="rounded-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-sm tracking-wider">
                        SIGN IN
                      </TabsTrigger>
                      <TabsTrigger value="signup" className="rounded-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-sm tracking-wider">
                        SIGN UP
                      </TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="login">
                      {showForgotPassword ? (
                        <form onSubmit={handleForgotPassword} className="space-y-6 mt-8">
                          <div className="space-y-2">
                            <Label htmlFor="reset-email" className="text-foreground text-xs tracking-wider uppercase">Email</Label>
                            <Input
                              id="reset-email"
                              type="email"
                              placeholder="Enter your email"
                              value={email}
                              onChange={(e) => setEmail(e.target.value)}
                              required
                              className="bg-background border-border text-foreground placeholder:text-muted-foreground rounded-sm h-12"
                            />
                          </div>
                          <p className="text-foreground/50 text-sm">
                            We'll send you a link to reset your password.
                          </p>
                          <Button 
                            type="submit" 
                            className="w-full rounded-sm h-12 text-sm tracking-wider" 
                            disabled={loading}
                          >
                            {loading ? "SENDING..." : "SEND RESET LINK"}
                          </Button>
                          <button
                            type="button"
                            onClick={() => setShowForgotPassword(false)}
                            className="w-full text-sm text-primary hover:text-primary/80 transition-colors"
                          >
                            Back to sign in
                          </button>
                        </form>
                      ) : (
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
                              className="bg-background border-border text-foreground placeholder:text-muted-foreground rounded-sm h-12"
                            />
                          </div>
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <Label htmlFor="login-password" className="text-foreground text-xs tracking-wider uppercase">Password</Label>
                              <button
                                type="button"
                                onClick={() => setShowForgotPassword(true)}
                                className="text-xs text-primary hover:text-primary/80 transition-colors"
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
                              className="bg-background border-border text-foreground placeholder:text-muted-foreground rounded-sm h-12"
                            />
                          </div>
                          <Button 
                            type="submit" 
                            className="w-full rounded-sm h-12 text-sm tracking-wider" 
                            disabled={loading}
                          >
                            {loading ? "SIGNING IN..." : "SIGN IN"}
                          </Button>
                        </form>
                      )}
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
                            className="bg-background border-border text-foreground placeholder:text-muted-foreground rounded-sm h-12"
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
                            className="bg-background border-border text-foreground placeholder:text-muted-foreground rounded-sm h-12"
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
                            className="bg-background border-border text-foreground placeholder:text-muted-foreground rounded-sm h-12 uppercase tracking-widest"
                          />
                          <p className="text-xs text-foreground/50">
                            Need a code? Request one from an existing member.
                          </p>
                        </div>
                        <Button 
                          type="submit" 
                          className="w-full rounded-sm h-12 text-sm tracking-wider" 
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

      {/* Contact Section */}
      <section id="contact" className="py-24 lg:py-32 bg-secondary">
        <div className="max-w-3xl mx-auto px-6 lg:px-12 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <p className="text-primary text-xs font-semibold tracking-[0.25em] mb-6 uppercase">Get In Touch</p>
            <h2 className="text-3xl sm:text-4xl font-serif font-normal leading-[1.2] mb-6 text-foreground">
              Let's Collaborate
            </h2>
            <p className="text-foreground/60 text-lg leading-relaxed mb-8">
              Interested in partnerships, sponsorships, or booking appearances? We'd love to hear from you.
            </p>
            <a 
              href="mailto:hello@loverball.com"
              className="inline-flex items-center gap-2 text-primary font-semibold text-lg hover:underline"
            >
              hello@loverball.com
              <ArrowRight className="h-5 w-5" />
            </a>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-20 bg-foreground text-background">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="grid lg:grid-cols-12 gap-12 items-start mb-16">
            <div className="lg:col-span-4">
              <img src={loverballLogo} alt="Loverball" className="h-16 w-auto brightness-0 invert mb-4" />
              <p className="text-background/50 text-sm leading-relaxed max-w-xs">
                A content and community platform for women who love sports.
              </p>
            </div>
            <div className="lg:col-span-2 lg:col-start-7">
              <p className="text-background/40 text-xs tracking-wider uppercase mb-4">Platform</p>
              <nav className="space-y-3">
                <button onClick={() => scrollToSection('about')} className="block text-sm text-background/70 hover:text-background transition-colors text-left">About</button>
                <button onClick={() => scrollToSection('services')} className="block text-sm text-background/70 hover:text-background transition-colors text-left">Services</button>
                <button onClick={() => scrollToSection('community')} className="block text-sm text-background/70 hover:text-background transition-colors text-left">Community</button>
              </nav>
            </div>
            <div className="lg:col-span-2">
              <p className="text-background/40 text-xs tracking-wider uppercase mb-4">Connect</p>
              <nav className="space-y-3">
                <a href="https://www.instagram.com/loverballclub/" target="_blank" rel="noopener noreferrer" className="block text-sm text-background/70 hover:text-background transition-colors">Instagram</a>
                <a href="https://www.tiktok.com/@loverballclub" target="_blank" rel="noopener noreferrer" className="block text-sm text-background/70 hover:text-background transition-colors">TikTok</a>
              </nav>
            </div>
            <div className="lg:col-span-2">
              <p className="text-background/40 text-xs tracking-wider uppercase mb-4">Legal</p>
              <nav className="space-y-3">
                <Link to="/privacy" className="block text-sm text-background/70 hover:text-background transition-colors">Privacy</Link>
                <Link to="/terms" className="block text-sm text-background/70 hover:text-background transition-colors">Terms</Link>
                <button onClick={() => scrollToSection('contact')} className="block text-sm text-background/70 hover:text-background transition-colors text-left">Contact</button>
              </nav>
            </div>
          </div>
          <div className="border-t border-background/10 pt-8">
            <p className="text-xs text-background/40">
              © 2025 Loverball. All rights reserved. Built by women, for women.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;

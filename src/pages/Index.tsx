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
import { ArrowRight, Heart, Calendar, Play, ShoppingBag, Mail, X, Sparkles, Clock, MapPin } from "lucide-react";
import TrendingNews from "@/components/TrendingNews";

import loverballLogo from "@/assets/loverball-script-logo.png";
import heroImage from "@/assets/hero-women-new.png";
import philosophyImage from "@/assets/philosophy-image.jpg";
import communityImage from "@/assets/landing-community.jpg";
import athletesImage from "@/assets/landing-athletes.jpg";
import fansImage from "@/assets/landing-fans.jpg";
import { z } from "zod";

const signUpSchema = z.object({
  email: z.string().trim().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const ACCESS_CODE = "7988";

/* ═══════════════════════════════════════════════════════════════
   INDEX — AURA Dark Landing Page for Loverball
   ═══════════════════════════════════════════════════════════════ */

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
  const { user } = useAuth();
  const isAuthenticated = !!user;

  /* ── Auth handlers (preserved) ── */
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
        redirectTo: `${window.location.origin}/auth?reset=true`
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

  const handleVerifyInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (inviteCode.trim() === ACCESS_CODE) {
      setInviteVerified(true);
      setInviteError(false);
      return;
    }
    setInviteError(true);
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteVerified) {
      setInviteError(true);
      toast({ title: "Error", description: "Invalid invite code", variant: "destructive" });
      return;
    }
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
    } finally {
      setLoading(false);
    }
  };

  const openAuthModal = () => {
    setInviteCode("");
    setInviteVerified(false);
    setInviteError(false);
    setAuthModalOpen(true);
  };

  /* ── Landing data ── */
  const trendingStories = [
    { tag: "TENNIS", title: "Coco Gauff Leads USA Fed Cup Charge in April Showdown", time: "Mar 14", image: "/images/all-stars-event.jpg" },
    { tag: "NWSL", title: "Angel City FC Signs Brazilian Star Ary Borges to Three-Year Deal", time: "Apr 2", image: "/images/angel-city-fc-opener.jpg" },
    { tag: "OLYMPICS", title: "LA28 Women's Sports Preview: New Events & Venues Announced", time: "Jun 10", image: "/images/la28-olympics-mixer.jpg" },
    { tag: "SOCCER", title: "World Cup LA 2026: Women's Watch Party Guide Drops This Spring", time: "Apr 18", image: "/images/world-cup-la-preview.jpg" },
  ];

  const nearbyEvents = [
    { date: "JUN 14", time: "7:00 PM", title: "Sparks vs Aces Watch Party", venue: "The Victorian, Santa Monica", type: "Watch Party" },
    { date: "APR 05", time: "5:30 PM", title: "Angel City FC Tailgate", venue: "BMO Stadium, DTLA", type: "Game Day" },
    { date: "APR 19", time: "6:00 PM", title: "Tennis & Tequila: Spring Edition", venue: "The Bungalow, Santa Monica", type: "Meetup" },
    { date: "JUN 14", time: "4:00 PM", title: "World Cup Kickoff Mixer", venue: "Loverball HQ, Venice", type: "Watch Party" },
  ];

  const featureCards = [
    { icon: Heart, title: "Discover\nFans", category: "Community", bg: "bg-accent-yellow", text: "text-black" },
    { icon: Calendar, title: "Find\nEvents", category: "Events", bg: "bg-accent-blue", text: "text-white" },
    { icon: Play, title: "Watch\nContent", category: "Streaming", bg: "bg-accent-pink", text: "text-white" },
    { icon: ShoppingBag, title: "Shop\nGear", category: "Merch", bg: "bg-[#E86C4B]", text: "text-base-100" },
  ];

  /* ═══════════════════════════════════════════════════════════════
     RENDER
     ═══════════════════════════════════════════════════════════════ */
  return (
    <div className="bg-base-100 text-white font-sans w-full min-h-screen overflow-x-hidden selection:bg-accent-orange selection:text-white">
      {/* Noise overlay */}
      <div className="noise-bg" />

      {/* ── AUTH MODAL (styled dark) ── */}
      <Dialog open={authModalOpen} onOpenChange={setAuthModalOpen}>
        <DialogContent className="sm:max-w-md rounded-3xl p-0 overflow-hidden border-white/10 bg-base-200 text-white">
          <div className="p-8 sm:p-10">
            <DialogTitle className="sr-only">Member Access</DialogTitle>
            <div className="flex justify-center mb-8">
              <img src={loverballLogo} alt="Loverball" className="h-20 w-auto brightness-0 invert" />
            </div>
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2 bg-base-300 rounded-full p-1 h-12">
                <TabsTrigger value="login" className="rounded-full data-[state=active]:bg-accent-orange data-[state=active]:text-black text-[11px] font-sans font-bold tracking-[0.1em] uppercase text-white/60">Sign In</TabsTrigger>
                <TabsTrigger value="signup" className="rounded-full data-[state=active]:bg-accent-orange data-[state=active]:text-black text-[11px] font-sans font-bold tracking-[0.1em] uppercase text-white/60">Sign Up</TabsTrigger>
              </TabsList>
              <TabsContent value="login">
                {showForgotPassword ? (
                  <form onSubmit={handleForgotPassword} className="space-y-5 mt-8">
                    <div className="space-y-2">
                      <Label htmlFor="reset-email" className="text-white/70 text-[11px] tracking-[0.1em] uppercase">Email</Label>
                      <Input id="reset-email" type="email" placeholder="Enter your email" value={email} onChange={(e) => setEmail(e.target.value)} required className="bg-base-100 border-white/10 text-white rounded-xl h-12 placeholder:text-white/30" />
                    </div>
                    <p className="text-white/50 text-sm">We'll send you a link to reset your password.</p>
                    <Button type="submit" className="w-full rounded-full h-12 bg-accent-orange text-black text-[11px] font-sans font-bold tracking-[0.1em] uppercase hover:bg-accent-orange/90" disabled={loading}>{loading ? "Sending..." : "Send Reset Link"}</Button>
                    <button type="button" onClick={() => setShowForgotPassword(false)} className="w-full text-sm text-accent-orange hover:text-accent-orange/80 transition-colors font-medium">Back to sign in</button>
                  </form>
                ) : (
                  <form onSubmit={handleLogin} className="space-y-5 mt-8">
                    <div className="space-y-2">
                      <Label htmlFor="login-email" className="text-white/70 text-[11px] tracking-[0.1em] uppercase">Email</Label>
                      <Input id="login-email" type="email" placeholder="Enter your email" value={email} onChange={(e) => setEmail(e.target.value)} required className="bg-base-100 border-white/10 text-white rounded-xl h-12 placeholder:text-white/30" />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="login-password" className="text-white/70 text-[11px] tracking-[0.1em] uppercase">Password</Label>
                        <button type="button" onClick={() => setShowForgotPassword(true)} className="text-xs text-accent-orange hover:text-accent-orange/80 transition-colors">Forgot?</button>
                      </div>
                      <Input id="login-password" type="password" placeholder="Enter your password" value={password} onChange={(e) => setPassword(e.target.value)} required className="bg-base-100 border-white/10 text-white rounded-xl h-12 placeholder:text-white/30" />
                    </div>
                    <Button type="submit" className="w-full rounded-full h-12 bg-accent-orange text-black text-[11px] font-sans font-bold tracking-[0.1em] uppercase hover:bg-accent-orange/90" disabled={loading}>{loading ? "Signing in..." : "Sign In"}</Button>
                  </form>
                )}
              </TabsContent>
              <TabsContent value="signup">
                {!inviteVerified ? (
                  <form onSubmit={handleVerifyInvite} className="space-y-5 mt-8">
                    <div className="space-y-2">
                      <Label htmlFor="signup-invite-code" className="text-white/70 text-[11px] tracking-[0.1em] uppercase">Invite Code</Label>
                      <Input id="signup-invite-code" type="text" inputMode="numeric" maxLength={4} placeholder="Enter invite code" value={inviteCode} onChange={(e) => { setInviteCode(e.target.value); setInviteError(false); }} required className="bg-base-100 border-white/10 text-white rounded-xl h-12 placeholder:text-white/30" />
                      {inviteError && <p className="text-accent-pink text-sm">Invalid invite code</p>}
                    </div>
                    <Button type="submit" className="w-full rounded-full h-12 bg-accent-orange text-black text-[11px] font-sans font-bold tracking-[0.1em] uppercase hover:bg-accent-orange/90">VERIFY CODE</Button>
                  </form>
                ) : (
                  <form onSubmit={handleSignup} className="space-y-5 mt-8">
                    <div className="space-y-2">
                      <Label htmlFor="signup-email" className="text-white/70 text-[11px] tracking-[0.1em] uppercase">Email</Label>
                      <Input id="signup-email" type="email" placeholder="Enter your email" value={email} onChange={(e) => setEmail(e.target.value)} required className="bg-base-100 border-white/10 text-white rounded-xl h-12 placeholder:text-white/30" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-password" className="text-white/70 text-[11px] tracking-[0.1em] uppercase">Password</Label>
                      <Input id="signup-password" type="password" placeholder="Create a password (min 6)" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} className="bg-base-100 border-white/10 text-white rounded-xl h-12 placeholder:text-white/30" />
                    </div>
                    <Button type="submit" className="w-full rounded-full h-12 bg-accent-orange text-black text-[11px] font-sans font-bold tracking-[0.1em] uppercase hover:bg-accent-orange/90" disabled={loading}>{loading ? "Creating account..." : "Create Account"}</Button>
                  </form>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── NAV (AURA style — mix-blend-difference) ── */}
      <header className="fixed top-0 w-full z-40 px-5 py-6 flex justify-between items-center mix-blend-difference pointer-events-none">
        <img src={loverballLogo} alt="Loverball" className="h-10 w-auto brightness-0 invert pointer-events-auto" />
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="w-10 h-10 flex flex-col justify-center items-end gap-1.5 pointer-events-auto hover:opacity-70 transition-opacity"
        >
          {mobileMenuOpen ? (
            <X className="w-6 h-6" />
          ) : (
            <>
              <span className="w-7 h-[2px] bg-white rounded-full" />
              <span className="w-5 h-[2px] bg-white rounded-full" />
            </>
          )}
        </button>
      </header>

      {/* ── Mobile menu overlay ── */}
      {mobileMenuOpen && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed inset-0 z-[100] flex items-end justify-center"
        >
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)} />
          <div className="relative w-full max-w-[420px] bg-base-200 rounded-t-[2rem] p-8 border-t border-white/10 shadow-[0_-20px_40px_-10px_rgba(0,0,0,0.8)]">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl text-white font-display uppercase">Menu</h2>
              <button onClick={() => setMobileMenuOpen(false)} className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white/60 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <nav className="flex flex-col gap-2">
              {["Explore", "Trending", "Events", "Shop", "Watch"].map((item) => (
                <a
                  key={item}
                  href={`#${item.toLowerCase()}`}
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-left py-3 px-4 rounded-xl text-white/70 hover:text-white hover:bg-white/5 transition-all font-sans font-medium text-sm uppercase tracking-widest border-b border-white/5 last:border-0"
                >
                  {item}
                </a>
              ))}
              <button
                onClick={() => { setMobileMenuOpen(false); openAuthModal(); }}
                className="mt-4 w-full py-4 rounded-full bg-accent-orange text-black font-display text-sm uppercase tracking-widest hover:bg-accent-orange/90 transition-colors"
              >
                Join Loverball
              </button>
            </nav>
            <div className="mt-8 pt-6 border-t border-white/10 flex gap-4">
              <div className="w-2 h-2 rounded-full bg-accent-orange" />
              <div className="w-2 h-2 rounded-full bg-accent-yellow" />
              <div className="w-2 h-2 rounded-full bg-accent-blue" />
            </div>
          </div>
        </motion.div>
      )}

      {/* ═══════ HERO ═══════ */}
      <section className="relative w-full min-h-[90vh] overflow-hidden">
        {/* Hero image */}
        <div className="absolute top-0 right-0 w-full lg:w-[70%] h-full overflow-hidden z-0">
          <img
            src={heroImage}
            alt="Women in sports"
            className="w-full h-full object-cover mix-blend-luminosity opacity-60 scale-105 origin-top"
          />
          <div className="absolute inset-0 bg-gradient-to-tr from-base-100 via-accent-orange/30 to-transparent mix-blend-multiply" />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-base-100" />
          <div className="absolute inset-0 bg-gradient-to-r from-base-100 via-base-100/60 to-transparent" />
        </div>

        {/* Grid overlay lines */}
        <div className="absolute inset-0 pointer-events-none z-0">
          <div className="absolute top-[40%] left-0 w-full h-px bg-white/10" />
          <div className="absolute top-0 left-[30%] w-px h-full bg-white/10" />
        </div>

        {/* Glowing orb */}
        <div className="absolute -right-20 -top-20 w-96 h-96 bg-accent-orange rounded-full mix-blend-screen blur-[80px] opacity-30" />

        {/* Early Access badge */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8, rotate: 0 }}
          animate={{ opacity: 1, scale: 1, rotate: 12 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="absolute top-28 right-6 w-20 h-20 bg-accent-yellow rounded-full flex items-center justify-center shadow-2xl z-20 border-[3px] border-base-100"
        >
          <div className="text-black font-display text-[9px] leading-[1.1] text-center uppercase tracking-wider">
            Early<br />Access<br />Now
          </div>
        </motion.div>

        {/* Hero content */}
        <div className="relative z-10 flex items-end min-h-[90vh] px-6 lg:px-16 pb-16 pt-28">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, ease: "easeOut" }}
          >
            <div className="flex items-center gap-2 mb-4">
              <span className="px-3 py-1 bg-white/10 backdrop-blur-md border border-white/20 rounded-full text-[9px] font-bold uppercase tracking-[0.2em] text-white">For Women Who Love Sports</span>
              <span className="w-1 h-1 rounded-full bg-accent-yellow" />
              <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-accent-yellow">Los Angeles</span>
            </div>

            <h1 className="font-display text-[5rem] sm:text-[6rem] lg:text-[8rem] leading-[0.82] tracking-tighter uppercase text-white drop-shadow-lg">
              Her<br />
              <span className="text-accent-orange">Game.</span><br />
              <span className="font-serif italic capitalize tracking-normal text-[3rem] sm:text-[3.5rem] lg:text-[4.5rem] text-accent-pink">Her Community.</span><br />
              <span
                style={{ WebkitTextStroke: "1px rgba(255,255,255,0.4)", color: "transparent" }}
              >
                Her Rules.
              </span>
            </h1>

            <div className="mt-10 flex gap-4 items-center">
              <div className="w-12 h-[1px] bg-white/50" />
              <p className="font-sans font-medium text-[10px] max-w-[220px] text-white/80 uppercase tracking-[0.2em] leading-relaxed">
                The media platform built for women who live and breathe sports.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-start gap-4 mt-8">
              <button
                onClick={openAuthModal}
                className="rounded-full bg-accent-orange text-black px-8 py-4 font-display text-sm uppercase tracking-widest hover:bg-accent-orange/90 transition-all hover:-translate-y-0.5 shadow-lg shadow-accent-orange/20 flex items-center gap-3"
              >
                Join Loverball <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => document.getElementById("events")?.scrollIntoView({ behavior: "smooth" })}
                className="rounded-full border border-white/30 text-white px-8 py-4 text-[11px] font-sans font-bold uppercase tracking-widest hover:bg-white/10 transition-all"
              >
                Find Events
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ═══════ MARQUEE TICKER ═══════ */}
      <div className="w-full bg-accent-orange text-black py-3 overflow-hidden border-y border-white/10 relative z-20">
        <div className="flex items-center gap-6 animate-marquee whitespace-nowrap">
          {[...Array(2)].map((_, dup) => (
            <div key={dup} className="flex items-center gap-6">
              {["LIVE SCORES", "WATCH PARTIES", "TRENDING NOW", "COMMUNITY EVENTS", "GAME DAY VIBES", "MARCH MADNESS", "PLAYOFF RACE", "HER GAME HER RULES"].map((item) => (
                <span key={`${dup}-${item}`} className="flex items-center gap-6">
                  <i className="ph-fill ph-star-four text-xs" />
                  <span className="font-display uppercase text-sm tracking-widest">{item}</span>
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* ═══════ EXPLORE LOVERBALL (Trending Cards) ═══════ */}
      <section id="explore" className="py-16 lg:py-24">
        <div className="flex justify-between items-end px-6 lg:px-16 mb-8">
          <h2 className="font-display text-[2.5rem] lg:text-[3.5rem] text-accent-yellow tracking-wide uppercase leading-none">
            Explore<br />Loverball
          </h2>
          <button
            onClick={openAuthModal}
            className="text-[10px] uppercase font-bold tracking-[0.15em] border-b border-white/30 pb-1 hover:text-accent-yellow hover:border-accent-yellow transition-colors"
          >
            View All
          </button>
        </div>

        <div className="flex overflow-x-auto gap-5 px-6 lg:px-16 pb-10 snap-x hide-scrollbar">
          {featureCards.map((card, i) => (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              viewport={{ once: true }}
              onClick={openAuthModal}
              className={`snap-start shrink-0 w-[220px] lg:w-[260px] h-[300px] lg:h-[340px] ${card.bg} rounded-3xl p-6 flex flex-col justify-between relative overflow-hidden group cursor-pointer shadow-xl`}
            >
              {/* Decoration */}
              {i === 0 && <div className="absolute -right-16 -top-16 w-56 h-56 bg-black rotate-[25deg] transform group-hover:rotate-[35deg] transition-transform duration-700" />}
              {i === 1 && (
                <>
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 bg-accent-orange rounded-full transform group-hover:scale-125 transition-transform duration-700 mix-blend-multiply" />
                  <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-accent-yellow rotate-[15deg] mix-blend-overlay opacity-80" />
                </>
              )}
              {i === 2 && <div className="absolute inset-0 opacity-20" style={{ backgroundImage: "repeating-linear-gradient(45deg, transparent, transparent 10px, #000 10px, #000 12px)" }} />}
              {i === 3 && (
                <div className="absolute top-6 right-6 text-base-100 animate-spin" style={{ animationDuration: "12s" }}>
                  <svg width="48" height="48" viewBox="0 0 100 100"><path d="M50 0 L55 40 L100 50 L55 60 L50 100 L45 60 L0 50 L45 40 Z" fill="currentColor" /></svg>
                </div>
              )}

              {/* Top */}
              <div className={`relative z-10 ${card.text}`}>
                <p className="font-sans font-bold text-[10px] tracking-widest uppercase mb-4 border-b border-current/20 pb-2 inline-block opacity-70">
                  {card.category}
                </p>
                <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-white/15 mb-2">
                  <card.icon className="w-5 h-5" />
                </div>
              </div>

              {/* Bottom */}
              <div className={`relative z-10 ${card.text}`}>
                <h3 className="font-display text-[3rem] lg:text-[3.5rem] leading-[0.85] uppercase whitespace-pre-line">
                  {card.title}
                </h3>
              </div>

              {/* Number + arrow */}
              <div className={`relative z-10 flex justify-between items-end ${card.text} w-full mt-auto`}>
                <div className="w-10 h-10 rounded-full border-2 border-current flex items-center justify-center group-hover:bg-black group-hover:text-accent-yellow transition-colors duration-300">
                  <ArrowRight className="w-4 h-4" />
                </div>
                <span className="font-display text-2xl opacity-50">{String(i + 1).padStart(2, "0")}</span>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ═══════ TRENDING NOW (Feed Items) ═══════ */}
      <section id="trending" className="py-16 lg:py-24 bg-base-200/50">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-16">
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} transition={{ duration: 0.8 }} viewport={{ once: true }} className="flex items-end justify-between mb-10">
            <h2 className="font-display text-[2.5rem] lg:text-[3.5rem] leading-none tracking-tight text-white uppercase">Trending Now</h2>
            <div className="hidden md:block w-2 h-2 rounded-full bg-accent-orange animate-pulse" />
          </motion.div>

          <TrendingNews onAuthRequired={openAuthModal} fallbackStories={trendingStories} />
        </div>
      </section>

      {/* ═══════ EVENTS NEAR YOU ═══════ */}
      <section id="events" className="py-16 lg:py-24">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-16">
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} transition={{ duration: 0.8 }} viewport={{ once: true }} className="flex items-end justify-between mb-10">
            <h2 className="font-display text-[2.5rem] lg:text-[3.5rem] leading-none tracking-tight text-white uppercase">Events Near You</h2>
            <button onClick={openAuthModal} className="hidden md:flex items-center gap-2 rounded-full bg-accent-orange text-black px-6 py-3 font-display text-xs uppercase tracking-widest hover:bg-accent-orange/90 transition-colors">
              View All <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {nearbyEvents.map((event, i) => (
              <motion.div
                key={event.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: i * 0.08 }}
                viewport={{ once: true }}
                onClick={openAuthModal}
                className="cursor-pointer group"
              >
                <div className="bg-base-200 rounded-[2rem] p-6 shadow-sm hover:shadow-lg transition-all duration-300 h-full border border-white/10 hover:border-white/20">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="bg-accent-orange/10 rounded-xl px-3 py-2 text-center">
                      <span className="font-display text-lg text-accent-orange block leading-none">{event.date.split(" ")[0]}</span>
                      <span className="font-display text-2xl text-accent-orange block leading-none">{event.date.split(" ")[1]}</span>
                    </div>
                    <span className="text-[10px] font-sans font-bold tracking-[0.15em] uppercase text-accent-yellow bg-accent-yellow/10 px-2.5 py-1 rounded-full">{event.type}</span>
                  </div>
                  <h3 className="font-sans font-bold text-white text-base mb-3 group-hover:text-accent-orange transition-colors leading-snug">{event.title}</h3>
                  <div className="space-y-1.5">
                    <p className="text-sm text-white/50 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-accent-orange/60" /> {event.time}
                    </p>
                    <p className="text-sm text-white/50 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-accent-orange/60" /> {event.venue}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="mt-8 md:hidden text-center">
            <button onClick={openAuthModal} className="rounded-full bg-accent-orange text-black px-6 py-3 font-display text-xs uppercase tracking-widest">
              View All Events
            </button>
          </div>
        </div>
      </section>

      {/* ═══════ MATCH CTA ═══════ */}
      <section className="py-16 lg:py-20 bg-accent-pink">
        <div className="max-w-[900px] mx-auto px-6 lg:px-16">
          <motion.div initial={{ opacity: 0, scale: 0.97 }} whileInView={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6 }} viewport={{ once: true }} className="text-center">
            <div className="inline-flex items-center gap-2 bg-white/20 rounded-full px-5 py-2 mb-6">
              <Sparkles className="w-4 h-4 text-white" />
              <span className="text-[11px] font-sans font-bold tracking-[0.2em] uppercase text-white">New Match Waiting</span>
            </div>
            <h2 className="font-display text-[2.5rem] lg:text-[4rem] leading-[0.85] tracking-tight text-white uppercase mb-4">
              Someone Just Liked<br />Your Profile!
            </h2>
            <p className="text-base font-sans text-white/80 leading-relaxed mb-8 max-w-md mx-auto">
              3 new fans match your sports vibe. See who's out there.
            </p>
            <button onClick={openAuthModal} className="rounded-full bg-base-100 text-white hover:bg-base-200 px-10 py-5 font-display text-sm uppercase tracking-widest shadow-xl transition-all hover:-translate-y-0.5 flex items-center gap-3 mx-auto">
              Discover Matches <Heart className="w-4 h-4" />
            </button>
          </motion.div>
        </div>
      </section>

      {/* ═══════ ABOUT / MISSION ═══════ */}
      <section className="bg-accent-orange">
        <div className="grid lg:grid-cols-2">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} viewport={{ once: true }} className="px-6 lg:px-16 py-20 lg:py-28 flex flex-col justify-center">
            <span className="text-[11px] font-sans font-bold tracking-[0.3em] uppercase text-black/50 mb-4">Our Mission</span>
            <h2 className="font-display text-[3rem] lg:text-[4.5rem] leading-[0.85] tracking-tight text-black uppercase mb-8">
              Giving Women Fans<br />A Home in Sports
            </h2>
            <p className="text-base text-black/70 leading-relaxed mb-8 max-w-md font-medium">
              Loverball exists to give women fans a home in sports — more representation, more access to live experiences, and more real friendships built around the teams they love.
            </p>
            <button onClick={openAuthModal} className="rounded-full border-2 border-black text-black bg-transparent hover:bg-black hover:text-accent-orange transition-colors px-7 py-3.5 font-display text-sm uppercase tracking-widest w-fit flex items-center gap-3">
              Join Loverball <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </motion.div>
          <motion.div initial={{ opacity: 0, scale: 0.97 }} whileInView={{ opacity: 1, scale: 1 }} transition={{ duration: 0.8, delay: 0.1 }} viewport={{ once: true }} className="relative min-h-[400px] lg:min-h-0">
            <img src={philosophyImage} alt="Loverball community" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-accent-orange/20 mix-blend-multiply" />
          </motion.div>
        </div>
      </section>

      {/* ═══════ TESTIMONIALS ═══════ */}
      <section className="bg-base-200 py-20 lg:py-28">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-16">
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} transition={{ duration: 0.8 }} viewport={{ once: true }}>
            <span className="font-display text-[3rem] lg:text-[4rem] leading-none tracking-tight text-white/20 uppercase block mb-12">What They Say</span>
            <div className="grid md:grid-cols-3 gap-8 lg:gap-12">
              {[
                { quote: "Finally a sports community that gets me.", name: "Alicia", detail: "Lakers fan" },
                { quote: "I met my best friends at a Loverball watch party.", name: "Dani", detail: "WNBA superfan" },
                { quote: "The content here actually speaks to women fans.", name: "Maria", detail: "Soccer obsessed" },
              ].map((t, i) => (
                <motion.div key={t.name} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: i * 0.1 }} viewport={{ once: true }} className="bg-base-300 rounded-[2rem] p-8 border border-white/10">
                  <p className="font-serif text-xl lg:text-2xl text-white italic leading-relaxed mb-6">"{t.quote}"</p>
                  <p className="text-[11px] font-sans font-bold tracking-[0.2em] uppercase text-white/50">— {t.name}, {t.detail}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ═══════ FINAL CTA ═══════ */}
      <section className="py-28 lg:py-36 bg-base-100 relative overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center opacity-[0.03]">
          <span className="font-display text-[14rem] lg:text-[20rem] text-white leading-none whitespace-nowrap uppercase">join us</span>
        </div>
        <div className="max-w-[900px] mx-auto px-6 lg:px-16 text-center relative z-10">
          <motion.div initial={{ opacity: 0, scale: 0.97 }} whileInView={{ opacity: 1, scale: 1 }} transition={{ duration: 0.8 }} viewport={{ once: true }}>
            <span className="font-display text-[4rem] sm:text-[5rem] lg:text-[7rem] leading-[0.85] tracking-tight text-accent-orange uppercase block mb-6">
              Ready To<br />Join?
            </span>
            <p className="text-lg font-sans text-white/40 mb-12 max-w-lg mx-auto leading-relaxed">
              Be part of the community redefining women's sports fandom. Your game. Your community. Your story.
            </p>
            <button onClick={openAuthModal} className="rounded-full bg-accent-orange text-black px-12 py-6 font-display text-sm uppercase tracking-widest shadow-2xl hover:bg-accent-orange/90 transition-all hover:-translate-y-0.5 inline-flex items-center gap-3">
              Join Loverball <ArrowRight className="w-4 h-4" />
            </button>
          </motion.div>
        </div>
      </section>

      {/* ═══════ FOOTER ═══════ */}
      <footer className="py-16 bg-base-200 border-t border-white/10">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-16">
          {/* Newsletter */}
          <div className="mb-16 pb-12 border-b border-white/10">
            <div className="max-w-md mx-auto text-center">
              <h3 className="font-display text-2xl uppercase tracking-wide text-white mb-3">Stay In The Loop</h3>
              <p className="text-white/40 text-sm mb-6">Get the latest on events, content drops, and community updates.</p>
              <form onSubmit={(e) => { e.preventDefault(); toast({ title: "Subscribed!", description: "You'll hear from us soon." }); setNewsletterEmail(""); }} className="flex gap-2">
                <Input type="email" placeholder="Enter your email" value={newsletterEmail} onChange={(e) => setNewsletterEmail(e.target.value)} required className="flex-1 rounded-full bg-base-100 border-white/10 text-white placeholder:text-white/30 h-12" />
                <Button type="submit" className="rounded-full bg-accent-orange text-black hover:bg-accent-orange/90 px-6 h-12">
                  <Mail className="h-4 w-4" />
                </Button>
              </form>
            </div>
          </div>

          {/* Footer grid */}
          <div className="grid lg:grid-cols-12 gap-12 items-start mb-12">
            <div className="lg:col-span-4">
              <img src={loverballLogo} alt="Loverball" className="w-[130px] h-auto brightness-0 invert mb-6" />
              <p className="text-white/40 text-sm leading-relaxed max-w-xs">
                A community platform for women who love sports. Born in Los Angeles.
              </p>
            </div>
            <div className="lg:col-span-2 lg:col-start-7">
              <p className="text-white/30 text-[11px] font-sans font-bold tracking-[0.2em] uppercase mb-4">Platform</p>
              <nav className="space-y-3">
                <a href="#explore" className="block text-sm text-white/50 hover:text-white transition-colors">Explore</a>
                <a href="#trending" className="block text-sm text-white/50 hover:text-white transition-colors">Trending</a>
                <a href="#events" className="block text-sm text-white/50 hover:text-white transition-colors">Events</a>
              </nav>
            </div>
            <div className="lg:col-span-2">
              <p className="text-white/30 text-[11px] font-sans font-bold tracking-[0.2em] uppercase mb-4">Connect</p>
              <nav className="space-y-3">
                <a href="https://www.instagram.com/loverballclub/" target="_blank" rel="noopener noreferrer" className="block text-sm text-white/50 hover:text-white transition-colors">Instagram</a>
                <a href="https://www.tiktok.com/@loverballclub" target="_blank" rel="noopener noreferrer" className="block text-sm text-white/50 hover:text-white transition-colors">TikTok</a>
              </nav>
            </div>
            <div className="lg:col-span-2">
              <p className="text-white/30 text-[11px] font-sans font-bold tracking-[0.2em] uppercase mb-4">Legal</p>
              <nav className="space-y-3">
                <a href="/privacy" className="block text-sm text-white/50 hover:text-white transition-colors">Privacy</a>
                <a href="/terms" className="block text-sm text-white/50 hover:text-white transition-colors">Terms</a>
                <a href="mailto:hello@loverball.com" className="block text-sm text-white/50 hover:text-white transition-colors">Contact</a>
              </nav>
            </div>
          </div>

          <div className="border-t border-white/10 pt-8 flex items-center justify-between">
            <p className="text-[11px] font-sans tracking-[0.1em] text-white/30">© 2026 Loverball. All rights reserved. Built by women, for women.</p>
            <div className="flex gap-2">
              <div className="w-2 h-2 rounded-full bg-accent-orange" />
              <div className="w-2 h-2 rounded-full bg-accent-yellow" />
              <div className="w-2 h-2 rounded-full bg-accent-blue" />
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;

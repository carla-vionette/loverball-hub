import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Users,
  MessageCircle,
  Search,
  UserCircle,
  Menu,
  X,
  ChevronRight,
  Trophy,
  Heart,
  Flame,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import loverballLogo from "@/assets/loverball-script-logo.png";
import communityImage from "@/assets/community-women.jpg";
import fansImage from "@/assets/landing-fans.jpg";
import athletesImage from "@/assets/landing-athletes.jpg";

/* ── animation helpers ── */
const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay: i * 0.12, ease: [0, 0, 0.2, 1] as const },
  }),
};

const FEATURES = [
  {
    icon: MessageCircle,
    title: "Connect with other fans",
    desc: "Join conversations about teams, leagues, and the big moments that matter to you.",
  },
  {
    icon: Flame,
    title: "Share your sports voice",
    desc: "Post reactions, hot takes, and stories — from the stands or the couch.",
  },
  {
    icon: Search,
    title: "Discover communities by sport",
    desc: "From football to basketball, tennis to Formula 1 — find your people.",
  },
  {
    icon: UserCircle,
    title: "Build your sports identity",
    desc: "Create a profile showcasing your favorite teams, sports, and moments.",
  },
  {
    icon: Sparkles,
    title: "AI-Curated News",
    desc: "Get personalized sports news tailored to your favorite teams and leagues, powered by AI.",
  },
];

const AUDIENCE = [
  { emoji: "🔥", label: "Passionate fans who live for game day" },
  { emoji: "🏅", label: "Former and current athletes" },
  { emoji: "🎙️", label: "Analysts, commentators, and journalists" },
  { emoji: "📺", label: "Casual watchers who love the vibe" },
  { emoji: "🎨", label: "Sports culture and fashion lovers" },
];

const COMMUNITY_PROFILES = [
  { name: "Maya J.", sport: "NBA", avatar: "🏀", text: "Finally a space where my basketball takes aren't dismissed." },
  { name: "Priya R.", sport: "F1", avatar: "🏎️", text: "Found my F1 community here — race weekends are so much better now." },
  { name: "Aisha K.", sport: "NWSL", avatar: "⚽", text: "Connecting with other women soccer fans has been amazing." },
];

const Index = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleJoin = () => navigate(user ? "/home" : "/auth");
  const handleExplore = () => navigate(user ? "/explore" : "/auth");

  return (
    <div className="landing-theme min-h-screen bg-[hsl(var(--background))] text-[hsl(var(--foreground))] overflow-x-hidden">
      {/* ═══════════════════════ NAVBAR ═══════════════════════ */}
      <nav className="fixed top-0 inset-x-0 z-50 backdrop-blur-md bg-[hsl(var(--background)/.85)] border-b border-[hsl(var(--border))]">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-5 h-16">
          <img src={loverballLogo} alt="Loverball" className="h-10 w-auto" />

          {/* Desktop links */}
          <div className="hidden md:flex items-center gap-8 text-sm font-medium">
            {["About", "Community", "Features", "Join"].map((l) => (
              <a key={l} href={`#${l.toLowerCase()}`} className="opacity-70 hover:opacity-100 transition-opacity">
                {l}
              </a>
            ))}
          </div>

          <Button onClick={handleJoin} size="sm" className="hidden md:inline-flex bg-white text-[hsl(160,70%,30%)] hover:bg-white/90 rounded-full font-bold">
            Join the Community
          </Button>

          {/* Mobile hamburger */}
          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden p-2 -mr-2" aria-label="Menu">
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {mobileMenuOpen && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="md:hidden border-t border-[hsl(var(--border))] bg-[hsl(var(--background))] px-5 pb-5 pt-3 space-y-3">
            {["About", "Community", "Features", "Join"].map((l) => (
              <a key={l} href={`#${l.toLowerCase()}`} onClick={() => setMobileMenuOpen(false)} className="block py-2 text-sm font-medium opacity-80 hover:opacity-100">
                {l}
              </a>
            ))}
            <Button onClick={handleJoin} className="w-full bg-[hsl(var(--landing-orange))] text-white rounded-full">
              Join the Community
            </Button>
          </motion.div>
        )}
      </nav>

      {/* ═══════════════════════ HERO ═══════════════════════ */}
      <section className="relative pt-32 pb-20 md:pt-44 md:pb-32 px-5">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={0}>
            <span className="inline-block text-xs font-bold tracking-widest uppercase opacity-80 mb-4">
              Now in early access
            </span>
            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-[1.08] tracking-tight mb-4">
              HER GAME.<br />HER COMMUNITY.
            </h1>
            <p className="text-lg font-semibold opacity-90 mb-2">
              The community platform for women who love sports.
            </p>
            <p className="text-base sm:text-lg opacity-70 max-w-lg mb-8 leading-relaxed">
              Connect with women who live for the game — from fans and athletes to analysts and storytellers.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button onClick={handleJoin} size="lg" className="bg-white text-[hsl(160,70%,30%)] hover:bg-white/90 rounded-full gap-2 font-bold">
                Join the Community <ArrowRight className="w-4 h-4" />
              </Button>
              <Button onClick={handleExplore} size="lg" variant="outline" className="border-white/40 text-white hover:bg-white/10 rounded-full">
                Explore the Platform
              </Button>
            </div>
          </motion.div>

          <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={2} className="relative hidden md:block">
            <div className="grid grid-cols-2 gap-3">
              <img src={communityImage} alt="Women celebrating at a game" className="rounded-2xl object-cover h-64 w-full" />
              <img src={fansImage} alt="Fans watching sports together" className="rounded-2xl object-cover h-64 w-full mt-8" />
            </div>
            <div className="absolute -bottom-4 -left-4 bg-white text-[hsl(160,70%,30%)] rounded-xl px-4 py-2.5 text-sm font-bold shadow-lg flex items-center gap-2">
              <Users className="w-4 h-4" /> 2,000+ members & growing
            </div>
          </motion.div>
        </div>
      </section>

      {/* ═══════════════════════ PROBLEM ═══════════════════════ */}
      <section id="about" className="py-20 md:py-28 px-5 bg-[hsl(var(--landing-navy-light))]">
        <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} className="max-w-3xl mx-auto text-center">
          <span className="inline-block text-xs font-bold tracking-widest uppercase text-[hsl(var(--landing-orange))] mb-4">
            The problem
          </span>
          <h2 className="font-display text-3xl sm:text-4xl font-extrabold mb-6">
            Sports culture wasn't built with women in mind.
          </h2>
          <p className="text-lg opacity-65 leading-relaxed max-w-2xl mx-auto">
            Women love sports just as much as anyone, but many online sports spaces feel dismissive, toxic, or unwelcoming. Great conversations about the games we love shouldn't feel like a battle just to be heard.
          </p>
        </motion.div>
      </section>

      {/* ═══════════════════════ SOLUTION ═══════════════════════ */}
      <section className="py-20 md:py-28 px-5">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-14 items-center">
          <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}>
            <span className="inline-block text-xs font-bold tracking-widest uppercase text-[hsl(var(--landing-orange))] mb-4">
              The solution
            </span>
            <h2 className="font-display text-3xl sm:text-4xl font-extrabold mb-6">
              A better space for sports conversations.
            </h2>
            <p className="text-lg opacity-65 leading-relaxed">
              Loverball is a community platform designed for women who love sports. Here you can talk games, share your voice, connect with other fans, and celebrate the sports culture you care about.
            </p>
          </motion.div>
          <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={1}>
            <img src={athletesImage} alt="Women in sports culture" className="rounded-2xl object-cover w-full h-80" />
          </motion.div>
        </div>
      </section>

      {/* ═══════════════════════ FEATURES ═══════════════════════ */}
      <section id="features" className="py-20 md:py-28 px-5 bg-[hsl(var(--landing-navy-light))]">
        <div className="max-w-6xl mx-auto">
          <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} className="text-center mb-14">
            <span className="inline-block text-xs font-bold tracking-widest uppercase text-[hsl(var(--landing-orange))] mb-4">
              Features
            </span>
            <h2 className="font-display text-3xl sm:text-4xl font-extrabold">
              Everything you need to be a sports fan.
            </h2>
          </motion.div>

          <div className="grid sm:grid-cols-2 gap-5">
            {FEATURES.map((f, i) => (
              <motion.div
                key={f.title}
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                custom={i}
                className="group bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-2xl p-6 hover:border-[hsl(var(--landing-orange)/.4)] transition-colors duration-300"
              >
                <div className="w-10 h-10 rounded-xl bg-[hsl(var(--landing-orange)/.12)] flex items-center justify-center mb-4 group-hover:bg-[hsl(var(--landing-orange)/.2)] transition-colors">
                  <f.icon className="w-5 h-5 text-[hsl(var(--landing-orange))]" />
                </div>
                <h3 className="font-display font-bold text-lg mb-2">{f.title}</h3>
                <p className="text-sm opacity-60 leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════ WHO IT'S FOR ═══════════════════════ */}
      <section className="py-20 md:py-28 px-5">
        <div className="max-w-3xl mx-auto text-center">
          <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}>
            <span className="inline-block text-xs font-bold tracking-widest uppercase text-[hsl(var(--landing-orange))] mb-4">
              Who it's for
            </span>
            <h2 className="font-display text-3xl sm:text-4xl font-extrabold mb-10">
              If you love sports, you belong here.
            </h2>
          </motion.div>

          <div className="space-y-3 max-w-md mx-auto mb-10">
            {AUDIENCE.map((a, i) => (
              <motion.div
                key={a.label}
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                custom={i}
                className="flex items-center gap-3 bg-[hsl(var(--secondary))] rounded-xl px-5 py-3 text-left"
              >
                <span className="text-xl">{a.emoji}</span>
                <span className="text-sm font-medium">{a.label}</span>
              </motion.div>
            ))}
          </div>

          <motion.p variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} className="opacity-60 text-lg">
            Sports are better when the community around them is strong.
          </motion.p>
        </div>
      </section>

      {/* ═══════════════════════ COMMUNITY ═══════════════════════ */}
      <section id="community" className="py-20 md:py-28 px-5 bg-[hsl(var(--landing-navy-light))]">
        <div className="max-w-6xl mx-auto">
          <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} className="text-center mb-14">
            <span className="inline-block text-xs font-bold tracking-widest uppercase text-[hsl(var(--landing-orange))] mb-4">
              Community
            </span>
            <h2 className="font-display text-3xl sm:text-4xl font-extrabold mb-4">
              Sports are better together.
            </h2>
            <p className="opacity-60 text-lg max-w-xl mx-auto">
              See what members are saying inside Loverball.
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-3 gap-5">
            {COMMUNITY_PROFILES.map((p, i) => (
              <motion.div
                key={p.name}
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                custom={i}
                className="bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-2xl p-6"
              >
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-2xl">{p.avatar}</span>
                  <div>
                    <p className="font-bold text-sm">{p.name}</p>
                    <p className="text-xs opacity-50">{p.sport} fan</p>
                  </div>
                </div>
                <p className="text-sm opacity-70 leading-relaxed italic">"{p.text}"</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════ FINAL CTA ═══════════════════════ */}
      <section id="join" className="py-24 md:py-32 px-5">
        <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} className="max-w-2xl mx-auto text-center">
          <Trophy className="w-10 h-10 text-[hsl(var(--landing-orange))] mx-auto mb-6" />
          <h2 className="font-display text-3xl sm:text-4xl font-extrabold mb-4">
            Join the Loverball community.
          </h2>
          <p className="opacity-60 text-lg mb-8 max-w-lg mx-auto">
            Be part of a new era of sports conversation. Free to join.
          </p>
          <Button onClick={handleJoin} size="lg" className="bg-[hsl(var(--landing-orange))] hover:bg-[hsl(var(--landing-orange)/.85)] text-white rounded-full gap-2 text-base px-8">
            Join the Community <ArrowRight className="w-4 h-4" />
          </Button>
        </motion.div>
      </section>

      {/* ═══════════════════════ FOOTER ═══════════════════════ */}
      <footer className="border-t border-[hsl(var(--border))] py-12 px-5">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <img src={loverballLogo} alt="Loverball" className="h-8 w-auto opacity-70" />
          </div>

          <div className="flex items-center gap-6 text-sm opacity-50">
            <a href="#about" className="hover:opacity-100 transition-opacity">About</a>
            <a href="#features" className="hover:opacity-100 transition-opacity">Features</a>
            <a href="#community" className="hover:opacity-100 transition-opacity">Community</a>
            <button onClick={() => navigate("/terms")} className="hover:opacity-100 transition-opacity">Terms</button>
            <button onClick={() => navigate("/privacy")} className="hover:opacity-100 transition-opacity">Privacy</button>
          </div>

          <p className="text-xs opacity-40">© {new Date().getFullYear()} Loverball. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;

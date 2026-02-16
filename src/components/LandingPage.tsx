import { motion } from "framer-motion";
import { ArrowRight, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import heroImage from "@/assets/hero-women.png";
import athletesImage from "@/assets/landing-athletes.jpg";
import communityImage from "@/assets/landing-community.jpg";
import fansImage from "@/assets/landing-fans.jpg";
import loverballLogo from "@/assets/loverball-script-logo.png";

const channels = [
  { name: "WNBA Coverage", sport: "Basketball", desc: "Game recaps, player spotlights, and insider analysis of every WNBA season moment.", image: "https://a.espncdn.com/i/teamlogos/wnba/500/la.png" },
  { name: "Angel City FC", sport: "Soccer", desc: "Match previews, fan culture, and behind-the-scenes access to LA's favorite NWSL club.", image: "https://a.espncdn.com/i/teamlogos/soccer/500/6926.png" },
  { name: "NCAA Women's", sport: "College Sports", desc: "March Madness, volleyball, track & field — covering the athletes before they go pro.", image: "https://a.espncdn.com/i/teamlogos/ncaa/500/26.png" },
  { name: "Tennis & Golf", sport: "Individual Sports", desc: "Grand Slam stories, LPGA highlights, and the personalities shaping women's individual sports.", image: "https://a.espncdn.com/i/teamlogos/leagues/500/wta.png" },
  { name: "Olympics 2028", sport: "LA28", desc: "Countdown to LA28 — athlete profiles, event previews, and the road to the Games.", image: "https://upload.wikimedia.org/wikipedia/en/thumb/a/a7/2028_Summer_Olympics_logo.svg/200px-2028_Summer_Olympics_logo.svg.png" },
  { name: "Culture & Style", sport: "Lifestyle", desc: "Where sports meets fashion, wellness, and the culture that surrounds the game.", image: "https://a.espncdn.com/i/teamlogos/soccer/500/5765.png" },
];

const LandingPage = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");

  return (
    <div className="min-h-screen bg-background">
      {/* Coral scrolling ticker */}
      <div className="bg-primary py-2 overflow-hidden">
        <motion.div
          animate={{ x: [0, -1200] }}
          transition={{ duration: 14, repeat: Infinity, ease: "linear" }}
          className="flex gap-16 whitespace-nowrap"
        >
          {[...Array(12)].map((_, i) => (
            <span key={i} className="flex items-center gap-16 text-xs tracking-[0.4em] font-sans font-bold text-primary-foreground/90 uppercase">
              <span>Her Game Her Rules</span>
              <span className="text-primary-foreground/40">♦</span>
              <span>Join the Movement</span>
              <span className="text-primary-foreground/40">♦</span>
            </span>
          ))}
        </motion.div>
      </div>

      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-primary">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="flex items-center justify-between h-16">
            <button className="text-primary-foreground/80 hover:text-primary-foreground transition-colors">
              <Menu className="w-5 h-5" />
            </button>
            <img src={loverballLogo} alt="Loverball" className="h-24 w-auto absolute left-1/2 -translate-x-1/2 brightness-0 invert" />
            <div className="hidden md:flex items-center gap-8">
              <a href="#content" className="text-xs font-sans tracking-widest uppercase text-primary-foreground/70 hover:text-primary-foreground transition-colors">Content</a>
              <a href="#about" className="text-xs font-sans tracking-widest uppercase text-primary-foreground/70 hover:text-primary-foreground transition-colors">About</a>
            </div>
            <Button
              onClick={() => navigate("/following")}
              className="rounded-full bg-white text-primary hover:bg-white/90 font-sans text-xs tracking-widest uppercase px-6"
            >
              Join Now
            </Button>
          </div>
        </div>
      </nav>

      {/* ═══════════════════════════════════════════
          HERO — Full coral, headline + 3 polaroids
         ═══════════════════════════════════════════ */}
      <section className="relative bg-primary py-24 lg:py-36 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="grid lg:grid-cols-2 gap-12 items-center min-h-[520px]">
            {/* Headline side */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, ease: "easeOut" }}
            >
              <p className="script-accent text-white/50 mb-4">welcome to loverball</p>
              <h1 className="text-5xl sm:text-6xl lg:text-[4.75rem] font-display text-white leading-[0.93] mb-8">
                Where Her <em>Game</em><br />
                Meets Her<br />
                <em>Community</em>
              </h1>
              <p className="text-lg text-white/75 font-serif leading-relaxed mb-12 max-w-md">
                The content and community platform built for women who live and breathe sports. Real stories, real connections, real culture — all in one place.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  onClick={() => navigate("/following")}
                  size="lg"
                  className="rounded-full bg-white text-primary hover:bg-white/90 px-10 py-7 text-base font-sans tracking-widest uppercase shadow-2xl"
                >
                  Join Loverball
                </Button>
                <Button
                  onClick={() => {
                    document.getElementById("content")?.scrollIntoView({ behavior: "smooth" });
                  }}
                  size="lg"
                  className="rounded-full bg-transparent border-2 border-white/40 text-white hover:bg-white/10 px-10 py-7 text-base font-sans tracking-widest uppercase"
                >
                  How It Works
                </Button>
              </div>
            </motion.div>

            {/* 3 Polaroid photos — asymmetric */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1, delay: 0.3 }}
              className="relative hidden lg:block h-[540px]"
            >
              <div className="polaroid absolute top-0 right-4 w-56 z-10">
                <img src={athletesImage} alt="Athletes" className="w-full aspect-square object-cover" />
                <p className="text-center mt-1 font-serif text-xs text-foreground/50 italic">game day ✨</p>
              </div>
              <div className="polaroid-alt absolute top-32 -left-4 w-48 z-20">
                <img src={communityImage} alt="Community" className="w-full aspect-square object-cover" />
                <p className="text-center mt-1 font-serif text-xs text-foreground/50 italic">squad goals</p>
              </div>
              <div className="polaroid absolute bottom-0 right-14 w-52 rotate-[4deg] z-10">
                <img src={heroImage} alt="Sports culture" className="w-full aspect-[3/4] object-cover object-top" />
                <p className="text-center mt-1 font-serif text-xs text-foreground/50 italic">the culture</p>
              </div>
            </motion.div>

            {/* Mobile polaroid row */}
            <div className="flex gap-4 lg:hidden overflow-x-auto pb-4 -mx-2 px-2 scrollbar-hide">
              <div className="polaroid min-w-[160px]">
                <img src={athletesImage} alt="Athletes" className="w-full aspect-square object-cover" />
              </div>
              <div className="polaroid-alt min-w-[160px]">
                <img src={communityImage} alt="Community" className="w-full aspect-square object-cover" />
              </div>
              <div className="polaroid min-w-[160px]">
                <img src={heroImage} alt="Culture" className="w-full aspect-[3/4] object-cover object-top" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          FEATURED CONTENT — White bg, channel grid
         ═══════════════════════════════════════════ */}
      <section id="content" className="py-24 lg:py-32 bg-background">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <p className="text-xs font-sans tracking-[0.3em] uppercase text-foreground/50 mb-4">Featured Channels</p>
            <h2 className="font-display text-5xl md:text-6xl text-foreground">
              Content You'll <em className="text-primary">Love</em>
            </h2>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {channels.map((channel, i) => (
              <motion.div
                key={channel.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: i * 0.08 }}
                viewport={{ once: true }}
              >
                <div className="group bg-card border border-border rounded-2xl overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer h-full">
                  {/* Card top — sport type badge + logo */}
                  <div className="relative bg-lavender/50 p-8 flex items-center justify-center h-40">
                    <img
                      src={channel.image}
                      alt={channel.name}
                      className="w-20 h-20 object-contain group-hover:scale-110 transition-transform duration-300"
                      onError={e => { (e.target as HTMLImageElement).style.display = "none"; }}
                    />
                    <span className="absolute top-3 left-3 category-tag bg-primary/10 text-primary">{channel.sport}</span>
                  </div>
                  {/* Card body */}
                  <div className="p-6">
                    <h3 className="font-display text-xl text-foreground mb-2 group-hover:text-primary transition-colors normal-case">{channel.name}</h3>
                    <p className="font-serif text-foreground/60 leading-relaxed text-sm">{channel.desc}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          ABOUT — Lavender bg, coral headline, image
         ═══════════════════════════════════════════ */}
      <section id="about" className="bg-lavender py-24 lg:py-32 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
            >
              <p className="script-accent text-primary mb-2">about us</p>
              <h2 className="font-display text-5xl md:text-6xl text-primary mb-8 leading-[0.95]">
                Built for Women<br />
                Who Live &amp; <em>Breathe</em><br />
                Sports
              </h2>
              <p className="text-lg font-serif text-lavender-foreground/80 leading-relaxed mb-6">
                We believe every woman deserves a front-row seat — not just to the game, but to the <em className="font-bold">culture, community, and conversations</em> around it.
              </p>
              <p className="text-base font-serif text-lavender-foreground/60 leading-relaxed mb-10">
                Born in Los Angeles, Loverball is a content and community platform for the $28B women's sports market. From watch parties to original content, we're redefining what it means to be a fan.
              </p>
              <Button
                onClick={() => navigate("/following")}
                className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90 px-8 py-5 font-sans text-xs tracking-widest uppercase"
              >
                Learn More
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </motion.div>

            {/* Lifestyle image */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              viewport={{ once: true }}
              className="flex justify-center"
            >
              <div className="relative">
                <div className="polaroid-alt w-72 sm:w-80">
                  <img src={fansImage} alt="Women sports fans" className="w-full aspect-[3/4] object-cover" />
                  <p className="text-center mt-1 font-serif text-sm text-foreground/50 italic">our community 💛</p>
                </div>
                {/* Small accent polaroid */}
                <div className="polaroid absolute -bottom-8 -left-12 w-36 z-20 hidden sm:block">
                  <img src={communityImage} alt="Community event" className="w-full aspect-square object-cover" />
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          CTA — Coral bg, bold headline, email/button
         ═══════════════════════════════════════════ */}
      <section className="py-28 lg:py-36 bg-primary">
        <div className="max-w-3xl mx-auto px-6 lg:px-12 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <p className="script-accent text-white/50 mb-4">ready?</p>
            <h2 className="text-5xl sm:text-6xl lg:text-7xl font-display text-white mb-6 leading-[0.95] italic">
              Join the Community<br />
              Redefining <em>Fandom</em>
            </h2>
            <p className="text-lg font-serif text-white/60 mb-10 max-w-xl mx-auto leading-relaxed">
              Sign up to get early access to events, exclusive content, and connect with women who love the game as much as you do.
            </p>

            {/* Email capture */}
            <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto mb-6">
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="flex-1 px-6 py-4 rounded-full bg-white/15 border border-white/25 text-white placeholder:text-white/40 font-sans text-sm focus:outline-none focus:ring-2 focus:ring-white/50 backdrop-blur-sm"
              />
              <Button
                onClick={() => navigate("/following")}
                size="lg"
                className="rounded-full bg-white text-primary hover:bg-white/90 px-8 py-4 font-sans tracking-widest uppercase text-sm shadow-xl whitespace-nowrap"
              >
                Join Free
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-white/40 font-sans">Free to join. No credit card required.</p>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-16 bg-background">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="h-[2px] bg-primary/20 mb-12" />
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <img src={loverballLogo} alt="Loverball" className="h-14 w-auto" />
            <p className="text-sm text-foreground/40 font-sans">
              © 2026 Loverball. All rights reserved. Built by women, for women.
            </p>
            <div className="flex gap-6">
              <a href="/privacy" className="text-sm text-foreground/50 hover:text-primary transition-colors font-sans tracking-widest uppercase">Privacy</a>
              <a href="/terms" className="text-sm text-foreground/50 hover:text-primary transition-colors font-sans tracking-widest uppercase">Terms</a>
              <a href="#" className="text-sm text-foreground/50 hover:text-primary transition-colors font-sans tracking-widest uppercase">Contact</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;

import { motion } from "framer-motion";
import { ArrowRight, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import heroImage from "@/assets/hero-women.png";
import athletesImage from "@/assets/landing-athletes.jpg";
import communityImage from "@/assets/landing-community.jpg";
import loverballLogo from "@/assets/loverball-script-logo.png";

const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Top promo banner */}
      <div className="bg-foreground text-background text-center py-2 px-4">
        <p className="text-xs font-sans tracking-widest uppercase">
          Join the community redefining women's sports culture — <span className="underline cursor-pointer" onClick={() => navigate("/following")}>Get Started</span>
        </p>
      </div>

      {/* Navigation — Minimal editorial */}
      <nav className="sticky top-0 z-50 bg-background/98 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="flex items-center justify-between h-20">
            <button className="flex items-center gap-2 text-sm font-sans tracking-widest uppercase text-foreground/70 hover:text-foreground transition-colors">
              <Menu className="w-5 h-5" />
            </button>

            <img src={loverballLogo} alt="Loverball" className="h-40 w-auto absolute left-1/2 -translate-x-1/2" />

            <div className="hidden md:flex items-center gap-8">
              <a href="#about" className="text-sm font-sans tracking-widest uppercase text-foreground/60 hover:text-foreground transition-colors">About</a>
              <a href="#features" className="text-sm font-sans tracking-widest uppercase text-foreground/60 hover:text-foreground transition-colors">Features</a>
              <a href="#community" className="text-sm font-sans tracking-widest uppercase text-foreground/60 hover:text-foreground transition-colors">Community</a>
            </div>

            <Button 
              onClick={() => navigate("/following")} 
              className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90 font-sans text-xs tracking-widest uppercase px-6"
            >
              Join
            </Button>
          </div>
        </div>
        {/* Yellow accent line */}
        <div className="h-[2px] bg-primary" />
      </nav>

      {/* Hero Section — Full lifestyle image with yellow headline overlay */}
      <section className="relative min-h-[90vh] flex items-center overflow-hidden">
        <div className="absolute inset-0">
          <img
            src={heroImage}
            alt="Women in sports community"
            className="w-full h-full object-cover object-[center_35%]"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-foreground/60 via-foreground/30 to-transparent" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-12 w-full">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="max-w-2xl"
          >
            <h1 className="text-6xl sm:text-7xl lg:text-8xl font-display text-primary leading-[0.95] mb-8">
              Her Game.<br />
              Her Community.<br />
              <span className="italic text-background">Her Story.</span>
            </h1>
            <p className="text-lg text-background/80 font-serif leading-relaxed mb-10 max-w-md">
              Where women's sports culture meets connection, storytelling, and sisterhood.
            </p>
          </motion.div>
        </div>

        {/* Yellow pill CTA floating bottom right */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.6 }}
          className="absolute bottom-12 right-12 z-20 hidden md:block"
        >
          <Button
            onClick={() => navigate("/following")}
            size="lg"
            className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90 px-10 py-7 text-base font-sans tracking-widest uppercase shadow-2xl"
          >
            Join Loverball
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </motion.div>
      </section>

      {/* Thin yellow divider */}
      <div className="h-[3px] bg-primary" />

      {/* Introduction Section — Warm beige background */}
      <section id="about" className="py-24 lg:py-32 bg-secondary">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="grid lg:grid-cols-2 gap-16 lg:gap-24 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
            >
              <p className="text-xs font-sans tracking-[0.3em] uppercase text-foreground/50 mb-4">
                Our Story
              </p>
              <h2 className="font-display text-5xl md:text-6xl text-foreground mb-2">
                Hi! We're{" "}
                <span className="relative inline-block">
                  Loverball
                  <span className="absolute -bottom-1 left-0 w-full h-[3px] bg-primary" />
                </span>
              </h2>
              <p className="text-xl font-serif text-foreground/80 leading-relaxed mt-8 mb-6">
                We specialize in creating <em className="font-bold">tailored</em> sports content and experiences that drive engagement, build brand loyalty, and <em className="font-bold">inspire women.</em>
              </p>
              <p className="text-lg font-serif text-foreground/60 leading-relaxed mb-10">
                Born in Los Angeles, Loverball is a content and community platform for the $28B women's sports market. AI-powered stories, community events, and narrative-driven coverage — all built for her.
              </p>
              <Button
                onClick={() => navigate("/following")}
                className="rounded-full bg-accent text-accent-foreground hover:bg-accent/90 px-8 py-5 font-sans text-xs tracking-widest uppercase"
              >
                Meet Us
              </Button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              viewport={{ once: true }}
              className="relative"
            >
              {/* Yellow border frame accent */}
              <div className="absolute -top-4 -left-4 w-full h-full border-2 border-primary rounded-lg" />
              <div className="relative aspect-[4/5] overflow-hidden rounded-lg shadow-xl">
                <img
                  src={athletesImage}
                  alt="Women athletes"
                  className="w-full h-full object-cover"
                />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Quote Section — Clean elegant */}
      <section className="py-24 bg-background">
        <div className="max-w-4xl mx-auto px-6 lg:px-12 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <span className="text-8xl font-display text-primary leading-none">"</span>
            <p className="text-3xl sm:text-4xl lg:text-5xl font-display text-foreground leading-[1.2] -mt-8">
              Sports aren't just games — they're
              <span className="italic"> culture, community,</span> and{" "}
              <span className="relative inline-block">
                connection
                <span className="absolute -bottom-1 left-0 w-full h-[3px] bg-primary" />
              </span>
            </p>
            <p className="text-sm font-sans tracking-widest uppercase text-foreground/40 mt-8">
              — The Loverball Philosophy
            </p>
          </motion.div>
        </div>
      </section>

      {/* Thin yellow divider */}
      <div className="h-[2px] bg-primary" />

      {/* Features — Editorial cards */}
      <section id="features" className="py-24 lg:py-32 bg-background">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="text-center mb-20">
            <p className="text-xs font-sans tracking-[0.3em] uppercase text-foreground/50 mb-4">
              What We Offer
            </p>
            <h2 className="font-display text-5xl md:text-6xl text-foreground">
              Built For Her
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-10">
            {[
              {
                num: "01",
                title: "AI-Powered Stories",
                desc: "Personalized sports content that speaks to what you care about. Beyond stats — the stories, drama, and culture.",
              },
              {
                num: "02",
                title: "Community Events",
                desc: "Watch parties, meetups, and experiences designed for women who love sports. Find your squad.",
              },
              {
                num: "03",
                title: "Exclusive Content",
                desc: "Behind-the-scenes access, player interviews, and insider perspectives you won't find anywhere else.",
              },
            ].map((feature, i) => (
              <motion.div
                key={feature.num}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: i * 0.12 }}
                viewport={{ once: true }}
                className="group"
              >
                <div className="border border-border p-10 rounded-lg hover:border-primary transition-colors duration-300 h-full">
                  <span className="font-display text-7xl text-primary/30 leading-none block mb-6">
                    {feature.num}
                  </span>
                  <h3 className="text-2xl font-display text-foreground mb-4 normal-case">
                    {feature.title}
                  </h3>
                  <p className="text-foreground/60 leading-relaxed font-serif">
                    {feature.desc}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Community Section — Image + text alternating */}
      <section id="community" className="py-24 lg:py-32 bg-secondary">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="grid lg:grid-cols-2 gap-16 lg:gap-24 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="relative order-2 lg:order-1"
            >
              <div className="relative aspect-[16/10] overflow-hidden rounded-lg shadow-xl">
                <img
                  src={communityImage}
                  alt="Loverball community"
                  className="w-full h-full object-cover"
                />
              </div>
              {/* Yellow frame accent offset */}
              <div className="absolute -bottom-4 -right-4 w-full h-full border-2 border-primary rounded-lg -z-10" />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              viewport={{ once: true }}
              className="order-1 lg:order-2"
            >
              <p className="text-xs font-sans tracking-[0.3em] uppercase text-foreground/50 mb-4">
                Join Us
              </p>
              <h2 className="font-display text-5xl md:text-6xl text-foreground mb-8">
                Our Community
              </h2>

              <div className="grid grid-cols-3 gap-6 mb-10">
                {[
                  { value: "10K+", label: "Members" },
                  { value: "500+", label: "Stories" },
                  { value: "50+", label: "Events" },
                ].map((stat) => (
                  <div key={stat.label} className="text-center">
                    <p className="font-display text-4xl text-primary">{stat.value}</p>
                    <p className="text-xs font-sans tracking-widest uppercase text-foreground/50 mt-1">{stat.label}</p>
                  </div>
                ))}
              </div>

              <p className="text-lg font-serif text-foreground/70 leading-relaxed mb-8">
                Connect with thousands of women who share your passion for sports. Build real friendships, discover new content, and celebrate your fandom together.
              </p>
              <Button
                onClick={() => navigate("/following")}
                className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90 px-8 py-5 font-sans text-xs tracking-widest uppercase"
              >
                Explore Community
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Final CTA — Clean, centered, editorial */}
      <section className="py-32 bg-foreground">
        <div className="max-w-3xl mx-auto px-6 lg:px-12 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className="text-5xl sm:text-6xl lg:text-7xl font-display text-primary mb-8 leading-[0.95]">
              Ready to Join<br />the Movement?
            </h2>
            <p className="text-lg font-serif text-background/60 mb-12 max-w-xl mx-auto leading-relaxed">
              Be part of the community redefining women's sports fandom.
            </p>
            <Button
              size="lg"
              onClick={() => navigate("/following")}
              className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90 text-base px-12 py-7 font-sans tracking-widest uppercase shadow-2xl"
            >
              Get Started
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Footer — Warm sand */}
      <footer className="py-16 bg-secondary">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="h-[2px] bg-primary mb-12" />
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <img src={loverballLogo} alt="Loverball" className="h-14 w-auto" />
            <p className="text-sm text-foreground/40 font-sans">
              © 2026 Loverball. All rights reserved. Built by women, for women.
            </p>
            <div className="flex gap-6">
              <a href="/privacy" className="text-sm text-foreground/50 hover:text-foreground transition-colors font-sans tracking-widest uppercase">Privacy</a>
              <a href="/terms" className="text-sm text-foreground/50 hover:text-foreground transition-colors font-sans tracking-widest uppercase">Terms</a>
              <a href="#" className="text-sm text-foreground/50 hover:text-foreground transition-colors font-sans tracking-widest uppercase">Contact</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;

import { motion } from "framer-motion";
import { ArrowRight, Plus, Minus, Sparkles, Calendar, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import heroImage from "@/assets/hero-women.png";
import athletesImage from "@/assets/landing-athletes.jpg";
import communityImage from "@/assets/landing-community.jpg";
import loverballLogo from "@/assets/loverball-script-logo.png";

const LandingPage = () => {
  const navigate = useNavigate();
  const [openAccordion, setOpenAccordion] = useState<number | null>(0);

  const features = [
    {
      icon: Sparkles,
      title: "AI-Powered Stories",
      description: "Personalized sports content that speaks to what you care about. Beyond stats—the stories, drama, and culture that make women's sports compelling.",
    },
    {
      icon: Calendar,
      title: "Community Events",
      description: "Watch parties, meetups, and experiences designed for women who love sports. Find your squad and connect with like-minded fans.",
    },
    {
      icon: Users,
      title: "Exclusive Content",
      description: "Behind-the-scenes access, player interviews, and insider perspectives you won't find anywhere else.",
    },
  ];

  const accordionItems = [
    {
      title: "Narrative-Driven Coverage",
      description: "Sports coverage that goes beyond the scoreboard. We tell the stories that matter to female fans.",
    },
    {
      title: "Member Network",
      description: "Connect with thousands of women who share your passion for sports. Build relationships that extend beyond the game.",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation - Bold Editorial */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border/50">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="flex items-center justify-between h-20">
            <div className="hidden md:flex items-center gap-2">
              <a href="#about" className="px-5 py-2 text-sm font-bold tracking-wider uppercase text-foreground/70 hover:text-primary hover:bg-primary/5 rounded-full transition-all">
                About
              </a>
              <a href="#features" className="px-5 py-2 text-sm font-bold tracking-wider uppercase text-foreground/70 hover:text-primary hover:bg-primary/5 rounded-full transition-all">
                Features
              </a>
              <a href="#community" className="px-5 py-2 text-sm font-bold tracking-wider uppercase text-foreground/70 hover:text-primary hover:bg-primary/5 rounded-full transition-all">
                Community
              </a>
            </div>
            
            <img src={loverballLogo} alt="Loverball" className="h-32 w-auto absolute left-1/2 -translate-x-1/2" />
            
            <div className="hidden md:flex items-center gap-3">
              <a href="#" className="px-5 py-2 text-sm font-bold tracking-wider uppercase text-foreground/70 hover:text-primary hover:bg-primary/5 rounded-full transition-all">
                Events
              </a>
              <a href="#" className="px-5 py-2 text-sm font-bold tracking-wider uppercase text-foreground/70 hover:text-primary hover:bg-primary/5 rounded-full transition-all">
                Shop
              </a>
              <Button onClick={() => navigate("/following")} className="rounded-full px-6">
                Join Now
              </Button>
            </div>
            
            <Button onClick={() => navigate("/following")} size="sm" className="md:hidden rounded-full">
              Join
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section — Overlapping Editorial */}
      <section className="pt-20 min-h-screen relative bg-background">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-0 items-center min-h-[calc(100vh-80px)] py-12">
            
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
                  className="w-full h-full object-cover object-[center_35%]"
                />
              </div>
              <div className="absolute -bottom-4 -right-4 lg:right-auto lg:-left-8 bg-accent text-accent-foreground px-6 py-3 rounded-full shadow-lg">
                <span className="text-sm font-bold tracking-wider">Est. 2024</span>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="relative order-2 lg:-ml-24 z-10"
            >
              <div className="color-block-blue p-8 sm:p-12 lg:p-14 rounded-2xl shadow-2xl">
                <p className="text-white/60 text-sm font-bold tracking-[0.3em] mb-6 uppercase">
                  Hey Friend.
                </p>
                <h1 className="text-5xl sm:text-6xl lg:text-7xl font-display leading-none mb-6 text-white uppercase tracking-tight">
                  Let's Elevate<br />
                  Your Sports<br />
                  <span className="font-script normal-case text-accent">Experience</span>
                </h1>
                <p className="text-white/80 text-lg leading-relaxed mb-8 max-w-md font-sans normal-case">
                  We're a community platform for women who love sports—where stories, connection, and culture meet her passion for the game.
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button 
                    onClick={() => navigate("/following")}
                    size="lg"
                    variant="accent"
                    className="rounded-full px-8 py-6 text-base"
                  >
                    Learn More
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Scrolling Ticker */}
      <div className="color-block-coral py-4 overflow-hidden">
        <motion.div
          animate={{ x: [0, -1000] }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="flex gap-12 whitespace-nowrap"
        >
          {[...Array(10)].map((_, i) => (
            <span key={i} className="flex items-center gap-12 text-sm tracking-[0.3em] font-bold text-white/90">
              <span>WOMEN'S SPORTS ELEVATED</span>
              <span className="text-white/40">◆</span>
              <span>JOIN THE MOVEMENT</span>
              <span className="text-white/40">◆</span>
            </span>
          ))}
        </motion.div>
      </div>

      {/* Statement Section — Quote Block */}
      <section className="py-24 bg-background">
        <div className="max-w-5xl mx-auto px-6 lg:px-12 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="quote-card color-block-blue rounded-3xl"
          >
            <p className="text-2xl sm:text-3xl lg:text-4xl text-white leading-relaxed font-sans relative z-10">
              We specialize in creating{" "}
              <span className="italic font-bold">tailored</span>{" "}
              sports content and experiences that drive engagement, build brand loyalty, and{" "}
              <span className="italic font-bold">inspire women.</span>
            </p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            viewport={{ once: true }}
            className="mt-10"
          >
            <Button 
              onClick={() => navigate("/following")}
              variant="outline"
              size="lg"
              className="rounded-full border-2 border-foreground text-foreground hover:bg-foreground hover:text-background px-8 py-6"
            >
              Take Me to the Community
            </Button>
          </motion.div>
        </div>
      </section>

      {/* About Section — Overlapping Image Grid */}
      <section id="about" className="py-24 lg:py-32 color-block-beige">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-0 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="aspect-[4/3] overflow-hidden rounded-2xl shadow-xl">
                <img
                  src={athletesImage}
                  alt="Women athletes"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="hidden lg:block absolute -bottom-8 -right-8 w-32 h-32 bg-accent/30 rounded-2xl -z-10" />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              viewport={{ once: true }}
              className="relative lg:-ml-20 z-10"
            >
              <div className="color-block-terracotta p-8 sm:p-12 rounded-2xl shadow-2xl">
                <span className="category-tag bg-white/20 text-white mb-6 inline-block">
                  About Loverball
                </span>
                <h2 className="text-white mt-4 mb-6">About Us</h2>
                <p className="text-lg leading-relaxed mb-4 text-white/90 font-sans normal-case">
                  <strong>85% of household purchasing decisions</strong> are made by women. Yet we're overlooked in sports coverage and community.
                </p>
                <p className="text-lg leading-relaxed mb-8 text-white/90 font-sans normal-case">
                  Loverball is a content and community platform for the <strong>$28B women's sports market</strong>. AI-powered stories, community events, and narrative-driven coverage tailored to female fans.
                </p>
                <Button 
                  onClick={() => navigate("/following")}
                  size="lg"
                  className="rounded-full bg-white text-foreground hover:bg-white/90 px-8"
                >
                  Learn More
                </Button>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section — Bold Color Cards */}
      <section id="features" className="py-24 lg:py-32 bg-background">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <span className="category-tag bg-accent text-accent-foreground mb-6 inline-block">
              Our Services
            </span>
            <h2 className="text-foreground mt-4">
              Built For Her
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8 mb-16">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="group"
              >
                <div className="bg-card p-8 rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.04)] hover:shadow-[0_12px_40px_rgba(0,0,0,0.10)] transition-all duration-300 h-full border border-border/50 hover:-translate-y-1">
                  <div className="w-14 h-14 bg-primary/15 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-primary group-hover:text-white transition-colors duration-300">
                    <feature.icon className="h-7 w-7 text-primary group-hover:text-white transition-colors duration-300" />
                  </div>
                  <h4 className="text-xl font-bold text-foreground mb-4 group-hover:text-primary transition-colors duration-300">
                    {feature.title}
                  </h4>
                  <p className="text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Accordion */}
          <div className="max-w-3xl mx-auto border-t border-border/50">
            {accordionItems.map((item, index) => (
              <div key={item.title} className="border-b border-border/50">
                <button
                  onClick={() => setOpenAccordion(openAccordion === index ? null : index)}
                  className="w-full py-6 flex items-center justify-between text-left hover:text-primary transition-colors"
                >
                  <span className="text-xl font-bold text-foreground">{item.title}</span>
                  {openAccordion === index ? (
                    <Minus className="h-5 w-5 text-accent shrink-0" />
                  ) : (
                    <Plus className="h-5 w-5 text-muted-foreground shrink-0" />
                  )}
                </button>
                <motion.div
                  initial={false}
                  animate={{ height: openAccordion === index ? "auto" : 0, opacity: openAccordion === index ? 1 : 0 }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden"
                >
                  <p className="pb-6 text-muted-foreground leading-relaxed max-w-2xl">
                    {item.description}
                  </p>
                </motion.div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Community Section */}
      <section id="community" className="py-24 lg:py-32 color-block-beige">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <span className="category-tag bg-primary text-primary-foreground mb-6 inline-block">
              Join Us
            </span>
            <h2 className="text-foreground mt-4">
              Our Community
            </h2>
          </motion.div>

          {/* Stats Grid */}
          <div className="grid md:grid-cols-3 gap-8 mb-16">
            {[
              { value: "10K+", label: "Active Members", desc: "Women who share your passion", color: "color-block-blue" },
              { value: "500+", label: "Stories", desc: "AI-powered content weekly", color: "color-block-coral" },
              { value: "50+", label: "Events", desc: "Community experiences monthly", color: "color-block-terracotta" },
            ].map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                className={`${stat.color} p-8 rounded-2xl text-center`}
              >
                <p className="font-display text-6xl sm:text-7xl text-white mb-2 uppercase">{stat.value}</p>
                <p className="text-lg font-bold text-white mb-1">{stat.label}</p>
                <p className="text-sm text-white/70">{stat.desc}</p>
              </motion.div>
            ))}
          </div>

          {/* Community Image */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="relative max-w-4xl mx-auto"
          >
            <div className="aspect-[16/9] overflow-hidden rounded-2xl shadow-xl">
              <img
                src={communityImage}
                alt="Loverball community"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="hidden lg:block absolute -top-6 -left-6 w-24 h-24 bg-primary/20 rounded-2xl -z-10" />
            <div className="hidden lg:block absolute -bottom-6 -right-6 w-24 h-24 bg-accent/20 rounded-2xl -z-10" />
          </motion.div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-28 color-block-blue">
        <div className="max-w-4xl mx-auto px-6 lg:px-12 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className="text-5xl sm:text-6xl lg:text-7xl font-display text-white mb-6 uppercase tracking-tight">
              Ready to Join?
            </h2>
            <p className="text-xl text-white/70 mb-10 max-w-2xl mx-auto font-sans normal-case">
              Be part of the movement redefining women's sports fandom.
            </p>
            <Button 
              size="lg"
              onClick={() => navigate("/following")}
              variant="accent"
              className="rounded-full text-lg px-10 py-7 shadow-xl"
            >
              Explore Now
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-16 bg-foreground">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <img src={loverballLogo} alt="Loverball" className="h-14 w-auto brightness-0 invert" />
            <p className="text-sm text-background/40">
              © 2026 Loverball. All rights reserved. Built by women, for women.
            </p>
            <div className="flex gap-6">
              <a href="/privacy" className="text-sm text-background/50 hover:text-background transition-colors">Privacy</a>
              <a href="/terms" className="text-sm text-background/50 hover:text-background transition-colors">Terms</a>
              <a href="#" className="text-sm text-background/50 hover:text-background transition-colors">Contact</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;

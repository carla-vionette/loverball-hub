import { motion } from "framer-motion";
import { ArrowRight, Plus, Minus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import heroImage from "@/assets/hero-women.png";
import athletesImage from "@/assets/landing-athletes.jpg";
import communityImage from "@/assets/landing-community.jpg";
import loverballLogo from "@/assets/loverball-logo-new.png";

const LandingPage = () => {
  const navigate = useNavigate();
  const [openAccordion, setOpenAccordion] = useState<number | null>(0);

  const features = [
    {
      title: "AI-Powered Stories",
      description: "Personalized sports content that speaks to what you care about. Beyond stats—the stories, drama, and culture that make women's sports compelling.",
    },
    {
      title: "Community Events",
      description: "Watch parties, meetups, and experiences designed for women who love sports. Find your squad and connect with like-minded fans.",
    },
    {
      title: "Exclusive Content",
      description: "Behind-the-scenes access, player interviews, and insider perspectives you won't find anywhere else.",
    },
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
      {/* Navigation - Centered Logo */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background border-b border-border/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Left nav links */}
            <div className="hidden md:flex items-center gap-6">
              <a href="#about" className="text-xs font-medium tracking-wider text-foreground/70 hover:text-primary transition-colors uppercase">About</a>
              <a href="#features" className="text-xs font-medium tracking-wider text-foreground/70 hover:text-primary transition-colors uppercase">Features</a>
              <a href="#community" className="text-xs font-medium tracking-wider text-foreground/70 hover:text-primary transition-colors uppercase">Community</a>
            </div>
            
            {/* Center logo */}
            <img src={loverballLogo} alt="Loverball" className="h-24 w-auto absolute left-1/2 -translate-x-1/2" />
            
            {/* Right nav links */}
            <div className="hidden md:flex items-center gap-6">
              <a href="#" className="text-xs font-medium tracking-wider text-foreground/70 hover:text-primary transition-colors uppercase">Events</a>
              <a href="#" className="text-xs font-medium tracking-wider text-foreground/70 hover:text-primary transition-colors uppercase">Shop</a>
              <Button onClick={() => navigate("/following")} size="sm" className="rounded-none bg-primary hover:bg-primary/90 text-xs tracking-wider">
                JOIN NOW
              </Button>
            </div>
            
            {/* Mobile button */}
            <Button onClick={() => navigate("/following")} size="sm" className="md:hidden rounded-none bg-primary hover:bg-primary/90">
              JOIN
            </Button>
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
                Let's Elevate<br />
                Your Sports<br />
                Experience
              </h1>
              <p className="text-foreground/70 text-sm leading-relaxed mb-8 max-w-sm">
                The platform where women's fandom controls the narrative. Stories, community, and culture—powered by passion for the games she loves.
              </p>
              <Button 
                onClick={() => navigate("/following")}
                className="rounded-none bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-6 text-sm tracking-wider"
              >
                LEARN MORE
              </Button>
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
                className="w-full h-full object-cover object-center"
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
                onClick={() => navigate("/following")}
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

      {/* Statement Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-background border-y border-border/30">
        <div className="max-w-5xl mx-auto text-center">
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-2xl sm:text-3xl lg:text-4xl text-foreground leading-relaxed"
          >
            We specialize in creating{" "}
            <span className="italic font-serif border-b-2 border-primary">tailored</span>{" "}
            sports content and experiences that drive engagement, build brand loyalty, and{" "}
            <span className="italic font-serif border-b-2 border-primary">inspire women.</span>
          </motion.p>
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
              className="rounded-none border-2 border-foreground text-foreground hover:bg-foreground hover:text-background px-8 py-6"
            >
              TAKE ME TO THE COMMUNITY
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Scrolling Ticker */}
      <div className="bg-foreground text-background py-3 overflow-hidden">
        <motion.div
          animate={{ x: [0, -1000] }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="flex gap-8 whitespace-nowrap"
        >
          {[...Array(10)].map((_, i) => (
            <span key={i} className="flex items-center gap-8 text-sm tracking-widest">
              <span>WOMEN'S SPORTS ELEVATED</span>
              <span className="text-primary">✦</span>
              <span>JOIN THE MOVEMENT</span>
              <span className="text-primary">✦</span>
            </span>
          ))}
        </motion.div>
      </div>

      {/* About Section - Split with Image */}
      <section id="about" className="grid lg:grid-cols-2 min-h-[80vh]">
        {/* Image Side */}
        <div className="relative h-[50vh] lg:h-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="absolute inset-0"
          >
            <img
              src={athletesImage}
              alt="Women athletes"
              className="w-full h-full object-cover"
            />
          </motion.div>
        </div>

        {/* Content Side */}
        <div className="relative flex items-center justify-center p-8 lg:p-0 bg-pale-pink">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="bg-primary text-primary-foreground p-8 sm:p-12 max-w-md lg:absolute lg:right-0 lg:top-1/2 lg:-translate-y-1/2 lg:translate-x-12"
          >
            <h2 className="text-3xl sm:text-4xl font-black mb-6">About Loverball</h2>
            <p className="text-sm leading-relaxed mb-4 opacity-90">
              <strong>85% of household purchasing decisions</strong> are made by women. Yet we're overlooked in sports coverage and community.
            </p>
            <p className="text-sm leading-relaxed mb-6 opacity-90">
              Loverball is a content and community platform for the <strong>$28B women's sports market</strong>. AI-powered stories, community events, and narrative-driven coverage tailored to female fans.
            </p>
            <Button 
              onClick={() => navigate("/following")}
              variant="outline"
              className="rounded-none border-2 border-primary-foreground text-primary-foreground bg-transparent hover:bg-primary-foreground hover:text-primary px-6 py-5"
            >
              LEARN MORE
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Features Accordion Section */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 bg-background">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="border-b border-border/50"
          >
            {features.map((feature, index) => (
              <div key={feature.title} className="border-t border-border/50">
                <button
                  onClick={() => setOpenAccordion(openAccordion === index ? null : index)}
                  className="w-full py-6 flex items-center justify-between text-left hover:text-primary transition-colors"
                >
                  <span className="text-lg sm:text-xl font-medium text-primary">{feature.title}</span>
                  {openAccordion === index ? (
                    <Minus className="h-5 w-5 text-primary shrink-0" />
                  ) : (
                    <Plus className="h-5 w-5 text-foreground/50 shrink-0" />
                  )}
                </button>
                <motion.div
                  initial={false}
                  animate={{ height: openAccordion === index ? "auto" : 0, opacity: openAccordion === index ? 1 : 0 }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden"
                >
                  <p className="pb-6 text-foreground/70 leading-relaxed max-w-2xl">
                    {feature.description}
                  </p>
                </motion.div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Big Text CTA */}
      <section id="community" className="py-20 px-4 sm:px-6 lg:px-8 bg-background">
        <div className="max-w-6xl mx-auto">
          <motion.h2
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-5xl sm:text-6xl lg:text-8xl font-black text-foreground leading-none"
          >
            Our{" "}
            <span className="italic font-serif font-normal text-primary">Community</span>
          </motion.h2>
        </div>
      </section>

      {/* Community Grid */}
      <section className="pb-20 px-4 sm:px-6 lg:px-8 bg-background">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { value: "10K+", label: "Active Members", desc: "Women who share your passion" },
              { value: "500+", label: "Stories", desc: "AI-powered content weekly" },
              { value: "50+", label: "Events", desc: "Community experiences monthly" },
            ].map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="bg-pale-pink p-8 text-center"
              >
                <p className="text-5xl sm:text-6xl font-black text-primary mb-2">{stat.value}</p>
                <p className="text-lg font-semibold text-foreground mb-1">{stat.label}</p>
                <p className="text-sm text-foreground/60">{stat.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-primary">
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
              Be part of the movement redefining women's sports fandom.
            </p>
            <Button 
              size="lg"
              onClick={() => navigate("/following")}
              className="rounded-none text-lg px-10 py-7 bg-background text-primary hover:bg-background/90 font-bold"
            >
              EXPLORE NOW
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </motion.div>
        </div>
      </section>

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

export default LandingPage;

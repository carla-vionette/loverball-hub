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
      {/* Navigation - Pill Style */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border/50">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="flex items-center justify-between h-20">
            {/* Left nav links - Pill style */}
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
            <img src={loverballLogo} alt="Loverball" className="h-12 w-auto absolute left-1/2 -translate-x-1/2" />
            
            {/* Right nav links */}
            <div className="hidden md:flex items-center gap-3">
              <a href="#" className="px-5 py-2 text-sm font-medium text-foreground/70 hover:text-foreground hover:bg-secondary rounded-full transition-all">
                Events
              </a>
              <a href="#" className="px-5 py-2 text-sm font-medium text-foreground/70 hover:text-foreground hover:bg-secondary rounded-full transition-all">
                Shop
              </a>
              <Button onClick={() => navigate("/following")} className="rounded-full bg-primary hover:bg-primary/90 px-6">
                Join Now
              </Button>
            </div>
            
            {/* Mobile button */}
            <Button onClick={() => navigate("/following")} size="sm" className="md:hidden rounded-full">
              Join
            </Button>
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
                  className="w-full h-full object-cover object-[center_35%]"
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
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-sans font-normal leading-[1.1] mb-6">
                  Let's Elevate<br />
                  Your Sports<br />
                  <span className="italic">Experience</span>
                </h1>
                <p className="text-primary-foreground/80 text-lg leading-relaxed mb-8 max-w-md">
                  We're a community platform for women who love sports—where stories, connection, and culture meet her passion for the game.
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button 
                    onClick={() => navigate("/following")}
                    size="lg"
                    className="rounded-full bg-background text-primary hover:bg-background/90 px-8 py-6 text-base font-medium"
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

      {/* Statement Section */}
      <section className="py-24 bg-white">
        <div className="max-w-5xl mx-auto px-6 lg:px-12 text-center">
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-2xl sm:text-3xl lg:text-4xl text-foreground leading-relaxed"
          >
            We specialize in creating{" "}
            <span className="italic font-sans text-primary border-b-2 border-primary">tailored</span>{" "}
            sports content and experiences that drive engagement, build brand loyalty, and{" "}
            <span className="italic font-sans text-primary border-b-2 border-primary">inspire women.</span>
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
              size="lg"
              className="rounded-full border-2 border-foreground text-foreground hover:bg-foreground hover:text-background px-8 py-6"
            >
              Take Me to the Community
            </Button>
          </motion.div>
        </div>
      </section>

      {/* About Section - Overlapping Image Grid */}
      <section id="about" className="py-24 lg:py-32 bg-background">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-0 items-center">
            {/* Image Side with overlap */}
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
              {/* Decorative element */}
              <div className="hidden lg:block absolute -bottom-8 -right-8 w-32 h-32 bg-primary/20 rounded-2xl -z-10" />
            </motion.div>

            {/* Content Side - Overlapping Card */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              viewport={{ once: true }}
              className="relative lg:-ml-20 z-10"
            >
              <div className="bg-primary text-primary-foreground p-8 sm:p-12 rounded-2xl shadow-2xl">
                <span className="inline-block bg-primary-foreground/20 text-primary-foreground px-4 py-2 rounded-full text-sm font-medium tracking-wide mb-6">
                  About Loverball
                </span>
                <h2 className="text-3xl sm:text-4xl font-sans mb-6">About Loverball</h2>
                <p className="text-lg leading-relaxed mb-4 text-primary-foreground/90">
                  <strong>85% of household purchasing decisions</strong> are made by women. Yet we're overlooked in sports coverage and community.
                </p>
                <p className="text-lg leading-relaxed mb-8 text-primary-foreground/90">
                  Loverball is a content and community platform for the <strong>$28B women's sports market</strong>. AI-powered stories, community events, and narrative-driven coverage tailored to female fans.
                </p>
                <Button 
                  onClick={() => navigate("/following")}
                  size="lg"
                  className="rounded-full bg-background text-primary hover:bg-background/90 px-8"
                >
                  Learn More
                </Button>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section - Cards */}
      <section id="features" className="py-24 lg:py-32 bg-white">
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
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-sans font-normal text-foreground">
              Built <span className="italic">For Her</span>
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
                <div className="bg-background p-8 rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.06)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.1)] transition-all duration-300 h-full border border-border/50">
                  <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-300">
                    <feature.icon className="h-7 w-7 text-primary group-hover:text-primary-foreground transition-colors duration-300" />
                  </div>
                  <h3 className="text-xl font-sans text-foreground mb-4 group-hover:text-primary transition-colors duration-300">
                    {feature.title}
                  </h3>
                  <p className="text-foreground/60 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Accordion for additional features */}
          <div className="max-w-3xl mx-auto border-t border-border/50">
            {accordionItems.map((item, index) => (
              <div key={item.title} className="border-b border-border/50">
                <button
                  onClick={() => setOpenAccordion(openAccordion === index ? null : index)}
                  className="w-full py-6 flex items-center justify-between text-left hover:text-primary transition-colors"
                >
                  <span className="text-xl font-sans text-foreground">{item.title}</span>
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
                  <p className="pb-6 text-foreground/60 leading-relaxed max-w-2xl">
                    {item.description}
                  </p>
                </motion.div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Community Section */}
      <section id="community" className="py-24 lg:py-32 bg-background">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <span className="inline-block bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium tracking-wide mb-6">
              Join Us
            </span>
            <h2 className="text-5xl sm:text-6xl lg:text-7xl font-sans text-foreground">
              Our <span className="italic text-primary">Community</span>
            </h2>
          </motion.div>

          {/* Stats Grid */}
          <div className="grid md:grid-cols-3 gap-8 mb-16">
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
                className="bg-white p-8 rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.06)] text-center border border-border/50"
              >
                <p className="text-5xl sm:text-6xl font-sans text-primary mb-2">{stat.value}</p>
                <p className="text-lg font-medium text-foreground mb-1">{stat.label}</p>
                <p className="text-sm text-foreground/60">{stat.desc}</p>
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
            {/* Decorative elements */}
            <div className="hidden lg:block absolute -top-6 -left-6 w-24 h-24 bg-primary/20 rounded-2xl -z-10" />
            <div className="hidden lg:block absolute -bottom-6 -right-6 w-24 h-24 bg-primary/20 rounded-2xl -z-10" />
          </motion.div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 bg-primary">
        <div className="max-w-4xl mx-auto px-6 lg:px-12 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-sans text-primary-foreground mb-6">
              Ready to <span className="italic">Join</span>?
            </h2>
            <p className="text-xl text-primary-foreground/80 mb-10 max-w-2xl mx-auto">
              Be part of the movement redefining women's sports fandom.
            </p>
            <Button 
              size="lg"
              onClick={() => navigate("/following")}
              className="rounded-full text-lg px-10 py-7 bg-background text-primary hover:bg-background/90 font-medium shadow-xl"
            >
              Explore Now
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-16 bg-foreground text-background">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <img src={loverballLogo} alt="Loverball" className="h-10 w-auto brightness-0 invert" />
            <p className="text-sm text-background/50">
              © 2025 Loverball. All rights reserved. Built by women, for women.
            </p>
            <div className="flex gap-6">
              <a href="#" className="text-sm text-background/50 hover:text-background transition-colors">Privacy</a>
              <a href="#" className="text-sm text-background/50 hover:text-background transition-colors">Terms</a>
              <a href="#" className="text-sm text-background/50 hover:text-background transition-colors">Contact</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;

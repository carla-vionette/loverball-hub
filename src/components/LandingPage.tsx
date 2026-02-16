import { motion } from "framer-motion";
import { ArrowRight, Menu, Plus, Minus, Instagram } from "lucide-react";
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

  const services = [
    { title: "AI-Powered Content", desc: "Personalized sports stories that speak to what you care about. Beyond stats — the drama, culture, and narratives." },
    { title: "Community Events", desc: "Watch parties, brunches, and experiences designed for women who love sports. Find your squad." },
    { title: "Exclusive Access", desc: "Behind-the-scenes content, player interviews, and insider perspectives you won't find anywhere else." },
    { title: "Brand Partnerships", desc: "Connect with brands that align with your values and passion for women's sports culture." },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Coral scrolling ticker banner */}
      <div className="bg-primary py-2.5 overflow-hidden">
        <motion.div
          animate={{ x: [0, -1200] }}
          transition={{ duration: 14, repeat: Infinity, ease: "linear" }}
          className="flex gap-16 whitespace-nowrap"
        >
          {[...Array(12)].map((_, i) => (
            <span key={i} className="flex items-center gap-16 text-xs tracking-[0.4em] font-sans font-bold text-primary-foreground/90 uppercase">
              <span>Skyrocket Your Sports Experience</span>
              <span className="text-primary-foreground/40">♦</span>
              <span>Join the Movement</span>
              <span className="text-primary-foreground/40">♦</span>
            </span>
          ))}
        </motion.div>
      </div>

      {/* Navigation — Minimal editorial */}
      <nav className="sticky top-0 z-50 bg-primary">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="flex items-center justify-between h-16">
            <button className="flex items-center gap-2 text-sm font-sans tracking-widest uppercase text-primary-foreground/80 hover:text-primary-foreground transition-colors">
              <Menu className="w-5 h-5" />
            </button>

            <img src={loverballLogo} alt="Loverball" className="h-24 w-auto absolute left-1/2 -translate-x-1/2 brightness-0 invert" />

            <div className="hidden md:flex items-center gap-8">
              <a href="#about" className="text-xs font-sans tracking-widest uppercase text-primary-foreground/70 hover:text-primary-foreground transition-colors">About</a>
              <a href="#services" className="text-xs font-sans tracking-widest uppercase text-primary-foreground/70 hover:text-primary-foreground transition-colors">Services</a>
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

      {/* HERO — Full coral background with polaroid photos */}
      <section className="relative bg-primary py-20 lg:py-28 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left — headline */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, ease: "easeOut" }}
            >
              <h1 className="text-5xl sm:text-6xl lg:text-[5rem] font-display text-primary-foreground leading-[0.95] mb-8">
                Down-to-earth<br />
                <em>strategy.</em><br />
                Big-time<br />
                <em>results.</em>
              </h1>
              <p className="text-lg text-primary-foreground/70 font-serif leading-relaxed mb-10 max-w-md">
                Where women's sports culture meets connection, storytelling, and sisterhood.
              </p>
              <Button
                onClick={() => navigate("/following")}
                size="lg"
                className="rounded-full bg-white text-primary hover:bg-white/90 px-10 py-7 text-base font-sans tracking-widest uppercase shadow-2xl"
              >
                Work With Us
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </motion.div>

            {/* Right — Polaroid-style photos */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1, delay: 0.3 }}
              className="relative hidden lg:block h-[500px]"
            >
              <div className="polaroid absolute top-0 right-8 w-52">
                <img src={athletesImage} alt="Athletes" className="w-full aspect-square object-cover" />
              </div>
              <div className="polaroid-alt absolute top-24 left-0 w-44">
                <img src={communityImage} alt="Community" className="w-full aspect-square object-cover" />
              </div>
              <div className="polaroid absolute bottom-0 right-20 w-48 rotate-[5deg]">
                <img src={heroImage} alt="Sports culture" className="w-full aspect-[3/4] object-cover object-top" />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ABOUT — Lavender section with script overlay */}
      <section id="about" className="bg-lavender py-24 lg:py-32 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
            >
              {/* Script accent */}
              <p className="script-accent text-primary mb-2">hello</p>
              <h2 className="font-display text-5xl md:text-6xl text-lavender-foreground mb-8 leading-[0.95]">
                Essential Marketing<br />
                Tips + <em className="text-primary">Resources</em>
              </h2>
              <p className="text-lg font-serif text-lavender-foreground/80 leading-relaxed mb-6">
                We specialize in creating <em className="font-bold">tailored</em> sports content and experiences that drive engagement, build brand loyalty, and <em className="font-bold">inspire women.</em>
              </p>
              <p className="text-base font-serif text-lavender-foreground/60 leading-relaxed mb-10">
                Born in Los Angeles, Loverball is a content and community platform for the $28B women's sports market.
              </p>
              <Button
                onClick={() => navigate("/following")}
                className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90 px-8 py-5 font-sans text-xs tracking-widest uppercase"
              >
                Meet Us
              </Button>
            </motion.div>

            {/* Polaroid image */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              viewport={{ once: true }}
              className="flex justify-center"
            >
              <div className="polaroid-alt w-80">
                <img src={athletesImage} alt="Women athletes" className="w-full aspect-[3/4] object-cover" />
                <p className="text-center mt-2 font-serif text-sm text-foreground/60 italic">game day vibes ✨</p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* SERVICES — White section with coral accents */}
      <section id="services" className="py-24 lg:py-32 bg-background">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-20"
          >
            <h2 className="font-display text-5xl md:text-6xl lg:text-7xl text-foreground">
              Our <em className="text-primary">Services</em>
            </h2>
          </motion.div>

          <div className="max-w-3xl mx-auto">
            {services.map((service, index) => (
              <div key={service.title} className="border-b border-border">
                <button
                  onClick={() => setOpenAccordion(openAccordion === index ? null : index)}
                  className="w-full py-7 flex items-center justify-between text-left group"
                >
                  <div className="flex items-center gap-6">
                    <span className="font-display text-3xl text-primary/40">0{index + 1}</span>
                    <span className="text-xl font-display text-foreground group-hover:text-primary transition-colors">{service.title}</span>
                  </div>
                  {openAccordion === index ? (
                    <Minus className="h-5 w-5 text-primary shrink-0" />
                  ) : (
                    <Plus className="h-5 w-5 text-foreground/40 shrink-0" />
                  )}
                </button>
                <motion.div
                  initial={false}
                  animate={{ height: openAccordion === index ? "auto" : 0, opacity: openAccordion === index ? 1 : 0 }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden"
                >
                  <p className="pb-7 pl-16 text-foreground/60 leading-relaxed font-serif max-w-xl">
                    {service.desc}
                  </p>
                </motion.div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PAIN POINTS — Coral section */}
      <section className="py-24 bg-primary">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="font-display text-5xl md:text-6xl text-primary-foreground italic mb-4">
              Does this sound familiar?
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              { title: "Missing the Stories", desc: "Sports coverage that doesn't speak to you — just stats and highlights without the culture and narratives that matter." },
              { title: "No Community", desc: "Feeling like the only woman in the room who's passionate about the game. Where's your crew?" },
              { title: "Left Out", desc: "Events, content, and experiences designed without you in mind. It's time for something built for her." },
            ].map((item, i) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                viewport={{ once: true }}
              >
                <div className="bg-white/10 backdrop-blur-sm border border-white/20 p-8 h-full rounded-2xl hover:bg-white/15 transition-colors duration-300">
                  <h3 className="font-display text-2xl text-primary-foreground mb-4 normal-case italic">{item.title}</h3>
                  <p className="font-serif text-primary-foreground/70 leading-relaxed">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* COMMUNITY — White section with editorial photos */}
      <section className="py-24 lg:py-32 bg-background">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="max-w-3xl mb-16"
          >
            <p className="script-accent text-primary mb-2">explore</p>
            <h2 className="font-display text-5xl md:text-6xl text-foreground leading-[1.05] mb-6">
              Welcome to our <em className="text-primary">Community</em>
            </h2>
            <p className="text-xl font-serif text-foreground/60 leading-relaxed">
              How we help women connect through sports, build real friendships, and <em>achieve their goals</em> together.
            </p>
          </motion.div>

          {/* Photo grid with polaroid accents */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="col-span-2 row-span-2"
            >
              <div className="overflow-hidden rounded-2xl group cursor-pointer aspect-[4/3]">
                <img src={communityImage} alt="Loverball community" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              viewport={{ once: true }}
            >
              <div className="polaroid">
                <img src={athletesImage} alt="Women athletes" className="w-full aspect-square object-cover" />
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              viewport={{ once: true }}
            >
              <div className="bg-primary rounded-2xl flex items-center justify-center aspect-square">
                <div className="text-center p-6">
                  <p className="font-display text-5xl text-primary-foreground mb-2">10K+</p>
                  <p className="font-sans text-xs tracking-widest uppercase text-primary-foreground/70">Members</p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA — Lavender section */}
      <section className="py-24 lg:py-32 bg-lavender">
        <div className="max-w-5xl mx-auto px-6 lg:px-12 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <p className="script-accent text-primary mb-4">let's do this</p>
            <h2 className="font-display text-5xl sm:text-6xl lg:text-7xl text-lavender-foreground leading-[1.05] mb-8">
              Because building your<br />
              brand shouldn't feel <em className="text-primary">boring.</em>
            </h2>
            <p className="text-xl font-serif text-lavender-foreground/60 leading-relaxed mb-12 max-w-2xl mx-auto">
              We partner with forward-thinking brands to reach the most influential audience in sports.
            </p>
            <Button
              size="lg"
              onClick={() => navigate("/following")}
              className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90 text-base px-12 py-7 font-sans tracking-widest uppercase shadow-xl"
            >
              Get Started
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </motion.div>
        </div>
      </section>

      {/* FINAL CTA — Coral block */}
      <section className="py-32 bg-primary">
        <div className="max-w-3xl mx-auto px-6 lg:px-12 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className="text-5xl sm:text-6xl lg:text-7xl font-display text-primary-foreground mb-8 leading-[0.95] italic">
              Ready to Join<br />the Movement?
            </h2>
            <p className="text-lg font-serif text-primary-foreground/60 mb-12 max-w-xl mx-auto leading-relaxed">
              Be part of the community redefining women's sports fandom.
            </p>
            <Button
              size="lg"
              onClick={() => navigate("/following")}
              className="rounded-full bg-white text-primary hover:bg-white/90 text-base px-12 py-7 font-sans tracking-widest uppercase shadow-2xl"
            >
              Join Loverball
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
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

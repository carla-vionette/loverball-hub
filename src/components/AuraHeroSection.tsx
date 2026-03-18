import React from "react";
import heroImage from "@/assets/hero-women-new.png";

const AuraHeroSection: React.FC = () => (
  <section className="relative px-6 pt-2 pb-16">
    {/* Hero image background */}
    <div className="absolute top-0 right-0 w-[85%] h-[520px] rounded-bl-[80px] overflow-hidden z-0">
      <img
        src={heroImage}
        alt="Women in sports"
        className="w-full h-full object-cover mix-blend-luminosity opacity-70"
      />
      <div className="absolute inset-0 bg-gradient-to-tr from-base-100 via-accent-orange/40 to-transparent mix-blend-multiply" />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-base-100" />
      <div className="absolute inset-0 bg-gradient-to-r from-base-100 via-transparent to-transparent" />
    </div>

    {/* Grid overlay lines */}
    <div className="absolute inset-0 pointer-events-none z-0">
      <div className="absolute top-[40%] left-0 w-full h-px bg-white/10" />
      <div className="absolute top-0 left-[30%] w-px h-[600px] bg-white/10" />
    </div>

    {/* Hero text content */}
    <div className="relative z-10 mt-10">
      {/* Early Access badge */}
      <div className="mb-4 inline-flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-accent-yellow inline-block" />
        <span className="font-sans text-[10px] font-bold tracking-[0.2em] uppercase text-accent-yellow">
          Early Access
        </span>
      </div>

      <h1 className="text-[5.5rem] leading-[0.8] tracking-tighter flex flex-col uppercase font-display">
        <span className="text-white drop-shadow-lg">HER</span>
        <span className="text-accent-orange drop-shadow-lg">GAME</span>
        <span className="text-4xl mt-3 mb-1 tracking-normal text-accent-pink capitalize font-serif italic">
          Her Community
        </span>
        <span
          className="drop-shadow-lg"
          style={{
            WebkitTextStroke: "1px rgba(253, 251, 247, 0.3)",
            color: "transparent",
          }}
        >
          RULES
        </span>
      </h1>

      <div className="mt-10 flex gap-4 items-center">
        <div className="w-12 h-[1px] bg-white/50" />
        <p className="font-sans font-medium text-[10px] max-w-[200px] text-white/80 uppercase tracking-[0.2em] leading-relaxed">
          A community platform for women who love sports — stories, connection,
          and culture.
        </p>
      </div>
    </div>
  </section>
);

export default AuraHeroSection;

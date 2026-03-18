import React from "react";

const marqueeItems = [
  "LIVE SCORES",
  "WATCH PARTIES",
  "TRENDING NOW",
  "COMMUNITY EVENTS",
  "GAME DAY VIBES",
  "MARCH MADNESS",
  "PLAYOFF RACE",
  "HER GAME HER RULES",
];

const MarqueeContent: React.FC = () => (
  <>
    {marqueeItems.map((item, i) => (
      <React.Fragment key={i}>
        <i className="ph-fill ph-star-four text-xs" />
        <span className="font-display text-sm tracking-widest uppercase whitespace-nowrap">
          {item}
        </span>
      </React.Fragment>
    ))}
  </>
);

const AuraMarquee: React.FC = () => (
  <div className="bg-accent-orange text-black py-3 overflow-hidden relative z-20">
    <div className="flex items-center gap-6 animate-marquee">
      <MarqueeContent />
      {/* Duplicate for seamless loop */}
      <MarqueeContent />
    </div>
  </div>
);

export default AuraMarquee;

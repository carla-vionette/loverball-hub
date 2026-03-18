// AuraCards.tsx — RealmCard, FeedCard, MarqueeBar, and demo

import React from "react";

// ─────────────────────────────────────────────
// REALM CARD  (the horizontal scroll cards)
// ─────────────────────────────────────────────
interface RealmCardProps {
  number: string;
  category: string;
  title: string;
  titleLine2: string;
  bg: string;
  textColor: string;
  accentColor?: string;
  icon: React.ReactNode;
  decorators?: React.ReactNode;
}

export function RealmCard({
  number,
  category,
  title,
  titleLine2,
  bg,
  textColor,
  accentColor,
  icon,
  decorators,
}: RealmCardProps) {
  return (
    <div
      className={`snap-start shrink-0 w-[200px] h-[260px] ${bg} rounded-[2rem] p-5 flex flex-col justify-between relative overflow-hidden border-2 border-transparent ${textColor}`}
    >
      {decorators}

      <div className="relative z-10 flex justify-between items-start">
        <span className="font-display text-2xl opacity-50">{number}</span>
        <div className="w-8 h-8 rounded-full border border-current/20 flex items-center justify-center bg-black/10 backdrop-blur-sm">
          {icon}
        </div>
      </div>

      <div className="relative z-10">
        <p className={`font-sans font-bold text-[9px] uppercase tracking-widest mb-1 ${accentColor ?? 'opacity-70'}`}>
          {category}
        </p>
        <h3 className="font-display text-4xl uppercase leading-none tracking-tight">
          {title}<br />{titleLine2}
        </h3>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// FEED CARD  (the article list items)
// ─────────────────────────────────────────────
interface FeedCardProps {
  index: string;
  category: string;
  dotColor: string;
  hoverColor: string;
  overlayColor: string;
  overlayBlend: string;
  title: string;
  author: string;
  authorInitial: string;
  imageUrl: string;
}

export function FeedCard({
  index,
  category,
  dotColor,
  hoverColor,
  overlayColor,
  overlayBlend,
  title,
  author,
  authorInitial,
  imageUrl,
}: FeedCardProps) {
  return (
    <div className="flex gap-5 items-center group cursor-pointer">
      <div className="relative w-28 h-32 rounded-2xl overflow-hidden shrink-0">
        <img
          src={imageUrl}
          alt={title}
          className="w-full h-full object-cover grayscale group-hover:scale-110 transition-transform duration-700"
        />
        <div
          className={`absolute inset-0 ${overlayColor} ${overlayBlend} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}
        />
        <div className="absolute bottom-2 left-2 text-white font-display text-lg leading-none drop-shadow-md">
          {index}
        </div>
      </div>

      <div className="flex-1 py-1">
        <div className="flex items-center gap-2 mb-2">
          <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
          <span className="text-[9px] font-bold text-white/60 uppercase tracking-widest">{category}</span>
        </div>
        <h4 className={`font-serif italic text-xl leading-tight text-white mb-2 transition-colors ${hoverColor}`}>
          {title}
        </h4>
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-full bg-base-200 flex items-center justify-center text-[10px] font-bold text-white">
            {authorInitial}
          </div>
          <span className="text-[10px] text-white/50 font-light">{author}</span>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// MARQUEE BAR
// ─────────────────────────────────────────────
export function MarqueeBar() {
  const items = ["Avant-Garde Designs", "Sonic Explorations", "Visual Poetry", "Radical Visions"];

  return (
    <div className="w-full bg-accent-orange text-black py-2.5 overflow-hidden flex whitespace-nowrap border-y border-white/10 relative z-20">
      <div className="flex gap-6 items-center animate-marquee">
        {[...items, ...items].map((item, i) => (
          <span key={i} className="contents">
            <span className="font-display uppercase text-sm tracking-widest">{item}</span>
            <span className="text-xs">◆</span>
          </span>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// DEMO PAGE
// ─────────────────────────────────────────────
export default function AuraCardsDemo() {
  const realmCards = [
    {
      number: "01",
      category: "Photography",
      title: "Visual",
      titleLine2: "Arts",
      bg: "bg-white",
      textColor: "text-black",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 256 256">
          <path d="M208,56H180.28L166.65,35.56A8,8,0,0,0,160,32H96a8,8,0,0,0-6.65,3.56L75.71,56H48A24,24,0,0,0,24,80V192a24,24,0,0,0,24,24H208a24,24,0,0,0,24-24V80A24,24,0,0,0,208,56ZM128,168a44,44,0,1,1,44-44A44.05,44.05,0,0,1,128,168Z"/>
        </svg>
      ),
      decorators: (
        <>
          <div className="absolute -right-8 -top-8 w-32 h-32 bg-black rounded-full opacity-10" />
          <div className="absolute -left-4 bottom-10 w-24 h-24 bg-white rotate-45 opacity-50" />
        </>
      ),
    },
    {
      number: "02",
      category: "Audio Series",
      title: "Sonic",
      titleLine2: "Waves",
      bg: "bg-[#0038FF]",
      textColor: "text-white",
      accentColor: "text-accent-yellow",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 256 256">
          <path d="M227.56,66.35l-128-48A8,8,0,0,0,88,26V156.58A48,48,0,1,0,104,192V120.65l112,42V156.58A48,48,0,1,0,232,192V72A8,8,0,0,0,227.56,66.35Z"/>
        </svg>
      ),
      decorators: (
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 rounded-full blur-xl opacity-60"
          style={{ backgroundColor: '#FF0055', mixBlendMode: 'screen' }}
        />
      ),
    },
    {
      number: "03",
      category: "Editorial",
      title: "Design",
      titleLine2: "Code",
      bg: "bg-accent-pink",
      textColor: "text-white",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 256 256">
          <path d="M225.19,72.34,183.66,30.81a16,16,0,0,0-22.63,0L36.69,155.16a16,16,0,0,0,0,22.62l41.53,41.53A16,16,0,0,0,89.54,224H208a8,8,0,0,0,0-16H155.31L225.19,95A16,16,0,0,0,225.19,72.34Z"/>
        </svg>
      ),
      decorators: (
        <div
          className="absolute inset-0 opacity-20"
          style={{ backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, #000 10px, #000 12px)' }}
        />
      ),
    },
  ];

  const feedCards = [
    {
      index: "01",
      category: "Architecture",
      dotColor: "bg-accent-orange",
      hoverColor: "group-hover:text-accent-orange",
      overlayColor: "bg-accent-orange/40",
      overlayBlend: "mix-blend-multiply",
      title: "Crimson Tides & Brutal Forms",
      author: "By Elena R.",
      authorInitial: "E",
      imageUrl: "https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=400&auto=format&fit=crop",
    },
    {
      index: "02",
      category: "Abstract Art",
      dotColor: "bg-accent-yellow",
      hoverColor: "group-hover:text-accent-yellow",
      overlayColor: "bg-accent-yellow/40",
      overlayBlend: "mix-blend-overlay",
      title: "Sacred Spaces in the Void",
      author: "By Marcus V.",
      authorInitial: "M",
      imageUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=400&auto=format&fit=crop",
    },
    {
      index: "03",
      category: "Motion",
      dotColor: "bg-[#0038FF]",
      hoverColor: "group-hover:text-[#0038FF]",
      overlayColor: "bg-[#0038FF]/40",
      overlayBlend: "mix-blend-color",
      title: "Kinetic Flow & Fighting Spirit",
      author: "By Sarah J.",
      authorInitial: "S",
      imageUrl: "https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?q=80&w=400&auto=format&fit=crop",
    },
  ];

  return (
    <div className="bg-base-100 min-h-screen text-white pb-32">
      <section className="mt-10">
        <div className="px-6 mb-5 flex justify-between items-end">
          <h2 className="font-serif italic text-2xl text-white">Discover Realms</h2>
          <button className="text-[10px] font-bold uppercase tracking-widest text-white border-b border-accent-yellow/30 pb-0.5 hover:border-accent-yellow transition-colors">
            See All
          </button>
        </div>

        <div className="flex gap-4 px-6 overflow-x-auto snap-x pb-8 scrollbar-hide">
          {realmCards.map((card) => (
            <RealmCard key={card.number} {...card} />
          ))}
        </div>
      </section>

      <section className="px-6 mt-4">
        <div className="flex items-center gap-4 mb-6 pb-4 border-b border-white/10">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-accent-orange to-white/30 flex items-center justify-center font-display text-xl text-white shadow-lg shadow-accent-orange/20">
            AF
          </div>
          <div>
            <h3 className="font-sans font-medium text-white">Artifacts Feed</h3>
            <p className="font-sans font-light text-[10px] uppercase tracking-widest text-white/50 mt-0.5">Updated Daily</p>
          </div>
        </div>

        <div className="flex flex-col gap-6">
          {feedCards.map((card) => (
            <FeedCard key={card.index} {...card} />
          ))}
        </div>

        <button className="w-full py-4 mt-6 border border-white/20 rounded-xl text-[11px] font-bold tracking-widest uppercase hover:bg-white hover:text-black transition-colors">
          Load More Archive
        </button>
      </section>
    </div>
  );
}

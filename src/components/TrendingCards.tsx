import React from "react";
import { useNavigate } from "react-router-dom";

interface TrendingCardProps {
  number: string;
  category: string;
  title: React.ReactNode;
  subtitle?: string;
  bgClass: string;
  textClass: string;
  onClick: () => void;
  variant: "arrow" | "play";
  decorationNode?: React.ReactNode;
}

const TrendingCard: React.FC<TrendingCardProps> = ({
  number,
  category,
  title,
  subtitle,
  bgClass,
  textClass,
  onClick,
  variant,
  decorationNode,
}) => (
  <div
    onClick={onClick}
    className={`w-[260px] h-[340px] ${bgClass} rounded-3xl p-6 flex flex-col justify-between relative overflow-hidden snap-center flex-shrink-0 group cursor-pointer shadow-xl`}
  >
    {decorationNode}
    <div className={`relative z-10 ${textClass}`}>
      <p className="font-sans font-bold text-[10px] tracking-widest uppercase mb-4 border-b border-current/20 pb-2 inline-block opacity-70">
        {category}
      </p>
      <h3 className="font-display text-[3.5rem] leading-[0.85] uppercase mix-blend-difference text-white">
        {title}
      </h3>
      {subtitle && (
        <p className="font-sans font-light text-[10px] tracking-widest mt-3 opacity-80 uppercase">
          {subtitle}
        </p>
      )}
    </div>
    <div className={`relative z-10 flex justify-between items-end ${textClass} w-full`}>
      {variant === "arrow" ? (
        <div className="w-12 h-12 rounded-full border-2 border-current flex items-center justify-center group-hover:bg-black group-hover:text-accent-yellow transition-colors duration-300">
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
          >
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </div>
      ) : (
        <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center pl-1 group-hover:bg-white/40 transition-colors">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M8 5v14l11-7z" />
          </svg>
        </div>
      )}
      <span className="font-display text-2xl opacity-50">{number}</span>
    </div>
  </div>
);

const TrendingCards: React.FC = () => {
  const navigate = useNavigate();

  return (
    <section className="mt-4 relative z-20">
      <div className="flex justify-between items-end px-6 mb-6">
        <h2 className="text-2xl text-accent-yellow tracking-wide uppercase font-display">
          Now Trending
        </h2>
        <button
          onClick={() => navigate("/explore")}
          className="text-[10px] uppercase font-bold tracking-[0.15em] border-b border-white/30 pb-1 hover:text-accent-yellow hover:border-accent-yellow transition-colors"
        >
          View All
        </button>
      </div>

      <div className="flex overflow-x-auto gap-5 px-6 pb-10 snap-x hide-scrollbar">
        {/* Card 1 — Featured Event (Yellow) */}
        <TrendingCard
          number="01"
          category="Featured Event"
          title={
            <>
              March
              <br />
              Madness
            </>
          }
          subtitle="Watch Party — Mar 20"
          bgClass="bg-accent-yellow"
          textClass="text-black"
          onClick={() => navigate("/events")}
          variant="arrow"
          decorationNode={
            <div className="absolute -right-16 -top-16 w-56 h-56 bg-black rotate-[25deg] transform group-hover:rotate-[35deg] transition-transform duration-700" />
          }
        />

        {/* Card 2 — Featured Story (Blue) */}
        <TrendingCard
          number="02"
          category="Trending Story"
          title={
            <>
              Playoff
              <br />
              Push
            </>
          }
          subtitle="NBA Race Heats Up"
          bgClass="bg-accent-blue"
          textClass="text-white"
          onClick={() => navigate("/explore")}
          variant="play"
          decorationNode={
            <>
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 bg-accent-orange rounded-full transform group-hover:scale-125 transition-transform duration-700 mix-blend-multiply" />
              <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-accent-yellow rotate-[15deg] mix-blend-overlay opacity-80" />
            </>
          }
        />

        {/* Card 3 — Community (Pink) */}
        <TrendingCard
          number="03"
          category="Community"
          title={
            <>
              <span className="font-serif italic text-4xl normal-case block mb-1">
                Brunch &
              </span>
              <span className="font-display text-5xl leading-[0.9] uppercase block">
                Basketball
              </span>
            </>
          }
          bgClass="bg-accent-pink"
          textClass="text-base-100"
          onClick={() => navigate("/events")}
          variant="arrow"
          decorationNode={
            <div
              className="absolute top-6 right-6 text-base-100 animate-spin"
              style={{ animationDuration: "12s" }}
            >
              <svg width="48" height="48" viewBox="0 0 100 100">
                <path
                  d="M50 0 L55 40 L100 50 L55 60 L50 100 L45 60 L0 50 L45 40 Z"
                  fill="currentColor"
                />
              </svg>
            </div>
          }
        />
      </div>
    </section>
  );
};

export default TrendingCards;

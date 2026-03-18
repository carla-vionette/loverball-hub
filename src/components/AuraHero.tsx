// AuraHero.tsx — Full hero section with grayscale image, color overlays, glow orb, and badge

import heroImage from "@/assets/hero-women-new.png";

export default function AuraHero() {
  return (
    <section className="relative w-full h-[70vh] rounded-b-[2.5rem] overflow-hidden">
      {/* Background Image */}
      <img
        src={heroImage}
        alt="Women in sports"
        className="absolute inset-0 w-full h-full object-cover grayscale opacity-70 scale-105 origin-top"
        style={{ mixBlendMode: 'luminosity' }}
      />

      {/* Color Overlays */}
      <div
        className="absolute inset-0"
        style={{ background: 'linear-gradient(to top right, rgba(255,59,0,0.6), transparent, rgba(0,56,255,0.4))', mixBlendMode: 'overlay' }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-base-100 via-base-100/40 to-transparent" />

      {/* Orange glow orb */}
      <div
        className="absolute -right-20 -top-20 w-96 h-96 rounded-full blur-[80px] opacity-40"
        style={{ backgroundColor: '#FF3B00', mixBlendMode: 'screen' }}
      />

      {/* Badge */}
      <div className="absolute top-24 right-6 w-20 h-20 bg-white rounded-full flex items-center justify-center rotate-12 shadow-2xl z-20 border-[3px] border-base-100">
        <div className="text-black font-display text-[10px] leading-[1.1] text-center uppercase tracking-wider">
          Her<br />Game<br />Rules
        </div>
      </div>

      {/* Text Content */}
      <div className="absolute bottom-0 left-0 w-full p-6 pb-10 z-10 flex flex-col justify-end">
        <div className="flex items-center gap-2 mb-4">
          <span className="px-3 py-1 bg-white/10 backdrop-blur-md border border-white/20 rounded-full text-[9px] font-bold uppercase tracking-[0.2em] text-white">
            Early Access
          </span>
          <span className="w-1 h-1 rounded-full bg-accent-yellow" />
          <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-accent-yellow">Community</span>
        </div>

        <h1 className="font-display text-[5.5rem] leading-[0.85] tracking-tighter uppercase mb-2 text-white drop-shadow-lg">
          Her<br />
          <span className="font-serif italic text-accent-orange capitalize tracking-normal text-[4.5rem]">
            Game
          </span>
          <br />
          Rules
        </h1>

        <p className="font-sans font-light text-sm text-white/80 max-w-[85%] mt-3 leading-relaxed">
          A community platform for women who love sports — stories, connection, and culture.
        </p>
      </div>
    </section>
  );
}

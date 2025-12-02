import loverballLogo from "@/assets/loverball-logo-new.png";

const ComingSoon = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-20 w-64 h-64 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 -right-20 w-80 h-80 bg-accent/10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 text-center max-w-md">
        <img 
          src={loverballLogo} 
          alt="Loverball" 
          className="w-32 h-32 mx-auto mb-8 object-contain"
        />
        
        <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4 tracking-tight">
          Coming Soon
        </h1>
        
        <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
          The premier community for women who love sports. 
          Watch parties, events, and exclusive content — all in one place.
        </p>

        <a 
          href="https://docs.google.com/forms/d/e/1FAIpQLSeAPig3Z27BLQHXHVKwMAFaLuBsV3OtTOnblPaDF27JWOR6XQ/viewform?usp=dialog" 
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-full font-medium hover:bg-primary/90 transition-colors"
        >
          Join the waitlist
        </a>
      </div>
    </div>
  );
};

export default ComingSoon;

import { ReactNode } from "react";

interface PhoneMockupProps {
  children?: ReactNode;
  className?: string;
  /** Tilt phone slightly (degrees) */
  tilt?: number;
  /** Raise phone vertically (px) */
  raise?: number;
  ariaLabel?: string;
}

/**
 * CSS-only iPhone-style mockup. The `children` render inside the screen.
 * Intentionally avoids any reference to native app stores.
 */
export function PhoneMockup({ children, className = "", tilt = 0, raise = 0, ariaLabel }: PhoneMockupProps) {
  return (
    <div
      className={`relative mx-auto ${className}`}
      style={{
        width: 260,
        height: 540,
        transform: `translateY(${-raise}px) rotate(${tilt}deg)`,
      }}
      aria-label={ariaLabel}
      role="img"
    >
      {/* Outer frame */}
      <div
        className="absolute inset-0 rounded-[44px] border border-white/10"
        style={{
          background: "linear-gradient(155deg, #1c1c1c 0%, #0a0a0a 60%, #141414 100%)",
          boxShadow:
            "0 30px 60px -20px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04) inset",
          padding: 10,
        }}
      >
        {/* Inner bezel */}
        <div
          className="relative h-full w-full overflow-hidden rounded-[36px]"
          style={{ background: "#0a0a0a" }}
        >
          {/* Notch */}
          <div
            className="absolute left-1/2 top-2 z-10 -translate-x-1/2 rounded-full"
            style={{
              width: 90,
              height: 22,
              background: "#000",
            }}
          />
          {/* Screen content */}
          <div className="relative z-0 h-full w-full pt-7">{children}</div>
        </div>
      </div>
      {/* Side button hints */}
      <span
        className="absolute -left-[3px] top-24 h-12 w-[3px] rounded-l-md"
        style={{ background: "#1c1c1c" }}
      />
      <span
        className="absolute -right-[3px] top-32 h-16 w-[3px] rounded-r-md"
        style={{ background: "#1c1c1c" }}
      />
    </div>
  );
}

export default PhoneMockup;

interface WhistleIconProps {
  className?: string;
  filled?: boolean;
}

const WhistleIcon = ({ className = "", filled = false }: WhistleIconProps) => {
  return (
    <svg
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      {/* Main whistle body */}
      <rect x="3" y="8" width="10" height="6" rx="1" />
      
      {/* Mouthpiece hole */}
      <rect x="5" y="10" width="2" height="2" rx="0.5" />
      
      {/* Curved connector */}
      <path d="M13 11 Q15 11 16 12" />
      
      {/* Ring */}
      <circle cx="18" cy="14" r="3" />
      <circle cx="18" cy="14" r="1.5" />
      
      {/* Lanyard loop */}
      <circle cx="5" cy="7" r="1" />
      <line x1="5" y1="7" x2="5" y2="8" />
    </svg>
  );
};

export default WhistleIcon;

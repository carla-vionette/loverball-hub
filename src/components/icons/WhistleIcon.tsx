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
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      {/* Main spherical chamber */}
      <circle cx="9" cy="14" r="6" />
      
      {/* Rectangular mouthpiece - angled perspective */}
      <path d="M14 10 L21 7 L22 9 L15 12 Z" />
      <path d="M14 10 L15 12 L22 9 L21 7 Z" />
      
      {/* Mouthpiece opening */}
      <line x1="21" y1="7" x2="22" y2="9" />
      
      {/* Air vent/grip diamond on top */}
      <path d="M8 10 L10 8 L12 10 L10 12 Z" strokeWidth="1.5" />
      
      {/* Connection between chamber and mouthpiece */}
      <path d="M14 10 L14 12" />
      
      {/* Lanyard hole */}
      <circle cx="5" cy="11" r="1.5" />
    </svg>
  );
};

export default WhistleIcon;

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
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      {/* Large circular chamber */}
      <circle cx="10" cy="15" r="7" />
      
      {/* Diamond air vent on top left of chamber */}
      <path d="M7 10 L9 8 L11 10 L9 12 Z" />
      
      {/* Rectangular mouthpiece - 3D perspective */}
      {/* Top face */}
      <path d="M13 8 L20 5 L22 6 L15 9 Z" />
      {/* Side face */}
      <path d="M15 9 L22 6 L22 8 L15 11 Z" />
      {/* Bottom face */}
      <path d="M13 10 L15 11 L15 9 L13 8 Z" />
      
      {/* Mouthpiece opening end */}
      <line x1="20" y1="5" x2="22" y2="6" />
      <line x1="22" y1="6" x2="22" y2="8" />
      
      {/* Connection strut from mouthpiece to chamber */}
      <path d="M15 9 L13 11" />
      <path d="M15 11 L13 13" />
      
      {/* Small lanyard hole */}
      <circle cx="4" cy="12" r="1.2" />
    </svg>
  );
};

export default WhistleIcon;

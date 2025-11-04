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
      {/* Main whistle body - cylindrical shape */}
      <ellipse cx="10" cy="12" rx="6" ry="4" />
      
      {/* Mouthpiece tube */}
      <rect x="16" y="10.5" width="4" height="3" rx="0.5" />
      
      {/* Air hole */}
      <circle cx="10" cy="12" r="1.5" fill="currentColor" />
      
      {/* Top air slots */}
      <line x1="7" y1="10" x2="7" y2="8.5" strokeWidth="1.5" />
      <line x1="10" y1="9.5" x2="10" y2="8" strokeWidth="1.5" />
      <line x1="13" y1="10" x2="13" y2="8.5" strokeWidth="1.5" />
      
      {/* Lanyard ring */}
      <circle cx="5" cy="12" r="2" strokeWidth="1.5" />
    </svg>
  );
};

export default WhistleIcon;

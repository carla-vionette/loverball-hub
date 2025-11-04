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
      {/* Main rectangular body - 3D isometric */}
      <path d="M4 8 L10 4 L16 8 L16 12 L10 16 L4 12 Z" />
      
      {/* Front face detail */}
      <path d="M4 8 L10 4 L10 16 L4 12 Z" fill={filled ? "currentColor" : "none"} />
      
      {/* Air slot window */}
      <rect x="6" y="9" width="2" height="4" rx="0.5" fill="currentColor" />
      
      {/* Curved connecting tube */}
      <path d="M16 10 Q18 10 19 11 Q20 12 20 14" strokeWidth="2.5" />
      
      {/* Circular ring (mouthpiece) */}
      <circle cx="20" cy="16" r="3" strokeWidth="2" />
      
      {/* Inner circle of ring */}
      <circle cx="20" cy="16" r="1.5" fill="none" />
      
      {/* Small lanyard ring at top */}
      <circle cx="14" cy="6" r="1.5" strokeWidth="1.5" />
    </svg>
  );
};

export default WhistleIcon;

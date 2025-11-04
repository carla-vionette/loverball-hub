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
      {/* Main rectangular body - top face */}
      <path d="M4 6 L12 3 L16 5 L8 8 Z" />
      
      {/* Left side face */}
      <path d="M4 6 L4 10 L8 12 L8 8 Z" />
      
      {/* Right side face (visible) */}
      <path d="M8 8 L16 5 L16 9 L8 12 Z" />
      
      {/* Bottom edge */}
      <path d="M4 10 L8 12 L16 9" />
      
      {/* Air slot window on top */}
      <rect x="9" y="5" width="2" height="3" rx="0.3" transform="rotate(-20 10 6.5)" />
      
      {/* Triangular mouthpiece connector */}
      <path d="M8 10 L10 12 L14 10" fill={filled ? "currentColor" : "none"} />
      
      {/* Large circular ring */}
      <circle cx="17" cy="14" r="5" strokeWidth="1.8" />
      
      {/* Inner circle of ring */}
      <circle cx="17" cy="14" r="3" />
    </svg>
  );
};

export default WhistleIcon;

interface WhistleIconProps {
  className?: string;
  filled?: boolean;
}

const WhistleIcon = ({ className = "", filled = false }: WhistleIconProps) => {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      {/* Main curved body outline */}
      <path 
        d="M4 18 C4 15 5 12 7 10 C8 9 10 8 12 8 L18 8 C19 8 20 7 20 6 L20 4 C20 3 19 2 18 2 L10 2 C9 2 8 3 8 4 L8 6 C8 7 7 8 6 8 C4 9 3 11 3 14 C3 17 4 19 6 20 L8 22"
        fill={filled ? "currentColor" : "none"}
      />
      
      {/* Inner circular chamber */}
      <circle 
        cx="11" 
        cy="13" 
        r="4" 
        fill={filled ? "currentColor" : "none"}
        strokeWidth="2"
      />
      
      {/* Small ball at bottom (lanyard attachment) */}
      <circle 
        cx="5" 
        cy="20" 
        r="1.5"
        fill="currentColor"
      />
      
      {/* Mouthpiece top rectangle */}
      <path d="M10 2 L18 2 C19.5 2 20 3 20 4 L20 6 C20 7 19 8 18 8 L12 8" />
    </svg>
  );
};

export default WhistleIcon;

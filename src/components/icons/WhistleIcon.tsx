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
      {/* Main whistle body - rounded rectangle */}
      <path d="M4 10 L4 14 Q4 16 6 16 L14 16 Q16 16 16 14 L16 10 Q16 8 14 8 L6 8 Q4 8 4 10 Z" />
      
      {/* Mouthpiece */}
      <path d="M16 10 L16 14 L19 14 L19 10 Z" />
      
      {/* Sound chamber holes */}
      <circle cx="8" cy="12" r="1" fill="currentColor" />
      <circle cx="12" cy="12" r="1" fill="currentColor" />
      
      {/* Lanyard attachment loop */}
      <circle cx="6" cy="6" r="1.5" strokeWidth="1.5" />
      <path d="M6 7.5 L6 8" strokeWidth="1.5" />
    </svg>
  );
};

export default WhistleIcon;

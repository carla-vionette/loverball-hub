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
      {/* Whistle body */}
      <circle cx="12" cy="12" r="6" />
      {/* Whistle hole */}
      <circle cx="12" cy="12" r="2" fill={filled ? "none" : "currentColor"} />
      {/* Whistle mouthpiece */}
      <path d="M18 12 L22 12" />
      {/* Lanyard ring */}
      <circle cx="7" cy="9" r="1.5" />
    </svg>
  );
};

export default WhistleIcon;

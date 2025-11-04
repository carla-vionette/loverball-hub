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
      {/* Palm */}
      <path d="M8 14 L8 18 C8 19.5 9 20 10 20 L14 20 C15 20 16 19.5 16 18 L16 14" />
      
      {/* Thumb */}
      <path d="M8 14 L7 12 L6 10 C5.5 9 6 8 7 8 C8 8 8.5 9 9 10 L9 12" />
      
      {/* Index finger */}
      <path d="M9 12 L9 6 C9 5 9.5 4 10.5 4 C11.5 4 12 5 12 6 L12 12" />
      
      {/* Middle finger */}
      <path d="M12 12 L12 5 C12 4 12.5 3 13.5 3 C14.5 3 15 4 15 5 L15 12" />
      
      {/* Ring finger */}
      <path d="M15 12 L15 6 C15 5 15.5 4 16.5 4 C17.5 4 18 5 18 6 L18 12" />
      
      {/* Pinky finger */}
      <path d="M18 12 L18 10 C18 9 18.5 8 19.5 8 C20.5 8 21 9 21 10 L21 14 C21 15 20 16 19 16 L16 16" />
      
      {/* Wrist */}
      <path d="M8 18 L8 20 C8 21 9 22 10 22 L14 22 C15 22 16 21 16 20 L16 18" />
    </svg>
  );
};

export default WhistleIcon;

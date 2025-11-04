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
      {/* Hand outline */}
      <path d="M18 11 L18 8 C18 7 17.5 6 16.5 6 C15.5 6 15 7 15 8 L15 11 M15 11 L15 7 C15 6 14.5 5 13.5 5 C12.5 5 12 6 12 7 L12 11 M12 11 L12 6 C12 5 11.5 4 10.5 4 C9.5 4 9 5 9 6 L9 11 M9 11 L9 14 L9 16 C9 18 10 19 12 19 L14 19 C16 19 17 18 17 16 L17 14 L17 11 M9 11 L9 9 L8 8 C7.5 7.5 7 7.5 6.5 8 C6 8.5 6 9 6.5 9.5 L8 11 L9 12" />
    </svg>
  );
};

export default WhistleIcon;

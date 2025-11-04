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
      {/* Hand palm and fingers */}
      <path d="M18 11V8c0-1-0.5-2-1.5-2S15 7 15 8v3m0 0V7c0-1-0.5-2-1.5-2S12 6 12 7v4m0 0V6c0-1-0.5-2-1.5-2S9 5 9 6v5m0 0v3c0 2 1 3 3 3h2c2 0 3-1 3-3v-3m-8 0V9l-1-1c-0.5-0.5-1-0.5-1.5 0s-0.5 1 0 1.5l1 1.5" />
    </svg>
  );
};

export default WhistleIcon;

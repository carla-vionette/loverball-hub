import { motion } from "framer-motion";
import { useEffect } from "react";

interface BadgeUnlockAnimationProps {
  emoji: string;
  label: string;
  onDone: () => void;
}

export default function BadgeUnlockAnimation({ emoji, label, onDone }: BadgeUnlockAnimationProps) {
  useEffect(() => {
    const timer = setTimeout(onDone, 3000);
    return () => clearTimeout(timer);
  }, [onDone]);

  return (
    <motion.div
      className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Backdrop */}
      <motion.div
        className="absolute inset-0 bg-foreground/40 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      />

      {/* Badge card */}
      <motion.div
        className="relative z-10 flex flex-col items-center gap-4 bg-card rounded-3xl p-8 shadow-2xl border border-border/30 pointer-events-auto"
        initial={{ scale: 0, rotate: -10 }}
        animate={{
          scale: 1,
          rotate: 0,
          transition: { type: "spring", stiffness: 200, damping: 15 },
        }}
        exit={{ scale: 0, opacity: 0 }}
      >
        {/* Glow ring */}
        <motion.div
          className="absolute -inset-4 rounded-[2rem] opacity-30"
          style={{ background: "var(--gradient-sunset)" }}
          animate={{
            scale: [1, 1.05, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{ duration: 2, repeat: Infinity }}
        />

        {/* Sparkles */}
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute text-lg"
            initial={{ opacity: 0, scale: 0 }}
            animate={{
              opacity: [0, 1, 0],
              scale: [0, 1.5, 0],
              x: Math.cos((i * Math.PI * 2) / 6) * 80,
              y: Math.sin((i * Math.PI * 2) / 6) * 80,
            }}
            transition={{ delay: 0.3 + i * 0.1, duration: 0.8 }}
          >
            ✨
          </motion.div>
        ))}

        <motion.span
          className="text-6xl relative z-10"
          initial={{ scale: 0 }}
          animate={{ scale: [0, 1.3, 1] }}
          transition={{ delay: 0.2, type: "spring", stiffness: 300 }}
        >
          {emoji}
        </motion.span>

        <motion.div
          className="text-center relative z-10"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <p className="text-xs font-semibold text-accent uppercase tracking-widest">Badge Unlocked!</p>
          <p className="text-lg font-display font-bold text-foreground mt-1">{label}</p>
        </motion.div>

        <motion.button
          className="mt-2 px-6 py-2 rounded-full bg-accent text-accent-foreground text-sm font-semibold relative z-10"
          onClick={onDone}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          whileTap={{ scale: 0.95 }}
        >
          Awesome! 🎉
        </motion.button>
      </motion.div>
    </motion.div>
  );
}

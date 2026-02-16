import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const quotes = [
  "She believed she could, so she did.",
  "Champions are made when no one is watching.",
  "Your only limit is you.",
  "Play like a girl? Hell yes.",
  "The game starts when you show up.",
  "Greatness has no ceiling.",
];

interface WelcomeSplashProps {
  name: string;
  onDismiss: () => void;
}

const WelcomeSplash = ({ name, onDismiss }: WelcomeSplashProps) => {
  const [visible, setVisible] = useState(true);
  const quote = quotes[Math.floor(Math.random() * quotes.length)];
  const firstName = name?.split(" ")[0] || "Queen";

  const handleDismiss = () => {
    setVisible(false);
    setTimeout(onDismiss, 600);
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-black cursor-pointer select-none"
          onClick={handleDismiss}
          onTouchStart={handleDismiss}
        >
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="text-center px-8 max-w-lg"
          >
            <p className="text-accent text-xs tracking-[0.3em] uppercase mb-6">
              Welcome back
            </p>
            <h1 className="text-3xl md:text-5xl font-serif text-white leading-tight mb-8">
              Hey, {firstName}.
            </h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1, delay: 0.8 }}
              className="text-white/60 text-lg md:text-xl font-serif italic leading-relaxed"
            >
              "{quote}"
            </motion.p>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.4 }}
            transition={{ duration: 1, delay: 1.5 }}
            className="absolute bottom-12 text-white/40 text-xs tracking-[0.2em] uppercase"
          >
            Tap anywhere to continue
          </motion.p>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default WelcomeSplash;

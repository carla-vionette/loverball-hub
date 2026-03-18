import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const WelcomeBanner = () => {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const shouldShow = sessionStorage.getItem("loverball_show_welcome");
    if (shouldShow === "true") {
      setShow(true);
      sessionStorage.removeItem("loverball_show_welcome");
    }
  }, []);

  if (!show) return null;

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="bg-primary text-primary-foreground px-4 py-3 flex items-center justify-between rounded-xl mx-4 mt-4"
        >
          <div className="flex items-center gap-2">
            <span className="text-lg">🎉</span>
            <span className="text-sm font-semibold">Welcome to Loverball!</span>
          </div>
          <button onClick={() => setShow(false)} className="p-1 hover:bg-white/20 rounded-full transition-colors">
            <X className="w-4 h-4" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default WelcomeBanner;

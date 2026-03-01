import React, { useState, useEffect } from "react";
import { WifiOff, RefreshCw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";

/**
 * Global offline/online banner. Shows a persistent banner when the user goes offline,
 * and a brief "back online" confirmation on reconnect.
 */
const NetworkStatus = () => {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [showReconnected, setShowReconnected] = useState(false);

  useEffect(() => {
    const goOffline = () => setIsOffline(true);
    const goOnline = () => {
      setIsOffline(false);
      setShowReconnected(true);
      setTimeout(() => setShowReconnected(false), 3000);
    };

    window.addEventListener("offline", goOffline);
    window.addEventListener("online", goOnline);
    return () => {
      window.removeEventListener("offline", goOffline);
      window.removeEventListener("online", goOnline);
    };
  }, []);

  return (
    <AnimatePresence>
      {isOffline && (
        <motion.div
          initial={{ y: -60, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -60, opacity: 0 }}
          className="fixed top-0 left-0 right-0 z-[100] bg-destructive text-destructive-foreground px-4 py-3 flex items-center justify-center gap-3 shadow-lg"
          role="alert"
          aria-live="assertive"
        >
          <WifiOff className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
          <span className="text-sm font-medium">You're offline. Some features may not work.</span>
          <Button
            size="sm"
            variant="secondary"
            className="rounded-full text-xs h-7 px-3"
            onClick={() => window.location.reload()}
          >
            <RefreshCw className="w-3 h-3 mr-1" /> Retry
          </Button>
        </motion.div>
      )}

      {showReconnected && (
        <motion.div
          initial={{ y: -60, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -60, opacity: 0 }}
          className="fixed top-0 left-0 right-0 z-[100] bg-accent text-accent-foreground px-4 py-3 flex items-center justify-center gap-2"
          role="status"
          aria-live="polite"
        >
          <span className="text-sm font-medium">✓ Back online</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default NetworkStatus;

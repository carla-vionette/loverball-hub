import { useRef, useState, useCallback, useEffect } from "react";
import { motion, useMotionValue, useTransform } from "framer-motion";
import { RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { triggerHaptic } from "@/hooks/useGestures";

interface PullToRefreshProps {
  onRefresh: () => Promise<void> | void;
  children: React.ReactNode;
  className?: string;
  threshold?: number;
}

/**
 * Pull-to-refresh wrapper with elastic bounce animation and haptic feedback.
 */
const PullToRefresh = ({
  onRefresh,
  children,
  className,
  threshold = 80,
}: PullToRefreshProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [refreshing, setRefreshing] = useState(false);
  const pullY = useMotionValue(0);
  const spinRotation = useTransform(pullY, [0, threshold], [0, 360]);
  const opacity = useTransform(pullY, [0, threshold / 2, threshold], [0, 0.5, 1]);
  const scale = useTransform(pullY, [0, threshold], [0.5, 1]);

  const touchStart = useRef(0);
  const pulling = useRef(false);

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (refreshing) return;
      const scrollTop = containerRef.current?.scrollTop ?? 0;
      if (scrollTop <= 0) {
        touchStart.current = e.touches[0].clientY;
        pulling.current = true;
      }
    },
    [refreshing]
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!pulling.current || refreshing) return;
      const dy = Math.max(0, (e.touches[0].clientY - touchStart.current) * 0.5);
      pullY.set(Math.min(dy, threshold * 1.5));
    },
    [pullY, threshold, refreshing]
  );

  const handleTouchEnd = useCallback(async () => {
    if (!pulling.current) return;
    pulling.current = false;

    if (pullY.get() >= threshold) {
      setRefreshing(true);
      triggerHaptic("medium");
      try {
        await onRefresh();
      } finally {
        setRefreshing(false);
      }
    }
    pullY.set(0);
  }, [pullY, threshold, onRefresh]);

  return (
    <div
      ref={containerRef}
      className={cn("relative overflow-y-auto", className)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Refresh indicator */}
      <motion.div
        className="absolute left-1/2 -translate-x-1/2 z-50 flex items-center justify-center"
        style={{ y: useTransform(pullY, (v) => v - 40), opacity, scale }}
      >
        <motion.div
          className="w-10 h-10 rounded-full bg-card shadow-lg flex items-center justify-center border border-border"
          style={{ rotate: refreshing ? undefined : spinRotation }}
          animate={refreshing ? { rotate: 360 } : undefined}
          transition={refreshing ? { repeat: Infinity, duration: 0.8, ease: "linear" } : undefined}
        >
          <RefreshCw className="w-4 h-4 text-primary" aria-hidden="true" />
        </motion.div>
      </motion.div>

      {children}
    </div>
  );
};

export { PullToRefresh };

import { useRef, useCallback, useEffect } from "react";

interface SwipeCallbacks {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  onLongPress?: (e: TouchEvent) => void;
  onDoubleTap?: (side: "left" | "right" | "center") => void;
}

interface GestureOptions {
  swipeThreshold?: number;
  velocityThreshold?: number;
  longPressDelay?: number;
}

/**
 * Touch gesture handler: swipe (with velocity), long-press, double-tap side detection.
 */
export function useGestures<T extends HTMLElement = HTMLDivElement>(
  callbacks: SwipeCallbacks,
  options: GestureOptions = {}
) {
  const ref = useRef<T>(null);
  const {
    swipeThreshold = 50,
    velocityThreshold = 0.3,
    longPressDelay = 500,
  } = options;

  const touchState = useRef({
    startX: 0,
    startY: 0,
    startTime: 0,
    longPressTimer: null as ReturnType<typeof setTimeout> | null,
    lastTapTime: 0,
  });

  const handleTouchStart = useCallback(
    (e: TouchEvent) => {
      const touch = e.touches[0];
      const state = touchState.current;
      state.startX = touch.clientX;
      state.startY = touch.clientY;
      state.startTime = Date.now();

      // Long press
      if (callbacks.onLongPress) {
        state.longPressTimer = setTimeout(() => {
          callbacks.onLongPress?.(e);
          triggerHaptic("medium");
        }, longPressDelay);
      }
    },
    [callbacks, longPressDelay]
  );

  const handleTouchEnd = useCallback(
    (e: TouchEvent) => {
      const state = touchState.current;
      if (state.longPressTimer) clearTimeout(state.longPressTimer);

      const touch = e.changedTouches[0];
      const dx = touch.clientX - state.startX;
      const dy = touch.clientY - state.startY;
      const dt = (Date.now() - state.startTime) / 1000;
      const velocity = Math.sqrt(dx * dx + dy * dy) / dt;

      const absDx = Math.abs(dx);
      const absDy = Math.abs(dy);

      // Swipe detection with velocity
      if (velocity > velocityThreshold && (absDx > swipeThreshold || absDy > swipeThreshold)) {
        if (absDx > absDy) {
          if (dx > 0) callbacks.onSwipeRight?.();
          else callbacks.onSwipeLeft?.();
        } else {
          if (dy > 0) callbacks.onSwipeDown?.();
          else callbacks.onSwipeUp?.();
        }
        triggerHaptic("light");
        return;
      }

      // Double tap detection
      if (absDx < 10 && absDy < 10 && callbacks.onDoubleTap) {
        const now = Date.now();
        if (now - state.lastTapTime < 300) {
          const el = ref.current;
          if (el) {
            const rect = el.getBoundingClientRect();
            const tapX = touch.clientX - rect.left;
            const third = rect.width / 3;
            const side = tapX < third ? "left" : tapX > third * 2 ? "right" : "center";
            callbacks.onDoubleTap(side);
            triggerHaptic("light");
          }
          state.lastTapTime = 0;
        } else {
          state.lastTapTime = now;
        }
      }
    },
    [callbacks, swipeThreshold, velocityThreshold]
  );

  const handleTouchMove = useCallback(() => {
    const state = touchState.current;
    if (state.longPressTimer) clearTimeout(state.longPressTimer);
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    el.addEventListener("touchstart", handleTouchStart, { passive: true });
    el.addEventListener("touchend", handleTouchEnd, { passive: true });
    el.addEventListener("touchmove", handleTouchMove, { passive: true });

    return () => {
      el.removeEventListener("touchstart", handleTouchStart);
      el.removeEventListener("touchend", handleTouchEnd);
      el.removeEventListener("touchmove", handleTouchMove);
    };
  }, [handleTouchStart, handleTouchEnd, handleTouchMove]);

  return ref;
}

/**
 * Trigger haptic feedback on supported devices.
 */
export function triggerHaptic(intensity: "light" | "medium" | "heavy" = "light") {
  if ("vibrate" in navigator) {
    const durations = { light: 10, medium: 25, heavy: 50 };
    navigator.vibrate(durations[intensity]);
  }
}

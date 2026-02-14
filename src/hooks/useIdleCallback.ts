import { useEffect, useRef } from "react";

/**
 * Schedules non-critical work using requestIdleCallback (with setTimeout fallback).
 * Automatically cancels on unmount.
 */
export function useIdleCallback(
  callback: () => void,
  options?: { timeout?: number }
) {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  useEffect(() => {
    if ("requestIdleCallback" in window) {
      const id = window.requestIdleCallback(
        () => callbackRef.current(),
        options
      );
      return () => window.cancelIdleCallback(id);
    } else {
      const id = setTimeout(() => callbackRef.current(), options?.timeout ?? 100);
      return () => clearTimeout(id);
    }
  }, [options?.timeout]);
}

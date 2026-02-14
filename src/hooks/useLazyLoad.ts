import { useEffect, useRef, useState, useCallback } from "react";

interface UseLazyLoadOptions {
  threshold?: number;
  rootMargin?: string;
  triggerOnce?: boolean;
}

/**
 * Intersection Observer hook for lazy loading images and components.
 * Returns [ref, isVisible] — attach ref to element, use isVisible to conditionally render.
 */
export function useLazyLoad<T extends HTMLElement = HTMLDivElement>(
  options: UseLazyLoadOptions = {}
) {
  const { threshold = 0.1, rootMargin = "200px 0px", triggerOnce = true } = options;
  const ref = useRef<T>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          if (triggerOnce) observer.unobserve(el);
        } else if (!triggerOnce) {
          setIsVisible(false);
        }
      },
      { threshold, rootMargin }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold, rootMargin, triggerOnce]);

  return [ref, isVisible] as const;
}

/**
 * Lazy-loads an image: shows placeholder until in viewport, then fades in the real src.
 */
export function useLazyImage(src: string, placeholder?: string) {
  const [ref, isVisible] = useLazyLoad<HTMLImageElement>({ rootMargin: "400px 0px" });
  const [loaded, setLoaded] = useState(false);
  const [currentSrc, setCurrentSrc] = useState(placeholder || "");

  useEffect(() => {
    if (!isVisible || !src) return;

    const img = new Image();
    img.src = src;
    img.onload = () => {
      setCurrentSrc(src);
      setLoaded(true);
    };
  }, [isVisible, src]);

  return { ref, currentSrc, loaded, isVisible };
}

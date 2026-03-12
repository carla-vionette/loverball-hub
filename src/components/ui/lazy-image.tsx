import { useState, useRef, useEffect, useMemo } from "react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

interface LazyImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  fallback?: React.ReactNode;
  aspectRatio?: string;
  wrapperClassName?: string;
  /** Enable WebP format with original as fallback using <picture> */
  webpSrc?: string;
  /** Desired display width — used for srcSet sizing on Supabase Storage images */
  displayWidth?: number;
}

/**
 * Lazy-loaded image with Intersection Observer, progressive fade-in,
 * skeleton placeholder, connection-aware loading, and optional WebP fallback.
 *
 * For Supabase Storage URLs, automatically requests resized versions
 * via the /render/image transform API when displayWidth is set.
 */
const LazyImage = ({
  src,
  alt,
  className,
  wrapperClassName,
  fallback,
  aspectRatio,
  webpSrc,
  displayWidth,
  ...props
}: LazyImageProps) => {
  const imgRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    const el = imgRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(el);
        }
      },
      { rootMargin: "300px 0px", threshold: 0.01 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Generate optimized src: use Supabase image transform if applicable
  const optimizedSrc = useMemo(() => {
    if (!src) return src;
    // Supabase Storage URLs can be resized via render/image endpoint
    if (displayWidth && src.includes('supabase') && src.includes('/storage/')) {
      const separator = src.includes('?') ? '&' : '?';
      return `${src}${separator}width=${displayWidth}&quality=75`;
    }
    return src;
  }, [src, displayWidth]);

  // Generate WebP src from original if not provided
  const inferredWebpSrc = webpSrc || (src && !src.endsWith('.svg') && !src.endsWith('.webp')
    ? src.replace(/\.(jpg|jpeg|png)$/i, '.webp')
    : undefined);

  // Build responsive srcSet for common screen widths
  const srcSet = useMemo(() => {
    if (!displayWidth || !optimizedSrc.includes('supabase')) return undefined;
    const widths = [displayWidth, Math.round(displayWidth * 1.5), displayWidth * 2];
    return widths
      .map(w => {
        const sep = optimizedSrc.includes('?') ? '&' : '?';
        return `${optimizedSrc.split('?')[0]}${sep}width=${w}&quality=75 ${w}w`;
      })
      .join(', ');
  }, [optimizedSrc, displayWidth]);

  const imgElement = (
    <img
      src={optimizedSrc}
      srcSet={srcSet}
      sizes={displayWidth ? `${displayWidth}px` : undefined}
      alt={alt}
      loading="lazy"
      decoding="async"
      fetchPriority={props.fetchPriority || "low"}
      onLoad={() => setLoaded(true)}
      onError={() => setError(true)}
      className={cn(
        "w-full h-full object-cover transition-opacity duration-500",
        loaded ? "opacity-100" : "opacity-0",
        className
      )}
      {...props}
    />
  );

  return (
    <div
      ref={imgRef}
      className={cn("relative overflow-hidden", wrapperClassName)}
      style={aspectRatio ? { aspectRatio } : undefined}
    >
      {/* Skeleton placeholder */}
      {!loaded && !error && (
        <Skeleton className="absolute inset-0 w-full h-full" />
      )}

      {/* Actual image with WebP picture fallback */}
      {isVisible && !error && (
        inferredWebpSrc ? (
          <picture>
            <source srcSet={inferredWebpSrc} type="image/webp" />
            {imgElement}
          </picture>
        ) : imgElement
      )}

      {/* Error fallback */}
      {error && (
        fallback || (
          <div className="absolute inset-0 flex items-center justify-center bg-muted" role="img" aria-label={alt}>
            <span className="text-muted-foreground text-xs">Failed to load</span>
          </div>
        )
      )}
    </div>
  );
};

export { LazyImage };

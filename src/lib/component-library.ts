/**
 * Loverball Component Library
 * ──────────────────────────────
 * Reusable components, hooks, and utilities for mobile-first development.
 *
 * COMPONENTS:
 * - LazyImage: Intersection Observer lazy loading with skeleton + fade-in
 * - PullToRefresh: Elastic pull-to-refresh with haptic feedback
 * - ErrorBoundary: Catches render errors with retry mechanism
 * - EmptyState: Icon + title + description + CTA for empty screens
 * - SkeletonCard: Pre-built skeleton cards (video, channel, event, member, product)
 * - SkeletonGrid: Grid of skeleton cards
 * - PageTransition: Fade/slide page transitions (respects reduced motion)
 *
 * HOOKS:
 * - useLazyLoad: Generic Intersection Observer for any element
 * - useLazyImage: Image-specific lazy loading with progressive reveal
 * - useGestures: Swipe (velocity), double-tap, long-press detection
 * - useReducedMotion: Respects prefers-reduced-motion
 * - useIdleCallback: Schedule non-critical work via requestIdleCallback
 * - useCachedFetch: Memory cache with 1h TTL + stale fallback
 * - useShare: Native Share API with clipboard fallback
 * - useIsMobile: Responsive breakpoint detection (< 768px)
 * - triggerHaptic: Vibration API for haptic feedback
 *
 * DESIGN TOKENS (index.css / tailwind):
 * - .tap-target: 44px min touch target
 * - .focus-ring: Keyboard focus indicator
 * - .press-scale: Active press micro-interaction
 * - .safe-top/.safe-bottom: Safe area insets for notched devices
 * - .momentum-scroll: Native-feeling iOS scroll
 * - animate-fade-in, animate-slide-up, animate-scale-in: Entry animations
 * - animate-shimmer: Loading shimmer effect
 *
 * PWA:
 * - /manifest.json: Web app manifest with shortcuts, share target
 * - Apple meta tags for splash screen, status bar theming
 * - viewport-fit=cover for full-bleed on notched devices
 */

// Components
export { LazyImage } from "@/components/ui/lazy-image";
export { PullToRefresh } from "@/components/ui/pull-to-refresh";
export { ErrorBoundary } from "@/components/ui/error-boundary";
export { EmptyState } from "@/components/ui/empty-state";
export { SkeletonCard, SkeletonGrid } from "@/components/ui/skeleton-card";
export { PageTransition } from "@/components/ui/page-transition";

// Hooks
export { useLazyLoad, useLazyImage } from "@/hooks/useLazyLoad";
export { useGestures, triggerHaptic } from "@/hooks/useGestures";
export { useReducedMotion } from "@/hooks/useReducedMotion";
export { useIdleCallback } from "@/hooks/useIdleCallback";
export { useCachedFetch, clearCache } from "@/hooks/useCachedFetch";
export { useShare } from "@/hooks/useShare";
export { useIsMobile } from "@/hooks/use-mobile";

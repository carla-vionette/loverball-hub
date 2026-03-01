import React, { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { trackPageView, trackExitPage, trackSessionStart, trackSessionEnd } from "@/lib/analytics";

/**
 * Tracks page views, time on page, session start/end, and exit pages.
 * Drop into any layout or top-level component.
 */
export const usePageTracking = () => {
  const location = useLocation();
  const pageEntryRef = useRef(Date.now());
  const sessionStartRef = useRef(Date.now());
  const hasTrackedSession = useRef(false);

  // Session start (once)
  useEffect(() => {
    if (!hasTrackedSession.current) {
      hasTrackedSession.current = true;
      trackSessionStart();
    }

    // Session end on tab close
    const handleUnload = () => {
      const duration = Date.now() - sessionStartRef.current;
      trackSessionEnd(duration);
      trackExitPage();
    };
    window.addEventListener("beforeunload", handleUnload);
    return () => window.removeEventListener("beforeunload", handleUnload);
  }, []);

  // Page view on route change + time on previous page
  useEffect(() => {
    const now = Date.now();
    const prevDuration = now - pageEntryRef.current;

    // Track time on previous page (skip if < 500ms — navigation bounce)
    if (prevDuration > 500) {
      trackPageView(location.pathname);
    }

    pageEntryRef.current = now;
    trackPageView(location.pathname);
  }, [location.pathname]);
};

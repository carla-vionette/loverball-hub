import { useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";

const ORIGIN_KEY = "lb_game_origin";
const RESTORE_KEY = "lb_scroll_restore";

export interface GameOrigin {
  path: string;
  scrollY: number;
}

/* ── Global tracker: drop into <PageTracker /> or App root ── */
export const useGameOriginTracker = () => {
  const location = useLocation();
  const scrollMap = useRef<Record<string, number>>({});
  const prevPathRef = useRef(location.pathname + location.search);

  // Continuously record scroll position per path
  useEffect(() => {
    const key = location.pathname + location.search;
    const handleScroll = () => {
      scrollMap.current[key] = window.scrollY;
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    scrollMap.current[key] = window.scrollY;
    return () => window.removeEventListener("scroll", handleScroll);
  }, [location.pathname, location.search]);

  // Before entering a game page, stash the last non-game route + its scroll position
  useEffect(() => {
    const prev = prevPathRef.current;
    if (!prev.startsWith("/game/") && !prev.startsWith("/games/")) {
      try {
        sessionStorage.setItem(
          ORIGIN_KEY,
          JSON.stringify({
            path: prev,
            scrollY: scrollMap.current[prev] ?? 0,
          })
        );
      } catch {
        // noop — storage may be full or private mode
      }
    }
    prevPathRef.current = location.pathname + location.search;
  }, [location.pathname, location.search]);

  // Also stash on full-page reload / window.location.href navigations
  useEffect(() => {
    const handleBeforeUnload = () => {
      const path = window.location.pathname + window.location.search;
      if (!path.startsWith("/game/") && !path.startsWith("/games/")) {
        try {
          sessionStorage.setItem(
            ORIGIN_KEY,
            JSON.stringify({ path, scrollY: window.scrollY })
          );
        } catch {
          // noop
        }
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, []);
};

/* ── Scroll restorer: drop into <PageTracker /> or App root ── */
export const useGameScrollRestore = () => {
  const location = useLocation();

  useEffect(() => {
    const raw = sessionStorage.getItem(RESTORE_KEY);
    if (!raw) return;
    try {
      const { path, scrollY }: GameOrigin = JSON.parse(raw);
      const current = location.pathname + location.search;
      if (path === current) {
        sessionStorage.removeItem(RESTORE_KEY);
        // Double rAF waits for React render + layout to settle
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            window.scrollTo(0, scrollY);
          });
        });
      }
    } catch {
      sessionStorage.removeItem(RESTORE_KEY);
    }
  }, [location.pathname, location.search]);
};

/* ── Back navigation for GameDetail ── */
export const useGameBackNavigation = () => {
  const navigate = useNavigate();

  const getOrigin = (): GameOrigin | null => {
    try {
      const raw = sessionStorage.getItem(ORIGIN_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  };

  const clearOrigin = () => {
    sessionStorage.removeItem(ORIGIN_KEY);
  };

  const goBack = () => {
    const origin = getOrigin();

    if (origin) {
      // Pre-register scroll restoration so the destination page picks it up
      try {
        sessionStorage.setItem(RESTORE_KEY, JSON.stringify(origin));
      } catch {
        // noop
      }
      clearOrigin();
      navigate(origin.path);
      return;
    }

    // Fallback: browser back if history exists, otherwise /feed
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate("/feed");
    }
  };

  return { goBack };
};

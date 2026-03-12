import { useState, useEffect } from "react";

export type ConnectionQuality = "fast" | "medium" | "slow" | "offline";

interface NetworkInfo {
  effectiveType?: string;
  downlink?: number;
  saveData?: boolean;
}

/**
 * Detects connection quality using the Network Information API.
 * Falls back to "medium" when API is unavailable.
 * Components can use this to reduce media quality or defer heavy loads.
 */
export function useConnectionQuality(): ConnectionQuality {
  const [quality, setQuality] = useState<ConnectionQuality>(() => getQuality());

  useEffect(() => {
    const conn = (navigator as any).connection;
    if (!conn) return;

    const handler = () => setQuality(getQuality());
    conn.addEventListener("change", handler);
    return () => conn.removeEventListener("change", handler);
  }, []);

  // Also track online/offline
  useEffect(() => {
    const goOffline = () => setQuality("offline");
    const goOnline = () => setQuality(getQuality());
    window.addEventListener("offline", goOffline);
    window.addEventListener("online", goOnline);
    return () => {
      window.removeEventListener("offline", goOffline);
      window.removeEventListener("online", goOnline);
    };
  }, []);

  return quality;
}

function getQuality(): ConnectionQuality {
  if (!navigator.onLine) return "offline";

  const conn = (navigator as any).connection as NetworkInfo | undefined;
  if (!conn) return "medium";

  // Respect user's data saver setting
  if (conn.saveData) return "slow";

  const type = conn.effectiveType;
  if (type === "slow-2g" || type === "2g") return "slow";
  if (type === "3g") return "medium";
  if (type === "4g") return "fast";

  // Fallback: check downlink speed
  const dl = conn.downlink;
  if (dl !== undefined) {
    if (dl < 0.5) return "slow";
    if (dl < 2) return "medium";
    return "fast";
  }

  return "medium";
}

/**
 * Returns true if the connection is slow (2G/3G/saveData).
 * Use to conditionally skip heavy media.
 */
export function useIsSlowConnection(): boolean {
  const q = useConnectionQuality();
  return q === "slow" || q === "offline";
}

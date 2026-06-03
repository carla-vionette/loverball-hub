import { useEffect, useState } from "react";

/**
 * useNetworkQuality — exposes the user's current connection profile.
 *
 * Uses the Network Information API (navigator.connection) where available.
 * Falls back to assuming a fast connection on browsers that don't support it
 * (mostly Safari/iOS — those users have either WiFi or LTE).
 *
 * Re-renders when the connection changes (e.g. user moves from WiFi to LTE).
 *
 * Returns:
 *   - effectiveType: '4g' | '3g' | '2g' | 'slow-2g' (NetInfo's category)
 *   - saveData:      whether the user has Lite/Data Saver mode enabled
 *   - isSlow:        true if 3g/2g/slow-2g OR saveData is on (the main flag to gate on)
 *   - downlink:      estimated downlink in Mbps (may be undefined)
 *   - rtt:           estimated round-trip time in ms (may be undefined)
 */
export type NetworkQuality = {
  effectiveType: "4g" | "3g" | "2g" | "slow-2g";
  saveData: boolean;
  isSlow: boolean;
  downlink?: number;
  rtt?: number;
};

type NetInfo = {
  effectiveType?: NetworkQuality["effectiveType"];
  saveData?: boolean;
  downlink?: number;
  rtt?: number;
  addEventListener?: (type: "change", listener: () => void) => void;
  removeEventListener?: (type: "change", listener: () => void) => void;
};

function read(): NetworkQuality {
  // Network Information API isn't in the standard navigator type yet.
  const conn = (typeof navigator !== "undefined"
    ? ((navigator as unknown as { connection?: NetInfo }).connection)
    : undefined) as NetInfo | undefined;

  const effectiveType = (conn?.effectiveType ?? "4g") as NetworkQuality["effectiveType"];
  const saveData = Boolean(conn?.saveData);
  const isSlow = saveData || effectiveType === "3g" || effectiveType === "2g" || effectiveType === "slow-2g";

  return {
    effectiveType,
    saveData,
    isSlow,
    downlink: conn?.downlink,
    rtt: conn?.rtt,
  };
}

export function useNetworkQuality(): NetworkQuality {
  const [quality, setQuality] = useState<NetworkQuality>(() => read());

  useEffect(() => {
    if (typeof navigator === "undefined") return;
    const conn = (navigator as unknown as { connection?: NetInfo }).connection;
    if (!conn?.addEventListener) return;

    const onChange = () => setQuality(read());
    conn.addEventListener("change", onChange);
    return () => conn.removeEventListener?.("change", onChange);
  }, []);

  return quality;
}

/** Synchronous one-shot read for places where a hook isn't appropriate. */
export function getNetworkQuality(): NetworkQuality {
  return read();
}

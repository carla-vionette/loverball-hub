/**
 * Cross-tab sync bus for the event password gate.
 *
 * Goal: when one tab successfully unlocks an event, every other open tab
 * viewing the same event reflects that immediately — without any manual refresh.
 *
 * The server remains the source of truth; this is a UX polish layer. We use
 * BroadcastChannel where available (modern browsers) and fall back to a
 * `storage` event on localStorage (works across tabs in every browser we
 * support, including Safari).
 *
 * Messages are per-event so two events open in different tabs don't bleed
 * into each other.
 */

export type GateBusMessage = { type: "unlocked"; at: number };

type Handler = (msg: GateBusMessage) => void;

const CHANNEL_PREFIX = "event-pw-gate:";
const STORAGE_PREFIX = "event_pw_bus_";

const channelName = (eventId: string) => `${CHANNEL_PREFIX}${eventId}`;
const storageKey = (eventId: string) => `${STORAGE_PREFIX}${eventId}`;

const hasBroadcastChannel = () =>
  typeof globalThis !== "undefined" && typeof (globalThis as { BroadcastChannel?: unknown }).BroadcastChannel === "function";

export interface GateBus {
  publish: (msg: GateBusMessage) => void;
  close: () => void;
}

/**
 * Subscribe to cross-tab messages for `eventId`. Returns a publisher + a
 * close fn. The handler is NEVER invoked for messages published by the same
 * caller (we de-dupe via a per-instance id) — only sibling tabs trigger it.
 */
export const subscribeGateBus = (eventId: string, handler: Handler): GateBus => {
  const instanceId = Math.random().toString(36).slice(2);
  const wrappedHandler = (raw: unknown) => {
    if (!raw || typeof raw !== "object") return;
    const data = raw as GateBusMessage & { _from?: string };
    if (data._from === instanceId) return;
    handler(data);
  };

  // --- BroadcastChannel path ---
  let bc: BroadcastChannel | null = null;
  if (hasBroadcastChannel()) {
    try {
      bc = new BroadcastChannel(channelName(eventId));
      bc.onmessage = (e: MessageEvent) => wrappedHandler(e.data);
    } catch {
      bc = null;
    }
  }

  // --- localStorage fallback (always wired — covers BroadcastChannel gaps
  //     like Safari private mode and gives a belt-and-braces signal). ---
  const onStorage = (e: StorageEvent) => {
    if (e.key !== storageKey(eventId) || !e.newValue) return;
    try {
      wrappedHandler(JSON.parse(e.newValue));
    } catch {
      /* ignore malformed payloads */
    }
  };
  if (typeof window !== "undefined") {
    window.addEventListener("storage", onStorage);
  }

  const publish = (msg: GateBusMessage) => {
    const payload = { ...msg, _from: instanceId };
    try {
      bc?.postMessage(payload);
    } catch {
      /* ignore */
    }
    try {
      // Writing the same value twice in a row wouldn't fire `storage` in
      // every browser — append a nonce so each publish is unique.
      const wire = JSON.stringify({ ...payload, _n: `${Date.now()}-${Math.random()}` });
      localStorage.setItem(storageKey(eventId), wire);
    } catch {
      /* ignore */
    }
  };

  const close = () => {
    try {
      bc?.close();
    } catch {
      /* ignore */
    }
    if (typeof window !== "undefined") {
      window.removeEventListener("storage", onStorage);
    }
  };

  return { publish, close };
};

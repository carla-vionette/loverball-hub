/**
 * Cross-tab sync bus tests.
 *
 * Two "tabs" = two separate subscribeGateBus() instances backed by the same
 * (mocked) BroadcastChannel + the same localStorage. A publish in one must
 * deliver to the other and NOT echo back to itself.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { subscribeGateBus, type GateBusMessage } from "../eventPasswordGate.bus";

// ---- Minimal in-memory BroadcastChannel polyfill keyed by channel name ----
type Listener = (e: { data: unknown }) => void;
const channels = new Map<string, Set<Listener>>();

class FakeBroadcastChannel {
  private listeners: Set<Listener>;
  constructor(public name: string) {
    let set = channels.get(name);
    if (!set) {
      set = new Set();
      channels.set(name, set);
    }
    this.listeners = set;
  }
  private _onmessage: ((e: { data: unknown }) => void) | null = null;
  set onmessage(fn: (e: { data: unknown }) => void) {
    if (this._onmessage) this.listeners.delete(this._onmessage as Listener);
    this._onmessage = fn;
    this.listeners.add(fn as Listener);
  }
  get onmessage() {
    return this._onmessage as (e: { data: unknown }) => void;
  }
  postMessage(data: unknown) {
    // Real BroadcastChannel does NOT deliver to the sender, so neither do we.
    for (const l of this.listeners) {
      if (l === this._onmessage) continue;
      l({ data });
    }
  }
  close() {
    if (this._onmessage) this.listeners.delete(this._onmessage as Listener);
  }
}

beforeEach(() => {
  channels.clear();
  (globalThis as unknown as { BroadcastChannel: typeof FakeBroadcastChannel }).BroadcastChannel =
    FakeBroadcastChannel;
  localStorage.clear();
});

afterEach(() => {
  vi.restoreAllMocks();
});

const collect = () => {
  const got: GateBusMessage[] = [];
  return { got, handler: (m: GateBusMessage) => got.push(m) };
};

describe("subscribeGateBus", () => {
  it("delivers unlock from tab A to tab B (and not back to A)", () => {
    const a = collect();
    const b = collect();
    const busA = subscribeGateBus("evt-1", a.handler);
    const busB = subscribeGateBus("evt-1", b.handler);

    busA.publish({ type: "unlocked", at: 100 });

    expect(b.got).toHaveLength(1);
    expect(b.got[0].type).toBe("unlocked");
    expect(a.got).toHaveLength(0); // sender does not echo to itself

    busA.close();
    busB.close();
  });

  it("isolates traffic per event id", () => {
    const b = collect();
    const busA = subscribeGateBus("evt-A", () => {});
    const busB = subscribeGateBus("evt-B", b.handler);

    busA.publish({ type: "unlocked", at: 1 });

    expect(b.got).toEqual([]); // different channel
    busA.close();
    busB.close();
  });

  it("falls back to storage events when BroadcastChannel is unavailable", () => {
    // Remove BC; rely entirely on the storage-event path.
    delete (globalThis as { BroadcastChannel?: unknown }).BroadcastChannel;

    const b = collect();
    const busB = subscribeGateBus("evt-5", b.handler);

    // Manually simulate a storage event from another tab. (jsdom doesn't fire
    // storage events for same-window writes, which is exactly the production
    // behavior — events only fire in *other* tabs.)
    const key = "event_pw_bus_evt-5";
    const payload = JSON.stringify({ type: "unlocked", at: 7, _from: "other-tab" });
    window.dispatchEvent(
      new StorageEvent("storage", { key, newValue: payload }),
    );

    expect(b.got).toEqual([expect.objectContaining({ type: "unlocked" })]);
    busB.close();
  });
});

/**
 * UI-level tests for EventPasswordGate covering:
 *   - aria-invalid flipping on wrong submit
 *   - cross-tab sync: unlocked propagates between two mounted gates
 *
 * Two gates rendered in the same jsdom act as two tabs because they share
 * the in-memory BroadcastChannel polyfill and the same localStorage.
 */
import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// ---- Supabase mock: every test sets the response via this queue ----
const rpcQueue: Array<{ data?: unknown; error?: unknown }> = [];
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    rpc: vi.fn(async () => rpcQueue.shift() ?? { data: { ok: false } }),
  },
}));

// Import AFTER the mock so the component picks up the mocked client.
import EventPasswordGate from "../EventPasswordGate";
import { unlockKey } from "../eventPasswordGate.logic";

// ---- In-memory BroadcastChannel polyfill (sender does NOT receive own msg) ----
type Listener = (e: { data: unknown }) => void;
const channels = new Map<string, Set<Listener>>();
class FakeBroadcastChannel {
  private listeners: Set<Listener>;
  private _onmessage: Listener | null = null;
  constructor(public name: string) {
    let set = channels.get(name);
    if (!set) {
      set = new Set();
      channels.set(name, set);
    }
    this.listeners = set;
  }
  set onmessage(fn: Listener) {
    if (this._onmessage) this.listeners.delete(this._onmessage);
    this._onmessage = fn;
    this.listeners.add(fn);
  }
  get onmessage() {
    return this._onmessage as Listener;
  }
  postMessage(data: unknown) {
    for (const l of this.listeners) {
      if (l === this._onmessage) continue;
      l({ data });
    }
  }
  close() {
    if (this._onmessage) this.listeners.delete(this._onmessage);
  }
}

const EVENT_ID = "evt-test-1";

const renderGate = (key: string, onUnlock = vi.fn()) =>
  render(
    <EventPasswordGate
      key={key}
      eventId={EVENT_ID}
      eventTitle="Test Event"
      coverImage={null}
      onUnlock={onUnlock}
    />,
    { container: document.body.appendChild(document.createElement("div")) },
  );

const inputIn = (root: HTMLElement) =>
  within(root).getByLabelText(/event password/i) as HTMLInputElement;

const submitWith = async (root: HTMLElement, password: string) => {
  const input = inputIn(root);
  fireEvent.change(input, { target: { value: password } });
  const form = input.closest("form")!;
  await act(async () => {
    fireEvent.submit(form);
  });
};

beforeEach(() => {
  channels.clear();
  rpcQueue.length = 0;
  (globalThis as unknown as { BroadcastChannel: typeof FakeBroadcastChannel }).BroadcastChannel =
    FakeBroadcastChannel;
  localStorage.clear();
  sessionStorage.clear();
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("EventPasswordGate — accessible status messages", () => {
  it("flips aria-invalid after a wrong submit and shows an error", async () => {
    const { container } = renderGate("solo-1");
    const input = inputIn(container);
    expect(input).toHaveAttribute("aria-invalid", "false");

    rpcQueue.push({ data: { ok: false } });
    await submitWith(container, "nope");

    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByRole("alert")).toHaveTextContent(/didn't work/);
  });
});

describe("EventPasswordGate — cross-tab UI sync", () => {
  it("propagates unlock: tab B's onUnlock fires when tab A submits the correct password", async () => {
    const onUnlockA = vi.fn();
    const onUnlockB = vi.fn();
    const tabA = renderGate("tabA-3", onUnlockA);
    renderGate("tabB-3", onUnlockB);

    rpcQueue.push({ data: { ok: true } });
    await submitWith(tabA.container, "correct-pw");

    expect(onUnlockA).toHaveBeenCalledTimes(1);
    expect(onUnlockB).toHaveBeenCalledTimes(1);
    expect(sessionStorage.getItem(unlockKey(EVENT_ID))).toBe("1");
  });
});

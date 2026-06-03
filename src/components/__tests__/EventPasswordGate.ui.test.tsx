/**
 * UI-level tests for EventPasswordGate covering:
 *   - aria-invalid flipping on wrong submit
 *   - aria-live "attempts remaining" announcements
 *   - timer countdown updating second-by-second
 *   - cross-tab sync: wrong/locked/unlocked propagate between two mounted gates
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
    rpc: vi.fn(async () => rpcQueue.shift() ?? { data: { ok: false, attempts_left: 4 } }),
  },
}));

// Import AFTER the mock so the component picks up the mocked client.
import EventPasswordGate from "../EventPasswordGate";
import {
  MAX_ATTEMPTS,
  attemptsLeftKey,
  lockoutKey,
  unlockKey,
} from "../eventPasswordGate.logic";

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
    // Each render gets its own container so two "tabs" coexist without React
    // key collisions.
    { container: document.body.appendChild(document.createElement("div")) },
  );

const inputIn = (root: HTMLElement) =>
  within(root).getByLabelText(/event password/i) as HTMLInputElement;

// The gate renders two persistent live regions per instance — query each by
// its aria attributes so the test works even though ids include a useId
// suffix that varies between runs/tabs.
const attemptsRegion = (root: HTMLElement) =>
  root.querySelector('[aria-live="polite"]') as HTMLElement;
const statusRegion = (root: HTMLElement) =>
  root.querySelector('[role="timer"], [role="alert"]') as HTMLElement;

// Pull the integer second count out of the timer's aria-label
// ("N seconds until you can try again").
const secondsFromTimer = (timer: Element) =>
  parseInt(timer.getAttribute("aria-label")?.match(/^(\d+)/)?.[1] ?? "-1", 10);

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
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("EventPasswordGate — accessible status messages", () => {
  it("flips aria-invalid and announces remaining attempts after a wrong submit", async () => {
    const { container } = renderGate("solo-1");
    const input = inputIn(container);
    expect(input).toHaveAttribute("aria-invalid", "false");

    const region = attemptsRegion(container);
    expect(region).toHaveAttribute("aria-live", "polite");
    expect(region).toHaveAttribute("role", "status");
    expect(region.textContent?.trim()).toBe("");

    rpcQueue.push({ data: { ok: false, attempts_left: 3 } });
    await submitWith(container, "nope");

    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(region.textContent).toMatch(/3 attempts remaining/i);

    // aria-describedby still points at both regions so SRs read them together.
    const ids = (input.getAttribute("aria-describedby") ?? "").split(/\s+/);
    expect(ids).toContain(region.id);
    expect(ids).toContain(statusRegion(container).id);
  });

  it("uses singular copy on the last attempt", async () => {
    const { container } = renderGate("solo-2");
    rpcQueue.push({ data: { ok: false, attempts_left: 1 } });
    await submitWith(container, "still-no");

    expect(attemptsRegion(container).textContent).toMatch(/^1 attempt remaining/i);

    const status = statusRegion(container);
    expect(status).toHaveAttribute("role", "alert");
    expect(status.textContent).toMatch(/1 attempt left/i);
  });

  it("switches the status region into a live timer with a ticking countdown", async () => {
    vi.useFakeTimers();
    const baseline = new Date("2026-06-03T12:00:00Z").getTime();
    vi.setSystemTime(baseline);

    const { container } = renderGate("solo-3");
    rpcQueue.push({ data: { ok: false, locked: true, retry_after_seconds: 90 } });
    await submitWith(container, "wrong");

    const status = statusRegion(container);
    expect(status).toHaveAttribute("role", "timer");
    expect(status).toHaveAttribute("aria-live", "assertive");

    const timer = status.querySelector("time")!;
    expect(timer.textContent).toBe("1:30");
    expect(timer.getAttribute("datetime")).toBe("PT90S");
    expect(timer.getAttribute("aria-label")).toMatch(/90 seconds/);

    expect(inputIn(container)).toBeDisabled();
    expect(within(container).getByRole("button", { name: /^locked$/i })).toBeDisabled();

    // Advance 1 second — the gate's interval ticks `now`, the countdown drops.
    // (advanceTimersByTime also advances Date.now with fake timers, so we
    // don't need a parallel setSystemTime call here.)
    await act(async () => {
      vi.advanceTimersByTime(1_000);
    });
    expect(secondsFromTimer(timer)).toBe(89);
    expect(timer.textContent).toBe("1:29");

    // Advance another 30s while still locked — countdown drops further in lockstep.
    await act(async () => {
      vi.advanceTimersByTime(30_000);
    });
    expect(secondsFromTimer(timer)).toBe(59);
    expect(timer.textContent).toBe("0:59");
  });
});

describe("EventPasswordGate — cross-tab UI sync", () => {
  it("propagates a wrong-attempt count from tab A's live region to tab B", async () => {
    const tabA = renderGate("tabA-1");
    const tabB = renderGate("tabB-1");

    rpcQueue.push({ data: { ok: false, attempts_left: 2 } });
    await submitWith(tabA.container, "wrong-in-A");

    const aRegion = attemptsRegion(tabA.container);
    const bRegion = attemptsRegion(tabB.container);
    expect(aRegion.textContent).toMatch(/2 attempts remaining/i);
    expect(bRegion.textContent).toMatch(/2 attempts remaining/i);
    expect(bRegion).toHaveAttribute("aria-live", "polite");
  });

  it("propagates a lockout: tab B disables its input and shows the same countdown", async () => {
    vi.useFakeTimers();
    const baseline = new Date("2026-06-03T12:00:00Z").getTime();
    vi.setSystemTime(baseline);

    const tabA = renderGate("tabA-2");
    const tabB = renderGate("tabB-2");

    rpcQueue.push({ data: { ok: false, locked: true, retry_after_seconds: 60 } });
    await submitWith(tabA.container, "wrong-in-A");

    expect(inputIn(tabB.container)).toBeDisabled();
    const bStatus = statusRegion(tabB.container);
    expect(bStatus).toHaveAttribute("role", "timer");
    const bTimer = bStatus.querySelector("time")!;
    expect(bTimer.textContent).toBe("1:00");

    // Both tabs tick down in lockstep.
    await act(async () => {
      vi.setSystemTime(baseline + 5_000);
      vi.advanceTimersByTime(5_000);
    });
    const aTimer = statusRegion(tabA.container).querySelector("time")!;
    // Both tabs tick down in lockstep — exact second can drift by 1 because
    // of Math.ceil rounding at the boundary, but they must match each other.
    expect(aTimer.textContent).toMatch(/^0:[45]\d$/);
    expect(aTimer.textContent).toBe(bTimer.textContent);

    expect(parseInt(localStorage.getItem(lockoutKey(EVENT_ID)) || "0", 10)).toBeGreaterThan(
      baseline,
    );
  });

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
    expect(localStorage.getItem(lockoutKey(EVENT_ID))).toBeNull();
    expect(localStorage.getItem(attemptsLeftKey(EVENT_ID))).toBeNull();
  });

  it("re-enables both tabs simultaneously when the lockout countdown reaches zero", async () => {
    vi.useFakeTimers();
    const baseline = new Date("2026-06-03T12:00:00Z").getTime();
    vi.setSystemTime(baseline);

    const tabA = renderGate("tabA-4");
    const tabB = renderGate("tabB-4");

    rpcQueue.push({ data: { ok: false, locked: true, retry_after_seconds: 3 } });
    await submitWith(tabA.container, "wrong");

    expect(inputIn(tabA.container)).toBeDisabled();
    expect(inputIn(tabB.container)).toBeDisabled();

    // Fast-forward past the 3s cooldown.
    await act(async () => {
      vi.setSystemTime(baseline + 4_000);
      vi.advanceTimersByTime(4_000);
    });

    expect(inputIn(tabA.container)).not.toBeDisabled();
    expect(inputIn(tabB.container)).not.toBeDisabled();
    expect(inputIn(tabA.container)).toHaveAttribute("aria-invalid", "false");
    expect(inputIn(tabB.container)).toHaveAttribute("aria-invalid", "false");

    expect(
      within(tabA.container).getByRole("button", { name: /unlock event/i }),
    ).toBeEnabled();
    expect(
      within(tabB.container).getByRole("button", { name: /unlock event/i }),
    ).toBeEnabled();

    // Lockout deadline was cleared from storage by the cooldown_expired effect.
    expect(localStorage.getItem(lockoutKey(EVENT_ID))).toBeNull();
  });
});

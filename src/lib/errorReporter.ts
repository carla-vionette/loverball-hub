import { supabase } from "@/integrations/supabase/client";

interface ReportInput {
  message: string;
  stack?: string | null;
  componentStack?: string | null;
  source?: string;
}

const recent = new Map<string, number>();
const DEDUPE_MS = 5000;

async function report({ message, stack, componentStack, source }: ReportInput) {
  try {
    if (!message) return;
    const key = `${source ?? ""}:${message}`.slice(0, 300);
    const now = Date.now();
    const last = recent.get(key);
    if (last && now - last < DEDUPE_MS) return;
    recent.set(key, now);
    if (recent.size > 50) recent.clear();

    let userId: string | null = null;
    try {
      const { data } = await supabase.auth.getSession();
      userId = data.session?.user?.id ?? null;
    } catch {
      // ignore
    }

    const payload = {
      user_id: userId,
      message: String(message).slice(0, 2000),
      stack: stack ? String(stack).slice(0, 8000) : null,
      component_stack: componentStack ? String(componentStack).slice(0, 8000) : null,
      url: typeof window !== "undefined" ? window.location.href.slice(0, 1000) : null,
      route: typeof window !== "undefined" ? window.location.pathname.slice(0, 500) : null,
      user_agent: typeof navigator !== "undefined" ? navigator.userAgent.slice(0, 500) : null,
      source: source ?? "unknown",
    };

    void supabase.from("client_errors").insert(payload).then(() => {}, () => {});
  } catch {
    // Never throw from the reporter
  }
}

export const reportClientError = report;

let installed = false;
export function installErrorReporting() {
  if (installed || typeof window === "undefined") return;
  installed = true;

  window.addEventListener("error", (event: ErrorEvent) => {
    void report({
      message: event.message || event.error?.message || "Unknown error",
      stack: event.error?.stack ?? null,
      source: "window.onerror",
    });
  });

  window.addEventListener("unhandledrejection", (event: PromiseRejectionEvent) => {
    const reason: unknown = event.reason;
    const message =
      reason instanceof Error
        ? reason.message
        : typeof reason === "string"
          ? reason
          : (() => {
              try { return JSON.stringify(reason); } catch { return "Unhandled rejection"; }
            })();
    void report({
      message: message || "Unhandled rejection",
      stack: reason instanceof Error ? reason.stack ?? null : null,
      source: "unhandledrejection",
    });
  });
}

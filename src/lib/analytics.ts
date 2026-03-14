import { supabase } from "@/integrations/supabase/client";

// Generate a session ID persisted for the browser tab
const getSessionId = (): string => {
  let sid = sessionStorage.getItem("lb-session-id");
  if (!sid) {
    sid = crypto.randomUUID();
    sessionStorage.setItem("lb-session-id", sid);
  }
  return sid;
};

// Track event with automatic user/session context
// Input validation for analytics data
const sanitizeString = (val: string, maxLen = 200): string =>
  typeof val === 'string' ? val.slice(0, maxLen).replace(/[<>]/g, '') : '';

const sanitizeProperties = (props: Record<string, any>): Record<string, any> => {
  const clean: Record<string, any> = {};
  const keys = Object.keys(props).slice(0, 20); // max 20 properties
  for (const key of keys) {
    const k = sanitizeString(key, 50);
    const v = props[key];
    if (typeof v === 'string') clean[k] = sanitizeString(v, 500);
    else if (typeof v === 'number') clean[k] = Number.isFinite(v) ? v : 0;
    else if (typeof v === 'boolean') clean[k] = v;
    else if (Array.isArray(v)) clean[k] = v.slice(0, 10).map(i => typeof i === 'string' ? sanitizeString(i, 100) : i);
    // skip other types
  }
  return clean;
};

const VALID_EVENT_TYPES = ['page_view', 'user_behavior', 'engagement', 'content'];

export const trackEvent = async (
  eventType: string,
  eventName: string,
  properties: Record<string, any> = {},
  durationMs?: number
) => {
  try {
    // Validate event type and name
    const safeType = VALID_EVENT_TYPES.includes(eventType) ? eventType : 'user_behavior';
    const safeName = sanitizeString(eventName, 100);
    if (!safeName) return;

    const safeProps = sanitizeProperties(properties);
    const safeDuration = typeof durationMs === 'number' && Number.isFinite(durationMs) && durationMs >= 0
      ? Math.min(durationMs, 86400000) : null;

    const { data: { user } } = await supabase.auth.getUser();
    
    await supabase.from("analytics_events").insert({
      user_id: user?.id || null,
      session_id: getSessionId(),
      event_type: safeType,
      event_name: safeName,
      properties: safeProps,
      page_path: sanitizeString(window.location.pathname, 500),
      referrer_path: document.referrer ? sanitizeString(new URL(document.referrer).pathname, 500) : null,
      duration_ms: safeDuration,
    });
  } catch (e) {
    // Silent fail — analytics should never break the app
    console.debug("[analytics] Failed to track:", e);
  }
};

// ── Convenience helpers ──

// USER BEHAVIOR
export const trackPageView = (section?: string) =>
  trackEvent("page_view", "page_view", { section });

export const trackCTAClick = (ctaName: string, ctaLocation: string) =>
  trackEvent("user_behavior", "cta_click", { cta_name: ctaName, location: ctaLocation });

export const trackVideoProgress = (videoId: string, percent: number, category?: string) =>
  trackEvent("user_behavior", "video_progress", { video_id: videoId, percent, category });

export const trackVideoComplete = (videoId: string, category?: string) =>
  trackEvent("user_behavior", "video_complete", { video_id: videoId, category });

export const trackSearch = (query: string, resultCount: number, tab?: string) =>
  trackEvent("user_behavior", "search", { query, result_count: resultCount, tab, zero_results: resultCount === 0 });

export const trackShopFunnel = (step: "view" | "add_to_cart" | "checkout", productId: string, productTitle?: string, price?: string) =>
  trackEvent("user_behavior", "shop_funnel", { step, product_id: productId, product_title: productTitle, price });

export const trackEventRSVP = (eventId: string, status: string, eventTitle?: string) =>
  trackEvent("user_behavior", "event_rsvp", { event_id: eventId, status, event_title: eventTitle });

export const trackConnectionAction = (action: "request" | "accept" | "reject", targetUserId: string) =>
  trackEvent("user_behavior", "connection", { action, target_user_id: targetUserId });

export const trackMessageSent = (chatId: string) =>
  trackEvent("user_behavior", "message_sent", { chat_id: chatId });

// ENGAGEMENT
export const trackSessionStart = () =>
  trackEvent("engagement", "session_start", { timestamp: Date.now() });

export const trackSessionEnd = (durationMs: number) =>
  trackEvent("engagement", "session_end", {}, durationMs);

export const trackFeatureUse = (feature: string) =>
  trackEvent("engagement", "feature_use", { feature });

export const trackExitPage = () =>
  trackEvent("engagement", "exit_page", { path: window.location.pathname });

// CONTENT PERFORMANCE
export const trackContentView = (contentType: "video" | "event" | "article" | "product", contentId: string, title?: string) =>
  trackEvent("content", "content_view", { content_type: contentType, content_id: contentId, title });

export const trackTeamInteraction = (teamName: string, sport?: string) =>
  trackEvent("content", "team_interaction", { team: teamName, sport });

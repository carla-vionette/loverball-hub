export const isAuthEmailRateLimitError = (message?: string | null) =>
  /over_email_send_rate_limit|email rate limit exceeded|for security purposes/i.test(
    message ?? ""
  );

/**
 * Parses the "you can only request this after X seconds" message that
 * Supabase auth returns for OTP / magic-link throttling. Returns the
 * number of seconds the caller should wait, or a sensible default.
 */
export const parseRetryAfterSeconds = (message?: string | null): number => {
  if (!message) return 30;
  const match = message.match(/after\s+(\d+)\s*seconds?/i);
  if (match) {
    const n = parseInt(match[1], 10);
    if (!Number.isNaN(n) && n > 0) return Math.min(n, 600);
  }
  // Fallback cooldown for generic "email rate limit exceeded" errors.
  return 60;
};

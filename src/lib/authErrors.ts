export const isAuthEmailRateLimitError = (message?: string | null) =>
  /over_email_send_rate_limit|email rate limit exceeded/i.test(message ?? "");
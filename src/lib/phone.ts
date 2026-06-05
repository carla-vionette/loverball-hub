/**
 * Shared US phone helpers.
 *
 * All phone auth in the app sends E.164 (`+1XXXXXXXXXX`) to Supabase.
 * Use `normalizeUSPhone` before any `signInWithOtp` / `signUp` / `verifyOtp`
 * call, and `formatUSPhone` for live input display.
 */

/** Strip formatting and return strict E.164 (+1XXXXXXXXXX), or null if invalid. */
export const normalizeUSPhone = (raw: string): string | null => {
  if (!raw) return null;
  const digits = raw.replace(/\D/g, "");
  let ten = digits;
  if (ten.length === 11 && ten.startsWith("1")) ten = ten.slice(1);
  if (ten.length !== 10) return null;
  // NANP: area code & exchange code can't start with 0 or 1
  if (/^[01]/.test(ten) || /^[01]/.test(ten.slice(3))) return null;
  return `+1${ten}`;
};

/** Pretty-format as the user types: "(555) 123-4567". */
export const formatUSPhone = (raw: string): string => {
  const digits = raw.replace(/\D/g, "").replace(/^1/, "").slice(0, 10);
  if (digits.length === 0) return "";
  if (digits.length <= 3) return `(${digits}`;
  if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
};

/** True when the input is a valid US mobile number. */
export const isValidUSPhone = (raw: string): boolean => normalizeUSPhone(raw) !== null;

/**
 * Map a Supabase auth error message to a user-friendly toast title + description.
 * Returns null for unknown errors so callers can show a generic fallback.
 */
export const friendlyPhoneAuthError = (
  message: string
): { title: string; description: string } | null => {
  const msg = String(message || "");
  const lower = msg.toLowerCase();
  if (/provider.*not.*enabled|phone.*disabled|sms.*not.*enabled|unsupported.*provider|unsupported.*phone|sms.*provider/.test(lower)) {
    return {
      title: "Text messages aren't available right now",
      description: "We'll RSVP you with email instead — it only takes a sec.",
    };
  }
  if (/unsupported carrier|not a mobile number|landline/.test(lower)) {
    return {
      title: "That number can't receive our code",
      description: "Your carrier isn't supported. Try a different mobile number or use email.",
    };
  }
  if (/invalid.*phone|invalid.*number|phone.*format|invalid.*from.*number/.test(lower)) {
    return {
      title: "That phone number doesn't look right",
      description: "Enter a 10-digit US mobile number, e.g. (555) 123-4567.",
    };
  }
  if (/rate|too many|429/.test(lower)) {
    return {
      title: "Too many attempts",
      description: "Wait a minute before requesting another code.",
    };
  }
  if (/expired|invalid.*token|invalid.*otp|token.*has.*expired/.test(lower)) {
    return {
      title: "That code didn't work",
      description: "It may have expired. Tap resend to get a new one.",
    };
  }
  return null;
};

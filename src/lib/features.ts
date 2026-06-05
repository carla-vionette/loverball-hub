// Feature flags for Loverball.
//
// phoneAuth: gates the "Use phone" toggle on Signup and Onboarding.
// Flip to `true` AFTER enabling the Twilio phone provider in Lovable Cloud
// (backend → Users → Auth Settings → Phone provider).
// The SMS code path (signInWithOtp({ phone })) remains in place so this is a
// one-line re-enable once Twilio is connected and verified.
export const FEATURES = {
  phoneAuth: false,
} as const;

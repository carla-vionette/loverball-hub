import { describe, it, expect } from "vitest";
import { isPhoneProviderUnavailable } from "./phone";

describe("isPhoneProviderUnavailable", () => {
  it("matches a generic SMS send failure", () => {
    expect(isPhoneProviderUnavailable("Error sending sms: account suspended")).toBe(true);
  });

  it("matches when phone signups are not allowed", () => {
    expect(isPhoneProviderUnavailable("Signups not allowed for otp")).toBe(true);
  });

  it("matches a generic unable-to-process error", () => {
    expect(isPhoneProviderUnavailable("Unable to process request")).toBe(true);
  });

  it("returns false for an unrelated error (e.g. invalid token)", () => {
    expect(isPhoneProviderUnavailable("Invalid token")).toBe(false);
  });

  it("returns false for empty/nullish input", () => {
    expect(isPhoneProviderUnavailable("")).toBe(false);
    expect(isPhoneProviderUnavailable(null)).toBe(false);
    expect(isPhoneProviderUnavailable(undefined)).toBe(false);
  });
});

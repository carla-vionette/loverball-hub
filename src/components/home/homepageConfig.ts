// Editable proof-bar values + persona testimonials for the homepage.
// Non-technical edits live here; logic is in the section components.

export const HOMEPAGE_PROOF = {
  fans: "Beta in LA",
  events: "Early access",
  cities: "Invite code 7688",
};

// Placeholder testimonials are intentionally removed while Loverball is in
// beta. SocialProofSection renders a founding-member CTA when this array is empty.
export const PERSONA_TESTIMONIALS: Array<{
  name: string;
  cityLine: string;
  persona: string;
  quote: string;
  initials: string;
}> = [];

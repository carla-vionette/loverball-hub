// Editable proof-bar values + persona testimonials for the homepage.
// Non-technical edits live here; logic is in the section components.

export const HOMEPAGE_PROOF = {
  fans: "1,000+ fans",
  events: "3 sold-out events",
  cities: "growing in your city",
};

// TODO: replace with real member quotes. These are placeholders.
// Every card is intentionally flagged so fake social proof never ships unnoticed.
export const PERSONA_TESTIMONIALS: Array<{
  name: string;
  cityLine: string;
  persona: string;
  quote: string;
  initials: string;
}> = [
  {
    // TODO: replace with real member quote
    name: "Maya R.",
    cityLine: "Just moved to LA · Echo Park",
    persona: "New in town",
    quote:
      "I'd been here three weeks and didn't know a single person. By my second watch party I had a whole group chat going.",
    initials: "MR",
  },
  {
    // TODO: replace with real member quote
    name: "Jess T.",
    cityLine: "WNBA + NWSL fan · Highland Park",
    persona: "Tired of watching alone",
    quote:
      "I was the only person in my friend group who cared about the Sparks. Loverball found me ten more.",
    initials: "JT",
  },
  {
    // TODO: replace with real member quote
    name: "Riley A.",
    cityLine: "Lakers diehard · Silver Lake",
    persona: "All sports, all in",
    quote:
      "It's not just one league. Pulled up to a brunch + soccer party, ended up at a Lakers watch the next week.",
    initials: "RA",
  },
  {
    // TODO: replace with real member quote
    name: "Quinn D.",
    cityLine: "Founding member · Eastside",
    persona: "Came for events, stayed for friends",
    quote:
      "Started for the parties, stayed for the women I now text every weekend. This is the group chat I wanted.",
    initials: "QD",
  },
];

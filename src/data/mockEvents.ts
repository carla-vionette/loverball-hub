// Curated LA-area mock events for development. Used while live ticketing/
// scoreboard APIs (SeatGeek, ESPN, etc.) are not yet wired in. These six
// events anchor the Events tab so members can RSVP, open Watch Party
// modals, and exercise the chat thread without depending on real data.
//
// Each event includes:
//   • a stable `id` (prefixed `mock-la-…`) used as the event_id in
//     event_chat_messages and external_event_rsvps,
//   • a small set of mock chat messages (≥3 per event, plus one system
//     RSVP line) surfaced as a fallback display when the DB has none,
//   • two hand-picked nearby sports bars surfaced as "Recommended for
//     this game" at the top of the Watch Party bar selector.
//
// Flip USE_MOCK_DATA in src/lib/mockSportsEvents.ts when wiring real APIs.

import { addDays, format } from "date-fns";
import type { MockDbEvent } from "@/lib/mockSportsEvents";
import type { SportsBar } from "@/data/laSportsBars";
import { LA_SPORTS_BARS } from "@/data/laSportsBars";

export interface MockChatMessage {
  id: string;
  user_name: string;
  user_initial: string;
  message: string;
  /** Minutes ago — converted to a real timestamp at render. */
  minutes_ago: number;
  /** When true, renders as a centered italic raspberry system line. */
  is_system?: boolean;
}

export interface CuratedMockEvent {
  id: string;
  title: string;
  team_home: string;
  team_away: string;
  league: string;
  sport: string;
  sport_kind: "pro" | "college";
  is_womens: boolean;
  venue_name: string;
  venue_address: string;
  city: string;
  /** Days from "today" — keeps the calendar always upcoming in dev. */
  days_out: number;
  /** 24-hour HH:mm local kickoff/tipoff. */
  time: string;
  broadcast?: string;
  /** IDs from LA_SPORTS_BARS surfaced as recommended near this venue. */
  bar_ids: [string, string];
}

// ── The six curated LA events ──────────────────────────────────────────
export const LA_MOCK_EVENTS: CuratedMockEvent[] = [
  {
    id: "mock-la-acfc-001",
    title: "Angel City FC vs Bay FC",
    team_home: "Angel City FC",
    team_away: "Bay FC",
    league: "NWSL",
    sport: "soccer",
    sport_kind: "pro",
    is_womens: true,
    venue_name: "BMO Stadium",
    venue_address: "3939 S Figueroa St, Los Angeles, CA",
    city: "Los Angeles",
    days_out: 3,
    time: "19:30",
    broadcast: "Paramount+",
    bar_ids: ["the-cork-bar", "the-fox-hole"],
  },
  {
    id: "mock-la-lakers-001",
    title: "LA Lakers vs Golden State Warriors",
    team_home: "Los Angeles Lakers",
    team_away: "Golden State Warriors",
    league: "NBA",
    sport: "basketball",
    sport_kind: "pro",
    is_womens: false,
    venue_name: "Crypto.com Arena",
    venue_address: "1111 S Figueroa St, Los Angeles, CA",
    city: "Los Angeles",
    days_out: 5,
    time: "19:00",
    broadcast: "Spectrum SportsNet / TNT",
    bar_ids: ["the-escondite", "barneys-beanery"],
  },
  {
    id: "mock-la-ucla-001",
    title: "UCLA Women's Basketball vs USC",
    team_home: "UCLA Bruins",
    team_away: "USC Trojans",
    league: "NCAAW",
    sport: "basketball",
    sport_kind: "college",
    is_womens: true,
    venue_name: "Pauley Pavilion",
    venue_address: "301 Westwood Plaza, Los Angeles, CA",
    city: "Los Angeles",
    days_out: 7,
    time: "18:00",
    broadcast: "Big Ten Network",
    bar_ids: ["barneys-beanery", "the-fox-hole"],
  },
  {
    id: "mock-la-usc-001",
    title: "USC Football vs Notre Dame",
    team_home: "USC Trojans",
    team_away: "Notre Dame Fighting Irish",
    league: "NCAAF",
    sport: "football",
    sport_kind: "college",
    is_womens: false,
    venue_name: "LA Memorial Coliseum",
    venue_address: "3911 S Figueroa St, Los Angeles, CA",
    city: "Los Angeles",
    days_out: 10,
    time: "16:30",
    broadcast: "FOX",
    bar_ids: ["the-cork-bar", "tom-bergins"],
  },
  {
    id: "mock-la-lafc-001",
    title: "LAFC vs Seattle Sounders",
    team_home: "LAFC",
    team_away: "Seattle Sounders FC",
    league: "MLS",
    sport: "soccer",
    sport_kind: "pro",
    is_womens: false,
    venue_name: "BMO Stadium",
    venue_address: "3939 S Figueroa St, Los Angeles, CA",
    city: "Los Angeles",
    days_out: 12,
    time: "19:30",
    broadcast: "Apple TV (MLS Season Pass)",
    bar_ids: ["the-cork-bar", "the-pikey"],
  },
  {
    id: "mock-la-sparks-001",
    title: "LA Sparks vs New York Liberty",
    team_home: "Los Angeles Sparks",
    team_away: "New York Liberty",
    league: "WNBA",
    sport: "basketball",
    sport_kind: "pro",
    is_womens: true,
    venue_name: "Crypto.com Arena",
    venue_address: "1111 S Figueroa St, Los Angeles, CA",
    city: "Los Angeles",
    days_out: 15,
    time: "19:00",
    broadcast: "ESPN",
    bar_ids: ["the-escondite", "the-village-idiot"],
  },
];

// ── Mock chat messages (≥3 per event, plus a system RSVP line) ─────────
export const MOCK_EVENT_CHAT: Record<string, MockChatMessage[]> = {
  "mock-la-acfc-001": [
    { id: "c1", user_name: "Maya R.",   user_initial: "M", message: "Who's on the south sideline?? Trying to coordinate kits 💖", minutes_ago: 240 },
    { id: "c2", user_name: "Priya S.",  user_initial: "P", message: "I'll be there w/ 3 friends — sec 119. Pre-game tacos?", minutes_ago: 180 },
    { id: "sys1", user_name: "system",  user_initial: "•", message: "@jordan is going to the game 🏟️", minutes_ago: 90, is_system: true },
    { id: "c3", user_name: "Jordan T.", user_initial: "J", message: "Just got my ticket! First ACFC match, can't wait 🌹", minutes_ago: 88 },
  ],
  "mock-la-lakers-001": [
    { id: "c1", user_name: "Devon K.",  user_initial: "D", message: "Lakers/Dubs always feels like a playoff game. Showtime ✨", minutes_ago: 300 },
    { id: "c2", user_name: "Aisha M.",  user_initial: "A", message: "Anyone splitting an Uber from Silver Lake?", minutes_ago: 210 },
    { id: "sys1", user_name: "system",  user_initial: "•", message: "@cam is watching @ Barney's Beanery 🍺", minutes_ago: 120, is_system: true },
    { id: "c3", user_name: "Cam L.",    user_initial: "C", message: "Will be at Barney's if anyone wants to roll thru 🍻", minutes_ago: 115 },
  ],
  "mock-la-ucla-001": [
    { id: "c1", user_name: "Sage P.",   user_initial: "S", message: "Crosstown rivalry at Pauley, doesn't get better 🐻💛", minutes_ago: 360 },
    { id: "c2", user_name: "Nia W.",    user_initial: "N", message: "Tip is 6pm, gates at 5 — get there early for the student section energy", minutes_ago: 200 },
    { id: "sys1", user_name: "system",  user_initial: "•", message: "@reese is going to the game 🏟️", minutes_ago: 60, is_system: true },
    { id: "c3", user_name: "Reese A.",  user_initial: "R", message: "Bringing a foam finger, idgaf 🤣", minutes_ago: 58 },
  ],
  "mock-la-usc-001": [
    { id: "c1", user_name: "Bri H.",    user_initial: "B", message: "ND coming to the Coliseum — this one's gonna be loud 📣", minutes_ago: 420 },
    { id: "c2", user_name: "Eli J.",    user_initial: "E", message: "Tailgate at lot 1A from 1pm. We have a tent + cornhole, slide thru", minutes_ago: 260 },
    { id: "c3", user_name: "Talia V.",  user_initial: "T", message: "If you can't make it, FOX has the broadcast. Saturday Night Lights ✌️", minutes_ago: 150 },
    { id: "sys1", user_name: "system",  user_initial: "•", message: "@morgan is watching @ Tom Bergin's Tavern 🍺", minutes_ago: 75, is_system: true },
  ],
  "mock-la-lafc-001": [
    { id: "c1", user_name: "Sofia D.",  user_initial: "S", message: "3252 ALWAYS shows out for Sounders. Bring scarves 🖤⚜️", minutes_ago: 320 },
    { id: "c2", user_name: "Kai N.",    user_initial: "K", message: "Apple TV at my place if anyone can't get tix — DM me", minutes_ago: 180 },
    { id: "sys1", user_name: "system",  user_initial: "•", message: "@hana is watching @ The Pikey 🍺", minutes_ago: 95, is_system: true },
    { id: "c3", user_name: "Hana O.",   user_initial: "H", message: "The Pikey opens early for kickoff — they save us seats if you call 🤙", minutes_ago: 92 },
  ],
  "mock-la-sparks-001": [
    { id: "c1", user_name: "Imani C.",  user_initial: "I", message: "Sparks at home vs Liberty?? Stud showcase 🔥", minutes_ago: 280 },
    { id: "c2", user_name: "Quinn B.",  user_initial: "Q", message: "Anyone going early for warm-ups? Want to scout the new rookies", minutes_ago: 200 },
    { id: "c3", user_name: "Lola F.",   user_initial: "L", message: "Throwback Candace Parker jerseys still going strong in my closet 💜", minutes_ago: 100 },
    { id: "sys1", user_name: "system",  user_initial: "•", message: "@imani is going to the game 🏟️", minutes_ago: 45, is_system: true },
  ],
};

// ── Bar options per event (exactly 2 each, hand-picked near venue) ─────
export const MOCK_EVENT_BARS: Record<string, SportsBar[]> = Object.fromEntries(
  LA_MOCK_EVENTS.map((e) => [
    e.id,
    e.bar_ids
      .map((id) => LA_SPORTS_BARS.find((b) => b.id === id))
      .filter((b): b is SportsBar => !!b),
  ])
);

// ── Adapter to the DbEvent shape consumed by Events.tsx ────────────────
export function curatedToMockDbEvent(e: CuratedMockEvent): MockDbEvent {
  const dt = addDays(new Date(), e.days_out);
  return {
    id: e.id,
    title: e.title,
    description: `${e.league} · ${e.venue_name}${e.broadcast ? ` · ${e.broadcast}` : ""}`,
    image_url: null,
    banner_image: null,
    event_date: format(dt, "yyyy-MM-dd"),
    event_time: e.time,
    venue_name: e.venue_name,
    city: e.city,
    event_type: "game",
    sport_tags: [e.sport],
    visibility: "public",
    capacity: null,
    price: null,
    event_tags: [e.league, e.is_womens ? "women" : "open", e.sport_kind],
    location_lat: null,
    location_lng: null,
    promoted: false,
    __mock: true,
    __league: e.league as MockDbEvent["__league"],
    __sport_kind: e.sport_kind,
    __is_womens: e.is_womens,
    __ticket_url: undefined,
  };
}

export const LA_MOCK_DB_EVENTS: MockDbEvent[] = LA_MOCK_EVENTS.map(curatedToMockDbEvent);

// Curated LA-area sports bars for FIFA World Cup 2026 watch parties.
// Lat/lng are approximate venue coordinates used to compute distance from
// the member's active area. Ratings are real Google ratings captured at
// curation time — refresh periodically. Used by WatchPartyBarModal.

export interface SportsBar {
  id: string;
  name: string;
  neighborhood: string;
  vibe: string;
  lat: number;
  lng: number;
  rating: number;
  review_count: number;
}

export const LA_SPORTS_BARS: SportsBar[] = [
  { id: "the-cork-bar",       name: "The Cork Bar",                neighborhood: "Inglewood",        vibe: "Walking distance to SoFi",         lat: 33.9617, lng: -118.3531, rating: 4.5, review_count: 612 },
  { id: "the-fox-hole",       name: "The Fox Hole",                neighborhood: "Culver City",      vibe: "Westside crowd, FOX-friendly",     lat: 34.0211, lng: -118.3965, rating: 4.4, review_count: 480 },
  { id: "barneys-beanery",    name: "Barney's Beanery",            neighborhood: "West Hollywood",   vibe: "LA institution, 30+ TVs",          lat: 34.0901, lng: -118.3766, rating: 4.3, review_count: 4210 },
  { id: "tom-bergins",        name: "Tom Bergin's Tavern",         neighborhood: "Mid-Wilshire",     vibe: "Historic Irish pub",               lat: 34.0626, lng: -118.3499, rating: 4.4, review_count: 920 },
  { id: "the-parlor",         name: "The Parlor Hollywood",        neighborhood: "Hollywood",        vibe: "Two floors, every game",           lat: 34.0907, lng: -118.3461, rating: 4.2, review_count: 1340 },
  { id: "the-village-idiot",  name: "The Village Idiot",           neighborhood: "Melrose",          vibe: "Gastropub, every match on",        lat: 34.0836, lng: -118.3478, rating: 4.3, review_count: 1875 },
  { id: "the-pikey",          name: "The Pikey",                   neighborhood: "Hollywood",        vibe: "British pub for the away crowd",   lat: 34.0905, lng: -118.3417, rating: 4.4, review_count: 880 },
  { id: "ye-rustic-inn",      name: "Ye Rustic Inn",               neighborhood: "Los Feliz",        vibe: "Classic dive, soccer faithful",    lat: 34.1043, lng: -118.2853, rating: 4.4, review_count: 1620 },
  { id: "bigfoot-lodge",      name: "Bigfoot Lodge",               neighborhood: "Atwater Village",  vibe: "Cabin vibes, sound on",            lat: 34.1186, lng: -118.2614, rating: 4.4, review_count: 1080 },
  { id: "the-greyhound",      name: "The Greyhound Bar & Grill",   neighborhood: "Highland Park",    vibe: "Eastside neighborhood pub",        lat: 34.1167, lng: -118.1925, rating: 4.5, review_count: 720 },
  { id: "the-escondite",      name: "The Escondite",               neighborhood: "Downtown LA",      vibe: "Hidden gem, big match energy",     lat: 34.0492, lng: -118.2434, rating: 4.5, review_count: 1410 },
  { id: "the-lab-gastropub",  name: "The Lab Gastropub",           neighborhood: "Long Beach",       vibe: "South Bay HQ for soccer",          lat: 33.7838, lng: -118.1336, rating: 4.6, review_count: 1240 },
];

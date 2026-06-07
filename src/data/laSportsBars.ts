// Curated LA-area sports bars for FIFA World Cup 2026 watch parties.
// Used by the WatchPartyBarModal selector on game-type event cards.

export interface SportsBar {
  id: string;
  name: string;
  neighborhood: string;
  vibe: string;
}

export const LA_SPORTS_BARS: SportsBar[] = [
  { id: "the-greyhound", name: "The Greyhound Bar & Grill", neighborhood: "Highland Park", vibe: "Eastside neighborhood pub, big screens" },
  { id: "the-village-idiot", name: "The Village Idiot", neighborhood: "Melrose", vibe: "Gastropub, every match on" },
  { id: "ye-rustic-inn", name: "Ye Rustic Inn", neighborhood: "Los Feliz", vibe: "Classic dive, soccer faithful" },
  { id: "bigfoot-lodge", name: "Bigfoot Lodge", neighborhood: "Atwater Village", vibe: "Cabin vibes, sound on" },
  { id: "the-fox-hole", name: "The Fox Hole", neighborhood: "Culver City", vibe: "Westside crowd, FOX-friendly" },
  { id: "the-cork-bar", name: "The Cork Bar", neighborhood: "Inglewood", vibe: "Walking distance to SoFi" },
  { id: "tom-bergins", name: "Tom Bergin's Tavern", neighborhood: "Mid-Wilshire", vibe: "Historic Irish pub" },
  { id: "the-parlor", name: "The Parlor Hollywood", neighborhood: "Hollywood", vibe: "Two floors, every game" },
  { id: "barneys-beanery", name: "Barney's Beanery", neighborhood: "West Hollywood", vibe: "LA institution, 30+ TVs" },
  { id: "the-pikey", name: "The Pikey", neighborhood: "Hollywood", vibe: "British pub for the away crowd" },
  { id: "the-escondite", name: "The Escondite", neighborhood: "Downtown LA", vibe: "Hidden gem, big match energy" },
  { id: "the-lab-gastropub", name: "The Lab Gastropub", neighborhood: "Long Beach", vibe: "South Bay HQ for soccer" },
];

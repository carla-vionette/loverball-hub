// Curated sports bars for FIFA World Cup 2026 watch parties, keyed by the
// SeatGeek venue city for each host market. Used by the Events page to show
// a "Where to Watch" recommendation list when a WC match is not local to LA.
//
// Each entry is a hand-picked, well-known soccer-friendly venue in that city.
// Keep this list short (3–4 per city) so the card stays scannable.

export interface WcWatchBar {
  name: string;
  neighborhood: string;
}

// Normalize SeatGeek city strings (some matches list the suburb, e.g.
// "Inglewood", "Foxborough", "Arlington") to the metro key used below.
const CITY_ALIASES: Record<string, string> = {
  "inglewood": "los angeles",
  "los angeles": "los angeles",
  "east rutherford": "new york",
  "new york": "new york",
  "foxborough": "boston",
  "boston": "boston",
  "arlington": "dallas",
  "dallas": "dallas",
  "frisco": "dallas",
  "miami gardens": "miami",
  "miami": "miami",
  "santa clara": "san francisco",
  "san francisco": "san francisco",
  "san jose": "san francisco",
  "houston": "houston",
  "philadelphia": "philadelphia",
  "atlanta": "atlanta",
  "kansas city": "kansas city",
  "seattle": "seattle",
  "toronto": "toronto",
  "vancouver": "vancouver",
  "mexico city": "mexico city",
  "ciudad de mexico": "mexico city",
  "guadalajara": "guadalajara",
  "monterrey": "monterrey",
};

export const WC_WATCH_BARS: Record<string, WcWatchBar[]> = {
  "los angeles": [
    { name: "The Greyhound Bar & Grill", neighborhood: "Highland Park" },
    { name: "Bua Thai Bar",              neighborhood: "Silver Lake" },
    { name: "The Village Idiot",         neighborhood: "Melrose" },
    { name: "Hamburger Mary's",          neighborhood: "West Hollywood" },
  ],
  "new york": [
    { name: "The Football Factory at Legends", neighborhood: "Midtown Manhattan" },
    { name: "Banter NYC",                      neighborhood: "Greenwich Village" },
    { name: "Smithfield Hall",                 neighborhood: "NoMad" },
    { name: "The Tailgate",                    neighborhood: "Hell's Kitchen" },
  ],
  "boston": [
    { name: "The Banshee",            neighborhood: "Dorchester" },
    { name: "Phoenix Landing",        neighborhood: "Cambridge" },
    { name: "The Greatest Bar",       neighborhood: "West End" },
    { name: "Lansdowne Pub",          neighborhood: "Fenway" },
  ],
  "dallas": [
    { name: "Trinity Hall Irish Pub", neighborhood: "Mockingbird Station" },
    { name: "The Londoner",           neighborhood: "Uptown" },
    { name: "Stan's Blue Note",       neighborhood: "Greenville Ave" },
    { name: "Tin Roof",               neighborhood: "Deep Ellum" },
  ],
  "houston": [
    { name: "Pitch 25 Beer Park",     neighborhood: "EaDo" },
    { name: "Kirby Ice House",        neighborhood: "Upper Kirby" },
    { name: "Little Woodrow's",       neighborhood: "Midtown" },
    { name: "The Richmond Arms",      neighborhood: "Galleria" },
  ],
  "philadelphia": [
    { name: "Misconduct Tavern",      neighborhood: "Rittenhouse" },
    { name: "The Field House",        neighborhood: "Center City" },
    { name: "Fadó Irish Pub",         neighborhood: "Center City" },
    { name: "Xfinity Live!",          neighborhood: "South Philly" },
  ],
  "atlanta": [
    { name: "Brewhouse Café",         neighborhood: "Little Five Points" },
    { name: "Fadó Irish Pub",         neighborhood: "Buckhead" },
    { name: "Stats Brewpub",          neighborhood: "Downtown" },
    { name: "Hudson Grille",          neighborhood: "Sandy Springs" },
  ],
  "kansas city": [
    { name: "No Other Pub",           neighborhood: "Power & Light District" },
    { name: "The Brass on Baltimore", neighborhood: "Downtown" },
    { name: "O'Dowd's Gastrobar",     neighborhood: "Country Club Plaza" },
    { name: "Tanner's Bar & Grill",   neighborhood: "Westport" },
  ],
  "miami": [
    { name: "The Tank Brewing Tap Room", neighborhood: "Doral" },
    { name: "Fadó Irish Pub",         neighborhood: "Brickell" },
    { name: "Sandbar Sports Grill",   neighborhood: "Coconut Grove" },
    { name: "American Social",        neighborhood: "Brickell" },
  ],
  "san francisco": [
    { name: "Mad Dog in the Fog",     neighborhood: "Lower Haight, SF" },
    { name: "The Kezar Pub",          neighborhood: "Cole Valley, SF" },
    { name: "Britannia Arms",         neighborhood: "Cupertino" },
    { name: "Final Final",            neighborhood: "Marina, SF" },
  ],
  "seattle": [
    { name: "George & Dragon Pub",    neighborhood: "Fremont" },
    { name: "Fadó Irish Pub",         neighborhood: "Pioneer Square" },
    { name: "Atlantic Crossing",      neighborhood: "Roosevelt" },
    { name: "Owl 'N Thistle",         neighborhood: "Downtown" },
  ],
  "toronto": [
    { name: "Scallywags",             neighborhood: "Yonge & Eglinton" },
    { name: "The Football Factory",   neighborhood: "Liberty Village" },
    { name: "Shoeless Joe's",         neighborhood: "Downtown" },
    { name: "The Madison Avenue Pub", neighborhood: "The Annex" },
  ],
  "vancouver": [
    { name: "The Pint Public House",  neighborhood: "Yaletown" },
    { name: "Doolin's Irish Pub",     neighborhood: "Downtown" },
    { name: "Library Square Pub",     neighborhood: "Downtown" },
    { name: "The Cambie",             neighborhood: "Gastown" },
  ],
  "mexico city": [
    { name: "Pinche Gringo BBQ",      neighborhood: "Narvarte" },
    { name: "Beer Hall",              neighborhood: "Roma Norte" },
    { name: "The Black Horse",        neighborhood: "Roma Norte" },
    { name: "El Depósito",            neighborhood: "Polanco" },
  ],
  "guadalajara": [
    { name: "La Santa",               neighborhood: "Providencia" },
    { name: "Cervecería Chapultepec", neighborhood: "Chapultepec" },
    { name: "Hooters Guadalajara",    neighborhood: "Andares" },
    { name: "Bariachi",               neighborhood: "Tlaquepaque" },
  ],
  "monterrey": [
    { name: "El Tío Sports Bar",      neighborhood: "San Pedro" },
    { name: "Cervecería Chapultepec", neighborhood: "Centro" },
    { name: "Hooters Monterrey",      neighborhood: "Valle Oriente" },
    { name: "La Nacional",            neighborhood: "Barrio Antiguo" },
  ],
};

export function watchBarsForCity(city: string | null | undefined): WcWatchBar[] {
  if (!city) return [];
  const key = CITY_ALIASES[city.trim().toLowerCase()];
  if (!key) return [];
  return WC_WATCH_BARS[key] ?? [];
}

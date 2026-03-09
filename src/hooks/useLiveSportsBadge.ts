import { useState, useEffect } from "react";

interface LiveSportsItem {
  text: string;
  isLive: boolean;
  sport: string;
}

const TONIGHT_GAMES: LiveSportsItem[] = [
  { text: 'TONIGHT: NBA — PHI vs CLE — 4:00 PM PT', sport: '🏀', isLive: false },
  { text: 'TONIGHT: NBA — MEM vs BKN — 4:30 PM PT', sport: '🏀', isLive: false },
  { text: 'TONIGHT: NBA — DEN vs OKC — 4:30 PM PT', sport: '🏀', isLive: false },
  { text: 'TONIGHT: NBA — GSW vs UTA — 6:00 PM PT', sport: '🏀', isLive: false },
  { text: 'TONIGHT: NBA — NYK vs LAC — 7:00 PM PT', sport: '🏀', isLive: false },
  { text: 'TONIGHT: NHL — Kings vs Blue Jackets — 1:00 PM PT', sport: '🏒', isLive: false },
  { text: 'TONIGHT: NHL — Rangers vs Flyers — 4:00 PM PT', sport: '🏒', isLive: false },
  { text: 'TONIGHT: NHL — Flames vs Capitals — 4:00 PM PT', sport: '🏒', isLive: false },
  { text: 'TONIGHT: NHL — Utah vs Blackhawks — 5:30 PM PT', sport: '🏒', isLive: false },
  { text: 'TONIGHT: NHL — Senators vs Canucks — 6:00 PM PT', sport: '🏒', isLive: false },
];

export function useLiveSportsBadge() {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((i) => (i + 1) % TONIGHT_GAMES.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return {
    currentItem: TONIGHT_GAMES[currentIndex],
    loading: false,
    itemCount: TONIGHT_GAMES.length,
  };
}

import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tv, ExternalLink, Calendar, Clock, ChevronRight } from "lucide-react";
import { TEAM_PERFORMANCE } from "@/lib/mockStatsData";
import { getTeamWatchUrl } from "@/lib/teamLinksMap";
import { motion } from "framer-motion";

interface UpcomingBroadcast {
  id: string;
  teamName: string;
  opponent: string;
  isHome: boolean;
  date: string;
  time: string;
  league: string;
  channels: string[];
  streamingLinks: { name: string; url: string }[];
  logoUrl: string;
}

interface WhereToWatchGamesProps {
  userTeams: string[];
}

const BROADCAST_MAP: Record<string, { channels: string[]; streaming: { name: string; url: string }[] }> = {
  NBA: {
    channels: ["ESPN", "TNT", "NBA TV"],
    streaming: [
      { name: "NBA League Pass", url: "https://www.nba.com/watch" },
      { name: "Sling TV", url: "https://www.sling.com" },
    ],
  },
  MLB: {
    channels: ["ESPN", "FOX", "TBS"],
    streaming: [
      { name: "MLB.TV", url: "https://www.mlb.com/tv" },
      { name: "Apple TV+", url: "https://tv.apple.com/us/room/friday-night-baseball/edt.item.62327ef9-4a52-4b58-b441-e7e48a1e6672" },
    ],
  },
  MLS: {
    channels: ["FS1", "FOX", "Univision"],
    streaming: [
      { name: "Apple TV (MLS Season Pass)", url: "https://tv.apple.com/us/room/mls-season-pass/edt.item.64502c02-ce1f-4ec0-9498-01925732b02e" },
    ],
  },
  NFL: {
    channels: ["CBS", "FOX", "NBC", "ESPN MNF"],
    streaming: [
      { name: "NFL+", url: "https://www.nfl.com/plus" },
      { name: "Paramount+", url: "https://www.paramountplus.com" },
    ],
  },
  NWSL: {
    channels: ["CBS Sports", "ESPN"],
    streaming: [
      { name: "Paramount+", url: "https://www.paramountplus.com" },
      { name: "NWSL+", url: "https://www.nwslsoccer.com/nwslplus" },
    ],
  },
  NHL: {
    channels: ["ESPN", "TNT"],
    streaming: [
      { name: "ESPN+", url: "https://www.espn.com/espnplus" },
    ],
  },
  WNBA: {
    channels: ["ESPN", "ABC", "CBS Sports"],
    streaming: [
      { name: "WNBA League Pass", url: "https://www.wnba.com/watch" },
      { name: "Paramount+", url: "https://www.paramountplus.com" },
    ],
  },
};

function generateBroadcasts(): UpcomingBroadcast[] {
  const broadcasts: UpcomingBroadcast[] = [];

  for (const team of TEAM_PERFORMANCE) {
    if (team.nextGame === "Offseason" || team.nextGame.startsWith("Season")) continue;

    const parts = team.nextGame.split(" · ");
    const matchup = parts[0]?.trim() || "";
    const dateStr = parts[1]?.trim() || "TBD";
    const isAway = matchup.startsWith("@");
    const opponent = matchup.replace(/^[@vs]+ /, "").trim();

    const leagueBroadcast = BROADCAST_MAP[team.league] || {
      channels: ["Local TV"],
      streaming: [],
    };

    // Pick 1-2 random channels from the league's broadcast options
    const shuffled = [...leagueBroadcast.channels].sort(() => Math.random() - 0.5);
    const selectedChannels = shuffled.slice(0, Math.min(2, shuffled.length));

    broadcasts.push({
      id: team.slug,
      teamName: team.name,
      opponent,
      isHome: !isAway,
      date: dateStr,
      time: "7:00 PM PT",
      league: team.league,
      channels: selectedChannels,
      streamingLinks: leagueBroadcast.streaming,
      logoUrl: team.logo,
    });
  }

  return broadcasts;
}

const BroadcastCard = ({ broadcast }: { broadcast: UpcomingBroadcast }) => {
  const watchUrl = getTeamWatchUrl(broadcast.teamName);

  return (
    <Card className="p-4 bg-card border-border/30 hover:border-primary/30 transition-colors">
      <div className="flex items-start gap-3">
        <img
          src={broadcast.logoUrl}
          alt={broadcast.teamName}
          className="w-10 h-10 object-contain rounded-lg bg-foreground/5 p-0.5 flex-shrink-0"
          onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-semibold text-foreground truncate">
              {broadcast.teamName} {broadcast.isHome ? "vs" : "@"} {broadcast.opponent}
            </span>
            <Badge variant="outline" className="text-[9px] px-1.5 py-0 rounded-full border-border/30 flex-shrink-0">
              {broadcast.league}
            </Badge>
          </div>

          <div className="flex items-center gap-3 text-xs text-muted-foreground mb-2">
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" /> {broadcast.date}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" /> {broadcast.time}
            </span>
          </div>

          {/* TV Channels */}
          <div className="flex items-center gap-1.5 mb-2">
            <Tv className="w-3 h-3 text-muted-foreground flex-shrink-0" />
            <div className="flex flex-wrap gap-1">
              {broadcast.channels.map((ch) => (
                <Badge key={ch} variant="secondary" className="text-[10px] px-1.5 py-0 bg-primary/10 text-primary border-0">
                  {ch}
                </Badge>
              ))}
            </div>
          </div>

          {/* Streaming Links */}
          <div className="flex flex-wrap gap-1.5">
            {broadcast.streamingLinks.map((link) => (
              <a
                key={link.name}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-[10px] font-medium text-[#FF5D2E] hover:text-[#FF5D2E]/80 transition-colors"
                onClick={(e) => e.stopPropagation()}
              >
                {link.name} <ExternalLink className="w-2.5 h-2.5" />
              </a>
            ))}
            <a
              href={watchUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[10px] font-medium text-primary hover:text-primary/80 transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              Team Schedule <ExternalLink className="w-2.5 h-2.5" />
            </a>
          </div>
        </div>
      </div>
    </Card>
  );
};

const WhereToWatchGames: React.FC<WhereToWatchGamesProps> = ({ userTeams }) => {
  const [broadcasts, setBroadcasts] = useState<UpcomingBroadcast[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setBroadcasts(generateBroadcasts());
      setLoading(false);
    }, 600);
  }, [userTeams]);

  const visibleBroadcasts = showAll ? broadcasts : broadcasts.slice(0, 3);

  return (
    <div className="glass-card rounded-2xl overflow-hidden">
      <div className="p-5 pb-3">
        <div className="flex items-center gap-2">
          <Tv className="w-4 h-4 text-[#FF5D2E]" />
          <span className="text-sm font-medium tracking-wider uppercase text-foreground/50">
            Where to Watch
          </span>
        </div>
        <p className="text-xs text-muted-foreground mt-1">Upcoming games & broadcast info for your teams</p>
      </div>

      {loading ? (
        <div className="px-5 pb-5 space-y-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="p-4">
              <Skeleton className="h-16 w-full" />
            </Card>
          ))}
        </div>
      ) : broadcasts.length === 0 ? (
        <div className="px-5 pb-8 text-center">
          <Tv className="w-8 h-8 text-muted-foreground mx-auto mb-2 opacity-40" />
          <p className="text-sm text-muted-foreground">No upcoming games right now.</p>
          <p className="text-xs text-muted-foreground mt-1">Check back when your teams have games scheduled!</p>
        </div>
      ) : (
        <>
          <div className="px-5 pb-4 space-y-3">
            {visibleBroadcasts.map((broadcast, i) => (
              <motion.div
                key={broadcast.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <BroadcastCard broadcast={broadcast} />
              </motion.div>
            ))}
          </div>
          {broadcasts.length > 3 && (
            <div className="px-5 pb-4 text-center">
              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-primary gap-1"
                onClick={() => setShowAll(!showAll)}
              >
                {showAll ? "Show less" : `Show all ${broadcasts.length} upcoming games`}
                <ChevronRight className={`w-3 h-3 transition-transform ${showAll ? "rotate-90" : ""}`} />
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default WhereToWatchGames;

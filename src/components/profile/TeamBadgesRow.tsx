import { useNavigate } from "react-router-dom";

interface TeamBadgesRowProps {
  teams: string[];
}

// Simple emoji/initial badges for teams
const TEAM_EMOJIS: Record<string, string> = {
  Lakers: "🏀", Clippers: "🏀", Sparks: "🏀",
  Rams: "🏈", Chargers: "🏈",
  Dodgers: "⚾", Angels: "⚾",
  Kings: "🏒", Ducks: "🏒",
  Galaxy: "⚽", LAFC: "⚽",
  "Angel City FC": "⚽", "ACFC": "⚽",
  UCLA: "🎓", USC: "🎓",
  WNBA: "🏀", NWSL: "⚽",
};

function getTeamEmoji(team: string): string {
  for (const [key, emoji] of Object.entries(TEAM_EMOJIS)) {
    if (team.toLowerCase().includes(key.toLowerCase())) return emoji;
  }
  return "🏟️";
}

const TeamBadgesRow = ({ teams }: TeamBadgesRowProps) => {
  const navigate = useNavigate();

  if (!teams || teams.length === 0) return null;

  return (
    <div className="px-4 py-3 border-b border-border/30">
      <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-1">
        {teams.map((team) => (
          <button
            key={team}
            onClick={() => navigate(`/search?q=${encodeURIComponent(team)}`)}
            className="flex flex-col items-center gap-1 flex-shrink-0 group"
          >
            <div className="w-14 h-14 rounded-full bg-primary/10 border-2 border-primary/20 flex items-center justify-center text-xl group-hover:border-primary/50 transition-colors">
              {getTeamEmoji(team)}
            </div>
            <span className="text-[10px] text-muted-foreground max-w-[56px] truncate">{team}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default TeamBadgesRow;

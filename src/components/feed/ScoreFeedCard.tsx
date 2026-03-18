interface ScoreFeedCardProps {
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  isLive: boolean;
  gameTime?: string;
}

const ScoreFeedCard = ({ homeTeam, awayTeam, homeScore, awayScore, isLive, gameTime }: ScoreFeedCardProps) => {
  return (
    <div className="bg-card rounded-xl border border-border/20 p-4 shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[11px] font-display uppercase text-muted-foreground tracking-wider">Score Update</span>
        {isLive ? (
          <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-destructive/10 text-destructive text-[11px] font-body font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-destructive animate-pulse" />
            LIVE
          </span>
        ) : (
          <span className="px-2 py-0.5 rounded-full bg-muted text-muted-foreground text-[11px] font-body font-semibold">
            FINAL
          </span>
        )}
      </div>

      <div className="flex items-center justify-center gap-6">
        {/* Away team */}
        <div className="flex flex-col items-center gap-1 flex-1">
          <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
            <span className="font-display text-xs font-bold text-muted-foreground uppercase">{awayTeam.slice(0, 3)}</span>
          </div>
          <span className="text-xs font-body font-medium text-foreground">{awayTeam}</span>
        </div>

        {/* Score */}
        <div className="flex items-center gap-3">
          <span className="text-3xl font-display font-extrabold text-foreground">{awayScore}</span>
          <span className="text-sm text-muted-foreground font-body">–</span>
          <span className="text-3xl font-display font-extrabold text-foreground">{homeScore}</span>
        </div>

        {/* Home team */}
        <div className="flex flex-col items-center gap-1 flex-1">
          <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
            <span className="font-display text-xs font-bold text-muted-foreground uppercase">{homeTeam.slice(0, 3)}</span>
          </div>
          <span className="text-xs font-body font-medium text-foreground">{homeTeam}</span>
        </div>
      </div>

      {gameTime && (
        <p className="text-center text-[11px] text-muted-foreground font-body mt-2">{gameTime}</p>
      )}
    </div>
  );
};

export default ScoreFeedCard;

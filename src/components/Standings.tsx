import { useQuery } from "@tanstack/react-query";
import { fetchWnbaStandings, hasApiKey, type WnbaStanding } from "@/services/sportsDataApi";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle } from "lucide-react";

const currentSeason = new Date().getFullYear();

const Standings = () => {
  const { data: standings, isLoading, error } = useQuery({
    queryKey: ["wnba-standings", currentSeason],
    queryFn: () => fetchWnbaStandings(currentSeason),
    enabled: hasApiKey(),
    staleTime: 10 * 60 * 1000,
  });

  if (!hasApiKey()) {
    return (
      <Card className="p-6 text-center border-dashed border-2 border-border/40">
        <AlertCircle className="w-8 h-8 mx-auto mb-3 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Connect your SportsDataIO API key to see live scores.</p>
      </Card>
    );
  }

  if (isLoading) {
    return <Card className="p-4"><Skeleton className="h-64 w-full" /></Card>;
  }

  if (error) {
    return (
      <Card className="p-6 text-center">
        <p className="text-sm text-destructive">Failed to load standings.</p>
      </Card>
    );
  }

  if (!standings?.length) {
    return (
      <Card className="p-6 text-center border-border/30">
        <p className="text-sm text-muted-foreground">Standings not yet available for the {currentSeason} season.</p>
      </Card>
    );
  }

  const sorted = [...standings].sort((a, b) => b.Percentage - a.Percentage);

  return (
    <Card className="overflow-hidden border-border/30">
      <Table>
        <TableHeader>
          <TableRow className="bg-primary/5 hover:bg-primary/5">
            <TableHead className="text-xs font-bold uppercase tracking-wider text-primary">#</TableHead>
            <TableHead className="text-xs font-bold uppercase tracking-wider text-primary">Team</TableHead>
            <TableHead className="text-xs font-bold uppercase tracking-wider text-primary text-center">W</TableHead>
            <TableHead className="text-xs font-bold uppercase tracking-wider text-primary text-center">L</TableHead>
            <TableHead className="text-xs font-bold uppercase tracking-wider text-primary text-center">PCT</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sorted.map((team, i) => (
            <TableRow key={team.TeamID} className="hover:bg-secondary/50">
              <TableCell className="font-medium text-muted-foreground text-sm">{i + 1}</TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm text-foreground">{team.City} {team.Name}</span>
                </div>
              </TableCell>
              <TableCell className="text-center font-semibold text-sm">{team.Wins}</TableCell>
              <TableCell className="text-center font-semibold text-sm">{team.Losses}</TableCell>
              <TableCell className="text-center font-bold text-sm text-primary">{team.Percentage.toFixed(3)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
};

export default Standings;

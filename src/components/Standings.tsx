import { useQuery } from "@tanstack/react-query";
import { fetchWnbaStandings, hasApiKey, type WnbaStanding } from "@/services/sportsDataApi";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";

const currentSeason = new Date().getFullYear();

// Fallback sample standings
const SAMPLE_STANDINGS: WnbaStanding[] = [
  { TeamID: 1, Key: "LVA", City: "Las Vegas", Name: "Aces", Conference: "Western", Wins: 24, Losses: 8, Percentage: 0.750, ConferenceWins: 14, ConferenceLosses: 4 },
  { TeamID: 2, Key: "NYL", City: "New York", Name: "Liberty", Conference: "Eastern", Wins: 22, Losses: 10, Percentage: 0.688, ConferenceWins: 12, ConferenceLosses: 6 },
  { TeamID: 3, Key: "SEA", City: "Seattle", Name: "Storm", Conference: "Western", Wins: 20, Losses: 12, Percentage: 0.625, ConferenceWins: 11, ConferenceLosses: 7 },
  { TeamID: 4, Key: "MIN", City: "Minnesota", Name: "Lynx", Conference: "Western", Wins: 19, Losses: 13, Percentage: 0.594, ConferenceWins: 10, ConferenceLosses: 8 },
  { TeamID: 5, Key: "CON", City: "Connecticut", Name: "Sun", Conference: "Eastern", Wins: 18, Losses: 14, Percentage: 0.563, ConferenceWins: 10, ConferenceLosses: 8 },
  { TeamID: 6, Key: "LAS", City: "Los Angeles", Name: "Sparks", Conference: "Western", Wins: 16, Losses: 16, Percentage: 0.500, ConferenceWins: 9, ConferenceLosses: 9 },
  { TeamID: 7, Key: "CHI", City: "Chicago", Name: "Sky", Conference: "Eastern", Wins: 14, Losses: 18, Percentage: 0.438, ConferenceWins: 8, ConferenceLosses: 10 },
  { TeamID: 8, Key: "PHO", City: "Phoenix", Name: "Mercury", Conference: "Western", Wins: 12, Losses: 20, Percentage: 0.375, ConferenceWins: 6, ConferenceLosses: 12 },
];

const Standings = () => {
  const apiAvailable = hasApiKey();

  const { data: standings, isLoading, error } = useQuery({
    queryKey: ["wnba-standings", currentSeason],
    queryFn: () => fetchWnbaStandings(currentSeason),
    enabled: apiAvailable,
    staleTime: 10 * 60 * 1000,
  });

  if (isLoading && apiAvailable) {
    return <Card className="p-4"><Skeleton className="h-64 w-full" /></Card>;
  }

  if (error && apiAvailable) {
    return (
      <Card className="p-6 text-center">
        <p className="text-sm text-destructive">Failed to load standings.</p>
      </Card>
    );
  }

  const displayStandings = (apiAvailable && standings?.length) ? standings : SAMPLE_STANDINGS;
  const sorted = [...displayStandings].sort((a, b) => b.Percentage - a.Percentage);

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
                <span className="font-semibold text-sm text-foreground">{team.City} {team.Name}</span>
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

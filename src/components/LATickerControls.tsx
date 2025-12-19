import { Button } from "@/components/ui/button";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Pause, Play } from "lucide-react";
import { LA_D1_COLLEGES, LA_PRO_TEAMS } from "@/lib/laTeamsConfig";

interface LATickerControlsProps {
  category: "college" | "pro" | "both";
  gender: "men" | "women" | "both";
  selectedTeam: string;
  isPaused: boolean;
  onCategoryChange: (value: "college" | "pro" | "both") => void;
  onGenderChange: (value: "men" | "women" | "both") => void;
  onTeamChange: (value: string) => void;
  onPauseToggle: () => void;
}

const LATickerControls = ({
  category,
  gender,
  selectedTeam,
  isPaused,
  onCategoryChange,
  onGenderChange,
  onTeamChange,
  onPauseToggle,
}: LATickerControlsProps) => {
  // Get teams based on current category filter
  const getTeamOptions = () => {
    const teams: { value: string; label: string }[] = [
      { value: "all", label: "All Teams" }
    ];
    
    if (category === "college" || category === "both") {
      LA_D1_COLLEGES.forEach(college => {
        teams.push({ value: college.shortName, label: college.name });
      });
    }
    
    if (category === "pro" || category === "both") {
      LA_PRO_TEAMS
        .filter(team => {
          if (gender === "men") return team.gender === "men";
          if (gender === "women") return team.gender === "women";
          return true;
        })
        .forEach(team => {
          teams.push({ value: team.shortName, label: team.name });
        });
    }
    
    return teams;
  };

  return (
    <div className="flex flex-wrap items-center gap-3 p-3 bg-card border-b border-border">
      {/* Category Toggle */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground font-medium">Type:</span>
        <Select value={category} onValueChange={onCategoryChange}>
          <SelectTrigger className="w-28 h-8">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="both">All</SelectItem>
            <SelectItem value="college">College</SelectItem>
            <SelectItem value="pro">Pro</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Gender Toggle */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground font-medium">Gender:</span>
        <Select value={gender} onValueChange={onGenderChange}>
          <SelectTrigger className="w-28 h-8">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="both">All</SelectItem>
            <SelectItem value="men">Men's</SelectItem>
            <SelectItem value="women">Women's</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Team Filter */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground font-medium">Team:</span>
        <Select value={selectedTeam} onValueChange={onTeamChange}>
          <SelectTrigger className="w-40 h-8">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {getTeamOptions().map(team => (
              <SelectItem key={team.value} value={team.value}>
                {team.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Pause/Play Button */}
      <Button
        variant="outline"
        size="sm"
        onClick={onPauseToggle}
        className="ml-auto h-8"
      >
        {isPaused ? (
          <>
            <Play className="h-4 w-4 mr-1" />
            Play
          </>
        ) : (
          <>
            <Pause className="h-4 w-4 mr-1" />
            Pause
          </>
        )}
      </Button>
    </div>
  );
};

export default LATickerControls;

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import {
  PRONOUN_OPTIONS,
  CITY_OPTIONS,
  AGE_RANGE_OPTIONS,
  SPORTS_OPTIONS,
  EXPERIENCE_OPTIONS,
  INTERESTS_OPTIONS,
  COMFORT_LEVEL_OPTIONS,
  PARTICIPATION_OPTIONS,
} from "@/lib/onboardingOptions";
import { X } from "lucide-react";
import loverballLogo from "@/assets/loverball-logo-new.png";

const Onboarding = () => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Form state
  const [name, setName] = useState("");
  const [pronouns, setPronouns] = useState("");
  const [city, setCity] = useState("");
  const [ageRange, setAgeRange] = useState("");
  const [favoriteSports, setFavoriteSports] = useState<string[]>([]);
  const [teamsInput, setTeamsInput] = useState("");
  const [favTeams, setFavTeams] = useState<string[]>([]);
  const [experienceTypes, setExperienceTypes] = useState<string[]>([]);
  const [interests, setInterests] = useState<string[]>([]);
  const [comfortLevel, setComfortLevel] = useState("");
  const [participation, setParticipation] = useState<string[]>([]);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
      } else {
        setUserId(user.id);
      }
    };
    checkAuth();
  }, [navigate]);

  const totalSteps = 5;
  const progress = (step / totalSteps) * 100;

  const toggleArrayItem = (arr: string[], item: string, setter: (arr: string[]) => void) => {
    if (arr.includes(item)) {
      setter(arr.filter((i) => i !== item));
    } else {
      setter([...arr, item]);
    }
  };

  const addTeam = () => {
    if (teamsInput.trim() && !favTeams.includes(teamsInput.trim())) {
      setFavTeams([...favTeams, teamsInput.trim()]);
      setTeamsInput("");
    }
  };

  const removeTeam = (team: string) => {
    setFavTeams(favTeams.filter((t) => t !== team));
  };

  const generateBio = () => {
    const sportsList = favoriteSports.slice(0, 2).join(" & ");
    const interestsList = interests.slice(0, 2).join(", ");
    const teamText = favTeams[0] ? `${favTeams[0]} fan` : `${sportsList} enthusiast`;
    const locationText = city ? `in ${city}` : "";
    
    return `${teamText} ${locationText} who loves ${sportsList}${interestsList ? `, ${interestsList},` : ''} and connecting with fellow sports fans.`;
  };

  const handleSubmit = async () => {
    if (!userId) return;

    setLoading(true);
    try {
      const bio = generateBio();
      
      const { error } = await supabase.from("profiles").insert({
        id: userId,
        name,
        pronouns,
        city,
        age_range: ageRange,
        favorite_sports: favoriteSports,
        favorite_teams_players: favTeams,
        sports_experience_types: experienceTypes,
        other_interests: interests,
        event_comfort_level: comfortLevel,
        participation_preferences: participation,
        bio,
      });

      if (error) throw error;

      toast({
        title: "Profile created!",
        description: "Welcome to Loverball! 🏀",
      });
      
      navigate("/profile");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const canProceed = () => {
    switch (step) {
      case 1:
        return name.trim() && city;
      case 2:
        return ageRange && favoriteSports.length > 0;
      case 3:
        return experienceTypes.length > 0;
      case 4:
        return interests.length > 0;
      case 5:
        return comfortLevel && participation.length > 0;
      default:
        return false;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-accent/10 p-4 flex items-center justify-center">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <img 
            src={loverballLogo} 
            alt="Loverball" 
            className="h-12 w-auto mb-4 object-contain mix-blend-multiply dark:mix-blend-normal"
          />
          <CardTitle className="text-2xl">Let's build your profile!</CardTitle>
          <CardDescription>
            Step {step} of {totalSteps}
          </CardDescription>
          <Progress value={progress} className="mt-2" />
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Step 1: Basic Info */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                />
              </div>

              <div>
                <Label htmlFor="pronouns">Pronouns</Label>
                <Select value={pronouns} onValueChange={setPronouns}>
                  <SelectTrigger className="bg-background">
                    <SelectValue placeholder="Select pronouns" />
                  </SelectTrigger>
                  <SelectContent className="bg-background z-50">
                    {PRONOUN_OPTIONS.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="city">City *</Label>
                <Select value={city} onValueChange={setCity}>
                  <SelectTrigger className="bg-background">
                    <SelectValue placeholder="Select city" />
                  </SelectTrigger>
                  <SelectContent className="bg-background z-50">
                    {CITY_OPTIONS.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* Step 2: Sports */}
          {step === 2 && (
            <div className="space-y-4">
              <div>
                <Label>Age Range *</Label>
                <Select value={ageRange} onValueChange={setAgeRange}>
                  <SelectTrigger className="bg-background">
                    <SelectValue placeholder="Select age range" />
                  </SelectTrigger>
                  <SelectContent className="bg-background z-50">
                    {AGE_RANGE_OPTIONS.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Favorite Sports * (select all that apply)</Label>
                <div className="grid grid-cols-2 gap-3 mt-2">
                  {SPORTS_OPTIONS.map((sport) => (
                    <div key={sport} className="flex items-center space-x-2">
                      <Checkbox
                        id={sport}
                        checked={favoriteSports.includes(sport)}
                        onCheckedChange={() =>
                          toggleArrayItem(favoriteSports, sport, setFavoriteSports)
                        }
                      />
                      <label htmlFor={sport} className="text-sm cursor-pointer">
                        {sport}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <Label htmlFor="teams">Favorite Teams & Players</Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    id="teams"
                    value={teamsInput}
                    onChange={(e) => setTeamsInput(e.target.value)}
                    placeholder="e.g., Lakers, LeBron, USWNT"
                    onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addTeam())}
                  />
                  <Button type="button" onClick={addTeam}>
                    Add
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {favTeams.map((team) => (
                    <Badge key={team} variant="secondary" className="gap-1">
                      {team}
                      <X
                        className="h-3 w-3 cursor-pointer"
                        onClick={() => removeTeam(team)}
                      />
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Experience */}
          {step === 3 && (
            <div className="space-y-4">
              <div>
                <Label>How do you like to experience sports? * (select all that apply)</Label>
                <div className="grid grid-cols-1 gap-3 mt-2">
                  {EXPERIENCE_OPTIONS.map((exp) => (
                    <div key={exp} className="flex items-center space-x-2">
                      <Checkbox
                        id={exp}
                        checked={experienceTypes.includes(exp)}
                        onCheckedChange={() =>
                          toggleArrayItem(experienceTypes, exp, setExperienceTypes)
                        }
                      />
                      <label htmlFor={exp} className="text-sm cursor-pointer">
                        {exp}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Interests */}
          {step === 4 && (
            <div className="space-y-4">
              <div>
                <Label>What else are you into? * (select all that apply)</Label>
                <div className="grid grid-cols-2 gap-3 mt-2">
                  {INTERESTS_OPTIONS.map((interest) => (
                    <div key={interest} className="flex items-center space-x-2">
                      <Checkbox
                        id={interest}
                        checked={interests.includes(interest)}
                        onCheckedChange={() =>
                          toggleArrayItem(interests, interest, setInterests)
                        }
                      />
                      <label htmlFor={interest} className="text-sm cursor-pointer">
                        {interest}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 5: Participation */}
          {step === 5 && (
            <div className="space-y-4">
              <div>
                <Label>What's your comfort level with in-person events? *</Label>
                <Select value={comfortLevel} onValueChange={setComfortLevel}>
                  <SelectTrigger className="bg-background">
                    <SelectValue placeholder="Select comfort level" />
                  </SelectTrigger>
                  <SelectContent className="bg-background z-50">
                    {COMFORT_LEVEL_OPTIONS.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>What do you want to do on Loverball? * (select all that apply)</Label>
                <div className="grid grid-cols-1 gap-3 mt-2">
                  {PARTICIPATION_OPTIONS.map((option) => (
                    <div key={option} className="flex items-center space-x-2">
                      <Checkbox
                        id={option}
                        checked={participation.includes(option)}
                        onCheckedChange={() =>
                          toggleArrayItem(participation, option, setParticipation)
                        }
                      />
                      <label htmlFor={option} className="text-sm cursor-pointer">
                        {option}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-2 pt-4">
            {step > 1 && (
              <Button variant="outline" onClick={() => setStep(step - 1)}>
                Back
              </Button>
            )}
            {step < totalSteps && (
              <Button
                onClick={() => setStep(step + 1)}
                disabled={!canProceed()}
                className="flex-1"
              >
                Continue
              </Button>
            )}
            {step === totalSteps && (
              <Button
                onClick={handleSubmit}
                disabled={!canProceed() || loading}
                className="flex-1"
              >
                {loading ? "Creating profile..." : "Complete Profile"}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Onboarding;
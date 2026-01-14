import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import { X, Camera, Loader2 } from "lucide-react";
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
  const [profilePhoto, setProfilePhoto] = useState<File | null>(null);
  const [profilePhotoPreview, setProfilePhotoPreview] = useState<string | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please select an image under 5MB",
          variant: "destructive",
        });
        return;
      }
      setProfilePhoto(file);
      setProfilePhotoPreview(URL.createObjectURL(file));
    }
  };

  const uploadProfilePhoto = async (): Promise<string | null> => {
    if (!profilePhoto || !userId) return null;
    
    setUploadingPhoto(true);
    try {
      const fileExt = profilePhoto.name.split('.').pop();
      const filePath = `${userId}/profile.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('profile-photos')
        .upload(filePath, profilePhoto, { upsert: true });
      
      if (uploadError) throw uploadError;
      
      const { data } = supabase.storage
        .from('profile-photos')
        .getPublicUrl(filePath);
      
      return data.publicUrl;
    } catch (error: any) {
      toast({
        title: "Photo upload failed",
        description: error.message,
        variant: "destructive",
      });
      return null;
    } finally {
      setUploadingPhoto(false);
    }
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
      
      // Upload photo if selected
      let photoUrl: string | null = null;
      if (profilePhoto) {
        photoUrl = await uploadProfilePhoto();
      }
      
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
        profile_photo_url: photoUrl,
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
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/90 backdrop-blur-sm border-b border-border">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
          <div className="flex items-center justify-center h-16">
            <img src={loverballLogo} alt="Loverball" className="h-10 w-auto" />
          </div>
        </div>
      </nav>

      <div className="pt-24 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <p className="text-primary text-sm font-medium tracking-widest mb-4 uppercase">Step {step} of {totalSteps}</p>
            <h1 className="text-3xl sm:text-4xl font-serif font-normal text-foreground mb-4">Let's build your profile.</h1>
            <Progress value={progress} className="h-1" />
          </div>

          <div className="bg-pale-pink p-6 sm:p-10 space-y-6">
          {/* Step 1: Basic Info */}
          {step === 1 && (
            <div className="space-y-6">
              {/* Profile Photo Upload */}
              <div className="flex flex-col items-center gap-3">
                <Label className="text-xs tracking-wider uppercase text-foreground/60">Profile Photo</Label>
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="relative cursor-pointer group"
                >
                  <Avatar className="w-24 h-24 border-2 border-dashed border-foreground/20 group-hover:border-primary transition-colors">
                    {profilePhotoPreview ? (
                      <AvatarImage src={profilePhotoPreview} alt="Preview" className="object-cover" />
                    ) : (
                      <AvatarFallback className="bg-background">
                        <Camera className="w-8 h-8 text-foreground/40" />
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                    <Camera className="w-6 h-6 text-white" />
                  </div>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoSelect}
                  className="hidden"
                />
                <p className="text-xs text-foreground/40">Click to upload (max 5MB)</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="name" className="text-xs tracking-wider uppercase text-foreground/60">Name *</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  className="rounded-none h-12 border-border bg-background"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="pronouns" className="text-xs tracking-wider uppercase text-foreground/60">Pronouns</Label>
                <Select value={pronouns} onValueChange={setPronouns}>
                  <SelectTrigger className="bg-background rounded-none h-12">
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

              <div className="space-y-2">
                <Label htmlFor="city" className="text-xs tracking-wider uppercase text-foreground/60">City *</Label>
                <Select value={city} onValueChange={setCity}>
                  <SelectTrigger className="bg-background rounded-none h-12">
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
            <div className="space-y-6">
              <div className="space-y-2">
                <Label className="text-xs tracking-wider uppercase text-foreground/60">Age Range *</Label>
                <Select value={ageRange} onValueChange={setAgeRange}>
                  <SelectTrigger className="bg-background rounded-none h-12">
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

              <div className="space-y-3">
                <Label className="text-xs tracking-wider uppercase text-foreground/60">Favorite Sports * (select all that apply)</Label>
                <div className="grid grid-cols-2 gap-3">
                  {SPORTS_OPTIONS.map((sport) => (
                    <div key={sport} className="flex items-center space-x-3 p-3 bg-background border border-border hover:border-primary transition-colors cursor-pointer" onClick={() => toggleArrayItem(favoriteSports, sport, setFavoriteSports)}>
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

              <div className="space-y-2">
                <Label htmlFor="teams" className="text-xs tracking-wider uppercase text-foreground/60">Favorite Teams & Players</Label>
                <div className="flex gap-2">
                  <Input
                    id="teams"
                    value={teamsInput}
                    onChange={(e) => setTeamsInput(e.target.value)}
                    placeholder="e.g., Lakers, LeBron, USWNT"
                    onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addTeam())}
                    className="rounded-none h-12 border-border bg-background"
                  />
                  <Button type="button" onClick={addTeam} className="rounded-none h-12 px-6">
                    ADD
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2 mt-3">
                  {favTeams.map((team) => (
                    <Badge key={team} variant="secondary" className="gap-1 rounded-none px-3 py-1">
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
            <div className="space-y-6">
              <div className="space-y-3">
                <Label className="text-xs tracking-wider uppercase text-foreground/60">How do you like to experience sports? * (select all that apply)</Label>
                <div className="grid grid-cols-1 gap-3">
                  {EXPERIENCE_OPTIONS.map((exp) => (
                    <div key={exp} className="flex items-center space-x-3 p-3 bg-background border border-border hover:border-primary transition-colors cursor-pointer" onClick={() => toggleArrayItem(experienceTypes, exp, setExperienceTypes)}>
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
            <div className="space-y-6">
              <div className="space-y-3">
                <Label className="text-xs tracking-wider uppercase text-foreground/60">What else are you into? * (select all that apply)</Label>
                <div className="grid grid-cols-2 gap-3">
                  {INTERESTS_OPTIONS.map((interest) => (
                    <div key={interest} className="flex items-center space-x-3 p-3 bg-background border border-border hover:border-primary transition-colors cursor-pointer" onClick={() => toggleArrayItem(interests, interest, setInterests)}>
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
            <div className="space-y-6">
              <div className="space-y-2">
                <Label className="text-xs tracking-wider uppercase text-foreground/60">What's your comfort level with in-person events? *</Label>
                <Select value={comfortLevel} onValueChange={setComfortLevel}>
                  <SelectTrigger className="bg-background rounded-none h-12">
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

              <div className="space-y-3">
                <Label className="text-xs tracking-wider uppercase text-foreground/60">What do you want to do on Loverball? * (select all that apply)</Label>
                <div className="grid grid-cols-1 gap-3">
                  {PARTICIPATION_OPTIONS.map((option) => (
                    <div key={option} className="flex items-center space-x-3 p-3 bg-background border border-border hover:border-primary transition-colors cursor-pointer" onClick={() => toggleArrayItem(participation, option, setParticipation)}>
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

          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-6">
            {step > 1 && (
              <Button variant="outline" onClick={() => setStep(step - 1)} className="rounded-none h-12 px-8 text-sm tracking-wider">
                BACK
              </Button>
            )}
            {step < totalSteps && (
              <Button
                onClick={() => setStep(step + 1)}
                disabled={!canProceed()}
                className="flex-1 rounded-none h-12 text-sm tracking-wider"
              >
                CONTINUE
              </Button>
            )}
            {step === totalSteps && (
              <Button
                onClick={handleSubmit}
                disabled={!canProceed() || loading}
                className="flex-1 rounded-none h-12 text-sm tracking-wider"
              >
                {loading ? "CREATING PROFILE..." : "COMPLETE PROFILE"}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
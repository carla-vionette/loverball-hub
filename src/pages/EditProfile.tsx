import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
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
import { X, Camera, Loader2, ArrowLeft } from "lucide-react";
import loverballLogo from "@/assets/loverball-script-logo.png";
import MobileHeader from "@/components/MobileHeader";
import DesktopNav from "@/components/DesktopNav";
import BottomNav from "@/components/BottomNav";

const EditProfile = () => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
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
  const [phoneNumber, setPhoneNumber] = useState("");
  const [smsNotifications, setSmsNotifications] = useState(true);
  const [profilePhoto, setProfilePhoto] = useState<File | null>(null);
  const [profilePhotoPreview, setProfilePhotoPreview] = useState<string | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const loadProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }
      
      setUserId(user.id);
      
      // Fetch existing profile
      const { data: profile, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();
      
      if (error) {
        console.error("Error fetching profile:", error);
        navigate("/onboarding");
        return;
      }
      
      if (!profile) {
        navigate("/onboarding");
        return;
      }
      
      // Populate form with existing data
      setName(profile.name || "");
      setPronouns(profile.pronouns || "");
      setCity(profile.city || "");
      setAgeRange(profile.age_range || "");
      setFavoriteSports(profile.favorite_sports || []);
      setFavTeams(profile.favorite_teams_players || []);
      setExperienceTypes(profile.sports_experience_types || []);
      setInterests(profile.other_interests || []);
      setComfortLevel(profile.event_comfort_level || "");
      setParticipation(profile.participation_preferences || []);
      setPhoneNumber(profile.phone_number || "");
      setSmsNotifications(profile.sms_notifications_enabled ?? true);
      setProfilePhotoPreview(profile.profile_photo_url || null);
      
      setInitialLoading(false);
    };
    
    loadProfile();
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
      
      // Upload photo if a new one was selected
      let photoUrl: string | null = profilePhotoPreview;
      if (profilePhoto) {
        photoUrl = await uploadProfilePhoto();
      }
      
      const { error } = await supabase.from("profiles").update({
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
        phone_number: phoneNumber || null,
        sms_notifications_enabled: smsNotifications,
      }).eq("id", userId);

      if (error) throw error;

      toast({
        title: "Profile updated!",
        description: "Your changes have been saved.",
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

  if (initialLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <MobileHeader />
      <DesktopNav />
      <BottomNav />

      <main className="md:ml-64 pb-20 md:pb-8 pt-20 md:pt-8">
        <div className="max-w-2xl mx-auto px-4">
          {/* Header */}
          <div className="mb-8">
            <Button 
              variant="ghost" 
              onClick={() => navigate("/profile")}
              className="mb-4 -ml-2"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Profile
            </Button>
            <p className="text-primary text-sm font-medium tracking-widest mb-4 uppercase">Step {step} of {totalSteps}</p>
            <h1 className="text-3xl sm:text-4xl font-sans font-normal text-foreground mb-4">Edit your profile</h1>
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
                    <SelectContent className="bg-background z-50 max-h-60 overflow-y-auto">
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
                          id={`sport-${sport}`}
                          checked={favoriteSports.includes(sport)}
                          onCheckedChange={() =>
                            toggleArrayItem(favoriteSports, sport, setFavoriteSports)
                          }
                        />
                        <label htmlFor={`sport-${sport}`} className="text-sm cursor-pointer">
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
                          id={`exp-${exp}`}
                          checked={experienceTypes.includes(exp)}
                          onCheckedChange={() =>
                            toggleArrayItem(experienceTypes, exp, setExperienceTypes)
                          }
                        />
                        <label htmlFor={`exp-${exp}`} className="text-sm cursor-pointer">
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
                          id={`interest-${interest}`}
                          checked={interests.includes(interest)}
                          onCheckedChange={() =>
                            toggleArrayItem(interests, interest, setInterests)
                          }
                        />
                        <label htmlFor={`interest-${interest}`} className="text-sm cursor-pointer">
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
                  <Label className="text-xs tracking-wider uppercase text-foreground/60">What do you want to do? * (select all that apply)</Label>
                  <div className="grid grid-cols-1 gap-3">
                    {PARTICIPATION_OPTIONS.map((option) => (
                      <div key={option} className="flex items-center space-x-3 p-3 bg-background border border-border hover:border-primary transition-colors cursor-pointer" onClick={() => toggleArrayItem(participation, option, setParticipation)}>
                        <Checkbox
                          id={`participation-${option}`}
                          checked={participation.includes(option)}
                          onCheckedChange={() =>
                            toggleArrayItem(participation, option, setParticipation)
                          }
                        />
                        <label htmlFor={`participation-${option}`} className="text-sm cursor-pointer">
                          {option}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-xs tracking-wider uppercase text-foreground/60">Phone Number (for event updates)</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="(555) 123-4567"
                    className="rounded-none h-12 border-border bg-background"
                  />
                </div>

                <div className="flex items-center space-x-3 p-3 bg-background border border-border">
                  <Checkbox
                    id="sms"
                    checked={smsNotifications}
                    onCheckedChange={(checked) => setSmsNotifications(checked as boolean)}
                  />
                  <label htmlFor="sms" className="text-sm cursor-pointer">
                    I want to receive SMS updates about events
                  </label>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex gap-4 pt-6">
              {step > 1 && (
                <Button
                  variant="outline"
                  onClick={() => setStep(step - 1)}
                  className="flex-1 h-12 rounded-none"
                >
                  Back
                </Button>
              )}
              
              {step < totalSteps ? (
                <Button
                  onClick={() => setStep(step + 1)}
                  disabled={!canProceed()}
                  className="flex-1 h-12 rounded-none"
                >
                  Continue
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  disabled={!canProceed() || loading || uploadingPhoto}
                  className="flex-1 h-12 rounded-none"
                >
                  {loading || uploadingPhoto ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default EditProfile;

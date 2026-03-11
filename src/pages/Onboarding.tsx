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
  SPORTS_OPTIONS,
  CONTENT_INTERESTS_OPTIONS,
} from "@/lib/onboardingOptions";
import { X, Camera, Loader2, Check, ChevronRight, ChevronLeft } from "lucide-react";
import loverballLogo from "@/assets/loverball-script-logo.png";
import { motion, AnimatePresence } from "framer-motion";

const Onboarding = () => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [direction, setDirection] = useState(1);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Step 1: Basic Info
  const [name, setName] = useState("");
  const [pronouns, setPronouns] = useState("");
  const [city, setCity] = useState("");
  const [birthday, setBirthday] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [smsOptIn, setSmsOptIn] = useState(false);
  const [profilePhoto, setProfilePhoto] = useState<File | null>(null);
  const [profilePhotoPreview, setProfilePhotoPreview] = useState<string | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Step 2: Sports Preferences
  const [favoriteSports, setFavoriteSports] = useState<string[]>([]);
  const [teamsInput, setTeamsInput] = useState("");
  const [favTeams, setFavTeams] = useState<string[]>([]);

  // Step 3: Content Interests
  const [contentInterests, setContentInterests] = useState<string[]>([]);

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

  const totalSteps = 4;
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
    const interestsList = contentInterests.slice(0, 2).join(", ");
    const teamText = favTeams[0] ? `${favTeams[0]} fan` : `${sportsList} enthusiast`;
    const locationText = city ? `in ${city}` : "";
    
    return `${teamText} ${locationText} who loves ${sportsList}${interestsList ? `, ${interestsList},` : ''} and connecting with fellow sports fans.`;
  };

  const handleSubmit = async () => {
    if (!userId) return;

    setLoading(true);
    try {
      const bio = generateBio();
      
      let photoUrl: string | null = null;
      if (profilePhoto) {
        photoUrl = await uploadProfilePhoto();
      }
      
      const { error } = await supabase.from("profiles").insert({
        id: userId,
        name,
        pronouns,
        city,
        favorite_sports: favoriteSports,
        favorite_teams_players: favTeams,
        other_interests: contentInterests,
        bio,
        profile_photo_url: photoUrl,
        birthday: birthday || null,
        phone_number: phoneNumber.trim() || null,
        sms_notifications_enabled: smsOptIn,
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
        return favoriteSports.length > 0 && favTeams.length >= 1;
      case 3:
        return contentInterests.length >= 3;
      case 4:
        return true;
      default:
        return false;
    }
  };

  const getStepTitle = () => {
    switch (step) {
      case 1: return "Tell us about yourself.";
      case 2: return "Your sports preferences.";
      case 3: return "What topics interest you?";
      case 4: return "Review your profile.";
      default: return "";
    }
  };

  const getStepValidationMessage = () => {
    switch (step) {
      case 2:
        if (favoriteSports.length === 0) return "Select at least 1 sport";
        if (favTeams.length < 1) return "Add at least 1 favorite team";
        return null;
      case 3:
        if (contentInterests.length < 3) return `Select at least 3 topics (${contentInterests.length}/3)`;
        return null;
      default:
        return null;
    }
  };

  const goNext = () => {
    setDirection(1);
    setStep(step + 1);
  };

  const goBack = () => {
    setDirection(-1);
    setStep(step - 1);
  };

  const slideVariants = {
    enter: (dir: number) => ({ x: dir > 0 ? 80 : -80, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir: number) => ({ x: dir > 0 ? -80 : 80, opacity: 0 }),
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/90 backdrop-blur-sm border-b border-border">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
          <div className="flex items-center justify-center h-16">
            <img src={loverballLogo} alt="Loverball" className="h-20 w-auto" />
          </div>
        </div>
      </nav>

      <div className="pt-24 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <p className="text-primary text-sm font-medium tracking-widest uppercase">Step {step} of {totalSteps}</p>
              <div className="flex gap-1.5">
                {Array.from({ length: totalSteps }).map((_, i) => (
                  <div
                    key={i}
                    className={`h-2 w-8 rounded-full transition-colors duration-300 ${
                      i + 1 <= step ? "bg-primary" : "bg-border"
                    }`}
                  />
                ))}
              </div>
            </div>
            <h1 className="text-3xl sm:text-4xl font-sans font-normal text-foreground mb-4">
              {getStepTitle()}
            </h1>
            <Progress value={progress} className="h-1" />
          </div>

          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={step}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.25, ease: "easeInOut" }}
            >
              <div className="bg-pale-pink p-6 sm:p-10 space-y-6">

                {/* Step 1: Basic Info */}
                {step === 1 && (
                  <div className="space-y-6">
                    {/* Profile Photo */}
                    <div className="flex flex-col items-center gap-3">
                      <Label className="text-xs tracking-wider uppercase text-foreground/60">Profile Photo</Label>
                      <div onClick={() => fileInputRef.current?.click()} className="relative cursor-pointer group">
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
                      <input ref={fileInputRef} type="file" accept="image/*" onChange={handlePhotoSelect} className="hidden" />
                      <p className="text-xs text-foreground/40">Click to upload (max 5MB)</p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-xs tracking-wider uppercase text-foreground/60">Name *</Label>
                      <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" className="rounded-none h-12 border-border bg-background" />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="birthday" className="text-xs tracking-wider uppercase text-foreground/60">Birthday</Label>
                      <Input id="birthday" type="date" value={birthday} onChange={(e) => setBirthday(e.target.value)} className="rounded-none h-12 border-border bg-background" />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs tracking-wider uppercase text-foreground/60">Pronouns</Label>
                      <Select value={pronouns} onValueChange={setPronouns}>
                        <SelectTrigger className="bg-background rounded-none h-12">
                          <SelectValue placeholder="Select pronouns" />
                        </SelectTrigger>
                        <SelectContent className="bg-background z-50">
                          {PRONOUN_OPTIONS.map((option) => (
                            <SelectItem key={option} value={option}>{option}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs tracking-wider uppercase text-foreground/60">City *</Label>
                      <Select value={city} onValueChange={setCity}>
                        <SelectTrigger className="bg-background rounded-none h-12">
                          <SelectValue placeholder="Select city" />
                        </SelectTrigger>
                        <SelectContent className="bg-background z-50 max-h-60 overflow-y-auto">
                          {CITY_OPTIONS.map((option) => (
                            <SelectItem key={option} value={option}>{option}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                  </div>
                )}

                {/* Step 2: Sports Preferences */}
                {step === 2 && (
                  <div className="space-y-6">
                    <div className="space-y-3">
                      <Label className="text-xs tracking-wider uppercase text-foreground/60">Select your favorite sports *</Label>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {SPORTS_OPTIONS.map((sport) => {
                          const selected = favoriteSports.includes(sport);
                          return (
                            <div
                              key={sport}
                              onClick={() => toggleArrayItem(favoriteSports, sport, setFavoriteSports)}
                              className={`flex items-center gap-3 p-3 border cursor-pointer transition-all duration-200 ${
                                selected
                                  ? "bg-primary/10 border-primary"
                                  : "bg-background border-border hover:border-primary/50"
                              }`}
                            >
                              <Checkbox checked={selected} onCheckedChange={() => toggleArrayItem(favoriteSports, sport, setFavoriteSports)} />
                              <span className="text-sm font-medium">{sport}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs tracking-wider uppercase text-foreground/60">Select your favorite teams * (min 1)</Label>
                      <div className="flex gap-2">
                        <Input
                          value={teamsInput}
                          onChange={(e) => setTeamsInput(e.target.value)}
                          placeholder="e.g., Lakers, Cowboys, Real Madrid"
                          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTeam())}
                          className="rounded-none h-12 border-border bg-background"
                        />
                        <Button type="button" onClick={addTeam} disabled={!teamsInput.trim()} className="rounded-none h-12 px-6">
                          ADD
                        </Button>
                      </div>
                      {favTeams.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-3">
                          {favTeams.map((team) => (
                            <Badge key={team} variant="secondary" className="gap-1 rounded-none px-3 py-1.5 text-sm">
                              {team}
                              <X className="h-3 w-3 cursor-pointer ml-1" onClick={() => removeTeam(team)} />
                            </Badge>
                          ))}
                        </div>
                      )}
                      {favTeams.length === 0 && (
                        <p className="text-xs text-destructive mt-1">Add at least 1 team to continue</p>
                      )}
                    </div>
                  </div>
                )}

                {/* Step 3: Content Interests */}
                {step === 3 && (
                  <div className="space-y-6">
                    <div className="space-y-1">
                      <Label className="text-xs tracking-wider uppercase text-foreground/60">What topics interest you? * (select at least 3)</Label>
                      <p className="text-sm text-muted-foreground">{contentInterests.length}/3 minimum selected</p>
                    </div>
                    <div className="flex flex-wrap gap-3">
                      {CONTENT_INTERESTS_OPTIONS.map((topic) => {
                        const selected = contentInterests.includes(topic);
                        return (
                          <button
                            key={topic}
                            type="button"
                            onClick={() => toggleArrayItem(contentInterests, topic, setContentInterests)}
                            className={`px-5 py-2.5 text-sm font-medium border transition-all duration-200 ${
                              selected
                                ? "bg-primary text-primary-foreground border-primary"
                                : "bg-background text-foreground border-border hover:border-primary/50"
                            }`}
                          >
                            {selected && <Check className="inline h-3.5 w-3.5 mr-1.5 -mt-0.5" />}
                            {topic}
                          </button>
                        );
                      })}
                    </div>
                    {contentInterests.length > 0 && contentInterests.length < 3 && (
                      <p className="text-xs text-destructive">Select {3 - contentInterests.length} more topic{3 - contentInterests.length > 1 ? "s" : ""}</p>
                    )}
                  </div>
                )}

                {/* Step 4: Confirmation */}
                {step === 4 && (
                  <div className="space-y-6">
                    <p className="text-sm text-muted-foreground">Review your selections before completing setup.</p>

                    {/* Profile Summary */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-4">
                        <Avatar className="w-16 h-16">
                          {profilePhotoPreview ? (
                            <AvatarImage src={profilePhotoPreview} alt="Preview" className="object-cover" />
                          ) : (
                            <AvatarFallback className="bg-background text-lg font-sans">
                              {name.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          )}
                        </Avatar>
                        <div>
                          <h3 className="font-sans text-xl">{name}</h3>
                          <p className="text-sm text-muted-foreground">
                            {city}{pronouns ? ` · ${pronouns}` : ""}
                          </p>
                        </div>
                      </div>

                      <div className="border-t border-border pt-4 space-y-4">
                        <div>
                          <h4 className="text-xs tracking-wider uppercase text-foreground/60 mb-2">Favorite Sports</h4>
                          <div className="flex flex-wrap gap-2">
                            {favoriteSports.map((sport) => (
                              <Badge key={sport} className="rounded-none bg-primary/10 text-primary border-primary/20 hover:bg-primary/10">
                                {sport}
                              </Badge>
                            ))}
                          </div>
                        </div>

                        <div>
                          <h4 className="text-xs tracking-wider uppercase text-foreground/60 mb-2">Favorite Teams</h4>
                          <div className="flex flex-wrap gap-2">
                            {favTeams.map((team) => (
                              <Badge key={team} variant="secondary" className="rounded-none">
                                {team}
                              </Badge>
                            ))}
                          </div>
                        </div>

                        <div>
                          <h4 className="text-xs tracking-wider uppercase text-foreground/60 mb-2">Content Interests</h4>
                          <div className="flex flex-wrap gap-2">
                            {contentInterests.map((interest) => (
                              <Badge key={interest} variant="outline" className="rounded-none">
                                {interest}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Validation message */}
          {getStepValidationMessage() && !canProceed() && (
            <p className="text-sm text-destructive mt-3">{getStepValidationMessage()}</p>
          )}

          {/* Buttons */}
          <div className="flex gap-3 pt-6">
            {step > 1 && (
              <Button variant="outline" onClick={goBack} className="rounded-none h-12 px-6 text-sm tracking-wider gap-2">
                <ChevronLeft className="h-4 w-4" />
                BACK
              </Button>
            )}
            {step < totalSteps && (
              <Button
                onClick={goNext}
                disabled={!canProceed()}
                className="flex-1 rounded-none h-12 text-sm tracking-wider gap-2"
              >
                CONTINUE
                <ChevronRight className="h-4 w-4" />
              </Button>
            )}
            {step === totalSteps && (
              <Button
                onClick={handleSubmit}
                disabled={loading}
                className="flex-1 rounded-none h-12 text-sm tracking-wider gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    CREATING PROFILE...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4" />
                    COMPLETE SETUP
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Onboarding;

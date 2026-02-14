import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Trophy, GraduationCap, User, ArrowLeft, ArrowRight, Check,
  Upload, Globe, Instagram, Twitter, Facebook, Tv, Youtube,
  MapPin, Calendar, Mail, Palette, Image, FileText,
  Shield, Users, Loader2, CheckCircle, AlertCircle,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import loverbballLogo from "@/assets/loverball-logo-red.png";

// ─── Types ──────────────────────────────────────────────
type ChannelType = "professional" | "college" | "creator";
type Step = 0 | 1 | 2 | 3 | 4 | 5;

const CHANNEL_TYPES: { type: ChannelType; icon: typeof Trophy; title: string; subtitle: string; features: string[] }[] = [
  {
    type: "professional",
    icon: Trophy,
    title: "Professional Team",
    subtitle: "Official team channel",
    features: ["NFL, NBA, MLB, NHL, MLS teams", "Verified badge", "Requires team verification"],
  },
  {
    type: "college",
    icon: GraduationCap,
    title: "College Team (D1)",
    subtitle: "NCAA Division 1 athletics",
    features: ["University sports teams", "Verified badge", "School email verification"],
  },
  {
    type: "creator",
    icon: User,
    title: "Creator Channel",
    subtitle: "Personal content creator",
    features: ["Individual creators", "Sports analysts, trainers", "Fan channels"],
  },
];

const CATEGORIES = [
  "Sports Team", "Sports Media", "Training & Coaching",
  "Fan Content", "Sports News", "Entertainment",
];

const LEAGUES = ["NFL", "NBA", "MLB", "NHL", "MLS", "NWSL", "WNBA", "NCAA", "Other"];

const SPORTS = [
  "Basketball", "Football", "Baseball", "Soccer", "Hockey",
  "Tennis", "Golf", "Volleyball", "Track & Field", "Swimming", "Other",
];

const STEPS = ["Type", "Basic Info", "Branding", "Details", "Verification", "Guidelines"];

// ─── Main Component ─────────────────────────────────────
const CreateChannel = () => {
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  const { toast } = useToast();
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<Step>(0);
  const [submitting, setSubmitting] = useState(false);

  // Step 0: Type
  const [channelType, setChannelType] = useState<ChannelType | null>(null);

  // Step 1: Basic Info
  const [channelName, setChannelName] = useState("");
  const [handle, setHandle] = useState("");
  const [description, setDescription] = useState("");
  const [channelCategory, setChannelCategory] = useState("");
  const [sportFocus, setSportFocus] = useState("");
  const [league, setLeague] = useState("");

  // Step 2: Branding
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [primaryColor, setPrimaryColor] = useState("#DA3A2B");
  const [accentColor, setAccentColor] = useState("#FDB927");

  // Step 3: Details
  const [location, setLocation] = useState("");
  const [foundedYear, setFoundedYear] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [twitterUrl, setTwitterUrl] = useState("");
  const [instagramUrl, setInstagramUrl] = useState("");
  const [facebookUrl, setFacebookUrl] = useState("");
  const [tiktokUrl, setTiktokUrl] = useState("");
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [contactEmail, setContactEmail] = useState("");

  // Step 4: Verification (for teams)
  const [verificationNote, setVerificationNote] = useState("");

  // Step 5: Guidelines
  const [contentLanguage, setContentLanguage] = useState("English");
  const [targetAudience, setTargetAudience] = useState("general");
  const [uploadSchedule, setUploadSchedule] = useState("");
  const [agreedToGuidelines, setAgreedToGuidelines] = useState(false);

  // ─── Handlers ─────────────────────────────────────────
  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast({ title: "File too large", description: "Avatar must be under 2MB", variant: "destructive" });
        return;
      }
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleBannerUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 6 * 1024 * 1024) {
        toast({ title: "File too large", description: "Banner must be under 6MB", variant: "destructive" });
        return;
      }
      setBannerFile(file);
      setBannerPreview(URL.createObjectURL(file));
    }
  };

  const handleAutoHandle = (name: string) => {
    setChannelName(name);
    if (!handle || handle === slugify(channelName)) {
      setHandle(slugify(name));
    }
  };

  const slugify = (s: string) =>
    s.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "").slice(0, 30);

  const canProceed = (): boolean => {
    switch (step) {
      case 0: return channelType !== null;
      case 1: return channelName.length >= 3 && channelName.length <= 30 && handle.length >= 3;
      case 2: return true;
      case 3: return true;
      case 4: return channelType === "creator" || verificationNote.length > 0 || isAdmin;
      case 5: return agreedToGuidelines;
      default: return false;
    }
  };

  const totalSteps = channelType === "creator" ? 5 : 6; // creators skip verification

  const nextStep = () => {
    if (step === 3 && channelType === "creator") {
      setStep(5); // skip verification for creators
    } else if (step < 5) {
      setStep((step + 1) as Step);
    }
  };

  const prevStep = () => {
    if (step === 5 && channelType === "creator") {
      setStep(3);
    } else if (step > 0) {
      setStep((step - 1) as Step);
    }
  };

  const handleSubmit = async () => {
    if (!user) return;
    setSubmitting(true);

    try {
      let avatarUrl = "";
      let bannerUrl = "";

      // Upload avatar if provided
      if (avatarFile) {
        const ext = avatarFile.name.split(".").pop();
        const path = `${user.id}/${handle}_avatar.${ext}`;
        const { error } = await supabase.storage.from("profile-photos").upload(path, avatarFile, { upsert: true });
        if (!error) {
          const { data: urlData } = supabase.storage.from("profile-photos").getPublicUrl(path);
          avatarUrl = urlData.publicUrl;
        }
      }

      // Upload banner if provided
      if (bannerFile) {
        const ext = bannerFile.name.split(".").pop();
        const path = `${user.id}/${handle}_banner.${ext}`;
        const { error } = await supabase.storage.from("profile-photos").upload(path, bannerFile, { upsert: true });
        if (!error) {
          const { data: urlData } = supabase.storage.from("profile-photos").getPublicUrl(path);
          bannerUrl = urlData.publicUrl;
        }
      }

      const { error } = await supabase.from("creator_channels").insert({
        owner_user_id: user.id,
        channel_name: channelName,
        slug: handle,
        description,
        sport_focus: sportFocus,
        avatar_url: avatarUrl || null,
        banner_url: bannerUrl || null,
        channel_type: channelType,
        league: league || null,
        location: location || null,
        website_url: websiteUrl || null,
        contact_email: contactEmail || null,
        content_language: contentLanguage,
        target_audience: targetAudience,
        upload_schedule: uploadSchedule || null,
        founded_year: foundedYear ? parseInt(foundedYear) : null,
        brand_colors: { primary: primaryColor, accent: accentColor },
        social_links: {
          twitter: twitterUrl || null,
          instagram: instagramUrl || null,
          facebook: facebookUrl || null,
          tiktok: tiktokUrl || null,
          youtube: youtubeUrl || null,
        },
        status: channelType === "creator" ? "pending_review" : "pending_review",
      });

      if (error) throw error;

      toast({ title: "Channel created!", description: "Your channel is pending review." });
      navigate("/watch/dashboard");
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to create channel", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  // ─── Step progress ────────────────────────────────────
  const activeSteps = channelType === "creator"
    ? STEPS.filter((_, i) => i !== 4)
    : STEPS;

  const currentStepIndex = channelType === "creator" && step === 5 ? 4 : step;

  return (
    <div className="min-h-screen pb-20 md:pb-6">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-md px-4 py-3 md:px-8 md:py-4 border-b border-border/20">
        <div className="flex items-center justify-between max-w-3xl mx-auto">
          <div className="flex items-center gap-3">
            <button onClick={() => step === 0 ? navigate(-1) : prevStep()} className="text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-lg font-bold tracking-tight">Create Channel</h1>
          </div>
          {step > 0 && (
            <span className="text-xs text-muted-foreground">
              Step {currentStepIndex + 1} of {activeSteps.length}
            </span>
          )}
        </div>

        {/* Progress bar */}
        {step > 0 && (
          <div className="max-w-3xl mx-auto mt-3">
            <div className="flex gap-1.5">
              {activeSteps.map((_, i) => (
                <div
                  key={i}
                  className={`flex-1 h-1 rounded-full transition-colors ${
                    i <= currentStepIndex ? "bg-primary" : "bg-border/30"
                  }`}
                />
              ))}
            </div>
          </div>
        )}
      </header>

      <div className="px-4 md:px-8 py-6 max-w-3xl mx-auto">
        <AnimatePresence mode="wait">
          {/* ─── STEP 0: Channel Type Selection ──────── */}
          {step === 0 && (
            <motion.div key="type" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} className="space-y-6">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-foreground mb-2">What kind of channel?</h2>
                <p className="text-sm text-muted-foreground">Choose the type that best fits your content</p>
              </div>

              <div className="grid gap-4">
                {CHANNEL_TYPES.map((ct) => {
                  const Icon = ct.icon;
                  const selected = channelType === ct.type;
                  return (
                    <button
                      key={ct.type}
                      onClick={() => setChannelType(ct.type)}
                      className={`text-left p-5 rounded-2xl border-2 transition-all ${
                        selected
                          ? "border-primary bg-primary/5"
                          : "border-border/30 hover:border-primary/30 bg-card"
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                          selected ? "bg-primary/20" : "bg-secondary"
                        }`}>
                          <Icon className={`w-6 h-6 ${selected ? "text-primary" : "text-muted-foreground"}`} />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-base font-bold text-foreground">{ct.title}</h3>
                            {selected && <Check className="w-4 h-4 text-primary" />}
                          </div>
                          <p className="text-xs text-muted-foreground mb-3">{ct.subtitle}</p>
                          <ul className="space-y-1">
                            {ct.features.map((f) => (
                              <li key={f} className="text-[11px] text-muted-foreground flex items-center gap-2">
                                <div className="w-1 h-1 bg-primary rounded-full flex-shrink-0" />
                                {f}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* ─── STEP 1: Basic Info ──────────────────── */}
          {step === 1 && (
            <motion.div key="basic" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} className="space-y-6">
              <div className="mb-6">
                <h2 className="text-xl font-bold text-foreground mb-1">Basic Information</h2>
                <p className="text-xs text-muted-foreground">Set up your channel identity</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block mb-2">
                    Channel Name <span className="text-primary">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={channelName}
                      onChange={(e) => handleAutoHandle(e.target.value.slice(0, 30))}
                      placeholder="e.g. Lakers Highlights"
                      className="w-full bg-secondary rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/50"
                    />
                    <span className={`absolute right-3 top-1/2 -translate-y-1/2 text-[10px] ${channelName.length >= 30 ? "text-destructive" : "text-muted-foreground/50"}`}>
                      {channelName.length}/30
                    </span>
                  </div>
                  {channelName.length > 0 && channelName.length < 3 && (
                    <p className="text-[10px] text-destructive mt-1">Minimum 3 characters</p>
                  )}
                </div>

                <div>
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block mb-2">
                    Handle <span className="text-primary">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">@</span>
                    <input
                      type="text"
                      value={handle}
                      onChange={(e) => setHandle(slugify(e.target.value))}
                      placeholder="channel_handle"
                      className="w-full bg-secondary rounded-xl pl-8 pr-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/50"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block mb-2">
                    Description
                  </label>
                  <div className="relative">
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value.slice(0, 500))}
                      rows={3}
                      placeholder="What's your channel about?"
                      className="w-full bg-secondary rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                    />
                    <span className="absolute right-3 bottom-3 text-[10px] text-muted-foreground/50">
                      {description.length}/500
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block mb-2">Category</label>
                    <select value={channelCategory} onChange={(e) => setChannelCategory(e.target.value)} className="w-full bg-secondary rounded-xl px-4 py-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/50 appearance-none cursor-pointer">
                      <option value="">Select category</option>
                      {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block mb-2">Sport Focus</label>
                    <select value={sportFocus} onChange={(e) => setSportFocus(e.target.value)} className="w-full bg-secondary rounded-xl px-4 py-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/50 appearance-none cursor-pointer">
                      <option value="">Select sport</option>
                      {SPORTS.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                </div>

                {(channelType === "professional" || channelType === "college") && (
                  <div>
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block mb-2">League / Conference</label>
                    <select value={league} onChange={(e) => setLeague(e.target.value)} className="w-full bg-secondary rounded-xl px-4 py-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/50 appearance-none cursor-pointer">
                      <option value="">Select league</option>
                      {LEAGUES.map((l) => <option key={l} value={l}>{l}</option>)}
                    </select>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* ─── STEP 2: Branding ────────────────────── */}
          {step === 2 && (
            <motion.div key="branding" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} className="space-y-6">
              <div className="mb-6">
                <h2 className="text-xl font-bold text-foreground mb-1">Branding</h2>
                <p className="text-xs text-muted-foreground">Upload your channel art and set brand colors</p>
              </div>

              {/* Avatar */}
              <div>
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block mb-3">
                  Channel Avatar / Logo
                </label>
                <div className="flex items-center gap-4">
                  <div
                    onClick={() => avatarInputRef.current?.click()}
                    className="w-24 h-24 rounded-2xl bg-secondary border-2 border-dashed border-border/40 hover:border-primary/50 cursor-pointer flex items-center justify-center overflow-hidden transition-colors"
                  >
                    {avatarPreview ? (
                      <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <Upload className="w-6 h-6 text-muted-foreground" />
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground space-y-1">
                    <p>Square image, min 800×800px</p>
                    <p>JPG or PNG, max 2MB</p>
                    <button onClick={() => avatarInputRef.current?.click()} className="text-primary hover:underline font-medium">
                      {avatarPreview ? "Change" : "Upload"}
                    </button>
                  </div>
                  <input ref={avatarInputRef} type="file" accept="image/jpeg,image/png" onChange={handleAvatarUpload} className="hidden" />
                </div>
              </div>

              {/* Banner */}
              <div>
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block mb-3">
                  Channel Banner
                </label>
                <div
                  onClick={() => bannerInputRef.current?.click()}
                  className="w-full aspect-[16/5] rounded-xl bg-secondary border-2 border-dashed border-border/40 hover:border-primary/50 cursor-pointer flex items-center justify-center overflow-hidden transition-colors"
                >
                  {bannerPreview ? (
                    <img src={bannerPreview} alt="Banner" className="w-full h-full object-cover" />
                  ) : (
                    <div className="text-center">
                      <Image className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-xs text-muted-foreground">2560×1440px recommended · Max 6MB</p>
                    </div>
                  )}
                </div>
                <input ref={bannerInputRef} type="file" accept="image/jpeg,image/png" onChange={handleBannerUpload} className="hidden" />
              </div>

              {/* Brand Colors */}
              <div>
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block mb-3">
                  <Palette className="w-3 h-3 inline mr-1" /> Brand Colors
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-3 bg-secondary rounded-xl p-3">
                    <input type="color" value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} className="w-10 h-10 rounded-lg border-none cursor-pointer" />
                    <div>
                      <p className="text-xs font-medium text-foreground">Primary</p>
                      <p className="text-[10px] text-muted-foreground uppercase">{primaryColor}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 bg-secondary rounded-xl p-3">
                    <input type="color" value={accentColor} onChange={(e) => setAccentColor(e.target.value)} className="w-10 h-10 rounded-lg border-none cursor-pointer" />
                    <div>
                      <p className="text-xs font-medium text-foreground">Accent</p>
                      <p className="text-[10px] text-muted-foreground uppercase">{accentColor}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Live preview */}
              <div>
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block mb-3">Preview</label>
                <div className="rounded-xl overflow-hidden border border-border/30">
                  <div className="h-20 relative" style={{ background: `linear-gradient(135deg, ${primaryColor}, ${accentColor})` }}>
                    {bannerPreview && <img src={bannerPreview} alt="" className="w-full h-full object-cover opacity-60" />}
                  </div>
                  <div className="p-4 bg-card flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-secondary overflow-hidden border-2 border-background -mt-8 relative z-10">
                      {avatarPreview ? (
                        <img src={avatarPreview} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <img src={loverbballLogo} alt="" className="w-full h-full object-contain p-1" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-foreground">{channelName || "Channel Name"}</p>
                      <p className="text-[10px] text-muted-foreground">@{handle || "handle"}</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* ─── STEP 3: Details ─────────────────────── */}
          {step === 3 && (
            <motion.div key="details" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} className="space-y-6">
              <div className="mb-6">
                <h2 className="text-xl font-bold text-foreground mb-1">Details</h2>
                <p className="text-xs text-muted-foreground">Location, website, and social links</p>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block mb-2">
                      <MapPin className="w-3 h-3 inline mr-1" /> Location
                    </label>
                    <input type="text" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Los Angeles, CA" className="w-full bg-secondary rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/50" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block mb-2">
                      <Calendar className="w-3 h-3 inline mr-1" /> Founded Year
                    </label>
                    <input type="number" value={foundedYear} onChange={(e) => setFoundedYear(e.target.value)} placeholder="1947" min="1800" max="2026" className="w-full bg-secondary rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/50" />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block mb-2">
                    <Globe className="w-3 h-3 inline mr-1" /> Website
                  </label>
                  <input type="url" value={websiteUrl} onChange={(e) => setWebsiteUrl(e.target.value)} placeholder="https://example.com" className="w-full bg-secondary rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/50" />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block mb-2">
                    <Mail className="w-3 h-3 inline mr-1" /> Contact Email
                  </label>
                  <input type="email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} placeholder="contact@channel.com" className="w-full bg-secondary rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/50" />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block mb-3">Social Media Links</label>
                  <div className="space-y-3">
                    {[
                      { icon: Twitter, label: "Twitter/X", value: twitterUrl, setter: setTwitterUrl, placeholder: "https://twitter.com/..." },
                      { icon: Instagram, label: "Instagram", value: instagramUrl, setter: setInstagramUrl, placeholder: "https://instagram.com/..." },
                      { icon: Facebook, label: "Facebook", value: facebookUrl, setter: setFacebookUrl, placeholder: "https://facebook.com/..." },
                      { icon: Tv, label: "TikTok", value: tiktokUrl, setter: setTiktokUrl, placeholder: "https://tiktok.com/@..." },
                      { icon: Youtube, label: "YouTube", value: youtubeUrl, setter: setYoutubeUrl, placeholder: "https://youtube.com/@..." },
                    ].map(({ icon: Icon, label, value, setter, placeholder }) => (
                      <div key={label} className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0">
                          <Icon className="w-4 h-4 text-muted-foreground" />
                        </div>
                        <input
                          type="url"
                          value={value}
                          onChange={(e) => setter(e.target.value)}
                          placeholder={placeholder}
                          className="flex-1 bg-secondary rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/50"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* ─── STEP 4: Verification (Teams Only) ───── */}
          {step === 4 && (
            <motion.div key="verify" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} className="space-y-6">
              <div className="mb-6">
                <h2 className="text-xl font-bold text-foreground mb-1">Verification</h2>
                <p className="text-xs text-muted-foreground">
                  {channelType === "professional"
                    ? "Provide documentation to verify your team affiliation"
                    : "Verify with your school email to get the verified badge"}
                </p>
              </div>

              <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 flex items-start gap-3">
                <Shield className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                <div className="text-xs text-foreground">
                  <p className="font-bold mb-1">Why verify?</p>
                  <p className="text-muted-foreground">Verified channels receive a badge, appear higher in search, and gain access to premium features. All submissions are reviewed by our admin team.</p>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block mb-2">
                  Verification Details
                </label>
                <textarea
                  value={verificationNote}
                  onChange={(e) => setVerificationNote(e.target.value)}
                  rows={4}
                  placeholder={
                    channelType === "professional"
                      ? "Describe your affiliation with the team. Include any official documentation references..."
                      : "Provide your .edu email address and your role within the athletics department..."
                  }
                  className="w-full bg-secondary rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                />
              </div>

              {isAdmin && (
                <div className="bg-secondary/50 rounded-xl p-4 flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-primary" />
                  <p className="text-xs text-foreground">As an admin, you can skip verification.</p>
                </div>
              )}
            </motion.div>
          )}

          {/* ─── STEP 5: Content Guidelines ──────────── */}
          {step === 5 && (
            <motion.div key="guidelines" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} className="space-y-6">
              <div className="mb-6">
                <h2 className="text-xl font-bold text-foreground mb-1">Content Guidelines</h2>
                <p className="text-xs text-muted-foreground">Final settings before submitting your channel</p>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block mb-2">Content Language</label>
                    <select value={contentLanguage} onChange={(e) => setContentLanguage(e.target.value)} className="w-full bg-secondary rounded-xl px-4 py-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/50 appearance-none cursor-pointer">
                      {["English", "Spanish", "French", "Portuguese", "Japanese", "Korean", "Other"].map((l) => (
                        <option key={l} value={l}>{l}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block mb-2">Target Audience</label>
                    <select value={targetAudience} onChange={(e) => setTargetAudience(e.target.value)} className="w-full bg-secondary rounded-xl px-4 py-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/50 appearance-none cursor-pointer">
                      <option value="general">General (All ages)</option>
                      <option value="13+">Teens (13+)</option>
                      <option value="18+">Adults (18+)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block mb-2">Upload Schedule (Optional)</label>
                  <input type="text" value={uploadSchedule} onChange={(e) => setUploadSchedule(e.target.value)} placeholder="e.g. New videos every Monday and Thursday" className="w-full bg-secondary rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/50" />
                </div>
              </div>

              {/* Community Guidelines Agreement */}
              <div className="bg-card border border-border/30 rounded-xl p-5 space-y-4">
                <h3 className="text-sm font-bold text-foreground">Community Guidelines</h3>
                <div className="text-xs text-muted-foreground space-y-2">
                  <p>By creating a channel, you agree to:</p>
                  <ul className="space-y-1.5 list-disc pl-4">
                    <li>Upload only content you own or have rights to</li>
                    <li>Follow Loverball's community standards</li>
                    <li>Not upload misleading, hateful, or harmful content</li>
                    <li>Respect copyright and intellectual property</li>
                    <li>Maintain content appropriate for your selected audience rating</li>
                  </ul>
                </div>
                <button
                  onClick={() => setAgreedToGuidelines(!agreedToGuidelines)}
                  className="flex items-center gap-3 w-full"
                >
                  <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                    agreedToGuidelines ? "bg-primary border-primary" : "border-border"
                  }`}>
                    {agreedToGuidelines && <Check className="w-3 h-3 text-primary-foreground" />}
                  </div>
                  <span className="text-sm text-foreground font-medium">I agree to the community guidelines</span>
                </button>
              </div>

              {/* Review summary */}
              <div className="bg-secondary/50 rounded-xl p-5 space-y-3">
                <h3 className="text-sm font-bold text-foreground">Channel Summary</h3>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="text-muted-foreground">Name</div>
                  <div className="text-foreground font-medium">{channelName}</div>
                  <div className="text-muted-foreground">Handle</div>
                  <div className="text-foreground font-medium">@{handle}</div>
                  <div className="text-muted-foreground">Type</div>
                  <div className="text-foreground font-medium capitalize">{channelType}</div>
                  {sportFocus && <>
                    <div className="text-muted-foreground">Sport</div>
                    <div className="text-foreground font-medium">{sportFocus}</div>
                  </>}
                  {league && <>
                    <div className="text-muted-foreground">League</div>
                    <div className="text-foreground font-medium">{league}</div>
                  </>}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ─── Navigation Buttons ────────────────────── */}
        <div className="flex gap-3 mt-8 pt-4 border-t border-border/20">
          {step > 0 && (
            <button
              onClick={prevStep}
              className="px-6 py-3 bg-secondary text-foreground rounded-xl text-sm font-medium hover:bg-secondary/80 transition-colors flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
          )}
          <div className="flex-1" />
          {step < 5 ? (
            <button
              onClick={nextStep}
              disabled={!canProceed()}
              className="px-6 py-3 bg-primary text-primary-foreground rounded-xl text-sm font-bold hover:bg-primary/90 transition-colors flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Continue <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={!canProceed() || submitting}
              className="px-8 py-3 bg-primary text-primary-foreground rounded-xl text-sm font-bold hover:bg-primary/90 transition-colors flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Creating...</>
              ) : (
                <><Check className="w-4 h-4" /> Create Channel</>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default CreateChannel;

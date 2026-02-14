import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload, Video, Image, X, Check, ChevronDown, ChevronUp,
  Play, Clock, Eye, EyeOff, Lock, Globe, Link2, Copy,
  Loader2, AlertCircle, Sparkles, Calendar, MapPin,
  FileText, Tag, Film, Users, Shield, Share2,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import loverbballLogo from "@/assets/loverball-logo-red.png";

// ─── Types & Constants ──────────────────────────────────
interface VideoFile {
  file: File;
  name: string;
  size: number;
  type: string;
  preview?: string;
  duration?: number;
  resolution?: string;
}

type UploadStage = "idle" | "selected" | "uploading" | "processing" | "success" | "error";
type Privacy = "public" | "unlisted" | "private";

const MAX_FILE_SIZE = 2 * 1024 * 1024 * 1024; // 2GB
const SUPPORTED_FORMATS = ["video/mp4", "video/quicktime", "video/x-msvideo", "video/webm"];
const MAX_TITLE = 100;
const MAX_DESC = 5000;
const MAX_TAGS = 10;

const SPORT_TYPES = [
  "Basketball", "Football", "Baseball", "Soccer", "Hockey",
  "Tennis", "Golf", "MMA", "Boxing", "Track & Field",
  "Swimming", "Volleyball", "Softball", "Lacrosse", "Other",
];

const CATEGORIES = [
  "Highlights", "Full Game", "Analysis", "Training",
  "Behind the Scenes", "Interviews", "Vlogs", "Documentary",
  "Live Event", "Reaction", "Other",
];

const TAG_SUGGESTIONS = [
  "NBA", "NFL", "MLB", "MLS", "WNBA", "NCAA", "LA",
  "highlights", "skills", "training", "gameday", "playoffs",
  "workout", "culture", "fashion", "recap", "top10",
  "dunk", "goal", "touchdown", "homerun",
];

const PROCESSING_STEPS = [
  { label: "Uploading video...", icon: Upload },
  { label: "Processing video...", icon: Film },
  { label: "Generating thumbnails...", icon: Image },
  { label: "Optimizing for playback...", icon: Sparkles },
  { label: "Video published!", icon: Check },
];

// ─── Helpers ────────────────────────────────────────────
const formatFileSize = (bytes: number) => {
  if (bytes >= 1_073_741_824) return `${(bytes / 1_073_741_824).toFixed(1)} GB`;
  if (bytes >= 1_048_576) return `${(bytes / 1_048_576).toFixed(1)} MB`;
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${bytes} B`;
};

const formatDuration = (seconds: number) => {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
};

// ─── Select Component ───────────────────────────────────
const FormSelect = ({
  label, value, onChange, options, placeholder, required,
}: {
  label: string; value: string; onChange: (v: string) => void;
  options: string[]; placeholder: string; required?: boolean;
}) => (
  <div>
    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block mb-2">
      {label} {required && <span className="text-primary">*</span>}
    </label>
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full bg-secondary rounded-lg px-4 py-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/50 transition-all appearance-none cursor-pointer"
    >
      <option value="">{placeholder}</option>
      {options.map((o) => (
        <option key={o} value={o}>{o}</option>
      ))}
    </select>
  </div>
);

// ─── Toggle Component ───────────────────────────────────
const FormToggle = ({
  label, description, checked, onChange, disabled,
}: {
  label: string; description?: string; checked: boolean;
  onChange: (v: boolean) => void; disabled?: boolean;
}) => (
  <div className={`flex items-center justify-between py-2 ${disabled ? "opacity-40" : ""}`}>
    <div>
      <p className="text-sm font-medium text-foreground">{label}</p>
      {description && <p className="text-[11px] text-muted-foreground">{description}</p>}
    </div>
    <button
      type="button"
      onClick={() => !disabled && onChange(!checked)}
      className={`w-10 h-6 rounded-full transition-colors flex items-center px-0.5 ${
        checked ? "bg-primary" : "bg-border"
      }`}
    >
      <div className={`w-5 h-5 rounded-full bg-white shadow transition-transform ${
        checked ? "translate-x-4" : "translate-x-0"
      }`} />
    </button>
  </div>
);

// ─── Main Component ─────────────────────────────────────
const VideoUpload = () => {
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const thumbnailInputRef = useRef<HTMLInputElement>(null);

  // File state
  const [videoFile, setVideoFile] = useState<VideoFile | null>(null);
  const [stage, setStage] = useState<UploadStage>("idle");
  const [dragOver, setDragOver] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [processingStep, setProcessingStep] = useState(0);
  const [errorMsg, setErrorMsg] = useState("");

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [channel, setChannel] = useState("");
  const [privacy, setPrivacy] = useState<Privacy>("public");
  const [sportType, setSportType] = useState("");
  const [category, setCategory] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [allowLikes, setAllowLikes] = useState(true);
  const [allowShares, setAllowShares] = useState(true);
  const [customThumbnail, setCustomThumbnail] = useState<string | null>(null);
  const [selectedThumbIndex, setSelectedThumbIndex] = useState(0);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [schedulePublish, setSchedulePublish] = useState(false);
  const [publishDate, setPublishDate] = useState("");

  // Mock generated thumbnails
  const [generatedThumbs] = useState([
    "https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=320&h=180&fit=crop",
    "https://images.unsplash.com/photo-1546519638-68e109498ffc?w=320&h=180&fit=crop",
    "https://images.unsplash.com/photo-1504450758-28f095a56e89?w=320&h=180&fit=crop",
  ]);

  // Mock channels for the user
  const channelOptions = [
    ...(isAdmin ? ["Loverball Highlights", "Loverball Originals", "Loverball Events"] : []),
    "My Creator Channel",
  ];

  // ─── File handling ──────────────────────────────────
  const validateFile = (file: File): string | null => {
    if (!SUPPORTED_FORMATS.includes(file.type)) {
      return `Unsupported format. Please use MP4, MOV, AVI, or WebM.`;
    }
    if (file.size > MAX_FILE_SIZE) {
      return `File too large. Maximum size is 2GB.`;
    }
    return null;
  };

  const processFile = useCallback((file: File) => {
    const error = validateFile(file);
    if (error) {
      setErrorMsg(error);
      setStage("error");
      return;
    }

    const video = document.createElement("video");
    video.preload = "metadata";
    video.onloadedmetadata = () => {
      URL.revokeObjectURL(video.src);
      setVideoFile({
        file,
        name: file.name,
        size: file.size,
        type: file.type,
        preview: URL.createObjectURL(file),
        duration: video.duration,
        resolution: `${video.videoWidth}x${video.videoHeight}`,
      });
      setStage("selected");
      // Auto-fill title from filename
      if (!title) {
        const nameWithoutExt = file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ");
        setTitle(nameWithoutExt.slice(0, MAX_TITLE));
      }
    };
    video.src = URL.createObjectURL(file);
  }, [title]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  }, [processFile]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const handleThumbnailUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCustomThumbnail(URL.createObjectURL(file));
      setSelectedThumbIndex(-1);
    }
  };

  // ─── Tags ───────────────────────────────────────────
  const addTag = (tag: string) => {
    const cleaned = tag.trim().toLowerCase();
    if (cleaned && !tags.includes(cleaned) && tags.length < MAX_TAGS) {
      setTags([...tags, cleaned]);
    }
    setTagInput("");
  };

  const removeTag = (tag: string) => setTags(tags.filter((t) => t !== tag));

  const handleTagKeyDown = (e: React.KeyboardEvent) => {
    if ((e.key === "Enter" || e.key === ",") && tagInput.trim()) {
      e.preventDefault();
      addTag(tagInput);
    }
    if (e.key === "Backspace" && !tagInput && tags.length > 0) {
      removeTag(tags[tags.length - 1]);
    }
  };

  // ─── Upload simulation ─────────────────────────────
  const handleUpload = async () => {
    if (!title.trim()) {
      toast({ title: "Title required", description: "Please enter a video title.", variant: "destructive" });
      return;
    }
    if (!channel) {
      toast({ title: "Channel required", description: "Please select a channel.", variant: "destructive" });
      return;
    }
    if (!videoFile) return;

    setStage("uploading");
    setUploadProgress(0);
    setProcessingStep(0);

    // Simulate upload progress
    const uploadInterval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 100) {
          clearInterval(uploadInterval);
          return 100;
        }
        return prev + Math.random() * 8 + 2;
      });
    }, 200);

    // Wait for "upload" to complete
    await new Promise((resolve) => setTimeout(resolve, 3000));
    clearInterval(uploadInterval);
    setUploadProgress(100);

    // Simulate processing steps
    setStage("processing");
    for (let i = 1; i < PROCESSING_STEPS.length; i++) {
      await new Promise((resolve) => setTimeout(resolve, 1200));
      setProcessingStep(i);
    }

    setStage("success");
  };

  const handleReset = () => {
    setVideoFile(null);
    setStage("idle");
    setTitle("");
    setDescription("");
    setChannel("");
    setPrivacy("public");
    setSportType("");
    setCategory("");
    setTags([]);
    setCustomThumbnail(null);
    setSelectedThumbIndex(0);
    setUploadProgress(0);
    setProcessingStep(0);
    setErrorMsg("");
  };

  const uploadSpeed = Math.round(5 + Math.random() * 10);
  const timeRemaining = uploadProgress > 0 
    ? Math.max(1, Math.round(((100 - uploadProgress) / 10) * 2))
    : 0;

  const privacyIcons: Record<Privacy, typeof Globe> = {
    public: Globe,
    unlisted: Link2,
    private: Lock,
  };

  return (
    <div className="min-h-screen pb-20 md:pb-6">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-md px-4 py-3 md:px-8 md:py-4 border-b border-border/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Upload className="w-5 h-5 text-primary" />
            <h1 className="text-lg font-bold tracking-tight">Upload Video</h1>
          </div>
          {stage === "selected" && (
            <div className="flex items-center gap-2">
              <button
                onClick={handleReset}
                className="px-4 py-2 text-xs font-medium text-muted-foreground hover:text-foreground rounded-lg hover:bg-secondary transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleUpload}
                className="px-5 py-2 bg-primary text-primary-foreground text-xs font-bold rounded-lg hover:bg-primary/90 transition-colors"
              >
                Publish
              </button>
            </div>
          )}
        </div>
      </header>

      <div className="px-4 md:px-8 py-6 max-w-4xl mx-auto">
        <AnimatePresence mode="wait">
          {/* ─── IDLE: Drop Zone ─────────────────────── */}
          {stage === "idle" && (
            <motion.div
              key="dropzone"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`relative border-2 border-dashed rounded-2xl p-16 md:p-20 text-center cursor-pointer transition-all duration-300 ${
                dragOver
                  ? "border-primary bg-primary/5 scale-[1.01]"
                  : "border-border/40 hover:border-primary/50 hover:bg-secondary/30"
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="video/mp4,video/quicktime,video/x-msvideo,video/webm"
                onChange={handleFileSelect}
                className="hidden"
              />
              <motion.div
                animate={dragOver ? { scale: 1.1, y: -5 } : { scale: 1, y: 0 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
                  <Upload className="w-8 h-8 text-primary" />
                </div>
                <h2 className="text-xl font-bold text-foreground mb-2">
                  {dragOver ? "Drop your video here" : "Upload Video"}
                </h2>
                <p className="text-sm text-muted-foreground mb-1">
                  Drag and drop video file here
                </p>
                <p className="text-xs text-muted-foreground/60 mb-6">
                  Supported: MP4, MOV, AVI, WebM • Max: 2GB
                </p>
                <button
                  type="button"
                  className="bg-primary text-primary-foreground px-8 py-3 rounded-xl text-sm font-bold hover:bg-primary/90 transition-colors"
                >
                  Select File
                </button>
              </motion.div>
            </motion.div>
          )}

          {/* ─── ERROR ───────────────────────────────── */}
          {stage === "error" && (
            <motion.div
              key="error"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="border-2 border-destructive/30 rounded-2xl p-12 text-center"
            >
              <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
              <h2 className="text-lg font-bold text-foreground mb-2">Upload Error</h2>
              <p className="text-sm text-muted-foreground mb-6">{errorMsg}</p>
              <button
                onClick={handleReset}
                className="bg-primary text-primary-foreground px-6 py-2.5 rounded-xl text-sm font-bold hover:bg-primary/90 transition-colors"
              >
                Try Again
              </button>
            </motion.div>
          )}

          {/* ─── SELECTED: Full Form ─────────────────── */}
          {stage === "selected" && videoFile && (
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              {/* Video Preview */}
              <div className="bg-card rounded-2xl border border-border/30 overflow-hidden">
                <div className="flex flex-col md:flex-row">
                  <div className="relative w-full md:w-80 aspect-video bg-black flex-shrink-0">
                    {videoFile.preview ? (
                      <video
                        src={videoFile.preview}
                        className="w-full h-full object-cover"
                        muted
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Video className="w-10 h-10 text-muted-foreground" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                      <Play className="w-10 h-10 text-white" fill="white" />
                    </div>
                  </div>
                  <div className="p-4 flex-1 min-w-0">
                    <p className="text-sm font-bold text-foreground truncate mb-2">{videoFile.name}</p>
                    <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                      <span>Size: {formatFileSize(videoFile.size)}</span>
                      <span>Format: {videoFile.type.split("/")[1]?.toUpperCase()}</span>
                      {videoFile.duration && <span>Duration: {formatDuration(videoFile.duration)}</span>}
                      {videoFile.resolution && <span>Resolution: {videoFile.resolution}</span>}
                    </div>
                    <button
                      onClick={handleReset}
                      className="mt-3 text-xs text-primary hover:underline"
                    >
                      Change video
                    </button>
                  </div>
                </div>
              </div>

              {/* Basic Information */}
              <section className="space-y-4">
                <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                  <FileText className="w-4 h-4 text-primary" />
                  Basic Information
                </h3>

                <div>
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block mb-2">
                    Title <span className="text-primary">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value.slice(0, MAX_TITLE))}
                      placeholder="Give your video a title..."
                      className="w-full bg-secondary rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                    />
                    <span className={`absolute right-3 top-1/2 -translate-y-1/2 text-[10px] ${
                      title.length >= MAX_TITLE ? "text-destructive" : "text-muted-foreground/50"
                    }`}>
                      {title.length}/{MAX_TITLE}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block mb-2">
                    Description
                  </label>
                  <div className="relative">
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value.slice(0, MAX_DESC))}
                      rows={4}
                      placeholder="Tell viewers about your video..."
                      className="w-full bg-secondary rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/50 resize-none transition-all"
                    />
                    <span className="absolute right-3 bottom-3 text-[10px] text-muted-foreground/50">
                      {description.length}/{MAX_DESC}
                    </span>
                  </div>
                </div>
              </section>

              {/* Thumbnail Selection */}
              <section className="space-y-4">
                <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                  <Image className="w-4 h-4 text-primary" />
                  Thumbnail
                </h3>
                <p className="text-xs text-muted-foreground">Select auto-generated thumbnail or upload custom (1280×720, JPG/PNG)</p>
                <div className="grid grid-cols-4 gap-3">
                  {generatedThumbs.map((thumb, i) => (
                    <button
                      key={i}
                      onClick={() => { setSelectedThumbIndex(i); setCustomThumbnail(null); }}
                      className={`relative aspect-video rounded-lg overflow-hidden border-2 transition-all ${
                        selectedThumbIndex === i && !customThumbnail
                          ? "border-primary ring-2 ring-primary/30"
                          : "border-border/30 hover:border-primary/50"
                      }`}
                    >
                      <img src={thumb} alt={`Thumbnail ${i + 1}`} className="w-full h-full object-cover" />
                      {selectedThumbIndex === i && !customThumbnail && (
                        <div className="absolute top-1 right-1 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                          <Check className="w-3 h-3 text-primary-foreground" />
                        </div>
                      )}
                    </button>
                  ))}
                  <button
                    onClick={() => thumbnailInputRef.current?.click()}
                    className={`relative aspect-video rounded-lg border-2 border-dashed transition-all flex items-center justify-center ${
                      customThumbnail
                        ? "border-primary ring-2 ring-primary/30"
                        : "border-border/30 hover:border-primary/50"
                    }`}
                  >
                    <input
                      ref={thumbnailInputRef}
                      type="file"
                      accept="image/jpeg,image/png"
                      onChange={handleThumbnailUpload}
                      className="hidden"
                    />
                    {customThumbnail ? (
                      <>
                        <img src={customThumbnail} alt="Custom" className="w-full h-full object-cover rounded-lg" />
                        <div className="absolute top-1 right-1 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                          <Check className="w-3 h-3 text-primary-foreground" />
                        </div>
                      </>
                    ) : (
                      <div className="text-center">
                        <Upload className="w-5 h-5 text-muted-foreground mx-auto mb-1" />
                        <span className="text-[10px] text-muted-foreground">Custom</span>
                      </div>
                    )}
                  </button>
                </div>
              </section>

              {/* Channel Selection */}
              <section className="space-y-4">
                <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                  <Users className="w-4 h-4 text-primary" />
                  Channel
                </h3>
                <div className="space-y-2">
                  {channelOptions.map((ch) => (
                    <button
                      key={ch}
                      onClick={() => setChannel(ch)}
                      className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${
                        channel === ch
                          ? "bg-primary/10 border-2 border-primary/30"
                          : "bg-secondary border-2 border-transparent hover:border-border/50"
                      }`}
                    >
                      <img
                        src={loverbballLogo}
                        alt={ch}
                        className="w-8 h-8 rounded-full object-contain bg-background p-0.5"
                      />
                      <span className="text-sm font-medium text-foreground">{ch}</span>
                      {channel === ch && (
                        <Check className="w-4 h-4 text-primary ml-auto" />
                      )}
                    </button>
                  ))}
                </div>
              </section>

              {/* Video Settings */}
              <section className="space-y-4">
                <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                  <Shield className="w-4 h-4 text-primary" />
                  Video Settings
                </h3>

                {/* Privacy */}
                <div>
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block mb-2">
                    Privacy
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(["public", "unlisted", "private"] as Privacy[]).map((p) => {
                      const Icon = privacyIcons[p];
                      return (
                        <button
                          key={p}
                          onClick={() => setPrivacy(p)}
                          className={`flex items-center gap-2 p-3 rounded-xl text-sm font-medium transition-all ${
                            privacy === p
                              ? "bg-primary/10 border-2 border-primary/30 text-primary"
                              : "bg-secondary border-2 border-transparent text-muted-foreground hover:border-border/50"
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                          <span className="capitalize">{p}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Toggles */}
                <div className="bg-secondary/50 rounded-xl p-4 space-y-1">
                  <FormToggle
                    label="Allow likes"
                    description="Viewers can like this video"
                    checked={allowLikes}
                    onChange={setAllowLikes}
                  />
                  <FormToggle
                    label="Allow shares"
                    description="Viewers can share this video"
                    checked={allowShares}
                    onChange={setAllowShares}
                  />
                  <FormToggle
                    label="Comments"
                    description="Coming soon"
                    checked={false}
                    onChange={() => {}}
                    disabled
                  />
                </div>
              </section>

              {/* Tags & Categories */}
              <section className="space-y-4">
                <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                  <Tag className="w-4 h-4 text-primary" />
                  Tags & Categories
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormSelect
                    label="Sport Type"
                    value={sportType}
                    onChange={setSportType}
                    options={SPORT_TYPES}
                    placeholder="Select sport"
                  />
                  <FormSelect
                    label="Category"
                    value={category}
                    onChange={setCategory}
                    options={CATEGORIES}
                    placeholder="Select category"
                  />
                </div>

                {/* Tags input */}
                <div>
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block mb-2">
                    Tags ({tags.length}/{MAX_TAGS})
                  </label>
                  <div className="bg-secondary rounded-xl p-3 flex flex-wrap gap-2 min-h-[48px]">
                    {tags.map((tag) => (
                      <span
                        key={tag}
                        className="flex items-center gap-1 bg-primary/10 text-primary text-xs font-bold px-2.5 py-1 rounded-full"
                      >
                        #{tag}
                        <button onClick={() => removeTag(tag)} className="hover:text-destructive transition-colors">
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                    {tags.length < MAX_TAGS && (
                      <input
                        type="text"
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        onKeyDown={handleTagKeyDown}
                        placeholder={tags.length === 0 ? "Add tags..." : ""}
                        className="flex-1 min-w-[100px] bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
                      />
                    )}
                  </div>
                  {/* Tag suggestions */}
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {TAG_SUGGESTIONS.filter((s) => !tags.includes(s.toLowerCase())).slice(0, 12).map((s) => (
                      <button
                        key={s}
                        onClick={() => addTag(s)}
                        className="px-2.5 py-1 text-[10px] font-medium bg-secondary text-muted-foreground rounded-full hover:bg-primary/10 hover:text-primary transition-all"
                      >
                        + {s}
                      </button>
                    ))}
                  </div>
                </div>
              </section>

              {/* Advanced Options */}
              <section>
                <button
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-foreground transition-colors w-full"
                >
                  {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  Advanced Options
                </button>
                <AnimatePresence>
                  {showAdvanced && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="space-y-4 pt-4">
                        <FormToggle
                          label="Schedule publish"
                          description="Set a future date and time to publish"
                          checked={schedulePublish}
                          onChange={setSchedulePublish}
                        />
                        {schedulePublish && (
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-muted-foreground" />
                            <input
                              type="datetime-local"
                              value={publishDate}
                              onChange={(e) => setPublishDate(e.target.value)}
                              className="bg-secondary rounded-lg px-4 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/50"
                            />
                          </div>
                        )}

                        <div className="bg-secondary/50 rounded-xl p-4 space-y-3">
                          <p className="text-xs text-muted-foreground">
                            <MapPin className="w-3 h-3 inline mr-1" />
                            Location tagging — <span className="italic">coming soon</span>
                          </p>
                          <p className="text-xs text-muted-foreground">
                            <FileText className="w-3 h-3 inline mr-1" />
                            Captions/Subtitles (.srt, .vtt) — <span className="italic">coming soon</span>
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </section>

              {/* Bottom action bar */}
              <div className="flex gap-3 pt-4 border-t border-border/20">
                <button
                  onClick={handleUpload}
                  className="flex-1 bg-primary text-primary-foreground py-3.5 rounded-xl text-sm font-bold hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
                >
                  <Upload className="w-4 h-4" />
                  {schedulePublish ? "Schedule" : "Publish"}
                </button>
                <button
                  onClick={() => toast({ title: "Draft saved", description: "Your video draft has been saved." })}
                  className="px-6 py-3.5 bg-secondary text-foreground rounded-xl text-sm font-medium hover:bg-secondary/80 transition-colors"
                >
                  Save Draft
                </button>
              </div>
            </motion.div>
          )}

          {/* ─── UPLOADING: Progress ─────────────────── */}
          {stage === "uploading" && (
            <motion.div
              key="uploading"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="max-w-lg mx-auto text-center py-16"
            >
              <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
                <Upload className="w-8 h-8 text-primary animate-pulse" />
              </div>
              <h2 className="text-xl font-bold text-foreground mb-2">Uploading...</h2>
              <p className="text-sm text-muted-foreground mb-8">{videoFile?.name}</p>

              {/* Progress bar */}
              <div className="w-full bg-secondary rounded-full h-3 mb-4 overflow-hidden">
                <motion.div
                  className="h-full bg-primary rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(uploadProgress, 100)}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span className="font-bold text-foreground">{Math.min(Math.round(uploadProgress), 100)}%</span>
                <span>{timeRemaining} min remaining</span>
                <span>{uploadSpeed} MB/s</span>
              </div>

              <button
                onClick={handleReset}
                className="mt-8 px-6 py-2 text-xs font-medium text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
              >
                Cancel Upload
              </button>
            </motion.div>
          )}

          {/* ─── PROCESSING ──────────────────────────── */}
          {stage === "processing" && (
            <motion.div
              key="processing"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="max-w-lg mx-auto text-center py-16"
            >
              <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
              </div>
              <h2 className="text-xl font-bold text-foreground mb-8">Processing Video</h2>

              <div className="space-y-3 text-left">
                {PROCESSING_STEPS.map((step, i) => {
                  const StepIcon = step.icon;
                  const isDone = i < processingStep;
                  const isActive = i === processingStep;
                  return (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className={`flex items-center gap-3 p-3 rounded-xl transition-all ${
                        isActive ? "bg-primary/10" : isDone ? "bg-secondary/50" : "opacity-30"
                      }`}
                    >
                      {isDone ? (
                        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                          <Check className="w-4 h-4 text-primary" />
                        </div>
                      ) : isActive ? (
                        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                          <Loader2 className="w-4 h-4 text-primary animate-spin" />
                        </div>
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
                          <StepIcon className="w-4 h-4 text-muted-foreground" />
                        </div>
                      )}
                      <span className={`text-sm font-medium ${
                        isDone || isActive ? "text-foreground" : "text-muted-foreground"
                      }`}>
                        {step.label}
                      </span>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* ─── SUCCESS ─────────────────────────────── */}
          {stage === "success" && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="max-w-lg mx-auto text-center py-16"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
                className="w-20 h-20 rounded-2xl bg-primary/20 flex items-center justify-center mx-auto mb-6"
              >
                <Sparkles className="w-8 h-8 text-primary" />
              </motion.div>
              <motion.h2
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="text-2xl font-bold text-foreground mb-2"
              >
                Video Published! 🎉
              </motion.h2>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="text-sm text-muted-foreground mb-8"
              >
                "{title}" is now live on {channel}
              </motion.p>

              {/* Preview card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
                className="bg-card border border-border/30 rounded-xl overflow-hidden mb-8 text-left"
              >
                <div className="aspect-video bg-black relative">
                  <img
                    src={customThumbnail || generatedThumbs[selectedThumbIndex] || generatedThumbs[0]}
                    alt={title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-2 right-2 bg-black/80 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
                    {videoFile?.duration ? formatDuration(videoFile.duration) : "3:45"}
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="text-sm font-bold text-foreground mb-1">{title}</h3>
                  <p className="text-xs text-muted-foreground">{channel} · Just now</p>
                </div>
              </motion.div>

              {/* Actions */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1 }}
                className="flex flex-col gap-3"
              >
                <div className="flex gap-3">
                  <button
                    onClick={() => navigate("/watch")}
                    className="flex-1 bg-primary text-primary-foreground py-3 rounded-xl text-sm font-bold hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
                  >
                    <Eye className="w-4 h-4" />
                    View Video
                  </button>
                  <button
                    onClick={handleReset}
                    className="flex-1 bg-secondary text-foreground py-3 rounded-xl text-sm font-bold hover:bg-secondary/80 transition-colors flex items-center justify-center gap-2"
                  >
                    <Upload className="w-4 h-4" />
                    Upload Another
                  </button>
                </div>
                <div className="flex gap-2 justify-center">
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(window.location.origin + "/watch/video/new");
                      toast({ title: "Link copied!", description: "Video link copied to clipboard." });
                    }}
                    className="flex items-center gap-2 px-4 py-2 text-xs font-medium text-muted-foreground hover:text-foreground bg-secondary rounded-lg transition-colors"
                  >
                    <Copy className="w-3 h-3" />
                    Copy Link
                  </button>
                  <button className="flex items-center gap-2 px-4 py-2 text-xs font-medium text-muted-foreground hover:text-foreground bg-secondary rounded-lg transition-colors">
                    <Share2 className="w-3 h-3" />
                    Share
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default VideoUpload;

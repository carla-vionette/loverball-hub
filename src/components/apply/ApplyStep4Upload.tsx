import { useState, useRef, useCallback } from "react";
import type { ApplyFormData } from "@/pages/Apply";
import { supabase } from "@/integrations/supabase/client";
import { Upload, X, Image } from "lucide-react";
import { toast } from "sonner";

interface Props {
  data: ApplyFormData;
  updateField: <K extends keyof ApplyFormData>(key: K, value: ApplyFormData[K]) => void;
  userId?: string;
}

const UploadZone = ({
  label,
  hint,
  value,
  onUpload,
  onRemove,
  aspectClass,
}: {
  label: string;
  hint: string;
  value: string;
  onUpload: (file: File) => void;
  onRemove: () => void;
  aspectClass: string;
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      const file = e.dataTransfer.files?.[0];
      if (file && file.type.startsWith("image/")) onUpload(file);
      else toast.error("Please upload an image file");
    },
    [onUpload]
  );

  return (
    <div>
      <label className="text-sm font-medium text-foreground mb-1.5 block">{label}</label>
      <p className="text-muted-foreground text-xs mb-2">{hint}</p>

      {value ? (
        <div className={`relative rounded-2xl overflow-hidden border border-border ${aspectClass}`}>
          <img src={value} alt={label} className="w-full h-full object-cover" />
          <button
            onClick={onRemove}
            className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          className={`${aspectClass} rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors ${
            dragging ? "border-primary bg-primary/5" : "border-border hover:border-primary/40 bg-muted/30"
          }`}
        >
          <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
            <Upload className="w-5 h-5 text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground font-medium">
            {dragging ? "Drop here" : "Click or drag to upload"}
          </p>
          <p className="text-xs text-muted-foreground/70">PNG, JPG up to 5MB</p>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onUpload(file);
          e.target.value = "";
        }}
      />
    </div>
  );
};

const ApplyStep4Upload = ({ data, updateField, userId }: Props) => {
  const [uploading, setUploading] = useState<string | null>(null);

  const upload = async (file: File, type: "logo" | "banner") => {
    if (!userId) {
      toast.error("Please sign in first");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File must be under 5MB");
      return;
    }
    setUploading(type);
    try {
      const ext = file.name.split(".").pop();
      const path = `${userId}/${type}-${Date.now()}.${ext}`;
      const { error } = await supabase.storage
        .from("application-uploads")
        .upload(path, file, { cacheControl: "3600", upsert: true });
      if (error) throw error;

      const { data: urlData } = supabase.storage
        .from("application-uploads")
        .getPublicUrl(path);

      updateField(type === "logo" ? "logoUrl" : "bannerUrl", urlData.publicUrl);
      toast.success(`${type === "logo" ? "Logo" : "Banner"} uploaded!`);
    } catch (err: any) {
      toast.error(err.message || "Upload failed");
    } finally {
      setUploading(null);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground mb-2">Upload your visuals</h1>
      <p className="text-muted-foreground text-sm mb-8">
        Add a logo and banner image to represent your brand. You can update these later.
      </p>

      {uploading && (
        <div className="mb-4 flex items-center gap-2 text-sm text-primary font-medium">
          <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          Uploading {uploading}...
        </div>
      )}

      <div className="space-y-6">
        <UploadZone
          label="Logo / Profile Image"
          hint="Square image, at least 400×400px recommended"
          value={data.logoUrl}
          onUpload={(f) => upload(f, "logo")}
          onRemove={() => updateField("logoUrl", "")}
          aspectClass="aspect-square max-w-[200px]"
        />

        <UploadZone
          label="Banner Image"
          hint="Wide image, 1200×400px or 3:1 ratio recommended"
          value={data.bannerUrl}
          onUpload={(f) => upload(f, "banner")}
          onRemove={() => updateField("bannerUrl", "")}
          aspectClass="aspect-[3/1] w-full"
        />
      </div>
    </div>
  );
};

export default ApplyStep4Upload;

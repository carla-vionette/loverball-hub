import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Calendar, Mail, Phone, Link, ImagePlus } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const EVENT_TYPES = [
  { value: "watch_party", label: "Watch Party" },
  { value: "game", label: "Game Day" },
  { value: "panel", label: "Panel" },
  { value: "brunch", label: "Brunch" },
  { value: "networking", label: "Networking" },
  { value: "other", label: "Other" },
];

const EventSubmissionForm = ({ open, onOpenChange }: Props) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    event_date: "",
    event_time: "",
    venue_name: "",
    city: "",
    event_type: "",
    email: "",
    phone: "",
    social_instagram: "",
    social_tiktok: "",
    social_twitter: "",
  });
  const [imageFile, setImageFile] = useState<File | null>(null);

  const update = (field: string, value: string) =>
    setForm((p) => ({ ...p, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast({ title: "Please sign in first", variant: "destructive" });
      return;
    }

    if (!form.title || !form.event_date || !form.email || !form.phone) {
      toast({ title: "Please fill in all required fields", variant: "destructive" });
      return;
    }

    setSubmitting(true);
    try {
      let imageUrl: string | null = null;

      if (imageFile) {
        const ext = imageFile.name.split(".").pop();
        const path = `event-submissions/${crypto.randomUUID()}.${ext}`;
        const { error: uploadErr } = await supabase.storage
          .from("event-images")
          .upload(path, imageFile, { cacheControl: "3600", upsert: false });
        if (!uploadErr) {
          const { data: urlData } = supabase.storage.from("event-images").getPublicUrl(path);
          imageUrl = urlData.publicUrl;
        }
      }

      const socialLinks = {
        instagram: form.social_instagram || null,
        tiktok: form.social_tiktok || null,
        twitter: form.social_twitter || null,
      };

      const { error } = await supabase.from("events").insert({
        title: form.title,
        description: form.description || null,
        event_date: form.event_date,
        event_time: form.event_time || null,
        venue_name: form.venue_name || null,
        city: form.city || null,
        event_type: form.event_type || null,
        image_url: imageUrl,
        host_user_id: user.id,
        status: "draft",
        approval_status: "pending",
        submitter_email: form.email,
        submitter_phone: form.phone,
        submitter_social_links: socialLinks,
        visibility: "public",
      } as any);

      if (error) throw error;

      toast({ title: "Event submitted for review!", description: "An admin will review your event soon." });
      onOpenChange(false);
      setForm({
        title: "", description: "", event_date: "", event_time: "",
        venue_name: "", city: "", event_type: "", email: "", phone: "",
        social_instagram: "", social_tiktok: "", social_twitter: "",
      });
      setImageFile(null);
    } catch (err: any) {
      toast({ title: "Failed to submit event", description: err.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display text-xl uppercase flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" />
            Submit an Event
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            All events are reviewed by our team before going live.
          </p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {/* Contact Info */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-foreground">Contact Information</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label htmlFor="email" className="text-xs">Email *</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input id="email" type="email" required placeholder="your@email.com" value={form.email} onChange={(e) => update("email", e.target.value)} className="pl-10" />
                </div>
              </div>
              <div>
                <Label htmlFor="phone" className="text-xs">Phone *</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input id="phone" type="tel" required placeholder="(555) 123-4567" value={form.phone} onChange={(e) => update("phone", e.target.value)} className="pl-10" />
                </div>
              </div>
            </div>

            <h3 className="text-sm font-semibold text-foreground pt-1">Social Links</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <Label className="text-xs">Instagram</Label>
                <div className="relative">
                  <Link className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input placeholder="@handle" value={form.social_instagram} onChange={(e) => update("social_instagram", e.target.value)} className="pl-10" />
                </div>
              </div>
              <div>
                <Label className="text-xs">TikTok</Label>
                <div className="relative">
                  <Link className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input placeholder="@handle" value={form.social_tiktok} onChange={(e) => update("social_tiktok", e.target.value)} className="pl-10" />
                </div>
              </div>
              <div>
                <Label className="text-xs">X / Twitter</Label>
                <div className="relative">
                  <Link className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input placeholder="@handle" value={form.social_twitter} onChange={(e) => update("social_twitter", e.target.value)} className="pl-10" />
                </div>
              </div>
            </div>
          </div>

          {/* Event Details */}
          <div className="space-y-3 border-t pt-4">
            <h3 className="text-sm font-semibold text-foreground">Event Details</h3>
            <div>
              <Label htmlFor="title" className="text-xs">Title *</Label>
              <Input id="title" required placeholder="Event name" value={form.title} onChange={(e) => update("title", e.target.value)} />
            </div>
            <div>
              <Label htmlFor="description" className="text-xs">Description</Label>
              <Textarea id="description" placeholder="Tell people what your event is about..." value={form.description} onChange={(e) => update("description", e.target.value)} rows={3} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label htmlFor="event_date" className="text-xs">Date *</Label>
                <Input id="event_date" type="date" required value={form.event_date} onChange={(e) => update("event_date", e.target.value)} />
              </div>
              <div>
                <Label htmlFor="event_time" className="text-xs">Time</Label>
                <Input id="event_time" type="time" value={form.event_time} onChange={(e) => update("event_time", e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label htmlFor="venue" className="text-xs">Venue</Label>
                <Input id="venue" placeholder="Venue name" value={form.venue_name} onChange={(e) => update("venue_name", e.target.value)} />
              </div>
              <div>
                <Label htmlFor="city" className="text-xs">City</Label>
                <Input id="city" placeholder="Los Angeles" value={form.city} onChange={(e) => update("city", e.target.value)} />
              </div>
            </div>
            <div>
              <Label className="text-xs">Event Type</Label>
              <Select value={form.event_type} onValueChange={(v) => update("event_type", v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {EVENT_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Event Image</Label>
              <label className="flex items-center gap-2 cursor-pointer border border-dashed border-border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                <ImagePlus className="w-5 h-5 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  {imageFile ? imageFile.name : "Upload an image (optional)"}
                </span>
                <input type="file" accept="image/*" className="hidden" onChange={(e) => setImageFile(e.target.files?.[0] || null)} />
              </label>
            </div>
          </div>

          <Button type="submit" className="w-full rounded-full" disabled={submitting}>
            {submitting ? <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Submitting...</> : "Submit Event for Review"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EventSubmissionForm;

import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2, Send } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const EventSubmissionDialog = ({ open, onOpenChange }: Props) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    email: "",
    phone: "",
    instagram: "",
    tiktok: "",
    event_title: "",
    event_date: "",
    event_location: "",
    event_description: "",
  });

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!user) {
      toast({ title: "Sign in required", description: "Please sign in to submit an event.", variant: "destructive" });
      return;
    }
    if (!form.email || !form.phone || !form.event_title || !form.event_date) {
      toast({ title: "Missing fields", description: "Please fill in all required fields.", variant: "destructive" });
      return;
    }

    setSubmitting(true);
    const { error } = await supabase.from("event_submissions" as any).insert({
      user_id: user.id,
      email: form.email,
      phone: form.phone,
      social_links: { instagram: form.instagram, tiktok: form.tiktok },
      event_title: form.event_title,
      event_date: form.event_date,
      event_location: form.event_location,
      event_description: form.event_description,
    } as any);

    if (error) {
      toast({ title: "Error", description: "Failed to submit. Please try again.", variant: "destructive" });
    } else {
      toast({ title: "Event submitted!", description: "Your event has been submitted for admin review." });
      onOpenChange(false);
      setForm({ email: "", phone: "", instagram: "", tiktok: "", event_title: "", event_date: "", event_location: "", event_description: "" });
    }
    setSubmitting(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-xl uppercase">Apply to Post an Event</DialogTitle>
          <DialogDescription>
            Submit your event details for review. Only approved Creator, Team, and Organization accounts can post events directly.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="email">Email *</Label>
              <Input id="email" type="email" placeholder="you@example.com" value={form.email} onChange={(e) => handleChange("email", e.target.value)} />
            </div>
            <div>
              <Label htmlFor="phone">Phone *</Label>
              <Input id="phone" type="tel" placeholder="(555) 123-4567" value={form.phone} onChange={(e) => handleChange("phone", e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="instagram">Instagram</Label>
              <Input id="instagram" placeholder="@yourhandle" value={form.instagram} onChange={(e) => handleChange("instagram", e.target.value)} />
            </div>
            <div>
              <Label htmlFor="tiktok">TikTok</Label>
              <Input id="tiktok" placeholder="@yourhandle" value={form.tiktok} onChange={(e) => handleChange("tiktok", e.target.value)} />
            </div>
          </div>
          <div>
            <Label htmlFor="event_title">Event Title *</Label>
            <Input id="event_title" placeholder="My Awesome Event" value={form.event_title} onChange={(e) => handleChange("event_title", e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="event_date">Event Date *</Label>
              <Input id="event_date" type="date" value={form.event_date} onChange={(e) => handleChange("event_date", e.target.value)} />
            </div>
            <div>
              <Label htmlFor="event_location">Location</Label>
              <Input id="event_location" placeholder="Los Angeles, CA" value={form.event_location} onChange={(e) => handleChange("event_location", e.target.value)} />
            </div>
          </div>
          <div>
            <Label htmlFor="event_description">Description</Label>
            <Textarea id="event_description" placeholder="Tell us about your event..." value={form.event_description} onChange={(e) => handleChange("event_description", e.target.value)} className="min-h-[80px]" />
          </div>
          <Button onClick={handleSubmit} disabled={submitting} className="w-full rounded-full">
            {submitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
            Submit for Review
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EventSubmissionDialog;

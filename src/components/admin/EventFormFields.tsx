import { useState, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, MapPin, Globe, Video, Palette, Users, Image, Upload, X, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface EventFormData {
  title: string;
  description: string;
  image_url: string;
  event_date: string;
  event_time: string;
  end_time: string;
  venue_name: string;
  city: string;
  event_type: string;
  visibility: string;
  capacity: string;
  location_type: string;
  virtual_link: string;
  location_map_url: string;
  rsvp_deadline: string;
  allow_plus_ones: boolean;
  theme: string;
  status: string;
}

interface EventFormFieldsProps {
  formData: EventFormData;
  onChange: (field: keyof EventFormData, value: string | boolean) => void;
}

const themeOptions = [
  { value: 'default', label: 'Default', color: 'bg-primary' },
  { value: 'valentines', label: 'Valentines', color: 'bg-pink-500' },
  { value: 'sports', label: 'Sports', color: 'bg-orange-500' },
  { value: 'elegant', label: 'Elegant', color: 'bg-purple-500' },
  { value: 'summer', label: 'Summer', color: 'bg-cyan-500' },
  { value: 'night', label: 'Night', color: 'bg-slate-700' },
];

export const EventFormFields = ({ formData, onChange }: EventFormFieldsProps) => {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Invalid file type',
        description: 'Please upload an image file (JPG, PNG, GIF, etc.)',
        variant: 'destructive',
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'File too large',
        description: 'Please upload an image smaller than 5MB',
        variant: 'destructive',
      });
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `events/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('event-images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('event-images')
        .getPublicUrl(filePath);

      onChange('image_url', publicUrl);
      toast({ title: 'Image uploaded!' });
    } catch (error: any) {
      toast({
        title: 'Upload failed',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const removeImage = () => {
    onChange('image_url', '');
  };

  return (
    <div className="space-y-6">
      {/* Basic Info */}
      <section className="space-y-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          Basic Information
        </h3>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="title">Event Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => onChange('title', e.target.value)}
              placeholder="WNBA Watch Party"
              className="mt-1.5"
            />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => onChange('description', e.target.value)}
              placeholder="Join us for an exciting evening..."
              className="mt-1.5 min-h-[120px]"
            />
          </div>

          <div>
            <Label>Cover Image</Label>
            <div className="mt-1.5 space-y-3">
              {/* Image Preview */}
              {formData.image_url && (
                <div className="relative rounded-lg overflow-hidden border border-border">
                  <img 
                    src={formData.image_url} 
                    alt="Event cover" 
                    className="w-full h-40 object-cover"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2 h-8 w-8"
                    onClick={removeImage}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              )}

              {/* Upload Button */}
              <div className="flex gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  id="image-upload"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="flex-1"
                >
                  {uploading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      {formData.image_url ? 'Replace Image' : 'Upload Image'}
                    </>
                  )}
                </Button>
              </div>

              {/* URL Input (alternative) */}
              <div className="flex gap-2 items-center">
                <span className="text-xs text-muted-foreground">or</span>
                <Input
                  value={formData.image_url}
                  onChange={(e) => onChange('image_url', e.target.value)}
                  placeholder="Paste image URL"
                  className="flex-1 text-sm"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <Separator />

      {/* Date & Time */}
      <section className="space-y-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Clock className="w-5 h-5" />
          Date & Time
        </h3>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="event_date">Date *</Label>
            <Input
              id="event_date"
              type="date"
              value={formData.event_date}
              onChange={(e) => onChange('event_date', e.target.value)}
              className="mt-1.5"
            />
          </div>
          <div>
            <Label htmlFor="event_time">Start Time</Label>
            <Input
              id="event_time"
              type="time"
              value={formData.event_time}
              onChange={(e) => onChange('event_time', e.target.value)}
              className="mt-1.5"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="end_time">End Time</Label>
            <Input
              id="end_time"
              type="time"
              value={formData.end_time}
              onChange={(e) => onChange('end_time', e.target.value)}
              className="mt-1.5"
            />
          </div>
          <div>
            <Label htmlFor="rsvp_deadline">RSVP Deadline</Label>
            <Input
              id="rsvp_deadline"
              type="datetime-local"
              value={formData.rsvp_deadline}
              onChange={(e) => onChange('rsvp_deadline', e.target.value)}
              className="mt-1.5"
            />
          </div>
        </div>
      </section>

      <Separator />

      {/* Location */}
      <section className="space-y-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <MapPin className="w-5 h-5" />
          Location
        </h3>

        <div>
          <Label htmlFor="location_type">Location Type</Label>
          <Select 
            value={formData.location_type} 
            onValueChange={(value) => onChange('location_type', value)}
          >
            <SelectTrigger className="mt-1.5">
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="in_person">In Person</SelectItem>
              <SelectItem value="virtual">Virtual</SelectItem>
              <SelectItem value="hybrid">Hybrid</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {formData.location_type !== 'virtual' && (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="venue_name">Venue Name</Label>
                <Input
                  id="venue_name"
                  value={formData.venue_name}
                  onChange={(e) => onChange('venue_name', e.target.value)}
                  placeholder="The Parlor"
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => onChange('city', e.target.value)}
                  placeholder="Los Angeles"
                  className="mt-1.5"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="location_map_url">Google Maps Embed URL</Label>
              <div className="flex gap-2 mt-1.5">
                <Globe className="w-5 h-5 text-muted-foreground mt-2.5" />
                <Input
                  id="location_map_url"
                  value={formData.location_map_url}
                  onChange={(e) => onChange('location_map_url', e.target.value)}
                  placeholder="https://www.google.com/maps/embed?pb=..."
                  className="flex-1"
                />
              </div>
            </div>
          </>
        )}

        {(formData.location_type === 'virtual' || formData.location_type === 'hybrid') && (
          <div>
            <Label htmlFor="virtual_link">Virtual Event Link</Label>
            <div className="flex gap-2 mt-1.5">
              <Video className="w-5 h-5 text-muted-foreground mt-2.5" />
              <Input
                id="virtual_link"
                value={formData.virtual_link}
                onChange={(e) => onChange('virtual_link', e.target.value)}
                placeholder="https://zoom.us/j/..."
                className="flex-1"
              />
            </div>
          </div>
        )}
      </section>

      <Separator />

      {/* Event Settings */}
      <section className="space-y-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Users className="w-5 h-5" />
          Event Settings
        </h3>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="event_type">Event Type</Label>
            <Select 
              value={formData.event_type} 
              onValueChange={(value) => onChange('event_type', value)}
            >
              <SelectTrigger className="mt-1.5">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="watch_party">Watch Party</SelectItem>
                <SelectItem value="brunch">Brunch</SelectItem>
                <SelectItem value="panel">Panel</SelectItem>
                <SelectItem value="networking">Networking</SelectItem>
                <SelectItem value="party">Party</SelectItem>
                <SelectItem value="salon">Salon</SelectItem>
                <SelectItem value="game">Game Day</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="visibility">Visibility</Label>
            <Select 
              value={formData.visibility} 
              onValueChange={(value) => onChange('visibility', value)}
            >
              <SelectTrigger className="mt-1.5">
                <SelectValue placeholder="Select visibility" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="public">Public</SelectItem>
                <SelectItem value="members_only">Members Only</SelectItem>
                <SelectItem value="invite_only">Invite Only</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="capacity">Capacity</Label>
            <Input
              id="capacity"
              type="number"
              value={formData.capacity}
              onChange={(e) => onChange('capacity', e.target.value)}
              placeholder="50"
              className="mt-1.5"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Leave empty for unlimited
            </p>
          </div>

          <div>
            <Label htmlFor="status">Status</Label>
            <Select 
              value={formData.status} 
              onValueChange={(value) => onChange('status', value)}
            >
              <SelectTrigger className="mt-1.5">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="published">Published</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
          <div>
            <Label htmlFor="allow_plus_ones" className="cursor-pointer">Allow Plus Ones</Label>
            <p className="text-xs text-muted-foreground">
              Allow guests to bring additional attendees
            </p>
          </div>
          <Switch
            id="allow_plus_ones"
            checked={formData.allow_plus_ones}
            onCheckedChange={(checked) => onChange('allow_plus_ones', checked)}
          />
        </div>
      </section>

      <Separator />

      {/* Theme Selection */}
      <section className="space-y-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Palette className="w-5 h-5" />
          Theme
        </h3>

        <div className="grid grid-cols-3 gap-3">
          {themeOptions.map((theme) => (
            <button
              key={theme.value}
              type="button"
              onClick={() => onChange('theme', theme.value)}
              className={`
                relative p-4 rounded-lg border-2 transition-all
                ${formData.theme === theme.value 
                  ? 'border-primary ring-2 ring-primary/20' 
                  : 'border-border hover:border-muted-foreground'
                }
              `}
            >
              <div className={`w-full h-8 rounded ${theme.color} mb-2`} />
              <p className="text-sm font-medium">{theme.label}</p>
              {formData.theme === theme.value && (
                <div className="absolute top-2 right-2 w-4 h-4 bg-primary rounded-full flex items-center justify-center">
                  <span className="text-primary-foreground text-xs">✓</span>
                </div>
              )}
            </button>
          ))}
        </div>
      </section>
    </div>
  );
};

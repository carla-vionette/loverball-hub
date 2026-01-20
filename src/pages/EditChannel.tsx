import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import BottomNav from "@/components/BottomNav";
import DesktopNav from "@/components/DesktopNav";
import MobileHeader from "@/components/MobileHeader";
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Loader2, ArrowLeft, Settings, Upload, ImageIcon } from 'lucide-react';

const SPORT_OPTIONS = [
  'Basketball',
  'Soccer',
  'Tennis',
  'Volleyball',
  'Track & Field',
  'Swimming',
  'Gymnastics',
  'Softball',
  'Golf',
  'Hockey',
  'Multi-Sport',
  'Sports Culture',
  'Fitness',
  'Other'
];

interface CreatorChannel {
  id: string;
  channel_name: string;
  slug: string;
  description: string | null;
  sport_focus: string | null;
  avatar_url: string | null;
  owner_user_id: string;
}

const EditChannel = () => {
  const { slug } = useParams<{ slug: string }>();
  const [channel, setChannel] = useState<CreatorChannel | null>(null);
  const [description, setDescription] = useState('');
  const [sportFocus, setSportFocus] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    if (slug) {
      fetchChannel();
    }
  }, [user, slug, navigate]);

  const fetchChannel = async () => {
    try {
      const { data, error } = await supabase
        .from('creator_channels')
        .select('*')
        .eq('slug', slug)
        .eq('owner_user_id', user!.id)
        .eq('status', 'approved')
        .single();

      if (error || !data) {
        toast({ title: 'Access denied', description: 'You cannot edit this channel', variant: 'destructive' });
        navigate('/hub');
        return;
      }

      setChannel(data);
      setDescription(data.description || '');
      setSportFocus(data.sport_focus || '');
      setAvatarUrl(data.avatar_url || '');
    } catch (error) {
      console.error('Error fetching channel:', error);
      navigate('/hub');
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !channel) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({ title: 'Invalid file', description: 'Please select an image file', variant: 'destructive' });
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast({ title: 'File too large', description: 'Please select an image under 2MB', variant: 'destructive' });
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `channel-${channel.id}-${Date.now()}.${fileExt}`;
      const filePath = `channels/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('profile-photos')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('profile-photos')
        .getPublicUrl(filePath);

      setAvatarUrl(publicUrl);
      toast({ title: 'Image uploaded', description: 'Your channel photo has been updated' });
    } catch (error: any) {
      console.error('Upload error:', error);
      toast({ title: 'Upload failed', description: error.message, variant: 'destructive' });
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!channel) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('creator_channels')
        .update({
          description: description.trim() || null,
          sport_focus: sportFocus || null,
          avatar_url: avatarUrl || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', channel.id)
        .eq('owner_user_id', user!.id);

      if (error) throw error;

      toast({ title: 'Channel updated!', description: 'Your changes have been saved.' });
      navigate(`/channel/${channel.slug}`);
    } catch (error: any) {
      console.error('Error updating channel:', error);
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!channel) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <MobileHeader />
      <DesktopNav />
      <BottomNav />

      <main className="md:ml-64 pt-16 md:pt-0 pb-20 md:pb-8">
        <div className="container mx-auto px-4 py-6 max-w-2xl">
          {/* Back button */}
          <Button variant="ghost" size="sm" asChild className="mb-4">
            <Link to={`/channel/${channel.slug}`}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Channel
            </Link>
          </Button>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                  <Settings className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <CardTitle>Edit Channel</CardTitle>
                  <CardDescription>
                    Update your channel's profile and settings
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Channel Name (read-only) */}
                <div className="space-y-2">
                  <Label>Channel Name</Label>
                  <Input value={channel.channel_name} disabled className="bg-muted" />
                  <p className="text-xs text-muted-foreground">
                    Channel name cannot be changed
                  </p>
                </div>

                {/* Avatar Upload */}
                <div className="space-y-2">
                  <Label>Channel Photo</Label>
                  <div className="flex items-center gap-4">
                    <Avatar className="w-20 h-20">
                      <AvatarImage src={avatarUrl} alt={channel.channel_name} />
                      <AvatarFallback className="bg-primary/20 text-primary text-xl">
                        {channel.channel_name.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <label className="cursor-pointer">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleAvatarUpload}
                          className="hidden"
                          disabled={uploading}
                        />
                        <Button type="button" variant="outline" disabled={uploading} asChild>
                          <span>
                            {uploading ? (
                              <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Uploading...
                              </>
                            ) : (
                              <>
                                <ImageIcon className="w-4 h-4 mr-2" />
                                Change Photo
                              </>
                            )}
                          </span>
                        </Button>
                      </label>
                      <p className="text-xs text-muted-foreground mt-1">
                        JPG, PNG or WebP. Max 2MB.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Sport/Category */}
                <div className="space-y-2">
                  <Label htmlFor="sportFocus">Category / Sport Focus</Label>
                  <Select value={sportFocus} onValueChange={setSportFocus}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      {SPORT_OPTIONS.map((sport) => (
                        <SelectItem key={sport} value={sport}>
                          {sport}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Description/Bio */}
                <div className="space-y-2">
                  <Label htmlFor="description">Bio / Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Tell viewers what your channel is about..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={4}
                    maxLength={500}
                  />
                  <p className="text-xs text-muted-foreground text-right">
                    {description.length}/500
                  </p>
                </div>

                <div className="flex gap-3">
                  <Button type="button" variant="outline" asChild className="flex-1">
                    <Link to={`/channel/${channel.slug}`}>Cancel</Link>
                  </Button>
                  <Button type="submit" className="flex-1" disabled={saving}>
                    {saving ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      'Save Changes'
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default EditChannel;

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, Loader2, Save, Trash2, Eye, FileText, Send } from 'lucide-react';
import { EventFormFields } from '@/components/admin/EventFormFields';
import { EventPreview } from '@/components/admin/EventPreview';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

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

const defaultFormData: EventFormData = {
  title: '',
  description: '',
  image_url: '',
  event_date: '',
  event_time: '',
  end_time: '',
  venue_name: '',
  city: 'Los Angeles',
  event_type: '',
  visibility: 'public',
  capacity: '',
  location_type: 'in_person',
  virtual_link: '',
  location_map_url: '',
  rsvp_deadline: '',
  allow_plus_ones: false,
  theme: 'default',
  status: 'draft',
};

const AdminEventEditor = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  const { toast } = useToast();
  
  const isNew = id === 'new';
  
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [formData, setFormData] = useState<EventFormData>(defaultFormData);
  const [showPreview, setShowPreview] = useState(true);

  useEffect(() => {
    if (!isAdmin) {
      navigate('/');
      return;
    }
    
    if (!isNew && id) {
      fetchEvent();
    }
  }, [isAdmin, id, navigate]);

  const fetchEvent = async () => {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      if (data) {
        setFormData({
          title: data.title || '',
          description: data.description || '',
          image_url: data.image_url || '',
          event_date: data.event_date || '',
          event_time: data.event_time || '',
          end_time: data.end_time || '',
          venue_name: data.venue_name || '',
          city: data.city || 'Los Angeles',
          event_type: data.event_type || '',
          visibility: data.visibility || 'public',
          capacity: data.capacity?.toString() || '',
          location_type: data.location_type || 'in_person',
          virtual_link: data.virtual_link || '',
          location_map_url: data.location_map_url || '',
          rsvp_deadline: data.rsvp_deadline 
            ? new Date(data.rsvp_deadline).toISOString().slice(0, 16) 
            : '',
          allow_plus_ones: data.allow_plus_ones || false,
          theme: data.theme || 'default',
          status: data.status || 'draft',
        });
      }
    } catch (error) {
      toast({
        title: 'Error loading event',
        variant: 'destructive',
      });
      navigate('/admin');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: keyof EventFormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
      .substring(0, 50) + '-' + Date.now().toString(36);
  };

  const saveEvent = async (publish: boolean = false) => {
    if (!formData.title || !formData.event_date) {
      toast({
        title: 'Missing required fields',
        description: 'Title and date are required.',
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);
    try {
      const eventPayload = {
        title: formData.title,
        description: formData.description || null,
        image_url: formData.image_url || null,
        event_date: formData.event_date,
        event_time: formData.event_time || null,
        end_time: formData.end_time || null,
        venue_name: formData.venue_name || null,
        city: formData.city || null,
        event_type: formData.event_type || null,
        visibility: formData.visibility,
        capacity: formData.capacity ? parseInt(formData.capacity) : null,
        location_type: formData.location_type || 'in_person',
        virtual_link: formData.virtual_link || null,
        location_map_url: formData.location_map_url || null,
        rsvp_deadline: formData.rsvp_deadline ? new Date(formData.rsvp_deadline).toISOString() : null,
        allow_plus_ones: formData.allow_plus_ones,
        theme: formData.theme || 'default',
        status: publish ? 'published' : formData.status,
        host_user_id: user?.id,
      };

      if (isNew) {
        const { data, error } = await supabase
          .from('events')
          .insert({
            ...eventPayload,
            slug: generateSlug(formData.title),
          })
          .select()
          .single();

        if (error) throw error;

        toast({
          title: publish ? 'Event published!' : 'Event saved as draft',
          description: publish ? 'Your event is now live.' : 'You can continue editing later.',
        });

        navigate(`/admin/events/${data.id}/edit`);
      } else {
        const { error } = await supabase
          .from('events')
          .update(eventPayload)
          .eq('id', id);

        if (error) throw error;

        toast({
          title: publish ? 'Event published!' : 'Changes saved',
        });
        
        if (publish) {
          setFormData(prev => ({ ...prev, status: 'published' }));
        }
      }
    } catch (error: any) {
      toast({
        title: 'Error saving event',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const deleteEvent = async () => {
    if (!id || isNew) return;

    setDeleting(true);
    try {
      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({ title: 'Event deleted' });
      navigate('/admin');
    } catch (error: any) {
      console.error('Error deleting event:', error);
      toast({
        title: 'Error deleting event',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => navigate('/admin')}
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-lg font-semibold">
                {isNew ? 'Create Event' : 'Edit Event'}
              </h1>
              {formData.status && (
                <p className="text-xs text-muted-foreground capitalize">
                  Status: {formData.status}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowPreview(!showPreview)}
              className="hidden md:flex"
            >
              <Eye className="w-4 h-4 mr-2" />
              {showPreview ? 'Hide Preview' : 'Show Preview'}
            </Button>

            {!isNew && id && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(`/event/${id}`, '_blank')}
              >
                <Eye className="w-4 h-4 mr-2" />
                View
              </Button>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={() => saveEvent(false)}
              disabled={saving}
            >
              {saving ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <FileText className="w-4 h-4 mr-2" />
              )}
              Save Draft
            </Button>

            <Button
              size="sm"
              onClick={() => saveEvent(true)}
              disabled={saving}
            >
              {saving ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Send className="w-4 h-4 mr-2" />
              )}
              Publish
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto p-4 md:p-6">
        <div className={`grid gap-6 ${showPreview ? 'md:grid-cols-2' : 'md:grid-cols-1 max-w-2xl mx-auto'}`}>
          {/* Form */}
          <Card>
            <CardContent className="p-6">
              <EventFormFields 
                formData={formData}
                onChange={handleChange}
              />

              {/* Delete Button */}
              {!isNew && (
                <div className="mt-8 pt-6 border-t border-border">
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button 
                        variant="destructive" 
                        className="w-full"
                        disabled={deleting}
                      >
                        {deleting ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4 mr-2" />
                        )}
                        Delete Event
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete this event?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This action cannot be undone. This will permanently delete the event
                          and all associated RSVPs.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={deleteEvent}>
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Live Preview */}
          {showPreview && (
            <div className="hidden md:block sticky top-24 h-[calc(100vh-8rem)]">
              <EventPreview event={formData} />
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default AdminEventEditor;

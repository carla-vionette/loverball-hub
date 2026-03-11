import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Plus, Trash2, GripVertical, Save, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { fetchEventById } from '@/services/eventService';
import { saveEventLayout } from '@/services/eventService';
import type { EventSection, EventSectionType, EventLayout } from '@/types';

const SECTION_TYPES: { value: EventSectionType; label: string }[] = [
  { value: 'title', label: 'Title' },
  { value: 'description', label: 'Description' },
  { value: 'speakers', label: 'Speakers' },
  { value: 'schedule', label: 'Schedule' },
  { value: 'gallery', label: 'Gallery' },
  { value: 'video', label: 'Video' },
  { value: 'location', label: 'Location' },
  { value: 'registration', label: 'Registration' },
];

const defaultSectionData: Record<EventSectionType, Record<string, unknown>> = {
  title: { text: '' },
  description: { text: '' },
  speakers: { items: [] },
  schedule: { items: [] },
  gallery: { images: [] },
  video: { url: '' },
  location: { address: '', mapUrl: '' },
  registration: { buttonText: 'Register Now', url: '' },
};

const EventBuilder = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [sections, setSections] = useState<EventSection[]>([]);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(!!id);
  const [eventTitle, setEventTitle] = useState('');

  useEffect(() => {
    if (id) {
      fetchEventById(id).then((event) => {
        if (event) {
          setEventTitle(event.title);
          if (event.layout_json?.sections) {
            setSections(event.layout_json.sections);
          }
        }
        setLoading(false);
      });
    }
  }, [id]);

  const addSection = (type: EventSectionType) => {
    const newSection: EventSection = {
      id: crypto.randomUUID(),
      type,
      data: { ...defaultSectionData[type] },
    };
    setSections([...sections, newSection]);
  };

  const removeSection = (sectionId: string) => {
    setSections(sections.filter(s => s.id !== sectionId));
  };

  const moveSection = (index: number, direction: 'up' | 'down') => {
    const newIdx = direction === 'up' ? index - 1 : index + 1;
    if (newIdx < 0 || newIdx >= sections.length) return;
    const newSections = [...sections];
    [newSections[index], newSections[newIdx]] = [newSections[newIdx], newSections[index]];
    setSections(newSections);
  };

  const updateSectionData = (sectionId: string, data: Record<string, unknown>) => {
    setSections(sections.map(s => s.id === sectionId ? { ...s, data } : s));
  };

  const handleSave = async () => {
    if (!id) return;
    setSaving(true);
    try {
      const layout: EventLayout = { sections };
      await saveEventLayout(id, layout);
      toast({ title: 'Event layout saved' });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Save failed';
      toast({ title: 'Error', description: message, variant: 'destructive' });
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

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 bg-background border-b border-border">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="font-display text-lg font-bold uppercase">
              Event Builder{eventTitle ? ` — ${eventTitle}` : ''}
            </h1>
          </div>
          <Button onClick={handleSave} disabled={saving || !id}>
            {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
            Save Layout
          </Button>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-3xl">
        {/* Add section */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-sm">Add Section</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {SECTION_TYPES.map(({ value, label }) => (
                <Button key={value} variant="outline" size="sm" onClick={() => addSection(value)}>
                  <Plus className="w-3 h-3 mr-1" /> {label}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Sections list */}
        {sections.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <p>No sections yet. Add sections above to build your event page.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {sections.map((section, index) => (
              <Card key={section.id}>
                <CardHeader className="flex flex-row items-center justify-between py-3">
                  <div className="flex items-center gap-2">
                    <GripVertical className="w-4 h-4 text-muted-foreground" />
                    <CardTitle className="text-sm capitalize">{section.type}</CardTitle>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="sm" onClick={() => moveSection(index, 'up')} disabled={index === 0}>
                      ↑
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => moveSection(index, 'down')} disabled={index === sections.length - 1}>
                      ↓
                    </Button>
                    <Button variant="ghost" size="sm" className="text-destructive" onClick={() => removeSection(section.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <SectionEditor section={section} onChange={(data) => updateSectionData(section.id, data)} />
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// Section editor sub-component
function SectionEditor({ section, onChange }: { section: EventSection; onChange: (data: Record<string, unknown>) => void }) {
  const data = section.data;

  switch (section.type) {
    case 'title':
      return (
        <div>
          <Label>Title Text</Label>
          <Input
            value={(data.text as string) || ''}
            onChange={(e) => onChange({ ...data, text: e.target.value })}
            placeholder="Event title"
          />
        </div>
      );
    case 'description':
      return (
        <div>
          <Label>Description</Label>
          <Textarea
            value={(data.text as string) || ''}
            onChange={(e) => onChange({ ...data, text: e.target.value })}
            placeholder="Event description"
            rows={4}
          />
        </div>
      );
    case 'speakers':
      return (
        <div>
          <Label>Speakers (one per line: Name - Title)</Label>
          <Textarea
            value={((data.items as string[]) || []).join('\n')}
            onChange={(e) => onChange({ ...data, items: e.target.value.split('\n').filter(Boolean) })}
            placeholder="Jane Doe - CEO&#10;John Smith - Speaker"
            rows={4}
          />
        </div>
      );
    case 'schedule':
      return (
        <div>
          <Label>Schedule (one per line: Time - Activity)</Label>
          <Textarea
            value={((data.items as string[]) || []).join('\n')}
            onChange={(e) => onChange({ ...data, items: e.target.value.split('\n').filter(Boolean) })}
            placeholder="6:00 PM - Doors Open&#10;6:30 PM - Welcome&#10;7:00 PM - Panel"
            rows={4}
          />
        </div>
      );
    case 'gallery':
      return (
        <div>
          <Label>Image URLs (one per line)</Label>
          <Textarea
            value={((data.images as string[]) || []).join('\n')}
            onChange={(e) => onChange({ ...data, images: e.target.value.split('\n').filter(Boolean) })}
            placeholder="https://example.com/image1.jpg"
            rows={3}
          />
        </div>
      );
    case 'video':
      return (
        <div>
          <Label>Video URL</Label>
          <Input
            value={(data.url as string) || ''}
            onChange={(e) => onChange({ ...data, url: e.target.value })}
            placeholder="https://..."
          />
        </div>
      );
    case 'location':
      return (
        <div className="space-y-3">
          <div>
            <Label>Address</Label>
            <Input
              value={(data.address as string) || ''}
              onChange={(e) => onChange({ ...data, address: e.target.value })}
              placeholder="123 Main St, Los Angeles, CA"
            />
          </div>
          <div>
            <Label>Google Maps Embed URL</Label>
            <Input
              value={(data.mapUrl as string) || ''}
              onChange={(e) => onChange({ ...data, mapUrl: e.target.value })}
              placeholder="https://www.google.com/maps/embed?..."
            />
          </div>
        </div>
      );
    case 'registration':
      return (
        <div className="space-y-3">
          <div>
            <Label>Button Text</Label>
            <Input
              value={(data.buttonText as string) || 'Register Now'}
              onChange={(e) => onChange({ ...data, buttonText: e.target.value })}
            />
          </div>
          <div>
            <Label>Registration URL</Label>
            <Input
              value={(data.url as string) || ''}
              onChange={(e) => onChange({ ...data, url: e.target.value })}
              placeholder="https://..."
            />
          </div>
        </div>
      );
    default:
      return <p className="text-muted-foreground text-sm">Unknown section type</p>;
  }
}

export default EventBuilder;

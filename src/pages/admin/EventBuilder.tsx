import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Plus, Trash2, GripVertical, Save, Eye } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { saveEventLayout, fetchEventById } from '@/services/eventService';
import type { EventSection, EventSectionType, EventLayout } from '@/types';

const SECTION_TYPES: { value: EventSectionType; label: string }[] = [
  { value: 'title', label: 'Title' },
  { value: 'description', label: 'Description' },
  { value: 'speakers', label: 'Speakers' },
  { value: 'schedule', label: 'Schedule' },
  { value: 'gallery', label: 'Image Gallery' },
  { value: 'video', label: 'Video' },
  { value: 'location', label: 'Location' },
  { value: 'registration', label: 'Registration' },
];

const DEFAULT_DATA: Record<EventSectionType, Record<string, unknown>> = {
  title: { text: '' },
  description: { text: '' },
  speakers: { speakers: [{ name: '', role: '', image: '' }] },
  schedule: { items: [{ time: '', title: '', description: '' }] },
  gallery: { images: [''] },
  video: { url: '' },
  location: { address: '', mapUrl: '' },
  registration: { url: '', buttonText: 'Register Now' },
};

const EventBuilder = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const eventId = searchParams.get('eventId');
  const [sections, setSections] = useState<EventSection[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!eventId) return;
    fetchEventById(eventId).then(event => {
      if (event?.layout_json?.sections) {
        setSections(event.layout_json.sections);
      }
    }).catch(console.error);
  }, [eventId]);

  const addSection = (type: EventSectionType) => {
    const newSection: EventSection = {
      id: crypto.randomUUID(),
      type,
      data: { ...DEFAULT_DATA[type] },
      order: sections.length,
    };
    setSections([...sections, newSection]);
  };

  const removeSection = (id: string) => {
    setSections(sections.filter(s => s.id !== id));
  };

  const moveSection = (idx: number, direction: 'up' | 'down') => {
    const newIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (newIdx < 0 || newIdx >= sections.length) return;
    const copy = [...sections];
    [copy[idx], copy[newIdx]] = [copy[newIdx], copy[idx]];
    copy.forEach((s, i) => { s.order = i; });
    setSections(copy);
  };

  const updateSectionData = (id: string, data: Record<string, unknown>) => {
    setSections(sections.map(s => s.id === id ? { ...s, data } : s));
  };

  const handleSave = async () => {
    if (!eventId) {
      toast({ title: 'No event selected', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      const layout: EventLayout = { sections };
      await saveEventLayout(eventId, layout);
      toast({ title: 'Layout saved' });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Save failed';
      toast({ title: 'Error', description: message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border bg-card px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate('/admin')}>
            <ArrowLeft className="w-4 h-4 mr-1" /> Back
          </Button>
          <h1 className="font-display text-lg font-bold uppercase">Event Builder</h1>
        </div>
        <div className="flex gap-2">
          {eventId && (
            <Button variant="outline" size="sm" onClick={() => navigate(`/event/${eventId}`)}>
              <Eye className="w-4 h-4 mr-1" /> Preview
            </Button>
          )}
          <Button size="sm" onClick={handleSave} disabled={saving || !eventId}>
            <Save className="w-4 h-4 mr-1" /> {saving ? 'Saving...' : 'Save Layout'}
          </Button>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8">
        {!eventId && (
          <div className="text-center py-12 text-muted-foreground">
            <p>No event selected. Go to Events tab and edit an event to use the builder.</p>
            <Button variant="outline" className="mt-4" onClick={() => navigate('/admin')}>
              Go to Admin
            </Button>
          </div>
        )}

        {/* Section list */}
        <div className="space-y-4">
          {sections.map((section, idx) => (
            <Card key={section.id} className="relative">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <GripVertical className="w-4 h-4 text-muted-foreground" />
                    <CardTitle className="text-sm font-semibold capitalize">{section.type}</CardTitle>
                  </div>
                  <div className="flex gap-1">
                    <Button size="sm" variant="ghost" onClick={() => moveSection(idx, 'up')} disabled={idx === 0}>
                      ↑
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => moveSection(idx, 'down')} disabled={idx === sections.length - 1}>
                      ↓
                    </Button>
                    <Button size="sm" variant="ghost" className="text-destructive" onClick={() => removeSection(section.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <SectionEditor section={section} onChange={(data) => updateSectionData(section.id, data)} />
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Add section */}
        {eventId && (
          <div className="mt-6">
            <Label className="mb-2 block text-sm font-medium">Add Section</Label>
            <div className="flex flex-wrap gap-2">
              {SECTION_TYPES.map(type => (
                <Button key={type.value} size="sm" variant="outline" onClick={() => addSection(type.value)}>
                  <Plus className="w-3 h-3 mr-1" /> {type.label}
                </Button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Section editor component
const SectionEditor = ({ section, onChange }: { section: EventSection; onChange: (data: Record<string, unknown>) => void }) => {
  const { type, data } = section;

  switch (type) {
    case 'title':
      return (
        <Input
          value={(data.text as string) || ''}
          onChange={(e) => onChange({ ...data, text: e.target.value })}
          placeholder="Event Title"
        />
      );
    case 'description':
      return (
        <Textarea
          value={(data.text as string) || ''}
          onChange={(e) => onChange({ ...data, text: e.target.value })}
          placeholder="Event description..."
          rows={4}
        />
      );
    case 'video':
      return (
        <Input
          value={(data.url as string) || ''}
          onChange={(e) => onChange({ ...data, url: e.target.value })}
          placeholder="Video URL"
        />
      );
    case 'location':
      return (
        <div className="space-y-2">
          <Input
            value={(data.address as string) || ''}
            onChange={(e) => onChange({ ...data, address: e.target.value })}
            placeholder="Address"
          />
          <Input
            value={(data.mapUrl as string) || ''}
            onChange={(e) => onChange({ ...data, mapUrl: e.target.value })}
            placeholder="Google Maps embed URL (optional)"
          />
        </div>
      );
    case 'registration':
      return (
        <div className="space-y-2">
          <Input
            value={(data.url as string) || ''}
            onChange={(e) => onChange({ ...data, url: e.target.value })}
            placeholder="Registration URL"
          />
          <Input
            value={(data.buttonText as string) || ''}
            onChange={(e) => onChange({ ...data, buttonText: e.target.value })}
            placeholder="Button text"
          />
        </div>
      );
    case 'gallery':
      return (
        <div className="space-y-2">
          {((data.images as string[]) || ['']).map((img, i) => (
            <Input
              key={i}
              value={img}
              onChange={(e) => {
                const images = [...((data.images as string[]) || [''])];
                images[i] = e.target.value;
                onChange({ ...data, images });
              }}
              placeholder={`Image URL ${i + 1}`}
            />
          ))}
          <Button
            size="sm"
            variant="outline"
            onClick={() => onChange({ ...data, images: [...((data.images as string[]) || []), ''] })}
          >
            <Plus className="w-3 h-3 mr-1" /> Add Image
          </Button>
        </div>
      );
    case 'speakers':
      return (
        <div className="space-y-3">
          {((data.speakers as Array<{ name: string; role: string; image: string }>) || []).map((speaker, i) => (
            <div key={i} className="grid grid-cols-3 gap-2">
              <Input
                value={speaker.name}
                onChange={(e) => {
                  const speakers = [...((data.speakers as Array<{ name: string; role: string; image: string }>) || [])];
                  speakers[i] = { ...speakers[i], name: e.target.value };
                  onChange({ ...data, speakers });
                }}
                placeholder="Name"
              />
              <Input
                value={speaker.role}
                onChange={(e) => {
                  const speakers = [...((data.speakers as Array<{ name: string; role: string; image: string }>) || [])];
                  speakers[i] = { ...speakers[i], role: e.target.value };
                  onChange({ ...data, speakers });
                }}
                placeholder="Role"
              />
              <Input
                value={speaker.image}
                onChange={(e) => {
                  const speakers = [...((data.speakers as Array<{ name: string; role: string; image: string }>) || [])];
                  speakers[i] = { ...speakers[i], image: e.target.value };
                  onChange({ ...data, speakers });
                }}
                placeholder="Image URL"
              />
            </div>
          ))}
          <Button
            size="sm"
            variant="outline"
            onClick={() => onChange({ ...data, speakers: [...((data.speakers as Array<Record<string, string>>) || []), { name: '', role: '', image: '' }] })}
          >
            <Plus className="w-3 h-3 mr-1" /> Add Speaker
          </Button>
        </div>
      );
    case 'schedule':
      return (
        <div className="space-y-3">
          {((data.items as Array<{ time: string; title: string; description: string }>) || []).map((item, i) => (
            <div key={i} className="grid grid-cols-3 gap-2">
              <Input
                value={item.time}
                onChange={(e) => {
                  const items = [...((data.items as Array<{ time: string; title: string; description: string }>) || [])];
                  items[i] = { ...items[i], time: e.target.value };
                  onChange({ ...data, items });
                }}
                placeholder="Time"
              />
              <Input
                value={item.title}
                onChange={(e) => {
                  const items = [...((data.items as Array<{ time: string; title: string; description: string }>) || [])];
                  items[i] = { ...items[i], title: e.target.value };
                  onChange({ ...data, items });
                }}
                placeholder="Title"
              />
              <Input
                value={item.description}
                onChange={(e) => {
                  const items = [...((data.items as Array<{ time: string; title: string; description: string }>) || [])];
                  items[i] = { ...items[i], description: e.target.value };
                  onChange({ ...data, items });
                }}
                placeholder="Description"
              />
            </div>
          ))}
          <Button
            size="sm"
            variant="outline"
            onClick={() => onChange({ ...data, items: [...((data.items as Array<Record<string, string>>) || []), { time: '', title: '', description: '' }] })}
          >
            <Plus className="w-3 h-3 mr-1" /> Add Item
          </Button>
        </div>
      );
    default:
      return <p className="text-muted-foreground text-sm">Unknown section type</p>;
  }
};

export default EventBuilder;

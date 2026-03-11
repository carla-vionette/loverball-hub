import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { MapPin, ExternalLink, Play } from 'lucide-react';
import type { EventLayout, EventSection } from '@/types';

interface EventRendererProps {
  layout: EventLayout;
}

const EventRenderer = ({ layout }: EventRendererProps) => {
  if (!layout?.sections || layout.sections.length === 0) return null;

  const sorted = [...layout.sections].sort((a, b) => a.order - b.order);

  return (
    <div className="space-y-8">
      {sorted.map((section) => (
        <RenderSection key={section.id} section={section} />
      ))}
    </div>
  );
};

const RenderSection = ({ section }: { section: EventSection }) => {
  const { type, data } = section;

  switch (type) {
    case 'title':
      return (
        <h1 className="font-display text-3xl md:text-4xl font-black uppercase tracking-tight">
          {(data.text as string) || ''}
        </h1>
      );

    case 'description':
      return (
        <div className="prose prose-neutral max-w-none">
          <p className="text-muted-foreground leading-relaxed whitespace-pre-line">
            {(data.text as string) || ''}
          </p>
        </div>
      );

    case 'speakers':
      return (
        <section>
          <h2 className="font-display text-xl font-bold uppercase mb-4">Speakers</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {((data.speakers as Array<{ name: string; role: string; image: string }>) || []).map((speaker, i) => (
              <Card key={i} className="overflow-hidden">
                {speaker.image && (
                  <div className="aspect-square bg-secondary">
                    <img src={speaker.image} alt={speaker.name} className="w-full h-full object-cover" loading="lazy" />
                  </div>
                )}
                <CardContent className="p-4">
                  <p className="font-semibold">{speaker.name}</p>
                  {speaker.role && <p className="text-sm text-muted-foreground">{speaker.role}</p>}
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      );

    case 'schedule':
      return (
        <section>
          <h2 className="font-display text-xl font-bold uppercase mb-4">Schedule</h2>
          <div className="space-y-3">
            {((data.items as Array<{ time: string; title: string; description: string }>) || []).map((item, i) => (
              <div key={i} className="flex gap-4 p-4 bg-card border border-border rounded-lg">
                <div className="text-primary font-semibold text-sm whitespace-nowrap min-w-[80px]">
                  {item.time}
                </div>
                <div>
                  <p className="font-semibold">{item.title}</p>
                  {item.description && (
                    <p className="text-sm text-muted-foreground mt-1">{item.description}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      );

    case 'gallery':
      return (
        <section>
          <h2 className="font-display text-xl font-bold uppercase mb-4">Gallery</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {((data.images as string[]) || []).filter(Boolean).map((img, i) => (
              <div key={i} className="aspect-square rounded-lg overflow-hidden bg-secondary">
                <img src={img} alt={`Gallery ${i + 1}`} className="w-full h-full object-cover" loading="lazy" />
              </div>
            ))}
          </div>
        </section>
      );

    case 'video':
      return (
        <section>
          <h2 className="font-display text-xl font-bold uppercase mb-4">Video</h2>
          <div className="aspect-video rounded-xl overflow-hidden bg-black">
            <video src={(data.url as string) || ''} controls className="w-full h-full" preload="metadata" />
          </div>
        </section>
      );

    case 'location':
      return (
        <section>
          <h2 className="font-display text-xl font-bold uppercase mb-4">Location</h2>
          <div className="flex items-start gap-3 p-4 bg-card border border-border rounded-lg">
            <MapPin className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">{(data.address as string) || ''}</p>
              {(data.mapUrl as string) && (
                <a
                  href={data.mapUrl as string}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-primary hover:underline flex items-center gap-1 mt-1"
                >
                  View on map <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
          </div>
        </section>
      );

    case 'registration':
      return (
        <section className="text-center py-6">
          <a href={(data.url as string) || '#'} target="_blank" rel="noopener noreferrer">
            <Button size="lg" className="px-8">
              {(data.buttonText as string) || 'Register Now'}
            </Button>
          </a>
        </section>
      );

    default:
      return null;
  }
};

export default EventRenderer;

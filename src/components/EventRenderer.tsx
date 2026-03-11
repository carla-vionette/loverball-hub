import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MapPin, ExternalLink } from 'lucide-react';
import type { EventLayout, EventSection } from '@/types';

interface EventRendererProps {
  layout: EventLayout;
}

const EventRenderer = ({ layout }: EventRendererProps) => {
  return (
    <div className="space-y-8">
      {layout.sections.map((section) => (
        <SectionBlock key={section.id} section={section} />
      ))}
    </div>
  );
};

function SectionBlock({ section }: { section: EventSection }) {
  const data = section.data;

  switch (section.type) {
    case 'title':
      return (
        <h1 className="font-display text-3xl md:text-4xl font-black uppercase tracking-tight">
          {(data.text as string) || ''}
        </h1>
      );

    case 'description':
      return (
        <div className="prose prose-sm max-w-none">
          <p className="text-muted-foreground whitespace-pre-wrap leading-relaxed">
            {(data.text as string) || ''}
          </p>
        </div>
      );

    case 'speakers': {
      const items = (data.items as string[]) || [];
      if (items.length === 0) return null;
      return (
        <div>
          <h2 className="font-display text-xl font-bold uppercase mb-4">Speakers</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {items.map((item, i) => {
              const [name, ...rest] = item.split(' - ');
              return (
                <Card key={i}>
                  <CardContent className="p-4">
                    <p className="font-semibold">{name?.trim()}</p>
                    {rest.length > 0 && (
                      <p className="text-sm text-muted-foreground">{rest.join(' - ').trim()}</p>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      );
    }

    case 'schedule': {
      const items = (data.items as string[]) || [];
      if (items.length === 0) return null;
      return (
        <div>
          <h2 className="font-display text-xl font-bold uppercase mb-4">Schedule</h2>
          <div className="space-y-2">
            {items.map((item, i) => {
              const [time, ...rest] = item.split(' - ');
              return (
                <div key={i} className="flex gap-4 items-start p-3 rounded-lg bg-secondary/50">
                  <span className="font-bold text-sm text-primary whitespace-nowrap min-w-[80px]">
                    {time?.trim()}
                  </span>
                  <span className="text-sm">{rest.join(' - ').trim()}</span>
                </div>
              );
            })}
          </div>
        </div>
      );
    }

    case 'gallery': {
      const images = (data.images as string[]) || [];
      if (images.length === 0) return null;
      return (
        <div>
          <h2 className="font-display text-xl font-bold uppercase mb-4">Gallery</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {images.map((img, i) => (
              <div key={i} className="aspect-square rounded-lg overflow-hidden bg-secondary">
                <img src={img} alt="" className="w-full h-full object-cover" loading="lazy" />
              </div>
            ))}
          </div>
        </div>
      );
    }

    case 'video': {
      const url = (data.url as string) || '';
      if (!url) return null;
      return (
        <div>
          <h2 className="font-display text-xl font-bold uppercase mb-4">Video</h2>
          <div className="aspect-video bg-black rounded-xl overflow-hidden">
            <video src={url} controls className="w-full h-full" preload="metadata" />
          </div>
        </div>
      );
    }

    case 'location': {
      const address = (data.address as string) || '';
      const mapUrl = (data.mapUrl as string) || '';
      if (!address && !mapUrl) return null;
      return (
        <div>
          <h2 className="font-display text-xl font-bold uppercase mb-4">Location</h2>
          {address && (
            <div className="flex items-center gap-2 mb-3 text-muted-foreground">
              <MapPin className="w-4 h-4" />
              <span>{address}</span>
            </div>
          )}
          {mapUrl && (
            <div className="rounded-lg overflow-hidden border">
              <iframe
                src={mapUrl}
                width="100%"
                height="300"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
              />
            </div>
          )}
        </div>
      );
    }

    case 'registration': {
      const buttonText = (data.buttonText as string) || 'Register Now';
      const url = (data.url as string) || '';
      return (
        <div className="text-center py-6">
          {url ? (
            <a href={url} target="_blank" rel="noopener noreferrer">
              <Button size="lg" className="px-8">
                {buttonText}
                <ExternalLink className="w-4 h-4 ml-2" />
              </Button>
            </a>
          ) : (
            <Button size="lg" className="px-8">{buttonText}</Button>
          )}
        </div>
      );
    }

    default:
      return null;
  }
}

export default EventRenderer;

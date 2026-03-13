import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ExternalLink } from 'lucide-react';

interface SponsorCardProps {
  index: number;
}

const SPONSORS = [
  {
    brand: 'Nike',
    tagline: 'Just Do It. Game day gear for every fan.',
    color: 'from-orange-500/20 to-red-500/20',
    accent: 'bg-orange-500',
    cta: 'Shop Now',
    url: 'https://nike.com',
  },
  {
    brand: 'Gatorade',
    tagline: 'Fuel your game day. Hydrate like a pro.',
    color: 'from-green-500/20 to-emerald-500/20',
    accent: 'bg-green-500',
    cta: 'Learn More',
    url: 'https://gatorade.com',
  },
  {
    brand: 'WNBA',
    tagline: 'Every basket counts. Support women\'s hoops.',
    color: 'from-orange-500/20 to-amber-500/20',
    accent: 'bg-orange-500',
    cta: 'Get Tickets',
    url: 'https://wnba.com',
  },
];

const SponsorCard = ({ index }: SponsorCardProps) => {
  const sponsor = SPONSORS[index % SPONSORS.length];

  return (
    <Card className={`overflow-hidden border-0 bg-gradient-to-br ${sponsor.color}`}>
      <div className={`h-1 w-full ${sponsor.accent}`} />
      <CardContent className="p-4">
        <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold mb-2">
          Presented by {sponsor.brand}
        </p>
        <p className="text-sm font-medium text-foreground mb-3">{sponsor.tagline}</p>
        <Button
          size="sm"
          variant="outline"
          className="rounded-full text-xs h-8"
          onClick={(e) => {
            e.stopPropagation();
            window.open(sponsor.url, '_blank');
          }}
        >
          {sponsor.cta}
          <ExternalLink className="w-3 h-3 ml-1" />
        </Button>
      </CardContent>
    </Card>
  );
};

export default SponsorCard;

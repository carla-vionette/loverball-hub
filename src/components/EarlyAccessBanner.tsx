import { useState, useEffect } from 'react';
import { Zap, Gem } from 'lucide-react';

interface EarlyAccessBannerProps {
  userTier: string | null;
  eventDate: string;
  eventTime?: string | null;
  isExclusive?: boolean;
}

const EarlyAccessBanner = ({ userTier, eventDate, eventTime, isExclusive }: EarlyAccessBannerProps) => {
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    if (userTier !== 'community' && userTier !== 'allaccess') return;

    const eventDateTime = new Date(`${eventDate}T${eventTime || '00:00'}`);
    // Early RSVP closes 24h before public open (48h before event)
    const earlyDeadline = new Date(eventDateTime.getTime() - 24 * 60 * 60 * 1000);

    const update = () => {
      const now = new Date();
      const diff = earlyDeadline.getTime() - now.getTime();
      if (diff <= 0) {
        setTimeLeft('');
        return;
      }
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      setTimeLeft(`${hours}h ${mins}m`);
    };

    update();
    const interval = setInterval(update, 60000);
    return () => clearInterval(interval);
  }, [userTier, eventDate, eventTime]);

  if (userTier === 'allaccess' && isExclusive) {
    return (
      <div className="rounded-xl bg-gradient-to-r from-violet-500/20 to-fuchsia-500/20 border border-violet-500/30 p-4 mb-6">
        <div className="flex items-center gap-2">
          <span className="text-lg">💎</span>
          <div>
            <p className="text-sm font-bold text-foreground">All Access: Exclusive event — You're in!</p>
            <p className="text-xs text-muted-foreground">This event is only available to All Access members</p>
          </div>
        </div>
      </div>
    );
  }

  if ((userTier === 'community' || userTier === 'allaccess') && timeLeft) {
    return (
      <div className="rounded-xl bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30 p-4 mb-6">
        <div className="flex items-center gap-2">
          <span className="text-lg">⚡</span>
          <div>
            <p className="text-sm font-bold text-foreground">Members: Early RSVP closes in {timeLeft}</p>
            <p className="text-xs text-muted-foreground">You get 24hr priority access before public RSVPs open</p>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default EarlyAccessBanner;

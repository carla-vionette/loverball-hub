import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export default function BringFriendCard({ slug, userId }: { slug: string; userId: string }) {
  const [copied, setCopied] = useState(false);
  const link = `${window.location.origin}/e/${slug}?ref=${userId}`;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { toast.error('Could not copy'); }
  };

  const share = async () => {
    if (navigator.share) {
      try { await navigator.share({ title: 'Loverball', url: link }); } catch {}
    } else { copy(); }
  };

  return (
    <div className="border border-border bg-card rounded-md p-5">
      <h3 className="font-serif text-xl text-foreground">Bring a friend</h3>
      <p className="text-sm text-muted-foreground mt-1">
        Every Loverball event gets better with you in the room. Share this with one woman in your life.
      </p>
      <div className="mt-4 flex flex-col sm:flex-row gap-2">
        <input
          readOnly value={link}
          className="flex-1 h-10 px-3 rounded-md bg-background border border-input text-sm text-muted-foreground truncate"
          onFocus={e => e.currentTarget.select()}
        />
        <Button onClick={copy} className="h-10 bg-primary text-primary-foreground hover:bg-primary/90 rounded-md">
          {copied ? 'Copied ✓' : 'Copy link'}
        </Button>
        {typeof navigator !== 'undefined' && 'share' in navigator && (
          <Button onClick={share} variant="outline" className="h-10 rounded-md">Share…</Button>
        )}
      </div>
    </div>
  );
}

import { useState } from "react";
import { ExternalLink, MapPin, Share2, Star, Tv, Users, Check, Bookmark } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { WatchSpot, FriendCheckin } from "./types";

const SOURCE_LABEL: Record<WatchSpot["source"], { label: string; tone: string }> = {
  official: { label: "Official", tone: "bg-primary text-primary-foreground" },
  partner: { label: "Partner", tone: "bg-accent text-accent-foreground" },
  curated: { label: "Curated", tone: "bg-secondary text-secondary-foreground" },
  community: { label: "Community", tone: "bg-muted text-foreground" },
  places: { label: "Nearby", tone: "bg-muted text-muted-foreground" },
  fallback: { label: "Suggested", tone: "bg-muted text-muted-foreground" },
};

const VIBE_LABELS: Record<string, string> = {
  "womens-sports-crowd": "Women's sports crowd",
  womens_sports_crowd: "Women's sports crowd",
  "big-screens": "Big screens",
  big_screens: "Big screens",
  "sound-on": "Sound on",
  sound_on: "Sound on",
  "solo-friendly": "Solo-friendly",
  solo_friendly: "Solo-friendly",
  "good-for-groups": "Good for groups",
  good_for_groups: "Good for groups",
  "popular-tonight": "Popular tonight",
};

interface Props {
  spot: WatchSpot;
  isPicked: boolean;
  friends: FriendCheckin[];
  onCheckIn: (spot: WatchSpot) => void | Promise<void>;
  onOpenChat?: () => void;
  shareUrl?: string;
}

export default function WatchLocationCard({ spot, isPicked, friends, onCheckIn, onOpenChat, shareUrl }: Props) {
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);

  const matchedFriends = friends.filter((f) => {
    if (spot.watchLocationId && f.watch_location_id === spot.watchLocationId) return true;
    if (spot.placeExternalId && f.place_external_id === spot.placeExternalId) return true;
    if (f.place_name && f.place_name.toLowerCase() === spot.name.toLowerCase()) return true;
    return false;
  });

  const handleCheckIn = async () => {
    setBusy(true);
    try {
      await onCheckIn(spot);
      toast.success(`🍻 You're watching at ${spot.name}`, {
        description: onOpenChat ? "Tap to open the game chat" : undefined,
        action: onOpenChat ? { label: "Open chat", onClick: onOpenChat } : undefined,
      });
    } catch (e: any) {
      if (e?.message === "auth_required") toast.error("Sign in to check in");
      else toast.error("Couldn't save your check-in");
    } finally {
      setBusy(false);
    }
  };

  const handleShare = async () => {
    const url = shareUrl || spot.mapsUrl;
    const text = `Watching at ${spot.name}${spot.city ? ` in ${spot.city}` : ""} on Loverball`;
    try {
      if (navigator.share) await navigator.share({ title: spot.name, text, url });
      else {
        await navigator.clipboard.writeText(`${text} — ${url}`);
        toast.success("Link copied");
      }
    } catch {}
  };

  const src = SOURCE_LABEL[spot.source];

  return (
    <article
      className={cn(
        "rounded-2xl border p-4 transition-colors",
        isPicked ? "border-primary bg-primary/5" : "border-border/40 bg-card hover:border-primary/30",
      )}
    >
      <header className="flex items-start gap-2 mb-2">
        <Badge className={cn("text-[10px] uppercase tracking-wider", src.tone)}>{src.label}</Badge>
        <h3 className="flex-1 font-semibold text-foreground leading-tight">{spot.name}</h3>
        {spot.rating ? (
          <span className="inline-flex items-center gap-0.5 text-xs text-muted-foreground shrink-0">
            <Star className="w-3 h-3 fill-current text-amber-500" />
            <span className="font-semibold text-foreground">{spot.rating.toFixed(1)}</span>
          </span>
        ) : null}
      </header>

      <p className="text-xs text-muted-foreground flex items-center gap-1 flex-wrap">
        <MapPin className="w-3 h-3 shrink-0" />
        <span>
          {[spot.neighborhood, spot.city].filter(Boolean).join(" · ")}
          {spot.distanceMi != null && (
            <>
              {" · "}
              <span className="font-medium text-foreground">{spot.distanceMi.toFixed(1)} mi</span>
            </>
          )}
          {spot.reviewCount ? <> · {spot.reviewCount} reviews</> : null}
        </span>
      </p>

      {spot.vibe && (
        <p className="text-sm text-foreground/80 italic mt-2 line-clamp-2">"{spot.vibe}"</p>
      )}

      {spot.vibeTags.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {spot.vibeTags
            .filter((t) => !t.startsWith("community:"))
            .slice(0, 4)
            .map((t) => (
              <span
                key={t}
                className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-accent/10 text-accent border border-accent/20"
              >
                {VIBE_LABELS[t] || t.replace(/[-_]/g, " ")}
              </span>
            ))}
        </div>
      )}

      {(spot.watchingCount > 0 || matchedFriends.length > 0) && (
        <div className="mt-3 pt-3 border-t border-border/40 flex items-center gap-2 text-xs">
          {spot.watchingCount > 0 && (
            <span className="inline-flex items-center gap-1 font-semibold text-foreground">
              <Users className="w-3 h-3 text-primary" />
              {spot.watchingCount} watching
            </span>
          )}
          {matchedFriends.length > 0 && (
            <span className="text-muted-foreground">
              · {matchedFriends[0].name?.split(" ")[0] || "Friend"}
              {matchedFriends.length > 1 ? ` + ${matchedFriends.length - 1}` : ""} going
            </span>
          )}
        </div>
      )}

      <div className="mt-3 flex flex-wrap gap-2">
        <Button
          size="sm"
          variant={isPicked ? "secondary" : "default"}
          onClick={handleCheckIn}
          disabled={busy}
          className="min-h-[40px] flex-1 min-w-[140px]"
        >
          {isPicked ? (
            <>
              <Check className="w-4 h-4 mr-1" /> You're here
            </>
          ) : (
            <>
              <Tv className="w-4 h-4 mr-1" /> I'm watching here
            </>
          )}
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => setSaved((s) => !s)}
          className="min-h-[40px]"
          aria-label={saved ? "Unsave" : "Save"}
        >
          <Bookmark className={cn("w-4 h-4", saved && "fill-current")} />
        </Button>
        <Button asChild size="sm" variant="outline" className="min-h-[40px]">
          <a href={spot.mapsUrl} target="_blank" rel="noopener noreferrer" aria-label="Open in Maps">
            <ExternalLink className="w-4 h-4" />
          </a>
        </Button>
        <Button size="sm" variant="outline" onClick={handleShare} className="min-h-[40px]" aria-label="Share">
          <Share2 className="w-4 h-4" />
        </Button>
      </div>
    </article>
  );
}

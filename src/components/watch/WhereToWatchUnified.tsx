/**
 * WhereToWatchUnified — single Where-to-Watch surface used by Events page,
 * Game Detail, and Feed cards. Pulls from a server-ranked priority pipeline
 * (official → partner → curated → community → Google Places → fallback) and
 * supports the "I'm watching here" check-in flow with friends/social proof.
 */
import { useMemo } from "react";
import { Link } from "react-router-dom";
import { AlertCircle, MapPin, RefreshCw, Sparkles, Tv } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useWatchSpots } from "./useWatchSpots";
import WatchLocationCard from "./WatchLocationCard";
import type { WatchContext } from "./types";

interface Props {
  context: WatchContext;
  variant?: "full" | "compact";
  className?: string;
  /** When set, "Open chat" CTA from the check-in toast routes here */
  chatHref?: string;
  /** URL used by the share button */
  shareUrl?: string;
}

const STATE_BANNER: Record<string, { tone: string; text: string }> = {
  "live-ok": { tone: "text-muted-foreground", text: "Watch spots near you · updated just now" },
  "places-failed-curated": {
    tone: "text-amber-600",
    text: "Live nearby search is napping — showing our trusted picks",
  },
  "no-local-suggested": {
    tone: "text-muted-foreground",
    text: "Nothing close by tonight. These spots usually pull a great women's-sports crowd.",
  },
  empty: { tone: "text-muted-foreground", text: "" },
  error: { tone: "text-destructive", text: "Couldn't load watch spots — try again in a moment." },
};

export default function WhereToWatchUnified({ context, variant = "full", className, chatHref, shareUrl }: Props) {
  const { spots, state, friends, myCheckin, refetch, checkIn, clearCheckin } = useWatchSpots(context);

  const visibleSpots = useMemo(() => (variant === "compact" ? spots.slice(0, 3) : spots), [spots, variant]);

  const pickedKey = myCheckin?.watch_location_id || myCheckin?.place_external_id || myCheckin?.place_snapshot?.name;
  const isPicked = (s: typeof spots[number]) =>
    (!!myCheckin && (
      (s.watchLocationId && s.watchLocationId === myCheckin.watch_location_id) ||
      (s.placeExternalId && s.placeExternalId === myCheckin.place_external_id) ||
      (myCheckin.place_snapshot?.name && s.name.toLowerCase() === myCheckin.place_snapshot.name.toLowerCase())
    )) || false;

  const banner = STATE_BANNER[state];

  return (
    <Card className={className}>
      <CardHeader className="pb-3 flex flex-row items-center justify-between gap-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Tv className="w-4 h-4 text-primary" />
          Where to Watch
        </CardTitle>
        {variant === "compact" && spots.length > 3 && (
          <Button asChild variant="ghost" size="sm" className="h-7 text-xs">
            <Link to={context.kind === "game" && context.externalGameId ? `/game/${context.externalGameId}` : "/events"}>
              See all
            </Link>
          </Button>
        )}
      </CardHeader>
      <CardContent className="pt-0 space-y-3">
        {banner.text && <p className={`text-xs ${banner.tone}`}>{banner.text}</p>}

        {/* My pick pill */}
        {myCheckin && (
          <div className="rounded-xl border border-primary/40 bg-primary/5 p-3 flex items-center gap-3">
            <span className="w-9 h-9 rounded-full bg-primary/20 text-primary flex items-center justify-center shrink-0">
              <Tv className="w-4 h-4" />
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-xs uppercase tracking-wider text-primary font-bold">You're watching</p>
              <p className="text-sm font-semibold truncate">{myCheckin.place_snapshot?.name}</p>
            </div>
            {chatHref && (
              <Button asChild size="sm" variant="default" className="min-h-[36px]">
                <Link to={chatHref}>Chat</Link>
              </Button>
            )}
            <Button size="sm" variant="ghost" onClick={clearCheckin} className="min-h-[36px]">
              Change
            </Button>
          </div>
        )}

        {/* Friends row */}
        {friends.length > 0 && (
          <p className="text-xs text-foreground/80 inline-flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-primary" />
            {friends[0].name?.split(" ")[0] || "A friend"}
            {friends.length > 1 ? ` + ${friends.length - 1} friend${friends.length > 2 ? "s" : ""}` : ""} watching nearby
          </p>
        )}

        {/* States */}
        {state === "loading" && (
          <>
            <p className="text-xs text-muted-foreground">Finding the best spots to catch the game…</p>
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-28 w-full rounded-2xl" />
            ))}
          </>
        )}

        {state === "error" && (
          <div className="text-center py-6">
            <AlertCircle className="w-8 h-8 mx-auto text-destructive/70 mb-2" />
            <Button size="sm" variant="outline" onClick={() => refetch()}>
              <RefreshCw className="w-3 h-3 mr-1" /> Try again
            </Button>
          </div>
        )}

        {state !== "loading" && state !== "error" && visibleSpots.length === 0 && (
          <div className="text-center py-8 px-4">
            <Tv className="w-10 h-10 text-primary/40 mx-auto mb-3" />
            <p className="text-sm font-semibold mb-1">No watch spots pinned yet</p>
            <p className="text-xs text-muted-foreground mb-4">
              Be the first to check in — your friends will see where you're watching.
            </p>
            <Button asChild size="sm" variant="outline">
              <Link to="/events">Browse local events</Link>
            </Button>
          </div>
        )}

        {visibleSpots.length > 0 && (
          <div className="space-y-3">
            {visibleSpots.map((s) => (
              <WatchLocationCard
                key={s.id}
                spot={s}
                isPicked={isPicked(s)}
                friends={friends}
                onCheckIn={checkIn}
                onOpenChat={chatHref ? () => { window.location.href = chatHref; } : undefined}
                shareUrl={shareUrl}
              />
            ))}
          </div>
        )}

        {visibleSpots.length > 0 && spots.some((s) => s.watchingCount === 0) && !myCheckin && friends.length === 0 && (
          <p className="text-[11px] text-muted-foreground text-center pt-1">
            Nobody's checked in yet — be the first and your friends will see you here.
          </p>
        )}

        <div className="flex items-center justify-between pt-1 text-[10px] text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <MapPin className="w-3 h-3" />
            {context.city || "Near you"}
          </span>
          <span>Sources: Loverball + community + Google</span>
        </div>
      </CardContent>
    </Card>
  );
}

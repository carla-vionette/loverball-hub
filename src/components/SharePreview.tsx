import { Card } from "@/components/ui/card";
import { ExternalLink, Calendar, MapPin, Clock } from "lucide-react";

interface SharePreviewProps {
  title: string;
  description: string;
  imageUrl?: string | null;
  siteName?: string;
  eventDate?: string;
  eventTime?: string | null;
  venue?: string | null;
  city?: string | null;
}

const SharePreview = ({
  title,
  description,
  imageUrl,
  siteName = "loverball.com",
  eventDate,
  eventTime,
  venue,
  city,
}: SharePreviewProps) => {
  const locStr = [venue, city].filter(Boolean).join(", ");

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        This is how your event will appear when shared:
      </p>

      {/* Social Media Preview Card */}
      <Card className="overflow-hidden border border-border/50 bg-card max-w-sm mx-auto">
        {/* Image */}
        <div className="relative aspect-[1.91/1] bg-muted">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-accent/20">
              <span className="text-4xl font-bold text-primary/30">LB</span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-3 space-y-2">
          <p className="text-xs text-muted-foreground uppercase tracking-wide flex items-center gap-1">
            <ExternalLink className="w-3 h-3" />
            {siteName}
          </p>
          <h3 className="font-semibold text-sm leading-snug text-foreground">
            {title}
          </h3>

          {/* Structured meta lines */}
          {(eventDate || eventTime || locStr) && (
            <div className="space-y-0.5">
              {(eventDate || eventTime) && (
                <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <Calendar className="w-3 h-3 shrink-0" />
                  <span>
                    {eventDate}
                    {eventTime ? ` @ ${eventTime}` : ""}
                  </span>
                </p>
              )}
              {locStr && (
                <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <MapPin className="w-3 h-3 shrink-0" />
                  <span>{locStr}</span>
                </p>
              )}
            </div>
          )}

          {/* Description */}
          {description && (
            <p
              className="text-xs text-muted-foreground line-clamp-2"
              style={{ whiteSpace: "pre-line" }}
            >
              {description}
            </p>
          )}
        </div>
      </Card>
    </div>
  );
};

export default SharePreview;


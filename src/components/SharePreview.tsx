import { Card } from "@/components/ui/card";
import { ExternalLink } from "lucide-react";

interface SharePreviewProps {
  title: string;
  description: string;
  imageUrl?: string | null;
  siteName?: string;
}

const SharePreview = ({ 
  title, 
  description, 
  imageUrl, 
  siteName = "loverball-hub.lovable.app" 
}: SharePreviewProps) => {
  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        This is how your event will appear when shared on social media:
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
        <div className="p-3 space-y-1">
          <p className="text-xs text-muted-foreground uppercase tracking-wide flex items-center gap-1">
            <ExternalLink className="w-3 h-3" />
            {siteName}
          </p>
          <h3 className="font-semibold text-sm line-clamp-2 text-foreground">
            {title}
          </h3>
          <p className="text-xs text-muted-foreground line-clamp-2">
            {description}
          </p>
        </div>
      </Card>
      
    </div>
  );
};

export default SharePreview;

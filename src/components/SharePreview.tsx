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
      
      {/* Platform Examples */}
      <div className="flex justify-center gap-6 pt-2">
        <div className="text-center">
          <div className="w-8 h-8 rounded-full bg-[#1877F2] flex items-center justify-center mx-auto mb-1">
            <span className="text-white text-xs font-bold">f</span>
          </div>
          <p className="text-[10px] text-muted-foreground">Facebook</p>
        </div>
        <div className="text-center">
          <div className="w-8 h-8 rounded-full bg-black flex items-center justify-center mx-auto mb-1">
            <span className="text-white text-xs font-bold">𝕏</span>
          </div>
          <p className="text-[10px] text-muted-foreground">X/Twitter</p>
        </div>
        <div className="text-center">
          <div className="w-8 h-8 rounded-full bg-[#0A66C2] flex items-center justify-center mx-auto mb-1">
            <span className="text-white text-xs font-bold">in</span>
          </div>
          <p className="text-[10px] text-muted-foreground">LinkedIn</p>
        </div>
        <div className="text-center">
          <div className="w-8 h-8 rounded-full bg-[#25D366] flex items-center justify-center mx-auto mb-1">
            <span className="text-white text-xs font-bold">W</span>
          </div>
          <p className="text-[10px] text-muted-foreground">WhatsApp</p>
        </div>
      </div>
    </div>
  );
};

export default SharePreview;

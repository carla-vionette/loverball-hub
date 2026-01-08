import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { X, Heart, MapPin, Briefcase, Instagram, Linkedin, Globe } from "lucide-react";

interface MemberCardProps {
  profile: {
    id: string;
    name: string;
    pronouns?: string | null;
    city?: string | null;
    bio?: string | null;
    profile_photo_url?: string | null;
    primary_role?: string | null;
    industries?: string[] | null;
    looking_for_tags?: string[] | null;
    favorite_la_teams?: string[] | null;
    interested_in_world_cup_la?: boolean | null;
    interested_in_la28?: boolean | null;
    instagram_url?: string | null;
    linkedin_url?: string | null;
    website_url?: string | null;
  };
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
}

const MemberCard = ({ profile, onSwipeLeft, onSwipeRight }: MemberCardProps) => {
  return (
    <div className="relative w-full h-full flex flex-col bg-card rounded-2xl overflow-hidden shadow-xl">
      {/* Photo Section */}
      <div className="relative h-1/2 bg-muted">
        {profile.profile_photo_url ? (
          <img 
            src={profile.profile_photo_url} 
            alt={profile.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-accent/20">
            <span className="text-8xl font-bold text-primary/30">
              {profile.name.charAt(0).toUpperCase()}
            </span>
          </div>
        )}
        
        {/* Social Links */}
        <div className="absolute top-4 right-4 flex gap-2">
          {profile.instagram_url && (
            <a 
              href={profile.instagram_url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="p-2 bg-black/50 rounded-full text-white hover:bg-black/70 transition"
            >
              <Instagram className="w-5 h-5" />
            </a>
          )}
          {profile.linkedin_url && (
            <a 
              href={profile.linkedin_url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="p-2 bg-black/50 rounded-full text-white hover:bg-black/70 transition"
            >
              <Linkedin className="w-5 h-5" />
            </a>
          )}
          {profile.website_url && (
            <a 
              href={profile.website_url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="p-2 bg-black/50 rounded-full text-white hover:bg-black/70 transition"
            >
              <Globe className="w-5 h-5" />
            </a>
          )}
        </div>
      </div>
      
      {/* Info Section */}
      <div className="flex-1 p-6 overflow-y-auto">
        <div className="flex items-center gap-2 mb-2">
          <h2 className="text-2xl font-bold text-foreground">{profile.name}</h2>
          {profile.pronouns && (
            <span className="text-muted-foreground text-sm">({profile.pronouns})</span>
          )}
        </div>
        
        <div className="flex flex-wrap items-center gap-3 mb-4 text-sm text-muted-foreground">
          {profile.city && (
            <span className="flex items-center gap-1">
              <MapPin className="w-4 h-4" />
              {profile.city}
            </span>
          )}
          {profile.primary_role && (
            <span className="flex items-center gap-1">
              <Briefcase className="w-4 h-4" />
              {profile.primary_role}
            </span>
          )}
        </div>
        
        {profile.bio && (
          <p className="text-foreground mb-4 line-clamp-3">{profile.bio}</p>
        )}
        
        {/* Industries */}
        {profile.industries && profile.industries.length > 0 && (
          <div className="mb-3">
            <p className="text-xs text-muted-foreground mb-1">Industries</p>
            <div className="flex flex-wrap gap-1">
              {profile.industries.slice(0, 3).map((industry) => (
                <Badge key={industry} variant="secondary" className="text-xs">
                  {industry}
                </Badge>
              ))}
            </div>
          </div>
        )}
        
        {/* Looking For */}
        {profile.looking_for_tags && profile.looking_for_tags.length > 0 && (
          <div className="mb-3">
            <p className="text-xs text-muted-foreground mb-1">Looking for</p>
            <div className="flex flex-wrap gap-1">
              {profile.looking_for_tags.slice(0, 4).map((tag) => (
                <Badge key={tag} variant="outline" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        )}
        
        {/* Teams */}
        {profile.favorite_la_teams && profile.favorite_la_teams.length > 0 && (
          <div className="mb-3">
            <p className="text-xs text-muted-foreground mb-1">Favorite LA Teams</p>
            <div className="flex flex-wrap gap-1">
              {profile.favorite_la_teams.slice(0, 4).map((team) => (
                <Badge key={team} className="text-xs bg-primary/10 text-primary border-primary/20">
                  {team}
                </Badge>
              ))}
            </div>
          </div>
        )}
        
        {/* Event Interests */}
        <div className="flex gap-2">
          {profile.interested_in_world_cup_la && (
            <Badge className="text-xs bg-accent/20 text-accent-foreground">
              ⚽ World Cup LA
            </Badge>
          )}
          {profile.interested_in_la28 && (
            <Badge className="text-xs bg-accent/20 text-accent-foreground">
              🏅 LA28
            </Badge>
          )}
        </div>
      </div>
      
      {/* Action Buttons */}
      <div className="p-6 pt-0 flex justify-center gap-8">
        <Button
          onClick={onSwipeLeft}
          size="lg"
          variant="outline"
          className="w-16 h-16 rounded-full border-2 border-muted-foreground/30 hover:border-destructive hover:bg-destructive/10"
        >
          <X className="w-8 h-8 text-muted-foreground" />
        </Button>
        <Button
          onClick={onSwipeRight}
          size="lg"
          className="w-16 h-16 rounded-full bg-primary hover:bg-primary/90"
        >
          <Heart className="w-8 h-8 text-white" />
        </Button>
      </div>
    </div>
  );
};

export default MemberCard;

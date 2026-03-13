import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import BottomNav from '@/components/BottomNav';
import DesktopNav from '@/components/DesktopNav';
import MobileHeader from '@/components/MobileHeader';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { fetchProfileById } from '@/lib/profileApi';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useFollow } from '@/hooks/useFollow';
import FollowButton from '@/components/FollowButton';
import { Loader2, MapPin, Briefcase, Instagram, Linkedin, Globe, ArrowLeft, MessageCircle } from 'lucide-react';

interface MemberProfileData {
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
}

const MemberProfile = () => {
  const { id } = useParams<{ id: string }>();
  const [profile, setProfile] = useState<MemberProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const { user, isMember } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isMember) {
      navigate('/invite');
      return;
    }

    const fetchData = async () => {
      if (!id || !user) return;

      try {
        const { data, error, rateLimited } = await fetchProfileById(id);

        if (error) {
          if (rateLimited) {
            toast({
              title: 'Rate limit exceeded',
              description: 'Please try again later.',
              variant: 'destructive',
            });
          }
          throw new Error(error);
        }
        setProfile(data);
      } catch (error) {
        // Profile fetch error handled silently
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, user, isMember, navigate]);

  const hasSocialLinks = profile?.instagram_url || profile?.linkedin_url || profile?.website_url;

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Profile not found</h2>
          <Button onClick={() => navigate('/members')}>Back to Members</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <MobileHeader />
      <DesktopNav />
      <BottomNav />
      
      <main className="md:ml-64 pt-16 md:pt-0 pb-20 md:pb-0">
        <div className="container mx-auto px-4 py-6 max-w-2xl">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>

          <Card className="overflow-hidden">
            <div className="relative h-64 bg-gradient-to-br from-primary/20 to-accent/20">
              {profile.profile_photo_url ? (
                <img 
                  src={profile.profile_photo_url} 
                  alt={profile.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="text-9xl font-bold text-primary/30">
                    {profile.name.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}

              {hasSocialLinks && (
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
              )}
            </div>

            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-2">
                <h1 className="text-2xl font-bold">{profile.name}</h1>
                {profile.pronouns && (
                  <span className="text-muted-foreground">({profile.pronouns})</span>
                )}
              </div>

              {/* Follower/Following Counts + Follow/DM buttons */}
              <FollowStats profileId={id!} />

              <div className="flex flex-wrap items-center gap-4 mb-4 text-muted-foreground">
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
                <p className="text-foreground mb-6">{profile.bio}</p>
              )}

              {profile.industries && profile.industries.length > 0 && (
                <div className="mb-4">
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">Industries</h3>
                  <div className="flex flex-wrap gap-2">
                    {profile.industries.map((industry) => (
                      <Badge key={industry} variant="secondary">{industry}</Badge>
                    ))}
                  </div>
                </div>
              )}

              {profile.looking_for_tags && profile.looking_for_tags.length > 0 && (
                <div className="mb-4">
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">Looking for</h3>
                  <div className="flex flex-wrap gap-2">
                    {profile.looking_for_tags.map((tag) => (
                      <Badge key={tag} variant="outline">{tag}</Badge>
                    ))}
                  </div>
                </div>
              )}

              {profile.favorite_la_teams && profile.favorite_la_teams.length > 0 && (
                <div className="mb-4">
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">Favorite LA Teams</h3>
                  <div className="flex flex-wrap gap-2">
                    {profile.favorite_la_teams.map((team) => (
                      <Badge key={team} className="bg-primary/10 text-primary border-primary/20">{team}</Badge>
                    ))}
                  </div>
                </div>
              )}

              {(profile.interested_in_world_cup_la || profile.interested_in_la28) && (
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">Interested In</h3>
                  <div className="flex gap-2">
                    {profile.interested_in_world_cup_la && (
                      <Badge className="bg-accent/20 text-accent-foreground">⚽ World Cup LA 2026</Badge>
                    )}
                    {profile.interested_in_la28 && (
                      <Badge className="bg-accent/20 text-accent-foreground">🏅 LA28 Olympics</Badge>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default MemberProfile;

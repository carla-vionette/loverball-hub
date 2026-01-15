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
import { supabase } from '@/integrations/supabase/client';
import { Loader2, MapPin, Briefcase, Instagram, Linkedin, Globe, ArrowLeft, Lock, Heart } from 'lucide-react';

interface MemberProfile {
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
  const [profile, setProfile] = useState<MemberProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isMatched, setIsMatched] = useState(false);
  const [isOwnProfile, setIsOwnProfile] = useState(false);
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

      // Check if this is the user's own profile
      if (id === user.id) {
        setIsOwnProfile(true);
      }

      // Check if matched with this profile
      const { data: matches } = await supabase
        .from('matches')
        .select('id')
        .or(`and(user_a_id.eq.${user.id},user_b_id.eq.${id}),and(user_a_id.eq.${id},user_b_id.eq.${user.id})`)
        .eq('status', 'active')
        .limit(1);

      setIsMatched(matches && matches.length > 0);

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
        console.error('Error fetching profile:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, user, isMember, navigate]);

  // Check if social links are hidden (not matched and not own profile)
  const socialLinksHidden = !isOwnProfile && !isMatched && !profile?.instagram_url && !profile?.linkedin_url && !profile?.website_url;
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
            {/* Cover/Photo */}
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

              {/* Social Links - only shown if available (edge function filters by match status) */}
              {hasSocialLinks ? (
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
              ) : !isOwnProfile && !isMatched ? (
                <div className="absolute top-4 right-4">
                  <div className="flex items-center gap-2 px-3 py-2 bg-black/60 backdrop-blur-sm rounded-full text-white text-sm">
                    <Lock className="w-4 h-4" />
                    <span>Connect to see full profile</span>
                  </div>
                </div>
              ) : null}
            </div>

            <CardContent className="p-6">
              {/* Connect prompt banner for non-matched profiles */}
              {!isOwnProfile && !isMatched && (
                <div className="mb-6 p-4 rounded-xl bg-primary/10 border border-primary/20 flex items-center gap-3">
                  <div className="p-2 rounded-full bg-primary/20">
                    <Heart className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">Want to see more?</p>
                    <p className="text-xs text-muted-foreground">Connect with {profile.name} to view their social links and full profile</p>
                  </div>
                  <Button 
                    size="sm" 
                    onClick={() => navigate('/network')}
                    className="shrink-0"
                  >
                    Go to Network
                  </Button>
                </div>
              )}

              <div className="flex items-center gap-2 mb-2">
                <h1 className="text-2xl font-bold">{profile.name}</h1>
                {profile.pronouns && (
                  <span className="text-muted-foreground">({profile.pronouns})</span>
                )}
              </div>

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

              {/* Industries */}
              {profile.industries && profile.industries.length > 0 && (
                <div className="mb-4">
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">Industries</h3>
                  <div className="flex flex-wrap gap-2">
                    {profile.industries.map((industry) => (
                      <Badge key={industry} variant="secondary">
                        {industry}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Looking For */}
              {profile.looking_for_tags && profile.looking_for_tags.length > 0 && (
                <div className="mb-4">
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">Looking for</h3>
                  <div className="flex flex-wrap gap-2">
                    {profile.looking_for_tags.map((tag) => (
                      <Badge key={tag} variant="outline">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Teams */}
              {profile.favorite_la_teams && profile.favorite_la_teams.length > 0 && (
                <div className="mb-4">
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">Favorite LA Teams</h3>
                  <div className="flex flex-wrap gap-2">
                    {profile.favorite_la_teams.map((team) => (
                      <Badge key={team} className="bg-primary/10 text-primary border-primary/20">
                        {team}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Event Interests */}
              {(profile.interested_in_world_cup_la || profile.interested_in_la28) && (
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">Interested In</h3>
                  <div className="flex gap-2">
                    {profile.interested_in_world_cup_la && (
                      <Badge className="bg-accent/20 text-accent-foreground">
                        ⚽ World Cup LA 2026
                      </Badge>
                    )}
                    {profile.interested_in_la28 && (
                      <Badge className="bg-accent/20 text-accent-foreground">
                        🏅 LA28 Olympics
                      </Badge>
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

import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import BottomNav from '@/components/BottomNav';
import Seo from '@/components/Seo';
import MemberCard from '@/components/MemberCard';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { fetchProfilesByIds } from '@/lib/profileApi';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Users, PartyPopper, Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import PageError from '@/components/PageError';
import PageSkeleton from '@/components/PageSkeleton';
import { trackConnectionAction } from '@/lib/analytics';

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

const Members = () => {
  const [profiles, setProfiles] = useState<MemberProfile[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [newMatch, setNewMatch] = useState<MemberProfile | null>(null);
  const { user, isMember } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const fetchProfiles = useCallback(async () => {
    if (!user) return;

    try {
      setFetchError(null);
      const { data: swipedIds } = await supabase
        .from('swipes')
        .select('target_user_id')
        .eq('swiper_id', user.id);

      // Get profiles that haven't been swiped yet
      const swipedUserIds = swipedIds?.map(s => s.target_user_id) || [];

      // Get member user IDs
      const { data: memberRoles } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'member');

      const memberIds = memberRoles?.map(r => r.user_id) || [];

      // Get profiles of members using rate-limited API
      const { data: profilesData, error, rateLimited } = await fetchProfilesByIds(memberIds);

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

      // Filter out swiped users client-side (safer than SQL string concatenation)
      const filteredProfiles = (profilesData || []).filter(
        (p: any) => !swipedUserIds.includes(p.id)
      );

      // Shuffle profiles for variety
      const shuffled = filteredProfiles.sort(() => Math.random() - 0.5);
      setProfiles(shuffled);
    } catch (error: any) {
      setFetchError(error?.message || 'Failed to load profiles');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!isMember) {
      navigate('/invite');
      return;
    }
    fetchProfiles();
  }, [isMember, fetchProfiles, navigate]);

  const handleSwipe = async (direction: 'left' | 'right') => {
    if (!user || !profiles[currentIndex]) return;

    const targetProfile = profiles[currentIndex];

    try {
      // Record the swipe
      const { error: swipeError } = await supabase
        .from('swipes')
        .insert({
          swiper_id: user.id,
          target_user_id: targetProfile.id,
          direction,
        });

      if (swipeError) throw swipeError;
      trackConnectionAction(direction === 'right' ? 'request' : 'reject', targetProfile.id);

      // Check if it's a match (the trigger handles this, but we check for UI)
      if (direction === 'right') {
        const { data: mutualSwipe } = await supabase
          .from('swipes')
          .select('*')
          .eq('swiper_id', targetProfile.id)
          .eq('target_user_id', user.id)
          .eq('direction', 'right')
          .maybeSingle();

        if (mutualSwipe) {
          setNewMatch(targetProfile);
        }
      }

      // Move to next profile
      setCurrentIndex(prev => prev + 1);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to record swipe. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const closeMatchModal = () => {
    setNewMatch(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <BottomNav />
        <main className="pb-20 md:pb-0">
          <PageSkeleton variant="cards" count={4} />
        </main>
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="min-h-screen bg-background">
        <BottomNav />
        <main className="pb-20 md:pb-0">
          <PageError
            variant={!navigator.onLine ? "network" : "generic"}
            message={fetchError}
            onRetry={() => { setLoading(true); fetchProfiles(); }}
          />
        </main>
      </div>
    );
  }

  const currentProfile = profiles[currentIndex];
  const hasMoreProfiles = currentIndex < profiles.length;

  return (
    <div className="min-h-screen bg-background">
      <Seo
        title="Club Members | Loverball"
        description="Discover and connect with women sports fans in your city. Search the Loverball member roster."
        path="/members"
      />
      <BottomNav />
      
      <main className="pb-20 md:pb-0">
        <div className="px-4 pt-2 pb-4 text-center">
          <span className="mag-eyebrow" style={{ color: "#f8f8f8" }}>The Roster</span>
          <h1 className="mag-title text-raspberry" style={{ fontSize: "clamp(48px, 14vw, 72px)", marginTop: 2 }}>
            Find your people
          </h1>
        </div>

        {/* Friend search */}
        <div className="px-4 max-w-md mx-auto">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search friends by name…"
              className="pl-10 pr-10 rounded-full bg-secondary border-border/30"
              aria-label="Search friends"
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-muted"
                aria-label="Clear search"
              >
                <X className="w-3.5 h-3.5 text-muted-foreground" />
              </button>
            )}
          </div>
          {query.trim().length > 0 && (
            <div className="mt-2 bg-card border border-border/30 rounded-2xl overflow-hidden divide-y divide-border/20">
              {profiles
                .filter((p) => p.name?.toLowerCase().includes(query.trim().toLowerCase()))
                .slice(0, 8)
                .map((p) => (
                  <button
                    key={p.id}
                    onClick={() => navigate(`/profile/${p.id}`)}
                    className="w-full flex items-center gap-3 p-3 hover:bg-muted/50 text-left"
                  >
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={p.profile_photo_url || undefined} />
                      <AvatarFallback className="bg-primary/10 text-primary text-sm">
                        {p.name?.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold truncate">{p.name}</p>
                      {p.city && <p className="text-xs text-muted-foreground truncate">{p.city}</p>}
                    </div>
                  </button>
                ))}
              {profiles.filter((p) => p.name?.toLowerCase().includes(query.trim().toLowerCase())).length === 0 && (
                <p className="p-4 text-center text-xs text-muted-foreground">No members match "{query}".</p>
              )}
            </div>
          )}
        </div>

        <div className="h-[calc(100vh-12rem)] md:h-screen flex items-center justify-center p-4">
          {hasMoreProfiles && currentProfile ? (
            <div className="w-full max-w-md h-[calc(100vh-8rem)] md:h-[calc(100vh-4rem)]">
              <MemberCard
                profile={currentProfile}
                onSwipeLeft={() => handleSwipe('left')}
                onSwipeRight={() => handleSwipe('right')}
              />
            </div>
          ) : (
            <div className="text-center max-w-sm mx-auto">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-muted-foreground" />
              </div>
              <h2 className="text-2xl font-bold mb-2">You've seen everyone!</h2>
              <p className="text-muted-foreground mb-6">
                Check back later for new members joining the community.
              </p>
              <div className="flex flex-col gap-3">
                <Button onClick={() => navigate('/messages')} className="rounded-full">
                  View Your Matches
                </Button>
                <Button variant="outline" onClick={() => { setCurrentIndex(0); setLoading(true); fetchProfiles(); }} className="rounded-full">
                  Refresh
                </Button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Match Modal */}
      {newMatch && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-2xl p-8 max-w-sm text-center animate-in zoom-in-90">
            <PartyPopper className="w-16 h-16 mx-auto text-primary mb-4" />
            <h2 className="text-2xl font-bold mb-2">It's a Match!</h2>
            <p className="text-muted-foreground mb-6">
              You and {newMatch.name} have connected. Start a conversation!
            </p>
            <div className="space-y-3">
              <Button 
                className="w-full" 
                onClick={() => {
                  closeMatchModal();
                  navigate('/messages');
                }}
              >
                Send a Message
              </Button>
              <Button 
                variant="outline" 
                className="w-full"
                onClick={closeMatchModal}
              >
                Keep Swiping
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Members;

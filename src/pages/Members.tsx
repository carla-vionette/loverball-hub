import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import BottomNav from '@/components/BottomNav';
import DesktopNav from '@/components/DesktopNav';
import MobileHeader from '@/components/MobileHeader';
import MemberCard from '@/components/MemberCard';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Users, PartyPopper } from 'lucide-react';
import { Button } from '@/components/ui/button';

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
  const [newMatch, setNewMatch] = useState<MemberProfile | null>(null);
  const { user, isMember } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const fetchProfiles = useCallback(async () => {
    if (!user) return;

    try {
      // Get profiles that haven't been swiped yet
      const { data: swipedIds } = await supabase
        .from('swipes')
        .select('target_user_id')
        .eq('swiper_id', user.id);

      const swipedUserIds = swipedIds?.map(s => s.target_user_id) || [];
      swipedUserIds.push(user.id); // Exclude self

      // Get member user IDs
      const { data: memberRoles } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'member');

      const memberIds = memberRoles?.map(r => r.user_id) || [];

      // Get profiles of members not yet swiped
      const { data: profilesData, error } = await supabase
        .from('profiles')
        .select('*')
        .in('id', memberIds)
        .not('id', 'in', `(${swipedUserIds.join(',')})`);

      if (error) throw error;

      // Shuffle profiles for variety
      const shuffled = (profilesData || []).sort(() => Math.random() - 0.5);
      setProfiles(shuffled);
    } catch (error) {
      console.error('Error fetching profiles:', error);
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
      console.error('Error recording swipe:', error);
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
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const currentProfile = profiles[currentIndex];
  const hasMoreProfiles = currentIndex < profiles.length;

  return (
    <div className="min-h-screen bg-background">
      <MobileHeader />
      <DesktopNav />
      <BottomNav />
      
      <main className="md:ml-64 pt-16 md:pt-0 pb-20 md:pb-0">
        <div className="h-[calc(100vh-4rem)] md:h-screen flex items-center justify-center p-4">
          {hasMoreProfiles && currentProfile ? (
            <div className="w-full max-w-md h-[calc(100vh-8rem)] md:h-[calc(100vh-4rem)]">
              <MemberCard
                profile={currentProfile}
                onSwipeLeft={() => handleSwipe('left')}
                onSwipeRight={() => handleSwipe('right')}
              />
            </div>
          ) : (
            <div className="text-center">
              <Users className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <h2 className="text-2xl font-bold mb-2">You've seen everyone!</h2>
              <p className="text-muted-foreground mb-6">
                Check back later for new members joining the community.
              </p>
              <Button onClick={() => navigate('/messages')}>
                View Your Matches
              </Button>
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

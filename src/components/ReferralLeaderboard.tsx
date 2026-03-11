import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2, Trophy } from 'lucide-react';
import { fetchLeaderboard } from '@/services/inviteService';
import InviteBadge from '@/components/InviteBadge';
import type { Invite } from '@/types';

type LeaderboardEntry = Invite & { profile?: { name: string; profile_photo_url: string | null } };

const ReferralLeaderboard = () => {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeaderboard()
      .then(setEntries)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  const topEntries = entries.filter(e => e.signup_count > 0);

  if (topEntries.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="w-5 h-5" /> Referral Leaderboard
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm text-center py-4">
            No referrals yet. Be the first to invite friends!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="w-5 h-5" /> Referral Leaderboard
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {topEntries.map((entry, index) => (
            <div
              key={entry.id}
              className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50"
            >
              <span className={`w-6 text-center font-bold text-sm ${index < 3 ? 'text-primary' : 'text-muted-foreground'}`}>
                {index + 1}
              </span>
              <Avatar className="w-8 h-8">
                <AvatarImage src={entry.profile?.profile_photo_url || undefined} />
                <AvatarFallback className="bg-primary/10 text-primary text-xs">
                  {entry.profile?.name?.charAt(0)?.toUpperCase() || '?'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm truncate">
                  {entry.profile?.name || 'Member'}
                </p>
              </div>
              <InviteBadge count={entry.signup_count} size="sm" />
              <span className="font-bold text-sm tabular-nums">{entry.signup_count}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default ReferralLeaderboard;

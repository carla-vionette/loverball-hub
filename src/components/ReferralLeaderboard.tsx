import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getInviteBadge } from '@/services/inviteService';
import type { LeaderboardEntry } from '@/types';

interface ReferralLeaderboardProps {
  entries: LeaderboardEntry[];
}

const ReferralLeaderboard = ({ entries }: ReferralLeaderboardProps) => {
  if (entries.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="font-display text-lg uppercase">Referral Leaderboard</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm text-center py-6">
            No referrals yet. Be the first to invite friends!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-display text-lg uppercase">Referral Leaderboard</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y divide-border">
          {entries.map((entry, idx) => {
            const badge = getInviteBadge(entry.signup_count);
            return (
              <div key={entry.inviter_id} className="flex items-center gap-4 px-6 py-3">
                <span className={`font-display text-xl font-bold w-8 text-center ${idx < 3 ? 'text-primary' : 'text-muted-foreground'}`}>
                  {idx + 1}
                </span>
                <Avatar className="w-8 h-8">
                  <AvatarImage src={entry.inviter_photo || undefined} />
                  <AvatarFallback className="text-xs">
                    {(entry.inviter_name || '?').charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">{entry.inviter_name || 'Anonymous'}</p>
                  {badge && (
                    <span className="text-xs text-muted-foreground">
                      {badge.emoji} {badge.label}
                    </span>
                  )}
                </div>
                <span className="font-display text-lg font-bold tabular-nums">{entry.signup_count}</span>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default ReferralLeaderboard;

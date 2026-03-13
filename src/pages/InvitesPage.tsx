import { useState, useEffect } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Copy, Mail, Share2, Check } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { getUserInvite, getLeaderboard, getInviteLink, getInviteBadge } from '@/services/inviteService';
import { useToast } from '@/hooks/use-toast';
import ReferralLeaderboard from '@/components/ReferralLeaderboard';
import InviteBadge from '@/components/InviteBadge';
import type { Invite, LeaderboardEntry } from '@/types';

const InvitesPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [invite, setInvite] = useState<Invite | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      getUserInvite(user.id),
      getLeaderboard(),
    ])
      .then(([inv, lb]) => {
        setInvite(inv);
        setLeaderboard(lb);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user]);

  const inviteLink = invite ? getInviteLink(invite.invite_code) : '';
  const badge = invite ? getInviteBadge(invite.signup_count) : null;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    toast({ title: 'Link copied!' });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleEmail = () => {
    const subject = encodeURIComponent('Join me on Loverball!');
    const body = encodeURIComponent(`Hey! Join me on Loverball, the sports community for women.\n\n${inviteLink}`);
    window.open(`mailto:?subject=${subject}&body=${body}`);
  };

  const handleTwitter = () => {
    const text = encodeURIComponent(`Join me on @loverball! The sports community for women who love the game. ${inviteLink}`);
    window.open(`https://twitter.com/intent/tweet?text=${text}`);
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <h1 className="font-display text-3xl font-black uppercase tracking-tight mb-8">
          Invite Friends
        </h1>

        {/* Invite Link Card */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Your Invite Link</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 mb-4">
              <div className="flex-1 bg-secondary rounded-lg px-4 py-2.5 text-sm font-mono truncate">
                {inviteLink || 'No invite code found'}
              </div>
              <Button onClick={handleCopy} disabled={!inviteLink} size="sm">
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleCopy} disabled={!inviteLink}>
                <Copy className="w-4 h-4 mr-1" /> Copy Link
              </Button>
              <Button variant="outline" size="sm" onClick={handleEmail} disabled={!inviteLink}>
                <Mail className="w-4 h-4 mr-1" /> Email
              </Button>
              <Button variant="outline" size="sm" onClick={handleTwitter} disabled={!inviteLink}>
                <Share2 className="w-4 h-4 mr-1" /> X/Twitter
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Stats Card */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardContent className="p-5 text-center">
              <p className="text-3xl font-bold font-display">{invite?.signup_count || 0}</p>
              <p className="text-sm text-muted-foreground mt-1">Successful Referrals</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5 text-center">
              {badge ? (
                <InviteBadge label={badge.label} emoji={badge.emoji} />
              ) : (
                <p className="text-sm text-muted-foreground">Invite 5 friends to earn your first badge!</p>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5 text-center">
              <p className="text-3xl font-bold font-display">
                {invite ? `#${leaderboard.findIndex(e => e.inviter_id === invite.inviter_id) + 1 || '-'}` : '-'}
              </p>
              <p className="text-sm text-muted-foreground mt-1">Your Rank</p>
            </CardContent>
          </Card>
        </div>

        {/* Leaderboard */}
        <ReferralLeaderboard entries={leaderboard} />
      </div>
    </AppLayout>
  );
};

export default InvitesPage;

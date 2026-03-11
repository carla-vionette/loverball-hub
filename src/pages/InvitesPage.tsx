import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import AppLayout from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Copy, Mail, Share2, Users } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { fetchUserInvite, getInviteUrl } from '@/services/inviteService';
import ReferralLeaderboard from '@/components/ReferralLeaderboard';
import InviteBadge from '@/components/InviteBadge';
import type { Invite } from '@/types';

const InvitesPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [invite, setInvite] = useState<Invite | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchUserInvite(user.id)
        .then(setInvite)
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [user]);

  const inviteUrl = invite ? getInviteUrl(invite.invite_code) : '';

  const copyLink = () => {
    navigator.clipboard.writeText(inviteUrl);
    toast({ title: 'Invite link copied!' });
  };

  const shareEmail = () => {
    const subject = encodeURIComponent('Join me on Loverball!');
    const body = encodeURIComponent(`Hey! Join Loverball — the platform for women who love sports.\n\n${inviteUrl}`);
    window.open(`mailto:?subject=${subject}&body=${body}`);
  };

  const shareTwitter = () => {
    const text = encodeURIComponent(`Join me on @Loverball — the platform for women who love sports! ${inviteUrl}`);
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
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <h1 className="font-display text-3xl font-black uppercase tracking-tight mb-8">
          Invite Friends
        </h1>

        {/* Invite Link Card */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Share2 className="w-5 h-5" />
              Your Invite Link
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input value={inviteUrl} readOnly className="font-mono text-sm" />
              <Button onClick={copyLink} variant="outline">
                <Copy className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex gap-2">
              <Button onClick={copyLink} variant="outline" className="flex-1">
                <Copy className="w-4 h-4 mr-2" /> Copy
              </Button>
              <Button onClick={shareEmail} variant="outline" className="flex-1">
                <Mail className="w-4 h-4 mr-2" /> Email
              </Button>
              <Button onClick={shareTwitter} variant="outline" className="flex-1">
                Share on X
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Your Stats
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-8">
              <div>
                <p className="font-display text-4xl font-bold text-primary">
                  {invite?.signup_count || 0}
                </p>
                <p className="text-sm text-muted-foreground">Successful Referrals</p>
              </div>
              <InviteBadge count={invite?.signup_count || 0} />
            </div>
          </CardContent>
        </Card>

        {/* Leaderboard */}
        <ReferralLeaderboard />
      </div>
    </AppLayout>
  );
};

export default InvitesPage;

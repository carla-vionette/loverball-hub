import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import loverballLogo from '@/assets/loverball-logo-new.png';
import { Loader2, Ticket } from 'lucide-react';

const Invite = () => {
  const [inviteCode, setInviteCode] = useState('');
  const [loading, setLoading] = useState(false);
  const { user, refreshRole } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSubmitCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      navigate('/auth');
      return;
    }

    setLoading(true);

    try {
      // Check if invite code is valid
      const { data: invite, error: fetchError } = await supabase
        .from('invites')
        .select('*')
        .eq('code', inviteCode.toUpperCase().trim())
        .maybeSingle();

      if (fetchError) throw fetchError;

      if (!invite) {
        toast({
          title: 'Invalid code',
          description: 'This invite code does not exist.',
          variant: 'destructive',
        });
        setLoading(false);
        return;
      }

      // Check if code is expired
      if (invite.expires_at && new Date(invite.expires_at) < new Date()) {
        toast({
          title: 'Code expired',
          description: 'This invite code has expired.',
          variant: 'destructive',
        });
        setLoading(false);
        return;
      }

      // Check if code has uses remaining
      if (invite.max_uses && invite.used_count >= invite.max_uses) {
        toast({
          title: 'Code exhausted',
          description: 'This invite code has reached its maximum uses.',
          variant: 'destructive',
        });
        setLoading(false);
        return;
      }

      // Update invite used count
      await supabase
        .from('invites')
        .update({ used_count: invite.used_count + 1 })
        .eq('id', invite.id);

      // Add member role to user
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({ user_id: user.id, role: 'member' });

      if (roleError && !roleError.message.includes('duplicate')) {
        throw roleError;
      }

      toast({
        title: 'Welcome to Loverball!',
        description: 'You now have full member access.',
      });

      await refreshRole();
      navigate('/members');
    } catch (error: any) {
      console.error('Error validating invite:', error);
      toast({
        title: 'Error',
        description: error.message || 'Something went wrong.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <img 
              src={loverballLogo} 
              alt="Loverball" 
              className="h-20 object-contain"
            />
          </div>
          <CardTitle className="text-2xl">Join Loverball</CardTitle>
          <CardDescription>
            Loverball is an invite-only community. Enter your invite code to unlock full access.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmitCode} className="space-y-4">
            <div className="relative">
              <Ticket className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                placeholder="Enter invite code"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value)}
                className="pl-10 text-center text-lg tracking-wider uppercase"
                disabled={loading}
              />
            </div>
            
            <Button 
              type="submit" 
              className="w-full" 
              disabled={loading || !inviteCode.trim()}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Validating...
                </>
              ) : (
                'Submit Code'
              )}
            </Button>
          </form>
          
          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              Don't have an invite code?{' '}
              <a 
                href="https://instagram.com/loverball" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                Follow us on Instagram
              </a>
              {' '}to stay updated.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Invite;

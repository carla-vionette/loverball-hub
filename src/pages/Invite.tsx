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
      // Use the secure database function to validate and consume the invite
      const { data, error } = await supabase.rpc('validate_and_use_invite', {
        invite_code: inviteCode.trim()
      });

      if (error) throw error;

      const result = data as { success: boolean; error?: string };

      if (!result.success) {
        const errorMessages: Record<string, string> = {
          'Not authenticated': 'Please sign in first.',
          'Already a member': 'You are already a member!',
          'Invalid code': 'This invite code does not exist.',
          'Code expired': 'This invite code has expired.',
          'Code exhausted': 'This invite code has reached its maximum uses.',
        };
        
        toast({
          title: 'Unable to use code',
          description: errorMessages[result.error || ''] || result.error,
          variant: 'destructive',
        });
        setLoading(false);
        return;
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

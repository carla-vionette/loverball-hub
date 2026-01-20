import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import BottomNav from "@/components/BottomNav";
import DesktopNav from "@/components/DesktopNav";
import MobileHeader from "@/components/MobileHeader";
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Video, CheckCircle, Clock, XCircle, ArrowLeft } from 'lucide-react';

interface ExistingApplication {
  id: string;
  status: string;
  desired_channel_name: string;
  created_at: string;
}

const ApplyCreator = () => {
  const [channelName, setChannelName] = useState('');
  const [contentFocus, setContentFocus] = useState('');
  const [exampleLinks, setExampleLinks] = useState('');
  const [socialHandles, setSocialHandles] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [existingApplication, setExistingApplication] = useState<ExistingApplication | null>(null);
  const [loading, setLoading] = useState(true);
  
  const { user, isMember } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    
    if (!isMember) {
      toast({ title: 'Members only', description: 'You need to be a Loverball member to apply as a creator' });
      navigate('/');
      return;
    }
    
    checkExistingApplication();
  }, [user, isMember, navigate]);

  const checkExistingApplication = async () => {
    try {
      const { data, error } = await supabase
        .from('creator_applications')
        .select('id, status, desired_channel_name, created_at')
        .eq('applicant_user_id', user!.id)
        .in('status', ['submitted', 'under_review'])
        .maybeSingle();

      if (error) throw error;
      setExistingApplication(data);
    } catch (error) {
      console.error('Error checking application:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!channelName.trim() || !contentFocus.trim()) {
      toast({ title: 'Required fields missing', description: 'Please fill in channel name and content focus', variant: 'destructive' });
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('creator_applications')
        .insert({
          applicant_user_id: user!.id,
          desired_channel_name: channelName.trim(),
          content_focus: contentFocus.trim(),
          example_content_links: exampleLinks.trim() || null,
          social_handles: socialHandles.trim() || null,
          status: 'submitted'
        });

      if (error) throw error;

      toast({ title: 'Application submitted!', description: 'The Loverball team will review your application and get back to you.' });
      navigate('/hub');
    } catch (error: any) {
      console.error('Error submitting application:', error);
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'submitted':
        return <Clock className="w-5 h-5 text-yellow-500" />;
      case 'under_review':
        return <Clock className="w-5 h-5 text-blue-500" />;
      case 'approved':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'declined':
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <MobileHeader />
      <DesktopNav />
      <BottomNav />

      <main className="md:ml-64 pt-16 md:pt-0 pb-20 md:pb-8">
        <div className="container mx-auto px-4 py-6 max-w-2xl">
          {/* Back button */}
          <Button variant="ghost" size="sm" asChild className="mb-4">
            <Link to="/hub">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Video Hub
            </Link>
          </Button>

          <Card>
            <CardHeader className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Video className="w-8 h-8 text-primary" />
              </div>
              <CardTitle className="text-2xl">Apply to Be a Creator</CardTitle>
              <CardDescription>
                Create a Loverball channel and share your sports content with our community. Only approved creators can publish videos.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {existingApplication ? (
                <div className="text-center py-8">
                  <div className="flex items-center justify-center gap-2 mb-4">
                    {getStatusIcon(existingApplication.status)}
                    <span className="font-medium capitalize">
                      {existingApplication.status.replace('_', ' ')}
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold mb-2">
                    Application for "{existingApplication.desired_channel_name}"
                  </h3>
                  <p className="text-muted-foreground mb-6">
                    {existingApplication.status === 'submitted' && 
                      "Your application has been submitted and is awaiting review."}
                    {existingApplication.status === 'under_review' && 
                      "Your application is currently being reviewed by the Loverball team."}
                  </p>
                  <Button variant="outline" asChild>
                    <Link to="/hub">Return to Video Hub</Link>
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="channelName">Channel Name *</Label>
                    <Input
                      id="channelName"
                      placeholder="e.g., Courtside with Maya"
                      value={channelName}
                      onChange={(e) => setChannelName(e.target.value)}
                      maxLength={50}
                    />
                    <p className="text-xs text-muted-foreground">
                      This will be the name of your channel on Loverball
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="contentFocus">Content Focus *</Label>
                    <Textarea
                      id="contentFocus"
                      placeholder="What sports will you cover? What's your unique angle? (e.g., WNBA highlights, women's soccer commentary, behind-the-scenes with athletes)"
                      value={contentFocus}
                      onChange={(e) => setContentFocus(e.target.value)}
                      rows={4}
                      maxLength={500}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="exampleLinks">Links to Example Content</Label>
                    <Textarea
                      id="exampleLinks"
                      placeholder="Share links to your existing content (TikTok, Instagram, YouTube, etc.) - one per line"
                      value={exampleLinks}
                      onChange={(e) => setExampleLinks(e.target.value)}
                      rows={3}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="socialHandles">Social Media Handles</Label>
                    <Input
                      id="socialHandles"
                      placeholder="@yourhandle on TikTok, @yourhandle on Instagram"
                      value={socialHandles}
                      onChange={(e) => setSocialHandles(e.target.value)}
                    />
                  </div>

                  <Button type="submit" className="w-full" disabled={submitting}>
                    {submitting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      'Submit Application'
                    )}
                  </Button>

                  <p className="text-xs text-center text-muted-foreground">
                    By submitting, you agree to Loverball's creator guidelines. We'll review your application and email you once a decision is made.
                  </p>
                </form>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default ApplyCreator;
